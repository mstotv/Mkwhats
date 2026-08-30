import type { SupabaseClient } from '@supabase/supabase-js';
import {
  checkSlotAvailability,
  createAppointment,
  loadAppointmentSettings,
  loadBusinessHours,
} from '@/lib/appointments/appointment-service';
import type { AppointmentSettings, BusinessHour } from '@/lib/appointments/types';
import type { ExtractedAppointmentData } from './types';

export interface AppointmentContext {
  settings: AppointmentSettings;
  businessHours: BusinessHour[];
  formattedBusinessHours: string;
  currentDateTimeLocal: string;
}

const DAY_NAMES_AR = [
  'الأحد (Sunday)',
  'الاثنين (Monday)',
  'الثلاثاء (Tuesday)',
  'الأربعاء (Wednesday)',
  'الخميس (Thursday)',
  'الجمعة (Friday)',
  'السبت (Saturday)',
];

/**
 * Load the appointment context required by the AI system prompt.
 */
export async function loadAppointmentContext(
  db: SupabaseClient,
  accountId: string
): Promise<AppointmentContext | null> {
  try {
    const [settings, businessHours] = await Promise.all([
      loadAppointmentSettings(db, accountId),
      loadBusinessHours(db, accountId),
    ]);

    const tz = settings.timezone || 'Asia/Baghdad';

    // Format current local time for reference in prompt
    let currentDateTimeLocal = '';
    try {
      currentDateTimeLocal = new Intl.DateTimeFormat('ar-IQ', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: tz,
      }).format(new Date());
    } catch {
      currentDateTimeLocal = new Date().toISOString();
    }

    // Format business hours string
    const hoursLines: string[] = [];
    for (let d = 0; d <= 6; d++) {
      const bh = businessHours.find((h) => h.day_of_week === d);
      const dayName = DAY_NAMES_AR[d];
      if (!bh || !bh.is_open) {
        hoursLines.push(`• ${dayName}: عطلة مغلق (Closed)`);
      } else {
        hoursLines.push(
          `• ${dayName}: من ${bh.open_time.slice(0, 5)} إلى ${bh.close_time.slice(0, 5)}`
        );
      }
    }

    const formattedBusinessHours = hoursLines.join('\n');

    return {
      settings,
      businessHours,
      formattedBusinessHours,
      currentDateTimeLocal,
    };
  } catch (err) {
    console.error('[appointment-collection] error loading appointment context:', err);
    return null;
  }
}

/**
 * Process appointment extraction from AI.
 */
export async function processAppointmentAction(
  db: SupabaseClient,
  accountId: string,
  conversationId: string,
  contactId: string | null,
  contactPhone: string,
  appointmentData: ExtractedAppointmentData
): Promise<{
  handled: boolean;
  appointmentId?: string;
  confirmed?: boolean;
  availabilityError?: string;
}> {
  if (!appointmentData.date_time) {
    return { handled: false };
  }

  // Parse requested date
  const requestedDate = new Date(appointmentData.date_time);
  if (isNaN(requestedDate.getTime())) {
    return { handled: false, availabilityError: 'تاريخ الموعد غير صحيح' };
  }

  // Check availability
  const avail = await checkSlotAvailability(db, accountId, requestedDate);
  if (!avail.available) {
    return {
      handled: false,
      availabilityError: avail.message || 'الموعد المحدد غير متاح',
    };
  }

  // If confirmed, book it in database
  if (appointmentData.confirmed) {
    const res = await createAppointment(db, accountId, {
      customerName: appointmentData.customer_name || 'عميل واتساب',
      customerPhone: contactPhone,
      scheduledAtUtc: requestedDate,
      serviceName: appointmentData.service_name || null,
      conversationId,
      contactId,
    });

    if (res.appointment) {
      return {
        handled: true,
        appointmentId: res.appointment.id,
        confirmed: true,
      };
    }
  }

  return {
    handled: true,
    confirmed: false,
  };
}
