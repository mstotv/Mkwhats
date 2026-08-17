-- ============================================================
-- Migration 058: Add is_suspended column to accounts & update is_platform_super_admin
-- ============================================================

-- 1. Add is_suspended column to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- 2. Update is_platform_super_admin function to allow service_role and platform_admins
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_super_admin() TO authenticated, service_role;

-- 3. Update get_system_global_metrics RPC
CREATE OR REPLACE FUNCTION public.get_system_global_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_accounts BIGINT;
  v_active_accounts BIGINT;
  v_suspended_accounts BIGINT;
  v_total_users BIGINT;
  v_total_messages BIGINT;
  v_messages_this_month BIGINT;
  v_total_broadcasts BIGINT;
  v_estimated_mrr NUMERIC(10, 2);
  v_result JSONB;
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  -- Ensure is_suspended column exists
  ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

  SELECT COUNT(*) INTO v_total_accounts FROM public.accounts;
  SELECT COUNT(*) INTO v_active_accounts FROM public.accounts WHERE COALESCE(is_suspended, false) = false;
  SELECT COUNT(*) INTO v_suspended_accounts FROM public.accounts WHERE is_suspended = true;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;

  SELECT COUNT(*) INTO v_total_messages FROM public.messages;
  SELECT COUNT(*) INTO v_messages_this_month 
    FROM public.messages 
    WHERE created_at >= date_trunc('month', NOW());

  SELECT COUNT(*) INTO v_total_broadcasts FROM public.broadcasts;

  SELECT COALESCE(SUM(p.price_monthly), 0.00) INTO v_estimated_mrr
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.status IN ('active', 'trialing') AND s.billing_cycle = 'monthly';

  v_result := jsonb_build_object(
    'total_accounts', v_total_accounts,
    'active_accounts', v_active_accounts,
    'suspended_accounts', v_suspended_accounts,
    'total_users', v_total_users,
    'total_messages', v_total_messages,
    'messages_this_month', v_messages_this_month,
    'total_broadcasts', v_total_broadcasts,
    'estimated_mrr', v_estimated_mrr
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_global_metrics() TO authenticated, service_role;
