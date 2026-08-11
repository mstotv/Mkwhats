// ============================================================
// Shared types for the AI reply assistant (bring-your-own-key).
//
// One small provider-agnostic surface so the inbox draft route and the
// inbound auto-reply bot both talk to `generateReply` without caring
// whether the account is on OpenAI or Anthropic.
// ============================================================

// ── Order collection ────────────────────────────────────────

/** One field definition from `order_form_fields`, loaded from DB. */
export interface OrderField {
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'choice'
  choices: string[] | null
}

/**
 * Parsed output of the |||{...}||| JSON block the model embeds in its
 * reply when order-collection mode is active.
 *
 * - `extracted`: map of field_key → value gleaned from THIS message.
 *   Empty when the customer said nothing extractable.
 * - `confirmed`: the model decided the customer is explicitly confirming
 *   the order summary that was shown to them (not a mid-collection "ok").
 * - `new_order`: the customer is starting a fresh order; the route must
 *   cancel any stale 'collecting' order before creating a new one.
 */
export interface ExtractedOrderData {
  extracted: Record<string, string>
  confirmed: boolean
  new_order: boolean
}

export type AiProvider = 'openai' | 'anthropic' | 'gemini'

/**
 * Account AI setup, decrypted and ready to use. Produced by
 * `loadAiConfig` — `apiKey` is the plaintext BYO provider key
 * (stored AES-256-GCM-encrypted at rest).
 */
export interface AiConfig {
  provider: AiProvider
  model: string
  apiKey: string
  systemPrompt: string | null
  isActive: boolean
  autoReplyEnabled: boolean
  autoReplyMaxPerConversation: number
  /** Where auto-reply hands a conversation off when the model bails: an
   *  agent's `auth.users.id`, or null to leave it unassigned (drop into
   *  the shared queue). */
  handoffAgentId: string | null
  /** Optional OpenAI-compatible key for embeddings. When set, the
   *  knowledge base is embedded and semantic retrieval turns on; when
   *  null, retrieval falls back to lexical full-text search. */
  embeddingsApiKey: string | null
  /** When true the auto-reply bot enters order-collection mode for this
   *  account: it injects the order form fields into the system prompt
   *  and parses a structured JSON block from every model reply. */
  orderCollectionEnabled: boolean
}

/** A single conversation turn in the shape both providers accept. */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Token counts for one provider call, normalized across OpenAI
 * (`prompt`/`completion`) and Anthropic (`input`/`output`). Null when
 * the provider didn't return usage. Logged to `ai_usage_log`.
 */
export interface AiUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/** Raw text + usage a provider adapter returns before handoff parsing. */
export interface ProviderResult {
  text: string
  usage: AiUsage | null
}

/** Outcome of a generation call. */
export interface GenerateResult {
  /** The reply text, with any handoff sentinel and JSON block stripped. */
  text: string
  /** True when the model asked to hand off to a human (auto-reply mode). */
  handoff: boolean
  /** Provider token usage for this call, or null when unavailable. */
  usage: AiUsage | null
  /**
   * Structured data extracted by the model in order-collection mode.
   * Null when order-collection mode is off, or when the model's JSON
   * block was absent / malformed (safe fallback — text still delivered).
   */
  extracted: ExtractedOrderData | null
}

/**
 * Typed error for every AI failure mode. `status` maps cleanly to an
 * HTTP response in the draft route; `code` lets the UI/tests branch
 * (invalid_key vs rate_limited vs timeout, etc.).
 */
export class AiError extends Error {
  readonly code: string
  readonly status: number
  constructor(message: string, opts: { code?: string; status?: number } = {}) {
    super(message)
    this.name = 'AiError'
    this.code = opts.code ?? 'ai_error'
    this.status = opts.status ?? 502
  }
}
