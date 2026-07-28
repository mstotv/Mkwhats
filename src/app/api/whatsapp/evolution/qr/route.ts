import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { getEvolutionQr } from '@/lib/whatsapp/evolution-api'

/**
 * GET /api/whatsapp/evolution/qr
 *
 * Returns the current QR code for the account's Evolution instance.
 * Called by the UI every ~30s while waiting for the user to scan.
 *
 * Response shapes:
 *   { connected: true }                          — already paired
 *   { connected: false, qrBase64, code }         — QR available
 *   { connected: false, qrBase64: null, code: null } — QR not ready yet
 *
 * Returns 200 in all non-auth cases so the UI can render state
 * rather than show a generic error.
 */
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

    const { data: config } = await supabase
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

    if (!config.evolution_instance_name || !config.evolution_api_key) {
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

    let instanceApiKey: string
    try {
      instanceApiKey = decrypt(config.evolution_api_key)
    } catch {
      return NextResponse.json(
        {
          error:
            'Stored Evolution API key could not be decrypted. ' +
            'Reset the Evolution connection and try again.',
          code: 'key_corrupted',
        },
        { status: 200 },
      )
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
      console.error('[evolution/qr GET] getEvolutionQr failed:', message)
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
