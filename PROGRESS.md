# حالة المشروع - آخر تحديث: [17/8/2026]

## آخر شي خلص وشغال 100%

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

## شغال عليه الحين
- 🔜 المرحلة القادمة: تجهيز النشر النهائي والاختبارات التفاعلية الشاملة قبل التسليم.

## قرارات معمارية مهمة (لا تتغير بدون نقاش)
- استخدمنا `account_id` بدلاً من `organization_id`.
- `one-account-per-user` (المستخدم عضو بحساب واحد فقط بنفس الوقت).

## مشاكل معروفة / ملاحظات
- 📌 أصلحنا دفعة أخطاء ترجمة متكررة (roles, telegram, api-keys, templates, automations.builder.delete) — عند إضافة أي نص جديد بملفات الترجمة يحتوي أقواس مزدوجة {{ }} حرفية أو HTML attributes داخل tags، يجب تغليفها/تنظيفها حسب معايير next-intl ICU.