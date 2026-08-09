import { describe, expect, it, vi } from 'vitest'
import { sendTelegramOrderNotification } from './send-notification'

describe('sendTelegramOrderNotification', () => {
  it('returns false gracefully when account has no feature access', async () => {
    const mockDb = {} as any
    const res = await sendTelegramOrderNotification(mockDb, 'order-123', 'acc-456')
    expect(res).toBe(false)
  })
})
