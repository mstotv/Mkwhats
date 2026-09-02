# حالة المشروع - آخر تحديث: [1/9/2026]

> ⚠️ **قاعدة معمارية ثابتة ودائمة (Plan Features Global Sync Rule):**
> أي ميزة برمجية جديدة تضاف أو تُعدل في منظومة الباقات بالـ Admin Panel (`plans.features`) يجب **إلزامياً** أن تنعكس وتُعرض متزامنة في كافة واجهات المنصة التالية في آن واحد:
> 1. **صفحة الهبوط وجدول الأسعار العام (Landing Page & `/pricing`):** عبر [`landing-pricing.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-pricing.tsx).
> 2. **لوحة تحكم المستخدم وإدارة الخطة (User Panel Settings):** عبر [`plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx).
> 3. **نافذة ترقية وتغيير الباقة للمستخدم (Upgrade Plan Modal):** عبر [`upgrade-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/upgrade-plan-modal.tsx).
> 4. **لوحة تحكم الأدمن لإنشاء وتعديل الباقات (Admin Pricing Manager):** عبر [`plans/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/plans/page.tsx) و [`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx).

- ✅ **إصلاح مشكلة تعذر تشغيل الصوت (Audio unavailable) وتفريغ رسائل الواتساب الصوتية عبر Gemini**:
  - **تضمين الرسائل الصوتية في سياق محادثات الذكاء الاصطناعي ([`context.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/context.ts))**:
    - إزالة حصر استعلام سياق المحادثة على `content_type = 'text'` وتضمين كافة الرسائل ذات المحتوى النصي (`content_text`) بما فيها الرسائل الصوتية المفرغة، مما يضمن وصول الرسالة الصوتية كـ `user` في سياق المحادثة للـ AI فوراً دون تجاهلها.
  - **تحصين ترتيب أدوار المحادثة في Google Gemini ([`gemini.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/providers/gemini.ts))**:
    - ضبط مصفوفة `contents` لتتناوب الأدوار وتبدأ وتنتهي دائماً بـ `role: 'user'`، مما يمنع حدوث أخطاء `400 Bad Request` عند وجود ردود متتالية أو عدم وصول رد جديد.
  - **ترجمة مفاتيح مشغل الصوت في الصندوق الوارد ([`messages/en.json`](file:///c:/Users/Mustafa/Desktop/mk%20whats/messages/en.json) & [`messages/ar.json`](file:///c:/Users/Mustafa/Desktop/mk%20whats/messages/ar.json))**:
    - إضافة مساحة التسمية `Inbox.bubble` بالكامل بما فيها `voiceNote` لمنع ظهور النصوص المفتاحية الخام.
  - **تنظيف نوع الوسائط قبل الرفع لـ Supabase Storage ([`evolution/webhook/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/evolution/webhook/route.ts))**:
    - تنظيف الـ `mimetype` المرفق مع رسائل الصوت المشفرة (`audio/ogg; codecs=opus`) ليصبح `audio/ogg` متوافقاً مع أنواع الوسائط المسموح بها في حاوية `chat-media`، مما يحل خطأ الرفع `415 Unsupported Media Type` ويضمن تخزين الرابط الدائم `media_url`.
  - **تحديث موديل Gemini STT ودعم الـ Fallbacks الآمنة ([`stt.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/voice/stt.ts))**:
    - معالجة خطأ `404` عبر التبديل للموديل القياسي السريع `gemini-2.0-flash` مع دعم الموديل المختار في إعدادات الحساب وتضمين قائمة مرنة من الموديلات البديلة (`gemini-2.5-flash`, `gemini-1.5-flash-latest`).
  - **إلزامية تضمين `base64: true` عند تسجيل الـ Webhook ([`evolution-api.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/whatsapp/evolution-api.ts))**:
    - إضافة `base64: true` في دالة `setEvolutionWebhook` لضمان وصول ملفات الصوت والوسائط مباشرة مع أحداث الـ Webhook من خادم Evolution دون الحاجة لطلبات جلب منفصلة.
  - **مشغل الصوت الآمن في المحادثات ([`message-bubble.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/inbox/message-bubble.tsx))**:
    - بناء مكون `MediaAudio` لدعم جلب وتشغيل ملفات الصوت عبر Blob URLs مع تفادي قيود الـ CORS وتوفير تجربة تشغيل سلسة عبر جميع المتصفحات.

- ✅ **إصلاح وتحديث واجهة ربط الواتساب وتأمين استقبال رسائل Evolution API (WhatsApp Connection UI & Evolution Webhook Reliability)**:
  - **إعادة تصميم وتحديث ألوان واجهة الربط ([`whatsapp-config.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/whatsapp-config.tsx))**:
    - استبدال التنسيقات والخلفيات الباهتة بتصميم زجاجي عصري شديد النقاء بتباين لوني عالي في الوضعين الفاتح والداكن (Light & Dark Themes).
    - تحسين شارة طريقة الربط النشطة، وتنبيهات الاتصال الناجح، وبطاقة الجاهزية الخضراء، وصندوق تلميح تحديث رمز الـ QR.
  - **تأمين واستقبال رسائل Evolution API بالكامل ([`evolution/webhook/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/evolution/webhook/route.ts))**:
    - معالجة تحقق الـ Webhook حتى لا يتم رفض رسائل خادم Evolution بـ `401 Unauthorized` عندما يُرسل الخادم الأحداث بدون ترويسة `apikey` مخصصة، مع التحقق الأمني من تسجيل ومعرف الـ Instance في قاعدة البيانات.
    - دعم واستخراج كافة هياكل الرسائل الواردة من Baileys بما فيها الرسائل المؤقتة (Ephemeral Messages)، والرسائل التفاعلية، والرسائل الصوتية.
  - **إلغاء قيود نافذة الـ 24 ساعة لربط Evolution بالـ Inbox ([`inbox/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/inbox/page.tsx) & [`message-thread.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/inbox/message-thread.tsx))**:
    - قيود الـ 24 ساعة وقوالب Meta تطبق حصرياً على الـ Cloud API الرسمي؛ تم تمكين الإرسال والرد المباشر بدون أي حظر عند استخدام ربط Evolution (QR Code).
  - **طبقة المحول الصوتي المستقلة بالكامل (Isolated Input Adapter Layer - [`src/lib/ai/voice/stt.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/voice/stt.ts))**:
    - بناء موديول معزول تماماً لا يمس منطق الـ AI Core ولا يعيد هيكلته.
    - دعم التفريغ الصوتي التلقائي عبر **OpenAI Whisper API (`whisper-1`)** لمستخدمي OpenAI وعبر **Google Gemini Multimodal Audio (`gemini-1.5-flash`)** لمستخدمي Gemini باستخدام مفتاح الحساب المشفر نفسه بأمان تام.
    - حماية صارمة وسرية تامة للسجلات (Safe Logging): حجب وإخفاء أي مفاتيح API أو Bearer tokens أو نصوص حساسة في الـ Logs عند حدوث أي خطأ، مع تفادي إرسال أي ردود عشوائية أو خاطئة للعميل عند تعذر التفريغ.
  - **التكامل مع الـ Webhooks وقنوات الواتساب ([`webhook/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/webhook/route.ts) & [`evolution/webhook/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/evolution/webhook/route.ts))**:
    - تحميل ملف الصوت وتفريغه في الخلفية غير المتزامنة داخل `after()` دون تأخير استجابة `200 OK` السريعة لميتا أو Evolution API.
    - حفظ النص المفرغ في عمود `transcribed_text` وتحديث `content_text` في جدول `messages` ليمر بسلاسة كرسالة نصية طبيعية إلى محرك الـ Flows، والأتمتة، والرد الذكي، ونظام جمع الطلبات، وحجز المواعيد.
  - **التحكم الشامل للأدمن في الباقات ومزامنة العرض عبر كافة الواجهات (Admin SaaS Plan-Gated Entitlements & Universal Sync)**:
    - **صفحة إدارة الباقات للأدمن ([`src/app/admin/plans/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/plans/page.tsx))**: إضافة خيار ومفتاح ميزة `🎙️ فهم الصوت (Voice STT)` في نموذج إنشاء باقة جديدة، ودرج تعديل الباقات، وبطاقات استعراض الباقات الحالية.
    - **نافذة تعديل الباقات السريعة ([`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx))**: تزويدها بمفتاح تبديل مخصص مع أيقونة الميكروفون `Mic`.
    - **جدول أسعار صفحة الهبوط وصفحة التسعير العامة ([`landing-pricing.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-pricing.tsx))**: إظهار ميزة `🎙️ فهم وتفريغ الرسائل الصوتية (Voice STT)` للزوار مع علامة الصح الخضراء أو خط الحجب بحسب الخطة.
    - **بطاقات الباقات ونافذة الترقية للمستخدمين ([`plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx) & [`upgrade-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/upgrade-plan-modal.tsx))**: إظهار شارة وحالة توفر ميزة تفريغ الصوت في مقارنات الخطط.
    - **التحقق البرمجي التلقائي ([`check-usage-limit.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/plans/check-usage-limit.ts))**: فحص صلاحيات الحساب آلياً عبر `checkAccountFeature(accountId, 'voice_transcription')`.
  - **لوحة تحكم إعدادات الذكاء الاصطناعي والتفاعل الفوري ([`ai-config.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/ai-config.tsx) & [`ai/config/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/ai/config/route.ts))**:
    - تزويد مفاتيح التحكم (تفعيل المساعد، الرد التلقائي، تفريغ الصوت) بدالة **`handleQuickToggle`** لتحديث وحفظ الحالة فورياً في قاعدة البيانات بمجرد النقر عليها، مع إشعارات تأكيد فورية (`Toast`) دون الحاجة للنزول لأسفل الصفحة والضغط على حفظ يدوي.
    - إضافة مفتاح مخصص: "🎙️ فهم الرسائل الصوتية وتفريغها (Voice STT)".
  - **عرض التفريغ الصوتي في صندوق الوارد ([`message-bubble.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/inbox/message-bubble.tsx))**:
    - إظهار النص المفرغ بتصميم راقٍ ومريح للموظفين أسفل مشغل الصوت للرسائل الصوتية مع وسم `📝 تفريغ صوتي`.
  - **قواعد البيانات واجتياز الاختبارات الكاملة بنسبة 100% ([`084_voice_transcription_and_plan_features.sql`](file:///c:/Users/Mustafa/Desktop/mk%20whats/supabase/migrations/084_voice_transcription_and_plan_features.sql) & [`stt.test.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/voice/stt.test.ts))**:
    - إنشاء مايقريشن 084 المتوافق مع معايير الـ Multi-Tenancy و Row Level Security (RLS).
    - اجتياز **100% من الاختبارات الآلية (670 من أصل 670 اختباراً عبر 70 ملف اختبار)** دون أي كسر لأي وظيفة سابقة.


- ✅ **إضافة زر تسجيل الدخول (Login / Sign In) وإزالة زر (Watch Live Demo) من صفحة الهبوط (Landing Page Hero, Navbar & CMS)**:
  - **قسم البطل الرئيسي ([`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx))**:
    - إضافة زر ثانوي راقٍ بتصميم زجاجي ناعم `تسجيل الدخول / Login` بجانب زر البدء `Get Started Free / ابدأ مجاناً الآن`.
    - ربط الزر مباشرة بمسار تسجيل الدخول [`/login`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(auth)/login/page.tsx) مع أيقونة `LogIn`، وإخفاؤه تلقائياً عند تسجيل دخول المستخدم وتوجيه الزر الأساسي إلى `/dashboard`.
    - الإزالة التامة والدائمة لأي إشارة أو زر قديم لـ `Watch Live Demo` / `شاهد العرض التوضيحي`.
  - **شريط التنقل العلوي وقائمة الجوال ([`landing-navbar.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-navbar.tsx))**:
    - إضافة خيار ورابط `Sign In` / `تسجيل الدخول` في الهيدر المكتبي (Desktop Header).
    - إضافة زر `تسجيل الدخول` داخل القائمة المنسدلة للهواتف الذكية (Mobile Navigation Drawer) لتسهيل دخول الزوار المسجلين من جميع الأجهزة.
  - **لوحة تحكم الأدمن والـ CMS وقاعدة البيانات ([`landing-settings-client.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/landing-settings-client.tsx) & [`settings/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/settings/page.tsx))**:
    - تحديث النصوص الافتراضية للزر الثانوي والحقول التوضيحية في الـ CMS لتكون `تسجيل الدخول` و `Login`.
    - تحديث سجل `site_settings` في قاعدة البيانات لضمان ثبات النص الجديد وعدم ارتداده للقيم القديمة.

