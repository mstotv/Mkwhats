-- Migration 061: Seed giant global partners into public.partners table
INSERT INTO public.partners (name, logo_url, display_order)
VALUES
  ('Shopify', 'https://cdn.simpleicons.org/shopify/96bf48', 1),
  ('WooCommerce', 'https://cdn.simpleicons.org/woocommerce/96588a', 2),
  ('Meta', 'https://cdn.simpleicons.org/meta/0668E1', 3),
  ('Stripe', 'https://cdn.simpleicons.org/stripe/635BFF', 4),
  ('WhatsApp', 'https://cdn.simpleicons.org/whatsapp/25D366', 5),
  ('Telegram', 'https://cdn.simpleicons.org/telegram/26A5E4', 6),
  ('Google', 'https://cdn.simpleicons.org/google/4285F4', 7),
  ('Amazon', 'https://cdn.simpleicons.org/amazon/FF9900', 8),
  ('Salesforce', 'https://cdn.simpleicons.org/salesforce/00A1E0', 9),
  ('PayPal', 'https://cdn.simpleicons.org/paypal/003087', 10)
ON CONFLICT DO NOTHING;
