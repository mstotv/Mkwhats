-- ============================================================
-- 038_whatsapp_evolution_instance_unique.sql
--
-- Enforces multi-tenant isolation for Evolution API instances.
-- Every instance name must be globally unique across all accounts
-- on this SaaS instance to prevent cross-account name collisions
-- on the shared Evolution server.
--
-- Partial index: only applies when evolution_instance_name is NOT NULL
-- (Meta rows have NULL for this column and are unaffected).
--
-- Idempotent -- safe to run multiple times.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_config_evolution_instance_name
  ON whatsapp_config (evolution_instance_name)
  WHERE evolution_instance_name IS NOT NULL;
