import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AiConfig } from './types'

// Shared, hoisted mock state so the module mocks can close over it.
const h = vi.hoisted(() => ({
  loadAiConfig: vi.fn(),
  buildConversationContext: vi.fn(),
  retrieveKnowledge: vi.fn(),
  generateReply: vi.fn(),
  engineSendText: vi.fn(),
  // order-collection module mocks
  loadOrderFormFields: vi.fn(),
  ensureActiveOrder: vi.fn(),
  cancelAndCreateOrder: vi.fn(),
  getMissingFields: vi.fn(),
  upsertOrderFields: vi.fn(),
  checkOrderComplete: vi.fn(),
  confirmOrder: vi.fn(),
  state: {
    conv: null as Record<string, unknown> | null,
    autoResponders: [] as { id: string }[],
    claim: true as boolean,
    updatePayload: null as Record<string, unknown> | null,
    rpcCalls: [] as { name: string; args: unknown }[],
  },
}))

vi.mock('./config', () => ({ loadAiConfig: h.loadAiConfig }))
vi.mock('./context', () => ({ buildConversationContext: h.buildConversationContext }))
vi.mock('./knowledge', () => ({ retrieveKnowledge: h.retrieveKnowledge }))
vi.mock('./generate', () => ({ generateReply: h.generateReply }))
vi.mock('@/lib/flows/meta-send', () => ({ engineSendText: h.engineSendText }))
vi.mock('./order-collection', () => ({
  loadOrderFormFields: h.loadOrderFormFields,
  ensureActiveOrder: h.ensureActiveOrder,
  cancelAndCreateOrder: h.cancelAndCreateOrder,
  getMissingFields: h.getMissingFields,
  upsertOrderFields: h.upsertOrderFields,
  checkOrderComplete: h.checkOrderComplete,
  confirmOrder: h.confirmOrder,
}))
vi.mock('./admin-client', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'automations') {
        // .select().eq().eq().in().limit() → active auto-responders
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          limit: () =>
            Promise.resolve({ data: h.state.autoResponders, error: null }),
        }
        return chain
      }
      // conversations
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: h.state.conv, error: null }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          h.state.updatePayload = payload
          return { eq: () => Promise.resolve({ error: null }) }
        },
      }
    },
    rpc: (name: string, args: unknown) => {
      h.state.rpcCalls.push({ name, args })
      return Promise.resolve({ data: h.state.claim, error: null })
    },
  }),
}))

import { dispatchInboundToAiReply } from './auto-reply'

const ARGS = {
  accountId: 'acct-1',
  conversationId: 'conv-1',
  contactId: 'contact-1',
  configOwnerUserId: 'user-1',
}

function aiConfig(overrides: Partial<AiConfig> = {}): AiConfig {
  return {
    provider: 'openai',
    model: 'gpt-test',
    apiKey: 'sk-test',
    systemPrompt: null,
    isActive: true,
    autoReplyEnabled: true,
    autoReplyMaxPerConversation: 3,
    handoffAgentId: null,
    embeddingsApiKey: null,
    orderCollectionEnabled: false,
    appointmentsEnabled: false,
    ...overrides,
  }
}

beforeEach(() => {
  h.state.conv = {
    assigned_agent_id: null,
    ai_autoreply_disabled: false,
    ai_reply_count: 0,
  }
  h.state.autoResponders = []
  h.state.claim = true
  h.state.updatePayload = null
  h.state.rpcCalls = []
  h.loadAiConfig.mockResolvedValue(aiConfig())
  h.buildConversationContext.mockResolvedValue([{ role: 'user', content: 'hi' }])
  h.retrieveKnowledge.mockResolvedValue([])
  // GenerateResult now includes extracted and usage — provide them in mock.
  h.generateReply.mockResolvedValue({ text: 'Hello!', handoff: false, extracted: null, usage: null })
  h.engineSendText.mockResolvedValue({ whatsapp_message_id: 'm1' })
  // Order-collection mocks — safe no-op defaults.
  h.loadOrderFormFields.mockResolvedValue([])
  h.ensureActiveOrder.mockResolvedValue(null)
  h.cancelAndCreateOrder.mockResolvedValue(null)
  h.getMissingFields.mockResolvedValue([])
  h.upsertOrderFields.mockResolvedValue(true)
  h.checkOrderComplete.mockResolvedValue(false)
  h.confirmOrder.mockResolvedValue(undefined)
})

