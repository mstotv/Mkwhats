-- ============================================================
-- Migration 088: Add favicon_url column to site_settings
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Update default platform_name if it was still the old 'wacrm'
UPDATE public.site_settings
SET platform_name = 'mkwacrm'
WHERE id = 1 AND (platform_name = 'wacrm' OR platform_name IS NULL);
