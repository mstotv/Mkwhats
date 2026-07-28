import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { getEvolutionConnectionState } from '@/lib/whatsapp/evolution-api'

/**
 * GET /api/whatsapp/evolution/status
 *
 * Returns the live connection state of the account's Evolution instance.
 * The UI uses this to:
 *   - Show the connection badge (connected / connecting / disconnected)
 *   - Display the connected phone number once paired
 *
 * Response shapes:
 *   { state: 'open',       phone: '+966501234567', connected: true  }
 *   { state: 'connecting', phone: null,            connected: false }
 *   { state: 'close',      phone: null,            connected: false }
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
      .select('connection_type, evolution_instance_name, evolution_api_key, evolution_connected_phone, status')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config || config.connection_type !== 'evolution') {
      return NextResponse.json({
        state: 'close',
        phone: null,
        connected: false,
        reason: 'no_evolution_config',
      })
    }

    if (!config.evolution_instance_name || !config.evolution_api_key) {
      return NextResponse.json({
        state: 'close',
        phone: null,
        connected: false,
        reason: 'instance_not_initialized',
      })
    }

    let instanceApiKey: string
    try {
      instanceApiKey = decrypt(config.evolution_api_key)
    } catch {
      return NextResponse.json(
        {
          error: 'Stored Evolution API key could not be decrypted.',
          code: 'key_corrupted',
        },
        { status: 200 },
      )
    }

    try {
      const statusResult = await getEvolutionConnectionState({
        instanceName: config.evolution_instance_name,
        instanceApiKey,
      })

      const connected = statusResult.state === 'open'

      // If the live state is 'open', heal status and evolution_connected_phone
      if (connected) {
        const updatePayload: Record<string, unknown> = {}
        if (config.status !== 'connected') {
          updatePayload.status = 'connected'
          updatePayload.connected_at = new Date().toISOString()
        }
        if (statusResult.phone && statusResult.phone !== config.evolution_connected_phone) {
          updatePayload.evolution_connected_phone = statusResult.phone
        }

        if (Object.keys(updatePayload).length > 0) {
          void supabase
            .from('whatsapp_config')
            .update(updatePayload)
            .eq('account_id', accountId)
            .then(({ error }: { error: unknown }) => {
              if (error) {
                console.warn('[evolution/status] heal update failed:', error)
              }
            })
        }
      }

      return NextResponse.json({
        state: statusResult.state,
        phone: statusResult.phone ?? config.evolution_connected_phone ?? null,
        connected,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[evolution/status GET] getEvolutionConnectionState failed:', message)
      return NextResponse.json(
        {
          state: 'close',
          phone: null,
          connected: false,
          error: `Could not reach Evolution server: ${message}`,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error('[evolution/status GET] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
