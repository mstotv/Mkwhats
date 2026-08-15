import { NextResponse, after } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/whatsapp/encryption'
import { normalizePhone } from '@/lib/whatsapp/phone-utils'
import { findExistingContact, isUniqueViolation } from '@/lib/contacts/dedupe'
import { runAutomationsForTrigger } from '@/lib/automations/engine'
import { dispatchInboundToFlows } from '@/lib/flows/engine'
import { dispatchInboundToAiReply } from '@/lib/ai/auto-reply'
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver'
import {
  type EvolutionWebhookPayload,
  type EvolutionConnectionUpdateData,
  type EvolutionInboundMessage,
  fetchEvolutionProfilePictureUrl,
} from '@/lib/whatsapp/evolution-api'

// Same max-duration approach as the Meta webhook — Evolution events
// can fan out to automations/AI, so give the after() callback headroom.
export const maxDuration = 60

// Lazy-initialized service-role client (same pattern as Meta webhook).
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
 * POST /api/whatsapp/evolution/webhook
 *
 * Receives events from the Evolution API server.
 * Completely separate from /api/whatsapp/webhook (Meta).
 *
 * Handled events:
 *   QRCODE_UPDATED      — QR refreshed; no DB write needed (UI polls /qr)
 *   CONNECTION_UPDATE   — phone connected / disconnected
 *   MESSAGES_UPSERT     — inbound message from a customer
 *   MESSAGES_UPDATE     — outbound message delivery status update
 *
 * Security: Evolution sends its global API key in the `apikey` header.
 * We compare it to EVOLUTION_GLOBAL_API_KEY so only our own server
 * can POST events here.
 */
