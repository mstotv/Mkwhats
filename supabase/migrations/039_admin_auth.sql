-- ============================================================
-- 039_admin_auth.sql
--
-- Infrastructure for Platform Super-Admin Authentication & Security:
-- 1. platform_admins table: Identifies platform super-admins.
-- 2. admin_login_attempts table: Tracks failed login attempts for rate limiting.
-- 3. cleanup_old_admin_login_attempts function: Removes attempts older than 24 hours.
-- 4. Safe pg_cron job: Schedules hourly cleanup if pg_cron is available (with fallback).
--
-- Idempotent -- safe to run multiple times.
-- ============================================================

-- 1. Platform Admins Table
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- Disable direct public/authenticated user access via standard RLS.
-- Access is strictly managed via service_role key or SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "No direct public access to platform_admins" ON platform_admins;

-- 2. Admin Login Attempts Table
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Indexes for fast lookup during rate-limit checks
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time 
  ON admin_login_attempts (ip_address, attempted_at);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_time 
  ON admin_login_attempts (email, attempted_at);

-- 3. Cleanup function for old login attempts (> 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_admin_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM admin_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 4. Safe pg_cron Schedule Setup (100% Safe Fallback)
DO $$
DECLARE
  extension_exists BOOLEAN;
BEGIN
  -- Check if pg_cron extension exists or can be enabled
  SELECT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) INTO extension_exists;

  IF extension_exists THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;

      -- Unschedule if already scheduled
      EXECUTE 'SELECT cron.unschedule($1) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = $1)' 
      USING 'cleanup-admin-login-attempts';

      -- Schedule hourly cleanup
      EXECUTE 'SELECT cron.schedule($1, $2, $3)' 
      USING 'cleanup-admin-login-attempts', '0 * * * *', 'SELECT cleanup_old_admin_login_attempts()';

      RAISE NOTICE 'pg_cron schedule set successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension could not be enabled or scheduled: %. Falling back to lazy cleanup in code.', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'pg_cron extension is not available on this database environment. Falling back to lazy cleanup in code.';
  END IF;
END $$;
