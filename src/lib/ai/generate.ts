import {
  AiError,
  type AiConfig,
  type AiUsage,
  type ChatMessage,
  type ExtractedAppointmentData,
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
  /** When true, `parseGeneration` will attempt to extract the order JSON block. */
  orderMode?: boolean
  /** When true, `parseGeneration` will attempt to extract the appointment JSON block. */
  appointmentMode?: boolean
}

/**
 * Generate the next reply from the account's configured provider.
 * Dispatches to the right adapter, then parses the handoff sentinel out
 * of the raw text. Throws `AiError` on any provider/network failure.
 */
export async function generateReply(args: GenerateArgs): Promise<GenerateResult> {
  const { config, systemPrompt, messages, orderMode = false, appointmentMode = false } = args
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

  return parseGeneration(result.text, result.usage, orderMode, appointmentMode)
}

/**
 * Attempt to parse raw JSON from |||...||| delimiters safely.
 */
function parseRawJsonBlock(raw: string): Record<string, unknown> | null {
  const startIdx = raw.indexOf('|||')
  if (startIdx === -1) return null

  const endIdx = raw.lastIndexOf('|||')
  let jsonStr = ''

  if (endIdx > startIdx) {
    jsonStr = raw.slice(startIdx + 3, endIdx).trim()
  } else {
    jsonStr = raw.slice(startIdx + 3).trim()
  }

  // Attempt 1: Direct parse
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>
  } catch {
    // Attempt 2: Rescue unclosed JSON
    const suffixes = ['}', '"}', '"}}', '"}}}', 'false}', 'false}}', 'null}']
    for (const suffix of suffixes) {
      try {
        return JSON.parse(jsonStr + suffix) as Record<string, unknown>
      } catch {
        // continue
      }
    }
    return null
  }
}

export function tryParseOrderBlock(raw: string): ExtractedOrderData | null {
  const parsed = parseRawJsonBlock(raw)
  if (!parsed) return null
  return buildExtractedOrderData(parsed)
}

function buildExtractedOrderData(parsed: Record<string, unknown>): ExtractedOrderData | null {
  if (!parsed || typeof parsed !== 'object') return null
  // Only treat as order data if it has extracted or new_order or order-related fields
  if (!('extracted' in parsed) && !('new_order' in parsed) && !('confirmed' in parsed && !('appointment' in parsed))) {
    return null
  }
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

export function tryParseAppointmentBlock(raw: string): ExtractedAppointmentData | null {
  const parsed = parseRawJsonBlock(raw)
  if (!parsed || typeof parsed !== 'object') return null

  const apptObj = (parsed.appointment as Record<string, unknown>) || parsed
  if (!apptObj || typeof apptObj !== 'object') return null

  if (!('date_time' in apptObj) && !('service_name' in apptObj) && !('cancel_appointment' in apptObj)) {
    return null
  }

  return {
    customer_name: typeof apptObj.customer_name === 'string' ? apptObj.customer_name : undefined,
    service_name: typeof apptObj.service_name === 'string' ? apptObj.service_name : undefined,
    date_time: typeof apptObj.date_time === 'string' ? apptObj.date_time : undefined,
    confirmed: apptObj.confirmed === true,
    cancel_appointment: apptObj.cancel_appointment === true,
  }
}

/**
 * Split the raw model output into `{ text, handoff, extracted, appointmentData, usage }`.
 */
export function parseGeneration(
  raw: string,
  usage: AiUsage | null = null,
  orderMode = false,
  appointmentMode = false,
): GenerateResult {
  const extracted = orderMode ? tryParseOrderBlock(raw) : null
  const appointmentData = appointmentMode ? tryParseAppointmentBlock(raw) : null

  // Strip the block from the text unconditionally.
  let withoutBlock = raw
  const blockStart = raw.indexOf('|||')
  if (blockStart !== -1) {
    const blockEnd = raw.lastIndexOf('|||')
    if (blockEnd > blockStart) {
      withoutBlock = raw.slice(0, blockStart) + raw.slice(blockEnd + 3)
    } else {
      withoutBlock = raw.slice(0, blockStart)
    }
  }

  withoutBlock = withoutBlock
    .replace(/\|\|\|[\s\S]*/g, '')
    .replace(/(?:Let's|Let us|No preamble|Here is the JSON|Formatting JSON)[\s\S]*/gi, '')

  const handoff = withoutBlock.includes(HANDOFF_SENTINEL)
  const text = withoutBlock.split(HANDOFF_SENTINEL).join('').trim()

  const res: GenerateResult = { text, handoff, usage, extracted }
  if (appointmentMode) {
    res.appointmentData = appointmentData
  }

  return res
}
