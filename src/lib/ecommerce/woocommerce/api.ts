import { cleanStoreUrl } from '../store-crud';

export interface WooCommerceSystemInfo {
  environment?: string;
  store_url?: string;
  currency?: string;
}

/**
 * Tests connection with a WooCommerce store.
 * Supports both Basic Auth header and query parameters (fallback if server strips Authorization header).
 */
export async function testWooCommerceConnection(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; info?: WooCommerceSystemInfo; error?: string }> {
  const baseUrl = cleanStoreUrl(storeUrl);
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const userAgent = 'MK-Whats-Automation/1.0 (WordPress/WooCommerce Integration)';

  // Helper to make a request with timeout
  const tryRequest = async (url: string, useHeaderAuth: boolean) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      Accept: 'application/json',
    };

    let targetUrl = url;
    if (useHeaderAuth) {
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${sep}consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
    }

    return await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(8000),
    });
  };

  try {
    // 1. Try /wp-json/wc/v3/orders?per_page=1 with Basic Auth header
    let res = await tryRequest(`${baseUrl}/wp-json/wc/v3/orders?per_page=1`, true);

    // 2. If 401/403/404, fallback to query parameter auth (common on hosts that strip HTTP_AUTHORIZATION)
    if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 404)) {
      res = await tryRequest(`${baseUrl}/wp-json/wc/v3/orders?per_page=1`, false);
    }

    // 3. If still not ok, try /wp-json/wc/v3/system_status
    if (!res.ok) {
      res = await tryRequest(`${baseUrl}/wp-json/wc/v3/system_status`, true);
      if (!res.ok) {
        res = await tryRequest(`${baseUrl}/wp-json/wc/v3/system_status`, false);
      }
    }

    // 4. If still not ok, try index /wp-json/wc/v3/data
    if (!res.ok) {
      res = await tryRequest(`${baseUrl}/wp-json/wc/v3/data`, true);
      if (!res.ok) {
        res = await tryRequest(`${baseUrl}/wp-json/wc/v3/data`, false);
      }
    }

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        info: {
          environment: data?.environment?.version || 'WooCommerce',
          currency: data?.settings?.currency || 'USD',
          store_url: baseUrl,
        },
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        error: 'Invalid Consumer Key/Secret or insufficient permissions. Ensure permissions are set to Read/Write.',
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        error: 'WooCommerce REST API not found. Please ensure Pretty Permalinks are enabled in WordPress (Settings → Permalinks → Post name).',
      };
    }

    return {
      success: false,
      error: `WooCommerce API returned status ${res.status}. Check if your store URL is correct and accessible.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[woocommerce/api] testWooCommerceConnection failed:', msg);
    return {
      success: false,
      error: `Connection error: ${msg}. Please ensure your store URL is reachable and has valid SSL.`,
    };
  }
}
