import { cleanStoreUrl } from '../store-crud';

export interface ShopifyShopInfo {
  id: number;
  name: string;
  email: string;
  domain: string;
  currency: string;
}

/**
 * Tests connection with a Shopify store using the provided Access Token.
 */
export async function testShopifyConnection(
  storeUrl: string,
  accessToken: string
): Promise<{ success: boolean; shop?: ShopifyShopInfo; error?: string }> {
  try {
    const baseUrl = cleanStoreUrl(storeUrl);
    const endpoint = `${baseUrl}/admin/api/2024-01/shop.json`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'Invalid Access Token or insufficient permissions' };
      }
      return { success: false, error: `Shopify API returned status ${res.status}` };
    }

    const data = await res.json();
    if (data && data.shop) {
      return {
        success: true,
        shop: {
          id: data.shop.id,
          name: data.shop.name,
          email: data.shop.email,
          domain: data.shop.domain || data.shop.myshopify_domain,
          currency: data.shop.currency,
        },
      };
    }

    return { success: false, error: 'Unexpected response from Shopify' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[shopify/api] testShopifyConnection failed:', msg);
    return { success: false, error: `Connection failed: ${msg}` };
  }
}
