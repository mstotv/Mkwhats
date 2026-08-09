-- ============================================================
-- 041_admin_impersonation_log.sql
--
-- Audit log for platform super-admin impersonation sessions.
-- Tracks every "login as user" action: who, which account/user,
-- when it started, and when it ended.
--
-- Security constraints (non-negotiable):
--   • No RLS policy = zero direct access via anon or user JWT
--   • All reads/writes go through service_role key in API routes
--   • No DELETE is ever exposed — records are permanent
--
-- Idempotent -- safe to run multiple times.
-- ============================================================

-- 1. Impersonation Audit Log Table
CREATE TABLE IF NOT EXISTS admin_impersonation_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID        NOT NULL REFERENCES auth.users(id),
  target_user_id  UUID        NOT NULL REFERENCES auth.users(id),
  account_id      UUID        NOT NULL REFERENCES accounts(id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,                -- NULL = session still active or abandoned
  admin_email     TEXT        NOT NULL,
  target_email    TEXT        NOT NULL,
  target_name     TEXT        NOT NULL DEFAULT '',
  account_name    TEXT        NOT NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb  -- ip_address, user_agent
);

ALTER TABLE admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Intentionally NO policies → nobody can access via anon/user JWT.
-- Access is strictly via service_role key in server-side API routes.

-- Indexes for admin audit log queries
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_admin_user
  ON admin_impersonation_logs (admin_user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_impersonation_logs_account
  ON admin_impersonation_logs (account_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_impersonation_logs_active
  ON admin_impersonation_logs (ended_at)
  WHERE ended_at IS NULL;

-- 2. Cleanup function: mark abandoned sessions (browser closed without logout)
--    An impersonation session is considered abandoned if it has been open
--    for more than 25 hours (1 hour grace beyond the 24h cookie maxAge).
CREATE OR REPLACE FUNCTION cleanup_abandoned_impersonation_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_impersonation_logs
  SET ended_at = started_at + INTERVAL '24 hours'
  WHERE ended_at IS NULL
    AND started_at < NOW() - INTERVAL '25 hours';
END;
$$;

-- 3. Safe pg_cron Schedule (same fallback pattern as migration 039)
DO $$
DECLARE
  extension_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) INTO extension_exists;

  IF extension_exists THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;

      EXECUTE 'SELECT cron.unschedule($1) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = $1)'
      USING 'cleanup-abandoned-impersonation-sessions';

      EXECUTE 'SELECT cron.schedule($1, $2, $3)'
      USING 'cleanup-abandoned-impersonation-sessions',
            '0 * * * *',
            'SELECT cleanup_abandoned_impersonation_sessions()';

      RAISE NOTICE 'pg_cron schedule for impersonation cleanup set successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron not available: %. Abandoned sessions will be cleaned up lazily.', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron not available. Abandoned sessions will be cleaned up lazily.';
  END IF;
END $$;
