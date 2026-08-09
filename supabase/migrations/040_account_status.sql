-- ============================================================
-- 040_account_status.sql
--
-- Adds status column to accounts table to support account lifecycle management
-- (active, suspended, trial, cancelled).
--
-- Idempotent -- safe to run multiple times.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
    CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'trial', 'cancelled');
  END IF;
END $$;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS status account_status_enum NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
