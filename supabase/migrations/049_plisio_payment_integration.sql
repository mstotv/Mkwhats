-- ============================================================
-- 049_plisio_payment_integration.sql — Plisio Crypto Gateway
--
-- 1. Adds `plisio_api_key` and `plisio_enabled` to `site_settings`
--    for platform-wide Plisio configuration by super-admins.
-- 2. Adds Plisio tracking columns to `upgrade_requests`:
--    - `plisio_invoice_id` (txn_id)
--    - `plisio_invoice_url` (checkout URL)
--    - `plisio_amount` & `plisio_currency`
--    - `plisio_status`
--    - `paid_at`
--
-- Idempotent script safe to execute multiple times.
-- ============================================================

-- 1. Add Plisio settings columns to site_settings table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'plisio_api_key'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN plisio_api_key TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'plisio_enabled'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN plisio_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Add Plisio payment tracking columns to upgrade_requests table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'plisio_invoice_id'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN plisio_invoice_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'plisio_invoice_url'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN plisio_invoice_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'plisio_amount'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN plisio_amount NUMERIC(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'plisio_currency'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN plisio_currency TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'plisio_status'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN plisio_status TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'upgrade_requests' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE upgrade_requests ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index for lookup by Plisio invoice ID
CREATE INDEX IF NOT EXISTS upgrade_requests_plisio_invoice_idx
  ON upgrade_requests(plisio_invoice_id);
