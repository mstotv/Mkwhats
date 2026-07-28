# 📌 التقرير التقني الشامل: تكامل Evolution API (WhatsApp Integration)

### 1️⃣ قاعدة البيانات والعزل بين الحسابات (Multi-Tenant Isolation)
- **ملف السكريبت**: `supabase/migrations/038_whatsapp_evolution_instance_unique.sql`
- **الوظيفة**: إنشاء Partial Unique Index على العمود `evolution_instance_name` بشرط `WHERE evolution_instance_name IS NOT NULL`.
- **الهدف**: ضمان عدم قدرة أي حساب على حجز أو استغلال اسم `instanceName` محجوز مسبقاً من حساب آخر على نفس سيرفر Evolution المباشر.

---

### 2️⃣ المكتبة الأساسية لـ Evolution (`src/lib/whatsapp/evolution-api.ts`)
- **التسجيل التلقائي للـ Webhook (`setEvolutionWebhook`)**:
  - تم إضافة دالة `setEvolutionWebhook` واستدعاؤها تلقائياً داخل `createEvolutionInstance` لإرسال طلب `POST /webhook/set/{instanceName}` بالهيكل المطلوب في Evolution v2:
    `{ webhook: { enabled: true, url, byEvents: false, events: [...] } }`
- **تصحيح صيغة الرقم عند الإرسال (`sendEvolutionTextMessage` / `sendEvolutionMediaMessage`)**:
  - تم تعديل تنسيق الرقم ليكون **أرقاماً مجردة فقط** عبر السطر `args.to.replace(/\D/g, '')` بدون اللاحقة `@s.whatsapp.net`.
  - يمنع هذا خطأ `500 Internal Server Error (Connection Closed)` في Evolution API v2 ويضمن الإرسال بـ `201 Created`.
- **استخراج رقم الهاتف المقترن (`getEvolutionConnectionState`)**:
  - استخراج الـ `ownerJid` كحل احتياطي لتحديث `evolution_connected_phone` في الداتا بيز فوراً عند فحص الحالة.

---

### 3️⃣ مسارات الـ API بالخلفية (`src/app/api/whatsapp/evolution/`)
- **مسار الإنشاء (`POST /api/whatsapp/evolution/instance`)**:
  - يستقبل الحقول الثلاثة `{ instanceName, token, number }`.
  - يتأكد من فرادة الاسم على مستوى جميع الحسابات ويُرجع `409 Conflict` عند التكرار.
  - يبني رابط الـ Webhook ديناميكياً باختيار `WEBHOOK_BASE_URL` أو `NEXT_PUBLIC_SITE_URL` أو `new URL(request.url).origin` (`https://mkwacrm.mstoviral.online/api/whatsapp/evolution/webhook`).
- **مسار الأحداث الواردة (`POST /api/whatsapp/evolution/webhook`)**:
  - يدعم التحقق بـ `EVOLUTION_GLOBAL_API_KEY` أو بمطابقة اسم الـ Instance بالحسابات النشطة.
  - معالجة مرنة لأحداث Evolution v2 المتنوعة (`MESSAGES_UPSERT`, `messages.upsert`, `messages.set`) وتوجيه الرسائل فوراً للـ **Inbox**.
- **مسارات الحالة والـ QR (`qr/route.ts` و `status/route.ts`)**:
  - تُرجع `200 OK` مع `{ connected: false }` عند عدم وجود اتصال، لمنع إطلاق تحذيرات 404 في الـ Terminal.

---

### 4️⃣ الربط بـ الإنبوكس ودالة الإرسال المركزية (`src/lib/whatsapp/send-message.ts`)
- **دعم الإرسال المباشر من الإنبوكس**:
  - تم تزويد `sendMessageToConversation` بمسار شرطي `if (config.connection_type === 'evolution')`.
  - يتعرف النظام تلقائياً عند الرد من الإنبوكس ويستدعي `sendEvolutionTextMessage` بدلاً من محاولة فك تشفير توكن Meta، مع حفظ الرسائل الصادرة وإيقاف الـ Flows النشطة كالمعتاد.

---

### 5️⃣ واجهة المستخدم (UI Components)
- **ملف الواجهة**: `src/components/settings/whatsapp-config.tsx`
- **نموذج الحقول الثلاثة**:
  - عرض نموذج الإدخال (Instance Name *, Token, Number) عندما تكون `!config`.
  - زر **إلغاء الربط (Disconnect)** مسند لحذف الـ instance وتنظيف قاعدة البيانات وإتاحة إنشاء اتصال جديد بأي وقت.
