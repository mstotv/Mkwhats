-- ============================================================
-- Migration 054: Super Admin RPC Helpers & Admin Analytics
-- ============================================================

-- 1. Helper Function: Check if current authenticated user is a platform super-admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_platform_super_admin() TO authenticated;

-- 2. RPC: Get System Global SaaS Metrics for Admin Dashboard
CREATE OR REPLACE FUNCTION public.get_system_global_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
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
  -- Verify super-admin status
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  -- 1. Accounts count
  SELECT COUNT(*) INTO v_total_accounts FROM public.accounts;
  SELECT COUNT(*) INTO v_active_accounts FROM public.accounts WHERE COALESCE(is_suspended, false) = false;
  SELECT COUNT(*) INTO v_suspended_accounts FROM public.accounts WHERE is_suspended = true;

  -- 2. Users count
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;

  -- 3. Messages count
  SELECT COUNT(*) INTO v_total_messages FROM public.messages;
  SELECT COUNT(*) INTO v_messages_this_month 
    FROM public.messages 
    WHERE created_at >= date_trunc('month', NOW());

  -- 4. Broadcasts count
  SELECT COUNT(*) INTO v_total_broadcasts FROM public.broadcasts;

  -- 5. Estimated MRR calculation from active subscriptions
  SELECT COALESCE(SUM(p.price_monthly), 0.00) INTO v_estimated_mrr
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.status IN ('active', 'trialing') AND s.billing_cycle = 'monthly';

  -- Construct final result JSON
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

GRANT EXECUTE ON FUNCTION public.get_system_global_metrics() TO authenticated;

-- 3. RPC: Get Detailed Accounts Directory List for Super Admin
CREATE OR REPLACE FUNCTION public.get_admin_accounts_list()
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  created_at TIMESTAMPTZ,
  is_suspended BOOLEAN,
  plan_name TEXT,
  plan_slug TEXT,
  subscription_status TEXT,
  user_count BIGINT,
  message_count BIGINT,
  owner_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    a.id AS account_id,
    a.name AS account_name,
    a.created_at AS created_at,
    COALESCE(a.is_suspended, false) AS is_suspended,
    COALESCE(p.name, 'المجانية / Free') AS plan_name,
    COALESCE(p.slug, 'free') AS plan_slug,
    COALESCE(s.status, 'trialing') AS subscription_status,
    (SELECT COUNT(*) FROM public.profiles pr WHERE pr.account_id = a.id) AS user_count,
    (SELECT COUNT(*) FROM public.messages m WHERE m.account_id = a.id) AS message_count,
    COALESCE(
      (SELECT pr.email FROM public.profiles pr WHERE pr.account_id = a.id AND pr.role = 'owner' LIMIT 1),
      (SELECT pr.email FROM public.profiles pr WHERE pr.account_id = a.id LIMIT 1),
      'N/A'
    ) AS owner_email
  FROM public.accounts a
  LEFT JOIN public.subscriptions s ON s.account_id = a.id AND s.status IN ('active', 'trialing')
  LEFT JOIN public.plans p ON s.plan_id = p.id
  ORDER BY a.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_accounts_list() TO authenticated;

-- 4. RPC: Toggle Account Suspension Status
CREATE OR REPLACE FUNCTION public.set_account_suspension_status(
  target_account_id UUID,
  new_suspended_status BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_platform_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super-admin privileges required.';
  END IF;

  -- Add column is_suspended if missing safely
  ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

  UPDATE public.accounts
  SET is_suspended = new_suspended_status,
      updated_at = NOW()
  WHERE id = target_account_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_account_suspension_status(UUID, BOOLEAN) TO authenticated;
