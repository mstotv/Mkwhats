-- ============================================================
-- Migration 090: Storefront Visual Builder, Items & Customization
-- ============================================================

-- 1. Add visual customization & settings columns to storefronts
ALTER TABLE public.storefronts
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL DEFAULT '{
    "primary_color": "#059669",
    "accent_color": "#0d9488",
    "style": "modern",
    "font": "cairo",
    "rounded": "rounded-2xl"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS contact_buttons JSONB NOT NULL DEFAULT '{
    "whatsapp_enabled": true,
    "whatsapp_number": "",
    "phone_enabled": true,
    "phone_number": "",
    "instagram": "",
    "tiktok": "",
    "maps_url": ""
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_order JSONB NOT NULL DEFAULT '[
    "hero",
    "services",
    "products",
    "appointments",
    "contact"
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{
    "enable_whatsapp_confirmation": true,
    "enable_telegram_notifications": true,
    "enable_appointments": true,
    "enable_direct_orders": true,
    "order_success_message": "شكراً لطلبك! سيتم التواصل معك عبر الواتساب لتأكيد الشحن والاستلام.",
    "appointment_success_message": "تم استلام حجزك بنجاح! تم إرسال رسالة التأكيد عبر الواتساب."
  }'::jsonb;

-- 2. Create storefront_items table for products and clinic/salon services
CREATE TABLE IF NOT EXISTS public.storefront_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12, 2),
  image_url TEXT,
  category TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_storefront_items_account_id ON public.storefront_items(account_id);
CREATE INDEX IF NOT EXISTS idx_storefront_items_storefront_id ON public.storefront_items(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_items_type ON public.storefront_items(type);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_storefront_items_updated_at ON public.storefront_items;
CREATE TRIGGER set_storefront_items_updated_at
  BEFORE UPDATE ON public.storefront_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) for storefront_items
ALTER TABLE public.storefront_items ENABLE ROW LEVEL SECURITY;

-- Read: account members can view all their items
DROP POLICY IF EXISTS storefront_items_member_select ON public.storefront_items;
CREATE POLICY storefront_items_member_select ON public.storefront_items
  FOR SELECT
  USING (is_account_member(account_id));

-- Read: public visitors can view available items
DROP POLICY IF EXISTS storefront_items_public_select ON public.storefront_items;
CREATE POLICY storefront_items_public_select ON public.storefront_items
  FOR SELECT
  USING (is_available = true);

-- Insert: account admin+ can insert items
DROP POLICY IF EXISTS storefront_items_insert ON public.storefront_items;
CREATE POLICY storefront_items_insert ON public.storefront_items
  FOR INSERT
  WITH CHECK (is_account_member(account_id, 'admin'));

-- Update: account admin+ can update items
DROP POLICY IF EXISTS storefront_items_update ON public.storefront_items;
CREATE POLICY storefront_items_update ON public.storefront_items
  FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

-- Delete: account admin+ can delete items
DROP POLICY IF EXISTS storefront_items_delete ON public.storefront_items;
CREATE POLICY storefront_items_delete ON public.storefront_items
  FOR DELETE
  USING (is_account_member(account_id, 'admin'));

-- 3. Storage bucket for storefront media (logos, banners, item pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('storefront-media', 'storefront-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload storefront media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view storefront media" ON storage.objects;

CREATE POLICY "Authenticated users can upload storefront media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'storefront-media');

CREATE POLICY "Anyone can view storefront media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'storefront-media');
