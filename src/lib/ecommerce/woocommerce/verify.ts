import crypto from 'node:crypto';

/**
 * Verify WooCommerce Webhook Signature using HMAC-SHA256.
 * WooCommerce sends base64-encoded HMAC in 'X-WC-Webhook-Signature'.
 */
export function verifyWooCommerceWebhook(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const digest = hmac.digest('base64');

    const bufDigest = Buffer.from(digest, 'utf8');
    const bufSig = Buffer.from(signature, 'utf8');

    if (bufDigest.length !== bufSig.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufDigest, bufSig);
  } catch (err) {
    console.error('[woocommerce/verify] HMAC verification error:', err);
    return false;
  }
}
