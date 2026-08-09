-- Migration 044: Site Settings & Public Content Pages
-- Global platform settings and dynamic marketing pages.

-- 1. Create site_settings table (single global row: id = 1)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'MK Whats',
  logo_url TEXT,
  social_links JSONB NOT NULL DEFAULT '[{"platform":"twitter","url":"https://x.com"},{"platform":"facebook","url":"https://facebook.com"},{"platform":"instagram","url":"https://instagram.com"}]'::jsonb,
  partners JSONB NOT NULL DEFAULT '[{"name":"Shopify","logo_url":"/partners/shopify.png"},{"name":"WooCommerce","logo_url":"/partners/woocommerce.png"},{"name":"Meta","logo_url":"/partners/meta.png"},{"name":"Salla","logo_url":"/partners/salla.png"}]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default global row if not exists
INSERT INTO site_settings (id, platform_name)
VALUES (1, 'MK Whats')
ON CONFLICT (id) DO NOTHING;

-- RLS policies for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for site_settings" ON site_settings;
CREATE POLICY "Public read for site_settings" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super-admins manage site_settings" ON site_settings;
CREATE POLICY "Super-admins manage site_settings" ON site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- 2. Create content_pages table for static pages (privacy, terms, about, contact)
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial content pages if not exist
INSERT INTO content_pages (slug, title, content_html, is_published)
VALUES 
  ('privacy_policy', 'سياسة الخصوصية', '<h2>سياسة الخصوصية</h2><p>نحن نلتزم بحماية خصوصية بياناتك ومعلومات حسابك في MK Whats.</p>', true),
  ('terms', 'الشروط والأحكام', '<h2>الشروط والأحكام</h2><p>باستخدامك لمنصة MK Whats فإنك توافق على الالتزام بشروط الاستخدام والخدمة.</p>', true),
  ('about', 'من نحن', '<h2>عن منصة MK Whats</h2><p>المنصة الرائدة في إدارة وحملات أتمتة الواتساب وأدوات الذكاء الاصطناعي للمتاجر والشركات.</p>', true),
  ('contact_info', 'اتصل بنا', '<h2>تواصل معنا</h2><p>لأي استفسارات أو دعم فني، تواصل مع فريقنا عبر البريد أو الواتساب.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- RLS policies for content_pages
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for published content_pages" ON content_pages;
CREATE POLICY "Public read for published content_pages" ON content_pages
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Super-admins manage content_pages" ON content_pages;
CREATE POLICY "Super-admins manage content_pages" ON content_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );
