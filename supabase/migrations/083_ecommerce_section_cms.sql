-- Migration 083: Add ecommerce_content JSONB column to site_settings with full bilingual defaults
-- Enables full CMS control over E-Commerce header, store cards, 3D notification mockup cards, CTA, and metrics row from admin panel.

DO $$
BEGIN
  -- Ensure column exists with proper JSONB type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'ecommerce_content'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN ecommerce_content JSONB;
  END IF;

  -- Update existing site_settings with rich default content if null or empty
  UPDATE site_settings
  SET ecommerce_content = '{
    "badge_text_ar": "ربط المتاجر الإلكترونية الذكي",
    "badge_text_en": "E-COMMERCE & STORE INTEGRATION",
    "headline_ar": "ضاعف مبيعات متجرك مع",
    "headline_highlight_ar": "ووكومرس وشوبيفاي",
    "headline_en": "Scale Your Store with",
    "headline_highlight_en": "WooCommerce & Shopify",
    "subtitle_ar": "اربط متجرك بضغطة زر واحدة وبدون أي خبرة برمجية. أرسل إشعارات تأكيد الطلبات وتتبع الشحنات فورياً، واستعد حتى 30% من السلات المتروكة تلقائياً عبر واتساب.",
    "subtitle_en": "Connect your online store in seconds with zero code. Send instant order confirmations, live shipping updates, and automatically recover up to 30% of abandoned carts directly on WhatsApp.",
    "cta_text_ar": "اربط متجرك الآن مجاناً",
    "cta_text_en": "Connect Your Store Now",
    "cta_url": "/settings?tab=integrations",
    "cta_visible": true,
    "store_cards": [
      {
        "id": "woocommerce",
        "visible": true,
        "order": 1,
        "store_name": "WooCommerce",
        "api_badge": "REST API & Webhooks",
        "accent_color": "purple",
        "subtitle_ar": "ربط مباشر لجميع متاجر ووردبريس",
        "subtitle_en": "Direct integration for WordPress stores",
        "status_badge_ar": "ربط فوري متاح",
        "status_badge_en": "1-Click Connect",
        "features": [
          { "id": "wc-1", "text_ar": "تأكيد الطلبات الجديدة لحظياً (Order Created)", "text_en": "Instant new order confirmation alerts" },
          { "id": "wc-2", "text_ar": "استرجاع السلات المتروكة برابط دفع مباشر", "text_en": "Abandoned cart recovery with 1-click URL" },
          { "id": "wc-3", "text_ar": "تحديثات الشحن والدفع (Order Status Sync)", "text_en": "Live shipping and payment status updates" },
          { "id": "wc-4", "text_ar": "إنشاء جهات الاتصال ومزامنتها تلقائياً", "text_en": "Auto CRM contact creation & tagging" }
        ]
      },
      {
        "id": "shopify",
        "visible": true,
        "order": 2,
        "store_name": "Shopify",
        "api_badge": "Admin API & Webhooks",
        "accent_color": "emerald",
        "subtitle_ar": "ربط سحابي فائق السرعة لمتاجر شوبيفاي",
        "subtitle_en": "High-speed cloud connection for Shopify",
        "status_badge_ar": "ربط فوري متاح",
        "status_badge_en": "1-Click Connect",
        "features": [
          { "id": "sh-1", "text_ar": "إشعارات الطلبات والدفع (Order Creation & Paid)", "text_en": "Live order & payment notifications" },
          { "id": "sh-2", "text_ar": "استعادة عمليات الدفع المتروكة (Abandoned Checkouts)", "text_en": "Recover abandoned checkouts automatically" },
          { "id": "sh-3", "text_ar": "إرسال باركود التتبع فور تنفيذ الطلب (Fulfillment)", "text_en": "Instant tracking barcode & fulfillment alert" },
          { "id": "sh-4", "text_ar": "تأمين كامل وتشفير الـ Webhook Secrets", "text_en": "Secure HMAC payload verification" }
        ]
      }
    ],
    "notification_cards": [
      {
        "id": "notif-top",
        "position": "top",
        "customer_name_ar": "إيميلي",
        "customer_name_en": "Emily",
        "title_ar": "تم شحن الطلب #10495",
        "title_en": "Order #10495 Dispatched",
        "body_ar": "تم تسليم الشحنة لشركة النقل DHL Express.",
        "body_en": "Your package is on its way with DHL Express.",
        "timestamp_ar": "منذ دقيقة",
        "timestamp_en": "1m ago",
        "product_image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=120&auto=format&fit=crop&q=80"
      },
      {
        "id": "notif-hero",
        "position": "hero",
        "customer_name_ar": "سارة",
        "customer_name_en": "Sarah",
        "title_ar": "تم تأكيد الطلب #10482",
        "title_en": "Order #10482 Confirmed",
        "body_ar": "شحنتك في الطريق. موعد التوصيل المتوقع: غداً.",
        "body_en": "Your order is In Transit. Estimated delivery: Tomorrow.",
        "timestamp_ar": "الآن",
        "timestamp_en": "now",
        "product_image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&auto=format&fit=crop&q=80"
      },
      {
        "id": "notif-bottom",
        "position": "bottom",
        "customer_name_ar": "محمد",
        "customer_name_en": "Michael",
        "title_ar": "تم تجهيز الطلب #10468",
        "title_en": "Order #10468 Packed",
        "body_ar": "تم تغليف طلبك بنجاح وجاري إرسال رقم التتبع.",
        "body_en": "Your parcel is packed and ready for carrier pickup.",
        "timestamp_ar": "منذ ٣ دقائق",
        "timestamp_en": "3m ago",
        "product_image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80"
      }
    ],
    "metrics": [
      {
        "id": "metric-1",
        "visible": true,
        "value": "+30%",
        "title_ar": "استعادة مبيعات السلات المتروكة",
        "title_en": "Cart Abandonment Recovery",
        "description_ar": "إعادة استهداف ذكية لزبائن الـ Checkout قبل مغادرة المتجر",
        "description_en": "Re-engage checkout drop-offs with timed WhatsApp nudges",
        "color": "primary"
      },
      {
        "id": "metric-2",
        "visible": true,
        "value": "< 1 sec",
        "title_ar": "سرعة إرسال الإشعار فور الشراء",
        "title_en": "Zero-Latency Live Webhooks",
        "description_ar": "وصول رسالة تأكيد الطلب للزبون فور إتمام الدفع بالثواني",
        "description_en": "Instant delivery receipt as soon as the order is placed",
        "color": "purple"
      },
      {
        "id": "metric-3",
        "visible": true,
        "value": "100% No-Code",
        "title_ar": "ربط مباشر وسهل بدون برمجة",
        "title_en": "Zero Coding Setup",
        "description_ar": "خطوات واضحة بالصور في لوحة التحكم للربط خلال دقيقتين",
        "description_en": "Plug-and-play API keys with visual setup walkthrough",
        "color": "emerald"
      }
    ]
  }'::jsonb
  WHERE ecommerce_content IS NULL;
END $$;
