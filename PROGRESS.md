# حالة المشروع - آخر تحديث: [3/8/2026]

## آخر شي خلص وشغال 100%
- multi-tenant migration (017-036) مطبق ومختبر يدوياً بحسابين حقيقيين
- RLS شغال على كل الجداول، بدون تداخل بيانات بين الحسابات
- ✅ Evolution API integration مكتمل ومختبر على production (استقبال + إرسال). التفاصيل الكاملة بملف docs/evolution-integration-report.md
- ✅ Admin Panel Authentication مكتمل ومختبر محلياً (platform_admins + rate limiting + middleware protection)
- ✅ مايقريشن 040 (إضافة حالة الحساب status إلى جدول accounts)
- ✅ لوحة الأدمن Dashboard (/admin/dashboard) وقائمة الحسابات (/admin/accounts) بالبحث والإحصائيات
- ✅ إعادة تصميم لوحة النظرة العامة (/admin/dashboard) بالكامل بأسلوب Stripe Dashboard (مسافات واسعة مريحة + ألوان هادئة حيادية + عرض واسع max-w-[1440px] + رسم بياني هادئ بـ Indigo gradient + بطاقات مبسطة بدون ألوان صارخة)

- ✅ إضافة صفحة تفاصيل الحساب (/admin/accounts/[id]) لعرض بيانات الحساب وقائمة أعضائه ومستخدميه مع الجلب المستهدف لآخر تسجيل دخول بـ service_role
- ✅ إضافة ميزة تعديل اسم وإيميل أي عضو من صفحة تفاصيل الحساب:
  - نافذة تعديل (Modal Dialog) مع استراتيجية التراجع الذاتي (Rollback Strategy) عند فشل تحديث `profiles`.
  - حماية ثلاثية لمنع تكرار الإيميلات وإظهار رسائل خطأ واضحة بالعربية.
  - إصلاح خلل `useEffect` الذي كان يمنع الكتابة والتعديل داخل حقول الإدخال.
  - تسجيل إشعار تغيير الإيميل في السجلات (`console.log`) للجاهزية لربطه بنظام الإشعارات لاحقاً.
- ✅ ميزة تعليق وإعادة تفعيل الحساب مكتملة ومختبرة 100%:
  - تغيير حالة الحساب (`status` = `suspended` / `active`) يعمل بسلاسة من لوحة الأدمن مع نافذة التأكيد.
  - تطبيق منطق الحظر وطرد الجلسات النشطة بالـ `middleware.ts` مع كاش كوكيز (60s TTL) لحفظ أداء قاعدة البيانات.
  - تم اختبار طرد جلسة مستخدم نشطة وقت التعليق بنجاح وتدمير الكوكيز فوراً.
  - تم اختبار منع تسجيل دخول جديد لحساب معلق بنجاح وعرض رسالة التنبيه باللغة العربية.
  - تم اختبار إعادة تفعيل الحساب والتأكد من استعادة صلاحيات الدخول والتصفح الطبيعي 100%.
- ✅ Admin Panel: Authentication + Dashboard + Accounts list + Impersonation (تسجيل دخول كمستخدم) — الكل مكتمل ومختبر. سجل التدقيق admin_impersonation_logs يسجل started_at وended_at بشكل صحيح (تم إصلاح bug فك تشفير UTF-8 كان يمنع تحديث ended_at).
- ✅ Plans & Subscriptions مكتمل ومختبر: صفحة إدارة الخطط، تغيير خطة الحساب من الأدمن بانل، مع حفظ السجل التاريخي (canceled + سطر جديد).
- ✅ مفاتيح الميزات والحدود الشهرية والعداد الذري (Phase 2):
  - مايقريشن `043_plan_features_and_usage_limits.sql` مطبق بنجاح مع الدالة الذرية `increment_usage_counter`.
  - موديول التخصيص والفحص المركزي [`src/lib/plans/check-usage-limit.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/plans/check-usage-limit.ts).
  - الفحص حصرياً على الإرسال الصادر (Outbound) في [`send-message.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/whatsapp/send-message.ts)، و[`evolution/send`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/evolution/send/route.ts)، و[`broadcast`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/whatsapp/broadcast/route.ts).
  - تحديث العداد بشكل ذري تلقائي آمن بعد كل عملية إرسال ناجحة.
