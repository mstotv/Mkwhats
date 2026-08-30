# حالة المشروع - آخر تحديث: [30/8/2026]

## آخر شي خلص وشغال 100%

- ✅ **نظام حجز وإدارة المواعيد المستقل بالذكاء الاصطناعي (AI Automated Appointments System - Phase 1)**:
  - **قواعد البيانات ودوال التحقق (`supabase/migrations/076` & `077`)**:
    - مايقريشن `076_appointments_core.sql`: إنشاء جدول `business_hours` (أيام وساعات العمل 0..6)، جدول `appointment_settings` (المدة الافتراضية، المنطقة الزمنية `timezone` الافتراضية `Asia/Baghdad`، رسائل التأكيد وتسمية الخدمة)، وجدول `appointments` (معرف المحادثة والعميل والخدمة والوقت المخزن بـ UTC وحالات pending/confirmed/cancelled/no_show)، ومفتاح `appointments_enabled` بجدول `ai_configs` مع حماية RLS عبر `is_account_member(account_id)`.
    - مايقريشن `077_appointments_availability_fn.sql`: دالة SQL `check_slot_availability(p_account_id, p_requested_utc, p_exclude_id)` للتحقق الذري من ساعات وأيام العمل والأيام المغلقة ومنع تداخل المواعيد (Overlap check عبر `tstzrange`).
  - **طبقة الخدمات والـ API Routes**:
    - مسارات إدارة المواعيد: `/api/appointments` (GET, POST, PATCH, DELETE)، مسار فحص التوفر `/api/appointments/availability`، ومسارات إعدادات ساعات العمل `/api/account/business-hours` وإعدادات المواعيد `/api/account/appointment-settings`.
    - موديول الخدمات المساعدة [`src/lib/appointments/appointment-service.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/appointment-service.ts) والأنواع [`types.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/appointments/types.ts).
  - **الدمج الذكي مع محرك الذكاء الاصطناعي (Independent AI Context & Auto-Reply Engine)**:
    - فصل كامل ومستقل 100% عن نظام جمع الطلبات `order_collection` دون أي تداخل في الحالة (State) أو الـ JSON block.
    - حقن `appointmentContext` في الـ System Prompt بالمنطقة الزمنية المحلية وتنسيق ساعات العمل.
    - استخراج وحجز المواعيد آلياً عبر الـ JSON Block `{"appointment": {...}}` مع التحقق التلقائي من التوفر وتأكيد الموعد فورياً.
  - **منظومة إشعارات تيليقرام الآلية للمواعيد (Telegram Appointment Notifications)**:
    - دالة `sendTelegramAppointmentNotification` بـ [`src/lib/telegram/send-notification.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/telegram/send-notification.ts) لإرسال إشعار فوري منسق بـ HTML عند تأكيد أي موعد جديد يتضمن اسم العميل، الهاتف، الخدمة، والوقت بتوقيت الحساب المحلي.
  - **واجهة الإعدادات ولوحة التحكم (Settings & Dashboard Appointments Page)**:
    - واجهة إعدادات مخصصة بـ Settings → Appointments ([`AppointmentsSettings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/appointments-settings.tsx)) لضبط مفتاح الذكاء الاصطناعي، مدة الموعد، التايم زون، وجدول أوقات العمل لكل يوم.
    - صفحة إدارة المواعيد الفاخرة [`/appointments`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/appointments/page.tsx) مع بطاقات إحصائية، فلاتر الحالات، بحث سريع، وتغيير الحالات، ومودال إضافة موعد يدوي.
    - إضافة رابط المواعيد بالقائمة الجانبية [`Sidebar`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/layout/sidebar.tsx) مع أيقونة Calendar والتدويل الكامل.

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

---

## شغال عليه الحين
- 🔜 المرحلة القادمة: الاختبار النهائي الشامل وتجهيز البيئة للنشر الفعلي.

## قرارات معمارية مهمة (لا تتغير بدون نقاش)
- استخدمنا `account_id` بدلاً من `organization_id`.
- `one-account-per-user` (المستخدم عضو بحساب واحد فقط بنفس الوقت).

## مشاكل معروفة / ملاحظات
- 📌 عند الاستعلام عن جدول `profiles` في قاعدة البيانات، يجب البحث دائماً بالعمود `user_id = user.id` وليس `id = user.id`.
- 📌 عند إضافة أي نص جديد بملفات الترجمة يحتوي أقواس مزدوجة {{ }} حرفية أو HTML attributes داخل tags، يجب تغليفها/تنظيفها حسب معايير next-intl ICU.