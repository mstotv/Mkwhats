-- ============================================================
-- Migration 060: Plisio Gateway, Site Config & Partners Ticker
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  platform_name TEXT NOT NULL DEFAULT 'wacrm',
  support_email TEXT NOT NULL DEFAULT 'support@wacrm.com',
  support_whatsapp TEXT DEFAULT '+966500000000',
  support_telegram TEXT DEFAULT '@wacrm_support',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  primary_color TEXT DEFAULT '#10b981',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  -- Plisio Crypto Gateway Config
  plisio_enabled BOOLEAN NOT NULL DEFAULT false,
  plisio_secret_key TEXT DEFAULT '',
  plisio_merchant_id TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial row if not present
INSERT INTO public.site_settings (id, platform_name, support_email, currency_symbol)
VALUES ('global_config', 'wacrm', 'support@wacrm.com', '$')
ON CONFLICT (id) DO NOTHING;

-- Table for Partners / Sponsors Ticker
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Select policies: readable by everyone (public landing page)
DROP POLICY IF EXISTS site_settings_select ON public.site_settings;
CREATE POLICY site_settings_select ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS partners_select ON public.partners;
CREATE POLICY partners_select ON public.partners FOR SELECT USING (true);

-- Manage policies: allowed for super admins
DROP POLICY IF EXISTS site_settings_admin ON public.site_settings;
CREATE POLICY site_settings_admin ON public.site_settings FOR ALL USING (public.is_platform_super_admin());

DROP POLICY IF EXISTS partners_admin ON public.partners;
CREATE POLICY partners_admin ON public.partners FOR ALL USING (public.is_platform_super_admin());
