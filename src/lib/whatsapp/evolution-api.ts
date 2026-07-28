/**
 * Evolution API — REST client helpers.
 *
 * All outbound calls to the Evolution API server are funnelled
 * through this module. Routes are thin adapters that call these
 * helpers; no route file contains a raw `fetch` to Evolution.
 *
 * Architecture notes
 * ──────────────────
 * • This project runs a single SaaS-owned Evolution server
 *   (EVOLUTION_SERVER_URL env var). Each customer account gets
 *   its own *instance* on that server, named deterministically
 *   from the account_id so creation is idempotent.
 *
 * • Authentication uses two keys:
 *     Global API key  (EVOLUTION_GLOBAL_API_KEY) — only used
 *       for instance creation and deletion; never stored per-
 *       account; never returned to the client.
 *     Instance API key — returned by Evolution on create, stored
 *       encrypted in whatsapp_config.evolution_api_key, used for
 *       all per-instance operations (send, QR, status).
 *
 * • Functions take named-parameter objects (same convention as
 *   meta-api.ts) to prevent arg-swap bugs.
 */

// ─── Config helpers ──────────────────────────────────────────

/**
 * Returns the Evolution server base URL from env.
 * Throws clearly if it is missing so the error surfaces at call
 * time (not at module load, which would crash the entire app on
 * any deployment that doesn't use Evolution).
 */
export function getEvolutionServerUrl(): string {
  const url = process.env.EVOLUTION_SERVER_URL
  if (!url) {
    throw new Error(
      'EVOLUTION_SERVER_URL is not set. Add it to your environment variables.'
    )
  }
  return url.replace(/\/$/, '') // strip trailing slash
}

/**
 * Returns the global Evolution API key from env.
 * Only called for admin operations (create / delete instance).
 */
export function getEvolutionGlobalApiKey(): string {
  const key = process.env.EVOLUTION_GLOBAL_API_KEY
  if (!key) {
    throw new Error(
      'EVOLUTION_GLOBAL_API_KEY is not set. Add it to your environment variables.'
    )
  }
  return key
}

/**
 * Derives a stable, URL-safe instance name from an account_id.
 * Evolution instance names must be alphanumeric + hyphens only.
 * Using the raw UUID (hyphens allowed) keeps it human-readable
 * in the Evolution dashboard and deterministic across retries.
 */
export function instanceNameForAccount(accountId: string): string {
  // e.g. "acct-550e8400-e29b-41d4-a716-446655440000"
  return `acct-${accountId}`
}

// ─── Internal fetch helper ────────────────────────────────────

interface EvolutionErrorBody {
  message?: string
  error?: string
}

