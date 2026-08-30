import { createServiceClient } from '@/lib/supabase/service';
import { engineSendText } from '@/lib/flows/meta-send';

/**
 * Core engine function to process and dispatch due appointment reminders.
 * Can be called by the internal background runner or by HTTP Cron endpoint.
 */
export async function processDueReminders(isForce = false): Promise<{
  success: boolean;
  processedAccounts: number;
  sentCount: number;
  skippedCount: number;
  details: any[];
}> {
  const service = createServiceClient();
  const now = new Date();

  // 1. Fetch all accounts with active reminder settings
  const { data: activeSettingsList, error: settingsErr } = await service
    .from('appointment_settings')
    .select('*')
    .eq('reminder_enabled', true);

  if (settingsErr) {
    console.error('[appointment-reminders] Error loading settings:', settingsErr);
    return {
      success: false,
      processedAccounts: 0,
      sentCount: 0,
      skippedCount: 0,
      details: [],
    };
  }

  if (!activeSettingsList || activeSettingsList.length === 0) {
    return {
      success: true,
      processedAccounts: 0,
      sentCount: 0,
      skippedCount: 0,
      details: [],
    };
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
      // Find appointments scheduled between (now - 60 mins) and (now + minutesBefore + 15 mins)
      const maxScheduledTime = new Date(now.getTime() + (minutesBefore + 15) * 60 * 1000).toISOString();
      const minScheduledTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
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
        continue; // Already claimed by another worker
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

      if (phone) {
        if (!contactId) {
          // Find or create contact
          const { data: existingContact } = await service
            .from('contacts')
            .select('id')
            .eq('account_id', accountId)
            .eq('phone', phone)
            .maybeSingle();

          if (existingContact) {
            contactId = existingContact.id;
          } else {
            const { data: newContact } = await service
              .from('contacts')
              .insert({
                account_id: accountId,
                name: customerName,
                phone,
              })
              .select('id')
              .maybeSingle();
            if (newContact) {
              contactId = newContact.id;
            }
          }
        }

        if (contactId && !conversationId) {
          // Find or create conversation
          const { data: existingConv } = await service
            .from('conversations')
            .select('id')
            .eq('account_id', accountId)
            .eq('contact_id', contactId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingConv) {
            conversationId = existingConv.id;
          } else {
            const { data: newConv } = await service
              .from('conversations')
              .insert({
                account_id: accountId,
                contact_id: contactId,
                status: 'open',
              })
              .select('id')
              .maybeSingle();
            if (newConv) {
              conversationId = newConv.id;
            }
          }
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
          console.log(`[appointment-reminders] 🚀 Auto-sending reminder for appt ${appt.id} to ${phone}`);
          await engineSendText({
            accountId,
            userId: auditUserId,
            conversationId,
            contactId,
            text: finalMessage,
          });
          totalSent++;
          sentDetails.push({
            appointmentId: appt.id,
            customerName,
            phone,
            scheduledAt: appt.scheduled_at,
          });
        } catch (sendErr) {
          console.error(`[appointment-reminders] Failed to send text for appt ${appt.id}:`, sendErr);
        }
      } else {
        console.warn(`[appointment-reminders] Could not resolve conversation for appt ${appt.id} (phone: ${phone})`);
      }
    }
  }

  return {
    success: true,
    processedAccounts: activeSettingsList.length,
    sentCount: totalSent,
    skippedCount: totalSkipped,
    details: sentDetails,
  };
}
