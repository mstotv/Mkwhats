import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api'
import {
  sendEvolutionTextMessage,
} from '@/lib/whatsapp/evolution-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import type { SendTimeParams } from '@/lib/whatsapp/template-send-builder'
import { isMessageTemplate } from '@/lib/whatsapp/template-row-guard'
import {
  sanitizePhoneForMeta,
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
} from '@/lib/whatsapp/phone-utils'
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import {
  checkAccountUsageLimit,
  incrementAccountUsageCounter,
} from '@/lib/plans/check-usage-limit'

interface BroadcastResult {
  phone: string
  status: 'sent' | 'failed'
  whatsapp_message_id?: string
  error?: string
}

/**
 * Two connection paths are supported:
 *
 *   META (default — WhatsApp Business Cloud API):
 *     Requires template_name + template_language (approved Meta templates).
 *     Supports per-recipient variable substitution via `recipients[].params`
 *     and structured `messageParams` for media headers / URL buttons.
 *
 *   EVOLUTION (personal WhatsApp via Evolution API):
 *     Sends a plain-text message — no templates required or supported.
 *     Requires `free_text` instead of `template_name`.
 *     Per-recipient Personalization: `recipients[].text` overrides the
 *     global `free_text` for that specific recipient if supplied.
 *
 * Both paths share the same plan-limit checks and produce the same
 * BroadcastResult shape so callers don't need to branch on connection type.
 *
 * Input shapes:
 *
 *   NEW (preferred — per-recipient variable substitution for Meta):
 *     {
 *       recipients: Array<{ phone: string; params?: string[]; messageParams?: SendTimeParams; text?: string }>,
 *       template_name, template_language   ← Meta
 *       free_text                          ← Evolution
 *     }
 *
 *   LEGACY (all phones get same params — kept for backward compat):
 *     {
 *       phone_numbers: string[],
 *       template_params: string[],
 *       template_name, template_language
 *     }
 */
interface NewRecipient {
  phone: string
  /** Body variable values for Meta template {{N}} placeholders. */
  params?: string[]
  /**
   * Structured per-send values (header text, media URL, button values).
   * Takes precedence over `params` for Meta sends.
   */
  messageParams?: SendTimeParams
  /**
   * Per-recipient text override for Evolution sends.
   * When set, replaces the global `free_text` for this recipient only.
   */
  text?: string
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

    // Per-user broadcast budget — limits how often a user can *start* a
    // campaign, not how many messages go out inside one.
    const limit = checkRateLimit(`broadcast:${user.id}`, RATE_LIMITS.broadcast)
    if (!limit.success) {
      return rateLimitResponse(limit)
    }

    // Resolve account_id (multi-tenant: whatsapp_config + templates +
    // broadcasts are account-scoped, not user-scoped).
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
    const {
      recipients: newRecipients,
      phone_numbers,
      template_name,
      template_language,
      template_params,
      free_text,
    } = body

