import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/automations/admin-client';
import { findExistingContact, isUniqueViolation } from '@/lib/contacts/dedupe';
import { normalizePhone } from '@/lib/whatsapp/phone-utils';
import { runAutomationsForTrigger } from '@/lib/automations/engine';
import type { AutomationTriggerType } from '@/types';
import type { NormalizedEcommerceEvent } from './types';
import { ECOMMERCE_EVENT_TO_TRIGGER } from './types';

export interface ProcessEventResult {
  status: 'processed' | 'duplicate' | 'failed' | 'ignored';
  error?: string;
  contactId?: string;
  automationTrigger?: string;
}

/**
 * Core event pipeline for normalized e-commerce events:
 * 1. Checks and logs idempotency record in `ecommerce_webhook_events`
 * 2. Matches or creates contact in the account CRM
 * 3. Builds automation variables and triggers matching automations
 * 4. Updates event and store timestamps
 */
export async function processNormalizedEcommerceEvent(
  event: NormalizedEcommerceEvent,
  accountId: string
): Promise<ProcessEventResult> {
  const db = supabaseAdmin();

  // 1. Idempotency check via DB insert
  const { data: eventLog, error: logErr } = await db
    .from('ecommerce_webhook_events')
    .insert({
      account_id: accountId,
      store_id: event.store_id,
      provider: event.provider,
      provider_event_id: event.provider_event_id,
      event_type: event.event,
      payload: event.raw_event,
      status: 'pending',
    })
    .select('id')
    .single();

  if (logErr) {
    if (isUniqueViolation(logErr) || logErr.code === '23505') {
      console.log(`[ecommerce/event-processor] Duplicate event ignored: ${event.provider_event_id} (${event.event})`);
      return { status: 'duplicate' };
    }
    console.error('[ecommerce/event-processor] Error inserting webhook event log:', logErr);
  }

  const logId = eventLog?.id;

  try {
    // 2. Contact matching & creation
    let contactId: string | null = null;
    const rawPhone = event.customer.phone;
    const normalized = rawPhone ? normalizePhone(rawPhone) : null;

    if (rawPhone && normalized) {
      const existing = await findExistingContact(db, accountId, rawPhone);
      if (existing) {
        contactId = existing.id;
        // Optionally update contact name/email if missing
        const patch: Record<string, unknown> = {};
        if (!existing.name && event.customer.name) patch.name = event.customer.name;
        if (!existing.email && event.customer.email) patch.email = event.customer.email;
        if (Object.keys(patch).length > 0) {
          await db
            .from('contacts')
            .update(patch)
            .eq('id', contactId)
            .eq('account_id', accountId);
        }
      } else {
        // Create new contact
        // Look up account owner as fallback user_id for contact creation
        const { data: accountRow } = await db
          .from('accounts')
          .select('owner_user_id')
          .eq('id', accountId)
          .maybeSingle();

        const userId = accountRow?.owner_user_id;
        if (userId) {
          const { data: newContact, error: insertErr } = await db
            .from('contacts')
            .insert({
              account_id: accountId,
              user_id: userId,
              phone: rawPhone,
              name: event.customer.name || null,
              email: event.customer.email || null,
            })
            .select('id')
            .single();

          if (!insertErr && newContact) {
            contactId = newContact.id;
          }
        }
      }
    }

    // 3. Map event to AutomationTriggerType
    const triggerName = ECOMMERCE_EVENT_TO_TRIGGER[event.event];
    if (!triggerName) {
      // Unmapped event, mark processed
      if (logId) {
        await db
          .from('ecommerce_webhook_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', logId);
      }
      return { status: 'ignored' };
    }

    // 4. Build automation context & variables
    const vars: Record<string, unknown> = {
      provider: event.provider,
      store_id: event.store_id,
      // Customer variables
      'customer.id': event.customer.id || '',
      'customer.name': event.customer.name || '',
      'customer.email': event.customer.email || '',
      'customer.phone': event.customer.phone || '',
    };

    if (event.order) {
      vars['order.id'] = String(event.order.id || '');
      vars['order.number'] = String(event.order.number || '');
      vars['order.total'] = String(event.order.total ?? '');
      vars['order.subtotal'] = String(event.order.subtotal ?? '');
      vars['order.currency'] = event.order.currency || '';
      vars['order.status'] = event.order.status || '';
      vars['order.payment_status'] = event.order.payment_status || '';
      vars['order.items_count'] = String(event.order.items?.length || 0);

      // Product/first item variables
      if (event.order.items && event.order.items.length > 0) {
        const first = event.order.items[0];
        vars['product.name'] = first.name || '';
        vars['product.quantity'] = String(first.quantity || 1);
        vars['product.price'] = String(first.price || 0);
        vars['product.sku'] = first.sku || '';
      }
    }

    // Cart recovery & abandonment variables
    if (event.raw_event) {
      const raw = event.raw_event;
      const recoveryUrl = String(raw.recovery_url || raw.checkout_url || raw.cart_url || '');
      if (recoveryUrl) {
        vars['recovery_url'] = recoveryUrl;
        vars['checkout_url'] = recoveryUrl;
        vars['cart.url'] = recoveryUrl;
      }
      const cartTotal = raw.cart_total || raw.total || event.order?.total;
      if (cartTotal != null) {
        vars['cart.total'] = String(cartTotal);
      }
    }

    // Resolve or create conversation for the contact so send steps succeed immediately
    let conversationId: string | undefined;
    if (contactId) {
      const { data: conv } = await db
        .from('conversations')
        .select('id')
        .eq('account_id', accountId)
        .eq('contact_id', contactId)
        .maybeSingle();

      if (conv?.id) {
        conversationId = conv.id;
      }
    }

    // 5. Fire automations
    await runAutomationsForTrigger({
      accountId,
      triggerType: triggerName as AutomationTriggerType,
      contactId,
      context: {
        vars,
        conversation_id: conversationId,
      },
    });

    // 6. Update log and store status
    const nowIso = new Date().toISOString();
    if (logId) {
      await db
        .from('ecommerce_webhook_events')
        .update({
          status: 'processed',
          processed_at: nowIso,
        })
        .eq('id', logId);
    }

    await db
      .from('ecommerce_stores')
      .update({
        last_event_at: nowIso,
        status: 'connected',
      })
      .eq('id', event.store_id);

    return {
      status: 'processed',
      contactId: contactId || undefined,
      automationTrigger: triggerName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ecommerce/event-processor] Event processing failed:', errorMsg);

    if (logId) {
      await db
        .from('ecommerce_webhook_events')
        .update({
          status: 'failed',
          error_message: errorMsg,
          processed_at: new Date().toISOString(),
        })
        .eq('id', logId);
    }

    return {
      status: 'failed',
      error: errorMsg,
    };
  }
}
