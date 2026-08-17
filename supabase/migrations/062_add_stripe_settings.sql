-- Migration 062: Add Stripe payment gateway settings to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT DEFAULT '';
