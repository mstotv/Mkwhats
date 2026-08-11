import { supabaseAdmin } from './admin-client'
import { loadAiConfig } from './config'
import { buildConversationContext } from './context'
import { retrieveKnowledge } from './knowledge'
import { generateReply } from './generate'
import { buildSystemPrompt } from './defaults'
import { buildHandoffSummary } from './handoff'
import { logAiUsage } from './usage'
import { latestUserMessage } from './query'
import {
  cancelAndCreateOrder,
  checkOrderComplete,
  confirmOrder,
  ensureActiveOrder,
  getMissingFields,
  loadOrderFormFields,
  upsertOrderFields,
} from './order-collection'
import { engineSendText } from '@/lib/flows/meta-send'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

interface DispatchArgs {
  /** Tenancy key — drives config, contact, and whatsapp_config lookups. */
  accountId: string
  conversationId: string
  contactId: string
  /** The account's WhatsApp config owner, used for the outbound send's
   *  audit columns (mirrors how the flow runner passes it through). */
  configOwnerUserId: string
}

/**
 * AI auto-reply for a freshly-arrived inbound message.
 *
 * Invoked from the WhatsApp webhook's `after()` block, only when no
 * deterministic flow consumed the message (flows win). Mirrors the flow
 * runner's contract: it owns its try/catch and NEVER throws — a failing
 * or slow LLM call must not affect the webhook's 200 to Meta.
 *
 * Eligibility gates (any → silent no-op):
 *   - AI off / auto-reply disabled for the account
 *   - a human agent is assigned (they own the thread)
 *   - auto-reply was disabled for this conversation (prior handoff)
 *   - the per-conversation reply cap is reached
 *   - there's nothing to reply to
 *
 * When `config.orderCollectionEnabled` is true the bot enters order-
 * collection mode: it injects the order form into the system prompt,
 * extracts structured values from the model's JSON block, and confirms
 * the order when the customer explicitly agrees. Accounts where the
 * feature is off pass through the original code path unchanged.
 *
 * The 24h WhatsApp session window is inherently open here — we're
 * reacting to a customer message that just landed — so no separate
 * window check is needed.
 */
