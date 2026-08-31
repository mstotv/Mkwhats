-- Migration 081: Update landing page Bento Grid features default content
-- Ensures site_settings.features_content has the rich bilingual Bento Grid structure with badges and layout sizes.

DO $$
BEGIN
  -- Ensure column exists with proper default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'features_content'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN features_content JSONB;
  END IF;

  -- Update existing default value in site_settings if it's using old 1-6 numbered list or empty
  UPDATE site_settings
  SET features_content = '{
    "section_title_ar": "كل ما تحتاجه للتحكم الكامل بـ واتساب",
    "section_title_en": "Everything You Need to Master WhatsApp",
    "section_subtitle_ar": "مجموعة متطورة من الأدوات المصممة لأتمتة وتحليل وتوسيع تجارتك بسهولة تامة.",
    "section_subtitle_en": "A sophisticated suite of tools designed to automate, analyze, and scale your conversational commerce effortlessly.",
    "features": [
      {
        "id": "ai-automation",
        "title_ar": "أتمتة الذكاء الاصطناعي (Gemini AI)",
        "title_en": "Gemini AI Automation",
        "description_ar": "نشر وكلاء محادثة يفهمون السياق والنية بدقة لتقديم ردود طبيعية شبيهة بالبشر على مدار الساعة.",
        "description_en": "Deploy conversational agents that understand context, nuance, and user intent, providing human-like responses 24/7.",
        "icon": "Bot",
        "col_span": "col-span-2",
        "badges": [
          { "text_ar": "Gemini 2.5 & 3.6 Flash نشط", "text_en": "Gemini 2.5 & 3.6 Flash Active", "variant": "pulse" },
          { "text_ar": "نية الشراء: عالية جداً", "text_en": "Intent: Purchase High", "variant": "neutral" }
        ],
        "integrations": []
      },
      {
        "id": "deep-analytics",
        "title_ar": "تحليلات عميقة",
        "title_en": "Deep Analytics",
        "description_ar": "متابعة معدلات التفاعل والتحويل واستهلاك الرسائل الشهرية لحظة بلحظة.",
        "description_en": "Track engagement, conversion rates, and agent performance in real-time.",
        "icon": "BarChart3",
        "col_span": "col-span-1",
        "badges": [],
        "integrations": []
      },
      {
        "id": "targeted-broadcasts",
        "title_ar": "حملات برودكاست موجهة",
        "title_en": "Targeted Broadcasts",
        "description_ar": "إرسال رسائل تسويقية جماعية للجمهور المستهدف بمعدلات آمنة وموثوقة.",
        "description_en": "Send personalized bulk messages to segmented audiences securely.",
        "icon": "Radio",
        "col_span": "col-span-1",
        "badges": [],
        "integrations": []
      },
      {
        "id": "approved-templates",
        "title_ar": "قوالب معتمدة",
        "title_en": "Approved Templates",
        "description_ar": "إنشاء واستخدام قوالب رسائل تفاعلية لتسريع ردود فريق المبيعات.",
        "description_en": "Manage and deploy WhatsApp-approved message templates effortlessly.",
        "icon": "FileText",
        "col_span": "col-span-1",
        "badges": [],
        "integrations": []
      },
      {
        "id": "sheets-telegram-sync",
        "title_ar": "مزامنة Google Sheets و Telegram",
        "title_en": "Google Sheets & Telegram Sync",
        "description_ar": "تسجيل العملاء والطلبات تلقائياً في Google Sheets مع تنبيهات فورية على Telegram لفريقك عند تأكيد الطلب.",
        "description_en": "Automatically log leads into Google Sheets and trigger instant Telegram alerts for your sales team when high-intent actions occur.",
        "icon": "FileSpreadsheet",
        "col_span": "col-span-2",
        "badges": [],
        "integrations": [
          { "title_ar": "Google Sheets", "title_en": "Google Sheets", "status_ar": "● مزامنة فورية", "status_en": "● Auto-Synced" },
          { "title_ar": "Telegram Bot", "title_en": "Telegram Bot", "status_ar": "● تنبيه فوري", "status_en": "● Instant Alert" }
        ]
      }
    ]
  }'::jsonb
  WHERE features_content IS NULL 
     OR jsonb_typeof(features_content) = 'array' 
     OR (features_content->'features') IS NULL;
END $$;
