# حالة المشروع - آخر تحديث: [3/8/2026]

## آخر شي خلص وشغال 100%
- multi-tenant migration (017-036) مطبق ومختبر يدوياً بحسابين حقيقيين
- RLS شغال على كل الجداول، بدون تداخل بيانات بين الحسابات
- ✅ Evolution API integration مكتمل ومختبر على production (استقبال + إرسال). التفاصيل الكاملة بملف docs/evolution-integration-report.md
- ✅ دعم إرسال البرودكاست (Broadcasts) عبر Evolution API بجانب Meta Cloud API الرسمية:
  - مسار إرسال مخصص لنص حر بدون قوالب Meta لحسابات Evolution API.
  - فحص محمي موحد لحدود خطة الاشتراك الشهيرة (الرسائل والبرودكاست).
  - معدل إرسال آمن متدرج لـ Evolution لحماية أرقام واتساب من الحظر.
  - مؤشر التقدم والوقت المتبقي التقديري المباشر في الواجهة أثناء الإرسال.
  - معالجة وإظهار أخطاء تفصيلية واضحة في واجهة النتيجة بدلاً من الفشل الصامت.
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
  - ✅ نظام ترقية الخطط الهجين (Hybrid Plan Upgrade):
    - مايقريشن `048_upgrade_requests.sql` المخصص لجدول `upgrade_requests` مع حماية RLS بـ `is_account_member`.
    - مسار آمن [`/api/account/upgrade-request`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-request/route.ts) لتسجيل طلب الترقية كـ `pending` وإنشاء رابط محادثة واتساب موجه للدعم برقم الطلب.
    - نافذة تفاعلية [`src/components/settings/upgrade-plan-modal.tsx`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/components/settings/upgrade-plan-modal.tsx) تعجب بطاقات الخطط والتبديل الشهري/السنوي مع زر طلب الترقية المباشر.
  - ✅ Plisio Payment Gateway: بوابة دفع كريبتو حقيقية، إدخال مفتاح الأدمن من site-settings، إنشاء فاتورة تلقائي عند طلب الترقية، webhook محمي (HMAC-SHA1 + منع تكرار + مطابقة مبلغ) يفعّل اشتراك جديد تلقائياً بعد الدفع — مختبر بالكامل بسكربت محاكاة (scripts/test-plisio-webhook.js).
    - مايقريشن `049_plisio_payment_integration.sql` مطبق ومفعل بنجاح على قاعدة البيانات (إضافة `plisio_api_key` و `plisio_enabled` لـ `site_settings` وأعمدة الفاتورة لـ `upgrade_requests`).
    - واجهة إعدادات موحدة بالأدمن بانل [`/admin/site-settings`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/admin/site-settings/page.tsx) لإدخال `Plisio Secret API Key` ومفتاح التفعيل الشامل.
    - إنشاء فواتير Plisio أوتوماتيكياً في [`/api/account/upgrade-request`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-request/route.ts) والتحويل الفوري لصفحة الدفع بالعملات الرقمية (`USDT_TRX`, `BTC`, `ETH`).
    - معالج الـ Webhook الموثق والمحمي ثلاثياً في [`/api/v1/webhooks/plisio`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/v1/webhooks/plisio/route.ts) بمصادقة توقيع `HMAC-SHA1` الحية، والوقاية من Replay attacks ومطابقة المبالغ، وتفعيل اشتراك الحساب بجدول `subscriptions` تلقائياً فور تأكيد الشبكة.
    - صفحة نجاح الاشتراك الاحترافية [`/settings/upgrade-success`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/(dashboard)/settings/upgrade-success/page.tsx) مع التحقق المباشر عبر API [`/api/account/upgrade-status`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/app/api/account/upgrade-status/route.ts) وفحص تفعيل الخطة، وتأثير قصاصات الورق (Confetti)، وعرض كارت ملخص الدفع وزر الانتقال للوحة التحكم.
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
  - ✅ Telegram Bot notifications: ربط بوت لكل حساب (bot token + chat id مشفّر)، اختبار اتصال، إشعار تلقائي غير معطّل عند تأكيد الطلب. مختبر: رسالة تجريبية وصلت بنجاح.
