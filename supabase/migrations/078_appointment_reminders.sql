-- ============================================================
-- Migration 078: Automated Appointment Reminders via WhatsApp
-- ============================================================

-- 1. Add reminder settings to appointment_settings
ALTER TABLE public.appointment_settings
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS reminder_message TEXT DEFAULT NULL;

-- 2. Add reminder_sent_at to appointments to prevent duplicate sends
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Create index for fast reminder lookups
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_due
  ON public.appointments (account_id, status, scheduled_at, reminder_sent_at)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;
