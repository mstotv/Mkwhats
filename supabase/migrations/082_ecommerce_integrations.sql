-- ============================================================
-- MIGRATION 082: E-Commerce Integrations (WooCommerce & Shopify)
-- ============================================================
-- Adds two new tables:
--   ecommerce_stores        — per-account store connections (multi-tenant)
--   ecommerce_webhook_events — incoming webhook log + idempotency guard
--
-- No existing tables are modified.
-- Credentials are stored encrypted (AES-256-GCM, same key as whatsapp_config).
-- RLS uses the existing is_account_member() helper (migration 017).
-- Plans are updated to include woocommerce_integration / shopify_integration.
-- ============================================================

-- --------------------------------------------------------
-- 1. ecommerce_stores
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ecommerce_stores (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id               UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- Provider: 'shopify' | 'woocommerce'
  provider                 TEXT        NOT NULL
    CHECK (provider IN ('shopify', 'woocommerce')),

  -- Human-readable store name (populated after successful connection)
  store_name               TEXT,

  -- The store's base URL (e.g. https://mystore.com or mystore.myshopify.com)
  store_url                TEXT        NOT NULL,

  -- WooCommerce credentials (AES-256-GCM encrypted, server-side only)
  wc_consumer_key_enc      TEXT,
  wc_consumer_secret_enc   TEXT,

  -- Shopify credentials (AES-256-GCM encrypted, server-side only)
  -- Private App: access_token entered manually from Shopify Admin
  shopify_access_token_enc TEXT,

  -- Webhook secret used to verify incoming webhooks (encrypted)
  -- WooCommerce: the secret set when registering the webhook in WC admin
  -- Shopify: the client_secret from the private app
  webhook_secret_enc       TEXT,

  -- Connection state
  status                   TEXT        NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'error')),
  last_error               TEXT,
  connected_at             TIMESTAMPTZ,
  last_event_at            TIMESTAMPTZ,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One store per provider per account
  CONSTRAINT uq_ecommerce_store_account_provider
    UNIQUE (account_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_stores_account_id
  ON public.ecommerce_stores (account_id);

-- --------------------------------------------------------
-- 2. ecommerce_webhook_events
-- --------------------------------------------------------
-- This table serves as both the event log and the idempotency guard.
-- The UNIQUE constraint on (store_id, provider_event_id, event_type)
-- means a duplicate webhook delivery can never trigger a second
-- automation execution — the INSERT will conflict and be ignored.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ecommerce_webhook_events (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id         UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  store_id           UUID        NOT NULL REFERENCES public.ecommerce_stores(id) ON DELETE CASCADE,
  provider           TEXT        NOT NULL,

  -- The unique event identifier from the provider
  -- Shopify:     X-Shopify-Webhook-Id header value
  -- WooCommerce: webhook delivery_id from payload or X-WC-Webhook-ID header
  provider_event_id  TEXT        NOT NULL,

  -- Normalized event type: 'order.created', 'order.paid', etc.
  event_type         TEXT        NOT NULL,

  -- Raw payload (stored for debugging; no credentials)
  payload            JSONB       NOT NULL DEFAULT '{}',

  -- Processing state
  status             TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'failed', 'duplicate')),
  processed_at       TIMESTAMPTZ,
  error_message      TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Core idempotency constraint:
  -- same event from the same store can only be inserted once.
  CONSTRAINT uq_ecommerce_event_dedup
    UNIQUE (store_id, provider_event_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_webhook_events_store_id
  ON public.ecommerce_webhook_events (store_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_webhook_events_account_id
  ON public.ecommerce_webhook_events (account_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_webhook_events_status
  ON public.ecommerce_webhook_events (status)
  WHERE status = 'pending';

-- --------------------------------------------------------
-- 3. Row Level Security — ecommerce_stores
-- --------------------------------------------------------
ALTER TABLE public.ecommerce_stores ENABLE ROW LEVEL SECURITY;

-- Any account member can view their own stores
DROP POLICY IF EXISTS "ecommerce_stores_select" ON public.ecommerce_stores;
CREATE POLICY "ecommerce_stores_select" ON public.ecommerce_stores
  FOR SELECT
  USING (public.is_account_member(account_id));

-- Agents and above can connect (insert) stores
DROP POLICY IF EXISTS "ecommerce_stores_insert" ON public.ecommerce_stores;
CREATE POLICY "ecommerce_stores_insert" ON public.ecommerce_stores
  FOR INSERT
  WITH CHECK (public.is_account_member(account_id, 'agent'));

-- Agents and above can update store status / credentials
DROP POLICY IF EXISTS "ecommerce_stores_update" ON public.ecommerce_stores;
CREATE POLICY "ecommerce_stores_update" ON public.ecommerce_stores
  FOR UPDATE
  USING (public.is_account_member(account_id, 'agent'));

-- Only admins can disconnect (delete) stores
DROP POLICY IF EXISTS "ecommerce_stores_delete" ON public.ecommerce_stores;
CREATE POLICY "ecommerce_stores_delete" ON public.ecommerce_stores
  FOR DELETE
  USING (public.is_account_member(account_id, 'admin'));

-- --------------------------------------------------------
-- 4. Row Level Security — ecommerce_webhook_events
-- --------------------------------------------------------
ALTER TABLE public.ecommerce_webhook_events ENABLE ROW LEVEL SECURITY;

-- Members can view their own event logs (read-only for audit)
DROP POLICY IF EXISTS "ecommerce_webhook_events_select" ON public.ecommerce_webhook_events;
CREATE POLICY "ecommerce_webhook_events_select" ON public.ecommerce_webhook_events
  FOR SELECT
  USING (public.is_account_member(account_id));

-- Only service_role can insert/update events (webhooks bypass RLS via service client)
-- No authenticated INSERT/UPDATE policy needed because webhook processing uses
-- the service-role client that bypasses RLS.

-- --------------------------------------------------------
-- 5. Table Grants
-- --------------------------------------------------------
GRANT SELECT ON public.ecommerce_stores TO authenticated;
GRANT ALL    ON public.ecommerce_stores TO service_role;

GRANT SELECT ON public.ecommerce_webhook_events TO authenticated;
GRANT ALL    ON public.ecommerce_webhook_events TO service_role;

-- --------------------------------------------------------
-- 6. Plan Feature Updates
-- --------------------------------------------------------
-- Adds two feature flags to the existing plans.features JSONB column.
-- Uses the || merge operator so all OTHER existing feature flags are preserved.
--
-- Distribution (approved in implementation plan):
--   free       → both ❌
--   pro        → woocommerce ✅, shopify ❌
--   enterprise → both ✅
-- --------------------------------------------------------

UPDATE public.plans
SET features = features || '{"woocommerce_integration": false, "shopify_integration": false}'::jsonb
WHERE slug = 'free';

UPDATE public.plans
SET features = features || '{"woocommerce_integration": true, "shopify_integration": false}'::jsonb
WHERE slug = 'pro';

UPDATE public.plans
SET features = features || '{"woocommerce_integration": true, "shopify_integration": true}'::jsonb
WHERE slug = 'enterprise';

-- --------------------------------------------------------
-- 7. updated_at trigger for ecommerce_stores
-- --------------------------------------------------------
-- Reuse the moddatetime pattern used throughout this project.
-- If a generic set_updated_at function exists, use it; otherwise create one.
CREATE OR REPLACE FUNCTION public.set_ecommerce_stores_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ecommerce_stores_updated_at ON public.ecommerce_stores;
CREATE TRIGGER trg_ecommerce_stores_updated_at
  BEFORE UPDATE ON public.ecommerce_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ecommerce_stores_updated_at();
