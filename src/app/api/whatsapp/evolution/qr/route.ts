import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/whatsapp/encryption'
import { getEvolutionQr, createEvolutionInstance } from '@/lib/whatsapp/evolution-api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: any = null
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminClient
}

/**
 * GET /api/whatsapp/evolution/qr
 *
 * Returns the current QR code for the account's Evolution instance.
 * Called by the UI every ~5s while waiting for the user to scan.
 *
 * Response shapes:
 *   { connected: true }                          — already paired
 *   { connected: false, qrBase64, code }         — QR available
 *   { connected: false, qrBase64: null, code: null } — QR not ready yet
 *
 * Returns 200 in all non-auth cases so the UI can render state
 * rather than show a generic error.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve account_id from profile.
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const accountId = profile?.account_id as string | undefined
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 },
      )
    }

    const { data: config } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('connection_type, evolution_instance_name, evolution_api_key, status')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config || config.connection_type !== 'evolution') {
      return NextResponse.json({
        connected: false,
        qrBase64: null,
        code: null,
        reason: 'no_evolution_config',
      })
    }

    // If already connected, skip the Evolution API call.
    if (config.status === 'connected') {
      return NextResponse.json({ connected: true })
    }

    if (!config.evolution_instance_name) {
      return NextResponse.json(
        {
          connected: false,
          qrBase64: null,
          code: null,
          reason: 'instance_not_initialized',
        },
        { status: 200 },
      )
    }

    let instanceApiKey = ''
    if (config.evolution_api_key) {
      try {
        instanceApiKey = decrypt(config.evolution_api_key)
      } catch {
        // Fallback to empty string which getEvolutionQr handles via global key
        instanceApiKey = ''
      }
    }

    try {
      const qrResult = await getEvolutionQr({
        instanceName: config.evolution_instance_name,
        instanceApiKey,
      })

      return NextResponse.json({
        connected: qrResult.connected,
        qrBase64: qrResult.base64,
        code: qrResult.code,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.warn('[evolution/qr GET] getEvolutionQr failed:', message)

      // Auto-heal: If instance was deleted from Evolution server or doesn't exist, recreate it
      if (
        message.toLowerCase().includes('does not exist') ||
        message.toLowerCase().includes('not found') ||
        message.includes('404')
      ) {
        try {
          const baseUrl =
            process.env.WEBHOOK_BASE_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            new URL(request.url).origin

          const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/whatsapp/evolution/webhook`

          const newInst = await createEvolutionInstance({
            instanceName: config.evolution_instance_name,
            webhookUrl,
            qrcode: true,
          })

          const encryptedKey = encrypt(newInst.apiKey)
          await supabaseAdmin()
            .from('whatsapp_config')
            .update({
              evolution_api_key: encryptedKey,
              updated_at: new Date().toISOString(),
            })
            .eq('account_id', accountId)

          let qrBase64 = newInst.qrBase64
          if (!qrBase64) {
            const freshQr = await getEvolutionQr({
              instanceName: config.evolution_instance_name,
              instanceApiKey: newInst.apiKey,
            })
            qrBase64 = freshQr.base64
          }

          if (qrBase64) {
            return NextResponse.json({
              connected: false,
              qrBase64,
              code: null,
            })
          }
        } catch (healErr) {
          console.error('[evolution/qr GET] auto-heal failed:', healErr)
        }
      }

      return NextResponse.json(
        {
          connected: false,
          qrBase64: null,
          code: null,
          error: `Could not fetch QR from Evolution server: ${message}`,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error('[evolution/qr GET] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
