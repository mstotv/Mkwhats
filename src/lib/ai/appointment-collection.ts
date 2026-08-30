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

import { parseLocalDateTimeToUtc } from '@/lib/appointments/timezone-helper';

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
  console.log('[DIAG][appointment-collection] entered processAppointmentAction | rawData:', JSON.stringify(appointmentData));

  // Load settings for timezone
  const settings = await loadAppointmentSettings(db, accountId);
  const timeZone = settings.timezone || 'Asia/Baghdad';

  let dateTimeStr = appointmentData.date_time?.trim();

  // If date_time is missing from the confirmation block, scan recent conversation messages
  if (!dateTimeStr && appointmentData.confirmed) {
    console.log('[DIAG][appointment-collection] date_time missing in confirmation block — inspecting recent messages...');
    try {
      const { data: recentMsgs } = await db
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentMsgs && recentMsgs.length > 0) {
        for (const msg of recentMsgs) {
          const content = String(msg.content || '');
          // Try match date pattern YYYY-MM-DD HH:mm or |||{"appointment":...}|||
          const jsonMatch = content.match(/"date_time"\s*:\s*"([^"]+)"/);
          if (jsonMatch && jsonMatch[1]) {
            dateTimeStr = jsonMatch[1];
            console.log('[DIAG][appointment-collection] Found date_time from previous message json:', dateTimeStr);
            break;
          }
          const textDateMatch = content.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
          if (textDateMatch && textDateMatch[1]) {
            dateTimeStr = textDateMatch[1];
            console.log('[DIAG][appointment-collection] Found date_time from previous message text:', dateTimeStr);
            break;
          }
        }
      }
    } catch (scanErr) {
      console.error('[DIAG][appointment-collection] error scanning history for date_time:', scanErr);
    }
  }

  if (!dateTimeStr) {
    console.warn('[DIAG][appointment-collection] No date_time found. Skipping.');
    return { handled: false };
  }

  // Parse requested date to UTC using account timezone
  const requestedDate = parseLocalDateTimeToUtc(dateTimeStr, timeZone);
  if (!requestedDate || isNaN(requestedDate.getTime())) {
    console.warn('[DIAG][appointment-collection] Invalid date_time:', dateTimeStr);
    return { handled: false, availabilityError: 'تاريخ الموعد غير صحيح' };
  }

  console.log('[DIAG][appointment-collection] Checking slot availability for UTC:', requestedDate.toISOString(), '| Local timezone:', timeZone);

  // Check availability
  const avail = await checkSlotAvailability(db, accountId, requestedDate);
  console.log('[DIAG][appointment-collection] Availability result:', JSON.stringify(avail));

  if (!avail.available) {
    console.warn('[DIAG][appointment-collection] Slot is not available:', avail.message);
    return {
      handled: false,
      availabilityError: avail.message || 'الموعد المحدد غير متاح',
    };
  }

  // If confirmed, book it in database
  if (appointmentData.confirmed) {
    console.log('[DIAG][appointment-collection] ✅ Booking confirmed appointment in DB...');
    const res = await createAppointment(db, accountId, {
      customerName: appointmentData.customer_name || 'عميل واتساب',
      customerPhone: contactPhone,
      scheduledAtUtc: requestedDate,
      serviceName: appointmentData.service_name || null,
      conversationId,
      contactId,
    });

    if (res.appointment) {
      console.log('[DIAG][appointment-collection] 🎉 Appointment booked successfully! ID:', res.appointment.id);
      return {
        handled: true,
        appointmentId: res.appointment.id,
        confirmed: true,
      };
    } else {
      console.error('[DIAG][appointment-collection] Error creating appointment:', res.error);
    }
  }

  return {
    handled: true,
    confirmed: false,
  };
}
