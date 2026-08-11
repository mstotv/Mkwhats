-- ============================================================
-- Migration 050: Add 'gemini' as a supported AI provider
-- ============================================================
-- The ai_configs table has a CHECK constraint on the `provider` column
-- that only allows 'openai' and 'anthropic'. We need to extend it to
-- also allow 'gemini'.
-- The ai_usage_log table has the same constraint and must be updated too.
-- ============================================================

-- ai_configs: drop old constraint and add new one including 'gemini'
DO $$
BEGIN
  -- Drop the old check constraint by name if it exists.
  -- The constraint name may differ between environments, so we search
  -- pg_constraint for any check on ai_configs.provider.
  DECLARE
    v_constraint text;
  BEGIN
    SELECT conname INTO v_constraint
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'ai_configs'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%provider%';

    IF v_constraint IS NOT NULL THEN
      EXECUTE format('ALTER TABLE ai_configs DROP CONSTRAINT IF EXISTS %I', v_constraint);
    END IF;
  END;
END $$;

ALTER TABLE ai_configs
  DROP CONSTRAINT IF EXISTS ai_configs_provider_check;

ALTER TABLE ai_configs
  ADD CONSTRAINT ai_configs_provider_check
    CHECK (provider IN ('openai', 'anthropic', 'gemini'));

-- ai_usage_log: same treatment
DO $$
BEGIN
  DECLARE
    v_constraint text;
  BEGIN
    SELECT conname INTO v_constraint
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'ai_usage_log'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%provider%';

    IF v_constraint IS NOT NULL THEN
      EXECUTE format('ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS %I', v_constraint);
    END IF;
  END;
END $$;

ALTER TABLE ai_usage_log
  DROP CONSTRAINT IF EXISTS ai_usage_log_provider_check;

ALTER TABLE ai_usage_log
  ADD CONSTRAINT ai_usage_log_provider_check
    CHECK (provider IN ('openai', 'anthropic', 'gemini'));
