-- Migration 070: Add Google Auth settings to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS google_auth_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_client_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS google_client_secret TEXT DEFAULT '';