describe('dispatchInboundToAiReply — eligibility gates', () => {
  it('claims a slot and sends on the happy path', async () => {
    await dispatchInboundToAiReply(ARGS)
    expect(h.state.rpcCalls).toEqual([
      {
        name: 'claim_ai_reply_slot',
        args: { conversation_id: 'conv-1', max_replies: 3 },
      },
    ])
    expect(h.engineSendText).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv-1', text: 'Hello!' }),
    )
  })

  it('grounds the reply in retrieved knowledge', async () => {
    h.retrieveKnowledge.mockResolvedValue(['Returns accepted within 30 days.'])
    await dispatchInboundToAiReply(ARGS)
    expect(h.retrieveKnowledge).toHaveBeenCalled()
    const systemPrompt = h.generateReply.mock.calls[0][0].systemPrompt as string
    expect(systemPrompt).toContain('Returns accepted within 30 days.')
  })

  it('stands down when an active message-level automation exists', async () => {
    h.state.autoResponders = [{ id: 'auto-1' }]
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('does not send when the atomic slot claim loses the race', async () => {
    h.state.claim = false
    await dispatchInboundToAiReply(ARGS)
    // It still attempts the claim, but the send is skipped.
    expect(h.state.rpcCalls).toHaveLength(1)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when AI is off / not configured', async () => {
    h.loadAiConfig.mockResolvedValue(null)
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when auto-reply is disabled for the account', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ autoReplyEnabled: false }))
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when a human agent is assigned', async () => {
    h.state.conv = {
      assigned_agent_id: 'agent-9',
      ai_autoreply_disabled: false,
      ai_reply_count: 0,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when auto-reply was disabled on this conversation', async () => {
    h.state.conv = {
      assigned_agent_id: null,
      ai_autoreply_disabled: true,
      ai_reply_count: 0,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when the per-conversation cap is reached', async () => {
    h.state.conv = {
      assigned_agent_id: null,
      ai_autoreply_disabled: false,
      ai_reply_count: 3,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when there is nothing to reply to', async () => {
    h.buildConversationContext.mockResolvedValue([])
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })
})

describe('dispatchInboundToAiReply — handoff', () => {
  it('disables auto-reply, writes a summary, and does not send on handoff', async () => {
    h.generateReply.mockResolvedValue({ text: '', handoff: true, extracted: null, usage: null })
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({ ai_autoreply_disabled: true })
    expect(h.state.updatePayload?.ai_handoff_summary).toContain(
      'AI agent handed off',
    )
    // No handoff target configured → conversation left unassigned.
    expect(h.state.updatePayload).not.toHaveProperty('assigned_agent_id')
  })

  it('routes to the configured handoff agent on handoff', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ handoffAgentId: 'agent-7' }))
    h.generateReply.mockResolvedValue({ text: '', handoff: true, extracted: null, usage: null })
    await dispatchInboundToAiReply(ARGS)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      assigned_agent_id: 'agent-7',
    })
  })
})

