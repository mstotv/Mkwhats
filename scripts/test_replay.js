const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

// We can test normalizeWooCommercePayload on the payload
const rawPayload = {
  "email": "mamohhjjsih@vhhs.oxk",
  "last_name": "Hhsh",
  "cart_total": "1000.00",
  "first_name": "Mkkk",
  "coupon_code": "",
  "checkout_url": "https://linkbio.sufrahiq.com/checkout/?wcf_ac_token=...",
  "order_status": "abandoned",
  "phone_number": "+9647730611400",
  "product_names": "msto",
  "billing_address": "Erbi, shoraw, IQ, Kirkuk, 36001"
};

// Check phone
const customerPhone =
  rawPayload.phone_number ||
  rawPayload.customer_phone ||
  rawPayload.phone ||
  rawPayload.billing_phone ||
  rawPayload.user_phone ||
  '';

console.log('Detected customer phone:', customerPhone);
console.log('Customer name:', `${rawPayload.first_name} ${rawPayload.last_name}`);
console.log('Checkout URL:', rawPayload.checkout_url);
