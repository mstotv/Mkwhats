-- ============================================================
-- Migration 057: Add is_popular flag to plans and RPC for account plan assignment
-- ============================================================

-- 1. Add is_popular column to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;

-- Set 'pro' plan as default popular
UPDATE public.plans SET is_popular = true WHERE slug = 'pro';

-- 2. RPC: Change Account Subscription Plan by Super Admin
CREATE OR REPLACE FUNCTION public.change_account_subscription_plan(
  target_account_id UUID,
  new_plan_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  -- Upsert subscription for the target account
  INSERT INTO public.subscriptions (
    account_id,
    plan_id,
    status,
    billing_cycle,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  )
  VALUES (
    target_account_id,
    new_plan_id,
    'active',
    'monthly',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  )
  ON CONFLICT (account_id) WHERE status IN ('active', 'trialing')
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year',
    updated_at = NOW();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_account_subscription_plan(UUID, UUID) TO authenticated;

-- 3. RPC: Set Popular Plan
CREATE OR REPLACE FUNCTION public.set_popular_plan(
  target_plan_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  -- Unset all popular flags
  UPDATE public.plans SET is_popular = false;

  -- Set target plan as popular
  UPDATE public.plans SET is_popular = true WHERE id = target_plan_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_popular_plan(UUID) TO authenticated;
