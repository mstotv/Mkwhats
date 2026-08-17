// ============================================================
// Public-API broadcast core.
//
// Splits a broadcast into two phases so the HTTP route can persist +
// acknowledge fast and fan out afterwards (in `after()`):
//
//   createBroadcast()  — validate, resolve contacts, insert the
//                        `broadcasts` row + `broadcast_recipients`
//                        rows (status 'pending'), return a plan.
//   deliverBroadcast() — send each recipient's template via Meta
//                        or text via Evolution API, stamp each recipient
//                        row + the aggregate counts, finalize status.
//
// Recipient rows carry `whatsapp_message_id`, so the inbound webhook's
// status handler (which matches on that column) updates delivered/read
// for API broadcasts exactly as it does for dashboard ones.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

import { sendTemplateMessage } from '@/lib/whatsapp/meta-api';
import { sendEvolutionTextMessage } from '@/lib/whatsapp/evolution-api';
import { decrypt } from '@/lib/whatsapp/encryption';
import {
  sanitizePhoneForMeta,
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
} from '@/lib/whatsapp/phone-utils';
import { isMessageTemplate } from '@/lib/whatsapp/template-row-guard';
import type { MessageTemplate } from '@/types';
import { findOrCreateContact } from '@/lib/api/v1/contacts';

/** Thrown by createBroadcast on a caller-visible failure; route maps it. */
export class BroadcastError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'BroadcastError';
    this.code = code;
    this.status = status;
  }
}

export interface BroadcastRecipientInput {
  /** E.164 phone. */
  to: string;
  /** Positional body params for Meta template ({{1}}, {{2}}…). */
  params?: string[];
  /** Custom per-recipient text for Evolution API. */
  text?: string;
}

export interface CreateBroadcastParams {
  name?: string | null;
  /** Required for Meta; optional/ignored for Evolution if freeText is given. */
  templateName?: string;
  templateLanguage?: string | null;
  /** Plain text message for Evolution sends. */
  freeText?: string;
  recipients: BroadcastRecipientInput[];
}

interface PlannedRecipient {
  recipientRowId: string;
  phone: string;
  params: string[];
  text?: string;
}

export interface BroadcastPlan {
  broadcastId: string;
  connectionType: 'meta' | 'evolution';
  // Meta-specific
  templateName?: string;
  templateLanguage?: string;
  phoneNumberId?: string;
  accessToken?: string;
  templateRow?: MessageTemplate | null;
  // Evolution-specific
  evolutionInstanceName?: string;
  evolutionApiKey?: string;
  freeText?: string;

  planned: PlannedRecipient[];
  /** Phones rejected up front (invalid E.164) — counted as failed. */
  rejected: number;
}

const MAX_RECIPIENTS = 1000;

/**
 * Validate + persist a broadcast, resolving each recipient to a
 * contact. Returns a plan for {@link deliverBroadcast}. Throws
 * {@link BroadcastError} on bad input / missing config / a malformed
 * template / a DB failure — nothing is sent in this phase.
 */
