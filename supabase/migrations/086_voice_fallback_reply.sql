-- ============================================================
-- MIGRATION 086: Voice Notes Fallback Reply
-- ============================================================

-- 1. Add voice fallback reply fields to ai_configs
ALTER TABLE public.ai_configs
  ADD COLUMN IF NOT EXISTS voice_fallback_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS voice_fallback_reply TEXT DEFAULT 'عزيزي العميل، تم استلام رسالتك الصوتية 🎙️. نرجو التكرم بكتابة استفسارك نصياً حتى يتمكن المساعد الآلي من خدمتك فوراً، أو انتظر لحظات وسيقوم أحد ممثلي الخدمة بالاستماع إليها والرد عليك.';
