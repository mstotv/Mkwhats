import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrderField } from './types'
import { sendTelegramOrderNotification } from '@/lib/telegram/send-notification'

// ============================================================
// src/lib/ai/order-collection.ts
//
// Database helpers for the AI order-collection feature.
//
// Responsibilities:
//   - Load the account's order form schema (order_form_fields).
//   - Get or create the active 'collecting' order for a conversation,
//     handling stale-order cancellation atomically.
//   - Upsert extracted field values (order_field_values).
//   - Mark an order as confirmed.
//
// All writes use the service-role client (supabaseAdmin) that bypasses
// RLS — the auto-reply bot has no auth.uid(). Reads of form fields can
// use either client; we receive whichever the caller passes.
//
// None of these functions throw on non-critical failures (upsert errors,
// missing order row). They log and return safe fallbacks so the auto-
// reply always sends the customer reply regardless of DB state.
// ============================================================

// ── Types ──────────────────────────────────────────────────

export interface ActiveOrder {
  orderId: string
  /** Values already collected, keyed by field_key. */
  collectedFields: Record<string, string>
}

// ── Schema helpers ─────────────────────────────────────────

/**
 * Load the order form field definitions for an account, ordered by
 * sort_order ASC. Returns [] when no fields are configured (order
 * collection is effectively a no-op until the owner adds fields).
 */
export async function loadOrderFormFields(
  db: SupabaseClient,
  accountId: string,
): Promise<OrderField[]> {
  const { data, error } = await db
    .from('order_form_fields')
    .select('field_key, field_label, field_type, choices')
    .eq('account_id', accountId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[order-collection] failed to load form fields:', error)
    return []
  }

  return (data ?? []) as OrderField[]
}

// ── Active-order management ────────────────────────────────

/**
 * Get the current 'collecting' order for a conversation, including the
 * field values already gathered. Returns null when there is no active
 * order (one will be created on demand by `ensureActiveOrder`).
 */
export async function getActiveOrder(
  db: SupabaseClient,
  conversationId: string,
  accountId: string,
): Promise<ActiveOrder | null> {
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('account_id', accountId)
    .eq('status', 'collecting')
    .maybeSingle()

  if (orderErr) {
    console.error('[order-collection] getActiveOrder error:', orderErr)
    return null
  }
  if (!order) return null

  // Load collected values for this order.
  const { data: values } = await db
    .from('order_field_values')
    .select('field_key, field_value')
    .eq('order_id', order.id)

  const collectedFields: Record<string, string> = {}
  for (const v of values ?? []) {
    if (v.field_value !== null && String(v.field_value).trim() !== '') {
      collectedFields[v.field_key] = String(v.field_value)
    }
  }

  return { orderId: order.id, collectedFields }
}

/**
 * Cancel any stale 'collecting' order for this conversation, then create
 * a fresh one. Called when the model signals `new_order: true`.
 *
 * Uses the DB function `cancel_stale_collecting_order` (migration 046)
 * which atomically cancels before the INSERT, making a concurrent
 * duplicate impossible even under parallel inbounds.
 */
export async function cancelAndCreateOrder(
  db: SupabaseClient,
  conversationId: string,
  accountId: string,
  contactId: string | null,
): Promise<ActiveOrder | null> {
  // Step 1: cancel any stale 'collecting' order (no-op if none exists).
  const { error: cancelErr } = await db.rpc('cancel_stale_collecting_order', {
    p_conversation_id: conversationId,
  })
  if (cancelErr) {
    console.error('[order-collection] cancel_stale_collecting_order error:', cancelErr)
    // Non-fatal: the partial unique index will reject a duplicate insert
    // below, which we'll surface as an insert error instead.
  }

  // Step 2: open the new order.
  return createOrder(db, conversationId, accountId, contactId)
}

/**
 * Get the active 'collecting' order, or create one if none exists.
 * Use this on every inbound when order-collection mode is on.
 */
