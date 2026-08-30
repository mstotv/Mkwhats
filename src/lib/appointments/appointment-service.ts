import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Appointment,
  AppointmentSettings,
  AvailabilityCheckResult,
  BusinessHour,
} from './types';
import { sendTelegramAppointmentNotification } from '@/lib/telegram/send-notification';

/**
 * Load appointment settings for an account, with fallbacks.
 */
export async function loadAppointmentSettings(
  db: SupabaseClient,
  accountId: string
): Promise<AppointmentSettings> {
  const { data, error } = await db
    .from('appointment_settings')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error || !data) {
    return {
      account_id: accountId,
      slot_duration_minutes: 60,
      timezone: 'Asia/Baghdad',
      booking_confirmation_msg: 'تم تأكيد موعدك بنجاح! نحن بانتظارك. ✨',
      service_label: 'الخدمة',
    };
  }

  return data as AppointmentSettings;
}

/**
 * Load weekly business hours for an account (0=Sun to 6=Sat).
 */
export async function loadBusinessHours(
  db: SupabaseClient,
  accountId: string
): Promise<BusinessHour[]> {
  const { data, error } = await db
    .from('business_hours')
    .select('*')
    .eq('account_id', accountId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('[appointments] Error loading business hours:', error);
    return [];
  }

  return (data ?? []) as BusinessHour[];
}

/**
 * Call the SQL function `check_slot_availability`.
 */
export async function checkSlotAvailability(
  db: SupabaseClient,
  accountId: string,
  requestedUtc: string | Date,
  excludeId?: string
): Promise<AvailabilityCheckResult> {
  const isoUtc =
    typeof requestedUtc === 'string'
      ? new Date(requestedUtc).toISOString()
      : requestedUtc.toISOString();

  const { data, error } = await db.rpc('check_slot_availability', {
    p_account_id: accountId,
    p_requested_utc: isoUtc,
    p_exclude_id: excludeId || null,
  });

  if (error) {
    console.error('[appointments] check_slot_availability error:', error);
    return {
      available: false,
      reason: 'db_error',
      message: 'تعذر التحقق من توفر الموعد حالياً',
    };
  }

  return (data as AvailabilityCheckResult) ?? {
    available: false,
    reason: 'unknown',
    message: 'حالة غير معروفة',
  };
}

/**
 * Create a new appointment and trigger Telegram notification.
 */
export async function createAppointment(
  db: SupabaseClient,
  accountId: string,
  params: {
    customerName: string;
    customerPhone: string;
    scheduledAtUtc: string | Date;
    serviceName?: string | null;
    durationMinutes?: number;
    conversationId?: string | null;
    contactId?: string | null;
    notes?: string | null;
  }
): Promise<{ appointment: Appointment | null; error?: string }> {
  try {
    const scheduledAt =
      typeof params.scheduledAtUtc === 'string'
        ? new Date(params.scheduledAtUtc).toISOString()
        : params.scheduledAtUtc.toISOString();

    const settings = await loadAppointmentSettings(db, accountId);
    const duration = params.durationMinutes || settings.slot_duration_minutes || 60;

    const { data, error } = await db
      .from('appointments')
      .insert({
        account_id: accountId,
        conversation_id: params.conversationId || null,
        contact_id: params.contactId || null,
        customer_name: params.customerName.trim(),
        customer_phone: params.customerPhone.trim(),
        service_name: params.serviceName?.trim() || null,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: 'confirmed',
        notes: params.notes?.trim() || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[appointments] failed to insert appointment:', error);
      return { appointment: null, error: error?.message || 'Failed to insert appointment' };
    }

    const appt = data as Appointment;

    // Send Telegram Notification asynchronously (best-effort)
    void sendTelegramAppointmentNotification(db, appt.id, accountId).catch((err) => {
      console.error('[appointments] Telegram notification error:', err);
    });

    return { appointment: appt };
  } catch (err: any) {
    console.error('[appointments] createAppointment error:', err);
    return { appointment: null, error: err?.message || 'Unexpected error' };
  }
}
