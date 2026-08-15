import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { submitMessageTemplate } from '@/lib/whatsapp/meta-api'
import {
  validateTemplatePayload,
  type TemplatePayload,
} from '@/lib/whatsapp/template-validators'
import { buildMetaTemplatePayload } from '@/lib/whatsapp/template-components'
import { ensureImageHeaderHandle } from '@/lib/whatsapp/template-header-handle'
import { normalizeStatus } from '@/lib/whatsapp/template-status-normalize'

function buildUpsertRow(
  accountId: string,
  userId: string,
  payload: TemplatePayload,
  extras: {
    status: 'DRAFT' | string
    metaTemplateId: string | null
    submissionError: string | null
  },
) {
  return {
    account_id: accountId,
    user_id: userId,
    name: payload.name,
    category: payload.category,
    language: payload.language,
    header_type: payload.header_type ?? null,
    header_content: payload.header_content ?? null,
    header_media_url: payload.header_media_url ?? null,
    header_handle: payload.header_handle ?? null,
    body_text: payload.body_text,
    footer_text: payload.footer_text ?? null,
    buttons: payload.buttons ?? null,
    sample_values: payload.sample_values ?? null,
    status: extras.status,
    meta_template_id: extras.metaTemplateId,
    submission_error: extras.submissionError,
    updated_at: new Date().toISOString(),
  }
}

async function upsertTemplateRow(
  supabase: SupabaseClient,
  row: ReturnType<typeof buildUpsertRow>,
) {
  return supabase.from('message_templates').upsert(row, {
    onConflict: 'account_id,name,language',
  })
}

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
        { status: 403 },
      )
    }

    const body = await request.json()
    let payload: TemplatePayload
    try {
      payload = body as TemplatePayload
      validateTemplatePayload(payload)
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid template payload' },
        { status: 400 },
      )
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        {
          error:
            'WhatsApp not configured. Connect your WhatsApp account in Settings first.',
        },
        { status: 400 },
      )
    }

    const connectionType = config.connection_type ?? 'meta'

    // ══════════════════════════════════════════════════════════════════
    // EVOLUTION PATH — Local templates saved immediately as APPROVED
    // ══════════════════════════════════════════════════════════════════
    if (connectionType === 'evolution') {
      const row = buildUpsertRow(accountId, user.id, payload, {
        status: 'APPROVED',
        metaTemplateId: null,
        submissionError: null,
      })

      const { error: dbError } = await upsertTemplateRow(supabase, row)
      if (dbError) {
        console.error('[templates/submit POST] DB upsert failed:', dbError)
        return NextResponse.json(
          { error: `Failed to save local template: ${dbError.message}` },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        template_id: null,
        status: 'APPROVED',
        connection_type: 'evolution',
      })
    }

    // ══════════════════════════════════════════════════════════════════
    // META PATH — Submit to Meta Graph API for review
    // ══════════════════════════════════════════════════════════════════
    const dryRun =
      process.env.WHATSAPP_TEMPLATES_DRY_RUN === 'true' ||
      process.env.WHATSAPP_TEMPLATES_DRY_RUN === '1'

    let metaTemplateId: string
    let metaStatus: string

    if (dryRun) {
      metaTemplateId = `dry-run-${crypto.randomUUID()}`
      metaStatus = 'PENDING'
    } else {
      if (!config.waba_id) {
        return NextResponse.json(
          {
            error:
              'WABA (WhatsApp Business Account) ID missing. Re-connect your account in Settings.',
          },
          { status: 400 },
        )
      }

      const accessToken = decrypt(config.access_token)

      try {
        await ensureImageHeaderHandle(payload, accessToken)
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Header image upload failed.' },
          { status: 400 },
        )
      }

      const metaPayload = buildMetaTemplatePayload(payload)
      try {
        const meta = await submitMessageTemplate({
          wabaId: config.waba_id,
          accessToken,
          payload: metaPayload,
        })
        metaTemplateId = meta.id
        metaStatus = meta.status
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Meta submit failed.'
        await upsertTemplateRow(
          supabase,
          buildUpsertRow(accountId, user.id, payload, {
            status: 'DRAFT',
            metaTemplateId: null,
            submissionError: message,
          }),
        )
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const row = buildUpsertRow(accountId, user.id, payload, {
      status: normalizeStatus(metaStatus),
      metaTemplateId,
      submissionError: null,
    })

    const { error: dbError } = await upsertTemplateRow(supabase, row)
    if (dbError) {
      console.error('[templates/submit POST] DB upsert failed:', dbError)
      return NextResponse.json(
        {
          error:
            'Submitted to Meta successfully, but local sync failed: ' +
            dbError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      template_id: metaTemplateId,
      status: normalizeStatus(metaStatus),
      connection_type: 'meta',
    })
  } catch (error) {
    console.error('Error in template submit POST:', error)
    return NextResponse.json(
      { error: 'Failed to process template submission' },
      { status: 500 },
    )
  }
}
