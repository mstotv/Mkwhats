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
import { generateGemini } from './providers/gemini'

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
    case 'gemini':
      result = await generateGemini(providerArgs)
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
 * reply when order-collection mode is active.
 *
 * Extraction strategy: find the FIRST occurrence of ||| and the LAST
 * occurrence of |||, then JSON.parse() everything in between. This is
 * more robust than a non-greedy regex because:
 *   - regex `\{[\s\S]*?\}` can in theory stop at the wrong `}` if the
 *     engine backtracks in an unexpected way on very large payloads.
 *   - indexOf/lastIndexOf always finds the outermost delimiters, so any
 *     nesting depth (objects inside extracted, arrays, escaped chars) is
 *     handled by the JSON parser rather than the regex engine.
 *
 * Returns null on: no delimiters found, only one delimiter, or any
 * JSON.parse failure. Callers treat null as "nothing extracted this
 * turn" and continue; the customer reply (text) is still sent.
 */
export function tryParseOrderBlock(raw: string): ExtractedOrderData | null {
  const startIdx = raw.indexOf('|||')
  if (startIdx === -1) return null

  const endIdx = raw.lastIndexOf('|||')
  let jsonStr = ''

  if (endIdx > startIdx) {
    jsonStr = raw.slice(startIdx + 3, endIdx).trim()
  } else {
    // Unclosed ||| block (e.g. model output got truncated mid-JSON)
    jsonStr = raw.slice(startIdx + 3).trim()
  }

  // Attempt 1: Direct JSON parse
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>
    return buildExtractedOrderData(parsed)
  } catch {
    // Attempt 2: Rescue unclosed JSON by appending missing quotes/closing braces
    const suffixes = ['}', '"}', '"}}', '"}}}', 'false}', 'false}}', 'null}']
    for (const suffix of suffixes) {
      try {
        const parsed = JSON.parse(jsonStr + suffix) as Record<string, unknown>
        return buildExtractedOrderData(parsed)
      } catch {
        // try next suffix
      }
    }
    console.warn('[order-collection] model returned a malformed or truncated JSON block — skipping extraction for this turn')
    return null
  }
}

function buildExtractedOrderData(parsed: Record<string, unknown>): ExtractedOrderData | null {
  if (!parsed || typeof parsed !== 'object') return null
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
}

/**
 * Split the raw model output into `{ text, handoff, extracted, usage }`.
 *
 * Stripping order:
 *   1. Remove the |||{...}||| block (order data) — it must never appear
 *      in the customer-facing text. If the block is unclosed (only one |||
 *      present), strips EVERYTHING from ||| to the end of string so
 *      unclosed JSON never leaks to the customer.
 *   2. Remove any residual ||| markers or English meta-thinking lines.
 *   3. Remove the [[HANDOFF]] sentinel.
 *   4. Trim whitespace.
 */
export function parseGeneration(
  raw: string,
  usage: AiUsage | null = null,
  orderMode = false,
): GenerateResult {
  // Step 1: extract (and remove) the order JSON block before any other
  // processing. tryParseOrderBlock() is safe — returns null on any error.
  const extracted = orderMode ? tryParseOrderBlock(raw) : null

  // Strip the block from the text unconditionally.
  let withoutBlock = raw
  const blockStart = raw.indexOf('|||')
  if (blockStart !== -1) {
    const blockEnd = raw.lastIndexOf('|||')
    if (blockEnd > blockStart) {
      // Complete block between blockStart and blockEnd
      withoutBlock = raw.slice(0, blockStart) + raw.slice(blockEnd + 3)
    } else {
      // UNCLOSED ||| block (e.g. truncated mid-JSON) -> strip everything from blockStart to end!
      withoutBlock = raw.slice(0, blockStart)
    }
  }

  // Step 2: Clean up any lingering ||| artifacts or meta commentary
  withoutBlock = withoutBlock
    .replace(/\|\|\|[\s\S]*/g, '')
    .replace(/(?:Let's|Let us|No preamble|Here is the JSON|Formatting JSON)[\s\S]*/gi, '')

  console.log('[DIAG][parseGeneration] orderMode:', orderMode, '| raw contains|||:', raw.includes('|||'), '| withoutBlock contains|||:', withoutBlock.includes('|||'), '| extracted:', JSON.stringify(extracted))

  // Step 3: detect and strip the handoff sentinel.
  const handoff = withoutBlock.includes(HANDOFF_SENTINEL)
  const text = withoutBlock.split(HANDOFF_SENTINEL).join('').trim()

  console.log('[DIAG][parseGeneration] final text len:', text.length, '| preview:', JSON.stringify(text.slice(0, 100)))

  return { text, handoff, usage, extracted }
}