    // Normalize to a list of {phone, params?, text?} regardless of shape.
    let recipients: NewRecipient[]
    if (Array.isArray(newRecipients) && newRecipients.length > 0) {
      recipients = newRecipients
    } else if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      const shared: string[] = Array.isArray(template_params)
        ? template_params
        : []
      recipients = phone_numbers.map((phone: string) => ({
        phone,
        params: shared,
      }))
    } else {
      return NextResponse.json(
        {
          error:
            'Provide either `recipients` (preferred) or `phone_numbers` — must be a non-empty array',
        },
        { status: 400 },
      )
    }

    // ── Load WhatsApp config (determines which path to take) ──────────
    const { data: config, error: configError } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        {
          error:
            'WhatsApp not configured. Please set up your WhatsApp integration first.',
        },
        { status: 400 },
      )
    }

    const connectionType: string = config.connection_type ?? 'meta'

    // ── Validate required fields per connection type ──────────────────
    if (connectionType === 'evolution') {
      if (!free_text?.trim()) {
        return NextResponse.json(
          { error: '`free_text` is required for Evolution broadcasts' },
          { status: 400 },
        )
      }
      if (!config.evolution_instance_name || !config.evolution_api_key) {
        return NextResponse.json(
          { error: 'Evolution API is not fully configured for this account.' },
          { status: 400 },
        )
      }
    } else {
      // Meta path
      if (!template_name) {
        return NextResponse.json(
          { error: 'template_name is required' },
          { status: 400 },
        )
      }
    }

    // ── Plan limit checks (apply equally to both paths) ───────────────
    const broadcastLimitCheck = await checkAccountUsageLimit(accountId, 'broadcasts', 1)
    if (!broadcastLimitCheck.allowed) {
      return NextResponse.json(
        { error: broadcastLimitCheck.reason || 'تم الوصول للحد الأقصى لعدد الحملات الشهرية' },
        { status: 429 },
      )
    }

    const messagesLimitCheck = await checkAccountUsageLimit(
      accountId,
      'messages',
      recipients.length,
    )
    if (!messagesLimitCheck.allowed) {
      return NextResponse.json(
        { error: messagesLimitCheck.reason || 'عدد المستلمين للحملة يتجاوز الرصيد المتبقي للرسائل الشهرية' },
        { status: 429 },
      )
    }

    const results: BroadcastResult[] = []
    let sentCount = 0
    let failedCount = 0

    // ══════════════════════════════════════════════════════════════════
    // EVOLUTION PATH — plain text, no templates
    // ══════════════════════════════════════════════════════════════════
    if (connectionType === 'evolution') {
      let instanceApiKey: string
      try {
        instanceApiKey = decrypt(config.evolution_api_key)
      } catch {
        return NextResponse.json(
          { error: 'Could not decrypt Evolution API key. Reset the connection.' },
          { status: 500 },
        )
      }

      for (const recipient of recipients) {
        // Evolution normalizes to digits-only internally, but we still
        // validate E.164 so clearly-invalid numbers are caught early.
        const sanitized = sanitizePhoneForMeta(recipient.phone)
        if (!isValidE164(sanitized)) {
          results.push({
            phone: recipient.phone,
            status: 'failed',
            error: 'Invalid phone number format',
          })
          failedCount++
          continue
        }

        // Per-recipient text override lets callers personalize each message.
        const messageText = (recipient.text ?? free_text).trim()

        try {
          const result = await sendEvolutionTextMessage({
            instanceName: config.evolution_instance_name,
            instanceApiKey,
            to: sanitized,
            text: messageText,
          })
          results.push({
            phone: recipient.phone,
            status: 'sent',
            whatsapp_message_id: result.messageId,
          })
          sentCount++
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown Evolution API error'
          console.error(
            `[broadcast/evolution] Failed to send to ${recipient.phone}:`,
            errorMessage,
          )
          results.push({
            phone: recipient.phone,
            status: 'failed',
            error: errorMessage,
          })
          failedCount++
        }
      }
    } else {
      // ════════════════════════════════════════════════════════════════
      // META PATH — approved templates (original behaviour, unchanged)
      // ════════════════════════════════════════════════════════════════
      const accessToken = decrypt(config.access_token)

      // Load the template row once so sendTemplateMessage can build
      // header + button components. Loading inside the loop would N+1
      // against Supabase for every recipient.
      const { data: rawTemplateRow } = await supabase
        .from('message_templates')
        .select('*')
        .eq('account_id', accountId)
        .eq('name', template_name)
        .eq('language', template_language || 'en_US')
        .maybeSingle()
      if (rawTemplateRow && !isMessageTemplate(rawTemplateRow)) {
        return NextResponse.json(
          {
            error:
              'Template row is malformed locally — run "Sync from Meta" in Settings to repair it before broadcasting.',
          },
          { status: 500 },
        )
      }
      const templateRow = rawTemplateRow ?? null

      for (const recipient of recipients) {
        const sanitized = sanitizePhoneForMeta(recipient.phone)

        if (!isValidE164(sanitized)) {
          results.push({
            phone: recipient.phone,
            status: 'failed',
            error: 'Invalid phone number format',
          })
          failedCount++
          continue
        }

        // Retry with phone variants on "recipient not in allowed list"
        // so numbers that differ only in a trunk-prefix 0 still reach.
        const variants = phoneVariants(sanitized)
        let sentMessageId: string | null = null
        let lastError: string | null = null

        for (const variant of variants) {
          try {
            const result = await sendTemplateMessage({
              phoneNumberId: config.phone_number_id,
              accessToken,
              to: variant,
              templateName: template_name,
              language: template_language || 'en_US',
              template: templateRow ?? undefined,
              messageParams: recipient.messageParams,
              params: recipient.params ?? [],
            })
            sentMessageId = result.messageId
            lastError = null
            break
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'
            if (!isRecipientNotAllowedError(errorMessage)) {
              lastError = errorMessage
              break
            }
            lastError = errorMessage
            // retry with next variant
          }
        }

        if (sentMessageId) {
          results.push({
            phone: recipient.phone,
            status: 'sent',
            whatsapp_message_id: sentMessageId,
          })
          sentCount++
        } else {
          console.error(
            `[broadcast/meta] Failed to send to ${recipient.phone}:`,
            lastError,
          )
          results.push({
            phone: recipient.phone,
            status: 'failed',
            error: lastError || 'Unknown error',
          })
          failedCount++
        }
      }
    }

    // Atomically increment monthly counters (+1 broadcast, +sentCount messages)
    await incrementAccountUsageCounter(accountId, sentCount, 1)

    return NextResponse.json({
      success: true,
      connection_type: connectionType,
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      results,
    })
  } catch (error) {
    console.error('Error in WhatsApp broadcast POST:', error)
    return NextResponse.json(
      { error: 'Failed to process broadcast' },
      { status: 500 },
    )
  }
}
