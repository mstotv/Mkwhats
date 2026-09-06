-- Migration 093: Add home_content JSONB column to site_settings and update testimonials schema
-- Gives super admins full CMS control over Home page sections:
-- 1. Pain vs Solution Comparison
-- 2. 4 Value Pillars
-- 3. Interactive ROI Calculator
-- 4. Key Metrics Proof
-- 5. Final CTA Banner
-- 6. Customer & Business Reviews (name, company, stars 1-5, quotes, uploaded photos/logos)

DO $$
BEGIN
  -- 1. Ensure home_content column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'home_content'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN home_content JSONB;
  END IF;

  -- 2. Seed home_content if null or empty
  UPDATE site_settings
  SET home_content = '{
    "comparison": {
      "badge_ar": "التحول الحقيقي لمشروعك",
      "badge_en": "THE ULTIMATE TRANSFORMATION",
      "title_ar": "المقارنة الفاصلة: التجارة التقليدية ضد قوة",
      "title_en": "Old Manual Way vs Powered by",
      "subtitle_ar": "شاهد كيف تلغي أتمتة واتساب والذكاء الاصطناعي كل نقاط الاحتكاك وتحوّل محادثاتك إلى ماكينة مبيعات على مدار 24 ساعة.",
      "subtitle_en": "See how autonomous WhatsApp AI eliminates bottlenecks and turns conversations into an always-on revenue engine.",
      "pain_points": [
        {
          "id": "p-1",
          "title_ar": "زبائن ينتظرون لساعات",
          "title_en": "Customers Wait for Hours",
          "desc_ar": "العميل يغادر إلى المنافس إذا لم تجبه خلال 5 دقائق فقط. تراكم الرسائل يعني خسارة مبيعات مؤكدة.",
          "desc_en": "Leads drop off to competitors if not answered within 5 minutes. Delayed replies mean lost revenue."
        },
        {
          "id": "p-2",
          "title_ar": "سلات متروكة بدون أي متابعة",
          "title_en": "Abandoned Carts Vanish",
          "desc_ar": "زبائن يملؤون السلة ثم يترددون، ولا يوجد نظام آلي يرسل لهم تذكيراً ذكياً مع كود خصم لإتمام الدفع.",
          "desc_en": "Visitors leave checkout without buying. No automated follow-up to nudge them back with quick payment links."
        },
        {
          "id": "p-3",
          "title_ar": "فريق منهك في تكرار نفس الردود",
          "title_en": "Team Burnout Repeating FAQs",
          "desc_ar": "إهدار مئات الساعات في كتابة الأسعار، العنوان، المقاسات، ورقم الحساب بدلاً من التركيز على الصفقات الكبرى.",
          "desc_en": "Hours wasted typing prices, locations, and sizes manually instead of closing high-ticket deals."
        },
        {
          "id": "p-4",
          "title_ar": "فوضى الدفاتر وأخطاء التسجيل",
          "title_en": "Messy Spreadsheets & Lost Data",
          "desc_ar": "ضياع بيانات التوصيل، أخطاء في العناوين، ونقص التواصل بين فريق المبيعات وفريق الشحن والتجهيز.",
          "desc_en": "Missing delivery addresses, shipment mix-ups, and communication breakdown between sales and fulfillment."
        }
      ],
      "solution_points": [
        {
          "id": "s-1",
          "title_ar": "رد فوري ذكي في أقل من 3 ثوانٍ",
          "title_en": "Smart Replies in < 3 Seconds",
          "desc_ar": "ذكاء اصطناعي مدرّب على نشاطك يجيب بلباقة وبلهجة بلدك على مدار 24/7 دون نوم أو تأخير أو إجازات.",
          "desc_en": "AI trained on your catalog responds instantly and politely 24/7, answering questions in native dialects."
        },
        {
          "id": "s-2",
          "title_ar": "استرجاع آلي لـ 30% من السلات",
          "title_en": "Recover 30% of Abandoned Carts",
          "desc_ar": "إرسال تذكيرات مخصصة عبر واتساب برابط دفع بنقرة واحدة تستعيد مبيعاتك الضائعة وتضاعف أرباحك.",
          "desc_en": "Automated high-converting WhatsApp recovery pings with 1-click checkout links to recapture lost revenue."
        },
        {
          "id": "s-3",
          "title_ar": "استلام الطلبات والمواعيد وتنبيه تيليجرام",
          "title_en": "Auto Order Intake & Telegram Alerts",
          "desc_ar": "جمع تفاصيل الطلب أو الموعد خطوة بخطوة وإرسال إشعار فوري لفريق التجهيز على تيليجرام لحظياً.",
          "desc_en": "AI collects item, size, and address specs, then instantly notifies your fulfillment group on Telegram."
        },
        {
          "id": "s-4",
          "title_ar": "مزامنة سحابية مع Google Sheets وإكسل",
          "title_en": "Instant Cloud Sync to Google Sheets",
          "desc_ar": "كل طلب أو استفسار يوثّق تلقائياً في جداول بيانات منظمة مع تفاصيل العميل بدون أي تدخل بشري.",
          "desc_en": "Every lead and order logged cleanly to your Google Sheets with full buyer contact attributes automatically."
        }
      ]
    },
    "pillars": {
      "badge_ar": "محركات القيمة والنمو",
      "badge_en": "4 CORE VALUE PILLARS",
      "title_ar": "أربعة محركات ذكية تُحدث نقلة نوعية في",
      "title_en": "Four Intelligent Engines Transforming Your",
      "subtitle_ar": "صُممت المنصة لتعالج الفجوات التي تستنزف وقتك وتُفقدك العملاء، وتحولها إلى نقاط قوة تنافسية.",
      "subtitle_en": "Engineered specifically to solve high-leakage bottlenecks in modern conversational commerce.",
      "items": [
        {
          "id": "speed",
          "visible": true,
          "badge_ar": "السرعة الفائقة",
          "badge_en": "Lightning Speed",
          "title_ar": "السرعة التي تغلق الصفقات قبل المنافسين",
          "title_en": "Close Deals Before Competitors Even Reply",
          "desc_ar": "78% من المشترين يشترون من أول نشاط يجيبهم على واتساب. ذكاء اصطناعي فوري يجيب بأقل من 3 ثوانٍ على الأسعار، المقاسات، والعروض ويحوّل الاستفسار إلى شراء حقيقي.",
          "desc_en": "78% of buyers purchase from the vendor who answers first. Autonomous AI replies in < 3 seconds with exact product details and closes orders on the spot.",
          "highlights_ar": ["رد ذكي فوري 24/7 دون توقف", "تأكيد وحجز المواعيد والطلبات", "إشعارات تيليجرام فورية لفريقك"],
          "highlights_en": ["24/7 instant response engine", "Automated order & booking confirmation", "Instant Telegram team notifications"],
          "icon": "Zap",
          "accent": "amber"
        },
        {
          "id": "recovery",
          "visible": true,
          "badge_ar": "استرداد الأرباح",
          "badge_en": "Revenue Recovery",
          "title_ar": "استرجع 30% من السلات المتروكة تلقائياً",
          "title_en": "Recover 30% of Abandoned Carts Automatically",
          "desc_ar": "لا تدع الزبائن يغادرون متجرك الإلكتروني دون شراء. روبوت المتابعة يرسل رسائل واتساب ذكية في التوقيت المثالي مع كود خصم ورابط دفع فوري يعيد الزبون لإتمام الدفع.",
          "desc_en": "Never let shoppers slip away. Timed WhatsApp nudges with personalized discount codes and 1-click checkout URLs bring buyers back to complete payment.",
          "highlights_ar": ["ربط مباشر مع WooCommerce & Shopify", "روابط دفع بنقرة واحدة سريعة", "متابعات ذكية مدروسة بدون إزعاج"],
          "highlights_en": ["WooCommerce & Shopify 2-way sync", "1-click checkout recovery links", "Anti-spam intelligent follow-up cadence"],
          "icon": "ShoppingBag",
          "accent": "emerald"
        },
        {
          "id": "voice",
          "visible": true,
          "badge_ar": "ذكاء صوتي متقدم",
          "badge_en": "Voice AI Intelligence",
          "title_ar": "يفهم الرسائل الصوتية واللهجات كأفضل بائع",
          "title_en": "Understands Voice Notes in Local Dialects",
          "desc_ar": "أغلب عملاء الخليج والعالم العربي يفضلون إرسال الفويس نوت. نموذجنا الصوتي المتقدم يستمع للرسائل الصوتية ويفهم طلبات العملاء بدقة ويجيبهم بصوت طبيعي أو نصوص متقنة.",
          "desc_en": "Customers love voice notes. Our advanced Speech-to-Text model transcribes audio in real-time, extracts purchase intent across dialects, and replies autonomously.",
          "highlights_ar": ["تفريغ وفهم فوري للفويس نوت", "دعم مختلف اللهجات العربية والإنجليزية", "استخراج المنتجات والعناوين من الصوت"],
          "highlights_en": ["Instant audio transcription & intent extraction", "Full Arabic dialects & English support", "Extracts items and addresses directly from audio"],
          "icon": "Mic",
          "accent": "purple"
        },
        {
          "id": "biolink",
          "visible": true,
          "badge_ar": "هوية رقمية متكاملة",
          "badge_en": "Digital Identity Studio",
          "title_ar": "حوّل زوار انستغرام وتيك توك مباشرة لواتساب",
          "title_en": "Convert Social Media Traffic Straight to WhatsApp",
          "desc_ar": "صفحة بايو لينك احترافية بنطاق فرعي مخصص بهويتك (yourname.domain). استعرض منتجاتك، روابطك، وبطاقات الصور المستقلة مع أزرار محادثة واتساب المباشرة وتحليلات حية.",
          "desc_en": "A high-converting bio link profile on your own custom subdomain (yourname.domain). Showcase offers, social links, and decoupled image cards with instant WhatsApp chat buttons.",
          "highlights_ar": ["نطاق فرعي مخصص باسم علامتك التجارية", "بطاقات منتجات وروابط مخصصة وصور متعددة", "عداد زيارات ونقرات مباشر وفائق الدقة"],
          "highlights_en": ["Custom branded subdomains", "Product cards, social links & image showcases", "Real-time click & visitor analytics"],
          "icon": "Globe",
          "accent": "cyan"
        }
      ]
    },
    "roi_calculator": {
      "badge_ar": "حاسبة العائد الاستثماري التفاعلية",
      "badge_en": "INTERACTIVE ROI CALCULATOR",
      "title_ar": "كم ستربح وتوفر مع",
      "title_en": "Calculate Your Revenue & Hours with",
      "subtitle_ar": "حرّك المؤشر بحسب حجم رسائل نشاطك التجاري شهرياً، واكتشف حجم الساعات والمبيعات المستردة فورياً.",
      "subtitle_en": "Adjust the slider according to your monthly chat volume and see the immediate time and revenue impact.",
      "default_messages": 3000,
      "default_aov": 35,
      "cta_text_ar": "ابدأ توفير وقتك ومضاعفة مبيعاتك الآن",
      "cta_text_en": "Start Saving Time & Scaling Sales Today",
      "cta_url": "/signup"
    },
    "metrics_proof": {
      "badge_ar": "أرقام وإحصائيات تتحدث عن نفسها",
      "badge_en": "PROVEN IMPACT BY THE NUMBERS",
      "title_ar": "لماذا تحقق المنصات المعتمدة على واتساب نمواً قياسياً؟",
      "title_en": "Why WhatsApp Automation Multiplies Conversions",
      "metrics": [
        {
          "id": "m-1",
          "visible": true,
          "value": "98%",
          "title_ar": "معدل فتح رسائل واتساب",
          "title_en": "WhatsApp Open Rate",
          "desc_ar": "مقارنة بـ 20% فقط لرسائل البريد الإلكتروني، مما يضمن وصول عروضك لكل عميل.",
          "desc_en": "Compared to just 20% for email newsletters, ensuring your message is actually read.",
          "color": "emerald"
        },
        {
          "id": "m-2",
          "visible": true,
          "value": "< 3s",
          "title_ar": "متوسط سرعة الرد اللحظي",
          "title_en": "Instant Response Time",
          "desc_ar": "رد ذكي على مدار 24/7 دون أي تأخير يجعل العميل يشتري قبل أن يذهب للمنافسين.",
          "desc_en": "24/7 round-the-clock replies keeping hot leads engaged while intent is highest.",
          "color": "amber"
        },
        {
          "id": "m-3",
          "visible": true,
          "value": "+35%",
          "title_ar": "استرداد مبيعات السلات المتروكة",
          "title_en": "Recovered Cart Revenue",
          "desc_ar": "متابعات ذكية مدروسة تعيد العملاء المترددين لإتمام الدفع بروابط سريعة بنقرة واحدة.",
          "desc_en": "Recaptures high-intent shoppers who dropped off at checkout with 1-click links.",
          "color": "teal"
        },
        {
          "id": "m-4",
          "visible": true,
          "value": "100%",
          "title_ar": "بدون أي كود أو خبرة برمجية",
          "title_en": "Zero-Code Setup",
          "desc_ar": "ربط مباشر بمسح QR أو Cloud API جاهز للعمل فوراً وبخطوات واضحة وبسيطة.",
          "desc_en": "Plug-and-play setup via simple QR code scan or official Meta Cloud API.",
          "color": "purple"
        }
      ]
    },
    "final_cta": {
      "badge_ar": "ابدأ الآن بدون أي مخاطرة",
      "badge_en": "RISK-FREE SETUP IN 60 SECONDS",
      "title_ar": "جاهز لتحويل محادثاتك إلى مبيعات وأرباح مستمرة؟",
      "title_en": "Ready to Turn WhatsApp Chats into Compounding Revenue?",
      "subtitle_ar": "انضم إلى مئات المتاجر والشركات التي تضاعف مبيعاتها وتوفر مئات الساعات شهرياً بفضل أتمتة واتساب والذكاء الاصطناعي.",
      "subtitle_en": "Join ambitious founders and teams scaling their conversational sales and eliminating manual busywork with autonomous WhatsApp AI.",
      "primary_btn_text_ar": "أنشئ حسابك المجاني في دقيقة 🚀",
      "primary_btn_text_en": "Start Your Free Account Now 🚀",
      "primary_btn_url": "/signup",
      "secondary_btn_text_ar": "استكشف كافة المميزات والقدرات التقنية",
      "secondary_btn_text_en": "View Full Technical Features",
      "secondary_btn_url": "/features",
      "perks_ar": ["خطة مجانية بدون بطاقة بنكية", "إعداد في أقل من دقيقة", "دعم فني وتيليجرام مباشر"],
      "perks_en": ["Free tier, no card required", "Setup in under 60 seconds", "Live Telegram & WhatsApp support"]
    }
  }'::jsonb
  WHERE home_content IS NULL;

  -- 3. Upgrade testimonials to enriched bilingual schema with company, image_url, and star rating if needed
  UPDATE site_settings
  SET testimonials = '[
    {
      "id": "1",
      "visible": true,
      "name_ar": "عبدالرحمن الشهري",
      "name_en": "Abdulrahman Al-Shehri",
      "role_ar": "مؤسس متجر أزياء وعطور (Shopify)",
      "role_en": "Founder, Fashion & Fragrances Brand",
      "quote_ar": "كنا نخسر ما لا يقل عن 25 سلة متروكة يومياً بسبب انشغال موظفي خدمة العملاء. بعد ربط MK Whats مع شوبيفاي، أصبح استرجاع السلات يتم تلقائياً عبر واتساب وزادت مبيعاتنا بنسبة 32% في أول شهر!",
      "quote_en": "We were losing dozens of abandoned carts daily because reps were busy. With MK Whats Shopify integration, recovery is fully automated on WhatsApp and our sales spiked 32% in month one!",
      "stars": 5,
      "avatar_initial": "🛍️",
      "image_url": ""
    },
    {
      "id": "2",
      "visible": true,
      "name_ar": "د. ياسمين القحطاني",
      "name_en": "Dr. Yasmeen Al-Qahtani",
      "role_ar": "مديرة مركز عيادات أسنان وتجميل",
      "role_en": "Managing Director, Dental & Aesthetic Clinics",
      "quote_ar": "الميزة الذهبية بالنسبة لنا هي تفريغ وفهم الرسائل الصوتية (Voice STT) وحجز المواعيد. المريض يرسل فويس نوت بلهجته، والذكاء الاصطناعي يفهمه ويحجز له الموعد ويرسل تفاصيل الحجز للطبيب على تيليجرام فورياً.",
      "quote_en": "The Voice STT feature is pure magic. Patients send voice notes in local dialect, AI transcribes, coordinates available doctor slots, and pings our team on Telegram instantly.",
      "stars": 5,
      "avatar_initial": "🩺",
      "image_url": ""
    },
    {
      "id": "3",
      "visible": true,
      "name_ar": "م. طارق منصور",
      "name_en": "Eng. Tareq Mansour",
      "role_ar": "صاحب سلسلة مقاهي ومحامص مختصة",
      "role_en": "Co-Founder, Specialty Coffee Roasters",
      "quote_ar": "صفحة البايو لينك بالسابدومين الخاص بنا غيرت طريقة استقبالنا للطلبات من انستغرام وتيك توك. الزائر يضغط على المنتج ويفتح واتساب مباشرة مع مواصفات طلبه وموقعه دون تعقيد.",
      "quote_en": "The custom subdomain Bio Link transformed how we capture orders from Instagram and TikTok. Customers click the item card and land directly in WhatsApp with their exact order ready.",
      "stars": 5,
      "avatar_initial": "☕",
      "image_url": ""
    }
  ]'::jsonb
  WHERE testimonials IS NULL OR jsonb_array_length(testimonials) = 0;

END $$;
