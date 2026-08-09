import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'
import { loadTelegramConfig, saveTelegramConfig, deleteTelegramConfig } from '@/lib/telegram/config'

export async function GET() {
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

    const config = await loadTelegramConfig(supabase, profile.account_id)

    if (!config) {
      return NextResponse.json({ config: null })
    }

    // Mask bot token for client security
    const rawToken = config.botToken
    const maskedToken = rawToken.length > 8
      ? `${rawToken.slice(0, 4)}••••••••${rawToken.slice(-4)}`
      : '••••••••'

    return NextResponse.json({
      config: {
        id: config.id,
        chatId: config.chatId,
        botTokenMasked: maskedToken,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    })
  } catch (err: any) {
    console.error('[API telegram/config GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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
    const { botToken, chatId, isActive = true } = body

    if (!chatId || typeof chatId !== 'string' || !chatId.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال المعرف (Chat ID) بشكل صحيح' }, { status: 400 })
    }

    // If botToken is masked or empty, load existing token if present
    let finalBotToken = botToken
    if (!botToken || botToken.includes('••••')) {
      const existingConfig = await loadTelegramConfig(supabase, accountId)
      if (!existingConfig) {
        return NextResponse.json({ error: 'يرجى إدخال رمز البوت (Bot Token)' }, { status: 400 })
      }
      finalBotToken = existingConfig.botToken
    }

    const result = await saveTelegramConfig(
      supabase,
      accountId,
      user.id,
      finalBotToken,
      chatId,
      Boolean(isActive),
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'فشل حفظ الإعدادات' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API telegram/config POST] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE() {
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

    const result = await deleteTelegramConfig(supabase, profile.account_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'فشل الحذف' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API telegram/config DELETE] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
