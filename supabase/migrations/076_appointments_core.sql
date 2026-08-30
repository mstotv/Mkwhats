-- ============================================================
-- MIGRATION 076: Appointments Core Schema & Settings
-- ============================================================

-- 1. Create Business Hours Table (Defines working days and times per account)
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  -- day_of_week: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00:00',
  close_time TIME NOT NULL DEFAULT '17:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, day_of_week)
);

-- 2. Create Appointment Settings Table (Slot duration, timezone, and options per account)
CREATE TABLE IF NOT EXISTS public.appointment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration_minutes > 0),
  timezone TEXT NOT NULL DEFAULT 'Asia/Baghdad',
  booking_confirmation_msg TEXT,
  service_label TEXT DEFAULT 'الخدمة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add appointments_enabled feature flag to ai_configs
ALTER TABLE public.ai_configs
  ADD COLUMN IF NOT EXISTS appointments_enabled BOOLEAN NOT NULL DEFAULT false;

-- 5. Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_business_hours_account_id ON public.business_hours(account_id);
CREATE INDEX IF NOT EXISTS idx_appointment_settings_account_id ON public.appointment_settings(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_account_id ON public.appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(account_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_conversation_id ON public.appointments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for business_hours
DROP POLICY IF EXISTS "business_hours_select" ON public.business_hours;
CREATE POLICY "business_hours_select" ON public.business_hours
  FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS "business_hours_insert" ON public.business_hours;
CREATE POLICY "business_hours_insert" ON public.business_hours
  FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS "business_hours_update" ON public.business_hours;
CREATE POLICY "business_hours_update" ON public.business_hours
  FOR UPDATE USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS "business_hours_delete" ON public.business_hours;
CREATE POLICY "business_hours_delete" ON public.business_hours
  FOR DELETE USING (is_account_member(account_id, 'admin'));

-- 8. RLS Policies for appointment_settings
DROP POLICY IF EXISTS "appointment_settings_select" ON public.appointment_settings;
CREATE POLICY "appointment_settings_select" ON public.appointment_settings
  FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS "appointment_settings_insert" ON public.appointment_settings;
CREATE POLICY "appointment_settings_insert" ON public.appointment_settings
  FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS "appointment_settings_update" ON public.appointment_settings;
CREATE POLICY "appointment_settings_update" ON public.appointment_settings
  FOR UPDATE USING (is_account_member(account_id, 'admin'));

DROP POLICY IF EXISTS "appointment_settings_delete" ON public.appointment_settings;
CREATE POLICY "appointment_settings_delete" ON public.appointment_settings
  FOR DELETE USING (is_account_member(account_id, 'admin'));

-- 9. RLS Policies for appointments
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT USING (is_account_member(account_id));

DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (is_account_member(account_id, 'agent'));

DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE USING (is_account_member(account_id, 'admin'));