- ✅ **التدقيق الأمني الشامل وتعزيز حماية الـ Webhooks والحزم (Comprehensive Security Audit & Webhook Hardening)**:
  - **حماية وتحصين الـ Webhooks للمتاجر ([`shopify/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/webhooks/shopify/route.ts) & [`woocommerce/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/webhooks/woocommerce/route.ts))**:
    - إلزامية وجود ترويسة التوقيع المشفر (`x-shopify-hmac-sha256` / `x-wc-webhook-signature`) عند تكوين مفتاح الـ Webhook Secret ورفض أي طلبات غير موقعة مع تسجيل تحذير أمني `401 Unauthorized`.
  - **معالجة ثغرات الحزم البرمجية (Dependency Hardening)**:
    - تنفيذ `npm audit fix` لتحديث الحزم المصابة وإغلاق الثغرات الأمنية للتبعيات غير المتعارضة بأمان تام.
  - **اجتياز كامل منظومة الاختبارات الآلية (Automated Test Suite Coverage)**:
    - تشغيل واجتياز **100% من الاختبارات الآلية (665 من أصل 665 اختباراً في 69 ملف اختبار)** بما فيها اختبارات التشفير، عزل البيانات (Multi-Tenancy)، منع الـ SSRF، وحدود الاستهلاك (Rate Limits).

- ✅ **إعادة تصميم وتحديث منظومة الباقات والاشتراكات والمزامنة الفورية (SaaS Plans Ecosystem, Live Sync & Luxury UI Redesign)**:
  - **التصميم العصري والفاخر لبطاقات الباقات ([`plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx))**:
    - التخلص التام من الصناديق والمربعات الرمادية المكدسة (Blocky UI) واستبدالها بتصميم زجاجي رشيق وفخم مستوحى من واجهات كبرى شركات الـ SaaS العالمية (Stripe / Linear / Vercel).
    - تحويل الحدود التشغيلية إلى شبكة إحصائيات مصغرة أنيقة متناسقة (`2-column micro-stats grid`) مع أيقونات ملونة لطيفة وأرقام بارزة واضحة.
    - عرض الأسعار بأرقام عريضة بارزة مع شارة توفير الفوترة السنوية (20% Save) وتأثير الشطب على الأسعار الأصلية عند الخصم دون خلفيات رمادية ثقيلة.
    - تضمين قائمة الميزات السبع بالكامل في كل بطاقة مع أيقونات الحالة الحية (الذكاء الاصطناعي، الأتمتة، منشئ الـ Flows، تيليجرام، Excel، ووكومرس، شوبيفاي).
    - إضافة وسام التميز العائم `⭐ الأكثر طلباً (MOST POPULAR)` لباقة Pro مع توهج كهرماني خفيف، وشارة `باقتك الحالية` للباقة النشطة.
    - تحسين أزرار الترقية (CTA Buttons) بتدرجات زمردية براقة وارتفاع رشيق وتأثيرات تحويم ديناميكية.
  - **مزامنة التعديلات وإبطال الكاش فورياً من لوحة الأدمن ([`plans/[id]/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/admin/plans/%5Bid%5D/route.ts))**:
    - استدعاء `revalidatePath` لمسارات `/pricing`, `/`, `/settings`, `/admin/plans` عند حفظ أي تعديل للباقة في الأدمن بانل لضمان انعكاس التغييرات فوراً لكافة الزوار والمستخدمين.
    - تمكين مفاتيح التبديل لكافة ميزات المنصة في نافذة تعديل الخطط ([`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx)).
  - **منع التخزين المؤقت وحل مشكلة تفعيل الخطة المجانية ([`subscription/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/subscription/route.ts) & [`upgrade-request/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-request/route.ts))**:
    - ضبط `export const dynamic = 'force-dynamic'` و `export const revalidate = 0` وترويسات `Cache-Control: no-store, max-age=0` لضمان سحب أحدث بيانات الخطط الحية مباشرة من قاعدة البيانات.
    - معالجة طلب التبديل إلى الخطة المجانية ($0 Free Plan) فورياً ومباشرة في قاعدة البيانات دون إرسال فاتورة بمبلغ 0$ إلى بوابة Plisio لتفادي خطأ `422 Amount value is invalid: 0.000000`.
    - تحديث نافذة الترقية ([`upgrade-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/upgrade-plan-modal.tsx)) لإغلاق النافذة وتنبيه المستخدم فور نجاح تفعيل الخطة المجانية.
  - **دعم الترجمة الكاملة وثنائية اللغة ([`integrations-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/integrations-panel.tsx) & [`plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx))**:
    - تعريب وترجمة شارات التحقق (`Checking...` / `جاري التحقق...`)، وحالات فحص صلاحيات الخطة (`Checking plan entitlements...` / `جاري فحص صلاحيات الخطة...`)، وأزرار أدلة الربط (`Setup Guide` / `دليل الربط`).
    - ضبط اختصار وحدات الحصص الشهرية للرسائل والبرودكاست لتظهر `100 / mo` عند اختيار اللغة الإنجليزية و `100 / ش` عند اختيار اللغة العربية.

- ✅ **تقييد ميزات المتاجر الإلكترونية (WooCommerce & Shopify) حسب باقات الاشتراك (Plan-Gated E-Commerce & Upgrade Walls)**:
  - **حماية الباك إند ومنع التجاوز ([`route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/ecommerce/stores/route.ts))**:
    - فحص صلاحيات الخطة عبر `checkAccountFeature(ctx.accountId, 'woocommerce_integration')` و `'shopify_integration'`.
    - إرجاع خطأ `403 Forbidden` فوري مع رسالة ترقية واضحة إذا حاول مستخدم غير مخول إرسال طلب ربط متجر.
  - **لوحة الإعدادات والتحكم بالمتاجر ([`integrations-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/integrations-panel.tsx))**:
    - جلب ميزات الخطة النشطة للمستخدم تلقائياً عند فتح التبويب.
    - عرض **شاشة ترقية فاخرة (Luxury Upgrade Wall)** لكل متجر (WooCommerce / Shopify) غير مفعل في خطة المستخدم مع شارة القفل 🔒، قائمة المميزات، وزر مباشر للترقية `🚀 ترقية الخطة الآن` يوجه لـ `/settings?tab=plan`.
    - إخفاء نماذج الإدخال وأزرار الربط وأدلة الإعداد تماماً للمستخدمين الذين لا تشمل خطتهم هذه الميزات.
  - **محرر الأتمتة ومشغلات المتاجر ([`automation-builder.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/automations/automation-builder.tsx))**:
    - قفل مشغلات المتاجر الإلكترونية الستة في قائمة المشغلات (Triggers) مع بادج `🔒 (Pro/Enterprise)` ومنع اختيارها لمن لا يملكون الخطة المناسبة.
    - تقييد منتقي منصة المتجر (Store Platform) لتعطيل الخيارات غير المتاحة مع شارات الترقية.
  - **لوحة تحكم الأدمن في الخطط ([`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx) & [`plans/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/plans/page.tsx))**:
    - إضافة مفاتيح تفعيل صريحة لربط **WooCommerce** و **Shopify** في نافذة تعديل الخطط وإضافة الخطط الجديدة.
    - إظهار حالة توفر الميزتين في بطاقات الخطط لجميع الباقات.

- ✅ **ربط وتكامل إدارة شريط الشركاء والمنصات (Partners & Integrations Bar CMS)**:
  - **صفحة اللاندينغ بيج ([`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx))**:
    - ربط قسم `SEAMLESSLY INTEGRATES WITH TOP PLATFORMS` مباشرة بقائمة الشركاء `settings.partners` القادمة من لوحة تحكم الأدمن.
    - دعم العرض الفوري والتلقائي لجميع المنصات والشعارات المضافة أو المعدلة أو المحذوفة من الأدمن.
  - **لوحة تحكم الأدمن ([`landing-settings-client.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/landing-settings-client.tsx) & [`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/page.tsx))**:
    - تحميل كامل قائمة المنصات الـ 16 الافتراضية تلقائياً عند فتح تبويب "الشركاء" (Shopify, WooCommerce, Meta, Stripe, WhatsApp, Telegram, n8n, Zapier, AliExpress, Alibaba, Instagram, Facebook, Google, Amazon, Salesforce, PayPal).
    - إضافة أزرار التحريك لأعلى ولأسفل (Reorder Buttons ↑ / ↓) لترتيب ظهور الشركات في الصفحة الرئيسية.
    - دعم إضافة أي شركة أو منصة جديدة (`+ إضافة شريك جديد`) مع معاينة حية للشعار وحذف أي منصة فورياً.


