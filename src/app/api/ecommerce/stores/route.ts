import { NextResponse } from 'next/server';
import { requireRole, toErrorResponse } from '@/lib/auth/account';
import { checkAccountFeature } from '@/lib/plans/check-usage-limit';
import {
  getAccountStores,
  saveStoreConnection,
} from '@/lib/ecommerce/store-crud';
import { testShopifyConnection } from '@/lib/ecommerce/shopify/api';
import { testWooCommerceConnection } from '@/lib/ecommerce/woocommerce/api';
import type { EcommerceProvider } from '@/lib/ecommerce/types';

/**
 * GET /api/ecommerce/stores — List all stores for current account
 */
export async function GET() {
  try {
    const ctx = await requireRole('viewer');
    const stores = await getAccountStores(ctx.supabase, ctx.accountId);
    return NextResponse.json({ stores });
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/ecommerce/stores — Connect/update a store
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireRole('agent');
    const body = await request.json().catch(() => null);

    if (!body || !body.provider || !body.storeUrl) {
      return NextResponse.json(
        { error: 'يرجى إدخال نوع المنصة ورابط المتجر' },
        { status: 400 }
      );
    }

    const provider = body.provider as EcommerceProvider;
    if (provider !== 'shopify' && provider !== 'woocommerce') {
      return NextResponse.json(
        { error: 'نوع المنصة غير صالح. يجب أن يكون "shopify" أو "woocommerce"' },
        { status: 400 }
      );
    }

    // Feature entitlement check
    const featureKey =
      provider === 'shopify' ? 'shopify_integration' : 'woocommerce_integration';
    const { allowed, reason } = await checkAccountFeature(ctx.accountId, featureKey);
    if (!allowed) {
      return NextResponse.json(
        { error: reason || `خطتك الحالية لا تدعم الربط مع ${provider}. يرجى ترقية الخطة.` },
        { status: 403 }
      );
    }

    // Verify credentials first before saving
    if (provider === 'shopify') {
      if (!body.shopifyAccessToken) {
        return NextResponse.json(
          { error: 'يرجى إدخال Admin Access Token لمتجر شوبيفاي' },
          { status: 400 }
        );
      }
      const testRes = await testShopifyConnection(body.storeUrl, body.shopifyAccessToken);
      if (!testRes.success) {
        console.warn('[ecommerce/stores] Shopify verification failed:', testRes.error);
        return NextResponse.json(
          { error: `فشل التحقق من الاتصال بمتجر شوبيفاي: ${testRes.error}` },
          { status: 400 }
        );
      }
    } else if (provider === 'woocommerce') {
      if (!body.wcConsumerKey || !body.wcConsumerSecret) {
        return NextResponse.json(
          { error: 'يرجى إدخال Consumer Key و Consumer Secret لمتجر ووكومرس' },
          { status: 400 }
        );
      }
      const testRes = await testWooCommerceConnection(
        body.storeUrl,
        body.wcConsumerKey,
        body.wcConsumerSecret
      );
      if (!testRes.success) {
        console.warn('[ecommerce/stores] WooCommerce verification failed:', testRes.error);
        return NextResponse.json(
          { error: `تعذر الاتصال بمتجر ووكومرس: ${testRes.error}` },
          { status: 400 }
        );
      }
    }

    // Save encrypted store connection
    const result = await saveStoreConnection(ctx.supabase, {
      accountId: ctx.accountId,
      provider,
      storeUrl: body.storeUrl,
      storeName: body.storeName,
      wcConsumerKey: body.wcConsumerKey,
      wcConsumerSecret: body.wcConsumerSecret,
      shopifyAccessToken: body.shopifyAccessToken,
      webhookSecret: body.webhookSecret,
    });

    if (!result.success || !result.store) {
      return NextResponse.json(
        { error: result.error || 'فشل حفظ اتصال المتجر في قاعدة البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({ store: result.store }, { status: 201 });
  } catch (err) {
    console.error('[ecommerce/stores] POST uncaught error:', err);
    return toErrorResponse(err);
  }
}
