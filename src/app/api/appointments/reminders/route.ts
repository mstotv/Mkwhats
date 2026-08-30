import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { engineSendText } from '@/lib/flows/meta-send';

export const dynamic = 'force-dynamic';

/**
 * Cron Job to dispatch automated WhatsApp reminders for upcoming appointments.
 *
 * Auth: Protected via `x-cron-secret` header or `Authorization: Bearer <SECRET>`
 * matching `AUTOMATION_CRON_SECRET` or `CRON_SECRET`.
 */
export async function GET(request: Request) {
  try {
    const expected = process.env.AUTOMATION_CRON_SECRET || process.env.CRON_SECRET;
    if (!expected) {
      return NextResponse.json({ error: 'cron not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const supplied = request.headers.get('x-cron-secret') || bearerToken;

    const suppliedBuf = Buffer.from(supplied);
    const expectedBuf = Buffer.from(expected);
    if (
      suppliedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(suppliedBuf, expectedBuf)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceClient();
    const now = new Date();

    const { searchParams } = new URL(request.url);
    const isForce = searchParams.get('force') === 'true';

    // 1. Fetch all accounts with active reminder settings
    const { data: activeSettingsList, error: settingsErr } = await service
      .from('appointment_settings')
      .select('*')
      .eq('reminder_enabled', true);

    if (settingsErr) {
      console.error('[appointment-reminders] Error loading settings:', settingsErr);
      return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    if (!activeSettingsList || activeSettingsList.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0, message: 'No accounts with reminder_enabled=true' });
    }

    let totalSent = 0;
    let totalSkipped = 0;
    const sentDetails: any[] = [];

    for (const settings of activeSettingsList) {
      const accountId = settings.account_id;
      const minutesBefore = settings.reminder_minutes_before || 60;
      const templateMsg =
        settings.reminder_message?.trim() ||
        'مرحباً {الاسم} 🌟\nنود تذكيرك بموعدك لخدمة {الخدمة} اليوم الساعة {الوقت}.\nنتطلع لرؤيتك! 😊';
      const tz = settings.timezone || 'Asia/Baghdad';

      // Lookahead window:
      let query = service
        .from('appointments')
        .select('*, contacts(id, phone, name)')
        .eq('account_id', accountId)
        .eq('status', 'confirmed')
        .is('reminder_sent_at', null);

      if (!isForce) {
        const maxScheduledTime = new Date(now.getTime() + (minutesBefore + 10) * 60 * 1000).toISOString();
        const minScheduledTime = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
        query = query.gte('scheduled_at', minScheduledTime).lte('scheduled_at', maxScheduledTime);
      }

      const { data: dueAppointments, error: apptErr } = await query;

      if (apptErr || !dueAppointments || dueAppointments.length === 0) {
        continue;
      }

      for (const appt of dueAppointments) {
        const scheduledDate = new Date(appt.scheduled_at);
        const triggerTime = new Date(scheduledDate.getTime() - minutesBefore * 60 * 1000);

        // Check if we reached the trigger time (unless force is true)
        if (!isForce && now < triggerTime) {
          totalSkipped++;
          continue; // Not yet time for this specific appointment
        }

        // Atomically claim this appointment by setting reminder_sent_at
        const { data: claimed } = await service
          .from('appointments')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', appt.id)
          .is('reminder_sent_at', null)
          .select('id')
          .maybeSingle();

        if (!claimed) {
          totalSkipped++;
          continue; // Already claimed by a concurrent worker
        }

        // Format date and time in account's local timezone
        let localTimeStr = '';
        let localDateStr = '';
        try {
          localTimeStr = new Intl.DateTimeFormat('ar-IQ', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: tz,
          }).format(scheduledDate);

          localDateStr = new Intl.DateTimeFormat('ar-IQ', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: tz,
          }).format(scheduledDate);
        } catch {
          localTimeStr = scheduledDate.toTimeString().slice(0, 5);
          localDateStr = scheduledDate.toDateString();
        }

        const customerName = appt.customer_name || appt.contacts?.name || 'عميلنا العزيز';
        const serviceName = appt.service_name || settings.service_label || 'الموعد';

        const finalMessage = templateMsg
          .replace(/{الاسم}/g, customerName)
          .replace(/{الخدمة}/g, serviceName)
          .replace(/{الوقت}/g, localTimeStr)
          .replace(/{التاريخ}/g, localDateStr);

        // Ensure we have a conversation & contact to send via engineSendText
        let conversationId = appt.conversation_id;
        let contactId = appt.contact_id || appt.contacts?.id;
        const phone = appt.customer_phone?.trim() || appt.contacts?.phone?.trim();

        if (!contactId && phone) {
          const { data: contactRow } = await service
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .eq('phone', phone)
            .maybeSingle();
          if (contactRow) {
            contactId = contactRow.id;
          }
        }

        if (!conversationId && contactId) {
          const { data: convRow } = await service
            .from('conversations')
            .select('id')
            .eq('account_id', accountId)
            .eq('contact_id', contactId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (convRow) {
            conversationId = convRow.id;
          }
        }

        // Get an owner/admin user_id for engine audit
        const { data: ownerProfile } = await service
          .from('profiles')
          .select('user_id')
          .eq('account_id', accountId)
          .limit(1)
          .maybeSingle();

        const auditUserId = ownerProfile?.user_id || 'system';

        if (conversationId && contactId) {
          try {
            console.log(`[appointment-reminders] Sending reminder for appt ${appt.id} to ${phone}`);
            await engineSendText({
              accountId,
              userId: auditUserId,
              conversationId,
              contactId,
              text: finalMessage,
            });
            totalSent++;
          } catch (sendErr) {
            console.error(`[appointment-reminders] Failed to send text for appt ${appt.id}:`, sendErr);
          }
        } else {
          console.warn(`[appointment-reminders] Could not resolve conversation for appt ${appt.id} (phone: ${phone})`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: activeSettingsList.length,
      sent: totalSent,
      skipped: totalSkipped,
    });
  } catch (err: any) {
    console.error('[appointment-reminders] Cron error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
