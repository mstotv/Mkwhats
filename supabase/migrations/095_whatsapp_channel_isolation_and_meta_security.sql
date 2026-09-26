-- ============================================================
-- 095_whatsapp_channel_isolation_and_meta_security.sql
--
-- 1. Adds `app_secret` to `whatsapp_config` for per-account / per-app Meta HMAC-SHA256 signature verification.
-- 2. Adds `channel_phone` and `channel_type` to `conversations` and `messages`
--    to isolate and clearly identify conversations by connected number and provider (Meta vs Evolution).
--
-- Non-breaking & Idempotent:
-- - All added columns are NULLABLE.
-- - Evolution API functionality remains 100% untouched and safe.
-- ============================================================

-- 1. Meta App Secret for webhook HMAC verification
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS app_secret TEXT;

-- 2. Channel isolation for conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel_phone TEXT,
  ADD COLUMN IF NOT EXISTS channel_type TEXT CHECK (channel_type IN ('meta', 'evolution'));

CREATE INDEX IF NOT EXISTS idx_conversations_account_channel
  ON conversations (account_id, channel_phone);

CREATE INDEX IF NOT EXISTS idx_conversations_channel_type
  ON conversations (channel_type);

-- 3. Channel isolation for messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel_phone TEXT,
  ADD COLUMN IF NOT EXISTS channel_type TEXT CHECK (channel_type IN ('meta', 'evolution'));

CREATE INDEX IF NOT EXISTS idx_messages_channel_phone
  ON messages (channel_phone);
