import type { SupabaseClient } from '@supabase/supabase-js'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'
import { loadTelegramConfig } from './config'

/**
 * Escape HTML special characters for Telegram HTML parse_mode
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Send an automated Telegram notification for a confirmed order.
 *
 * Designed to be strictly BEST-EFFORT and NON-BLOCKING:
 * It catches all network errors, misconfigurations, or API rejections
 * and logs them cleanly without throwing or blocking the parent flow.
 */
export async function sendTelegramOrderNotification(
  db: SupabaseClient,
  orderId: string,
  accountId: string,
): Promise<boolean> {
  try {
    // 1. Check feature flag 'telegram_bot' in account's subscription plan
    const featureCheck = await checkAccountFeature(accountId, 'telegram_bot')
    if (!featureCheck.allowed) {
      return false
    }

    // 2. Load account's Telegram configuration
    const config = await loadTelegramConfig(db, accountId)
    if (!config || !config.isActive || !config.botToken || !config.chatId) {
      return false
    }

    // 3. Fetch order with contact info and field values
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select(`
        id,
        status,
        confirmed_at,
        created_at,
        contacts (
          name,
          phone
        ),
        order_field_values (
          field_key,
          field_value
        )
      `)
      .eq('id', orderId)
      .eq('account_id', accountId)
      .maybeSingle()

    if (orderErr || !order) {
      console.error('[telegram notification] Failed to fetch order:', orderErr)
      return false
    }

    // 4. Fetch form fields schema to preserve display labels and sort_order
    const { data: formFields } = await db
      .from('order_form_fields')
      .select('field_key, field_label, sort_order')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true })

    const fieldsSchema = formFields ?? []

    // Build field value lookup
    const fieldValueMap: Record<string, string> = {}
    if (Array.isArray(order.order_field_values)) {
      for (const fv of order.order_field_values as any[]) {
        if (fv.field_key && fv.field_value !== null && String(fv.field_value).trim() !== '') {
          fieldValueMap[fv.field_key] = String(fv.field_value).trim()
        }
      }
    }

    // 5. Construct Telegram HTML message
    const contact = (order.contacts as any) ?? {}
    const contactName = contact.name ? escapeHtml(contact.name) : 'غير معروف'
    const contactPhone = contact.phone ? escapeHtml(contact.phone) : 'غير متوفر'

    const messageLines: string[] = [
      '<b>🔔 طلب جديد مؤكد!</b>',
      '',
      `<b>👤 العميل:</b> ${contactName}`,
      `<b>📱 الرقم:</b> <code>${contactPhone}</code>`,
    ]

    // Append dynamic form field values
    const fieldEntries: string[] = []

    if (fieldsSchema.length > 0) {
      for (const field of fieldsSchema) {
        const val = fieldValueMap[field.field_key]
        if (val) {
          const label = escapeHtml(field.field_label || field.field_key)
          fieldEntries.push(`• <b>${label}:</b> ${escapeHtml(val)}`)
        }
      }
    } else {
      // Fallback if no form_fields schema exists but values were collected
      for (const [k, v] of Object.entries(fieldValueMap)) {
        fieldEntries.push(`• <b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`)
      }
    }

    if (fieldEntries.length > 0) {
      messageLines.push('', '<b>📋 تفاصيل الطلب:</b>', ...fieldEntries)
    }

    const messageText = messageLines.join('\n')

    // 6. Send HTTP POST to Telegram Bot API
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: messageText,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(
        `[telegram notification] API error (${res.status}):`,
        errBody,
      )
      return false
    }

    return true
  } catch (err) {
    console.error('[telegram notification] Unexpected error:', err)
    return false
  }
}

/**
 * Send an automated Telegram notification for a confirmed appointment.
 * Non-blocking and best-effort.
 */
export async function sendTelegramAppointmentNotification(
  db: SupabaseClient,
  appointmentId: string,
  accountId: string,
): Promise<boolean> {
  try {
    // 1. Check feature flag 'telegram_bot' in account's subscription plan
    const featureCheck = await checkAccountFeature(accountId, 'telegram_bot')
    if (!featureCheck.allowed) {
      return false
    }

    // 2. Load account's Telegram configuration
    const config = await loadTelegramConfig(db, accountId)
    if (!config || !config.isActive || !config.botToken || !config.chatId) {
      return false
    }

    // 3. Fetch appointment data
    const { data: appt, error: apptErr } = await db
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('account_id', accountId)
      .maybeSingle()

    if (apptErr || !appt) {
      console.error('[telegram notification] Failed to fetch appointment:', apptErr)
      return false
    }

    // 4. Fetch appointment settings for timezone & labels
    const { data: settings } = await db
      .from('appointment_settings')
      .select('timezone, service_label')
      .eq('account_id', accountId)
      .maybeSingle()

    const tz = settings?.timezone || 'Asia/Baghdad'
    const serviceLabel = settings?.service_label || 'الخدمة'

    // Format local date/time string
    let localDateStr = appt.scheduled_at
    try {
      localDateStr = new Intl.DateTimeFormat('ar-IQ', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: tz,
      }).format(new Date(appt.scheduled_at))
    } catch {
      localDateStr = new Date(appt.scheduled_at).toLocaleString()
    }

    const customerName = escapeHtml(appt.customer_name || 'غير معروف')
    const customerPhone = escapeHtml(appt.customer_phone || 'غير متوفر')
    const serviceName = appt.service_name ? escapeHtml(appt.service_name) : 'عام'

    const messageLines: string[] = [
      '<b>📅 حجز موعد جديد مؤكد!</b>',
      '',
      `<b>👤 العميل:</b> ${customerName}`,
      `<b>📱 الرقم:</b> <code>${customerPhone}</code>`,
      `<b>🏷️ ${escapeHtml(serviceLabel)}:</b> ${serviceName}`,
      `<b>⏰ الموعد:</b> ${localDateStr}`,
      `<b>⏳ المدة:</b> ${appt.duration_minutes} دقيقة`,
    ]

    if (appt.notes) {
      messageLines.push(`<b>📝 ملاحظات:</b> ${escapeHtml(appt.notes)}`)
    }

    const messageText = messageLines.join('\n')

    // 5. Send HTTP POST to Telegram Bot API
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: messageText,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(
        `[telegram notification] API error (${res.status}):`,
        errBody,
      )
      return false
    }

    return true
  } catch (err) {
    console.error('[telegram notification] Appointment notification error:', err)
    return false
  }
}

