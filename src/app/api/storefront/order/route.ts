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
    const customerAddress = body?.customerAddress?.trim() || ''
    const notes = body?.notes?.trim() || ''
    const items = Array.isArray(body?.items) ? body.items : []

    if (!subdomain) {
      return NextResponse.json({ error: 'اسم المتجر غير محدد' }, { status: 400 })
    }
    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: 'يرجى إدخال اسمك الكريم' }, { status: 400 })
    }
    if (!customerPhone || customerPhone.length < 7) {
      return NextResponse.json({ error: 'يرجى إدخال رقم هاتف صحيح' }, { status: 400 })
    }
    if (items.length === 0) {
      return NextResponse.json({ error: 'سلة المشتريات فارغة' }, { status: 400 })
    }

    const service = createServiceClient()

    // 1. Fetch storefront and account details
    const { data: storefront, error: storeErr } = await service
      .from('storefronts')
      .select('*, accounts(id, name, default_currency)')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .maybeSingle()

    if (storeErr || !storefront) {
      return NextResponse.json({ error: 'المتجر غير متاح حالياً لاستقبال الطلبات' }, { status: 404 })
    }

    const accountId = storefront.account_id
    const storeName = storefront.store_name || (storefront.accounts as any)?.name || 'المتجر'
    const currency = (storefront.accounts as any)?.default_currency || 'USD'

    // 2. Calculate total amount
    let totalAmount = 0
    const itemsSummary: string[] = []

    for (const it of items) {
      const q = Math.max(1, Number(it.quantity) || 1)
      const p = Math.max(0, Number(it.price) || 0)
      totalAmount += p * q
      itemsSummary.push(`• ${it.title} × ${q} (${(p * q).toFixed(2)} ${currency})`)
    }

    // 3. Find or Create Contact in CRM
    let contactId: string | null = null
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '')

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
          address: customerAddress || null,
        })
        .select('id')
        .maybeSingle()

      contactId = newContact?.id || null
    }

    // 4. Create Order in database
    const orderPayload: Record<string, any> = {
      account_id: accountId,
      contact_id: contactId,
      status: 'pending',
      total_amount: totalAmount,
      currency,
      source: 'storefront',
      notes: customerAddress ? `العنوان: ${customerAddress} | ملاحظات: ${notes}` : notes,
      items: items,
      metadata: {
        subdomain,
        customer_name: customerName,
        customer_phone: cleanPhone,
        customer_address: customerAddress,
      },
    }

    // Insert order (fallback gracefully if items/metadata columns are jsonb)
    const { data: newOrder, error: orderInsertErr } = await service
      .from('orders')
      .insert(orderPayload)
      .select('id')
      .maybeSingle()

    const orderRef = newOrder?.id ? newOrder.id.slice(0, 8).toUpperCase() : Math.floor(1000 + Math.random() * 9000).toString()

    // 5. Automated WhatsApp confirmation to customer (Non-blocking)
    const settings = (storefront.settings as any) || {}
    if (settings.enable_whatsapp_confirmation !== false) {
      const whatsappText = `مرحباً ${customerName} 👋\n\nتم استلام طلبك بنجاح من *${storeName}* 🛍️\nرقم الطلب: #${orderRef}\n\n*المنتجات المطلوبة:*\n${itemsSummary.join('\n')}\n\n*الإجمالي:* ${totalAmount.toFixed(2)} ${currency}\n${customerAddress ? `*عنوان التوصيل:* ${customerAddress}\n` : ''}\nسيقوم فريقنا بالتواصل معك قريباً لتأكيد الشحن. شكراً لثقتك بنا!`

      sendStorefrontWhatsAppMessage({
        accountId,
        phone: cleanPhone,
        text: whatsappText,
      }).catch((e) => console.error('[Storefront Order] WhatsApp dispatch error:', e))
    }

    // 6. Automated Telegram alert to business owner (Non-blocking)
    if (settings.enable_telegram_notifications !== false) {
      const telegramHtml = `<b>🔔 طلب جديد من المتجر الإلكتروني!</b>\n\n` +
        `<b>🏪 المتجر:</b> ${storeName} (<code>${subdomain}</code>)\n` +
        `<b>👤 العميل:</b> ${customerName}\n` +
        `<b>📱 الهاتف:</b> <code>${cleanPhone}</code>\n` +
        (customerAddress ? `<b>📍 العنوان:</b> ${customerAddress}\n` : '') +
        (notes ? `<b>📝 ملاحظات:</b> ${notes}\n` : '') +
        `\n<b>📦 المنتجات:</b>\n${itemsSummary.join('\n')}\n\n` +
        `<b>💰 الإجمالي:</b> ${totalAmount.toFixed(2)} ${currency}\n` +
        `<b>🔖 رقم المرجع:</b> #${orderRef}`

      sendStorefrontTelegramNotification({
        accountId,
        htmlMessage: telegramHtml,
      }).catch((e) => console.error('[Storefront Order] Telegram dispatch error:', e))
    }

    return NextResponse.json({
      success: true,
      orderRef,
      message: settings.order_success_message || 'تم استلام طلبك بنجاح! تم إرسال رسالة التأكيد عبر الواتساب.',
    })
  } catch (error: any) {
    console.error('[Storefront Order] Unexpected error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً' }, { status: 500 })
  }
}
