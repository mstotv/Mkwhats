export interface ImpersonationPayload {
  log_id: string
  admin_user_id: string
  target_user_id: string
  target_account_id: string
  target_user_name: string
  target_user_email: string
  target_account_name: string
  exp: number // expiration timestamp in seconds (24h max age)
}

export const IMPERSONATION_COOKIE_NAME = 'wacrm_impersonate'
export const IMPERSONATION_DISPLAY_COOKIE_NAME = 'wacrm_impersonate_display'
export const IMPERSONATION_HEADER_NAME = 'x-impersonation-context'

function getSecretKey(): string {
  const secret = process.env.ADMIN_IMPERSONATION_SECRET
  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY ERROR: Missing required environment variable "ADMIN_IMPERSONATION_SECRET". Please define it in your .env.local file.'
    )
  }
  return secret
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

async function computeHmacSha256(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secretKey)
  const messageData = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return base64UrlEncode(signature)
}

export async function signImpersonationToken(payload: ImpersonationPayload): Promise<string> {
  const secret = getSecretKey()
  const encoder = new TextEncoder()
  const payloadJson = JSON.stringify(payload)
  const payloadBase64 = base64UrlEncode(encoder.encode(payloadJson))
  const signature = await computeHmacSha256(payloadBase64, secret)
  return `${payloadBase64}.${signature}`
}

export async function verifyImpersonationToken(
  token: string
): Promise<ImpersonationPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadBase64, signature] = parts
    const secret = getSecretKey()
    const expectedSignature = await computeHmacSha256(payloadBase64, secret)

    if (signature !== expectedSignature) {
      return null
    }

    const payloadJson = base64UrlDecode(payloadBase64)
    const payload: ImpersonationPayload = JSON.parse(payloadJson)

    // Check expiration
    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (payload.exp && nowInSeconds > payload.exp) {
      return null
    }

    return payload
  } catch (err) {
    return null
  }
}

export function isImpersonatingClient(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes(`${IMPERSONATION_DISPLAY_COOKIE_NAME}=`)
}
