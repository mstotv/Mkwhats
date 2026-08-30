// ============================================================
// Types for Appointments & Business Hours System
// ============================================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show';

export interface BusinessHour {
  id?: string;
  account_id?: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  is_open: boolean;
  open_time: string; // '09:00:00'
  close_time: string; // '17:00:00'
}

export interface AppointmentSettings {
  id?: string;
  account_id: string;
  slot_duration_minutes: number;
  timezone: string;
  booking_confirmation_msg: string | null;
  service_label: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  account_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string | null;
  scheduled_at: string; // ISO UTC string
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts?: {
    name: string;
    phone: string;
    avatar_url?: string | null;
  } | null;
}

export interface AvailabilityCheckResult {
  available: boolean;
  reason: 'ok' | 'no_settings' | 'day_off' | 'outside_hours' | 'slot_exceeds_hours' | 'slot_taken' | string;
  message: string;
  open_time?: string;
  close_time?: string;
  slot_duration_minutes?: number;
  scheduled_at_utc?: string;
  slot_end_utc?: string;
  timezone?: string;
}

export interface BookAppointmentPayload {
  customer_name: string;
  customer_phone: string;
  service_name?: string;
  scheduled_at: string; // ISO String (or local string converted)
  duration_minutes?: number;
  conversation_id?: string;
  contact_id?: string;
  notes?: string;
}
