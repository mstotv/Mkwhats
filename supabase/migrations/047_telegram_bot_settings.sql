-- ============================================================
-- 047_telegram_bot_settings.sql — Telegram Bot Integration
--
-- Stores per-account Telegram bot token & chat ID for sending
-- automatic notifications when an order status flips to 'confirmed'.
--
-- Features & Rules:
--   - Gated by the `telegram_bot` feature flag in `plans`.
--   - `bot_token` stored encrypted at rest using AES-256-GCM (same as `ai_configs`).
--   - Scoped strictly to `account_id` with RLS using `is_account_member(account_id)`.
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- ---- table -------------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bot_token   TEXT NOT NULL, -- AES-256-GCM encrypted BYO Telegram Bot token
  chat_id     TEXT NOT NULL, -- Telegram Chat / Channel / User ID
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookup by account_id
CREATE INDEX IF NOT EXISTS telegram_configs_account_idx
  ON telegram_configs(account_id);

-- ---- RLS ---------------------------------------------------
ALTER TABLE telegram_configs ENABLE ROW LEVEL SECURITY;

-- Read: Any account member can view if telegram bot is configured
DROP POLICY IF EXISTS telegram_configs_select ON telegram_configs;
CREATE POLICY telegram_configs_select ON telegram_configs FOR SELECT
  USING (is_account_member(account_id));

-- Insert: Admin/agent or higher
DROP POLICY IF EXISTS telegram_configs_insert ON telegram_configs;
CREATE POLICY telegram_configs_insert ON telegram_configs FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

-- Update: Admin/agent or higher
DROP POLICY IF EXISTS telegram_configs_update ON telegram_configs;
CREATE POLICY telegram_configs_update ON telegram_configs FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

-- Delete: Admin/agent or higher
DROP POLICY IF EXISTS telegram_configs_delete ON telegram_configs;
CREATE POLICY telegram_configs_delete ON telegram_configs FOR DELETE
  USING (is_account_member(account_id, 'admin'));
