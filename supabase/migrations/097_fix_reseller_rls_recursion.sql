-- ============================================================
-- MIGRATION 097: Fix Reseller RLS Recursion and Statement Timeout
-- ============================================================

-- 1. Redefine is_reseller_admin to be strictly non-recursive and fast
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
  IF v_user_id IS NULL OR p_reseller_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Platform Super Admins always have access
  IF EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Lookup Reseller Admin role directly without recursive policy invocation
  SELECT role INTO v_role
  FROM public.reseller_admins
  WHERE reseller_id = p_reseller_id AND user_id = v_user_id
  LIMIT 1;

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

-- 2. Drop any recursive policies on reseller_admins
DROP POLICY IF EXISTS "Reseller admins are viewable by reseller managers or platform admins" ON public.reseller_admins;
DROP POLICY IF EXISTS "Reseller admins are manageable by reseller owners or platform admins" ON public.reseller_admins;
DROP POLICY IF EXISTS "Reseller admins are viewable by self or platform admins" ON public.reseller_admins;
DROP POLICY IF EXISTS "Reseller admins are manageable by owner or platform admins" ON public.reseller_admins;

-- 3. Create non-recursive policies on reseller_admins
-- Read: user can view their own admin rows, or platform admins view all
CREATE POLICY "Reseller admins are viewable by self or platform admins" ON public.reseller_admins
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Write: platform admins can manage all, or the reseller owner account owner can manage
CREATE POLICY "Reseller admins are manageable by owner or platform admins" ON public.reseller_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.resellers r
      JOIN public.accounts a ON a.id = r.owner_account_id
      WHERE r.id = reseller_admins.reseller_id AND a.owner_user_id = auth.uid()
    )
  );

-- 4. Update resellers SELECT policy to evaluate active status first
DROP POLICY IF EXISTS "Resellers are viewable by members or platform admins" ON public.resellers;
CREATE POLICY "Resellers are viewable by members or platform admins" ON public.resellers
  FOR SELECT USING (
    status IN ('active', 'grace_period')
    OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(id, 'support')
  );

-- 5. Fix handle_new_reseller_site_settings search_path
CREATE OR REPLACE FUNCTION public.handle_new_reseller_site_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reseller_site_settings (
    reseller_id,
    platform_name,
    platform_name_ar,
    logo_url,
    favicon_url,
    primary_color,
    support_email,
    support_whatsapp
  ) VALUES (
    NEW.id,
    NEW.display_name,
    COALESCE(NEW.display_name_ar, NEW.display_name),
    NEW.logo_url,
    NEW.favicon_url,
    COALESCE(NEW.primary_color, '#10b981'),
    NEW.support_email,
    NEW.support_whatsapp
  )
  ON CONFLICT (reseller_id) DO NOTHING;

  RETURN NEW;
END;
$$;
