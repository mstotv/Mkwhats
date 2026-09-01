-- ============================================================
-- MIGRATION 084: Voice Transcription (STT) & Plan Features
-- ============================================================

-- 1. Add voice_transcription_enabled to ai_configs
ALTER TABLE public.ai_configs
  ADD COLUMN IF NOT EXISTS voice_transcription_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. Add transcribed_text to messages for visual display in inbox
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS transcribed_text TEXT;

-- 3. Update existing plans to include voice_transcription in features JSON
-- Default: Pro and Enterprise plans have it enabled; Free plan has it disabled
UPDATE public.plans
SET features = jsonb_set(
  COALESCE(features::jsonb, '{}'::jsonb),
  '{voice_transcription}',
  'true'::jsonb,
  true
)
WHERE slug IN ('pro', 'enterprise', 'unlimited');

UPDATE public.plans
SET features = jsonb_set(
  COALESCE(features::jsonb, '{}'::jsonb),
  '{voice_transcription}',
  'false'::jsonb,
  true
)
WHERE slug NOT IN ('pro', 'enterprise', 'unlimited');

-- 4. Index for fast querying messages with transcriptions
CREATE INDEX IF NOT EXISTS idx_messages_transcribed_text ON public.messages(id) WHERE transcribed_text IS NOT NULL;
