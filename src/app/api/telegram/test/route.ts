import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'
import { loadTelegramConfig } from '@/lib/telegram/config'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Profile not linked to account' }, { status: 403 })
    }

    const accountId = profile.account_id

    // Check plan feature
    const featureCheck = await checkAccountFeature(accountId, 'telegram_bot')
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { error: featureCheck.reason || 'ميزة إشعار تيليجرام غير متاحة في خطتك الحالية' },
        { status: 403 },
      )
    }

    const body = await req.json()
    let { botToken, chatId } = body

    if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال المعرف (Chat ID) بشكل صحيح' }, { status: 400 })
    }

    // If botToken is masked or empty, load existing token if present
    if (!botToken || botToken.includes('••••')) {
      const existingConfig = await loadTelegramConfig(supabase, accountId)
      if (!existingConfig) {
        return NextResponse.json({ error: 'يرجى إدخال رمز البوت (Bot Token)' }, { status: 400 })
      }
      botToken = existingConfig.botToken
    }

    const cleanToken = botToken.trim()
    const cleanChatId = chatId.trim()

    // 1. Verify Bot Token via Telegram getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`)
    const getMeData = await getMeRes.json().catch(() => ({}))

    if (!getMeRes.ok || !getMeData.ok) {
      return NextResponse.json(
        { error: 'رمز البوت (Bot Token) غير صالح أو تم إلغاؤه من تيليجرام' },
        { status: 400 },
      )
    }

    const botUsername = getMeData.result?.username ? `@${getMeData.result.username}` : 'البوت'

    // 2. Send test message to Chat ID via sendMessage
    const testText = `<b>🔔 رسالة تجريبية من منصة WACRM</b>\n\nتم الاتصال بـ ${botUsername} بنجاح! سيصلك إشعار فور تأكيد أي طلب جديد.`

    const sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: testText,
        parse_mode: 'HTML',
      }),
    })

    const sendData = await sendRes.json().catch(() => ({}))

    if (!sendRes.ok || !sendData.ok) {
      const desc = sendData.description || ''
      if (desc.includes('chat not found')) {
        return NextResponse.json(
          { error: 'لم يتم العثور على المحادثة (Chat ID). تأكد من إرسال رسالة أولاً للبوت أو إضافته للمجموعة.' },
          { status: 400 },
        )
      }
      return NextResponse.json(
        { error: `فشل الإرسال: ${desc || 'تأكد من معرف المحادثة Chat ID'}` },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      botUsername,
      message: `تم إرسال رسالة تجريبية بنجاح إلى البوت ${botUsername}!`,
    })
  } catch (err: any) {
    console.error('[API telegram/test POST] Unexpected error:', err)
    return NextResponse.json({ error: 'حدث خطأ أثناء فحص الاتصال بالتيليجرام' }, { status: 500 })
  }
}
