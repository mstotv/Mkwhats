-- ============================================================
-- 048_upgrade_requests.sql — Account Plan Upgrade Requests
--
-- Tracks requests from account members wanting to upgrade or change
-- their subscription plan.
--
-- Rules & Security:
--   - Scoped to `account_id` (NOT NULL, FK to accounts).
--   - Uses `is_account_member(account_id)` for RLS policies.
--   - Idempotent script safe to run multiple times.
-- ============================================================

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  requested_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_plan_id     UUID REFERENCES plans(id) ON DELETE SET NULL,
  target_plan_id      UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  billing_cycle       TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'canceled')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS upgrade_requests_account_idx ON upgrade_requests(account_id);
CREATE INDEX IF NOT EXISTS upgrade_requests_status_idx ON upgrade_requests(status);

-- Enable RLS
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Read: Any account member can view upgrade requests for their account
DROP POLICY IF EXISTS upgrade_requests_select ON upgrade_requests;
CREATE POLICY upgrade_requests_select ON upgrade_requests FOR SELECT
  USING (is_account_member(account_id));

-- Insert: Agent or higher can create an upgrade request
DROP POLICY IF EXISTS upgrade_requests_insert ON upgrade_requests;
CREATE POLICY upgrade_requests_insert ON upgrade_requests FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));

-- Update: Admin or higher can update request status
DROP POLICY IF EXISTS upgrade_requests_update ON upgrade_requests;
CREATE POLICY upgrade_requests_update ON upgrade_requests FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

-- Delete: Admin or higher can delete request
DROP POLICY IF EXISTS upgrade_requests_delete ON upgrade_requests;
CREATE POLICY upgrade_requests_delete ON upgrade_requests FOR DELETE
  USING (is_account_member(account_id, 'admin'));
