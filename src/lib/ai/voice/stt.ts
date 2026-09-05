/**
 * Voice STT (Speech-to-Text) Input Adapter.
 *
 * Transcribes incoming audio messages into text before passing to the AI pipeline.
 * Isolated adapter with safe error handling and zero secret leaks in logs.
 */

export interface TranscribeAudioArgs {
  buffer: Buffer
  mimeType: string
  provider: 'openai' | 'gemini' | 'anthropic'
  apiKey: string
  model?: string
  timeoutMs?: number
}

const OPENAI_TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Transcribe an audio buffer to text using either OpenAI Whisper or Gemini Multimodal.
 * Returns the transcribed string on success, or null on failure (safe fallback).
 */
export async function transcribeAudioMessage(
  args: TranscribeAudioArgs
): Promise<string | null> {
  const { buffer, mimeType, provider, apiKey, model, timeoutMs = 25000 } = args

  if (!buffer || buffer.length === 0 || !apiKey) {
    console.warn('[voice-stt] Transcribe skipped: missing buffer or apiKey')
    return null
  }

  try {
    if (provider === 'openai') {
      return await transcribeWithOpenAiWhisper(buffer, mimeType, apiKey, timeoutMs)
    } else if (provider === 'gemini') {
      return await transcribeWithGemini(buffer, mimeType, apiKey, timeoutMs, model)
    } else {
      // Anthropic does not provide a direct STT audio endpoint; fallback safely
      console.log(`[voice-stt] Provider '${provider}' does not have a native STT endpoint — skipping voice transcription`)
      return null
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    // Secure logging: log the error message safely without printing secrets or full headers
    console.error('[voice-stt] Transcription failed safely:', errorMsg.replace(/key=[^&\s]+/gi, 'key=***').replace(/Bearer\s+[^\s]+/gi, 'Bearer ***'))
    return null
  }
}

/**
 * OpenAI Whisper transcription handler.
 */
async function transcribeWithOpenAiWhisper(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  timeoutMs: number
): Promise<string | null> {
  // Normalize extension and filename for FormData
  const ext = mimeType.includes('ogg')
    ? 'ogg'
    : mimeType.includes('mp4') || mimeType.includes('m4a')
    ? 'm4a'
    : mimeType.includes('mp3') || mimeType.includes('mpeg')
    ? 'mp3'
    : 'ogg'

  const formData = new FormData()
  const blob = new Blob([buffer as unknown as BlobPart], { type: mimeType || 'audio/ogg' })
  formData.append('file', blob, `audio.${ext}`)
  formData.append('model', 'whisper-1')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      const status = res.status
      console.error(`[voice-stt][openai] Whisper API returned status ${status}`)
      return null
    }

    const data = (await res.json()) as { text?: string }
    const text = data?.text?.trim()
    return text || null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Gemini Multimodal Audio transcription handler.
 */
async function transcribeWithGemini(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  timeoutMs: number,
  preferredModel?: string
): Promise<string | null> {
  // Normalize MIME type for Gemini
  let normalizedMime = (mimeType || 'audio/ogg').split(';')[0].trim()
  if (!normalizedMime || normalizedMime === 'audio/opus') {
    normalizedMime = 'audio/ogg'
  }

  const base64Audio = buffer.toString('base64')
  
  // Try preferred model first (or default 'gemini-2.0-flash'), then sensible fallbacks
  const candidateModels = [
    preferredModel,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest',
  ].filter((m, idx, arr): m is string => Boolean(m) && arr.indexOf(m) === idx)

  const systemInstruction =
    'Transcribe the spoken audio message exactly into text. Preserve the original language and dialect (such as Arabic or English). Return ONLY the transcription text, with no preamble, formatting, quotes, or conversational remarks.'

  for (const modelName of candidateModels) {
    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: normalizedMime,
                    data: base64Audio,
                  },
                },
                {
                  text: 'Please transcribe this voice message accurately:',
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        let errDetail = ''
        try {
          const errJson = (await res.json()) as { error?: { message?: string } }
          errDetail = errJson?.error?.message ?? ''
        } catch {}

        console.warn(`[voice-stt][gemini] Model ${modelName} returned status ${res.status}${errDetail ? ` (${errDetail})` : ''}`)
        if (res.status === 404 || res.status === 400 || res.status === 503) {
          // Model not found or multimodal audio not supported on this specific model/key — continue to next candidate model
          continue
        }
        return null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as any
      const parts = data?.candidates?.[0]?.content?.parts ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textPart = parts.find((p: any) => !p.thought && typeof p.text === 'string')
      const text = textPart?.text?.trim() || parts[0]?.text?.trim()
      if (text) {
        return text
      }
    } catch (err) {
      console.warn(`[voice-stt][gemini] Attempt with model ${modelName} failed:`, err instanceof Error ? err.message : String(err))
    } finally {
      clearTimeout(timer)
    }
  }

  return null
}
