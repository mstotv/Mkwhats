-- Migration 072: Add user_panel_support_enabled JSONB column to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS user_panel_support_enabled JSONB DEFAULT '{
  "whatsapp": true,
  "telegram": true,
  "email": true
}'::jsonb;
