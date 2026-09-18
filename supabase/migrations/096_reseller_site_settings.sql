-- ============================================================
-- MIGRATION 096: Reseller White-Label Site Settings & Auto-Provisioning
-- ============================================================

-- 1. Create Reseller Site Settings Table
CREATE TABLE IF NOT EXISTS public.reseller_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE UNIQUE,
  platform_name TEXT NOT NULL DEFAULT 'WhatsApp CRM',
  platform_name_ar TEXT NOT NULL DEFAULT 'منصة واتساب CRM',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  secondary_color TEXT DEFAULT '#059669',
  support_email TEXT,
  support_whatsapp TEXT,
  telegram_handle TEXT,
  landing_headline TEXT DEFAULT 'All-in-One WhatsApp Marketing & Support Platform',
  landing_headline_ar TEXT DEFAULT 'المنصة الشاملة لإدارة وتسويق محادثات واتساب',
  landing_subheadline TEXT DEFAULT 'Connect WhatsApp, automate customer conversations with AI, and scale your business.',
  landing_subheadline_ar TEXT DEFAULT 'اربط واتساب، وأتمت المحادثات والردود بالذكاء الاصطناعي، وضاعف مبيعاتك بكل سهولة.',
  stripe_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  plisio_enabled BOOLEAN NOT NULL DEFAULT false,
  plisio_api_key TEXT,
  offline_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  offline_payment_instructions TEXT,
  offline_payment_instructions_ar TEXT,
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_site_settings_reseller ON public.reseller_site_settings(reseller_id);

-- 2. Enable RLS
ALTER TABLE public.reseller_site_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Reseller site settings are viewable by everyone" ON public.reseller_site_settings;
CREATE POLICY "Reseller site settings are viewable by everyone" ON public.reseller_site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reseller site settings are manageable by platform admins or reseller managers" ON public.reseller_site_settings;
CREATE POLICY "Reseller site settings are manageable by platform admins or reseller managers" ON public.reseller_site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    OR is_reseller_admin(reseller_id, 'manager')
  );

-- 4. Trigger to auto-provision site settings on reseller creation
CREATE OR REPLACE FUNCTION public.handle_new_reseller_site_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_reseller_after_insert_settings ON public.resellers;
CREATE TRIGGER trg_reseller_after_insert_settings
  AFTER INSERT ON public.resellers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_reseller_site_settings();
