-- ============================================================
-- 080_secure_site_settings_rls.sql
--
-- Security Hardening:
-- 1. Restrict direct SELECT access on public.site_settings to platform super-admins only.
--    This prevents exposure of secret keys (Stripe Secret Key, Webhook Secret, Plisio Secret Key,
--    Google Client Secret) via public Supabase PostgREST queries.
-- 2. Public read access to safe settings is handled strictly through the sanitized API
--    endpoint (GET /api/site-settings) using service_role on the server.
--
-- Idempotent -- safe to run multiple times.
-- ============================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop old overly permissive public select policy
DROP POLICY IF EXISTS site_settings_select ON public.site_settings;
DROP POLICY IF EXISTS site_settings_admin ON public.site_settings;

-- Create secure policy: only platform super-admins can read or write site_settings directly via client
CREATE POLICY site_settings_admin ON public.site_settings
  FOR ALL
  USING (public.is_platform_super_admin());
