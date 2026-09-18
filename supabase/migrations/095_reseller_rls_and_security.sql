-- ============================================================
-- MIGRATION 095: Reseller RLS, Security & Lifecycle Automation
-- ============================================================

-- 1. Helper function: Check if current user is an admin of a specific reseller
CREATE OR REPLACE FUNCTION public.is_reseller_admin(
  p_reseller_id UUID,
  p_min_role TEXT DEFAULT 'support'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Platform Super Admins always have access
  IF EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Lookup Reseller Admin role
  SELECT role INTO v_role
  FROM public.reseller_admins
  WHERE reseller_id = p_reseller_id AND user_id = v_user_id;

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Role hierarchy check
  IF p_min_role = 'support' THEN
    RETURN v_role IN ('owner', 'manager', 'support');
  ELSIF p_min_role = 'manager' THEN
    RETURN v_role IN ('owner', 'manager');
  ELSIF p_min_role = 'owner' THEN
    RETURN v_role = 'owner';
  END IF;

  RETURN FALSE;
END;
$$;

-- 2. Enable RLS on all reseller tables
ALTER TABLE public.reseller_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_updates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: reseller_plans
DROP POLICY IF EXISTS "Reseller plans are viewable by everyone" ON public.reseller_plans;
CREATE POLICY "Reseller plans are viewable by everyone" ON public.reseller_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reseller plans are manageable by platform admins" ON public.reseller_plans;
CREATE POLICY "Reseller plans are manageable by platform admins" ON public.reseller_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 4. RLS Policies: resellers
DROP POLICY IF EXISTS "Resellers are viewable by members or platform admins" ON public.resellers;
CREATE POLICY "Resellers are viewable by members or platform admins" ON public.resellers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(id, 'support')
    OR status IN ('active', 'grace_period')
  );

DROP POLICY IF EXISTS "Resellers are insertable by platform admins" ON public.resellers;
CREATE POLICY "Resellers are insertable by platform admins" ON public.resellers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Resellers are updatable by platform admins or owner" ON public.resellers;
CREATE POLICY "Resellers are updatable by platform admins or owner" ON public.resellers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(id, 'owner')
  );

DROP POLICY IF EXISTS "Resellers are deletable by platform admins" ON public.resellers;
CREATE POLICY "Resellers are deletable by platform admins" ON public.resellers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 5. RLS Policies: reseller_admins
DROP POLICY IF EXISTS "Reseller admins are viewable by reseller managers or platform admins" ON public.reseller_admins;
CREATE POLICY "Reseller admins are viewable by reseller managers or platform admins" ON public.reseller_admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(reseller_id, 'manager')
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Reseller admins are manageable by reseller owners or platform admins" ON public.reseller_admins;
CREATE POLICY "Reseller admins are manageable by reseller owners or platform admins" ON public.reseller_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(reseller_id, 'owner')
  );

-- 6. RLS Policies: reseller_updates
DROP POLICY IF EXISTS "Reseller updates are viewable by reseller staff or platform admins" ON public.reseller_updates;
CREATE POLICY "Reseller updates are viewable by reseller staff or platform admins" ON public.reseller_updates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR (
      is_published = true AND EXISTS (
        SELECT 1 FROM public.reseller_admins WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Reseller updates are manageable by platform admins" ON public.reseller_updates;
CREATE POLICY "Reseller updates are manageable by platform admins" ON public.reseller_updates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- 7. Reseller Subscription Lifecycle Procedure
CREATE OR REPLACE FUNCTION public.process_reseller_subscription_lifecycle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grace_count INT := 0;
  v_suspend_count INT := 0;
BEGIN
  -- Transition from active -> grace_period (7 days grace)
  WITH moved_to_grace AS (
    UPDATE public.resellers
    SET 
      status = 'grace_period',
      grace_period_ends_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
    WHERE status = 'active'
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at < NOW()
    RETURNING id
  )
  SELECT count(*) INTO v_grace_count FROM moved_to_grace;

  -- Transition from grace_period -> suspended
  WITH moved_to_suspended AS (
    UPDATE public.resellers
    SET 
      status = 'suspended',
      updated_at = NOW()
    WHERE status = 'grace_period'
      AND (grace_period_ends_at IS NOT NULL AND grace_period_ends_at < NOW())
    RETURNING id
  )
  SELECT count(*) INTO v_suspend_count FROM moved_to_suspended;

  RETURN jsonb_build_object(
    'moved_to_grace', v_grace_count,
    'moved_to_suspended', v_suspend_count,
    'timestamp', NOW()
  );
END;
$$;
