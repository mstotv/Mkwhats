import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/whatsapp/encryption'

export interface TelegramConfig {
  id: string
  accountId: string
  botToken: string
  chatId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StoredTelegramConfigRow {
  id: string
  account_id: string
  bot_token: string
  chat_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Load and decrypt the account's Telegram Bot config.
 * Returns `null` when no configuration exists for the account.
 */
export async function loadTelegramConfig(
  db: SupabaseClient,
  accountId: string,
): Promise<TelegramConfig | null> {
  const { data, error } = await db
    .from('telegram_configs')
    .select('id, account_id, bot_token, chat_id, is_active, created_at, updated_at')
    .eq('account_id', accountId)
    .maybeSingle()

  if (error) {
    console.error('[telegram config] Error loading config:', error)
    return null
  }

  if (!data) return null

  const row = data as StoredTelegramConfigRow
  let decryptedToken = ''
  try {
    decryptedToken = decrypt(row.bot_token)
  } catch (err) {
    console.error(`[telegram config] Failed to decrypt bot_token for account ${accountId}:`, err)
    return null
  }

  return {
    id: row.id,
    accountId: row.account_id,
    botToken: decryptedToken,
    chatId: row.chat_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Encrypt and save (upsert) the Telegram Bot configuration for an account.
 */
export async function saveTelegramConfig(
  db: SupabaseClient,
  accountId: string,
  userId: string | null,
  botToken: string,
  chatId: string,
  isActive = true,
): Promise<{ success: boolean; error?: string }> {
  const encryptedToken = encrypt(botToken.trim())

  const { error } = await db
    .from('telegram_configs')
    .upsert(
      {
        account_id: accountId,
        created_by: userId ?? null,
        bot_token: encryptedToken,
        chat_id: chatId.trim(),
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'account_id' },
    )

  if (error) {
    console.error('[telegram config] Error saving config:', error)
    return { success: false, error: 'فشل حفظ إعدادات بوت تيليجرام' }
  }

  return { success: true }
}

/**
 * Delete Telegram Bot configuration for an account.
 */
export async function deleteTelegramConfig(
  db: SupabaseClient,
  accountId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('telegram_configs')
    .delete()
    .eq('account_id', accountId)

  if (error) {
    console.error('[telegram config] Error deleting config:', error)
    return { success: false, error: 'فشل حذف إعدادات تيليجرام' }
  }

  return { success: true }
}
