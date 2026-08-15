import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import { normalizeStatus } from '@/lib/whatsapp/template-status-normalize'
import type { TemplateButton, TemplateSampleValues } from '@/types'

const META_API_VERSION = 'v21.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaButton {
  type: string
  text: string
  url?: string
  phone_number?: string
  example?: string[] | string
}

interface MetaTemplateComponent {
  type: string
  text?: string
  format?: string
  buttons?: MetaButton[]
  example?: {
    header_text?: string[]
    header_handle?: string[]
    body_text?: string[][]
  }
}

interface MetaTemplate {
  id: string
  name: string
  language: string
  status: string
  category: string
  components?: MetaTemplateComponent[]
  quality_score?: { score?: string } | string
}

export async function POST() {
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

    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        {
          error:
            'WhatsApp not configured. Connect your WhatsApp Business account in Settings first.',
        },
        { status: 400 },
      )
    }

    const connectionType = config.connection_type ?? 'meta'

    if (connectionType === 'evolution') {
      return NextResponse.json({
        success: true,
        message: 'Sync from Meta is not applicable for Evolution API connections. Local templates are active directly.',
        syncedCount: 0,
      })
    }

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

    const metaTemplates: MetaTemplate[] = []
    let nextUrl:
      | string
      | null = `${META_API_BASE}/${config.waba_id}/message_templates?limit=100&fields=id,name,language,status,category,components,quality_score`
    const PAGE_CAP = 20
    let pageCount = 0

    while (nextUrl && pageCount < PAGE_CAP) {
      pageCount++
      const metaRes: Response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!metaRes.ok) {
        let metaErr = `Meta API error: ${metaRes.status}`
        try {
          const body = await metaRes.json()
          if (body?.error?.message) metaErr = body.error.message
        } catch {
          // response wasn't JSON — keep the fallback
        }
        return NextResponse.json({ error: metaErr }, { status: 400 })
      }

      const body = (await metaRes.json()) as {
        data?: MetaTemplate[]
        paging?: { next?: string }
      }
      if (Array.isArray(body.data)) {
        metaTemplates.push(...body.data)
      }
      nextUrl = body.paging?.next ?? null
    }

    const now = new Date().toISOString()
    const rowsToUpsert = metaTemplates.map((t) => {
      let headerType: string | null = null
      let headerContent: string | null = null
      let bodyText = ''
      let footerText: string | null = null
      let buttons: TemplateButton[] | null = null
      const sampleValues: TemplateSampleValues = {}

      for (const comp of t.components ?? []) {
        if (comp.type === 'HEADER') {
          headerType = (comp.format ?? 'text').toLowerCase()
          if (comp.format === 'TEXT' || !comp.format) {
            headerContent = comp.text ?? null
          }
          if (comp.example?.header_text && comp.example.header_text.length > 0) {
            sampleValues.header = comp.example.header_text
          }
        } else if (comp.type === 'BODY') {
          bodyText = comp.text ?? ''
          if (comp.example?.body_text && comp.example.body_text.length > 0) {
            sampleValues.body = comp.example.body_text[0]
          }
        } else if (comp.type === 'FOOTER') {
          footerText = comp.text ?? null
        } else if (comp.type === 'BUTTONS' && Array.isArray(comp.buttons)) {
          buttons = comp.buttons.map((b) => {
            if (b.type === 'QUICK_REPLY') {
              return { type: 'QUICK_REPLY', text: b.text }
            }
            if (b.type === 'URL') {
              const exVal = Array.isArray(b.example) ? b.example[0] : b.example
              const btn: TemplateButton = {
                type: 'URL',
                text: b.text,
                url: b.url ?? '',
                ...(exVal ? { example: exVal } : {}),
              }
              return btn
            }
            if (b.type === 'PHONE_NUMBER') {
              return {
                type: 'PHONE_NUMBER',
                text: b.text,
                phone_number: b.phone_number ?? '',
              }
            }
            return { type: 'QUICK_REPLY', text: b.text }
          })
        }
      }

      return {
        account_id: accountId,
        user_id: user.id,
        name: t.name,
        category: t.category,
        language: t.language,
        header_type: headerType,
        header_content: headerContent,
        body_text: bodyText,
        footer_text: footerText,
        buttons,
        sample_values: Object.keys(sampleValues).length > 0 ? sampleValues : null,
        status: normalizeStatus(t.status),
        meta_template_id: t.id,
        submission_error: null,
        updated_at: now,
      }
    })

    const BATCH_SIZE = 100
    for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
      const batch = rowsToUpsert.slice(i, i + BATCH_SIZE)
      const { error: upsertError } = await supabase
        .from('message_templates')
        .upsert(batch, { onConflict: 'account_id,name,language' })

      if (upsertError) {
        console.error('[templates/sync POST] Batch upsert error:', upsertError)
        return NextResponse.json(
          { error: `Database error during sync: ${upsertError.message}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: rowsToUpsert.length,
    })
  } catch (error) {
    console.error('Error in templates sync POST:', error)
    return NextResponse.json(
      { error: 'Failed to sync templates from Meta' },
      { status: 500 },
    )
  }
}
