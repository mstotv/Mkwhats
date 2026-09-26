-- ============================================================
-- 096_whatsapp_channel_cleanup_and_isolation.sql
--
-- 1. Backfills legacy conversations and messages created before migration 095
--    to 'evolution' so they are not mistakenly included when filtering by 'meta'.
-- 2. Ensures accounts with active registered Meta credentials have their
--    whatsapp_config connection_type set to 'meta' rather than lingering as 'evolution'.
--
-- Non-breaking & Idempotent: Safe to run multiple times.
-- ============================================================

-- 1. Backfill legacy conversations to evolution provider
UPDATE conversations
SET channel_type = 'evolution'
WHERE channel_type IS NULL;

-- 2. Backfill legacy messages to evolution provider
UPDATE messages
SET channel_type = 'evolution'
WHERE channel_type IS NULL;

-- 3. Set connection_type to 'meta' for configs that have an active registered Meta Cloud API setup
UPDATE whatsapp_config
SET connection_type = 'meta'
WHERE phone_number_id IS NOT NULL
  AND registered_at IS NOT NULL
  AND (connection_type IS NULL OR connection_type = 'evolution');
