-- Migration 073: Add bilingual platform_name_ar and platform_name_en to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS platform_name_ar TEXT DEFAULT 'MK Whats',
ADD COLUMN IF NOT EXISTS platform_name_en TEXT DEFAULT 'MK Whats';
