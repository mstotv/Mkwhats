import {
  AiError,
  type AiConfig,
  type AiUsage,
  type ChatMessage,
  type ExtractedOrderData,
  type GenerateResult,
} from './types'
import { HANDOFF_SENTINEL, aiRequestTimeoutMs } from './defaults'
import { generateOpenAi } from './providers/openai'
import { generateAnthropic } from './providers/anthropic'

export interface GenerateArgs {
  config: AiConfig
  /** Fully-built system prompt (see `buildSystemPrompt`). */
  systemPrompt: string
  /** Recent conversation turns, oldest first. */
  messages: ChatMessage[]
  /** When true, `parseGeneration` will attempt to extract the |||{...}|||
   *  JSON block from the model's reply. Pass true only in auto_reply mode
   *  when order-collection is active — avoids regex overhead on normal
   *  replies. Defaults to false. */
  orderMode?: boolean
}

/**
 * Generate the next reply from the account's configured provider.
 * Dispatches to the right adapter, then parses the handoff sentinel out
 * of the raw text. Throws `AiError` on any provider/network failure.
 */
export async function generateReply(args: GenerateArgs): Promise<GenerateResult> {
  const { config, systemPrompt, messages, orderMode = false } = args
  const timeoutMs = aiRequestTimeoutMs()
  const providerArgs = {
    apiKey: config.apiKey,
    model: config.model,
    systemPrompt,
    messages,
    timeoutMs,
  }

  let result: { text: string; usage: AiUsage | null }
  switch (config.provider) {
    case 'openai':
      result = await generateOpenAi(providerArgs)
      break
    case 'anthropic':
      result = await generateAnthropic(providerArgs)
      break
    default:
      throw new AiError(`Unsupported AI provider: ${config.provider}`, {
        code: 'unsupported_provider',
        status: 400,
      })
  }

  return parseGeneration(result.text, result.usage, orderMode)
}

/**
 * Attempt to parse the |||{...}||| JSON block the model embeds in its
 * reply when order-collection mode is active. This is the ONLY place
 * where extraction can fail — all callers must treat a null return as
 * "nothing extracted this turn" and continue normally; the customer
 * reply (text) is always sent regardless.
 *
 * The regex uses a non-greedy match so it stops at the first closing
 * |||, even if the model emitted junk after it. The `s` flag makes `.`
 * match newlines in case the model pretty-prints the JSON.
 */
export function tryParseOrderBlock(raw: string): ExtractedOrderData | null {
  // Match |||{...}||| — capture only the JSON part.
  // Uses [\s\S]*? instead of .* with /s flag for ES2017 compatibility.
  const match = raw.match(/\|\|\|(\{[\s\S]*?\})\|\|\|/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1]) as Record<string, unknown>
    return {
      extracted:
        typeof parsed.extracted === 'object' &&
        parsed.extracted !== null &&
        !Array.isArray(parsed.extracted)
          ? (parsed.extracted as Record<string, string>)
          : {},
      confirmed: parsed.confirmed === true,
      new_order: parsed.new_order === true,
    }
  } catch {
    // The model produced a malformed block. Log once and return null —
    // the caller will skip upsert for this turn; the AI will re-ask for
    // the missing field in the next message.
    console.warn('[order-collection] model returned a malformed JSON block — skipping extraction for this turn')
    return null
  }
}

/**
 * Split the raw model output into `{ text, handoff, extracted, usage }`.
 *
 * Stripping order:
 *   1. Remove the |||{...}||| block (order data) — it must never appear
 *      in the customer-facing text.
 *   2. Remove the [[HANDOFF]] sentinel.
 *   3. Trim whitespace.
 *
 * Both strips happen unconditionally so malformed / partial blocks
 * don’t leak into the send. `usage` is passed straight through.
 */
export function parseGeneration(
  raw: string,
  usage: AiUsage | null = null,
  orderMode = false,
): GenerateResult {
  // Step 1: extract (and remove) the order JSON block before any other
  // processing. tryParseOrderBlock() is safe — returns null on any error.
  const extracted = orderMode ? tryParseOrderBlock(raw) : null
  // Strip the block from the text regardless of parse success so the
  // sentinel characters never reach the customer.
  const withoutBlock = raw.replace(/\|\|\|\{[\s\S]*?\}\|\|\|/, '')

  // Step 2: detect and strip the handoff sentinel.
  const handoff = withoutBlock.includes(HANDOFF_SENTINEL)
  const text = withoutBlock.split(HANDOFF_SENTINEL).join('').trim()

  return { text, handoff, usage, extracted }
}
