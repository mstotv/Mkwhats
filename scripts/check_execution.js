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
  const { data: contacts, error: errC } = await supabase
    .from('contacts')
    .select('id, full_name, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('RECENT CONTACTS:', contacts);

  const { data: logs, error: errL } = await supabase
    .from('automation_executions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('RECENT AUTOMATION EXECUTIONS:', logs, errL);

  const { data: steps, error: errS } = await supabase
    .from('automation_steps')
    .select('*')
    .eq('automation_id', 'd18750ef-879f-4b4e-b15c-1f33e5e2e8e0');
  console.log('STEPS FOR CART ABANDONED AUTOMATION:', steps, errS);
}

main().catch(console.error);
