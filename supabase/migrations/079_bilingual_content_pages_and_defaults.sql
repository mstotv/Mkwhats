-- ============================================================
-- Migration 079: Bilingual Support for Content Pages & Defaults
-- Ensures title_en & content_html_en exist and populates defaults
-- ============================================================

-- 1. Ensure English columns exist on content_pages
ALTER TABLE IF EXISTS content_pages ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE IF EXISTS content_pages ADD COLUMN IF NOT EXISTS content_html_en TEXT;

-- 2. Ensure English columns exist on plans
ALTER TABLE IF EXISTS plans ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE IF EXISTS plans ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 3. Populate default English content for existing content pages if missing or null

-- Privacy Policy (privacy_policy / privacy-policy / privacy)
UPDATE content_pages
SET 
  title_en = COALESCE(NULLIF(title_en, ''), 'Privacy Policy & Data Protection'),
  content_html_en = COALESCE(NULLIF(content_html_en, ''), '<h2>Privacy Policy</h2><p>At <strong>MK Whats</strong>, we are committed to protecting your privacy and safeguarding your business and customer data with industry-leading encryption standards.</p><h3>1. Information We Collect</h3><p>We collect necessary account and messaging metadata to provide automated WhatsApp interactions, order tracking, and Gemini AI conversations strictly with user authorization.</p><h3>2. Data Protection & Security</h3><p>All transmitted data is encrypted end-to-end via secure HTTPS/TLS protocols. We never sell, rent, or trade your contacts or chat history to third parties.</p><h3>3. Data Retention & Deletion</h3><p>You maintain full ownership of your data and can request complete export or deletion of your logs, contacts, and account at any time from your dashboard.</p>')
WHERE slug IN ('privacy_policy', 'privacy-policy', 'privacy')
  AND (title_en IS NULL OR title_en = '' OR content_html_en IS NULL OR content_html_en = '');

-- Terms & Conditions (terms / terms-and-conditions)
UPDATE content_pages
SET 
  title_en = COALESCE(NULLIF(title_en, ''), 'Terms of Service & Acceptable Use'),
  content_html_en = COALESCE(NULLIF(content_html_en, ''), '<h2>Terms of Service</h2><p>By using <strong>MK Whats</strong>, you agree to comply with our terms of service and fair messaging usage guidelines.</p><h3>1. Acceptable Use Policy</h3><p>You agree not to use the platform for sending unsolicited spam, abusive material, or unauthorized bulk messaging that violates official Meta policies.</p><h3>2. Subscriptions & Billing</h3><p>Subscriptions renew automatically according to your chosen plan. You can cancel or change your plan at any time with immediate effect from your dashboard without hidden fees.</p><h3>3. Service Availability & Support</h3><p>We strive to maintain 99.9% uptime with 24/7 dedicated customer support to ensure your business operations run smoothly.</p>')
WHERE slug IN ('terms', 'terms-and-conditions')
  AND (title_en IS NULL OR title_en = '' OR content_html_en IS NULL OR content_html_en = '');

-- About Us (about / about-us)
UPDATE content_pages
SET 
  title_en = COALESCE(NULLIF(title_en, ''), 'About MK Whats Platform'),
  content_html_en = COALESCE(NULLIF(content_html_en, ''), '<h2>About MK Whats</h2><p><strong>MK Whats</strong> is the premier WhatsApp Automation & Conversational Commerce platform powered by Gemini AI and Meta Cloud APIs.</p><h3>Our Mission</h3><p>We empower e-commerce merchants, agencies, and businesses to automate 24/7 customer support, capture orders into Google Sheets, manage appointment bookings, and trigger instant Telegram alerts effortlessly.</p>')
WHERE slug IN ('about', 'about-us')
  AND (title_en IS NULL OR title_en = '' OR content_html_en IS NULL OR content_html_en = '');

-- Contact Info (contact_info / contact-us / contact)
UPDATE content_pages
SET 
  title_en = COALESCE(NULLIF(title_en, ''), 'Contact & Support'),
  content_html_en = COALESCE(NULLIF(content_html_en, ''), '<h2>Get in Touch with Our Team</h2><p>Our dedicated support team is available 24/7 to assist you with bot configurations, API connections, and account inquiries.</p><ul><li><strong>Support Email:</strong> support@mkwhats.com</li><li><strong>WhatsApp Support:</strong> Available 24/7 via floating widget</li><li><strong>Coverage:</strong> Serving business clients worldwide</li></ul>')
WHERE slug IN ('contact_info', 'contact-us', 'contact')
  AND (title_en IS NULL OR title_en = '' OR content_html_en IS NULL OR content_html_en = '');
