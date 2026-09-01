import type {
  NormalizedEcommerceEvent,
  NormalizedOrder,
  NormalizedCustomer,
  NormalizedOrderItem,
} from './types';

/**
 * Normalizes a raw Shopify webhook payload into the platform's standard format.
 */
export function normalizeShopifyPayload(
  topic: string,
  rawPayload: Record<string, unknown>,
  storeId: string,
  webhookId: string
): NormalizedEcommerceEvent | null {
  // Topics: orders/create, orders/paid, orders/cancelled, orders/fulfilled, customers/create, etc.
  let eventType = 'unknown';

  if (topic.includes('orders/create')) eventType = 'order.created';
  else if (topic.includes('orders/paid')) eventType = 'order.paid';
  else if (topic.includes('orders/cancelled')) eventType = 'order.cancelled';
  else if (topic.includes('orders/fulfilled')) eventType = 'order.fulfilled';
  else if (topic.includes('customers/create')) eventType = 'customer.created';
  else if (topic.startsWith('orders/')) eventType = 'order.created'; // fallback order event

  const externalId = String(rawPayload.id || webhookId || Date.now());

  // Parse customer info
  const rawCustomer = (rawPayload.customer || {}) as Record<string, unknown>;
  const rawBilling = (rawPayload.billing_address || {}) as Record<string, unknown>;
  const rawShipping = (rawPayload.shipping_address || {}) as Record<string, unknown>;

  const customerName =
    rawPayload.customer
      ? [rawCustomer.first_name, rawCustomer.last_name].filter(Boolean).join(' ') || (rawCustomer.name as string)
      : [rawBilling.first_name, rawBilling.last_name].filter(Boolean).join(' ') || (rawBilling.name as string);

  const customerPhone =
    (rawPayload.phone as string) ||
    (rawCustomer.phone as string) ||
    (rawBilling.phone as string) ||
    (rawShipping.phone as string) ||
    '';

  const customerEmail =
    (rawPayload.email as string) ||
    (rawCustomer.email as string) ||
    (rawBilling.email as string) ||
    '';

  const customer: NormalizedCustomer = {
    id: rawCustomer.id ? String(rawCustomer.id) : undefined,
    name: customerName?.trim() || undefined,
    email: customerEmail?.trim() || undefined,
    phone: customerPhone?.trim() || undefined,
  };

  // Parse order info if this is an order topic
  let order: NormalizedOrder | undefined;
  if (!topic.includes('customers/')) {
    const rawItems = Array.isArray(rawPayload.line_items) ? rawPayload.line_items : [];
    const items: NormalizedOrderItem[] = rawItems.map((item: Record<string, unknown>) => ({
      product_id: item.product_id ? String(item.product_id) : undefined,
      name: item.title as string | undefined,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      sku: (item.sku as string) || undefined,
    }));

    order = {
      id: rawPayload.id ? String(rawPayload.id) : externalId,
      number: (rawPayload.order_number || rawPayload.name || rawPayload.id) as string | number,
      status: (rawPayload.financial_status || rawPayload.fulfillment_status || 'created') as string,
      payment_status: (rawPayload.financial_status as string) || undefined,
      currency: (rawPayload.currency as string) || 'USD',
      total: Number(rawPayload.total_price || rawPayload.current_total_price || 0),
      subtotal: Number(rawPayload.subtotal_price || 0),
      items,
    };
  }

  return {
    provider: 'shopify',
    event: eventType,
    store_id: storeId,
    external_id: externalId,
    provider_event_id: webhookId || externalId,
    customer,
    order,
    raw_event: rawPayload,
  };
}

/**
 * Normalizes a raw WooCommerce webhook payload into the platform's standard format.
 */
export function normalizeWooCommercePayload(
  topic: string,
  rawPayload: Record<string, unknown>,
  storeId: string,
  deliveryId: string
): NormalizedEcommerceEvent | null {
  // Topics: order.created, order.updated, customer.created, action:woocommerce_order_status_...
  let eventType = 'unknown';

  const status = String(rawPayload.status || '').toLowerCase();

  const topicLower = topic.toLowerCase();

  if (topicLower.includes('order.created') || topicLower.includes('new_order') || topicLower.includes('order_created')) {
    eventType = 'order.created';
  } else if (topicLower.includes('order.updated') || topicLower.includes('order.')) {
    if (status === 'completed') eventType = 'order.fulfilled';
    else if (status === 'cancelled' || status === 'refunded' || status === 'failed') eventType = 'order.cancelled';
    else if (status === 'processing' || status === 'on-hold') eventType = 'order.paid';
    else eventType = 'order.created';
  } else if (topicLower.includes('customer.created') || topicLower.includes('customer_created')) {
    eventType = 'customer.created';
  } else {
    eventType = 'order.created';
  }

  const externalId = String(rawPayload.id || deliveryId || Date.now());

  // Parse customer info
  const rawBilling = (rawPayload.billing || {}) as Record<string, unknown>;
  const rawShipping = (rawPayload.shipping || {}) as Record<string, unknown>;

  const customerName =
    [rawBilling.first_name, rawBilling.last_name].filter(Boolean).join(' ') ||
    [rawShipping.first_name, rawShipping.last_name].filter(Boolean).join(' ') ||
    (rawPayload.first_name ? [rawPayload.first_name, rawPayload.last_name].filter(Boolean).join(' ') : undefined);

  const customerPhone =
    (rawBilling.phone as string) ||
    (rawShipping.phone as string) ||
    (rawPayload.phone as string) ||
    '';

  const customerEmail =
    (rawBilling.email as string) ||
    (rawPayload.email as string) ||
    '';

  const customer: NormalizedCustomer = {
    id: rawPayload.customer_id ? String(rawPayload.customer_id) : rawPayload.id ? String(rawPayload.id) : undefined,
    name: customerName?.trim() || undefined,
    email: customerEmail?.trim() || undefined,
    phone: customerPhone?.trim() || undefined,
  };

  // Parse order info
  let order: NormalizedOrder | undefined;
  if (!topic.includes('customer.')) {
    const rawItems = Array.isArray(rawPayload.line_items) ? rawPayload.line_items : [];
    const items: NormalizedOrderItem[] = rawItems.map((item: Record<string, unknown>) => ({
      product_id: item.product_id ? String(item.product_id) : undefined,
      name: item.name as string | undefined,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price || item.total) || 0,
      sku: (item.sku as string) || undefined,
    }));

    order = {
      id: String(rawPayload.id || externalId),
      number: (rawPayload.number || rawPayload.id) as string | number,
      status: (rawPayload.status as string) || 'created',
      payment_status: (rawPayload.status as string) || undefined,
      currency: (rawPayload.currency as string) || 'USD',
      total: Number(rawPayload.total || 0),
      subtotal: Number(rawPayload.subtotal || rawPayload.total || 0),
      items,
    };
  }

  return {
    provider: 'woocommerce',
    event: eventType,
    store_id: storeId,
    external_id: externalId,
    provider_event_id: deliveryId || externalId,
    customer,
    order,
    raw_event: rawPayload,
  };
}