// ── Order-collection guard ──────────────────────────────────────────────
// These tests verify that:
//   a) orderCollectionEnabled: false → ZERO calls to any order-collection
//      function → behavior identical to pre-feature code.
//   b) orderCollectionEnabled: true → correct calls in correct order.
//   c) DB double-check prevents premature confirmation.
describe('dispatchInboundToAiReply — order-collection guard', () => {
  it('does NOT call any order-collection fn when orderCollectionEnabled is false', async () => {
    // Default aiConfig() has orderCollectionEnabled: false
    await dispatchInboundToAiReply(ARGS)

    // The guard must prevent every order-collection call.
    expect(h.loadOrderFormFields).not.toHaveBeenCalled()
    expect(h.ensureActiveOrder).not.toHaveBeenCalled()
    expect(h.getMissingFields).not.toHaveBeenCalled()
    expect(h.upsertOrderFields).not.toHaveBeenCalled()
    expect(h.confirmOrder).not.toHaveBeenCalled()

    // Normal reply path must complete exactly as before.
    expect(h.state.rpcCalls).toEqual([
      { name: 'claim_ai_reply_slot', args: { conversation_id: 'conv-1', max_replies: 3 } },
    ])
    expect(h.engineSendText).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv-1', text: 'Hello!' }),
    )
  })

  it('passes orderMode: false to generateReply when orderCollectionEnabled is false', async () => {
    await dispatchInboundToAiReply(ARGS)
    // orderMode must be falsy — parseGeneration skips the JSON block regex.
    expect(h.generateReply.mock.calls[0][0].orderMode).toBeFalsy()
  })

  it('calls loadOrderFormFields when orderCollectionEnabled is true', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ orderCollectionEnabled: true }))
    // No form fields configured yet → order mode silently skips, reply still fires.
    h.loadOrderFormFields.mockResolvedValue([])

    await dispatchInboundToAiReply(ARGS)

    expect(h.loadOrderFormFields).toHaveBeenCalledWith(expect.anything(), 'acct-1')
    // No active order created when form has no fields.
    expect(h.ensureActiveOrder).not.toHaveBeenCalled()
    // Normal reply still fires.
    expect(h.engineSendText).toHaveBeenCalled()
  })

  it('upserts extracted values when order mode is active and model extracts data', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ orderCollectionEnabled: true }))
    h.loadOrderFormFields.mockResolvedValue([
      { field_key: 'name', field_label: 'اسم العميل', field_type: 'text', choices: null },
    ])
    h.ensureActiveOrder.mockResolvedValue({ orderId: 'order-1', collectedFields: {} })
    h.getMissingFields.mockResolvedValue([
      { field_key: 'name', field_label: 'اسم العميل', field_type: 'text', choices: null },
    ])
    h.generateReply.mockResolvedValue({
      text: 'ما هو اسمك؟',
      handoff: false,
      usage: null,
      extracted: { extracted: { name: 'محمد' }, confirmed: false, new_order: false },
    })

    await dispatchInboundToAiReply(ARGS)

    // Extracted value must be saved.
    expect(h.upsertOrderFields).toHaveBeenCalledWith(
      expect.anything(), 'order-1', 'acct-1', { name: 'محمد' },
    )
    // Not confirmed yet → confirmOrder must NOT be called.
    expect(h.confirmOrder).not.toHaveBeenCalled()
    // Reply is still delivered to the customer.
    expect(h.engineSendText).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'ما هو اسمك؟' }),
    )
  })

  it('confirms order when model signals confirmed AND DB confirms complete', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ orderCollectionEnabled: true }))
    h.loadOrderFormFields.mockResolvedValue([
      { field_key: 'name', field_label: 'Name', field_type: 'text', choices: null },
    ])
    h.ensureActiveOrder.mockResolvedValue({ orderId: 'order-2', collectedFields: { name: 'علي' } })
    h.getMissingFields.mockResolvedValue([]) // all required fields filled
    h.generateReply.mockResolvedValue({
      text: 'تم تأكيد طلبك!',
      handoff: false,
      usage: null,
      extracted: { extracted: {}, confirmed: true, new_order: false },
    })
    h.checkOrderComplete.mockResolvedValue(true) // DB agrees: complete

    await dispatchInboundToAiReply(ARGS)

    expect(h.checkOrderComplete).toHaveBeenCalledWith(expect.anything(), 'order-2')
    expect(h.confirmOrder).toHaveBeenCalledWith(expect.anything(), 'order-2', 'acct-1')
    expect(h.engineSendText).toHaveBeenCalled()
  })

  it('does NOT confirm when model hallucinates confirmed but DB says incomplete', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ orderCollectionEnabled: true }))
    h.loadOrderFormFields.mockResolvedValue([
      { field_key: 'phone', field_label: 'Phone', field_type: 'text', choices: null },
    ])
    h.ensureActiveOrder.mockResolvedValue({ orderId: 'order-3', collectedFields: {} })
    h.getMissingFields.mockResolvedValue([
      { field_key: 'phone', field_label: 'Phone', field_type: 'text', choices: null },
    ])
    h.generateReply.mockResolvedValue({
      text: 'شكراً!',
      handoff: false,
      usage: null,
      // Model hallucinated confirmed: true even though 'phone' is still missing.
      extracted: { extracted: {}, confirmed: true, new_order: false },
    })
    h.checkOrderComplete.mockResolvedValue(false) // DB says NOT complete

    await dispatchInboundToAiReply(ARGS)

    // DB check was done.
    expect(h.checkOrderComplete).toHaveBeenCalled()
    // But confirmOrder must NOT be called — the DB guard holds.
    expect(h.confirmOrder).not.toHaveBeenCalled()
  })
})
