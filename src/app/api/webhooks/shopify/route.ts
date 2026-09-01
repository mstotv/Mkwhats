import { NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/automations/admin-client';
import { getRawStoreById, getDecryptedCredentials } from '@/lib/ecommerce/store-crud';
import { verifyShopifyWebhook } from '@/lib/ecommerce/shopify/verify';
import { normalizeShopifyPayload } from '@/lib/ecommerce/normalize';
import { processNormalizedEcommerceEvent } from '@/lib/ecommerce/event-processor';
import { checkAccountFeature } from '@/lib/plans/check-usage-limit';

export const maxDuration = 60;

/**
 * POST /api/webhooks/shopify?store_id=<store_id>
 * Public Webhook endpoint for Shopify store events.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id parameter' }, { status: 400 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256') || '';
    const topic = request.headers.get('x-shopify-topic') || '';
    const webhookId = request.headers.get('x-shopify-webhook-id') || '';

    const db = supabaseAdmin();
    const store = await getRawStoreById(db, storeId);

    if (!store || store.provider !== 'shopify') {
      return NextResponse.json({ error: 'Store not found or invalid provider' }, { status: 404 });
    }

    if (store.status === 'disconnected') {
      return NextResponse.json({ error: 'Store is disconnected' }, { status: 400 });
    }

    // Check account entitlement
    const { allowed } = await checkAccountFeature(store.account_id, 'shopify_integration');
    if (!allowed) {
      console.warn(`[webhooks/shopify] Account ${store.account_id} not entitled to shopify_integration`);
      return NextResponse.json({ error: 'Plan does not allow Shopify integration' }, { status: 403 });
    }

    // Verify webhook signature if webhook secret is configured
    const creds = getDecryptedCredentials(store);
    if (creds.webhookSecret) {
      const isValid = verifyShopifyWebhook(rawBody, signature, creds.webhookSecret);
      if (!isValid) {
        console.warn(`[webhooks/shopify] Invalid HMAC signature for store ${storeId}`);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse JSON
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Normalize event
    const normalized = normalizeShopifyPayload(topic, payload, store.id, webhookId);
    if (!normalized) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Process event asynchronously in after() block
    after(async () => {
      try {
        await processNormalizedEcommerceEvent(normalized, store.account_id);
      } catch (err) {
        console.error('[webhooks/shopify] Background processing failed:', err);
      }
    });

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error('[webhooks/shopify] Error handling webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
