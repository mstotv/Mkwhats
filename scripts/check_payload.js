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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: event } = await supabase
    .from('ecommerce_webhook_events')
    .select('*')
    .eq('event_type', 'cart.abandoned')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('CART ABANDONED EVENT DETAILS:');
  console.log(JSON.stringify(event, null, 2));

  const { data: contacts, error: errC } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('CONTACTS:', contacts, errC);
}

main().catch(console.error);
