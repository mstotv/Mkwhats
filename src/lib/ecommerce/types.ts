/**
 * E-Commerce Integration — Shared Types
 *
 * Provider-agnostic types shared across Shopify, WooCommerce,
 * and any future e-commerce providers.
 *
 * These types are server-side only — never serialised to the frontend.
 * Frontend receives only safe subsets (EcommerceStoreSafe).
 */

// ------------------------------------------------------------
// Provider
// ------------------------------------------------------------

export type EcommerceProvider = 'shopify' | 'woocommerce'

// ------------------------------------------------------------
// DB row shapes (server-side; includes encrypted fields)
// ------------------------------------------------------------

export interface EcommerceStoreRow {
  id: string
  account_id: string
  provider: EcommerceProvider
  store_name: string | null
  store_url: string
  /** AES-256-GCM encrypted WooCommerce consumer key */
  wc_consumer_key_enc: string | null
  /** AES-256-GCM encrypted WooCommerce consumer secret */
  wc_consumer_secret_enc: string | null
  /** AES-256-GCM encrypted Shopify private-app access token */
  shopify_access_token_enc: string | null
  /** AES-256-GCM encrypted webhook secret (for incoming webhook verification) */
  webhook_secret_enc: string | null
  status: 'connected' | 'disconnected' | 'error'
  last_error: string | null
  connected_at: string | null
  last_event_at: string | null
  created_at: string
  updated_at: string
}

// ------------------------------------------------------------
// Safe shape returned to the frontend (NO credentials)
// ------------------------------------------------------------

export interface EcommerceStoreSafe {
  id: string
  account_id: string
  provider: EcommerceProvider
  store_name: string | null
  store_url: string
  status: 'connected' | 'disconnected' | 'error'
  last_error: string | null
  connected_at: string | null
  last_event_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Strip all encrypted credential fields before sending to frontend.
 * Call this on every API response that includes store data.
 */
export function toSafeStore(row: EcommerceStoreRow): EcommerceStoreSafe {
  return {
    id: row.id,
    account_id: row.account_id,
    provider: row.provider,
    store_name: row.store_name,
    store_url: row.store_url,
    status: row.status,
    last_error: row.last_error,
    connected_at: row.connected_at,
    last_event_at: row.last_event_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// ------------------------------------------------------------
// Normalized E-Commerce Event
// ------------------------------------------------------------
// Both Shopify and WooCommerce webhooks are converted into this
// provider-independent format before the automation engine sees them.
// This means the automation engine doesn't need to know which
// provider sent the event.
// ------------------------------------------------------------

export interface NormalizedOrderItem {
  product_id?: string
  name?: string
  quantity?: number
  price?: number
  sku?: string
}

export interface NormalizedCustomer {
  id?: string
  name?: string
  email?: string
  phone?: string
}

export interface NormalizedOrder {
  id?: string
  number?: string | number
  status?: string
  payment_status?: string
  currency?: string
  total?: number
  subtotal?: number
  items?: NormalizedOrderItem[]
}

export interface NormalizedEcommerceEvent {
  provider: EcommerceProvider
  /** Normalized event type: 'order.created', 'order.paid', etc. */
  event: string
  store_id: string
  /** The provider's own event/order ID for idempotency tracking */
  external_id: string
  /** Provider-specific webhook delivery ID (used for dedup) */
  provider_event_id: string
  customer: NormalizedCustomer
  order?: NormalizedOrder
  /** Preserved for debugging; never sent to the client */
  raw_event: Record<string, unknown>
}

// ------------------------------------------------------------
// Ecommerce Trigger Config (stored in automations.trigger_config)
// ------------------------------------------------------------

export interface EcommerceTriggerConfig {
  /** If set, only this provider fires the trigger. 'any' means both. */
  provider?: EcommerceProvider | 'any'
  /** If set, only this specific store fires the trigger. */
  store_id?: string
}

// ------------------------------------------------------------
// Event type mapping — normalized string → AutomationTriggerType
// ------------------------------------------------------------

export const ECOMMERCE_EVENT_TO_TRIGGER: Record<string, string> = {
  'order.created':    'ecommerce_order_created',
  'order.paid':       'ecommerce_order_paid',
  'order.cancelled':  'ecommerce_order_cancelled',
  'order.fulfilled':  'ecommerce_order_fulfilled',
  'customer.created': 'ecommerce_customer_created',
}

/**
 * Supported ecommerce trigger types (subset of AutomationTriggerType).
 * Used for validation and UI rendering.
 */
export const ECOMMERCE_TRIGGER_TYPES = [
  'ecommerce_order_created',
  'ecommerce_order_paid',
  'ecommerce_order_cancelled',
  'ecommerce_order_fulfilled',
  'ecommerce_customer_created',
] as const

export type EcommerceTriggerType = (typeof ECOMMERCE_TRIGGER_TYPES)[number]

export function isEcommerceTrigger(t: string): t is EcommerceTriggerType {
  return (ECOMMERCE_TRIGGER_TYPES as readonly string[]).includes(t)
}