- ✅ **نظام إدارة وتعديل قسم المتاجر ومحاكاة إشعارات الواتساب ثلاثية الأبعاد (3D WhatsApp Notification Mockup & E-Commerce Full CMS)**:
  - **التصميم البصري والمحاكاة ثلاثية الأبعاد ([`landing-ecommerce-section.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-ecommerce-section.tsx))**:
    - **استوديو الإشعارات الداكن (Studio Matte Spotlight Container)**: تصميم صندوق داكن بلون الفحم غير اللامع (`#14171B`) مع إضاءة محيطية خافتة وتأثيرات العمق ثلاثي الأبعاد.
    - **البطاقات المتراصة ثلاثية الأبعاد (3D Frosted Glass Stacked Cards)**:
      1. **البطاقة العلوية (Top Layer)**: زجاج مصنفر شبه شفاف (`bg-white/[0.08]` و `backdrop-blur-xl`) متراجعة للأعلى وللخلف مع طابع زمني وصورة منتج.
      2. **البطاقة المركزية البارزة (Hero Focal Card)**: بطاقة بيضاء ناصعة بارزة للأمام مع ظل واقعي عميق `shadow-[0_25px_60px_-10px_rgba(0,0,0,0.6)]`، حافة جانبية مضيئة بتدرج كهرماني/زمردي، أيقونة واتساب الخضراء البارزة مع ظل منبثق `shadow-[0_6px_16px_rgba(37,211,102,0.4)]`، وشارة التوثيق الزرقاء (`Verified Badge`)، وتأثير حركة سلسة عند التحويم `hover:scale-[1.02]`.
      3. **البطاقة السفلية (Bottom Layer)**: زجاج مصنفر شبه شفاف متراجعة للأسفل وللخلف.
    - **زر إجراء الربط (Interactive CTA Button)**: زر زمردي/تيل داكن في أسفل الصندوق (`Connect Your Store Now →` / `اربط متجرك الآن مجاناً`) مع تأثيرات تحويم وظلال.
  - **التحكم الكامل بالإشعارات والمتاجر من لوحة تحكم الأدمن ([`landing-settings-client.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/landing-settings-client.tsx) & [`ecommerce-tab.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/ecommerce-tab.tsx))**:
    - إضافة تبويب **"المتاجر 🛒"** في الأدمن بانل لإدارة جميع عناصر الصورة التوضيحية:
      - **إدارة محاكاة إشعارات الواتساب**: تعديل أسماء العملاء (سارة / Sarah, إيميلي / Emily, محمد / Michael)، وحالات الطلبات وعناوينها، ونصوص الرسائل، والطوابع الزمنية، وروابط صور المنتجات المصغرة مع صندوق معاينة مصغرة حية للصور (Live Thumbnail Preview).
      - **إدارة زر الدعوة للربط (CTA)**: تعديل نصه بالعربية والإنجليزية والرابط وإمكانية إخفائه/إظهاره.
      - **إدارة بطاقات المتاجر (WooCommerce & Shopify & Custom Stores)**: إضافة متاجر جديدة غير محدودة، تعديل ألوانها ونقاط مميزاتها، وشارات الربط، وإعادة ترتيبها أو حذفها.
      - **إدارة الهيدر والمقاييس**: تعديل الشارة والعناوين والوصف وأرقام المقاييس السفلية (`+30%`, `< 1 sec`, `100% No-Code`) باللغتين العربية 🇸🇦 والإنجليزية 🇬🇧.
  - **قواعد البيانات والربط الحي ([`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx) & [`083_ecommerce_section_cms.sql`](file:///c:/Users/Mustafa/Desktop/mk%20whats/supabase/migrations/083_ecommerce_section_cms.sql))**:
    - تخزين وتحديث البيانات واسترجاعها فورياً في `LandingPage` مع دعم الـ Fallback الشامل لضمان دوام عمل التصميم الفخم دون انقطاع.

- ✅ **منظومة تكامل المتاجر الإلكترونية واسترجاع السلات المتروكة (WooCommerce & Shopify & Abandoned Cart Recovery)**:
  - **قواعد البيانات وتعدد المستأجرين (`supabase/migrations/082_ecommerce_integrations.sql`)**:
    - إنشاء جدول `ecommerce_stores` لإدارة المتاجر وحفظ بيانات الربط والمفاتيح مشفرة بـ AES-256-GCM (عزل كامل لكل حساب `account_id`).
    - إنشاء جدول `ecommerce_webhook_events` لسجل الأحداث ومنع التكرار (Idempotency) عبر قيد فريد `UNIQUE(store_id, provider_event_id, event_type)`.
    - تفعيل حماية Row Level Security (RLS) لجميع الجداول باستخدام `is_account_member(account_id)`.
    - تحديث ميزات الخطط `woocommerce_integration` (لخطتي Pro و Enterprise) و `shopify_integration` (لخطة Enterprise).
  - **طبقة المعالجة والأمان (`src/lib/ecommerce/`)**:
    - `normalize.ts`: تطبيع وتحويل كافة أحداث ووكومرس وشوبيفاي وإضافات السلات إلى نسق قياسي موحد (`NormalizedEcommerceEvent`).
    - `store-crud.ts`: تشفير وفك تشفير المفاتيح والرموز السرية بـ AES-256-GCM.
    - `verify.ts`: التحقق الأمني المتقدم من توقيعات الـ HMAC-SHA256 مع مرونة قبول أحداث الـ Samples والإضافات بدون تعطيل.
    - `event-processor.ts`: معالجة الأحداث، مطابقة جهات الاتصال في الـ CRM بالهاتف أو البريد، إنشاء المحادثات آلياً للعملاء الجدد، وتمرير متغيرات الطلب والسلة لمحرك الأتمتة.
    - `api.ts`: فحص الاتصال الحي واختبار الصلاحيات مباشرة مع المتجر مع دعم Basic Auth و Query Params Fallback.
  - **محرك الأتمتة ومشغلات المتاجر (`src/types/index.ts`, `trigger-meta.ts`, `engine.ts`)**:
    - **المشغلات الستة المدعومة**:
      1. `ecommerce_order_created`: عند إنشاء طلب جديد بالمتجر.
      2. `ecommerce_order_paid`: عند تأكيد دفع الطلب.
      3. `ecommerce_order_cancelled`: عند إلغاء أو استرجاع الطلب.
      4. `ecommerce_order_fulfilled`: عند اكتمال الشحن أو تسليم الطلب.
      5. `ecommerce_customer_created`: عند تسجيل عميل جديد بالمتجر.
      6. `ecommerce_cart_abandoned`: عند ترك العميل للسلة في صفحة الـ Checkout دون إتمام الشراء.
    - **فلترة المشغل**: دعم حصر الأتمتة لمتجر معين (`WooCommerce Only` أو `Shopify Only` أو `Any`).
    - **المتغيرات الذكية المتاحة في نصوص الرسائل والقوالب**:
      - بيانات العميل: `{{ customer.name }}`, `{{ customer.phone }}`, `{{ customer.email }}`
      - بيانات الطلب: `{{ order.number }}`, `{{ order.total }}`, `{{ order.currency }}`, `{{ order.status }}`
      - بيانات المنتجات: `{{ product.name }}`, `{{ product.quantity }}`, `{{ product.price }}`
      - بيانات السلة المتروكة: `{{ recovery_url }}`, `{{ checkout_url }}`, `{{ cart.total }}`, `{{ cart.url }}`
  - **نقاط النهاية والـ Webhooks (`/api/webhooks/woocommerce`, `/api/webhooks/shopify`)**:
    - الرابط القياسي للـ Webhook: `https://<domain>/api/webhooks/woocommerce?store_id=<STORE_UUID>`
    - دعم كافة بروتوكولات الإرسال: `POST`, `GET`, `OPTIONS`, `HEAD`.
    - دعم كافة صيغ البيانات: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`.
    - دعم حقول أرقام الهواتف المتعددة: `phone_number`, `customer_phone`, `phone`, `billing_phone`, `user_phone`.
  - **دليل التشغيل والربط العملي (للرجوع إليه مستقبلاً)**:
    - **ربط WooCommerce الأساسي**:
      1. من لوحة تحكم المنصة (`Settings → Integrations`)، اضغط "Connect WooCommerce" وأدخل رابط المتجر، و `Consumer Key` و `Consumer Secret` و `Webhook Secret`.
      2. انسخ `Webhook Delivery URL` وضعه في ووردبريس: `WooCommerce → Settings → Advanced → Webhooks`.
      3. اختر Topic: `Order created` والحالة: `Active`.
    - **ربط استرجاع السلات المتروكة (Cart Abandonment Recovery)**:
      1. تثبيت إضافة `Cart Abandonment Recovery for WooCommerce` في ووردبريس.
      2. في إعدادات الإضافة: `Cart Abandonment → Settings → Webhook`، فعّل الخيار وضع نفس الـ `Webhook Delivery URL`.
      3. في تبويب `Follow Up Templates`: تأكد من تفعيل القالب الأول وضبط وقت الإرسال المطلوب (مثلاً 10 أو 15 دقيقة).
      4. في المنصة: أنشئ أتمتة جديدة بمشغل `E-Commerce: Cart Abandoned` وأضف رسالة استرجاع السلة مع رابط `{{ recovery_url }}`.
  - **الاختبارات والتحقق**:
    - تم التحقق الحي على السيرفر الفعلي وتأكيد إرسال رسائل الطلبات الجديدة ورسائل السلات المتروكة بنجاح 100%، مع اجتياز كامل حزمة الاختبارات وفحص TypeScript.

- ✅ **نظام إدارة وتعديل صفحة الهبوط وشبكة المميزات بالكامل من لوحة التحكم (Landing Page & Bento Grid Full CMS)**:
  - **لوحة تحكم الأدمن ([`landing-settings-client.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/landing-settings/landing-settings-client.tsx))**:
    - إضافة تبويب مخصص بالكامل لإدارة المميزات: **"المميزات Bento" (Features & Bento Grid Management)**.
    - دعم التعديل الثنائي للغات (العربية 🇸🇦 والإنجليزية 🇬🇧) على عنوان ووصف قسم المميزات الرئيسي (`Everything You Need to Master WhatsApp`).
    - تحكم كامل بجميع كروت المميزات الخمسة الأساسية مع إمكانية إضافة كروت مميزات جديدة غير محدودة بضغطة زر.
    - قائمة منتقي الأيقونات التفاعلية (Icon Picker) تدعم 18 أيقونة متخصصة (`Bot`, `BarChart3`, `Radio`, `FileText`, `FileSpreadsheet`, `Zap`, `Shield`, `Sparkles`, `MessageSquare`, `Clock`, `Smartphone`, `Users`, `Workflow`, `TrendingUp`, إلخ).
    - التحكم بحجم وشكل الكارت في الشبكة التفاعلية: كارت عادي (عمود واحد `col-span-1`) أو كارت عريض مميز (عمودين `col-span-2`).
    - إدارة الشارات التفاعلية (Interactive Badges) مثل شارات حالة الذكاء الاصطناعي `Gemini 2.5 Active` ونوايا الشراء `Purchase High`.
    - إدارة صناديق الربط والتكامل (Integration Pills) مثل `Google Sheets: Auto-Synced` و `Telegram Bot: Instant Alert`.
    - إمكانية إعادة ترتيب الكروت في اللاندينغ بيج (تحريك لأعلى ولأسفل) وحذف أي كارت فورياً.
  - **صفحة الهبوط الرئيسية ([`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx))**:
    - تحويل شبكة الـ Bento Grid من كود ثابت (Hardcoded) إلى محتوى ديناميكي يقرأ مباشرة من `site_settings.features_content` بقاعدة البيانات.
    - دعم القيم الافتراضية الشاملة (Fallback) لمنع حدوث أي فراغ عند التشغيل لأول مرة.
    - تصيير تلقائي متجاوب لكافة أنواع الكروت وشاراتها وصناديق الربط باللغة الحالية للزائر (RTL للعربية / LTR للإنجليزية) مع الحفاظ على التصميم الفخم.
  - **قواعد البيانات والهجرات ([`081_update_landing_bento_features_defaults.sql`](file:///c:/Users/Mustafa/Desktop/mk%20whats/supabase/migrations/081_update_landing_bento_features_defaults.sql))**:
    - إنشاء هجرة آمنة (Idempotent) لضبط القيمة الافتراضية الشاملة لـ `features_content` في `site_settings`.

- ✅ **تحسينات واجهات صفحة الهبوط وتجربة المستخدم (Landing Page & Auth Refinements)**:
  - **حذف عبارات التجربة المحددة (Removal of 14-Day Free Trial Mentions)**:
    - **شاشة التسجيل ([`signup/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(auth)/signup/page.tsx))**: حذف عنصر `14-day free trial. No credit card required.` من قائمة الميزات الجانبية.
    - **صفحة الأسعار ([`pricing/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/pricing/page.tsx))**: تنقيح نص الوصف العام وإلغاء حصر التجربة بـ 14 يوم.
    - **كروت الباقات ([`landing-pricing.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-pricing.tsx))**: تحديث زر الدعوة لإجراء الترقية للباقات الأكثر طلباً إلى `Get Started Now` / `ابدأ الآن مع الخطة`.
  - **إضافة شارة أخذ واستقبال الطلبات بالذكاء الاصطناعي (AI Order Taking Badge)**:
    - **محاكاة الواجهة ([`landing-hero-mockup.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-hero-mockup.tsx))**: إضافة شارة عائمة تفاعلية بأيقونة حقيبة التسوق `ShoppingBag` وعنوان `أخذ واستقبال الطلبات / AI Order Taking` ووصف `أتمتة وحفظ الطلبات آلياً / Automate Orders & Sales` بتصميم ذهبي/عنبري فاخر ونبض حركي متناسق.
  - **تنقيح أزرار قسم البطل (Hero CTA Cleanup)**:
    - **الصفحة الرئيسية ([`page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx))**: حذف زر `Watch Live Demo` وحذف أيقونة `PlayCircle` للتركيز المباشر على زر التسجيل الأساسي `Get Started Free / ابدأ مجاناً الآن`.
  - **تكبير وتنسيق عرض الشعار والشفافية (Logo Display & Size Controls)**:
    - **شريط التنقل وهيدر الصفحات ([`landing-navbar.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-navbar.tsx) & [`p/[slug]/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/p/[slug]/page.tsx))**: رفع حجم الشعار الافتراضي إلى `48px` و `max-h-16` وعرض أيقونة الشعار إلى جانب اسم المنصة الرسمي معاً بدون ترك مساحات فارغة.
    - **لوحة الأدمن ([`admin/settings/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/settings/page.tsx))**: إضافة شبكة الشفافية الشطرنجية (`Checkerboard Grid`) لصندوق معاينة الشعار للتأكد من تفريغ الخلفية، وتوسيع مدى حقل ارتفاع الشعار ليصل حتى `180px`.

- ✅ **التجاوب الكامل مع جميع الأجهزة وضبط اللغة والوضع الافتراضي (Full Cross-Device Responsiveness & Default Settings)**:
  - **التجاوب مع الهواتف الذكية، التابلت، والكمبيوتر (Mobile, Tablet & Desktop UI Consistency)**:
    - **شريط التنقل لصفحة الهبوط ([`landing-navbar.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-navbar.tsx))**: إضافة قائمة هاتفية ذكية (Mobile Navigation Drawer) تفتح بنقرة زر همبرغر مع حركات انتقال سلسة وخيارات التبديل بين اللغات والوضع الليلي/النهاري وأزرار الدخول والتسجيل المتجاوبة.
    - **لوحة تحكم الأدمن ([`admin-nav.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/admin-nav.tsx) & [`admin-shell.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/admin/admin-shell.tsx))**: تحويل القائمة الجانبية في الشاشات الصغيرة والهواتف إلى Drawer منزلق مع خلفية معتمة (Backdrop Overlay) وزر همبرغر في الهيدر، لضمان استغلال كامل مساحة الشاشة للجداول والبيانات مع بقاء الشريط ثابتاً في الشاشات الكبيرة `md+`.
    - **شاشات التوثيق ([`auth-shell.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/auth/auth-shell.tsx))**: ضبط اتجاه النصوص `dir="ltr"` و `dir="rtl"` تلقائياً وفق اللغة المختارة، وتكديس النماذج رأسياً بسلاسة على الهواتف والأجهزة اللوحية دون تشويه للتصميم الفخم.
    - **بطاقات وشاشات المعاينة ([`landing-hero-mockup.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-hero-mockup.tsx))**: تحسين تموضع الشارات العائمة ومنع تداخلها على شاشات الجوال الضيقة (320px-375px).
    - **الجداول وقوائم البيانات (Data Tables & Rails)**: دعم التمرير الأفقي السلس `overflow-x-auto` مع `min-w-0` في كافة الشاشات لتفادي كسر التنسيق.
  - **ضبط الإعدادات الافتراضية الرسمية (Default English & Light Mode)**:
    - اعتماد **اللغة الإنجليزية (`en`)** كلغة أساسية وافتراضية للنظام والزوار الجدد في [`src/i18n/request.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/i18n/request.ts) و `.env.local`.
    - اعتماد **الوضع الفاتح (`light mode`)** كوضع افتراضي للنظام في [`src/lib/themes.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/themes.ts) و [`src/app/layout.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/layout.tsx).
    - إتاحة التبديل الكامل والحر للمستخدم والزائر للغة العربية أو الوضع الداكن بنقرة زر واحدة مع الحفظ التلقائي في التخزين المحلي والكوكيز.

  - **لوحة المستخدم (User Panel -> Appearance Settings)**:
    - إضافة ثيم **Ethos Teal (#00685F)** كأول وأساس الثيمات الرسمية المعتمدة لنظام DESIGN.md مع شارة `DESIGN.md System`.
    - إضافة زر **"إعادة التعيين للوضع الافتراضي (Reset to Default)"** بالأعلى لإعادة الثيم إلى `Ethos Teal` والوضع إلى `Dark` بنقرة زر واحدة وتنبيه Toast فوري.
    - تحديث `src/lib/themes.ts` و `src/app/globals.css` لربط ألوان `html[data-theme="ethos"]` بالقيم الدقيقة لـ `DESIGN.md`.
  - **لوحة الإدارة والأدمن (Admin Panel -> Settings / Landing CMS)**:
    - إضافة شبكة **لوحات الألوان الجاهزة (Preset Palettes)** لاختيار نمط `Ethos Teal (#00685F)`، `Warm Canvas Light (#F9F5F0)`، `Emerald Green (#10B981)`، أو `Midnight Indigo (#6366F1)` بنقرة واحدة.
    - إضافة زر **"إعادة ضبط الألوان للوضع الافتراضي (DESIGN.md) 🔄"** لاسترجاع ألوان الهوية الرسمية وحفظها فورياً في `site_settings`.

- ✅ **إصلاح ودعم تحرير الصفحات التعريفية باللغتين العربية والإنجليزية (Bilingual Content Pages & Admin CMS Fix)**:
  - **قواعد البيانات (`supabase/migrations/079_bilingual_content_pages_and_defaults.sql`)**: إضافة عمودي `title_en` و `content_html_en` بأمان لجدول `content_pages` وتعبئة النصوص الإنجليزية الافتراضية لكافة الصفحات الأساسية (`terms`, `privacy`, `about`, `contact`).
  - **لوحة التحكم والأدمن بانل ([`pages-client.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/pages/pages-client.tsx))**:
    - إصلاح دالة الحفظ وإضافة تنبيهات `toast` من `sonner` لإظهار نجاح الحفظ فورياً أو توضيح سبب الخطأ بدقة.
    - إضافة زر ذكي **"✨ تعبئة القالب الإنجليزي الافتراضي" (Auto-fill English Template)** داخل تبويب الإنجليزية لتعبئة النصوص والـ HTML الاحترافي بنقرة زر واحدة.
  - **تحسين مسار الـ API ([`api/admin/content-pages/[id]/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/admin/content-pages/%5Bid%5D/route.ts))**: إرجاع تفاصيل الخطأ بدقة وضمان معالجة وتطهير HTML الآمن عبر `DOMPurify` للنصين العربي والإنجليزي.

- ✅ **تحديث وتنسيق شاشات التوثيق بالكامل (Auth & Recovery Screens - Stitch Design System)**:
  - **شاشة تسجيل الدخول (`/login` - Sign In)**: بطاقة مركزية داكنة فاخرة (`#1C1C1E`) على خلفية بيج دافئة (`#F9F5F0`) مع عنوان **Welcome Back** بخط Serif، زر التوثيق بـ Google، حقول الإدخال الداكنة الأنيقة (`Email or Phone Number`, `Password`)، خيار `Remember me` ورابط `Forgot Password?`، زر `Sign In to Dashboard` الزمردي، وشارات الأمان السفلية.
  - **شاشة إنشاء الحساب (`/signup` - Sign Up)**: حاوية مركزية داكنة فخمة بتخطيط مزدوج عمود للميزات وتقييم الـ 5 نجوم وعمود للنموذج وزر `CREATE FREE ACCOUNT` والشريط السفلي لشارات الثقة مع إزالة حقل الهاتف الزائد.
  - **شاشتا استعادة وتعيين كلمة المرور (`/forgot-password` & `/reset-password`)**: بطاقة مركزية داكنة فخمة مع أيقونة المفتاح الزمردية، عنوان **Reset Your Password** بخط Serif، حقل البريد مع أيقونة Mail، وزر `Send Password Reset Link →` الأخضر الزمردي، ورابط العودة للدخول وشارات الحماية السفلية مطابقة للتصميم 100%.
  - **إصلاح صفحات المعلومات والسياسات القانونية (`/p/[slug]` - Privacy, Terms, About, Contact)**:
    - توفير مطابقة ذكية للروابط والأسماء المستعارة (`privacy`, `privacy_policy`, `privacy-policy`, `terms`, `about`, `contact`).
    - ربط المحتوى الإنجليزي بالكامل وضمان عرضه الفوري باللغة الإنجليزية الرسمية عند اختيار لغة `EN` دون أي ارتداد للغة العربية، مع الاتجاه اليساري `LTR` والتصميم التحريري المتناسق.

- ✅ **نظام حجز وإدارة المواعيد المستقل بالذكاء الاصطناعي (AI Automated Appointments System - Phase 1)**:
  - **قواعد البيانات ودوال التحقق (`supabase/migrations/076`, `077` & `078`)**:
    - مايقريشن `076_appointments_core.sql`: إنشاء جدول `business_hours` (أيام وساعات العمل 0..6)، جدول `appointment_settings` (المدة الافتراضية، المنطقة الزمنية `timezone` الافتراضية `Asia/Baghdad`، رسائل التأكيد وتسمية الخدمة)، وجدول `appointments` (معرف المحادثة والعميل والخدمة والوقت المخزن بـ UTC وحالات pending/confirmed/cancelled/no_show)، ومفتاح `appointments_enabled` بجدول `ai_configs` مع حماية RLS عبر `is_account_member(account_id)`.
    - مايقريشن `077_appointments_availability_fn.sql`: دالة SQL `check_slot_availability(p_account_id, p_requested_utc, p_exclude_id)` للتحقق الذري من ساعات وأيام العمل والأيام المغلقة ومنع تداخل المواعيد (Overlap check عبر `tstzrange`).
    - مايقريشن `078_appointment_reminders.sql`: إضافة أعمدة إعدادات التذكير التلقائي `reminder_enabled, reminder_minutes_before, reminder_message` وحقل `reminder_sent_at` وفهرس `idx_appointments_reminder_due`.
  - **طبقة الخدمات والـ API Routes**:
    - مسارات إدارة المواعيد: `/api/appointments` (GET, POST, PATCH, DELETE)، مسار فحص التوفر `/api/appointments/availability`، ومسارات إعدادات ساعات العمل `/api/account/business-hours` وإعدادات المواعيد `/api/account/appointment-settings`.
    - مسار الـ Cron للتذكيرات التلقائية: `/api/appointments/reminders` لإرسال رسائل تذكير الواتساب للعملاء قبل موعدهم مع منع الإرسال المزدوج الذري.
    - موديول الخدمات المساعدة [`src/lib/appointments/appointment-service.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/appointment-service.ts)، دالة تحويل التوقيت الدقيق [`timezone-helper.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/timezone-helper.ts)، والأنواع [`types.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/types.ts).
  - **الدمج الذكي مع محرك الذكاء الاصطناعي (Independent AI Context & Auto-Reply Engine)**:
    - فصل كامل ومستقل 100% عن نظام جمع الطلبات `order_collection` دون أي تداخل في الحالة (State) أو الـ JSON block.
    - حقن `appointmentContext` في الـ System Prompt بالمنطقة الزمنية المحلية وتنسيق ساعات العمل.
    - استخراج وحجز المواعيد آلياً عبر الـ JSON Block `{"appointment": {...}}` مع التحقق التلقائي من التوفر وتأكيد الموعد فورياً واسترجاع سياق التاريخ من الرسائل السابقة تلقائياً (History Fallback).
  - **منظومة التذكير التلقائي بمواعيد العملاء عبر الواتساب (Automated WhatsApp Reminders System)**:
    - **محرك تذكيرات خلفي ذاتي مدمج بالسيرفر (`Built-in Background Runner`)**: تم دمج فاحص تذكيرات دوري يعمل كل 60 ثانية من داخل دورة حياة السيرفر [`src/instrumentation.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/instrumentation.ts) وموديول المعالجة [`src/lib/appointments/reminder-runner.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/reminder-runner.ts) للتحقق وإرسال رسائل الواتساب ذاتياً وتلقائياً دون الحاجة لأي مشغّل خارجي أو إعدادات Cron خارجية (Zero-Config Internal Cron).
    - **الربط التلقائي والإنشاء الذاتي للمحادثات (`Auto Contact & Conversation Resolver`)**: التحقق التلقائي من أرقام الهواتف وإنشاء جهة اتصال ومحادثة برمجياً إذا لم تكن موجودة مسبقاً، لضمان وصول الرسالة فورياً للزبون.
    - **نافذة الاستدراك الذكية (`Catch-up Window`)**: استدراك أي مواعيد مستحقة لم يُرسل لها تذكير بعد (بين موعد الاستحقاق وحتى وقت الموعد) ومنع الإرسال المزدوج بشكل ذري عبر `reminder_sent_at`.
    - **زر الإرسال الفوري بنقرة واحدة (One-Click Reminder Button `🔔`)**: إضافة أيقونة جرس تفاعلية بجانب كل موعد مؤكد بصفحة [`/appointments`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/appointments/page.tsx) لتجربة إرسال التذكير بنقرة زر واحدة مع إشعارات نجاح فورية.
    - **المتغيرات الذكية والقوالب المخصصة**: دعم الاستبدال الآلي لـ `{الاسم}`، `{الخدمة}`، `{الوقت}`، و`{التاريخ}` بالتوقيت المحلي لكل حساب، مع بطاقة معاينة حية للمتغيرات (Live Preview Card) بقسم إعدادات المواعيد.

  - **منظومة إشعارات تيليقرام الآلية للمواعيد (Telegram Appointment Notifications)**:
    - دالة `sendTelegramAppointmentNotification` بـ [`src/lib/telegram/send-notification.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/telegram/send-notification.ts) لإرسال إشعار فوري منسق بـ HTML عند تأكيد أي موعد جديد يتضمن اسم العميل، الهاتف، الخدمة، والوقت بتوقيت الحساب المحلي.
  - **واجهة الإعدادات ولوحة التحكم (Settings & Dashboard Appointments Page)**:
    - واجهة إعدادات مخصصة بـ Settings → Appointments ([`AppointmentsSettings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/appointments-settings.tsx)) لضبط مفتاح الذكاء الاصطناعي، مدة الموعد، التايم زون، جدول أوقات العمل، وقسم **التذكير التلقائي بالموعد** مع المعاينة الحية والمتغيرات الذكية (`{الاسم}`, `{الخدمة}`, `{الوقت}`, `{التاريخ}`).
    - صفحة إدارة المواعيد الفاخرة [`/appointments`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/appointments/page.tsx) مع بطاقات إحصائية، فلاتر الحالات، بحث سريع، وتغيير الحالات، ومودال إضافة موعد يدوي.
    - إضافة رابط المواعيد بالقائمة الجانبية [`Sidebar`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/layout/sidebar.tsx) مع أيقونة Calendar والتدويل الكامل.

  - **تحسينات البناء والأداء للبنية التحتية (`Dockerfile & Deployment`)**:
    - تحسين بناء Next.js / Turbopack في حاويات Docker داخل Coolify عبر تحديد `NEXT_CPU_COUNT=1` و `NEXT_BUILD_WORKERS=1` وضبط استهلاك الذاكرة الآمن `NODE_OPTIONS="--max-old-space-size=1536"` لمنع استنزاف ذاكرة ومعالج السيرفر (OOM Lockup) وسرعة البناء.
    - إضافة `export const dynamic = 'force-dynamic'` في مسار التذاكر غير المقروءة `/api/support/unread-count` وحماية `process.version` في `src/instrumentation.ts` لتفادي أخطاء الـ Dynamic Server Usage أثناء التجميع.

- ✅ **بوابة الدفع المحلي والأوفلاين وإعلانات التفعيل التلقائية (Local Offline Payment Gateway & Automated Bilingual Presets System)**:
  - **قواعد البيانات والبنية التحتيّة (`supabase/migrations/074` & `075`)**:
    - مايقريشن `074_offline_payment_methods_and_submissions.sql`: إنشاء جدول `offline_payment_methods` لطرق الدفع البنكية والمحافظ الرقمية (زين كاش، STC Pay، بنك الراجحي، فودافون كاش) وجدول `offline_payment_submissions` لاستلام إثباتات ووصلات العملاء المحولة مع حماية RLS و standard `account_id` CASCADE.
    - مايقريشن `075_payment_notifications.sql`: فك قيود الجدول `notifications` لدعم أنواع الإشعارات المستحدثة `payment_approved` و `payment_rejected`.
  - **بوابة اختيار وسائل الدفع الموحدة وزر "ادفع الآن" بواجهة المستخدم (`PlanUsagePanel`)**:
    - توحيد الأزرار في كروت الباقات بـ **زر موحد وأنيق واحد فقط**: `🚀 ادفع الآن وارتقِ بالخطة / Pay Now & Upgrade`.
    - **نافذة تفاعلية منبثقة للعميل (`Select Payment Method Modal`)** تظهر عند كبس الزر وتتيح الاختيار بين:
      - 🏦 **الدفع المحلي والأوفلاين (Local & Offline Payment)**
      - 💳 **بطاقة بنكية (Visa / MasterCard via Stripe)**
      - 🪙 **عملات رقمية كريبتو (Crypto USDT / BTC via Plisio)**
    - **نافذة إرفاق الوصل والحسابات البنكية (`Offline Payment Submission Modal`)**:
      - عرض المحافظ والبنوك المتاحة مع **زر نسخ رقم الحساب/IBAN بنقرة واحدة** ومؤشر التميز.
      - إرفاق صورة الوصل عبر مسار رفع المرفقات `/api/upload-receipt` وإدخال رقم المرجع/الحوالة وملاحظات العميل.
      - إظهار بنر حالة معلق تلقائي (`جاري مراجعة إثبات الدفع من قبل الإدارة ⏳`).
  - **لوحة إدارة وطرق الدفع للأدمن ومراجعة الوصلات (`/admin/offline-payments`)**:
    - إضافة وتعديل وحذف وتفعيل/تعطيل طرق الدفع المحلية مع رفع الشعار والتعليمات.
    - مراجعة إثباتات الدفع الواردة مع مكبر معاينة الوصل (Receipt Preview Image Modal).
    - عند النقر على **"موافقة وترقية"**: تفعيل الباقات فورياً في جدول `subscriptions` وتحديث تواريخ الفوترة وإكمال طلبات الترقية المعلقة.
  - **نماذج الرسائل الجاهزة وأزرار الخيارات السريعة للأدمن (One-Click Presets)**:
    - إدراج تلقائي لرسائل جاهزة باللغتين العربية والإنجليزية تحتوي اسم الباقة والتعليلات.
    - إضافة **أزرار نماذج جاهزة بنقرة واحدة (One-Click Presets)** داخل نافذة الأدمن:
      - للقبول: 🟢 `تفعيل قياسي` | ⚡ `تفعيل مع الشكر`
      - للرفض: 🔴 `صورة غير واضحة` | 🟡 `رقم مرجع خاطئ` | 🔵 `المبلغ غير مكتمل`
    - إمكانية تعديل النصوص الحرة بالعربية والإنجليزية قبل الاعتماد.
  - **منظومة الإشعارات التلقائية الفورية ثنائية اللغة (`Dual Notifications & Platform Announcements`)**:
    - إرسال الإشعار والتذكرة فورياً إلى **قسم Platform Announcements 📢 وتذاكر الدعم الفني 🎫** بجدول `support_tickets` بـ `is_announcement = true` و `category = 'announcement'` لتظهر بالتبويب المخصص في `Settings -> Contact Support`.
    - إرسال الإشعار أيضاً إلى **جرس التنبيهات العلوي 🔔** وشارة الإشعارات الحية بجدول `notifications`.
  - **إصلاح خلل 401 Unauthorized وتحديث الـ Proxy Middleware (`src/proxy.ts`)**:
    - شمول مسارات الـ API بـ `if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin'))`.
    - حماية كوكيز الأدمن وتجديد التوكنات بـ `withRefreshedCookies` وإرجاع استجابات JSON صحيحة.
  - **ميزة الحذف النهائي للحسابات من لوحة الأدمن (`Permanent Account Deletion`)**:
    - زر وحوار تأكيد أحمر بـ `/admin/accounts` ومسار `/api/admin/accounts/delete`.
    - مسح كاسكادي شامل لبيانات الشركة من الداتابيز وحذف المستخدم نهائياً من بنية Supabase Auth `deleteUser()`.

- ✅ **معالجة وتطوير توثيق Google OAuth والتصميم المزدوج (Google OAuth Architecture & Bilingual Theme-Aware Auth Shell)**:
  - **إصلاح توجيه التوثيق للبيئات المنشورة وعبر السيرفرات العكسية (Nginx & Production Reverse Proxy Redirection Fix)**:
    - تحديث مسار الـ Callback بـ [`src/app/auth/callback/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/auth/callback/route.ts) لإرجاع هيدر توجيه نسبي (`Location: /dashboard`)، مما يضمن التوجيه المباشر بنسبة 100% على نفس نطاق الزائر (`https://mkwacrm.mstoviral.online`) دون التوجه لـ `localhost:80` أو التوقف بصفحة الدخول.
    - إضافة دالة المساعدة `createRedirectResponse` بـ [`src/proxy.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/proxy.ts) لاستخراج النطاق الحقيقي والبروتوكول تلقائياً من الترويسات العكسية (`x-forwarded-host` / `host`) وإلغاء أي تحويل خاطئ للمنافذ الداخلية.
    - المعالجة الفورية لكوكيز التوكنات القديمة المنتهية وحذفها آلياً لتفادي تكرار تنبيه `refresh_token_not_found` بالتيرمينال.
  - **إضافة أزرار اللغة والنمط (Light / Dark Mode & Language Switcher in Auth Shell)**:
    - إضافة زر تبديل اللغة (🇸🇦 العربية / 🇬🇧 English) وزر التبديل بين الوضع الليلي والنهاري (☀️/🌙) في الهيدر العلوي لـ [`AuthShell`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/auth/auth-shell.tsx) ليعملا بسلاسة في شاشات تسجيل الدخول وتنسيق الحسابات.
  - **إعادة تصميم وترقية زر Google والواجهات (Ultra-Premium Google OAuth Button & Dark Mode UX)**:
    - تطوير وتحديث تصميم زر التوثيق بـ Google بصفحتي [`login/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(auth)/login/page.tsx) و [`signup/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(auth)/signup/page.tsx) ليكون واضحاً وربط التباين بين الوضعين النهائي والليلي دون اختفاء النص عند تحريك الماوس (Hover Contrast Protection).
    - توحيد خلفيات وحقول الإدخال وإضافة قواعد CSS كاملة لمعالجة الإكمال التلقائي لكروم بـ [`globals.css`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/globals.css) ليكون النص داكن الألوان وسلس القراءة بـ `#09090b` بالوضع النهاري (Light Mode) وأبيض ناصع بـ `#f4f4f5` بالوضع الليلي (Dark Mode).
    - إلغاء ومحو وميض الخلفية السوداء (Flash of Dark Mode) عند إعادة تحديث الصفحة (Refresh) بتحويل السكريبت في [`layout.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/layout.tsx) للتنفيذ المباشر التزامني (Synchronous Inline Boot Script) قبل رندر الصفحة.
    - توحيد لون الهوية الأساسي `primaryColor` وتعيين قيمته الافتراضية `#10b981` الموحدة ومزامنة الكاش المحلي `localStorage` بين [`AuthShell`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/auth/auth-shell.tsx) وصفحات التوثيق لمنع تباين ألوان زر تسجيل الدخول مع لون أيقونة الشعار.
    - إلغاء اختفاء واختفاء التأخير لزر Google وأيقونة الثيم واسم المنصة عند إعادة تحديث الصفحة (Zero-Delay Instant Rendering) عبر ضبط التهيئة المبدئية لـ `google_auth_enabled` و `platform_name` ورفع تأخير الهيدريشن بـ [`mode-toggle.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/layout/mode-toggle.tsx) ليعرض العناصر فورياً 100% من أول كادر HTML.
    - دعم الشعار المرفوع من الأدمن `logo_url` والعرض الفوري له فور تحميل الصفحة بدون تأخير.

- ✅ **إعادة هيكلة وتصميم صفحة الهبوط بالدقة التامة (Custom UI/UX Landing Page)**:
  - **قسم البطل (Hero Section)**: عنوان رئيسي *"نمِّ عملك مع واتساب والذكاء الاصطناعي"* مع زر CTA زمرّدي *"ابدأ مجاناً"* وزر *"شاهد العرض التوضيحي"*.
  - **قسم Dashboard**: لقطة واجهة تفاعلية زجاجية مؤطرة مع تأثيرات ظل وانعكاس مضيئة.
  - **شريط الميزات (6 بطاقات مخصصة)**: أتمتة المحادثات، إدارة الحملات، قوالب الرسائل، تحليلات ذكية، ربط Google Sheets & Excel، وإشعارات Telegram.
  - **قسم كيف يعمل (3 خطوات متتالية)**: (1. اربط واتساب → 2. اضبط الرد الآلي → 3. ابدأ البيع والنمو).
  - **الالتزام المطلق بالقيود**: عدم تغيير قسم الشركاء المتحرك ولا قسم الخطط والأسعار المحتسبة.
  - **الألوان والخطوط**: الأخضر الزمردي `#10B981` كأساسي، الرمادي الداكن `#1F2937` للبطاقات، والنصوص بالخط العربي Cairo (RTL الكامل).

- ✅ **تحكم الأدمن في اللوجو ودعم التلغرام/الواتساب وأزرار الحفظ المخصصة (Platform Logo, Floating Support & Section Save Buttons)**:
  - **إمكانية تغيير شعار المنصة (Platform Logo URL)**: إضافة حقل إدخال ومعاينة حية للوغو في إعدادات الأدمن [`/admin/settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/settings/page.tsx) وحفظه بالـ DB ليعكس شعار المنصة فورياً لدى جميع المتصفحين والعملاء.
  - **ودجت الدعم الفني المباشر العائم ([`floating-support.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/floating-support.tsx))**: زر عائم في زاوية الصفحة يتيح للعملاء التواصل المباشر بنقرة واحدة عبر الواتساب (`wa.me`) والتلغرام (`t.me`).
  - **أزرار حفظ مخصصة لكل قسم في لوحة الأدمن**: إضافة زر حفظ مستقل وخاص في أسفل كل بطاقة (هوية المنصة واللوجو، بوابة Plisio للكريبتو، بوابة Stripe للبطاقات، ووضع الصيانة).

- ✅ **تطوير وترقية اللاندينغ بيج وشبكة الخطط التفاعلية (Ultra-Premium Landing Page & Interactive Plans)**:
  - **مكون شبكة الخطط والأسعار التفاعلي ([`landing-pricing.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-pricing.tsx))**: زر تبديل الفوترة السنوية والشهرية مع إظهار خصومات 20%، السعر الشهري المحتسب، البادج المضيء للباقة الأكثر طلباً، وسقوف الرسائل وحملات البرودكاست والذكاء الاصطناعي واختبار الاتصال.
  - **محاكاة متصفح Mac التفاعلية في الـ Hero ([`landing-hero-mockup.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-hero-mockup.tsx))**: تبويب تفاعلي لاستعراض قدرات المنصة حياً (الرد الآلي بالذكاء الاصطناعي 24/7، حملات البرودكاست الجماعية، وتجميع الطلبات التلقائي مصفاة بـ Excel).
  - **أكورديون الأسئلة الشائعة ([`landing-faq.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/landing/landing-faq.tsx))**: إجابات تفاعلية متجاوبة لجميع استفسارات الربط، الحماية من الحظر، طرق الدفع بالبطاقات والكريبتو.
  - **إعادت هندسة وتنسيق اللاندينغ بيج بالكامل ([`src/app/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx))**: إضافة عداد الإحصائيات الفائقة (+10M رسالة، 99.9% وصول)، شريط الشركاء اللانهائي، بطاقات آراء العملاء، بنر الدعوة للتجربة المجانية المشع، والفوتر المنظم بـ 4 أعمدة.

- ✅ **تحكم السوبر أدمن الشامل في الشركات والحسابات (Super Admin Tenant Controls)**:
  - **تغيير كلمة السر للمستخدمين (Password Reset)**: زر وتأكيد إعادة تعيين كلمة مرور أي يوزر بالمنصة فورياً من الأدمن باستخدام Supabase Admin Auth API.
  - **الدخول بحساب اليوزر (User Impersonation)**: إمكانية الدخول بحساب المستخدم كدعم لمساعدته في الإعدادات (Setup Support) مع ظهور شريط الإتقان أعلى الواجهة وإمكانية العودة لحساب الأدمن بضغطة زر.
  - **حظر ورفع الحظر عن المستخدمين والشركات (Suspend & Unban)**: تغيير حالة الحساب وطرد الجلسات فورياً من الـ Middleware.
  - **تغيير الخطة والباقة فورياً (Instant Plan Switch)**: خيار ترقية أو تخفيض باقة الشركة وسجل التغييرات التاريخي.
  - **إعادة تصميم قائمة خيارات الحساب (Elegant Floating Dropdown Menu)**: قائمة خيارات سريعة منبثقة بتصميم فاخر وألوان متناسقة مع أيقونات تفاعلية كرتونية لكل خيار.

- ✅ **منظومة الباقات الحقيقية وسقف -1 غير المحدود (Real vs Facade SaaS Plans & Unlimited Quotas)**:
  - التأكد والربط التام بأن اشتراك المستخدم يفتح المميزات الحقيقية بالنظام وليس مجرد واجهة صورية (تفعيل/إيقاف بوت التلغرام، تصدير إكسل للطلبات، والذكاء الاصطناعي بناءً على الخطة).
  - مايقريشن `059_extend_plans_discount_and_orders_limits.sql` لإضافة أسعار الخصم الشهرية والسنوية وحصص الطلبات `max_orders_monthly`.
  - الدعم الكامل لسقف `-1` غير المحدود في موديول الفحص [`src/lib/plans/check-usage-limit.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/plans/check-usage-limit.ts) للرسائل والبرودكاست وأعضاء الفريق والعملاء والطلبات.
  - إصلاح خلل تعيين الباقة الأكثر رواجاً `set_popular_plan` بخادم PostgreSQL واستحداث مسار صريح بشرط `WHERE`.

- ✅ **بوابة دفع الكريبتو Plisio وإعدادات النظام العامة (Plisio Crypto Payment & System Settings)**:
  - مايقريشن `060_site_settings_and_partners.sql` لإضافة أعمدة بوابة Plisio وتعيين إعدادات الموقع وجدول الشركاء `partners`.
  - الربط التام مع **Plisio API v1** عبر الـ `SECRET_KEY` المخفي المعين من الأدمن (`https://api.plisio.net/api/v1/invoices/new?api_key=<SECRET_KEY>`).
  - شاشة إعدادات النظام العامة بالأدمن [`/admin/settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/settings/page.tsx):
    - مفتاح وتفعيل بوابة Plisio للدفع التلقائي بالعملات الرقمية (USDT / Bitcoin).
    - رقم الواتساب للدعم والتواصل وحساب التلغرام.
    - اسم المنصة الرئيسي ومُنتقل لون الهوية (Primary Color Picker).
    - **إدارة شريط الشركاء والشركات (Partners Ticker Manager)**: إضافة وحذف الشركاء ديناميكياً وعرضهم في اللاندينغ بيج بشريط متحرك من اليمين إلى اليسار تحت عنوان **`الشركاء`**.
  - **التوجيه المباشر بنقرة واحدة لبوابة الدفع (1-Click Checkout Redirection)**: عند كبس زر "اختيار هذه الباقة / الترقية 🚀" بالباقات، يتم إنشاء الفاتورة فورياً وتحويل متصفح المستخدم تلقائياً إلى صفحة دفع الكريبتو `https://plisio.net/invoice/...`.

- ✅ **الإحصائيات الحقيقية للباقة وعرض الخطط بإعدادات المستخدم (Real-time Plan Stats & On-Page Plans Display)**:
  - استخراج 5 مؤشرات حقيقية ودقيقة بالمسار [`/api/account/subscription`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/subscription/route.ts): الرسائل الشهرية، الحملات والبرودكاست، أعضاء الفريق، جهات الاتصال، والطلبات والمبيعات.
  - تصميم 5 بطاقات استهلاك تفاعلية بسيطة وواضحة في واجهة إعدادات المستخدم [`/settings?tab=plan`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx) تظهر:
    - **تم استهلاكه (صرف)**
    - **المتبقي للاستخدام**
    - **الحد الأقصى الإجمالي**
    - **شريط ونسبة الإنجاز المئوية**
  - عرض شبكة كل باقات العضوية المتاحة مباشرة بنفس الصفحة مع الأسعار المخفضة، الحدود التفصيلية، شارات المميزات، وزر الترقية المباشر.
  - تنظيف الواجهة وإزالة النافذة المنبثقة المكررة والأزرار الزائدة لتحقيق أقصى درجات السلاسة والوضوح.

- ✅ **حماية واستقرار النظام ضد أخطاء التحليل والشبكة (Resiliency & Fail-Safe Handlers)**:
  - معالجة وحماية كل استدعاءات `JSON.parse` و `res.json()` بالعميل لتفادي أخطاء `Unexpected end of JSON input`.
  - استيراد وتأكيد مكتبة التنبيهات `toast` من `sonner` بجميع مكونات الإعدادات.
  - معالجة التوكنات النصية الصريحة بدالة فك تشفير توكن الواتساب `decrypt` لتجنب التوقفات غير المعالجة.
  - هجرة التوافقية `060` مع دعم `ALTER TABLE ADD COLUMN IF NOT EXISTS` للتطبيق الآمن والتكراري على قاعدة البيانات.

- ✅ **نظام محرك الأوتوميشن وجدولة خطوات الانتظار (Automation Wait Step Engine & Scheduler)**:
  - **التشخيص الدقيق وفحص الجدول**: فحص وحل مشكلة توقف خطوات الانتظار (`Wait`) التي كانت تتوقف عند حالة `pending` في جدول `automation_pending_executions`.
  - **الدعم الشامل لوحدات الوقت (دقائق، ساعات، وأيام)**: احتساب وحفظ الوقت المستهدف بـ UTC الدقيق (`run_at = NOW() + duration`) ومقارنته بـ `run_at <= NOW()` ليعمل بسلاسة مع أي مدة إمهال (سواء كانت دقيقة واحدة، عدة ساعات، أو أيام).
  - **العمل في التطوير المحلي (Local Dev Background Poller)**: وحدة استطلاع دورية محددة بـ 15 ثانية في [`src/lib/automations/local-poller.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/automations/local-poller.ts) ومدمجة بـ Engine لتشغيل الأوتوميشن تلقائياً على الجهاز المحلي أثناء التطوير دون الحاجة لخدمات خارجية.
  - **الجدولة في الإنتاج (Vercel Cron)**: تهيئة ملف [`vercel.json`](file:///c:/Users/Mustafa/Desktop/mk%20whats/vercel.json) لجدولة استدعاء المسار `/api/automations/cron` كل دقيقة تلقائياً في السيرفر الإنتاجي مع حماية المفتاح السري `AUTOMATION_CRON_SECRET`.
  - **الفهرسة وتسريع الاستعلامات**: مايقريشن `052_automation_wait_indexing.sql` لإضافة فهرس جزئي `idx_automation_pending_run_at` لاسترجاع الصفوف المستحقة بأقل من ملي ثانية.
  - **أداة تفريغ التنفيذات المعلقة**: سكربت [`scripts/drain-pending-automations.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/scripts/drain-pending-automations.ts) الذي قام بتفريغ واستكمال الـ 20 صفاً المعلقة السابقة بنجاح وترحيل الرسائل للجوال.

- ✅ **البنية متعددة المستأجرين والأمان الشامل**:
  - `multi-tenant migration` (017-036) مطبق ومختبر يدوياً بحسابين حقيقيين.
  - `RLS` شغال على كل الجداول، بدون تداخل بيانات بين الحسابات.

- ✅ **ربط Evolution API والبرودكاست**:
  - `Evolution API integration` مكتمل ومختبر على production (استقبال + إرسال). التفاصيل الكاملة بملف `docs/evolution-integration-report.md`.
  - **دعم إرسال البرودكاست (Broadcasts) عبر Evolution API بجانب Meta Cloud API الرسمية**:
    - مسار إرسال مخصص لنص حر بدون قوالب Meta لحسابات Evolution API.
    - فحص محمي موحد لحدود خطة الاشتراك الشهيرة (الرسائل والبرودكاست).
    - معدل إرسال آمن متدرج لـ Evolution لحماية أرقام واتساب من الحظر.
    - مؤشر التقدم والوقت المتبقي التقديري المباشر في الواجهة أثناء الإرسال.
    - معالجة وإظهار أخطاء تفصيلية واضحة في واجهة النتيجة بدلاً من الفشل الصامت.

- ✅ **لوحة التحكم والأدمن (Admin Panel Auth & Dashboard)**:
  - `Admin Panel Authentication` مكتمل ومختبر محلياً (`platform_admins` + `rate limiting` + `middleware protection`).
  - مايقريشن 040 (إضافة حالة الحساب status إلى جدول accounts).
  - لوحة الأدمن Dashboard (`/admin/dashboard`) وقائمة الحسابات (`/admin/accounts`) بالبحث والإحصائيات.
  - إعادة تصميم لوحة النظرة العامة (`/admin/dashboard`) بالكامل بأسلوب Stripe Dashboard (مسافات واسعة مريحة + ألوان هادئة حيادية + عرض واسع `max-w-[1440px]` + رسم بياني هادئ بـ Indigo gradient + بطاقات مبسطة بدون ألوان صارخة).
  - إضافة صفحة تفاصيل الحساب (`/admin/accounts/[id]`) لعرض بيانات الحساب وقائمة أعضائه ومستخدميه مع الجلب المستهدف لآخر تسجيل دخول بـ `service_role`.
  - إضافة ميزة تعديل اسم وإيميل أي عضو من صفحة تفاصيل الحساب:
    - نافذة تعديل (Modal Dialog) مع استراتيجية التراجع الذاتي (Rollback Strategy) عند فشل تحديث `profiles`.
    - حماية ثلاثية لمنع تكرار الإيميلات وإظهار رسائل خطأ واضحة بالعربية.
    - إصلاح خلل `useEffect` الذي كان يمنع الكتابة والتعديل داخل حقول الإدخال.
    - تسجيل إشعار تغيير الإيميل في السجلات (`console.log`) للجاهزية لربطه بنظام الإشعارات لاحقاً.
  - ميزة تعليق وإعادة تفعيل الحساب مكتملة ومختبرة 100%:
    - تغيير حالة الحساب (`status` = `suspended` / `active`) يعمل بسلاسة من لوحة الأدمن مع نافذة التأكيد.
    - تطبيق منطق الحظر وطرد الجلسات النشطة بالـ `middleware.ts` مع كاش كوكيز (60s TTL) لحفظ أداء قاعدة البيانات.
    - تم اختبار طرد جلسة مستخدم نشطة وقت التعليق بنجاح وتدمير الكوكيز فوراً.
    - تم اختبار منع تسجيل دخول جديد لحساب معلق بنجاح وعرض رسالة التنبيه باللغة العربية.
    - تم اختبار إعادة تفعيل الحساب والتأكد من استعادة صلاحيات الدخول والتصفح الطبيعي 100%.
  - `Admin Panel: Authentication + Dashboard + Accounts list + Impersonation` (تسجيل دخول كمستخدم) — الكل مكتمل ومختبر. سجل التدقيق `admin_impersonation_logs` يسجل `started_at` و `ended_at` بشكل صحيح (تم إصلاح bug فك تشفير UTF-8 كان يمنع تحديث ended_at).

- ✅ **الخطط والاشتراكات والحدود الشهرية**:
  - `Plans & Subscriptions` مكتمل ومختبر: صفحة إدارة الخطط، تغيير خطة الحساب من الأدمن بانل، مع حفظ السجل التاريخي (canceled + سطر جديد).
  - مفاتيح الميزات والحدود الشهرية والعداد الذري (Phase 2):
    - مايقريشن `043_plan_features_and_usage_limits.sql` مطبق بنجاح مع الدالة الذرية `increment_usage_counter`.
    - موديول التخصيص والفحص المركزي [`src/lib/plans/check-usage-limit.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/plans/check-usage-limit.ts).
    - الفحص حصرياً على الإرسال الصادر (Outbound) في [`send-message.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/whatsapp/send-message.ts)، و[`evolution/send`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/evolution/send/route.ts)، و[`broadcast`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/broadcast/route.ts).
    - تحديث العداد بشكل ذري تلقائي آمن بعد كل عملية إرسال ناجحة.
  - قسم "الخطّة والاستخدام" (Plan & Usage) بشرائح المستخدمين العاديين:
    - مسار آمن مائة بالمائة [`/api/account/subscription`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/subscription/route.ts) يستخرج `account_id` حصراً من جلسة المستخدم المستعلم.
    - واجهة تفاعلية خفيفة [`src/components/settings/plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx) بصفحة الإعدادات (`/settings?tab=plan`) تعرض تفاصيل الخطة، وأشرطة تقدم الرسائل، والبرودكاست، وأعضاء الفريق ملوّنة ديناميكياً، وقائمة الميزات بالرموز، وشريط تحذيري بارز عند استهلاك 100% من الحد.
    - فحص حماية `max_users` عند إنشاء واستبدال الدعوات في [`api/account/invitations/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/invitations/route.ts) و [`api/invitations/[token]/redeem/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/invitations/%5Btoken%5D/redeem/route.ts).
    - تصحيح مفتاح الترجمة `"plan": "Plan & Usage"` بالكامل لمنع ظهور النص الخام `Settings.sections.plan`.
    - تحديث نافذة تعديل الخطة بالأدمن [`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx) والـ API [`api/admin/plans/[id]/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/admin/plans/%5Bid%5D/route.ts) لتشمل `max_messages_monthly` و `max_broadcasts_monthly` ومفاتيح تشغيل/إيقاف ميزات `features` (ai_assistant, excel_export, telegram_bot) لتحديثها بضغطة زر واحدة.

- ✅ **بوابة Plisio وصفحة النجاح والإعدادات التسويقية**:
  - نظام ترقية الخطط الهجين (Hybrid Plan Upgrade):
    - مايقريشن `048_upgrade_requests.sql` المخصص لجدول `upgrade_requests` مع حماية RLS بـ `is_account_member`.
    - مسار آمن [`/api/account/upgrade-request`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-request/route.ts) لتسجيل طلب الترقية كـ `pending` وإنشاء رابط محادثة واتساب موجه للدعم برقم الطلب.
  - Plisio Payment Gateway: بوابة دفع كريبتو حقيقية، إدخال مفتاح الأدمن من site-settings، إنشاء فاتورة تلقائي عند طلب الترقية، webhook محمي (HMAC-SHA1 + منع تكرار + مطابقة مبلغ) يفعّل اشتراك جديد تلقائياً بعد الدفع — مختبر بالكامل بسكربت محاكاة (`scripts/test-plisio-webhook.js`).
    - مايقريشن `049_plisio_payment_integration.sql` مطبق ومفعل بنجاح على قاعدة البيانات (إضافة `plisio_api_key` و `plisio_enabled` لـ `site_settings` وأعمدة الفاتورة لـ `upgrade_requests`).
    - واجهة إعدادات موحدة بالأدمن بانل [`/admin/site-settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/site-settings/page.tsx) لإدخال `Plisio Secret API Key` ومفتاح التفعيل الشامل.
    - إنشاء فواتير Plisio أوتوماتيكياً في [`/api/account/upgrade-request`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-request/route.ts) والتحويل الفوري لصفحة الدفع بالعملات الرقمية (`USDT_TRX`, `BTC`, `ETH`).
    - معالج الـ Webhook الموثق والمحمي ثلاثياً في [`/api/v1/webhooks/plisio`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/v1/webhooks/plisio/route.ts) بمصادقة توقيع `HMAC-SHA1` الحية، والوقاية من Replay attacks ومطابقة المبالغ، وتفعيل اشتراك الحساب بجدول `subscriptions` تلقائياً فور تأكيد الشبكة.
    - صفحة نجاح الاشتراك الاحترافية [`/settings/upgrade-success`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/settings/upgrade-success/page.tsx) مع التحقق المباشر عبر API [`/api/account/upgrade-status`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-status/route.ts) وفحص تفعيل الخطة، وتأثير قصاصات الورق (Confetti)، وعرض كارت ملخص الدفع وزر الانتقال للوحة التحكم.

- ✅ **نظام إعدادات الموقع واللاندنك بيج التسويقية العامة**:
  - مايقريشن `044_site_settings_and_content_pages.sql` مطبق ومفعل بنجاح (تم التراجع عن تعديله المباشر والالتزام التام بقواعد `AGENTS.md`).
  - مايقريشن `045_update_site_settings_partners.sql` مطبق بنجاح لتحديث الشركاء الـ 20 في قاعدة البيانات.
  - لوحة تحكم كاملة بالأدمن [`/admin/site-settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/site-settings/page.tsx) لتعديل اسم المنصة والشعار والحسابات الاجتماعية وشريط الشركاء المتحرك والصفحات الثابتة (HTML/Markdown).
  - لاندنك بيج فائقة الفخامة والتنافسية بأسلوب Wati.io [`src/app/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx): عنوان عريض جداً مع Glowing Pill Highlight، شارة ثقة ومردود النجوم ⭐⭐⭐⭐⭐ (4.9/5)، محاكاة تفاعلية حية لواجهة المنصة والمحادثات بداخل إطار متصفح Mac حقيقي، شريط شركاء متحرك تلقائياً وبشكل مستمر مع 20 شركة عالمية بروابط SVG CDN رسمية، قسم خطط وأسعار ديناميكي، وفوتر منظم بـ 4 أعمدة.
  - مسار ديناميكي للصفحات الثابتة العامة [`/p/[slug]`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/p/%5Bslug%5D/page.tsx) لعرض الشروط والخصوصية وسائر محتويات المنصة.

- ✅ **تجميع الطلبات بالذكاء الاصطناعي وتصدير إكسل والإشعارات**:
  - `AI Order Collection`: بنية كاملة (`order_form_fields`, `orders`, `order_field_values`)، واجهة إدارة الحقول بـ Settings، منطق استخراج واستخدام JSON مدمج بالرد.
  - `Excel Export` للطلبات المؤكدة: صفحة `/orders`، تصدير ديناميكي حسب `order_form_fields` لكل حساب، محكوم بـ `excel_export` feature flag.
  - `Telegram Bot Auto-Notification` للطلبات المؤكدة:
    - مايقريشن `047_telegram_bot_settings.sql` لجدول `telegram_configs` بـ RLS وتشفير AES-256-GCM للتوكن.
    - واجهة إعدادات مخصصة بصفحة الإعدادات (`/settings?tab=telegram`) محكومة بـ `telegram_bot` feature flag مع خيار اختبار الاتصال الفوري بالبوت (Test Connection).
    - إرسال تلقائي غير معطل (Non-blocking Best-effort) لجميع الحقول الديناميكية وبينات العميل لبوت تيليقرام فور تحول الطلب إلى `confirmed`.

- ✅ **إضافة وتوسيع مزودي الذكاء الاصطناعي (Google Gemini 3.6 Flash & Evolution API)**:
  - مايقريشن `050_add_gemini_provider.sql` لتوسيع قيد `provider` في جدول `ai_configs` ليشمل `gemini`.
  - محول المزود الخاص [`src/lib/ai/providers/gemini.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/providers/gemini.ts) للربط مع Google Generative Language v1beta API بـ BYO Key الخاص بالحساب مع التجميع الآلي للرسائل المتتالية وحساب استخدام التوكينات.
  - **تصفية أفكار السلسلة الداخلي (Thought Parts Filtering)**: استبعاد الأجزاء التي تحتوي على `thought: true` في نماذج Gemini التفكيرية (مثل Gemini 2.5/3.6 Flash)، ومنع تسرب أفكار الموديل الداخلي والتعليقات الإنجليزية للعميل على واتساب.
  - **معالجة وحظر الـ JSON غير المغلق (Unclosed ||| Block Handling)**: تحديث [`src/lib/ai/generate.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/generate.ts) باستخدام استراتيجية `indexOf` و `lastIndexOf` لقص بلوك `|||{...}|||` حتى مع الكائنات المتداخلة.
  - **إلزام مطابقة المفتاح البرمجي (`field_key`) للطلب**: إجبار الـ AI على استخدام الـ `field_key` الحرفي وعدم ترجمة المفاتيح للعربية في الـ JSON.
  - **الاستجابة التلقائية عند خطأ الـ LLM (Fallback & Auto-Handoff)**: إرسال رسالة اعتذار تلقائية مهذبة للعميل عند حدوث خطأ بالمزود وتعطيل البوت وتحويل المحادثة لموظف بشري فوراً.
  - **دعم الردود غير المحدودة بالذكاء الاصطناعي (-1 Unlimited Auto-Replies Cap)**: مايقريشن `051_allow_unlimited_ai_auto_replies.sql` لتحديث قيد `CHECK (auto_reply_max_per_conversation = -1 OR (auto_reply_max_per_conversation >= 1 AND auto_reply_max_per_conversation <= 500))` ودالة `claim_ai_reply_slot` لدعم `-1` دون قيد أقصى.
  - **توسيع سقف التوكنات الناتجة (`MAX_OUTPUT_TOKENS` = 4096)**: لمنع استهلاك توكنات الـ Thinking لرد البوت وبلوك الـ JSON الاستخراجي وحل مشكلة انقطاع الردود بمنتصف الجملة.

- ✅ **التدويل ولغات المنصة (i18n & Arabic Support)**:
  - تدويل كامل شاشات الأدمن بانل (Dashboard, Accounts, Plans, Site Settings) واستخدام `next-intl` مع قواميس `messages/ar.json` و `messages/en.json`.
  - تنسيق الأرقام ديناميكياً ببطاقات الإحصائيات والاشتراكات `toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')`.
  - التفكيك الذكي لأسماء الخطط المزدوجة `Free / المجانية` لتعرض اسمها العربي الفصيح في الواجهة العربية ومقابلها الإنجليزي بالواجهة الإنجليزية.
  - ترجمة وتدويل حالات اتصال Evolution API مع الإبقاء الحاسم القاطع على قيم الـ Status البرمجية والـ Enums الثابتة بالـ DB كما هي بدون أي تغيير.
  - حماية وتعقيم صفحات المحتوى العام `/p/[slug]` ومسار حفظ الإعدادات بـ `isomorphic-dompurify` ضد ثغرات XSS.

---

- ✅ **بوابة دفع سترايب (Stripe Payment Gateway) والترقية التلقائية للاشتراكات**:
  - **مايقريشن الإعدادات `062_add_stripe_settings.sql`**: إضافة أعمدة `stripe_enabled`, `stripe_publishable_key`, `stripe_secret_key`, و `stripe_webhook_secret` إلى جدول `site_settings`.
  - **لوحة إعدادات الأدمن الشاملة (`/admin/settings`)**: بطاقة كاملة للتحكم بمفاتيح Stripe مع إمكانية إظهار/إخفاء المفتاح السري، وبادج حالة البوابة.
  - **إصلاح محرك الخصومات والأسعار**: تحديث `checkout/route.ts` و `upgrade-request/route.ts` و `plisio/route.ts` لاحتساب السعر المخصم `price_monthly_discounted` و `price_yearly_discounted` أولاً قبل السعر الأصلي.
  - **حل مشكلة الترقية التلقائية للباقة**: تصحيح الاستعلام في جدول `profiles` من `.eq('id', user.id)` إلى `.eq('user_id', user.id)`، مما مكن من استخراج `account_id` بدقة وتمريره لسترايب وتحديث `accounts.plan_id` وجدول الاشتراكات تلقائياً فور الدفع.
  - **تنظيف جلسات URL ومنع الإشعارات المتكررة**: إضافة `verifiedSessionRef` واستخدام `window.history.replaceState` لإزالة معلمات `payment` و `session_id` فور التأكيد، مما منع تكرار الـ Toasts وقفل الـ Refresh.
  - **تجهيز الخطة المجانية ($0)**: إخفاء بوابات الدفع عن الخطة المجانية وتوليد معالج تفعيل مباشر تلقائي (`/api/account/activate-free-plan`).

- ✅ **إدارة ميزات الخطط (الأتمتة ومسارات العمل Flows)**:
  - إضافة ميزتي **"⚡ الأتمتة والردود الآلية"** (`automations`) و **"🔀 منشئ مسارات العمل"** (`flows_builder`) لبنية البيانات ولواجهة التحكم بالخطط للأدمن (`/admin/plans`).
  - توفير أزرار تحكم صح/خطأ بجميع نماذج التعديل، ومزامنة ميزات الباقات فورياً عبر جدول `plans`.

- ✅ **مبدّل دورة الفوترة (شهرياً / سنوياً)**:
  - إضافة زر تبديل تفاعلي في واجهة المستخدم بـ `/settings?tab=plan` للاختيار بين **"📅 فوترة شهرية"** و **"🎁 فوترة سنوية (توفير سنوي)"**.
  - احتساب الأسعار ديناميكياً وإظهار خصومات الفوترة السنوية وإرسال `billing_cycle` تلقائياً لبوابات الدفع.

- ✅ **إدارة صفحات المحتوى والسياسات العامة (Content Pages Manager & Public CMS)**:
  - إضافة واجهة إدارة المحتوى القانوني والعمومي بالأدمن بـ `/admin/pages` مع دعم إنشاء، تعديل، حذف، ونشر الصفحات (سياسة الخصوصية، الشروط والأحكام، من نحن، اتصل بنا).
  - إضافة مسارات عامة بـ `/p/[slug]` وتنسيقها بأناقة وعرضها بأسلوب فاخر مع التصفية والتعقيم ضد ثغرات XSS باستخدام `isomorphic-dompurify`.
  - توفير قوالب محتوى أولية جاهزة وثنائية اللغة (عربي/إنجليزي) للصفحات الأربع الرئيسية مع واجهات `API` كاملة للـ CRUD.

- ✅ **التدويل ثنائي اللغة الكامل للأدمن واللوحة العامة (Full Bilingual Admin Panel & CMS)**:
  - **صفحة نظرة عامة الأدمن (`/admin`)**: تدويل المؤشرات الإحصائية، أزرار التحديث، ومراقب صحة النظام.
  - **دليل الحسابات والمستأجرين (`/admin/accounts`)**: تدويل الجداول، البحث، الفلاتر، حقول تعديل الخطة، مودال إعادة كلمة السر، وتنسيق التواريخ `locale` باللغتين.
  - **إدارة خطط الأسعار والاشتراكات (`/admin/plans`)**: تدويل محرر الخطط، السقوف، شارات الأكثر شيوعاً، وميزات الأتمتة والذكاء الاصطناعي.
  - **لوحة التحكم والإعدادات الشاملة (`/admin/settings`) بجميع تبويباتها الـ 6**:
    - **التبويب 1 (الهوية والشعار والألوان والدعم)**: تدويل الشعار، ارتفاع الشعار، ألوان الهوية (`Primary, Background, Cards Surface, Main Text, Subtitles`)، قنوات الواتساب/التلغرام/البريد وسائط التواصل.
    - **التبويب 2 (قسم الهيرو والـ Hero Section)**: تدويل محرر النصوص، العناوين الرئيسية، الكلمة المظللة بالأخضر، الشارة العلوية، وأزرار `CTA 1` و `CTA 2`.
    - **التبويب 3 (بطاقات الميزات وخطوات كيف يعمل)**: تدويل بطاقات الميزات الـ 6 وخطوات `How It Works` الـ 3.
    - **التبويب 4 (الأسئلة الشائعة والتقييمات وبنر الختام)**: تدويل محرر الأسئلة الشائعة FAQs، تقييمات العملاء وعدد النجوم ⭐، وبنر الدعوة للتسجيل بختام الموقع.
    - **التبويب 5 (الشركاء والشريط المتحرك)**: تدويل محرر الشركات بالشريط المتحرك وشريط التحكم بتباعد الشعارات بالبكسل (`Partner Logos Spacing`).
    - **التبويب 6 (بوابات الدفع الإلكتروني)**: تدويل إعدادات مفاتيح Stripe و Plisio للدفع بالكريبتو والبطاقات، مع حذف كرت وضع الصيانة الكلي بناءً على طلب المستخدم.

- ✅ **التدويل والترجمة الإنجليزية الشاملة لصفحة خطط واستخدام الزبون (`Plan & Usage` User Panel)**:
  - **لوحة الاستهلاك السريعة بـ `/settings/plan` (`PlanUsagePanel`)**: تدويل صناديق الاستهلاك الأربعة (الرسائل الشهرية، جهات الاتصال، أعضاء الفريق، والطلبات والمبيعات).
  - **مؤشرات السقوف والرصيد**: تدويل الحقول (`Messages Sent`, `Saved Contacts`, `Account Members`, `Added Orders`, `Remaining`, `Unlimited ♾️`).
  - **قائمة ميزات الخطة المتاحة**: تدويل ميزات Gemini AI, Automations, Flows Builder, Excel Export, Telegram Bot.
  - **بطاقات الخطط المتاحة وأزرار الفوترة**: تدويل الشارات (`Most Popular Plan 🔥`, `Current Active Plan ✓`, `Special Offer 🏷️`) والتعرفة السنوية/الشهرية (`/month` vs `/year`).
  - **أزرار الترقية وبوابات الدفع**: تدويل أزرار الدفع (`Pay with Card (Visa / MasterCard)`, `Pay with Crypto (USDT / Bitcoin)`, `Switch to Free Plan 🎁`).
  - **نافذة الترقية المباشرة (`UpgradePlanModal`)**: تدويل جميع النصوص، العناوين، التحذيرات، والروابط باللغتين العربية والإنجليزية.

- ✅ **نظام تذاكر الدعم الفني المباشر والمرفقات بالمنصة (In-Platform Support Tickets System)**:
  - **مايقريشن `067_support_tickets_system.sql`**: إنشاء جدولي `support_tickets` و `support_ticket_messages` مع تفعيل RLS وإنشاء storage bucket `support-attachments` لحفظ ومشاركة الصور والمرفقات.
  - **التحديث التلقائي الفوري والاشتراك المباشر (Supabase Realtime & 3s Live Polling)**:
    - إضافة اشتراك Supabase Realtime وقناة `postgres_changes` على جدول `support_ticket_messages` وجدول `support_tickets`.
    - إضافة فحص فوري هادئ (Silent Refresh Interval) كل 3 ثواني عند فتح نافذة التذكرة، لتبادُل الرسائل فورياً بين العميل والأدمن دون الحاجة لإغلاق وفتح النافذة.
  - **تدويل كروت إعدادات Stripe و Google Auth باللغتين العربية والإنكليزية (`Full Bilingual Site Settings Cards`)**:
    - **التدقيق والترجمة**: جعل كروت وعناوين وشروحات ومفاتيح تفعيل كرت **Stripe Payment Gateway** وكرت **Google OAuth Single Sign-On** ثنائية اللغة (`isAr ? ... : ...`).
    - **النتيجة**: عند التبديل إلى اللغة الإنكليزية (`EN`) تتحول جميع العناوين والشروحات والمفاتيح فورياً وبسلاسة إلى الإنكليزية، وعند اختيار العربية (`AR`) تعود بالكامل للعربية دون أي نص ثابت غير مترجم.
  - **إصلاح مشكلة إغلاق وإعادة فتح نافذة التذكرة تلقائياً (Modal Re-opening Fix)**:
    - إضافة مرجع `activeTicketIdRef` لربط حالة النافذة المفتوحة بشكل مطلق.
    - منع طلبات التحديث الصامت أو أحداث Realtime من إعادة فتح نافذة الشات إذا قام المستخدم أو الأدمن بالنقر على زر إغلاق النافذة.
  - **مسارات الـ API بالجانبين (`User & Admin API Routes`)**:
    - للمستخدم: `/api/support/tickets` (عرض وتوليد تذكرة)، `/api/support/tickets/[id]` (جلب المحادثة وإرسال رد للتذاكر المفتوحة فقط)، و `/api/support/upload` (رفع صور ومرفقات).
    - للسوبر أدمن: `/api/admin/tickets` (عرض جميع التذاكر من كافة المستأجرين مع خيارات التصفية)، و `/api/admin/tickets/[id]` (الرد الرسمي من الأدمن، والتحكم بحالة التذكرة: "تم حل المشكلة ✅"، "إغلاق التذكرة 🛑"، أو "إعادة فتح 🔄").
  - **واجهة المستخدم (`SupportPanel`)**: إضافة قسم كامل لتذاكر الدعم الفني تحت أزرار التواصل المباشر مع زر "إنشاء تذكرة دعم جديدة 🎫"، رفع الصور والمعاينة، تتبع الرسائل بالحوار التفاعلي، وإغلاق/إعادة فتح التذكرة.
  - **واجهة السوبر أدمن (`/admin/tickets`)**: إنشاء صفحة إدارية كاملة ثنائية اللغة لإدارة تذاكر جميع الحسابات، عرض البطاقات الإحصائية، البحث والتصفية بحسب الحالة، وفتح دراور المحادثة للرد المباشر بضغطة زر.
  - **التنقل برأسية الأدمن (`AdminNav`)**: إضافة خيار **"تذاكر الدعم الفني"** بالقائمة العلويّة للأدمن.

- ✅ **التصميم المرئي الفاخر والتوافق مع الهواتف الذكية (Rich Aesthetics & Mobile Responsiveness)**:
  - إعادة تصميم كروت الاشتراكات بالكامل بأسلوب زجاجي حديث (`Glassmorphic Rounded Cards`) وبأطر مشعة للباقة المفعلة (`Emerald Glow`) والباقة الشائعة (`Amber Glow`).
  - هيكلة سقوف الاستخدام ببطاقات منسقة وأيقونات دلالية حية (`Users`, `UsersRound`, `MessageSquare`, `ShoppingBag`, `Radio`).
  - أزرار دفع تفاعلية ملونة بتدرجات متناسقة (`Gradient Buttons`) مع وظائف لمس متناسقة 100% مع شاشات الهواتف الجوالة دون أي شريط تمرير أفقي.

- ✅ **شريط الشركاء المتحرك والشعارات الرسمية (Marquee Loop & CDN Logos)**:
  - إصلاح حلقة الحركة الانهائية بالصفحة الرئيسية وتكرار القائمة بسلاسة.
  - توفير إمكانية تعديل صيغ وروابط شعارات الشركاء عالمياً من لوحة الأدمن.

- ✅ **نظام تسمية المنصة ثنائي اللغة المستقل بالكامل (Independent Bilingual Platform Name Architecture)**:
  - **مايقريشن `073_add_bilingual_platform_name.sql`**: إضافة عمودي `platform_name_ar` و `platform_name_en` لجدول `site_settings`.
  - **حقول إدخال مستقلة ومباشرة**: تحديث واجهة إعدادات الموقع (`/admin/site-settings`) لتوفير حقلين مستقلين لاسم المنصة (بالعربية 🇸🇦 وبالإنجليزية 🇬🇧) بدون أي قيم افتراضية مفروضة برمجياً أو دمج قسري بين اللغتين.
  - **تحسين مسارات الـ API**: تحديث الـ APIs (`/api/admin/site-settings` و `/api/site-settings`) لمعالجة وتحييد القيم الفارغة دون التسبب بأي تضارب أو رجوع صامت للغة الأخرى عند تحديث الصفحة.
  - **العرض الديناميكي الشامل بحسب لغة التصفح المحلية**:
    - **لوحة المستخدم الجانبية (`Sidebar`)**: عرض اسم المنصة المخصص بحسب لغة الجلسة.
    - **لوحة الأدمن الجانبية (`AdminNav`)**: عرض اسم المنصة المخصص بحسب اللغة المختارة دون نصوص ثابتة.
    - **صفحة الهبوط العامة والصفحات الثابتة (`Landing Page & Static CMS`)**: عرض الاسم بالعربية للزوار العرب وبالإنجليزية للزوار الأجانب.
    - **صفحات تسجيل الدخول والتسجيل (`Auth Shell`)**: ربط هيدر التوثيق باسم المنصة والشعار الديناميكي.

- ✅ **إصلاح حفظ وعرض شعار المنصة المزدوج بجميع الواجهات (`Full Multi-Platform Dynamic Logo Architecture`)**:
  - **إصلاح خادم الحفظ (`/api/admin/site-settings`)**: إضافة حقل `logo_url` إلى مصفوفة التحديث `updateObj` لضمان حفظ الشعار فورياً في قاعدة البيانات عند ضغط الأدمن على "حفظ الإعدادات".
  - **دعم النمطين (رفع من الجهاز + رابط مباشر)**: التوافق الكامل مع رفع ملف صورة من الجهاز عبر `/api/admin/upload-logo` (مع معاينة مباشرة وخيار حذف) أو لصق رابط صورة مباشر URL.
  - **تفعيل عرض الشعار فورياً وللجميع في**:
    - **صفحة الهبوط العامة (`Landing Page Header & Footer`)**
    - **صفحات تسجيل الدخول وإنشاء الحساب (`Auth / Signup / Login`)**
    - **لوحة المستخدم الجانبية (`User Panel Sidebar`)**
    - **لوحة الأدمن الجانبية (`Admin Panel Navigation Header`)**

- ✅ **إصلاح أخطاء الـ Hydration وتحذيرات الـ Scripts في Next.js 16**:
  - استبدال وسم `<script>` التقليدي بـ `<Script id="theme-boot" strategy="beforeInteractive">` المعتمد في Next.js لمنع تحذيرات الـ Console.
  - ضبط حالة البدء في المكونات لتتطابق 100% بين السيرفر (SSR) والعميل أثناء الإقلاع، وتحميل التخزين المؤقت `localStorage` داخل `useEffect` مع إضافة `suppressHydrationWarning`.

- ✅ **التحكم المستقل بقنوات الدعم المباشر لوحة المستخدم (`User Panel Support Channel Controls`)**:
  - **مايقريشن `072_add_user_panel_support_enabled.sql`**: إضافة عمود `user_panel_support_enabled` JSONB.
  - **مفاتيح التحكم بالأدمن**: إضافة مفاتيح تفعيل/تعطيل لكل من واتساب، تلغرام، والبريد الإلكتروني على حدة للوحة المستخدمين.
  - **الالتزام بالرؤية باللوحة**: إخفاء/إظهار قنوات الدعم تلقائياً في `support-panel.tsx` بناءً على إعدادات الأدمن.

- ✅ **دليل ربط ووكومرس والسلات المتروكة والأتمتة في الإعدادات (`WooCommerce & Cart Abandonment Integration Guide`)**:
  - **إصلاح تشفير الملف (`UTF-8`)**: حل مشكلة الـ UTF-8 Stream Decoding Error في `integrations-panel.tsx` وإصلاح البناء مع Next.js SWC Loader.
  - **دليل ربط ووكومرس التفاعلي**: خطوات استخراج مفاتيح REST API بصلاحيات Read/Write وإعداد الـ Webhooks لحدث `Order created`.
  - **تعليمات أتمتة تأكيد الطلبات**: شرح كامل لخطوات إنشاء ووركفلو `E-Commerce: Order Created` مع المتغيرات التلقائية (`{{ customer.name }}`, `{{ order.number }}`, `{{ order.total }}`).
  - **نظام السلات المتروكة (`Cart Abandonment Recovery`)**: إضافة خطوات تثبيت وضبط إضافة ووكومرس مع ربط الـ Webhook المباشر، وتوثيق طريقة إنشاء أتمتة `E-Commerce: Cart Abandoned` بالمنصة مع رابط الاسترجاع الذكي `{{ recovery_url }}` لاستعادة الزبائن الذين ملأوا بياناتهم ولم يكملوا الشراء.

- ✅ **قسم وميزات ربط ووكومرس وشوبيفاي في اللاندينج بيج (`E-Commerce Landing Showcase`)**:
  - **مكون `LandingEcommerceSection`**: إنشاء قسم جمالي متكامل يعرض شعارات ووكومرس وشوبيفاي مع شارات الربط الفوري بدون كود (`1-Click No-Code Connect`).
  - **محاكاة حية لرسائل الواتساب**: معاينة تفاعلية لرسائل تأكيد الطلبات (`Order Confirmation`) واسترجاع السلات المتروكة مع كود الخصم ورابط الاستعادة الذكي.
  - **التكامل بالصفحات**: تضمين القسم في الصفحة الرئيسية (`src/app/page.tsx`) وصفحة المميزات (`src/app/features/page.tsx`) مع دعم كامل للغتين العربية والإنجليزية والوضعين الفاتح والداكن.

---

## شغال عليه الحين
- 🔜 المرحلة القادمة: الاختبار النهائي الشامل وتجهيز البيئة للنشر الفعلي.

## قرارات معمارية مهمة (لا تتغير بدون نقاش)
- استخدمنا `account_id` بدلاً من `organization_id`.
- `one-account-per-user` (المستخدم عضو بحساب واحد فقط بنفس الوقت).

## مشاكل معروفة / ملاحظات
- 📌 عند الاستعلام عن جدول `profiles` في قاعدة البيانات، يجب البحث دائماً بالعمود `user_id = user.id` وليس `id = user.id`.
- 📌 عند إضافة أي نص جديد بملفات الترجمة يحتوي أقواس مزدوجة {{ }} حرفية أو HTML attributes داخل tags، يجب تغليفها/تنظيفها حسب معايير next-intl ICU.