import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyShopifyWebhook } from './shopify/verify';
import { verifyWooCommerceWebhook } from './woocommerce/verify';
import { normalizeShopifyPayload, normalizeWooCommercePayload } from './normalize';
import { cleanStoreUrl, getDecryptedCredentials } from './store-crud';
import { encrypt } from '@/lib/whatsapp/encryption';
import type { EcommerceStoreRow } from './types';

describe('E-Commerce Integrations', () => {
  describe('Store URL cleaning', () => {
    it('normalizes URLs correctly', () => {
      expect(cleanStoreUrl('mystore.myshopify.com')).toBe('https://mystore.myshopify.com');
      expect(cleanStoreUrl('http://example.com/')).toBe('http://example.com');
      expect(cleanStoreUrl('https://example.com///')).toBe('https://example.com');
    });
  });

  describe('Shopify Webhook HMAC Verification', () => {
    const secret = 'shpss_test_secret_123';
    const body = JSON.stringify({ id: 12345, email: 'test@example.com' });

    it('verifies valid HMAC signature', () => {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(body);
      const validSignature = hmac.digest('base64');

      const result = verifyShopifyWebhook(body, validSignature, secret);
      expect(result).toBe(true);
    });

    it('rejects invalid HMAC signature', () => {
      const result = verifyShopifyWebhook(body, 'invalid_signature_base64', secret);
      expect(result).toBe(false);
    });

    it('handles empty parameters safely', () => {
      expect(verifyShopifyWebhook('', '', '')).toBe(false);
      expect(verifyShopifyWebhook(body, '', secret)).toBe(false);
    });
  });

  describe('WooCommerce Webhook HMAC Verification', () => {
    const secret = 'wc_secret_abc_456';
    const body = JSON.stringify({ id: 987, status: 'processing' });

    it('verifies valid HMAC signature', () => {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(body);
      const validSignature = hmac.digest('base64');

      const result = verifyWooCommerceWebhook(body, validSignature, secret);
      expect(result).toBe(true);
    });

    it('rejects invalid HMAC signature', () => {
      const result = verifyWooCommerceWebhook(body, 'invalid_sig', secret);
      expect(result).toBe(false);
    });
  });

  describe('Shopify Event Normalization', () => {
    it('normalizes an order created payload', () => {
      const payload = {
        id: 820982911946154500,
        name: '#1001',
        email: 'jon@example.com',
        phone: '+15551234567',
        financial_status: 'paid',
        total_price: '199.99',
        currency: 'USD',
        customer: {
          id: 115319483847,
          first_name: 'Jon',
          last_name: 'Doe',
          email: 'jon@example.com',
          phone: '+15551234567',
        },
        line_items: [
          {
            id: 1,
            title: 'Wireless Headphones',
            quantity: 2,
            price: '99.99',
            sku: 'WH-100',
          },
        ],
      };

      const event = normalizeShopifyPayload('orders/create', payload, 'store_uuid_1', 'webhook_uuid_1');

      expect(event).not.toBeNull();
      expect(event?.provider).toBe('shopify');
      expect(event?.event).toBe('order.created');
      expect(event?.customer.name).toBe('Jon Doe');
      expect(event?.customer.phone).toBe('+15551234567');
      expect(event?.customer.email).toBe('jon@example.com');
      expect(event?.order?.number).toBe('#1001');
      expect(event?.order?.total).toBe(199.99);
      expect(event?.order?.payment_status).toBe('paid');
      expect(event?.order?.items?.length).toBe(1);
      expect(event?.order?.items?.[0].name).toBe('Wireless Headphones');
    });

    it('normalizes an order fulfilled payload', () => {
      const payload = {
        id: 1002,
        name: '#1002',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        total_price: '50.00',
        currency: 'SAR',
        billing_address: {
          name: 'Sarah Smith',
          phone: '+966500000000',
          email: 'sarah@example.com',
        },
      };

      const event = normalizeShopifyPayload('orders/fulfilled', payload, 'store_uuid_1', 'webhook_uuid_2');

      expect(event?.event).toBe('order.fulfilled');
      expect(event?.customer.name).toBe('Sarah Smith');
      expect(event?.customer.phone).toBe('+966500000000');
      expect(event?.order?.currency).toBe('SAR');
    });
  });

  describe('WooCommerce Event Normalization', () => {
    it('normalizes a WooCommerce order created/paid payload', () => {
      const payload = {
        id: 763,
        number: '763',
        status: 'processing',
        currency: 'AED',
        total: '350.00',
        billing: {
          first_name: 'Ahmed',
          last_name: 'Ali',
          email: 'ahmed@example.com',
          phone: '+971501234567',
        },
        line_items: [
          {
            id: 10,
            name: 'Smart Watch',
            quantity: 1,
            total: '350.00',
            sku: 'SW-PRO',
          },
        ],
      };

      const event = normalizeWooCommercePayload('order.created', payload, 'store_uuid_2', 'delivery_123');

      expect(event).not.toBeNull();
      expect(event?.provider).toBe('woocommerce');
      expect(event?.event).toBe('order.created');
      expect(event?.customer.name).toBe('Ahmed Ali');
      expect(event?.customer.phone).toBe('+971501234567');
      expect(event?.order?.total).toBe(350);
      expect(event?.order?.currency).toBe('AED');
      expect(event?.order?.items?.[0].sku).toBe('SW-PRO');
    });
  });

  describe('Store Credential Decryption', () => {
    it('correctly decrypts credentials from store row', () => {
      const rawSecret = 'cs_secret_test_999';
      const rawKey = 'ck_key_test_111';
      const encSecret = encrypt(rawSecret);
      const encKey = encrypt(rawKey);

      const fakeRow = {
        wc_consumer_key_enc: encKey,
        wc_consumer_secret_enc: encSecret,
      } as EcommerceStoreRow;

      const creds = getDecryptedCredentials(fakeRow);
      expect(creds.wcConsumerKey).toBe(rawKey);
      expect(creds.wcConsumerSecret).toBe(rawSecret);
      expect(creds.shopifyAccessToken).toBeUndefined();
    });
  });
});
