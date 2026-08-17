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

- ✅ نظام محرك الأوتوميشن وجدولة خطوات الانتظار (Automation Wait Step Engine & Scheduler):
  - **التشخيص الدقيق وفحص الجدول**: فحص وحل مشكلة توقف خطوات الانتظار (`Wait`) التي كانت تتوقف عند حالة `pending` في جدول `automation_pending_executions`.
  - **الدعم الشامل لوحدات الوقت (دقائق، ساعات، وأيام)**: احتساب وحفظ الوقت المستهدف بـ UTC الدقيق (`run_at = NOW() + duration`) ومقارنته بـ `run_at <= NOW()` ليعمل بسلاسة مع أي مدة إمهال.
  - **العمل في التطوير المحلي (Local Dev Background Poller)**: وحدة استطلاع دورية محددة بـ 15 ثانية في [`src/lib/automations/local-poller.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/automations/local-poller.ts).
  - **الجدولة في الإنتاج (Vercel Cron)**: تهيئة ملف [`vercel.json`](file:///c:/Users/Mustafa/Desktop/mk%20whats/vercel.json) لجدولة استدعاء المسار `/api/automations/cron` كل دقيقة.
  - **الفهرسة وتسريع الاستعلامات**: مايقريشن `052_automation_wait_indexing.sql` لإضافة فهرس جزئي `idx_automation_pending_run_at`.

- ✅ multi-tenant migration (017-036) مطبق ومختبر يدوياً بحسابين حقيقيين.
- ✅ RLS شغال على كل الجداول، بدون تداخل بيانات بين الحسابات.
- ✅ Evolution API integration مكتمل ومختبر على production (استقبال + إرسال).
- ✅ Admin Panel Authentication + Dashboard + Accounts list + Impersonation + Plans management — الكل مكتمل ومختبر 100%.

---

## شغال عليه الحين
- 🔜 المرحلة القادمة: تجهيز النشر النهائي والاختبارات التفاعلية الشاملة قبل التسليم.

## قرارات معمارية مهمة (لا تتغير بدون نقاش)
- استخدمنا `account_id` بدلاً من `organization_id`.
- `one-account-per-user` (المستخدم عضو بحساب واحد فقط بنفس الوقت).