-- ============================================================
-- Migration 060: Add site_settings columns & partners table
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@wacrm.com',
  ADD COLUMN IF NOT EXISTS support_whatsapp TEXT DEFAULT '+966500000000',
  ADD COLUMN IF NOT EXISTS support_telegram TEXT DEFAULT '@wacrm_support',
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plisio_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plisio_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS plisio_secret_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS plisio_merchant_id TEXT DEFAULT '';

-- Seed initial row id=1
INSERT INTO public.site_settings (id, platform_name)
VALUES (1, 'wacrm')
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

-- Select policies: readable by everyone
DROP POLICY IF EXISTS site_settings_select ON public.site_settings;
CREATE POLICY site_settings_select ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS partners_select ON public.partners;
CREATE POLICY partners_select ON public.partners FOR SELECT USING (true);

-- Manage policies: allowed for super admins
DROP POLICY IF EXISTS site_settings_admin ON public.site_settings;
CREATE POLICY site_settings_admin ON public.site_settings FOR ALL USING (public.is_platform_super_admin());

DROP POLICY IF EXISTS partners_admin ON public.partners;
CREATE POLICY partners_admin ON public.partners FOR ALL USING (public.is_platform_super_admin());

-- Seed initial giant partners
INSERT INTO public.partners (name, logo_url, display_order)
VALUES
  ('Shopify', 'https://cdn.simpleicons.org/shopify/96bf48', 1),
  ('WooCommerce', 'https://cdn.simpleicons.org/woocommerce/96588a', 2),
  ('Meta', 'https://cdn.simpleicons.org/meta/0668E1', 3),
  ('Stripe', 'https://cdn.simpleicons.org/stripe/635BFF', 4),
  ('WhatsApp', 'https://cdn.simpleicons.org/whatsapp/25D366', 5),
  ('Telegram', 'https://cdn.simpleicons.org/telegram/26A5E4', 6),
  ('Google', 'https://cdn.simpleicons.org/google/4285F4', 7),
  ('Amazon', 'https://cdn.simpleicons.org/amazon/FF9900', 8),
  ('Salesforce', 'https://cdn.simpleicons.org/salesforce/00A1E0', 9),
  ('PayPal', 'https://cdn.simpleicons.org/paypal/003087', 10)
ON CONFLICT DO NOTHING;
