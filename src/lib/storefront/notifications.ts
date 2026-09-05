import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import { loadTelegramConfig } from '@/lib/telegram/config'
import { sendEvolutionTextMessage } from '@/lib/whatsapp/evolution-api'
import { sendTextMessage } from '@/lib/whatsapp/meta-api'
import { decrypt } from '@/lib/whatsapp/encryption'
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils'

/**
 * Send a WhatsApp confirmation message to customer upon storefront order or appointment booking.
 * Strictly non-blocking and resilient.
 */
export async function sendStorefrontWhatsAppMessage({
  accountId,
  phone,
  text,
}: {
  accountId: string
  phone: string
  text: string
}): Promise<boolean> {
  try {
    const service = createServiceClient()
    const { data: config } = await service
      .from('whatsapp_config')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle()

    if (!config) {
      return false
    }

    const cleanPhone = sanitizePhoneForMeta(phone)

    // 1. Evolution API Provider
    if (config.connection_type === 'evolution') {
      const instanceName = config.evolution_instance_name
      if (!instanceName || !config.evolution_api_key) return false

      let apiKey = ''
      try {
        apiKey = decrypt(config.evolution_api_key)
      } catch {
        return false
      }

      const res = await sendEvolutionTextMessage({
        instanceName,
        instanceApiKey: apiKey,
        to: cleanPhone,
        text,
      })
      return Boolean(res.messageId)
    }

    // 2. Meta Cloud API Provider
    if (config.access_token && config.phone_number_id) {
      let token = ''
      try {
        token = decrypt(config.access_token)
      } catch {
        return false
      }

      const res = await sendTextMessage({
        phoneNumberId: config.phone_number_id,
        accessToken: token,
        to: cleanPhone,
        text,
      })
      return Boolean(res.messageId)
    }

    return false
  } catch (err) {
    console.error('[sendStorefrontWhatsAppMessage] Failed:', err)
    return false
  }
}

/**
 * Send an instant Telegram alert to the business owner about a new storefront order or appointment.
 */
export async function sendStorefrontTelegramNotification({
  accountId,
  htmlMessage,
}: {
  accountId: string
  htmlMessage: string
}): Promise<boolean> {
  try {
    const service = createServiceClient()
    const config = await loadTelegramConfig(service, accountId)

    if (!config || !config.isActive || !config.botToken || !config.chatId) {
      return false
    }

    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
      }),
    })

    return res.ok
  } catch (err) {
    console.error('[sendStorefrontTelegramNotification] Failed:', err)
    return false
  }
}
