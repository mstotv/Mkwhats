import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import {
  getRawStoreById,
  getDecryptedCredentials,
} from '@/lib/ecommerce/store-crud';
import { testShopifyConnection } from '@/lib/ecommerce/shopify/api';
import { testWooCommerceConnection } from '@/lib/ecommerce/woocommerce/api';

/**
 * POST /api/ecommerce/stores/[storeId]/test — Test live connection for an already connected store
 */
export async function POST(
  _request: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  try {
    const params = await props.params;
    const ctx = await requireRole('agent');

    const store = await getRawStoreById(ctx.supabase, params.storeId);
    if (!store || store.account_id !== ctx.accountId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const creds = getDecryptedCredentials(store);

    if (store.provider === 'shopify') {
      if (!creds.shopifyAccessToken) {
        return NextResponse.json(
          { error: 'Missing Shopify access token' },
          { status: 400 }
        );
      }
      const testRes = await testShopifyConnection(
        store.store_url,
        creds.shopifyAccessToken
      );
      if (!testRes.success) {
        return NextResponse.json(
          { error: testRes.error || 'Connection failed' },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, shop: testRes.shop });
    } else if (store.provider === 'woocommerce') {
      if (!creds.wcConsumerKey || !creds.wcConsumerSecret) {
        return NextResponse.json(
          { error: 'Missing WooCommerce consumer key or secret' },
          { status: 400 }
        );
      }
      const testRes = await testWooCommerceConnection(
        store.store_url,
        creds.wcConsumerKey,
        creds.wcConsumerSecret
      );
      if (!testRes.success) {
        return NextResponse.json(
          { error: testRes.error || 'Connection failed' },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, info: testRes.info });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
