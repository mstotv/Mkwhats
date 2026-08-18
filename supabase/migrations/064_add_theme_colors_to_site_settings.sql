-- Migration 064: Add theme_colors JSONB to site_settings for complete Landing Page theme customization
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '{
  "primary": "#10B981",
  "background": "#020617",
  "card_bg": "#1F2937",
  "text_primary": "#FFFFFF",
  "text_secondary": "#9CA3AF"
}'::jsonb;