export async function createBroadcast(
  db: SupabaseClient,
  accountId: string,
  auditUserId: string,
  params: CreateBroadcastParams
): Promise<BroadcastPlan> {
  const { name, templateName, freeText, recipients } = params;
  const templateLanguage = params.templateLanguage || 'en_US';

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new BroadcastError(
      'bad_request',
      "'recipients' must be a non-empty array of { to, params?, text? }",
      400
    );
  }
  if (recipients.length > MAX_RECIPIENTS) {
    throw new BroadcastError(
      'bad_request',
      `A broadcast is capped at ${MAX_RECIPIENTS} recipients per request; split larger sends`,
      400
    );
  }

  // Config resolution
  const { data: config, error: configError } = await db
    .from('whatsapp_config')
    .select('*')
    .eq('account_id', accountId)
    .single();
  if (configError || !config) {
    throw new BroadcastError(
      'whatsapp_not_configured',
      'WhatsApp not configured. Please set up your WhatsApp integration first.',
      400
    );
  }

  const connectionType: 'meta' | 'evolution' = config.connection_type === 'evolution' ? 'evolution' : 'meta';

  let accessToken = '';
  let phoneNumberId = '';
  let templateRow: MessageTemplate | null = null;
  let evolutionInstanceName = '';
  let evolutionApiKey = '';

  if (connectionType === 'evolution') {
    if (!freeText?.trim()) {
      throw new BroadcastError('bad_request', "'free_text' or recipient 'text' is required for Evolution broadcasts", 400);
    }
    if (!config.evolution_instance_name || !config.evolution_api_key) {
      throw new BroadcastError(
        'evolution_not_configured',
        'Evolution API is not fully configured for this account.',
        400
      );
    }
    evolutionInstanceName = config.evolution_instance_name;
    try {
      evolutionApiKey = decrypt(config.evolution_api_key);
    } catch {
      throw new BroadcastError('key_corrupted', 'Could not decrypt Evolution API key.', 500);
    }
  } else {
    // Meta path
    if (!templateName) {
      throw new BroadcastError('bad_request', "'template_name' is required for Meta broadcasts", 400);
    }
    phoneNumberId = config.phone_number_id;
    accessToken = decrypt(config.access_token);

    const { data: rawTemplateRow } = await db
      .from('message_templates')
      .select('*')
      .eq('account_id', accountId)
      .eq('name', templateName)
      .eq('language', templateLanguage)
      .maybeSingle();
    if (rawTemplateRow && !isMessageTemplate(rawTemplateRow)) {
      throw new BroadcastError(
        'template_malformed',
        'Template row is malformed locally — run "Sync from Meta" in Settings to repair it before broadcasting.',
        500
      );
    }
    templateRow = (rawTemplateRow as MessageTemplate | null) ?? null;
  }

  // Resolve each recipient to a contact.
  const resolved: { contactId: string; phone: string; params: string[]; text?: string }[] = [];
  let rejected = 0;
  for (const r of recipients) {
    const sanitized = sanitizePhoneForMeta(typeof r.to === 'string' ? r.to : '');
    if (!isValidE164(sanitized)) {
      rejected++;
      continue;
    }
    const { id } = await findOrCreateContact(db, accountId, auditUserId, {
      phone: sanitized,
    });
    resolved.push({
      contactId: id,
      phone: sanitized,
      params: Array.isArray(r.params)
        ? r.params.filter((p): p is string => typeof p === 'string')
        : [],
      text: typeof r.text === 'string' ? r.text : undefined,
    });
  }

  const seenContact = new Set<string>();
  const deduped = resolved.filter((r) => {
    if (seenContact.has(r.contactId)) return false;
    seenContact.add(r.contactId);
    return true;
  });

  if (deduped.length === 0) {
    throw new BroadcastError(
      'bad_request',
      'No recipients had a valid E.164 phone number',
      400
    );
  }

  const { data: broadcast, error: bErr } = await db
    .from('broadcasts')
    .insert({
      account_id: accountId,
      user_id: auditUserId,
      name: name || (connectionType === 'evolution' ? `Evolution API broadcast` : `API broadcast (${templateName})`),
      template_name: templateName || 'free_text',
      template_language: templateLanguage ?? 'en_US',
      status: 'sending',
      total_recipients: deduped.length,
    })
    .select('id')
    .single();
  if (bErr || !broadcast) {
    console.error('[broadcast-core] create broadcast error:', bErr);
    throw new BroadcastError('internal', 'Failed to create broadcast', 500);
  }

  const { data: recipientRows, error: rErr } = await db
    .from('broadcast_recipients')
    .insert(
      deduped.map((r) => ({
        broadcast_id: broadcast.id,
        contact_id: r.contactId,
        status: 'pending' as const,
      }))
    )
    .select('id, contact_id');
  if (rErr || !recipientRows) {
    console.error('[broadcast-core] create recipients error:', rErr);
    throw new BroadcastError('internal', 'Failed to create broadcast', 500);
  }

  const byContact = new Map(deduped.map((r) => [r.contactId, r]));
  const planned: PlannedRecipient[] = recipientRows.map((row) => {
    const r = byContact.get(row.contact_id as string)!;
    return { recipientRowId: row.id as string, phone: r.phone, params: r.params, text: r.text };
  });

  return {
    broadcastId: broadcast.id,
    connectionType,
    templateName,
    templateLanguage,
    phoneNumberId,
    accessToken,
    templateRow,
    evolutionInstanceName,
    evolutionApiKey,
    freeText,
    planned,
    rejected,
  };
}

/**
 * Fan out a {@link BroadcastPlan}: send each recipient's template via Meta
 * or text via Evolution API and stamp its `broadcast_recipients` row.
 */
export async function deliverBroadcast(
  db: SupabaseClient,
  plan: BroadcastPlan
): Promise<void> {
  let sentCount = 0;

  for (const recipient of plan.planned) {
    let sentMessageId: string | null = null;
    let lastError: string | null = null;

    if (plan.connectionType === 'evolution') {
      try {
        const text = (recipient.text || plan.freeText || '').trim();
        const result = await sendEvolutionTextMessage({
          instanceName: plan.evolutionInstanceName!,
          instanceApiKey: plan.evolutionApiKey!,
          to: recipient.phone,
          text,
        });
        sentMessageId = result.messageId;
        lastError = null;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown Evolution error';
      }
    } else {
      // Meta path
      const variants = phoneVariants(recipient.phone);
      for (const variant of variants) {
        try {
          const result = await sendTemplateMessage({
            phoneNumberId: plan.phoneNumberId!,
            accessToken: plan.accessToken!,
            to: variant,
            templateName: plan.templateName!,
            language: plan.templateLanguage || 'en_US',
            template: plan.templateRow ?? undefined,
            params: recipient.params,
          });
          sentMessageId = result.messageId;
          lastError = null;
          break;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          lastError = message;
          if (!isRecipientNotAllowedError(message)) break;
        }
      }
    }

    if (sentMessageId) {
      sentCount++;
      await db
        .from('broadcast_recipients')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          whatsapp_message_id: sentMessageId,
          error_message: null,
        })
        .eq('id', recipient.recipientRowId);
    } else {
      await db
        .from('broadcast_recipients')
        .update({
          status: 'failed',
          error_message: lastError || 'Unknown error',
        })
        .eq('id', recipient.recipientRowId);
    }
  }

  await db
    .from('broadcasts')
    .update({
      status: sentCount > 0 ? 'sent' : 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', plan.broadcastId);
}