export async function ensureActiveOrder(
  db: SupabaseClient,
  conversationId: string,
  accountId: string,
  contactId: string | null,
): Promise<ActiveOrder | null> {
  const existing = await getActiveOrder(db, conversationId, accountId)
  if (existing) return existing
  return createOrder(db, conversationId, accountId, contactId)
}

async function createOrder(
  db: SupabaseClient,
  conversationId: string,
  accountId: string,
  contactId: string | null,
): Promise<ActiveOrder | null> {
  const { data, error } = await db
    .from('orders')
    .insert({
      account_id: accountId,
      conversation_id: conversationId,
      contact_id: contactId ?? null,
      status: 'collecting',
    })
    .select('id')
    .single()

  if (error) {
    // The most likely cause is the partial unique index rejecting a
    // concurrent insert. Log and return null — the next inbound will
    // try getActiveOrder again.
    console.error('[order-collection] createOrder insert error:', error)
    return null
  }

  return { orderId: data.id, collectedFields: {} }
}

// ── Field value upsert ─────────────────────────────────────

/**
 * Save extracted field values for an order. Uses UPSERT (ON CONFLICT
 * on order_id + field_key) so repeated extraction of the same field in
 * the same conversation cleanly overwrites the previous value.
 *
 * Silently skips empty / null values — an explicit empty string from the
 * model is treated as "not yet provided" (the field stays missing).
 * Returns true on success, false on DB error (non-fatal).
 */
export async function upsertOrderFields(
  db: SupabaseClient,
  orderId: string,
  accountId: string,
  extracted: Record<string, string>,
): Promise<boolean> {
  const rows = Object.entries(extracted)
    .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    .map(([field_key, field_value]) => ({
      order_id: orderId,
      account_id: accountId,
      field_key,
      field_value: field_value.trim(),
      collected_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return true

  const { error } = await db
    .from('order_field_values')
    .upsert(rows, { onConflict: 'order_id,field_key' })

  if (error) {
    console.error('[order-collection] upsertOrderFields error:', error)
    return false
  }
  return true
}

// ── Completion check + confirmation ────────────────────────

/**
 * Check whether all required fields for an order are filled.
 * Delegates to the `is_order_complete` SQL function (migration 046)
 * which runs the completeness check in a single query.
 *
 * Returns false on any DB error (fail-safe: don't confirm prematurely).
 */
export async function checkOrderComplete(
  db: SupabaseClient,
  orderId: string,
): Promise<boolean> {
  const { data, error } = await db.rpc('is_order_complete', {
    p_order_id: orderId,
  })
  if (error) {
    console.error('[order-collection] is_order_complete error:', error)
    return false
  }
  return data === true
}

/**
 * Fetch the missing required fields for an order, ordered by sort_order.
 * Returns [] when the order is complete (all required fields filled).
 *
 * Wraps the `get_order_missing_fields` SQL function (migration 046).
 */
export async function getMissingFields(
  db: SupabaseClient,
  orderId: string,
): Promise<OrderField[]> {
  const { data, error } = await db.rpc('get_order_missing_fields', {
    p_order_id: orderId,
  })
  if (error) {
    console.error('[order-collection] get_order_missing_fields error:', error)
    return []
  }
  return (data ?? []) as OrderField[]
}
/**
 * Mark an order as confirmed (status → 'confirmed').
 * Called after the model sets `confirmed: true` AND `is_order_complete`
 * returns true. The double-check prevents a premature confirmation when
 * the model hallucinated a `confirmed: true` before all fields were
 * filled.
 */
export async function confirmOrder(
  db: SupabaseClient,
  orderId: string,
  accountId: string,
): Promise<void> {
  const { error } = await db
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('account_id', accountId)
    .eq('status', 'collecting') // guard: only confirm if still collecting

  if (error) {
    console.error('[order-collection] confirmOrder error:', error)
    return
  }

  // Trigger non-blocking Telegram notification if enabled for this account
  void sendTelegramOrderNotification(db, orderId, accountId).catch((err) => {
    console.error('[order-collection] Non-blocking Telegram notification failed:', err)
  })
}

