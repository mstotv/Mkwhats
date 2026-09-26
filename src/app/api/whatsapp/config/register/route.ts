import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { registerPhoneNumber, subscribeWabaToApp } from '@/lib/whatsapp/meta-api'

export async function POST(request: Request) {
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

    const accountId = profile?.account_id as string | undefined
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : ''

    if (!pin || !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit two-step verification PIN.' },
        { status: 400 }
      )
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'No WhatsApp configuration found to register.' },
        { status: 404 }
      )
    }

    let accessToken: string
    try {
      accessToken = decrypt(config.access_token)
    } catch {
      return NextResponse.json(
        { error: 'Cannot decrypt access token. Please re-enter your access token in WhatsApp settings.' },
        { status: 400 }
      )
    }

    // Call Meta to register the phone number
    try {
      await registerPhoneNumber({
        phoneNumberId: config.phone_number_id,
        accessToken,
        pin,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Meta registration failed: ${msg}` },
        { status: 400 }
      )
    }

    // Subscribe WABA to app if WABA ID is configured
    let subscribedAppsAt: string | null = config.subscribed_apps_at
    if (config.waba_id) {
      try {
        await subscribeWabaToApp({
          wabaId: config.waba_id,
          accessToken,
        })
        subscribedAppsAt = new Date().toISOString()
      } catch (err) {
        console.warn('[config/register] WABA subscribe failed (non-fatal):', err)
      }
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('whatsapp_config')
      .update({
        registered_at: now,
        subscribed_apps_at: subscribedAppsAt ?? now,
        last_registration_error: null,
        status: 'connected',
        connection_type: 'meta',
        updated_at: now,
      })
      .eq('account_id', accountId)

    if (updateError) {
      console.error('[config/register] DB update error:', updateError)
      return NextResponse.json(
        { error: 'Registration succeeded with Meta, but failed to update local configuration.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number registered successfully with Meta! Inbound events and messages are now active.',
      registered_at: now,
    })
  } catch (error) {
    console.error('[config/register] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error while registering phone number.' },
      { status: 500 }
    )
  }
}
