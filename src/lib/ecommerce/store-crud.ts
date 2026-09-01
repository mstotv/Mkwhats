import type { SupabaseClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '@/lib/whatsapp/encryption';
import type {
  EcommerceProvider,
  EcommerceStoreRow,
  EcommerceStoreSafe,
} from './types';
import { toSafeStore } from './types';

export interface ConnectStoreInput {
  accountId: string;
  provider: EcommerceProvider;
  storeUrl: string;
  storeName?: string;
  // WooCommerce credentials
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
  // Shopify credentials
  shopifyAccessToken?: string;
  // Webhook secret
  webhookSecret?: string;
}

/**
 * Normalizes store URL to https://... without trailing slashes.
 */
export function cleanStoreUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/+$/, '');
}

/**
 * Fetch all stores for an account (returns safe objects without secrets).
 */
export async function getAccountStores(
  supabase: SupabaseClient,
  accountId: string
): Promise<EcommerceStoreSafe[]> {
  const { data, error } = await supabase
    .from('ecommerce_stores')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as EcommerceStoreRow[]).map(toSafeStore);
}

/**
 * Fetch single store by ID (scoped to account).
 */
export async function getAccountStoreById(
  supabase: SupabaseClient,
  accountId: string,
  storeId: string
): Promise<EcommerceStoreSafe | null> {
  const { data, error } = await supabase
    .from('ecommerce_stores')
    .select('*')
    .eq('account_id', accountId)
    .eq('id', storeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toSafeStore(data as EcommerceStoreRow);
}

/**
 * Internal: Fetch raw store with encrypted credentials (service-role only).
 */
export async function getRawStoreById(
  supabase: SupabaseClient,
  storeId: string
): Promise<EcommerceStoreRow | null> {
  const { data, error } = await supabase
    .from('ecommerce_stores')
    .select('*')
    .eq('id', storeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as EcommerceStoreRow;
}

/**
 * Connect or update a store with encrypted credentials.
 */
export async function saveStoreConnection(
  supabase: SupabaseClient,
  input: ConnectStoreInput
): Promise<{ success: boolean; store?: EcommerceStoreSafe; error?: string }> {
  const cleanedUrl = cleanStoreUrl(input.storeUrl);

  const payload: Partial<EcommerceStoreRow> = {
    account_id: input.accountId,
    provider: input.provider,
    store_url: cleanedUrl,
    store_name: input.storeName || cleanedUrl.replace(/^https?:\/\//, ''),
    status: 'connected',
    connected_at: new Date().toISOString(),
    last_error: null,
  };

  if (input.provider === 'woocommerce') {
    if (input.wcConsumerKey) {
      payload.wc_consumer_key_enc = encrypt(input.wcConsumerKey);
    }
    if (input.wcConsumerSecret) {
      payload.wc_consumer_secret_enc = encrypt(input.wcConsumerSecret);
    }
  } else if (input.provider === 'shopify') {
    if (input.shopifyAccessToken) {
      payload.shopify_access_token_enc = encrypt(input.shopifyAccessToken);
    }
  }

  if (input.webhookSecret) {
    payload.webhook_secret_enc = encrypt(input.webhookSecret);
  }

  // Upsert on UNIQUE(account_id, provider)
  const { data, error } = await supabase
    .from('ecommerce_stores')
    .upsert(payload, { onConflict: 'account_id,provider' })
    .select()
    .single();

  if (error || !data) {
    console.error('[ecommerce/store-crud] saveStoreConnection failed:', error);
    return { success: false, error: error?.message || 'Failed to save store connection' };
  }

  return { success: true, store: toSafeStore(data as EcommerceStoreRow) };
}

/**
 * Disconnect (delete) a store connection.
 */
export async function disconnectStore(
  supabase: SupabaseClient,
  accountId: string,
  storeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('ecommerce_stores')
    .delete()
    .eq('account_id', accountId)
    .eq('id', storeId);

  return !error;
}

/**
 * Decrypts credentials for a given store row.
 */
export function getDecryptedCredentials(row: EcommerceStoreRow): {
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
  shopifyAccessToken?: string;
  webhookSecret?: string;
} {
  return {
    wcConsumerKey: row.wc_consumer_key_enc ? decrypt(row.wc_consumer_key_enc) : undefined,
    wcConsumerSecret: row.wc_consumer_secret_enc ? decrypt(row.wc_consumer_secret_enc) : undefined,
    shopifyAccessToken: row.shopify_access_token_enc ? decrypt(row.shopify_access_token_enc) : undefined,
    webhookSecret: row.webhook_secret_enc ? decrypt(row.webhook_secret_enc) : undefined,
  };
}
