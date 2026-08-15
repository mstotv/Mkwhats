import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  deleteMessageTemplate,
  editMessageTemplate,
} from '@/lib/whatsapp/meta-api'
import {
  validateTemplatePayload,
  type TemplatePayload,
} from '@/lib/whatsapp/template-validators'
import { buildMetaTemplatePayload } from '@/lib/whatsapp/template-components'
import { ensureImageHeaderHandle } from '@/lib/whatsapp/template-header-handle'

const EDITABLE_STATUSES = new Set(['APPROVED', 'REJECTED', 'PAUSED'])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isDryRun(): boolean {
  return (
    process.env.WHATSAPP_TEMPLATES_DRY_RUN === 'true' ||
    process.env.WHATSAPP_TEMPLATES_DRY_RUN === '1'
  )
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'Invalid template id.' },
        { status: 400 },
      )
    }
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

    const { data: existing, error: fetchErr } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .maybeSingle()
    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Template not found.' },
        { status: 404 },
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
        { error: 'WhatsApp not configured.' },
        { status: 400 },
      )
    }

    const connectionType = config.connection_type ?? 'meta'

    // Evolution API: Update local row directly without Meta Graph API
    if (connectionType === 'evolution') {
      const { data: updated, error: dbErr } = await supabase
        .from('message_templates')
        .update({
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
          status: 'APPROVED',
          submission_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (dbErr) {
        return NextResponse.json(
          { error: `Database update failed: ${dbErr.message}` },
          { status: 500 },
        )
      }
      return NextResponse.json({ success: true, template: updated })
    }

    // Meta API Path
    if (!EDITABLE_STATUSES.has(existing.status)) {
      return NextResponse.json(
        {
          error: `Templates with status "${existing.status}" cannot be edited.`,
        },
        { status: 400 },
      )
    }

    if (!isDryRun()) {
      if (!config.waba_id) {
        return NextResponse.json(
          { error: 'WABA ID missing. Re-connect your account in Settings.' },
          { status: 400 },
        )
      }
      if (!existing.meta_template_id) {
        return NextResponse.json(
          {
            error:
              'This template has no meta_template_id — submit it via /submit first.',
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
        await editMessageTemplate({
          metaTemplateId: existing.meta_template_id,
          accessToken,
          components: metaPayload.components,
          category: metaPayload.category,
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Meta edit failed.'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const { data: updated, error: dbErr } = await supabase
      .from('message_templates')
      .update({
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
        status: isDryRun() ? 'APPROVED' : 'PENDING',
        submission_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (dbErr) {
      return NextResponse.json(
        {
          error:
            'Meta update succeeded, but local row update failed: ' +
            dbErr.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, template: updated })
  } catch (error) {
    console.error('Error in template PATCH:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'Invalid template id.' },
        { status: 400 },
      )
    }

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

    const { data: existing, error: fetchErr } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .maybeSingle()
    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: 'Template not found.' },
        { status: 404 },
      )
    }

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    const connectionType = config?.connection_type ?? 'meta'

    // Delete Meta-side template only if connected via Meta and has meta_template_id
    if (
      connectionType === 'meta' &&
      !isDryRun() &&
      existing.meta_template_id &&
      config?.waba_id &&
      config?.access_token
    ) {
      const accessToken = decrypt(config.access_token)
      try {
        await deleteMessageTemplate({
          wabaId: config.waba_id,
          name: existing.name,
          accessToken,
          metaTemplateId: existing.meta_template_id,
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Meta delete failed.'
        return NextResponse.json(
          { error: `Meta delete failed: ${message}` },
          { status: 400 },
        )
      }
    }

    const { error: deleteErr } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json(
        { error: `Failed to delete local template: ${deleteErr.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in template DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 },
    )
  }
}
