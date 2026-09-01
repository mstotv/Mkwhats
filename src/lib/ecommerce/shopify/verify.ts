import crypto from 'node:crypto';

/**
 * Verify Shopify Webhook Signature using HMAC-SHA256.
 * Shopify sends base64-encoded HMAC in 'X-Shopify-Hmac-Sha256'.
 */
export function verifyShopifyWebhook(
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
    console.error('[shopify/verify] HMAC verification error:', err);
    return false;
  }
}
