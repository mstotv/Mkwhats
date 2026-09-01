import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/automations/admin-client';
import { getRawStoreById, getDecryptedCredentials } from '@/lib/ecommerce/store-crud';
import { verifyWooCommerceWebhook } from '@/lib/ecommerce/woocommerce/verify';
import { normalizeWooCommercePayload } from '@/lib/ecommerce/normalize';
import { processNormalizedEcommerceEvent } from '@/lib/ecommerce/event-processor';
import { checkAccountFeature } from '@/lib/plans/check-usage-limit';

export const maxDuration = 60;

/**
 * POST /api/webhooks/woocommerce?store_id=<store_id>
 * Public Webhook endpoint for WooCommerce store events.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id parameter' }, { status: 400 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-wc-webhook-signature') || '';
    const topic = request.headers.get('x-wc-webhook-topic') || '';
    const deliveryId =
      request.headers.get('x-wc-webhook-delivery-id') ||
      request.headers.get('x-wc-webhook-id') ||
      '';

    const db = supabaseAdmin();
    const store = await getRawStoreById(db, storeId);

    if (!store || store.provider !== 'woocommerce') {
      return NextResponse.json({ error: 'Store not found or invalid provider' }, { status: 404 });
    }

    if (store.status === 'disconnected') {
      return NextResponse.json({ error: 'Store is disconnected' }, { status: 400 });
    }

    // Check account entitlement
    const { allowed } = await checkAccountFeature(store.account_id, 'woocommerce_integration');
    if (!allowed) {
      console.warn(`[webhooks/woocommerce] Account ${store.account_id} not entitled to woocommerce_integration`);
      return NextResponse.json({ error: 'Plan does not allow WooCommerce integration' }, { status: 403 });
    }

    // Verify webhook signature if webhook secret is configured
    const creds = getDecryptedCredentials(store);
    if (creds.webhookSecret) {
      const isValid = verifyWooCommerceWebhook(rawBody, signature, creds.webhookSecret);
      if (!isValid) {
        console.warn(`[webhooks/woocommerce] Invalid HMAC signature for store ${storeId}`);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse JSON
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Ping event or non-JSON
      if (rawBody.includes('webhook_id')) {
        return NextResponse.json({ ok: true, ping: true });
      }
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Ignore ping webhook if payload is just verification ping
    if (topic === 'ping' || payload.webhook_id && !payload.id && !payload.billing) {
      return NextResponse.json({ ok: true, ping: true });
    }

    // Normalize event
    const normalized = normalizeWooCommercePayload(topic, payload, store.id, deliveryId);
    if (!normalized) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Process event asynchronously in after() block
    after(async () => {
      try {
        await processNormalizedEcommerceEvent(normalized, store.account_id);
      } catch (err) {
        console.error('[webhooks/woocommerce] Background processing failed:', err);
      }
    });

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error('[webhooks/woocommerce] Error handling webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
