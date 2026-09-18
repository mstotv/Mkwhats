import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/whatsapp/encryption'
import {
  createEvolutionInstance,
  deleteEvolutionInstance,
  instanceNameForAccount,
  getEvolutionServerUrl,
} from '@/lib/whatsapp/evolution-api'

// Lazy-initialised service-role client (same pattern as meta config route).
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

async function resolveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.account_id) return null
  return data.account_id as string
}

/**
 * POST /api/whatsapp/evolution/instance
 *
 * Creates an Evolution instance for the caller's account.
 * Idempotent — if the account already has an evolution row,
 * returns it rather than creating a second one.
 *
 * Body: (empty — everything is derived server-side)
 *
 * Response: { instanceName, connected: false, qrBase64? }
 */
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

    const accountId = await resolveAccountId(supabase, user.id)
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const { instanceName: inputName, token, number } = body

    if (!inputName || typeof inputName !== 'string' || !inputName.trim()) {
      return NextResponse.json(
        { error: 'Instance name is required.' },
        { status: 400 },
      )
    }

    const cleanInstanceName = inputName.trim()
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanInstanceName)) {
      return NextResponse.json(
        { error: 'Instance name can only contain letters, numbers, hyphens, and underscores.' },
        { status: 400 },
      )
    }

    // Multi-tenant check: ensure no other account has claimed this instanceName
    const { data: nameClaimed, error: claimError } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('account_id')
      .eq('evolution_instance_name', cleanInstanceName)
      .neq('account_id', accountId)
      .maybeSingle()

    if (claimError) {
      console.error('[evolution/instance POST] claim check failed:', claimError)
      return NextResponse.json(
        { error: 'Failed to validate instance name uniqueness.' },
        { status: 500 },
      )
    }

    if (nameClaimed) {
      return NextResponse.json(
        {
          error:
            'This Instance Name is already claimed by another account. Please choose a different unique name.',
        },
        { status: 409 },
      )
    }

    // Check if there is already a config row for THIS account.
    const { data: existing } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('id, connection_type, evolution_instance_name, status')
      .eq('account_id', accountId)
      .maybeSingle()

    if (existing) {
      // If the account is currently using Meta actively, block — they must
      // disconnect Meta first (Settings → WhatsApp → Reset Configuration) before switching to Evolution.
      if (existing.connection_type === 'meta' && existing.status === 'connected') {
        return NextResponse.json(
          {
            error:
              'This account already has an active Meta Business API connection. ' +
              'Delete it first (Settings → WhatsApp → Reset Configuration) before switching to Evolution.',
          },
          { status: 409 },
        )
      }

      // If already has an active connected Evolution config with this instance, return it
      if (
        existing.connection_type === 'evolution' &&
        existing.status === 'connected' &&
        existing.evolution_instance_name === cleanInstanceName
      ) {
        return NextResponse.json({
          success: true,
          already_exists: true,
          instanceName: existing.evolution_instance_name,
          connected: true,
        })
      }
    }

    // Build the webhook URL that Evolution will call for events.
    // Prefers explicit WEBHOOK_BASE_URL or NEXT_PUBLIC_SITE_URL for local dev tunneling (ngrok).
    const baseUrl =
      process.env.WEBHOOK_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin

    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/whatsapp/evolution/webhook`

    // Create the instance on the Evolution server with user's params.
    let instanceResult
    try {
      instanceResult = await createEvolutionInstance({
        instanceName: cleanInstanceName,
        token: typeof token === 'string' ? token : undefined,
        number: typeof number === 'string' ? number : undefined,
        webhookUrl,
        qrcode: true,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Evolution API error'
      console.error('[evolution/instance POST] createEvolutionInstance failed:', message)
      return NextResponse.json(
        { error: `Evolution API error: ${message}` },
        { status: 502 },
      )
    }

    // Encrypt the per-instance API key before storing.
    let encryptedApiKey: string
    try {
      encryptedApiKey = encrypt(instanceResult.apiKey)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Encryption failed'
      console.error('[evolution/instance POST] encryption failed:', message)
      return NextResponse.json(
        {
          error:
            'Failed to encrypt Evolution API key. ' +
            'Check that ENCRYPTION_KEY is a valid 64-character hex string.',
        },
        { status: 500 },
      )
    }

    // Persist to whatsapp_config. Use upsert with onConflict: 'account_id'
    // so existing rows for this account are updated rather than throwing a duplicate key error.
    const { error: insertError } = await supabaseAdmin()
      .from('whatsapp_config')
      .upsert(
        {
          account_id: accountId,
          user_id: user.id,
          // Evolution rows don't use Meta fields; set required column
          // to a unique sentinel value so it doesn't collide with the UNIQUE(phone_number_id) constraint.
          phone_number_id: `evolution_${cleanInstanceName}`,
          access_token: '',         // NOT NULL in original schema; empty string for evolution
          connection_type: 'evolution',
          evolution_server_url: getEvolutionServerUrl(),
          evolution_api_key: encryptedApiKey,
          evolution_instance_name: instanceResult.instanceName,
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'account_id' },
      )

    if (insertError) {
      console.error('[evolution/instance POST] DB upsert failed:', insertError)
      // Best-effort cleanup: delete the just-created Evolution instance
      // so the server doesn't accumulate orphans.
      try {
        await deleteEvolutionInstance({ instanceName: cleanInstanceName })
      } catch (cleanupErr) {
        console.warn('[evolution/instance POST] orphan cleanup failed:', cleanupErr)
      }
      return NextResponse.json(
        { error: `Failed to save Evolution configuration: ${insertError.message || 'database error'}` },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      already_exists: false,
      instanceName: instanceResult.instanceName,
      connected: false,
      qrBase64: instanceResult.qrBase64 ?? null,
    })
  } catch (error) {
    console.error('[evolution/instance POST] unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/whatsapp/evolution/instance
 *
 * Disconnects and deletes the Evolution instance for the account.
 * Also clears the whatsapp_config row so the account can
 * connect via either method again.
 */
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

    const accountId = await resolveAccountId(supabase, user.id)
    if (!accountId) {
      return NextResponse.json(
        { error: 'Your profile is not linked to an account.' },
        { status: 403 },
      )
    }

    const { data: config } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('evolution_instance_name, connection_type')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config || config.connection_type !== 'evolution') {
      return NextResponse.json(
        { error: 'No Evolution connection found for this account.' },
        { status: 404 },
      )
    }

    // Delete from Evolution server first (best-effort — we still
    // clear the DB row even if the API call fails).
    if (config.evolution_instance_name) {
      try {
        await deleteEvolutionInstance({
          instanceName: config.evolution_instance_name,
        })
      } catch (err) {
        console.warn(
          '[evolution/instance DELETE] Evolution server delete failed (continuing with DB cleanup):',
          err instanceof Error ? err.message : err,
        )
      }
    }

    // Remove the config row.
    const { error: deleteError } = await supabaseAdmin()
      .from('whatsapp_config')
      .delete()
      .eq('account_id', accountId)

    if (deleteError) {
      console.error('[evolution/instance DELETE] DB delete failed:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove configuration' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[evolution/instance DELETE] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
