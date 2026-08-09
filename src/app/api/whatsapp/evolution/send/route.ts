import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/whatsapp/encryption'
import {
  sendEvolutionTextMessage,
  sendEvolutionMediaMessage,
} from '@/lib/whatsapp/evolution-api'
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import {
  checkAccountUsageLimit,
  incrementAccountUsageCounter,
} from '@/lib/plans/check-usage-limit'

/**
 * POST /api/whatsapp/evolution/send
 *
 * Sends a message via Evolution API. Completely separate from
 * /api/whatsapp/send (Meta). Does NOT touch send-message.ts.
 *
 * Supported message_type values:
 *   'text'     — plain text
 *   'image'    — image (media_url required)
 *   'video'    — video (media_url required)
 *   'document' — document (media_url + optional filename)
 *   'audio'    — audio (media_url required)
 *
 * Body:
 *   { conversation_id, message_type, content_text?, media_url?, filename? }
 *
 * Response:
 *   { success: true, message_id: <our DB uuid>, whatsapp_message_id: <evolution id> }
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

    // Per-user rate limit (same budget as the Meta send route).
    const limit = checkRateLimit(`evolution-send:${user.id}`, RATE_LIMITS.send)
    if (!limit.success) {
      return rateLimitResponse(limit)
    }

    // Resolve account_id.
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
    const { conversation_id, message_type, content_text, media_url, filename } = body

    if (!conversation_id || !message_type) {
      return NextResponse.json(
        { error: 'conversation_id and message_type are required' },
        { status: 400 },
      )
    }

    // ── Validate message shape ────────────────────────────────
    const MEDIA_TYPES = ['image', 'video', 'document', 'audio'] as const
    type MediaType = (typeof MEDIA_TYPES)[number]
    const VALID_TYPES = ['text', ...MEDIA_TYPES]

    if (!VALID_TYPES.includes(message_type)) {
      return NextResponse.json(
        { error: `Unsupported message_type "${message_type}" for Evolution API` },
        { status: 400 },
      )
    }

    if (message_type === 'text' && !content_text?.trim()) {
      return NextResponse.json(
        { error: 'content_text is required for text messages' },
        { status: 400 },
      )
    }

    if (MEDIA_TYPES.includes(message_type as MediaType) && !media_url?.trim()) {
      return NextResponse.json(
        { error: `media_url is required for ${message_type} messages` },
        { status: 400 },
      )
    }

    // ── Load conversation + contact (account-scoped) ──────────
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', conversation_id)
      .eq('account_id', accountId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const contact = conversation.contact
    if (!contact?.phone) {
      return NextResponse.json(
        { error: 'Contact phone number not found' },
        { status: 400 },
      )
    }

    const phone = sanitizePhoneForMeta(contact.phone)
    if (!isValidE164(phone)) {
      return NextResponse.json(
        { error: 'Contact has an invalid phone number format' },
        { status: 400 },
      )
    }

    // ── Load Evolution config (account-scoped) ────────────────
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('connection_type, evolution_instance_name, evolution_api_key, status')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config || config.connection_type !== 'evolution') {
      return NextResponse.json(
        {
          error:
            'This account is not connected via Evolution API. ' +
            'Use /api/whatsapp/send for Meta connections.',
        },
        { status: 400 },
      )
    }

    if (config.status !== 'connected') {
      return NextResponse.json(
        { error: 'WhatsApp is not connected. Scan the QR code first.' },
        { status: 400 },
      )
    }

    if (!config.evolution_instance_name || !config.evolution_api_key) {
      return NextResponse.json(
        { error: 'Evolution instance is not initialized.' },
        { status: 400 },
      )
    }

    let instanceApiKey: string
    try {
      instanceApiKey = decrypt(config.evolution_api_key)
    } catch {
      return NextResponse.json(
        { error: 'Could not decrypt Evolution API key. Reset the connection.' },
        { status: 500 },
      )
    }

    // Check monthly plan message limit before sending (Outbound only)
    const limitCheck = await checkAccountUsageLimit(accountId, 'messages', 1)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason || 'تم الوصول للحد الأقصى للرسائل الشهرية المسموحة في خطتك الحالية' },
        { status: 429 }
      )
    }

    // ── Send via Evolution ────────────────────────────────────
    let evolutionMessageId: string
    try {
      if (message_type === 'text') {
        const result = await sendEvolutionTextMessage({
          instanceName: config.evolution_instance_name,
          instanceApiKey,
          to: phone,
          text: content_text.trim(),
        })
        evolutionMessageId = result.messageId
      } else {
        const result = await sendEvolutionMediaMessage({
          instanceName: config.evolution_instance_name,
          instanceApiKey,
          to: phone,
          mediatype: message_type as MediaType,
          media: media_url.trim(),
          caption: content_text?.trim() || undefined,
          fileName: filename?.trim() || undefined,
        })
        evolutionMessageId = result.messageId
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Evolution API error'
      console.error('[evolution/send POST] send failed:', message)
      return NextResponse.json(
        { error: `Failed to send message via Evolution: ${message}` },
        { status: 502 },
      )
    }

    // ── Persist the outbound message ──────────────────────────
    const now = new Date().toISOString()
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_type: 'agent',
        sender_id: user.id,
        content_type: message_type,
        content_text: content_text?.trim() ?? null,
        media_url: media_url?.trim() ?? null,
        message_id: evolutionMessageId || null,
        status: 'sent',
        created_at: now,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[evolution/send POST] message insert failed:', insertError)
      // The message was already sent — return success with a warning.
      return NextResponse.json({
        success: true,
        message_id: null,
        whatsapp_message_id: evolutionMessageId,
        warning: 'Message sent but could not be saved to the database.',
      })
    }

    // Update conversation last_message
    await supabase
      .from('conversations')
      .update({
        last_message_text: content_text?.trim() ?? `[${message_type}]`,
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', conversation_id)

    // Atomically increment monthly message counter
    await incrementAccountUsageCounter(accountId, 1, 0)

    return NextResponse.json({
      success: true,
      message_id: insertedMessage.id,
      whatsapp_message_id: evolutionMessageId,
    })
  } catch (error) {
    console.error('[evolution/send POST] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
