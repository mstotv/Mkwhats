import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatMessage } from './types'
import { aiContextMessageLimit } from './defaults'

interface DbMessage {
  sender_type: 'customer' | 'agent' | 'bot'
  content_type?: string | null
  content_text: string | null
  transcribed_text?: string | null
}

/**
 * Fetch the last N messages of a conversation and map them to the
 * provider-neutral chat shape. Customer messages become `user`; agent
 * and bot messages become `assistant`.
 *
 * For audio messages, if `transcribed_text` or `content_text` is present,
 * it is formatted with a clear indication that it is a customer voice note
 * so the AI understands spoken queries seamlessly.
 *
 * Ordered oldest-first (chronological) so the transcript reads
 * naturally and the most recent customer message lands last.
 */
export async function buildConversationContext(
  db: SupabaseClient,
  conversationId: string,
  limit: number = aiContextMessageLimit(),
): Promise<ChatMessage[]> {
  const { data, error } = await db
    .from('messages')
    .select('sender_type, content_type, content_text, transcribed_text')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const rows = ((data ?? []) as DbMessage[]).reverse()
  const result: ChatMessage[] = []

  for (const m of rows) {
    const rawText = (m.transcribed_text?.trim() || m.content_text?.trim() || '')
    if (!rawText) continue

    // For voice notes, contextualize for the LLM
    const content =
      m.content_type === 'audio' && m.sender_type === 'customer'
        ? `[رسالة صوتية مفرغة من العميل]: "${rawText}"`
        : rawText

    result.push({
      role: m.sender_type === 'customer' ? 'user' : 'assistant',
      content,
    })
  }

  return result
}
