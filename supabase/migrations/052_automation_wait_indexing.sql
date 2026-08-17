-- ============================================================
-- MIGRATION 052: Automation Pending Executions Index & Cron Helper
-- ============================================================

-- Ensure partial index exists for fast minute-by-minute sweeps
CREATE INDEX IF NOT EXISTS idx_automation_pending_run_at 
  ON public.automation_pending_executions(run_at) 
  WHERE status = 'pending';

-- Idempotent account index check
CREATE INDEX IF NOT EXISTS idx_automation_pending_account 
  ON public.automation_pending_executions(account_id);
