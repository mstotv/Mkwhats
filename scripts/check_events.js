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
  const { data: events, error: err1 } = await supabase
    .from('ecommerce_webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('--- RECENT WEBHOOK EVENTS ---');
  console.log('Error:', err1);
  console.log('Events count:', events?.length);
  if (events) {
    for (const e of events) {
      console.log(`[${e.created_at}] Event: ${e.event_type}, Provider: ${e.provider}, ID: ${e.provider_event_id}`);
    }
  }

  const { data: automations, error: err2 } = await supabase
    .from('automations')
    .select('id, name, trigger_type, is_active, trigger_config')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('--- RECENT AUTOMATIONS ---');
  console.log(automations);
}

main().catch(console.error);
