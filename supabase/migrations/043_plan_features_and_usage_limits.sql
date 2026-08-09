-- ============================================================
-- MIGRATION 043: Plan Features, Usage Limits & Atomic Counters
-- ============================================================

-- 1. Add Monthly Limits Columns to Plans Table
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_messages_monthly INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS max_broadcasts_monthly INTEGER NOT NULL DEFAULT 10;

-- 2. Update Initial Seed Plans with Features & Limits
UPDATE public.plans
SET
  max_messages_monthly = 500,
  max_broadcasts_monthly = 5,
  features = '{"ai_assistant": false, "excel_export": false, "telegram_bot": false}'::jsonb
WHERE slug = 'free';

UPDATE public.plans
SET
  max_messages_monthly = 10000,
  max_broadcasts_monthly = 100,
  features = '{"ai_assistant": true, "excel_export": true, "telegram_bot": false}'::jsonb
WHERE slug = 'pro';

UPDATE public.plans
SET
  max_messages_monthly = -1,
  max_broadcasts_monthly = -1,
  features = '{"ai_assistant": true, "excel_export": true, "telegram_bot": true}'::jsonb
WHERE slug = 'enterprise';

-- 3. Create Account Monthly Usage Counters Table (Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.account_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format 'YYYY-MM' (e.g. '2026-07')
  messages_count INTEGER NOT NULL DEFAULT 0,
  broadcasts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_account_usage_year_month UNIQUE (account_id, year_month)
);

-- Indexes for fast queries by account and month
CREATE INDEX IF NOT EXISTS idx_account_usage_counters_account_month 
  ON public.account_usage_counters (account_id, year_month);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.account_usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account members can view usage counters" ON public.account_usage_counters;
CREATE POLICY "Account members can view usage counters" ON public.account_usage_counters
  FOR SELECT USING (public.is_account_member(account_id));

DROP POLICY IF EXISTS "Admins can manage usage counters" ON public.account_usage_counters;
CREATE POLICY "Admins can manage usage counters" ON public.account_usage_counters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
    )
  );

-- 5. Table Grants
GRANT SELECT ON public.account_usage_counters TO authenticated;
GRANT ALL ON public.account_usage_counters TO service_role;

-- 6. Atomic RPC Function to Increment Usage Counters Safely Under Concurrency
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_account_id UUID,
  p_year_month TEXT,
  p_messages_delta INTEGER DEFAULT 0,
  p_broadcasts_delta INTEGER DEFAULT 0
)
RETURNS public.account_usage_counters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.account_usage_counters;
BEGIN
  INSERT INTO public.account_usage_counters (
    account_id,
    year_month,
    messages_count,
    broadcasts_count,
    created_at,
    updated_at
  )
  VALUES (
    p_account_id,
    p_year_month,
    GREATEST(0, p_messages_delta),
    GREATEST(0, p_broadcasts_delta),
    NOW(),
    NOW()
  )
  ON CONFLICT (account_id, year_month)
  DO UPDATE SET
    messages_count = public.account_usage_counters.messages_count + GREATEST(0, p_messages_delta),
    broadcasts_count = public.account_usage_counters.broadcasts_count + GREATEST(0, p_broadcasts_delta),
    updated_at = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

ALTER FUNCTION public.increment_usage_counter(UUID, TEXT, INTEGER, INTEGER) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.increment_usage_counter(UUID, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