export async function dispatchInboundToAiReply(
  args: DispatchArgs,
): Promise<void> {
  const { accountId, conversationId, contactId, configOwnerUserId } = args

  try {
    const db = supabaseAdmin()
    console.log('[DIAG][ai auto-reply] entered | accountId:', accountId, 'conversationId:', conversationId)

    const config = await loadAiConfig(db, accountId)
    console.log('[DIAG][ai auto-reply] config loaded:', config ? `isActive=${config.isActive} autoReply=${config.autoReplyEnabled}` : 'NULL (no config or inactive)')
    if (!config || !config.autoReplyEnabled) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: config null or autoReplyEnabled=false')
      return
    }

    // Deterministic, user-configured responders win over the LLM — the
    // caller already excludes messages a Flow consumed. Message-level
    // automations (`new_message_received` / `keyword_match`) are
    // dispatched independently for this same inbound and may send their
    // own reply, so if the account has any active one we stand down to
    // avoid double-texting the customer. (Relationship triggers like
    // `first_inbound_message` don't count — they're not per-message
    // auto-responders.)
    const { data: autoResponders } = await db
      .from('automations')
      .select('id')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .in('trigger_type', ['new_message_received', 'keyword_match'])
      .limit(1)
    console.log('[DIAG][ai auto-reply] active autoResponders count:', autoResponders?.length ?? 0)
    if (autoResponders && autoResponders.length > 0) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: active automation auto-responder exists — standing down')
      return
    }

    const { data: conv, error: convErr } = await db
      .from('conversations')
      .select('assigned_agent_id, ai_autoreply_disabled, ai_reply_count')
      .eq('id', conversationId)
      .maybeSingle()
    console.log('[DIAG][ai auto-reply] conv lookup:', conv ? `assignedAgent=${conv.assigned_agent_id} disabled=${conv.ai_autoreply_disabled} replyCount=${conv.ai_reply_count}` : `ERROR=${convErr?.message}`)
    if (convErr || !conv) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: conv not found or DB error')
      return
    }
    if (conv.assigned_agent_id) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: human agent assigned')
      return
    }
    if (conv.ai_autoreply_disabled) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: ai_autoreply_disabled=true')
      return
    }
    // Cheap early-out; the authoritative cap check is the atomic claim
    // below (this read can race a concurrent inbound).
    if (conv.ai_reply_count >= config.autoReplyMaxPerConversation) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: reply cap reached', conv.ai_reply_count, '>=', config.autoReplyMaxPerConversation)
      return
    }

    const messages = await buildConversationContext(db, conversationId)
    console.log('[DIAG][ai auto-reply] buildConversationContext returned', messages.length, 'messages')
    if (messages.length === 0) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: no messages in conversation context')
      return
    }

    // Account-wide throttle on the shared BYO key. The per-conversation
    // cap bounds one thread; this bounds a burst across many threads (a
    // marketing blast landing 200 replies at once) so we never run the
    // owner's key past the provider's rate limit. Over the limit → skip
    // the auto-reply; the inbound still sits in the inbox for a human.
    const acctLimit = checkRateLimit(
      `ai-autoreply:${accountId}`,
      RATE_LIMITS.aiAutoReplyAccount,
    )
    console.log('[DIAG][ai auto-reply] rate limit check:', acctLimit.success ? 'OK' : 'EXCEEDED')
    if (!acctLimit.success) {
      console.warn(
        `[ai auto-reply] account ${accountId} hit the per-account rate limit — skipping this inbound.`,
      )
      return
    }

    // ── Order-collection mode ──────────────────────────────────────
    // When the account has order-collection enabled we build an
    // order-aware system prompt and process the model's JSON block.
    // Accounts where the feature is off skip this block entirely and
    // continue with the original prompt-only path below.
    let orderContext:
      | {
          orderId: string
          missingFields: Awaited<ReturnType<typeof getMissingFields>>
          collectedFields: Record<string, string>
          readyToConfirm: boolean
        }
      | undefined

    if (config.orderCollectionEnabled) {
      // Load the account's order form fields. If none are configured yet
      // the owner hasn't finished setup — skip order mode silently.
      const formFields = await loadOrderFormFields(db, accountId)
      if (formFields.length > 0) {
        // Get or create the active collecting order for this conversation.
        const activeOrder = await ensureActiveOrder(
          db,
          conversationId,
          accountId,
          contactId,
        )

        if (activeOrder) {
          const missingFields = await getMissingFields(db, activeOrder.orderId)
          const readyToConfirm = missingFields.length === 0

          orderContext = {
            orderId: activeOrder.orderId,
            missingFields,
            collectedFields: activeOrder.collectedFields,
            readyToConfirm,
          }
        }
      }
    }
    // ── End order-collection setup ─────────────────────────────────

    // Ground the reply in the account's knowledge base (best-effort).
    const knowledge = await retrieveKnowledge(
      db,
      accountId,
      config,
      latestUserMessage(messages),
    )

    const systemPrompt = buildSystemPrompt({
      userPrompt: config.systemPrompt,
      mode: 'auto_reply',
      knowledge,
      // Pass orderContext only when order mode is active AND we have a
      // live order. Undefined → buildSystemPrompt skips the order block.
      ...(orderContext
        ? {
            orderContext: {
              missingFields: orderContext.missingFields,
              collectedFields: orderContext.collectedFields,
              readyToConfirm: orderContext.readyToConfirm,
            },
          }
        : {}),
    })

    const { text, handoff, usage, extracted } = await generateReply({
      config,
      systemPrompt,
      messages,
      // Tell parseGeneration to attempt JSON block extraction only when
      // we're in order mode — avoids regex overhead on normal replies.
      orderMode: config.orderCollectionEnabled && !!orderContext,
    })

    // Record token spend on the account's BYO key. Fire-and-forget so it
    // never adds latency to the customer-facing send: `logAiUsage`
    // swallows its own errors, so the floating promise can't reject.
    // Logged regardless of handoff — the provider call happened either way.
    void logAiUsage(db, {
      accountId,
      conversationId,
      mode: 'auto_reply',
      provider: config.provider,
      model: config.model,
      usage,
    })

    if (handoff || !text) {
      // The model can't (or shouldn't) answer — stop auto-replying on
      // this thread and hand it to a human. We (a) pause the bot here
      // (sticky until re-enabled), (b) route the conversation to the
      // configured handoff agent — null leaves it in the shared queue —
      // and (c) leave a short internal note so whoever picks it up has
      // context. Assigning fires the `on_conversation_assigned` trigger,
      // which notifies the agent.
      const summary = buildHandoffSummary({
        messages,
        replyCount: conv.ai_reply_count ?? 0,
      })
      const update: Record<string, unknown> = {
        ai_autoreply_disabled: true,
        ai_handoff_summary: summary,
      }
      // Only set the assignee when a target is configured AND the thread
      // isn't already owned — never stomp an existing human assignment.
      if (config.handoffAgentId && !conv.assigned_agent_id) {
        update.assigned_agent_id = config.handoffAgentId
      }
      await db.from('conversations').update(update).eq('id', conversationId)
      return
    }

    // ── Process order extraction (order mode only) ─────────────────
    if (orderContext && extracted) {
      const { orderId } = orderContext

      // If the model detected the customer wants a new order, cancel the
      // current one and open a fresh one. The text reply is still sent
      // so the customer isn't left hanging.
      if (extracted.new_order) {
        const fresh = await cancelAndCreateOrder(
          db,
          conversationId,
          accountId,
          contactId,
        )
        if (fresh) {
          // Update orderContext so confirmation check below uses the new id.
          orderContext = {
            ...orderContext,
            orderId: fresh.orderId,
            collectedFields: {},
            readyToConfirm: false,
          }
        }
        // After opening a fresh order we fall through to send the text;
        // values extracted in this same message are intentionally NOT saved
        // here — they belong to the new order and the AI will re-ask.
      } else {
        // Save any newly extracted values for the current order.
        await upsertOrderFields(db, orderId, accountId, extracted.extracted)

        // Confirm the order only when:
        //   a) the model signalled confirmed: true (customer said yes)
        //   b) the DB confirms all required fields are present
        // The DB check guards against the model hallucinating confirmed:true
        // before the form is actually complete.
        if (extracted.confirmed) {
          const complete = await checkOrderComplete(db, orderId)
          if (complete) {
            await confirmOrder(db, orderId, accountId)
          }
          // If not complete despite confirmed:true → do nothing. The next
          // turn the model will see the missing fields and re-ask.
        }
      }
    }
    // ── End order processing ───────────────────────────────────────

    // Atomically claim a reply slot: the cap check + increment happen in
    // one UPDATE, so concurrent inbounds can never overshoot the cap. If
    // another inbound just took the last slot, `claimed` is false and we
    // skip the send. (We consume a slot slightly before the send lands —
    // fail-safe: under-reply rather than over-reply.)
    console.log('[DIAG][ai auto-reply] calling claim_ai_reply_slot RPC...')
    const { data: claimed, error: claimErr } = await db.rpc(
      'claim_ai_reply_slot',
      {
        conversation_id: conversationId,
        max_replies: config.autoReplyMaxPerConversation,
      },
    )
    console.log('[DIAG][ai auto-reply] claim_ai_reply_slot result | claimed:', claimed, 'claimErr:', claimErr?.message)
    if (claimErr) {
      // A real error here (vs. losing the cap race) is almost always a
      // deploy issue — e.g. `claim_ai_reply_slot` not EXECUTE-able by the
      // service role, or the migration not applied. Log it loudly: a
      // silent return makes "auto-reply never fires" undiagnosable.
      console.error('[ai auto-reply] claim_ai_reply_slot failed:', claimErr)
      return
    }
    if (claimed !== true) {
      console.log('[DIAG][ai auto-reply] ⚠ EARLY EXIT: lost cap race (claimed=', claimed, ')')
      return
    }

    console.log('[DIAG][ai auto-reply] ✅ sending reply via engineSendText | text snippet:', JSON.stringify(text.slice(0, 80)))
    await engineSendText({
      accountId,
      userId: configOwnerUserId,
      conversationId,
      contactId,
      text,
      aiGenerated: true,
    })
    console.log('[DIAG][ai auto-reply] ✅ engineSendText done')
  } catch (err) {
    console.error('[ai auto-reply] dispatch failed:', err)
  }
}