- ✅ قسم "الخطّة والاستخدام" (Plan & Usage) بشرائح المستخدمين العاديين:
  - مسار آمن مائة بالمائة [`/api/account/subscription`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/subscription/route.ts) يستخرج `account_id` حصراً من جلسة المستخدم المستعلم.
  - واجهة تفاعلية خفيفة [`src/components/settings/plan-usage-panel.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/plan-usage-panel.tsx) بصفحة الإعدادات (`/settings?tab=plan`) تعرض تفاصيل الخطة، وأشرطة تقدم الرسائل، والبرودكاست، وأعضاء الفريق ملوّنة ديناميكياً، وقائمة الميزات بالرموز، وشريط تحذيري بارز عند استهلاك 100% من الحد.
  - فحص حماية `max_users` عند إنشاء واستبدال الدعوات في [`api/account/invitations/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/invitations/route.ts) و [`api/invitations/[token]/redeem/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/invitations/%5Btoken%5D/redeem/route.ts).
  - تصحيح مفتاح الترجمة `"plan": "Plan & Usage"` بالكامل لمنع ظهور النص الخام `Settings.sections.plan`.
  - تحديث نافذة تعديل الخطة بالأدمن [`edit-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/_components/edit-plan-modal.tsx) والـ API [`api/admin/plans/[id]/route.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/admin/plans/%5Bid%5D/route.ts) لتشمل `max_messages_monthly` و `max_broadcasts_monthly` ومفاتيح تشغيل/إيقاف ميزات `features` (ai_assistant, excel_export, telegram_bot) لتحديثها بضغطة زر واحدة.
- ✅ نظام إعدادات الموقع واللاندنك بيج التسويقية العامة:
  - مايقريشن `044_site_settings_and_content_pages.sql` مطبق ومفعل بنجاح (تم التراجع عن تعديله المباشر والالتزام التام بقواعد `AGENTS.md`).
  - مايقريشن `045_update_site_settings_partners.sql` مطبق بنجاح لتحديث الشركاء الـ 20 في قاعدة البيانات.
  - لوحة تحكم كاملة بالأدمن [`/admin/site-settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/site-settings/page.tsx) لتعديل اسم المنصة والشعار والحسابات الاجتماعية وشريط الشركاء المتحرك والصفحات الثابتة (HTML/Markdown).
  - لاندنك بيج فائقة الفخامة والتنافسية بأسلوب Wati.io [`src/app/page.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/page.tsx): عنوان عريض جداً مع Glowing Pill Highlight، شارة ثقة ومردود النجوم ⭐⭐⭐⭐⭐ (4.9/5)، محاكاة تفاعلية حية لواجهة المنصة والمحادثات بداخل إطار متصفح Mac حقيقي، شريط شركاء متحرك تلقائياً وبشكل مستمر مع 20 شركة عالمية بروابط SVG CDN رسمية، قسم خطط وأسعار ديناميكي، وفوتر منظم بـ 4 أعمدة.
  - مسار ديناميكي للصفحات الثابتة العامة [`/p/[slug]`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/p/%5Bslug%5D/page.tsx) لعرض الشروط والخصوصية وسائر محتويات المنصة.
- ✅ AI Order Collection: بنية كاملة (order_form_fields, orders, order_field_values)، واجهة إدارة الحقول بـ Settings، منطق استخراج واستخدام JSON مدمج بالرد. يحتاج مفتاح AI فعّال (OpenAI/Anthropic برصيد) للتفعيل والاختبار الكامل من طرف لطرف.
- ✅ Excel Export للطلبات المؤكدة: صفحة /orders، تصدير ديناميكي حسب order_form_fields لكل حساب، محكوم بـ excel_export feature flag، يحدث status لـ exported بعد التصدير — مختبر بنجاح.
- ✅ Telegram Bot Auto-Notification للطلبات المؤكدة:
  - مايقريشن `047_telegram_bot_settings.sql` لجدول `telegram_configs` بـ RLS وتشفير AES-256-GCM للتوكن.
  - واجهة إعدادات مخصصة بصفحة الإعدادات (`/settings?tab=telegram`) محكومة بـ `telegram_bot` feature flag مع خيار اختبار الاتصال الفوري بالبوت (Test Connection).
  - إرسال تلقائي غير معطل (Non-blocking Best-effort) لجميع الحقول الديناميكية وبينات العميل لبوت تيليقرام فور تحول الطلب إلى `confirmed`.
  - إصلاح زر التشغيل (Switch Button) في وضع RTL بإضافة `dir="ltr"` لمنع خروج الدائرة خارج الإطار البيضاوي في كل صفحات المنصة.
  - إصلاح معالجة الأخطاء في `PresenceHeartbeat` لتفادي أخطاء `TypeError: Failed to fetch` في الكونسول عند الانقطاع الشبكي المؤقت.








## شغال عليه الحين
- 🔜 التالي: إعادة تصميم صفحة إدارة الحسابات (/admin/accounts) بأسلوب Vercel/Supabase (Data-dense)

## الجاي بالترتيب
1. إعادة تصميم صفحة إدارة الحسابات (/admin/accounts) بأسلوب Vercel/Supabase (Data-dense)
2. المرحلة الثانية لنظام الاشتراكات (ربط بوابات الدفع والتجديد التلقائي)

## قرارات معمارية مهمة (لا تتغير بدون نقاش)
- استخدمنا account_id مب organization_id (تسمية موجودة بالكود أصلاً)
- one-account-per-user (المستخدم عضو بحساب وحد بس بنفس الوقت)

## مشاكل معروفة / ملاحظات
- 📌 صفحة "إدارة الحسابات" (/admin/accounts) تعمل حالياً وتؤدي الغرض ولكنها لا تزال بالتصميم القديم وستحتاج إعادة تصميم لتطابق ستايل Vercel/Supabase لاحقاً.
- 📌 لم يتم اختبار التراجع الذاتي (Rollback) الفعلي بشكل يدوي حتى الآن، ويُفضل اختباره والتأكد منه قبل الإطلاق الرسمي للزبائن.