-- Migration 045: Update default site_settings partners to 20 valid CDN SVG logos
-- Idempotent update for site_settings (id = 1)

UPDATE site_settings
SET partners = '[
  {"name": "Shopify", "logo_url": "https://cdn.simpleicons.org/shopify/96bf48"},
  {"name": "WooCommerce", "logo_url": "https://cdn.simpleicons.org/woocommerce/96588a"},
  {"name": "Meta", "logo_url": "https://cdn.simpleicons.org/meta/0668E1"},
  {"name": "Stripe", "logo_url": "https://cdn.simpleicons.org/stripe/635BFF"},
  {"name": "WordPress", "logo_url": "https://cdn.simpleicons.org/wordpress/21759B"},
  {"name": "Salesforce", "logo_url": "https://cdn.simpleicons.org/salesforce/00A1E0"},
  {"name": "Zendesk", "logo_url": "https://cdn.simpleicons.org/zendesk/03363D"},
  {"name": "WhatsApp", "logo_url": "https://cdn.simpleicons.org/whatsapp/25D366"},
  {"name": "Telegram", "logo_url": "https://cdn.simpleicons.org/telegram/26A5E4"},
  {"name": "Google", "logo_url": "https://cdn.simpleicons.org/google/4285F4"},
  {"name": "Amazon", "logo_url": "https://cdn.simpleicons.org/amazon/FF9900"},
  {"name": "Microsoft", "logo_url": "https://cdn.simpleicons.org/microsoft/00A4EF"},
  {"name": "PayPal", "logo_url": "https://cdn.simpleicons.org/paypal/003087"},
  {"name": "Mailchimp", "logo_url": "https://cdn.simpleicons.org/mailchimp/FFE01B"},
  {"name": "Zapier", "logo_url": "https://cdn.simpleicons.org/zapier/FF4A00"},
  {"name": "HubSpot", "logo_url": "https://cdn.simpleicons.org/hubspot/FF7A59"},
  {"name": "Slack", "logo_url": "https://cdn.simpleicons.org/slack/4A154B"},
  {"name": "Notion", "logo_url": "https://cdn.simpleicons.org/notion/ffffff"},
  {"name": "TikTok", "logo_url": "https://cdn.simpleicons.org/tiktok/ffffff"},
  {"name": "Instagram", "logo_url": "https://cdn.simpleicons.org/instagram/E4405F"}
]'::jsonb
WHERE id = 1;
