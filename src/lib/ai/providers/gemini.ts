import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import {
  mergeConsecutive,
  normalizeUsage,
  providerHttpError,
  toNetworkError,
  type ProviderArgs,
} from './shared'

// Google Generative Language API (v1beta)
const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiContent {
  role: 'user' | 'model'
  parts: { text: string }[]
}

interface GeminiPart {
  text?: string
  /**
   * Present on thinking-model parts that contain the model's internal
   * chain-of-thought. These MUST be filtered out before sending text to
   * the customer — they are not part of the final answer.
   */
  thought?: boolean
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: GeminiPart[]
    }
  }[]
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  error?: { message?: string; code?: number }
}

/**
 * Call Google's Gemini generateContent endpoint with the caller's own key.
 * The key is passed as a query param (`?key=...`) — Gemini doesn't use
 * Bearer tokens. System prompt goes in `system_instruction`.
 *
 * Role mapping: our internal 'assistant' → Gemini's 'model'.
 * Consecutive same-role turns are merged (same as Anthropic adapter).
 */
export async function generateGemini(args: ProviderArgs): Promise<ProviderResult> {
  const { apiKey, model, systemPrompt, messages, timeoutMs } = args

  const merged = mergeConsecutive(messages)
  const contents: GeminiContent[] = merged.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Gemini requires contents to be non-empty, start with 'user', and end with 'user'
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'مرحبا' }] })
  } else {
    if (contents[0].role === 'model') {
      contents.unshift({ role: 'user', parts: [{ text: 'مرحبا' }] })
    }
    if (contents[contents.length - 1].role === 'model') {
      contents.push({ role: 'user', parts: [{ text: '...' }] })
    }
  }

  const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw toNetworkError(err)
  }

  if (!res.ok) {
    // Gemini wraps errors differently — try to surface the message.
    let detail = ''
    try {
      const body = (await res.json()) as GeminiResponse
      detail = body?.error?.message ?? ''
    } catch {
      // Non-JSON — fall through.
    }
    const { status } = res
    const code =
      status === 400 && detail.toLowerCase().includes('api key')
        ? 'invalid_key'
        : status === 401 || status === 403
          ? 'invalid_key'
          : status === 429
            ? 'rate_limited'
            : 'provider_error'
    const base =
      code === 'invalid_key'
        ? 'Google Gemini rejected the API key'
        : code === 'rate_limited'
          ? 'Google Gemini rate limit reached'
          : `Google Gemini API error (${status})`
    throw new AiError(detail ? `${base}: ${detail}` : base, {
      code,
      status: code === 'invalid_key' ? 401 : 502,
    })
  }

  const data = (await res.json().catch(() => null)) as GeminiResponse | null
  const parts = data?.candidates?.[0]?.content?.parts ?? []

  // DIAGNOSTIC: log raw parts structure so we can see exactly where
  // thought parts end and text parts begin, and where the JSON block lands.
  console.log('[DIAG][gemini] raw parts count:', parts.length)
  parts.forEach((p, i) => {
    console.log(
      `[DIAG][gemini] parts[${i}] thought=${!!p.thought} textLen=${p.text?.length ?? 0} preview=${JSON.stringify(p.text?.slice(0, 120))}`,
    )
  })

  // Log the COMPLETE raw concatenation of all parts (including thought parts)
  // BEFORE any filtering — this is the ground truth of what Gemini returned.
  const rawAllParts = parts.map((p) => p.text ?? '').join('')
  console.log('[DIAG][gemini] RAW FULL (all parts, pre-filter) len:', rawAllParts.length)
  console.log('[DIAG][gemini] RAW FULL first-|||:', rawAllParts.indexOf('|||'), 'last-|||:', rawAllParts.lastIndexOf('|||'))
  // Print the full text in chunks of 200 chars so nothing is truncated in logs
  for (let i = 0; i < rawAllParts.length; i += 200) {
    console.log(`[DIAG][gemini] RAW[${i}–${Math.min(i + 200, rawAllParts.length)}]:`, JSON.stringify(rawAllParts.slice(i, i + 200)))
  }

  // Gemini thinking models return multiple parts per response:
  //   - parts with `thought: true`  → internal chain-of-thought (MUST be excluded)
  //   - parts without `thought`     → the actual customer-facing reply
  // Taking parts[0] blindly would send the thinking text to the customer.
  // We concatenate only the non-thought parts here.
  const text = parts
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('')
    .trim()

  console.log('[DIAG][gemini] text after thought-filter len:', text.length, 'contains|||:', text.includes('|||'))

  if (!text) {
    throw new AiError('Google Gemini returned an empty response.', {
      code: 'empty_response',
    })
  }

  const usage = normalizeUsage({
    prompt: data?.usageMetadata?.promptTokenCount,
    completion: data?.usageMetadata?.candidatesTokenCount,
    total: data?.usageMetadata?.totalTokenCount,
  })

  return { text, usage }
}
