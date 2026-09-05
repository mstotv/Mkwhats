import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendStorefrontWhatsAppMessage,
  sendStorefrontTelegramNotification,
} from '@/lib/storefront/notifications'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    const subdomain = body?.subdomain?.trim().toLowerCase()
    const customerName = body?.customerName?.trim()
    const customerPhone = body?.customerPhone?.trim()
    const serviceName = body?.serviceName?.trim() || 'استشارة / خدمة'
    const appointmentDate = body?.appointmentDate?.trim() // e.g. 2026-09-06
    const startTime = body?.startTime?.trim() // e.g. 14:00
    const durationMinutes = Number(body?.durationMinutes) || 45
    const notes = body?.notes?.trim() || ''

    if (!subdomain) {
      return NextResponse.json({ error: 'اسم النطاق غير محدد' }, { status: 400 })
    }
    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: 'يرجى إدخال اسمك الكريم' }, { status: 400 })
    }
    if (!customerPhone || customerPhone.length < 7) {
      return NextResponse.json({ error: 'يرجى إدخال رقم هاتف صحيح' }, { status: 400 })
    }
    if (!appointmentDate || !startTime) {
      return NextResponse.json({ error: 'يرجى تحديد تاريخ ووقت الموعد' }, { status: 400 })
    }

    const service = createServiceClient()

    // 1. Fetch storefront and account details
    const { data: storefront, error: storeErr } = await service
      .from('storefronts')
      .select('*, accounts(id, name)')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .maybeSingle()

    if (storeErr || !storefront) {
      return NextResponse.json({ error: 'المتجر أو العيادة غير متاح حالياً لاستقبال الحجوزات' }, { status: 404 })
    }

    const accountId = storefront.account_id
    const storeName = storefront.store_name || (storefront.accounts as any)?.name || 'العيادة'

    // Combine date and time to ISO string
    const scheduledAt = new Date(`${appointmentDate}T${startTime}:00`).toISOString()

    // 2. Find or Create Contact in CRM
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '')
    let contactId: string | null = null

    const { data: existingContact } = await service
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact } = await service
        .from('contacts')
        .insert({
          account_id: accountId,
          name: customerName,
          phone: cleanPhone,
        })
        .select('id')
        .maybeSingle()

      contactId = newContact?.id || null
    }

    // 3. Create Appointment in database
    const { data: appointment, error: apptErr } = await service
      .from('appointments')
      .insert({
        account_id: accountId,
        contact_id: contactId,
        customer_name: customerName,
        customer_phone: cleanPhone,
        service_name: serviceName,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: 'confirmed',
        notes: notes ? `حجز متجر إلكتروني: ${notes}` : 'حجز مباشر من صفحة المتجر/العيادة',
      })
      .select('id')
      .maybeSingle()

    if (apptErr) {
      console.error('[Storefront Booking] Insert error:', apptErr)
      return NextResponse.json({ error: 'تعذر تأكيد الحجز، يرجى اختيار موعد آخر' }, { status: 500 })
    }

    // 4. Automated WhatsApp confirmation to customer (Non-blocking)
    const settings = (storefront.settings as any) || {}
    if (settings.enable_whatsapp_confirmation !== false) {
      const whatsappText = `مرحباً ${customerName} ✨\n\nتم تأكيد حجز موعدك بنجاح لدى *${storeName}*!\n\n📅 *التاريخ:* ${appointmentDate}\n⏰ *الوقت:* ${startTime}\n💇 *الخدمة:* ${serviceName}\n⏱️ *المدة:* ${durationMinutes} دقيقة\n\nنتطلع لرؤيتك وخدمتك بأفضل مستوى! إذا رغبت في تعديل الموعد يمكنك الرد على هذه الرسالة مباشرة.`

      sendStorefrontWhatsAppMessage({
        accountId,
        phone: cleanPhone,
        text: whatsappText,
      }).catch((e) => console.error('[Storefront Booking] WhatsApp dispatch error:', e))
    }

    // 5. Automated Telegram alert to business owner (Non-blocking)
    if (settings.enable_telegram_notifications !== false) {
      const telegramHtml = `<b>🗓️ حجز موعد جديد من المتجر/العيادة!</b>\n\n` +
        `<b>🏥 الجهة:</b> ${storeName} (<code>${subdomain}</code>)\n` +
        `<b>👤 العميل:</b> ${customerName}\n` +
        `<b>📱 الهاتف:</b> <code>${cleanPhone}</code>\n` +
        `<b>💇 الخدمة:</b> ${serviceName}\n` +
        `<b>📅 الموعد:</b> ${appointmentDate} في تمام الساعة <b>${startTime}</b>\n` +
        (notes ? `<b>📝 ملاحظات:</b> ${notes}\n` : '')

      sendStorefrontTelegramNotification({
        accountId,
        htmlMessage: telegramHtml,
      }).catch((e) => console.error('[Storefront Booking] Telegram dispatch error:', e))
    }

    return NextResponse.json({
      success: true,
      appointmentId: appointment?.id,
      message: settings.appointment_success_message || 'تم تأكيد حجز موعدك بنجاح! تم إرسال رسالة التأكيد عبر الواتساب.',
    })
  } catch (error: any) {
    console.error('[Storefront Booking] Unexpected error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حجز الموعد، يرجى المحاولة لاحقاً' }, { status: 500 })
  }
}