- ✅ إضافة مزود الذكاء الاصطناعي Google Gemini (Gemini 3.6 Flash):
  - مايقريشن `050_add_gemini_provider.sql` لتوسيع قيد `provider` في جدول `ai_configs` ليشمل `gemini`.
  - محول المزود الخاص [`src/lib/ai/providers/gemini.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/providers/gemini.ts) للربط مع Google Generative Language v1beta API بـ BYO Key الخاص بالحساب مع التجميع الآلي للرسائل المتتالية وحساب استخدام التوكينات.
  - تحديث كامل لواجهات إعدادات الـ AI والـ Playground ليدعم اختيار مزود Gemini وموديلاته واختبارها بنجاح 100%.
- ✅ إصلاحات وتطويرات نظام الـ AI Auto-Reply وتجميع الطلبات لـ Gemini و Evolution API:
  - **تصفية أفكار السلسلة الداخلي (Thought Parts Filtering)**: تعديل [`src/lib/ai/providers/gemini.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/providers/gemini.ts) لاستبعاد الأجزاء التي تحتوي على `thought: true` في نماذج Gemini التفكيرية (مثل Gemini 2.5/3.6 Flash)، ومنع تسرب أفكار الموديل الداخلي والتعليقات الإنجليزية للعميل على واتساب.
  - **معالجة وحظر الـ JSON غير المغلق (Unclosed ||| Block Handling)**: تحديث [`src/lib/ai/generate.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/generate.ts) باستخدام استراتيجية `indexOf` و `lastIndexOf` لقص بلوك `|||{...}|||` حتى مع الكائنات المتداخلة (nested objects). في حال انقطع الـ JSON قبل الإغلاق، يتم قص كل شيء من نقطة البداية إلى نهاية النص لمنع تسرب الـ JSON الخام نهائياً للعميل، مع إضافة محاولات ترقيع تلقائية (JSON Rescue) لاستخراج الحقول بنجاح.
  - **إلزام مطابقة المفتاح البرمجي (`field_key`) للطلب**: تحديث الـ System Prompt في [`src/lib/ai/defaults.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/defaults.ts) لإجبار الـ AI على استخدام الـ `field_key` الحرفي (مثل `name`, `phone`, `address`) وعدم ترجمة المفاتيح للعربية في الـ JSON، مما يضمن تطابق البيانات وحفظها بقاعدة البيانات وتأكيد الطلب تلقائياً وإطلاق إشعار التليجرام.
  - **الاستجابة التلقائية عند خطأ الـ LLM (Fallback & Auto-Handoff)**: إضافة معالجة استثناءات في [`src/lib/ai/auto-reply.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/auto-reply.ts) لإرسال رسالة اعتذار تلقائية مهذبة للعميل عند حدوث خطأ بالمزود أو تجاوُز الـ Rate Limit وتعطيل البوت وتحويل المحادثة لموظف بشري فوراً بدلاً من الصمت التام.
  - **دعم الردود غير المحدودة بالذكاء الاصطناعي (-1 Unlimited Auto-Replies Cap)**:
    - مايقريشن `051_allow_unlimited_ai_auto_replies.sql` لتحديث قيد `CHECK (auto_reply_max_per_conversation = -1 OR (auto_reply_max_per_conversation >= 1 AND auto_reply_max_per_conversation <= 500))` ودالة `claim_ai_reply_slot` لدعم `-1` دون قيد أقصى.
    - تحديث واجهة الإعدادات والـ API بالسماح بادخال `-1` مع نص توضيحي وإرجاع رسالة خطأ DB التفصيلية للـ UI.
  - **توسيع سقف التوكنات الناتجة (`MAX_OUTPUT_TOKENS` = 4096) وحل انقطاع الردود**:
    - رفع سقف التوكنات في [`src/lib/ai/defaults.ts`](file:///c:/Users/Mustafa/Desktop/mk%20whats/src/lib/ai/defaults.ts) إلى **4096** توكن لمنع استهلاك توكنات الـ Thinking في موديلات Gemini التفكيرية (مثل Gemini 3.6 Flash) لرد البوت وبلوك الـ JSON الاستخراجي.
    - حل مشكلة انقطاع الردود بمنتصف الجملة وضمان وصول واستخراج كامل حقول الطلب وتأكيده تلقائياً وانطلاق إشعار تيليقرام المباشر.
    - إضافة سجلات تشخيصية تفصيلية `[DIAG]` لعمليات استخراج البيانات، الفحص الذاتي لاكتمال الحقول، وتأكيد الطلب وإرسال التليجرام.
- إصلاح زر التشغيل (Switch Button) في وضع RTL بإضافة `dir="ltr"` لمنع خروج الدائرة خارج الإطار البيضاوي في كل صفحات المنصة.
- إصلاح معالجة الأخطاء في `PresenceHeartbeat` لتفادي أخطاء `TypeError: Failed to fetch` في الكونسول عند الانقطاع الشبكي المؤقت.
- ✅ دعم اللغة العربية والتطبيق الشامل لمنظومة التدويل (i18n):
  - تدويل كامل شاشات الأدمن بانل (Dashboard, Accounts, Plans, Site Settings) واستخدام `next-intl` مع قواميس `messages/ar.json` و `messages/en.json`.
  - تنسيق الأرقام ديناميكياً ببطاقات الإحصائيات والاشتراكات `toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')` لتتوافق الأرقام تلقائياً مع اللغة المعتمدة بالواجهة.
  - التفكيك الذكي لأسماء الخطط المزدوجة `Free / المجانية` لتعرض اسمها العربي الفصيح في الواجهة العربية ومقابلها الإنجليزي بالواجهة الإنجليزية.
  - ترجمة وتدويل حالات اتصال Evolution API مع الإبقاء الحاسم القاطع على قيم الـ Status البرمجية والـ Enums الثابتة بالـ DB كما هي بدون أي تغيير.
  - حماية وتعقيم صفحات المحتوى العام `/p/[slug]` ومسار حفظ الإعدادات بـ `isomorphic-dompurify` ضد ثغرات XSS مع السماح بوسوم التنسيق القياسية.








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
- 📌 أصلحنا دفعة أخطاء ترجمة متكررة (roles, telegram, api-keys, templates, automations.builder.delete) — عند إضافة أي نص جديد بملفات الترجمة يحتوي أقواس مزدوجة {{ }} حرفية أو HTML attributes داخل tags، يجب تغليفها/تنظيفها حسب معايير next-intl ICU.