import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/automations/admin-client';
import { getRawStoreById, getDecryptedCredentials } from '@/lib/ecommerce/store-crud';
import { verifyWooCommerceWebhook } from '@/lib/ecommerce/woocommerce/verify';
import { normalizeWooCommercePayload } from '@/lib/ecommerce/normalize';
import { processNormalizedEcommerceEvent } from '@/lib/ecommerce/event-processor';
import { checkAccountFeature } from '@/lib/plans/check-usage-limit';

export const maxDuration = 60;

/**
 * POST /api/webhooks/woocommerce?store_id=<store_id>
 * Public Webhook endpoint for WooCommerce store events & Cart Abandonment.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('store_id');

    if (!storeId) {
      console.warn('[webhooks/woocommerce] Missing store_id in query params');
      return NextResponse.json({ error: 'Missing store_id parameter' }, { status: 400 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-wc-webhook-signature') || '';
    const topic = request.headers.get('x-wc-webhook-topic') || '';
    const deliveryId =
      request.headers.get('x-wc-webhook-delivery-id') ||
      request.headers.get('x-wc-webhook-id') ||
      '';

    console.log(`[webhooks/woocommerce] Received webhook for store ${storeId}, topic: ${topic}, deliveryId: ${deliveryId}`);

    const db = supabaseAdmin();
    const store = await getRawStoreById(db, storeId);

    if (!store || store.provider !== 'woocommerce') {
      console.warn(`[webhooks/woocommerce] Store not found: ${storeId}`);
      return NextResponse.json({ error: 'Store not found or invalid provider' }, { status: 404 });
    }

    if (store.status === 'disconnected') {
      console.warn(`[webhooks/woocommerce] Store is disconnected: ${storeId}`);
      return NextResponse.json({ error: 'Store is disconnected' }, { status: 400 });
    }

    // Check account entitlement
    const { allowed } = await checkAccountFeature(store.account_id, 'woocommerce_integration');
    if (!allowed) {
      console.warn(`[webhooks/woocommerce] Account ${store.account_id} not entitled to woocommerce_integration`);
      return NextResponse.json({ error: 'Plan does not allow WooCommerce integration' }, { status: 403 });
    }

    // Verify webhook signature if webhook secret is configured and signature header is sent
    const creds = getDecryptedCredentials(store);
    if (creds.webhookSecret && signature) {
      const isValid = verifyWooCommerceWebhook(rawBody, signature, creds.webhookSecret);
      if (!isValid) {
        console.warn(`[webhooks/woocommerce] Invalid HMAC signature for store ${storeId}`);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse JSON or form-urlencoded payload
    let payload: Record<string, unknown> = {};
    if (rawBody && rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        try {
          const params = new URLSearchParams(rawBody);
          payload = Object.fromEntries(params.entries());
        } catch {
          payload = { raw: rawBody };
        }
      }
    }

    // Handle ping or sample test triggers immediately with 200 OK
    const isSample =
      topic === 'ping' ||
      rawBody.includes('webhook_id') ||
      rawBody.includes('sample') ||
      payload.type === 'sample' ||
      payload.action === 'sample' ||
      (payload.webhook_id && !payload.id && !payload.billing);

    if (isSample && (!payload.id || payload.id === 'sample' || !payload.billing)) {
      console.log(`[webhooks/woocommerce] Sample trigger / ping received successfully for store ${storeId}`);
      return NextResponse.json({ ok: true, success: true, received: true, sample: true });
    }

    // Normalize event
    const normalized = normalizeWooCommercePayload(topic, payload, store.id, deliveryId);
    if (!normalized) {
      console.log(`[webhooks/woocommerce] Event ignored or unhandled: topic ${topic}`);
      return NextResponse.json({ ok: true, ignored: true });
    }

    console.log(`[webhooks/woocommerce] Normalized event: ${normalized.event}, customer: ${normalized.customer.phone || normalized.customer.name}, order: ${normalized.order?.number}`);

    // Process event directly and return result
    const processResult = await processNormalizedEcommerceEvent(normalized, store.account_id);
    console.log(`[webhooks/woocommerce] Process result:`, processResult);

    return NextResponse.json({
      ok: true,
      success: true,
      received: true,
      status: processResult.status,
      trigger: processResult.automationTrigger,
    });
  } catch (err) {
    console.error('[webhooks/woocommerce] Error handling webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
