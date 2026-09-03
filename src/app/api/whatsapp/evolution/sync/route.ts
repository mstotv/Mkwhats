import { NextResponse } from 'next/server'
import { getCurrentAccount } from '@/lib/auth/account'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/whatsapp/encryption'

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const maxDuration = 300 // Allow up to 5 minutes for full sync

export async function POST() {
  try {
    const { accountId, userId } = await getCurrentAccount()
    const db = supabaseAdmin()

    // 1. Get Evolution WhatsApp config for this account
    const { data: config, error: configErr } = await db
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .eq('connection_type', 'evolution')
      .maybeSingle()

    if (configErr || !config) {
      return NextResponse.json(
        { error: 'Evolution WhatsApp connection not found' },
        { status: 404 }
      )
    }

    if (!config.evolution_instance_name || !config.evolution_server_url || !config.evolution_api_key) {
      return NextResponse.json(
        { error: 'Evolution instance configuration incomplete' },
        { status: 400 }
      )
    }

    const instanceName = config.evolution_instance_name
    const serverUrl = config.evolution_server_url.replace(/\/$/, '')
    let apiKey = config.evolution_api_key
    try {
      apiKey = decrypt(config.evolution_api_key)
    } catch {
      // already plain if unencrypted
    }

    // 2. Fetch all chats from Evolution API
    const resChats = await fetch(`${serverUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ where: {} }),
    })

    if (!resChats.ok) {
      return NextResponse.json(
        { error: `Evolution server returned error ${resChats.status}` },
        { status: 502 }
      )
    }

    const chats = await resChats.json()
    if (!Array.isArray(chats)) {
      return NextResponse.json({ success: true, syncedChats: 0, syncedMessages: 0 })
    }

    const directChats = chats.filter(
      (c) =>
        c.remoteJid &&
        !c.remoteJid.includes('@g.us') &&
        !c.remoteJid.includes('status@broadcast') &&
        !c.remoteJid.startsWith('0@')
    )

    // Existing contacts in Supabase
    const { data: existingContacts } = await db
      .from('contacts')
      .select('id, phone')
      .eq('account_id', accountId)

    const phoneToContact = new Map<string, { id: string; phone: string }>()
    for (const c of existingContacts ?? []) {
      if (c.phone) phoneToContact.set(c.phone.replace(/\D/g, ''), c)
    }

    // Existing conversations in Supabase
    const { data: existingConvs } = await db
      .from('conversations')
      .select('id, contact_id')
      .eq('account_id', accountId)

    const contactIdToConv = new Map<string, { id: string; contact_id: string }>()
    for (const conv of existingConvs ?? []) {
      if (conv.contact_id) contactIdToConv.set(conv.contact_id, conv)
    }

    let contactsCreated = 0
    let convsCreated = 0
    let messagesSynced = 0

    for (const chat of directChats) {
      const rawJid: string = chat.remoteJid
      const cleanNumber = rawJid.split('@')[0].replace(/\D/g, '')
      if (!cleanNumber || cleanNumber.length < 5) continue

      const formattedPhone = `+${cleanNumber}`
      let contact = phoneToContact.get(cleanNumber)

      // A. Create contact if missing
      if (!contact) {
        const contactName = chat.pushName || formattedPhone
        const { data: newC } = await db
          .from('contacts')
          .insert({
            account_id: accountId,
            user_id: userId,
            name: contactName,
            phone: formattedPhone,
            avatar_url: chat.profilePicUrl || null,
          })
          .select('id, phone')
          .single()

        if (newC) {
          contact = newC
          phoneToContact.set(cleanNumber, contact)
          contactsCreated++
        }
      }

      if (!contact) continue

      // B. Create conversation if missing
      let conv = contactIdToConv.get(contact.id)
      if (!conv) {
        const { data: newConv } = await db
          .from('conversations')
          .insert({
            account_id: accountId,
            user_id: userId,
            contact_id: contact.id,
            status: 'open',
            unread_count: chat.unreadCount || 0,
          })
          .select('id, contact_id')
          .single()

        if (newConv) {
          conv = newConv
          contactIdToConv.set(contact.id, conv)
          convsCreated++
        }
      }

      if (!conv) continue

      // C. Fetch recent messages for this chat from Evolution
      try {
        const resM = await fetch(`${serverUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            where: { key: { remoteJid: rawJid } },
            limit: 50,
          }),
        })

        if (!resM.ok) continue
        const dataM = await resM.json()
        const records = dataM?.messages?.records || dataM?.records || (Array.isArray(dataM) ? dataM : [])

        for (const r of records) {
          const msgId = r.key?.id
          if (!msgId) continue

          const { data: exists } = await db
            .from('messages')
            .select('id')
            .eq('message_id', msgId)
            .maybeSingle()

          if (exists) continue

          const isFromMe = Boolean(r.key?.fromMe)
          const msgText = r.message?.conversation || r.message?.extendedTextMessage?.text || null
          const isAudio = Boolean(r.message?.audioMessage)
          const isImage = Boolean(r.message?.imageMessage)
          const isDocument = Boolean(r.message?.documentMessage)
          const contentType = isAudio ? 'audio' : isImage ? 'image' : isDocument ? 'document' : 'text'
          const createdAt = r.messageTimestamp
            ? new Date(r.messageTimestamp * 1000).toISOString()
            : new Date().toISOString()

          await db.from('messages').insert({
            conversation_id: conv.id,
            sender_type: isFromMe ? 'agent' : 'customer',
            sender_id: isFromMe ? userId : contact.id,
            content_type: contentType,
            content_text: msgText,
            message_id: msgId,
            status: 'delivered',
            created_at: createdAt,
          })

          messagesSynced++
        }

        // D. Update last_message_text & last_message_at
        const { data: latest } = await db
          .from('messages')
          .select('content_text, content_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latest) {
          await db
            .from('conversations')
            .update({
              last_message_text: latest.content_text || `[${latest.content_type}]`,
              last_message_at: latest.created_at,
              updated_at: latest.created_at,
            })
            .eq('id', conv.id)
        }
      } catch (chatSyncErr) {
        console.warn(`[evolution/sync] Error syncing chat ${rawJid}:`, chatSyncErr)
      }
    }

    return NextResponse.json({
      success: true,
      totalChatsFound: directChats.length,
      contactsCreated,
      convsCreated,
      messagesSynced,
    })
  } catch (error) {
    console.error('[evolution/sync] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