async function evolutionFetch<T>(
  path: string,
  options: RequestInit & { apiKey: string }
): Promise<T> {
  const { apiKey, ...fetchOptions } = options
  const serverUrl = getEvolutionServerUrl()
  const url = `${serverUrl}${path}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
      ...(fetchOptions.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Evolution API error: HTTP ${response.status}`
    try {
      const body = (await response.json()) as EvolutionErrorBody
      if (body.message) message = body.message
      else if (body.error) message = body.error
    } catch {
      // response body wasn't JSON — keep the fallback
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

// ─── Instance management ─────────────────────────────────────

export interface EvolutionInstanceCreateArgs {
  /** Custom or generated instance name. */
  instanceName: string
  /** Custom security token/key for this instance (optional). */
  token?: string
  /** Target phone number in E.164 format (optional). */
  number?: string
  /** Webhook URL that Evolution will POST events to. */
  webhookUrl: string
  /** Optional: request QR code immediately on creation. */
  qrcode?: boolean
}

export interface EvolutionInstanceCreateResult {
  /** The instance name as confirmed by Evolution. */
  instanceName: string
  /**
   * Per-instance API key returned by Evolution or provided by caller.
   * Encrypt and store in whatsapp_config.evolution_api_key.
   */
  apiKey: string
  /** Base64 QR code string (only present when qrcode=true and
   *  Evolution hasn't connected yet). */
  qrBase64?: string | null
}

/**
 * Creates a new Evolution instance for an account.
 * Idempotent on Evolution's side — if the instance already exists
 * the server returns the existing one. Call with the global key.
 */
export async function createEvolutionInstance(
  args: EvolutionInstanceCreateArgs
): Promise<EvolutionInstanceCreateResult> {
  const globalKey = getEvolutionGlobalApiKey()

  const body: Record<string, unknown> = {
    instanceName: args.instanceName,
    qrcode: args.qrcode ?? true,
    integration: 'WHATSAPP-BAILEYS',
    webhook: {
      enabled: true,
      url: args.webhookUrl,
      byEvents: false, // receive all events, filtered server-side
      base64: true,
      events: [
        'QRCODE_UPDATED',
        'CONNECTION_UPDATE',
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'SEND_MESSAGE',
      ],
    },
  }

  if (args.token?.trim()) {
    body.token = args.token.trim()
  }

  if (args.number?.trim()) {
    body.number = args.number.replace(/\D/g, '')
  }

  const data = await evolutionFetch<{
    instance?: { instanceName?: string; name?: string; status?: string }
    hash?: { apikey?: string }
    token?: string
    qrcode?: { base64?: string }
  }>('/instance/create', {
    method: 'POST',
    apiKey: globalKey,
    body: JSON.stringify(body),
  })

  const returnedInstanceName = data.instance?.instanceName ?? data.instance?.name ?? args.instanceName
  const returnedApiKey = data.hash?.apikey ?? data.token ?? args.token ?? ''

  return {
    instanceName: returnedInstanceName,
    apiKey: returnedApiKey,
    qrBase64: data.qrcode?.base64 ?? null,
  }
}

/**
 * Deletes an Evolution instance permanently.
 * Called when the account disconnects from Evolution.
 * Uses the global key (instance key may be lost if DB row deleted).
 */
export async function deleteEvolutionInstance(args: {
  instanceName: string
}): Promise<void> {
  const globalKey = getEvolutionGlobalApiKey()
  await evolutionFetch<unknown>(`/instance/delete/${args.instanceName}`, {
    method: 'DELETE',
    apiKey: globalKey,
  })
}

// ─── QR code ─────────────────────────────────────────────────

export interface EvolutionQrResult {
  /** Base64-encoded PNG of the QR code, ready for <img src>. */
  base64: string | null
  /** Raw QR string (for libraries that render QR themselves). */
  code: string | null
  /** True when the instance is already connected (no QR needed). */
  connected: boolean
}

/**
 * Fetches the current QR code for an instance.
 * Returns { connected: true } when the phone is already paired.
 */
export async function getEvolutionQr(args: {
  instanceName: string
  instanceApiKey: string
}): Promise<EvolutionQrResult> {
  try {
    const data = await evolutionFetch<{
      base64?: string
      code?: string
    }>(`/instance/connect/${args.instanceName}`, {
      method: 'GET',
      apiKey: args.instanceApiKey,
    })

    return {
      base64: data.base64 ?? null,
      code: data.code ?? null,
      connected: !data.base64 && !data.code,
    }
  } catch (err) {
    // Evolution returns 404 / specific error when already connected
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.toLowerCase().includes('already connected') ||
      message.includes('401') ||
      message.includes('close')
    ) {
      return { base64: null, code: null, connected: true }
    }
    throw err
  }
}

// ─── Connection state ─────────────────────────────────────────

export type EvolutionConnectionState =
  | 'open'         // connected and ready
  | 'connecting'   // QR shown, waiting for scan
  | 'close'        // disconnected / logged out

export interface EvolutionStatusResult {
  state: EvolutionConnectionState
  /** WhatsApp phone number when connected, e.g. "+9665XXXXXXXX". */
  phone: string | null
}

/**
 * Returns the current connection state of an instance.
 */
export async function getEvolutionConnectionState(args: {
  instanceName: string
  instanceApiKey: string
}): Promise<EvolutionStatusResult> {
  const data = await evolutionFetch<{
    instance?: {
      state?: string
      ownerJid?: string
      owner?: string
      profilePictureUrl?: string
    }
    state?: string
    ownerJid?: string
    owner?: string
  }>(`/instance/connectionState/${args.instanceName}`, {
    method: 'GET',
    apiKey: args.instanceApiKey,
  })

  // Evolution v2 wraps state in `instance.state`; v1 has it at root
  const rawState: string = (data.instance?.state ?? data.state ?? 'close').toLowerCase()
  const state: EvolutionConnectionState =
    rawState === 'open' ? 'open'
    : rawState === 'connecting' ? 'connecting'
    : 'close'

  let phone: string | null = null
  const rawOwner =
    data.instance?.ownerJid ??
    data.ownerJid ??
    data.instance?.owner ??
    data.owner

  if (rawOwner && typeof rawOwner === 'string') {
    const digits = rawOwner.split('@')[0].replace(/\D/g, '')
    if (digits) {
      phone = `+${digits}`
    }
  }

  return { state, phone }
}

// ─── Sending messages ─────────────────────────────────────────

export interface EvolutionSendTextArgs {
  instanceName: string
  instanceApiKey: string
  /** Recipient phone in E.164 format, e.g. "+966501234567". */
  to: string
  text: string
}

export interface EvolutionSendResult {
  /** Evolution's message key identifier. */
  messageId: string
}

/**
 * Sends a plain text message via Evolution.
 */
export async function sendEvolutionTextMessage(
  args: EvolutionSendTextArgs
): Promise<EvolutionSendResult> {
  // Evolution expects the phone without the leading "+" and with
  // the @s.whatsapp.net suffix for individual chats.
  const normalized = args.to.replace(/^\+/, '') + '@s.whatsapp.net'

  const data = await evolutionFetch<{
    key?: { id?: string }
    messageId?: string
  }>(`/message/sendText/${args.instanceName}`, {
    method: 'POST',
    apiKey: args.instanceApiKey,
    body: JSON.stringify({
      number: normalized,
      text: args.text,
    }),
  })

  const id = data.key?.id ?? data.messageId ?? ''
  return { messageId: id }
}

export interface EvolutionSendMediaArgs {
  instanceName: string
  instanceApiKey: string
  /** Recipient phone in E.164 format. */
  to: string
  mediatype: 'image' | 'video' | 'document' | 'audio'
  /** Publicly accessible URL of the media file. */
  media: string
  /** Optional caption (image/video/document only). */
  caption?: string
  /** Original filename (document only). */
  fileName?: string
}

/**
 * Sends a media message (image, video, document, audio) via Evolution.
 */
export async function sendEvolutionMediaMessage(
  args: EvolutionSendMediaArgs
): Promise<EvolutionSendResult> {
  const normalized = args.to.replace(/^\+/, '') + '@s.whatsapp.net'

  const data = await evolutionFetch<{
    key?: { id?: string }
    messageId?: string
  }>(`/message/sendMedia/${args.instanceName}`, {
    method: 'POST',
    apiKey: args.instanceApiKey,
    body: JSON.stringify({
      number: normalized,
      mediatype: args.mediatype,
      media: args.media,
      caption: args.caption ?? undefined,
      fileName: args.fileName ?? undefined,
    }),
  })

  const id = data.key?.id ?? data.messageId ?? ''
  return { messageId: id }
}

// ─── Webhook payload types ────────────────────────────────────

/**
 * Top-level shape of every webhook POST from Evolution.
 * Events are discriminated by `event`.
 */
export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: Record<string, unknown>
  date_time?: string
  sender?: string
  server_url?: string
  apikey?: string
}

export interface EvolutionQrUpdatedData {
  qrcode: {
    base64: string
    code: string
  }
}

export interface EvolutionConnectionUpdateData {
  state: string
  statusReason?: number
  /** Phone number in the format "5511999998888" (no + or @). */
  wuid?: string
}

/**
 * Shape of a single inbound message inside MESSAGES_UPSERT.
 */
export interface EvolutionInboundMessage {
  key: {
    remoteJid: string   // e.g. "5511999998888@s.whatsapp.net"
    fromMe: boolean
    id: string          // WhatsApp message ID (wamid equivalent)
  }
  message?: {
    conversation?: string
    extendedTextMessage?: { text: string }
    imageMessage?: { url?: string; caption?: string; mimetype?: string }
    videoMessage?: { url?: string; caption?: string; mimetype?: string }
    documentMessage?: { url?: string; fileName?: string; mimetype?: string }
    audioMessage?: { url?: string; mimetype?: string }
    locationMessage?: { degreesLatitude?: number; degreesLongitude?: number }
  }
  messageTimestamp?: number
  pushName?: string
}
