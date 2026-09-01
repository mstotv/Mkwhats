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
  fetchEvolutionMediaBase64,
} from '@/lib/whatsapp/evolution-api'
import { transcribeAudioMessage } from '@/lib/ai/voice/stt'
import { loadAiConfig } from '@/lib/ai/config'
import { checkAccountFeature } from '@/lib/plans/check-usage-limit'

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

  if (expectedGlobalKey && incomingKey && incomingKey === expectedGlobalKey) {
    authorized = true
  } else if (instanceName) {
    try {
      const { data: validConfig } = await supabaseAdmin()
        .from('whatsapp_config')
        .select('id, evolution_api_key')
        .eq('evolution_instance_name', instanceName)
        .eq('connection_type', 'evolution')
        .maybeSingle()

      if (validConfig) {
        if (!incomingKey) {
          // Evolution v2 webhook delivers without custom headers by default
          authorized = true
        } else if (validConfig.evolution_api_key) {
          let instanceApiKey = validConfig.evolution_api_key
          try {
            instanceApiKey = decrypt(validConfig.evolution_api_key)
          } catch {}
          if (instanceApiKey === incomingKey || incomingKey === expectedGlobalKey) {
            authorized = true
          }
        }
      }
    } catch (authErr) {
      console.error('[evolution/webhook] Error verifying instance key:', authErr)
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
    .select('account_id, user_id, status, evolution_instance_name, evolution_api_key')
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
  let instanceApiKey = configRow.evolution_api_key
  if (instanceApiKey) {
    try {
      instanceApiKey = decrypt(instanceApiKey)
    } catch {
      // ignore decryption errors if unencrypted or invalid
    }
  }

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
        console.log('[DIAG][evolution/webhook] Received message event | fromMe:', msg.key?.fromMe, '| id:', msg.key?.id, '| remoteJid:', msg.key?.remoteJid)
        await processInboundMessage(
          msg,
          accountId,
          configOwnerUserId,
          configRow.evolution_instance_name,
          instanceApiKey,
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

// ─── MESSAGES_UPSERT (inbound & fromMe) ────────────────────────

async function processInboundMessage(
  msg: EvolutionInboundMessage,
  accountId: string,
  configOwnerUserId: string,
  instanceName?: string,
  instanceApiKey?: string,
) {
  const isFromMe = Boolean(msg.key?.fromMe)

  // Extract sender/recipient phone from remoteJid ("5511999998888@s.whatsapp.net")
  const rawJid = msg.key?.remoteJid ?? ''
  const rawPhone = rawJid.split('@')[0]
  if (!rawPhone) {
    console.warn('[evolution/webhook] message has no remoteJid; skipping')
    return
  }

  const senderPhone = normalizePhone(`+${rawPhone}`)
  const contactName = isFromMe ? '' : (msg.pushName ?? '')
  const whatsappMessageId = msg.key?.id ?? null

  console.log('[DIAG][evolution/webhook] processInboundMessage | isFromMe:', isFromMe, '| phone:', senderPhone, '| msgId:', whatsappMessageId)

  // Extract and process media (uploads to Supabase Storage if base64/media present)
  const { contentType, contentText, mediaUrl, transcribedText } = await extractAndProcessMedia(
    msg,
    accountId,
    instanceName,
    instanceApiKey
  )

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

  const messageTs = msg.messageTimestamp
    ? new Date(msg.messageTimestamp * 1000).toISOString()
    : new Date().toISOString()

  // ── Handle outbound message from phone (fromMe = true) ─────
  if (isFromMe) {
    if (whatsappMessageId) {
      const { data: existingMsg } = await supabaseAdmin()
        .from('messages')
        .select('id')
        .eq('message_id', whatsappMessageId)
        .maybeSingle()

      if (existingMsg) {
        console.log('[DIAG][evolution/webhook] Outbound message (fromMe: true) already exists in DB; skipping insert. msgId:', whatsappMessageId)
        return
      }
    }

    const { error: msgInsertError } = await supabaseAdmin()
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'agent',
        sender_id: configOwnerUserId,
        content_type: contentType,
        content_text: contentText ?? null,
        media_url: mediaUrl ?? null,
        message_id: whatsappMessageId,
        status: 'delivered',
        created_at: messageTs,
      })

    if (msgInsertError) {
      if (isUniqueViolation(msgInsertError)) return
      console.error('[evolution/webhook] fromMe message insert failed:', msgInsertError)
      return
    }

    console.log('[DIAG][evolution/webhook] Successfully saved outbound fromMe message | conv:', conversation.id, '| contentText:', contentText?.slice(0, 40))

    await supabaseAdmin()
      .from('conversations')
      .update({
        last_message_text: contentText ?? `[${contentType}]`,
        last_message_at: messageTs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    // Skip automations/flows/AI for fromMe messages
    return
  }

  // ── Persist inbound customer message ──────────────────────
  const { data: insertedMessage, error: msgInsertError } = await supabaseAdmin()
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      sender_id: contactRecord.id,
      content_type: contentType,
      content_text: contentText ?? null,
      transcribed_text: transcribedText ?? null,
      media_url: mediaUrl ?? null,
      message_id: whatsappMessageId,
      status: 'delivered',
      created_at: messageTs,
    })
    .select('id')
    .single()

  if (msgInsertError) {
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
      unread_count: (conversation.unread_count || 0) + 1,
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

// ─── Media Extraction & Processing ─────────────────────────────

async function extractAndProcessMedia(
  msg: EvolutionInboundMessage,
  accountId: string,
  instanceName?: string,
  instanceApiKey?: string,
): Promise<{
  contentType: string
  contentText: string | null
  transcribedText?: string | null
  mediaUrl: string | null
}> {
  const m = msg.message
  if (!m) return { contentType: 'text', contentText: null, transcribedText: null, mediaUrl: null }

  if (m.conversation)
    return { contentType: 'text', contentText: m.conversation, transcribedText: null, mediaUrl: null }

  if (m.extendedTextMessage?.text)
    return { contentType: 'text', contentText: m.extendedTextMessage.text, transcribedText: null, mediaUrl: null }

  let mediaType: 'image' | 'video' | 'document' | 'audio' | null = null
  let caption: string | null = null
  let fileName: string | null = null
  let directUrl: string | null = null
  let mimetype: string | null = null
  let payloadBase64: string | null = null

  if (m.imageMessage) {
    mediaType = 'image'
    caption = m.imageMessage.caption ?? null
    directUrl = m.imageMessage.url ?? null
    mimetype = m.imageMessage.mimetype ?? 'image/jpeg'
    payloadBase64 = (m.imageMessage as any).base64 ?? (m as any).base64 ?? null
  } else if (m.videoMessage) {
    mediaType = 'video'
    caption = m.videoMessage.caption ?? null
    directUrl = m.videoMessage.url ?? null
    mimetype = m.videoMessage.mimetype ?? 'video/mp4'
    payloadBase64 = (m.videoMessage as any).base64 ?? (m as any).base64 ?? null
  } else if (m.documentMessage) {
    mediaType = 'document'
    caption = m.documentMessage.fileName ?? null
    fileName = m.documentMessage.fileName ?? null
    directUrl = m.documentMessage.url ?? null
    mimetype = m.documentMessage.mimetype ?? 'application/pdf'
    payloadBase64 = (m.documentMessage as any).base64 ?? (m as any).base64 ?? null
  } else if (m.audioMessage) {
    mediaType = 'audio'
    directUrl = m.audioMessage.url ?? null
    mimetype = m.audioMessage.mimetype ?? 'audio/ogg'
    payloadBase64 = (m.audioMessage as any).base64 ?? (m as any).base64 ?? null
  } else if (m.locationMessage) {
    return {
      contentType: 'location',
      contentText: `${m.locationMessage.degreesLatitude ?? 0},${m.locationMessage.degreesLongitude ?? 0}`,
      mediaUrl: null,
    }
  }

  if (!mediaType) {
    return { contentType: 'text', contentText: null, mediaUrl: null }
  }

  console.log(`[DIAG][evolution/webhook] Media message detected | type: ${mediaType} | directUrl: ${directUrl?.slice(0, 60)} | payloadHasBase64: ${Boolean(payloadBase64)}`)

  let base64Data = payloadBase64
  if (!base64Data && instanceName && instanceApiKey && msg.key) {
    console.log('[DIAG][evolution/webhook] Fetching media base64 from Evolution API...')
    const res = await fetchEvolutionMediaBase64({
      instanceName,
      instanceApiKey,
      messageKey: msg.key,
      message: m as Record<string, unknown>,
    })
    if (res?.base64) {
      base64Data = res.base64
      if (res.mimetype) mimetype = res.mimetype
      console.log('[DIAG][evolution/webhook] Successfully fetched media base64 | length:', base64Data.length)
    } else {
      console.warn('[DIAG][evolution/webhook] Could not retrieve base64 for media message')
    }
  }

  let finalMediaUrl: string | null = directUrl

  if (base64Data) {
    try {
      let cleanBase64 = base64Data
      const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.*)$/)
      if (dataUriMatch) {
        mimetype = dataUriMatch[1]
        cleanBase64 = dataUriMatch[2]
      }

      const buffer = Buffer.from(cleanBase64, 'base64')
      const ext = mimetype ? mimetype.split('/')[1]?.replace('jpeg', 'jpg').replace(/;.*$/, '') || 'bin' : 'bin'
      const filePath = `account-${accountId}/evo-${Date.now()}-${msg.key?.id || 'media'}.${ext}`

      console.log('[DIAG][evolution/webhook] Uploading media to Supabase Storage chat-media bucket | path:', filePath)

      const { error: uploadErr } = await supabaseAdmin()
        .storage
        .from('chat-media')
        .upload(filePath, buffer, {
          contentType: mimetype || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadErr) {
        console.error('[DIAG][evolution/webhook] Supabase Storage upload failed:', uploadErr)
      } else {
        const { data: publicUrlData } = supabaseAdmin()
          .storage
          .from('chat-media')
          .getPublicUrl(filePath)

        if (publicUrlData?.publicUrl) {
          finalMediaUrl = publicUrlData.publicUrl
          console.log('[DIAG][evolution/webhook] Permanent Supabase Storage URL generated:', finalMediaUrl)
        }
      }

      // Voice STT Input Adapter: Transcribe audio if enabled
      if (mediaType === 'audio' && buffer.length > 0) {
        try {
          const { allowed: planAllowsVoice } = await checkAccountFeature(accountId, 'voice_transcription')
          if (planAllowsVoice) {
            const aiConf = await loadAiConfig(supabaseAdmin(), accountId)
            if (aiConf?.isActive && aiConf?.voiceTranscriptionEnabled) {
              const transcription = await transcribeAudioMessage({
                buffer,
                mimeType: mimetype || 'audio/ogg',
                provider: aiConf.provider,
                apiKey: aiConf.apiKey,
              })
              if (transcription) {
                console.log('[evolution/webhook] Voice message transcribed successfully | len:', transcription.length)
                return {
                  contentType: 'audio',
                  contentText: transcription,
                  transcribedText: transcription,
                  mediaUrl: finalMediaUrl,
                }
              }
            }
          }
        } catch (sttErr) {
          console.error('[evolution/webhook] voice transcription skipped safely:', sttErr instanceof Error ? sttErr.message : String(sttErr))
        }
      }
    } catch (err) {
      console.error('[DIAG][evolution/webhook] Exception during media upload process:', err)
    }
  }

  return {
    contentType: mediaType,
    contentText: caption || fileName || null,
    transcribedText: null,
    mediaUrl: finalMediaUrl,
  }
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
