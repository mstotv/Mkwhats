-- Migration 071: Extend site_settings for Landing Page Header, Footer, and Floating Support Buttons
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS header_links JSONB DEFAULT '[
  {"label": "الرئيسية", "url": "#hero"},
  {"label": "المميزات", "url": "#features"},
  {"label": "الباقات", "url": "#pricing"},
  {"label": "الأسئلة الشائعة", "url": "#faq"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '[
  {"label": "الشروط والأحكام", "url": "/terms"},
  {"label": "سياسة الخصوصية", "url": "/privacy"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS support_whatsapp TEXT DEFAULT '+966500000000',
ADD COLUMN IF NOT EXISTS support_telegram TEXT DEFAULT 'mkwhats_support',
ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@mkwhats.com',
ADD COLUMN IF NOT EXISTS support_floating_enabled JSONB DEFAULT '{
  "whatsapp": true,
  "telegram": true,
  "email": true
}'::jsonb;
