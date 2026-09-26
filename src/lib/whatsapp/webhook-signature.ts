import crypto from 'node:crypto'

/**
 * Verify the HMAC-SHA256 signature Meta attaches to webhook POSTs.
 *
 * Meta signs the raw request body with your App Secret and sends the
 * result in the `x-hub-signature-256: sha256=<hex>` header. Without
 * verification, anyone who knows our webhook URL can POST fabricated
 * status updates and drift broadcast counts arbitrarily.
 *
 * Reference:
 *   https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verify-payloads
 *
 * Contract:
 *   `META_APP_SECRET` is **required**. If it's missing we fail closed —
 *   every request is rejected until the operator configures the
 *   secret. A previous version fell open with a warning log, which is
 *   unsafe for a public template: anyone who forgets the env var would
 *   be running a fully spoofable webhook.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretCandidate?: string | null,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false

  const tryVerify = (secret: string): boolean => {
    if (!secret || secret === 'your-meta-app-secret') return false
    try {
      const expected =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

      const a = Buffer.from(signatureHeader)
      const b = Buffer.from(expected)
      if (a.length !== b.length) return false
      return crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  }

  // 1. Try account-specific secret if provided
  if (secretCandidate && tryVerify(secretCandidate)) {
    return true
  }

  // 2. Try environment secret
  const envSecret = process.env.META_APP_SECRET
  if (envSecret && tryVerify(envSecret)) {
    return true
  }

  if (!envSecret && !secretCandidate) {
    console.error(
      '[webhook] META_APP_SECRET is not set — rejecting request. ' +
        'Configure the env var (Meta → App Settings → Basic → App Secret) or account App Secret ' +
        'to enable signature verification.',
    )
  }

  return false
}
