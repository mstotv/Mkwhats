-- ============================================================
-- Migration 056: Allow users to view their own platform_admin entry
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own platform_admin entry" ON public.platform_admins;
CREATE POLICY "Users can view their own platform_admin entry" ON public.platform_admins
  FOR SELECT USING (user_id = auth.uid());
