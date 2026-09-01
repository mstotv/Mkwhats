import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { transcribeAudioMessage } from './stt'

describe('transcribeAudioMessage', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns null when buffer is empty or apiKey is missing', async () => {
    const emptyRes = await transcribeAudioMessage({
      buffer: Buffer.from(''),
      mimeType: 'audio/ogg',
      provider: 'openai',
      apiKey: 'test-key',
    })
    expect(emptyRes).toBeNull()

    const noKeyRes = await transcribeAudioMessage({
      buffer: Buffer.from('fake-audio-bytes'),
      mimeType: 'audio/ogg',
      provider: 'openai',
      apiKey: '',
    })
    expect(noKeyRes).toBeNull()
  })

  it('transcribes successfully with OpenAI Whisper', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'مرحبا اريد حجز موعد غدا' }),
    }) as unknown as typeof fetch

    const result = await transcribeAudioMessage({
      buffer: Buffer.from('fake-audio-bytes'),
      mimeType: 'audio/ogg',
      provider: 'openai',
      apiKey: 'sk-test123456789',
    })

    expect(result).toBe('مرحبا اريد حجز موعد غدا')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer sk-test123456789',
        },
      })
    )
  })

  it('transcribes successfully with Gemini Multimodal', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'طلب جديد قطعتين عطر' }],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await transcribeAudioMessage({
      buffer: Buffer.from('fake-audio-bytes'),
      mimeType: 'audio/ogg; codecs=opus',
      provider: 'gemini',
      apiKey: 'AIzaSyFakeKey123',
    })

    expect(result).toBe('طلب جديد قطعتين عطر')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-1.5-flash:generateContent?key=AIzaSyFakeKey123'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('handles API failure gracefully without throwing or leaking secrets', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    }) as unknown as typeof fetch

    const result = await transcribeAudioMessage({
      buffer: Buffer.from('fake-audio-bytes'),
      mimeType: 'audio/ogg',
      provider: 'openai',
      apiKey: 'sk-invalid-key',
    })

    expect(result).toBeNull()
  })

  it('handles unsupported provider (anthropic) safely', async () => {
    const result = await transcribeAudioMessage({
      buffer: Buffer.from('fake-audio-bytes'),
      mimeType: 'audio/ogg',
      provider: 'anthropic',
      apiKey: 'sk-ant-test',
    })

    expect(result).toBeNull()
  })
})
