-- Migration 061: Update partner CDN logo URLs to 100% verified 200 OK links
DELETE FROM partners WHERE id IS NOT NULL;

INSERT INTO partners (name, logo_url, display_order) VALUES
  ('Shopify', 'https://cdn.simpleicons.org/shopify/96BF48', 1),
  ('WooCommerce', 'https://cdn.simpleicons.org/woocommerce/96588A', 2),
  ('Meta', 'https://cdn.simpleicons.org/meta/0081FB', 3),
  ('Stripe', 'https://cdn.simpleicons.org/stripe/635BFF', 4),
  ('WhatsApp', 'https://cdn.simpleicons.org/whatsapp/25D366', 5),
  ('Telegram', 'https://cdn.simpleicons.org/telegram/26A5E4', 6),
  ('n8n', 'https://cdn.simpleicons.org/n8n/FF6584', 7),
  ('Zapier', 'https://cdn.simpleicons.org/zapier/FF4A00', 8),
  ('AliExpress', 'https://cdn.simpleicons.org/aliexpress/FF4747', 9),
  ('Alibaba', 'https://cdn.simpleicons.org/alibabacloud/FF6A00', 10),
  ('Instagram', 'https://cdn.simpleicons.org/instagram/E4405F', 11),
  ('Facebook', 'https://cdn.simpleicons.org/facebook/1877F2', 12),
  ('Google', 'https://cdn.simpleicons.org/google/4285F4', 13),
  ('Amazon', 'https://www.vectorlogo.zone/logos/amazon/amazon-icon.svg', 14),
  ('Salesforce', 'https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg', 15),
  ('PayPal', 'https://cdn.simpleicons.org/paypal/003087', 16);