export async function POST(request: Request) {
  let body: EvolutionWebhookPayload
  try {
    body = (await request.json()) as EvolutionWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const incomingKey =
    request.headers.get('apikey') ||
    request.headers.get('api-key') ||
    request.headers.get('token') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''

  const expectedGlobalKey = process.env.EVOLUTION_GLOBAL_API_KEY ?? ''
  const instanceName = body.instance || (body as any).instanceName || (body as any).instance_name

  let authorized = false

  if (expectedGlobalKey && incomingKey === expectedGlobalKey) {
    authorized = true
  } else if (instanceName) {
    // Authorize if instanceName matches an active Evolution row in our DB
    const { data: validConfig } = await supabaseAdmin()
      .from('whatsapp_config')
      .select('id')
      .eq('evolution_instance_name', instanceName)
      .eq('connection_type', 'evolution')
      .maybeSingle()

    if (validConfig) {
      authorized = true
    }
  }

  if (!authorized) {
    console.warn('[evolution/webhook] rejected: unauthorized request for instance:', instanceName)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ack immediately; process in after()
  after(async () => {
    try {
      await processEvolutionEvent(body)
    } catch (err) {
      console.error('[evolution/webhook] processEvolutionEvent threw:', err)
    }
  })

  return NextResponse.json({ status: 'received' }, { status: 200 })
}

// ─── Event router ─────────────────────────────────────────────

async function processEvolutionEvent(body: EvolutionWebhookPayload) {
  const rawEvent = (body.event || (body as any).type || '').toString()
  const event = rawEvent.toUpperCase().replace(/\./g, '_')
  const instanceName = body.instance || (body as any).instanceName || (body as any).instance_name
  const data = body.data

  if (!instanceName) {
    console.warn('[evolution/webhook] event missing instance name; skipping')
    return
  }

  // Resolve the account_id from the instance name
  const { data: configRow, error: configError } = await supabaseAdmin()
    .from('whatsapp_config')
    .select('account_id, user_id, status, evolution_instance_name')
    .eq('evolution_instance_name', instanceName)
    .eq('connection_type', 'evolution')
    .maybeSingle()

  if (configError) {
    console.error('[evolution/webhook] DB lookup failed:', configError)
    return
  }

  if (!configRow) {
    console.warn(
      `[evolution/webhook] no config found for instance "${instanceName}"; event dropped.`
    )
    return
  }

  const accountId: string = configRow.account_id
  const configOwnerUserId: string = configRow.user_id

  switch (event) {
    case 'QRCODE_UPDATED':
      break

    case 'CONNECTION_UPDATE':
      await handleConnectionUpdate(accountId, data as unknown as EvolutionConnectionUpdateData)
      break

    case 'MESSAGES_UPSERT':
    case 'MESSAGES_SET':
    case 'SEND_MESSAGE': {
      let messageList: EvolutionInboundMessage[] = []
      const rawMsgs = (data as any)?.messages ?? (data as any)?.data?.messages ?? data

      if (Array.isArray(rawMsgs)) {
        messageList = rawMsgs
      } else if (rawMsgs && typeof rawMsgs === 'object' && ((rawMsgs as any).key || (rawMsgs as any).message)) {
        messageList = [rawMsgs as EvolutionInboundMessage]
      }

      for (const msg of messageList) {
        if (!msg) continue
        // Skip messages sent by us (fromMe = true).
        if (msg.key?.fromMe) continue
        await processInboundMessage(
          msg,
          accountId,
          configOwnerUserId,
          configRow.evolution_instance_name,
          configRow.evolution_api_key,
        )
      }
      break
    }

    case 'MESSAGES_UPDATE': {
      const updates = (data as { updates?: Array<{ key: { id: string }; update: { status?: string } }> }).updates
      if (!Array.isArray(updates)) break
      for (const upd of updates) {
        if (upd.key?.id && upd.update?.status) {
          await handleMessageStatusUpdate(accountId, upd.key.id, upd.update.status)
        }
      }
      break
    }

    default:
      // Unknown events are silently ignored to stay forward-compatible.
      break
  }
}

// ─── CONNECTION_UPDATE ────────────────────────────────────────

async function handleConnectionUpdate(
  accountId: string,
  data: EvolutionConnectionUpdateData,
) {
  const state = (data.state ?? '').toLowerCase()

  if (state === 'open') {
    // Extract the phone number from the wuid field.
    // Evolution's wuid format: "5511999998888" (no + or @).
    const rawPhone = data.wuid ?? null
    const phone = rawPhone ? `+${rawPhone.replace('@s.whatsapp.net', '')}` : null

    const { error } = await supabaseAdmin()
      .from('whatsapp_config')
      .update({
        status: 'connected',
        connected_at: new Date().toISOString(),
        ...(phone ? { evolution_connected_phone: phone } : {}),
      })
      .eq('account_id', accountId)
      .eq('connection_type', 'evolution')

    if (error) {
      console.error('[evolution/webhook] CONNECTION_UPDATE open — DB update failed:', error)
    }
  } else if (state === 'close' || state === 'refused') {
    const { error } = await supabaseAdmin()
      .from('whatsapp_config')
      .update({ status: 'disconnected' })
      .eq('account_id', accountId)
      .eq('connection_type', 'evolution')

    if (error) {
      console.error('[evolution/webhook] CONNECTION_UPDATE close — DB update failed:', error)
    }
  }
  // 'connecting' state — no DB update needed, status stays as-is.
}

// ─── MESSAGES_UPSERT (inbound) ────────────────────────────────

async function processInboundMessage(
  msg: EvolutionInboundMessage,
  accountId: string,
  configOwnerUserId: string,
  instanceName?: string,
  instanceApiKey?: string,
) {
  // Extract sender phone from remoteJid ("5511999998888@s.whatsapp.net")
  const rawJid = msg.key?.remoteJid ?? ''
  const rawPhone = rawJid.split('@')[0]
  if (!rawPhone) {
    console.warn('[evolution/webhook] inbound message has no remoteJid; skipping')
    return
  }

  const senderPhone = normalizePhone(`+${rawPhone}`)
  const contactName = msg.pushName ?? ''
  const whatsappMessageId = msg.key?.id ?? null

  // Extract message content
  const { contentType, contentText, mediaUrl } = extractMessageContent(msg)

  // ── Find or create contact ────────────────────────────────
  const contactOutcome = await findOrCreateEvolutionContact(
    accountId,
    configOwnerUserId,
    senderPhone,
    contactName,
    instanceName,
    instanceApiKey,
  )
  if (!contactOutcome) return
  const contactRecord = contactOutcome.contact

  // ── Find or create conversation ───────────────────────────
  const convResult = await findOrCreateEvolutionConversation(
    accountId,
    configOwnerUserId,
    contactRecord.id,
  )
  if (!convResult) return
  const conversation = convResult.conversation

  // Dispatch conversation.created event (before message insert).
  if (convResult.created) {
    await dispatchWebhookEvent(supabaseAdmin(), accountId, 'conversation.created', {
      conversation_id: conversation.id,
      contact_id: contactRecord.id,
    })
  }

  // ── Persist the inbound message ───────────────────────────
  const messageTs = msg.messageTimestamp
    ? new Date(msg.messageTimestamp * 1000).toISOString()
    : new Date().toISOString()

  const { data: insertedMessage, error: msgInsertError } = await supabaseAdmin()
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_id: contactRecord.id,
      content_type: contentType,
      content_text: contentText ?? null,
      media_url: mediaUrl ?? null,
      message_id: whatsappMessageId,
      status: 'delivered',
      created_at: messageTs,
    })
    .select('id')
    .single()

  if (msgInsertError) {
    // Duplicate wamid — already processed (webhook retry). Safe to skip.
    if (isUniqueViolation(msgInsertError)) return
    console.error('[evolution/webhook] message insert failed:', msgInsertError)
    return
  }

  // ── Update conversation last_message ──────────────────────
  await supabaseAdmin()
    .from('conversations')
    .update({
      last_message_text: contentText ?? `[${contentType}]`,
      last_message_at: messageTs,
      status: 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id)

  // ── Fan-out: webhooks, automations, flows, AI ─────────────
  console.log('[DIAG][evolution/webhook] ▶ fan-out start | conv:', conversation.id, '| contentText:', JSON.stringify(contentText?.slice(0, 80)))

  await dispatchWebhookEvent(supabaseAdmin(), accountId, 'message.received', {
    message_id: insertedMessage.id,
    conversation_id: conversation.id,
    contact_id: contactRecord.id,
    content_type: contentType,
    content_text: contentText ?? null,
  })

  console.log('[DIAG][evolution/webhook] runAutomationsForTrigger → calling...')
  try {
    await runAutomationsForTrigger({
      accountId,
      triggerType: 'new_message_received',
      contactId: contactRecord.id,
      context: {
        message_text: contentText ?? '',
        conversation_id: conversation.id,
      },
    })
    console.log('[DIAG][evolution/webhook] runAutomationsForTrigger → done')
  } catch (err) {
    console.error('[evolution/webhook] automations engine error:', err)
  }

  let flowConsumed = false
  console.log('[DIAG][evolution/webhook] dispatchInboundToFlows → calling...')
  try {
    const flowResult = await dispatchInboundToFlows({
      accountId,
      userId: configOwnerUserId,
      contactId: contactRecord.id,
      conversationId: conversation.id,
      message: {
        kind: 'text',
        text: contentText ?? '',
        meta_message_id: whatsappMessageId ?? undefined,
      },
      isFirstInboundMessage: contactOutcome.wasCreated,
    })
    flowConsumed = flowResult.consumed
    console.log('[DIAG][evolution/webhook] dispatchInboundToFlows → done | consumed:', flowConsumed)
  } catch (err) {
    console.error('[evolution/webhook] flows engine error:', err)
  }

  console.log('[DIAG][evolution/webhook] AI gate check | flowConsumed:', flowConsumed, '| contentText?.trim():', JSON.stringify(contentText?.trim()?.slice(0, 40)))

  if (!flowConsumed && contentText?.trim()) {
    console.log('[DIAG][evolution/webhook] dispatchInboundToAiReply → calling... | accountId:', accountId, 'conversationId:', conversation.id)
    try {
      await dispatchInboundToAiReply({
        accountId,
        conversationId: conversation.id,
        contactId: contactRecord.id,
        configOwnerUserId,
      })
      console.log('[DIAG][evolution/webhook] dispatchInboundToAiReply → returned (no throw)')
    } catch (err) {
      console.error('[evolution/webhook] AI auto-reply error:', err)
    }
  } else {
    console.log('[DIAG][evolution/webhook] ⚠ AI auto-reply SKIPPED | reason:', flowConsumed ? 'flow consumed' : 'no text content')
  }
}

// ─── MESSAGES_UPDATE (delivery status) ───────────────────────

async function handleMessageStatusUpdate(
  accountId: string,
  whatsappMessageId: string,
  rawStatus: string,
) {
  // Map Evolution status strings to our messages.status CHECK constraint.
  const STATUS_MAP: Record<string, string> = {
    PENDING: 'sending',
    SERVER_ACK: 'sent',
    DELIVERY_ACK: 'delivered',
    READ: 'read',
    PLAYED: 'read',
  }
  const mappedStatus = STATUS_MAP[rawStatus.toUpperCase()]
  if (!mappedStatus) return

  await supabaseAdmin()
    .from('messages')
    .update({ status: mappedStatus })
    .eq('message_id', whatsappMessageId)
}

// ─── Helpers ──────────────────────────────────────────────────

function extractMessageContent(msg: EvolutionInboundMessage): {
  contentType: string
  contentText: string | null
  mediaUrl: string | null
} {
  const m = msg.message
  if (!m) return { contentType: 'text', contentText: null, mediaUrl: null }

  if (m.conversation)
    return { contentType: 'text', contentText: m.conversation, mediaUrl: null }

  if (m.extendedTextMessage?.text)
    return { contentType: 'text', contentText: m.extendedTextMessage.text, mediaUrl: null }

  if (m.imageMessage)
    return {
      contentType: 'image',
      contentText: m.imageMessage.caption ?? null,
      mediaUrl: m.imageMessage.url ?? null,
    }

  if (m.videoMessage)
    return {
      contentType: 'video',
      contentText: m.videoMessage.caption ?? null,
      mediaUrl: m.videoMessage.url ?? null,
    }

  if (m.documentMessage)
    return {
      contentType: 'document',
      contentText: m.documentMessage.fileName ?? null,
      mediaUrl: m.documentMessage.url ?? null,
    }

  if (m.audioMessage)
    return { contentType: 'audio', contentText: null, mediaUrl: m.audioMessage.url ?? null }

  if (m.locationMessage)
    return {
      contentType: 'location',
      contentText: `${m.locationMessage.degreesLatitude ?? 0},${m.locationMessage.degreesLongitude ?? 0}`,
      mediaUrl: null,
    }

  return { contentType: 'text', contentText: null, mediaUrl: null }
}

async function findOrCreateEvolutionContact(
  accountId: string,
  userId: string,
  phone: string,
  name: string,
  instanceName?: string,
  instanceApiKey?: string,
) {
  try {
    const existing = await findExistingContact(supabaseAdmin(), accountId, phone)
    if (existing) {
      if (!existing.avatar_url && instanceName && instanceApiKey) {
        fetchEvolutionProfilePictureUrl({
          instanceName,
          instanceApiKey,
          number: phone,
        }).then((url) => {
          if (url) {
            supabaseAdmin()
              .from('contacts')
              .update({ avatar_url: url })
              .eq('id', existing.id)
              .then(() => {})
          }
        }).catch(() => {})
      }
      return { contact: existing, wasCreated: false }
    }

    let avatarUrl: string | null = null
    if (instanceName && instanceApiKey) {
      avatarUrl = await fetchEvolutionProfilePictureUrl({
        instanceName,
        instanceApiKey,
        number: phone,
      })
    }

    const { data: created, error } = await supabaseAdmin()
      .from('contacts')
      .insert({
        account_id: accountId,
        user_id: userId,
        phone,
        name: name || phone,
        avatar_url: avatarUrl,
      })
      .select()
      .single()

    if (error) {
      if (isUniqueViolation(error)) {
        const retry = await findExistingContact(supabaseAdmin(), accountId, phone)
        if (retry) return { contact: retry, wasCreated: false }
      }
      console.error('[evolution/webhook] contact insert failed:', error)
      return null
    }

    return { contact: created, wasCreated: true }
  } catch (err) {
    console.error('[evolution/webhook] findOrCreateEvolutionContact error:', err)
    return null
  }
}

async function findOrCreateEvolutionConversation(
  accountId: string,
  userId: string,
  contactId: string,
) {
  try {
    const { data: existing } = await supabaseAdmin()
      .from('conversations')
      .select('*')
      .eq('account_id', accountId)
      .eq('contact_id', contactId)
      .maybeSingle()

    if (existing) return { conversation: existing, created: false }

    const { data: created, error } = await supabaseAdmin()
      .from('conversations')
      .insert({ account_id: accountId, user_id: userId, contact_id: contactId })
      .select()
      .single()

    if (error) {
      if (isUniqueViolation(error)) {
        const { data: retry } = await supabaseAdmin()
          .from('conversations')
          .select('*')
          .eq('account_id', accountId)
          .eq('contact_id', contactId)
          .maybeSingle()
        if (retry) return { conversation: retry, created: false }
      }
      console.error('[evolution/webhook] conversation insert failed:', error)
      return null
    }

    return { conversation: created, created: true }
  } catch (err) {
    console.error('[evolution/webhook] findOrCreateEvolutionConversation error:', err)
    return null
  }
}
