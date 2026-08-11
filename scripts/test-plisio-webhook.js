const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Read credentials from env or local default
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://guqnvykbkfqqzxmpfegq.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cW52eWtia2ZxcXp4bXBmZWdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI1MjkwNywiZXhwIjoyMTAwODI4OTA3fQ.8IUB3sfGvhMauwLgSJP6elOU7yjwJ9V4ZO8ICE0_nys'

const supabase = createClient(url, key)

async function testPlisioWebhook() {
  console.log('--- 🧪 Plisio Webhook Verification Test ---')
  console.log('1. Fetching latest pending upgrade request and site settings...')

  const [{ data: settings }, { data: req }] = await Promise.all([
    supabase.from('site_settings').select('plisio_api_key').eq('id', 1).single(),
    supabase
      .from('upgrade_requests')
      .select('*, plans:target_plan_id(*)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!settings?.plisio_api_key) {
    console.error('❌ Error: No plisio_api_key found in site_settings table.')
    return
  }

  if (!req) {
    console.error('❌ Error: No upgrade_requests row found in database.')
    return
  }

  const secretKey = settings.plisio_api_key
  const targetPlan = req.plans
  const expectedAmount =
    req.billing_cycle === 'yearly'
      ? String(targetPlan.price_yearly)
      : String(targetPlan.price_monthly)

  console.log('📌 Found Request:', {
    id: req.id,
    account_id: req.account_id,
    current_status: req.status,
    target_plan: targetPlan.name,
    expected_amount: expectedAmount,
  })

  // 2. Construct Plisio JSON callback payload
  const rawPayload = {
    txn_id: 'test_txn_' + Date.now(),
    order_number: req.id,
    status: 'completed',
    amount: expectedAmount,
    currency: 'USDT_TRX',
    source_amount: expectedAmount,
    source_currency: 'USD',
  }

  // 3. Sort keys and compute HMAC-SHA1 signature (verify_hash)
  const sortedKeys = Object.keys(rawPayload).sort()
  const orderedData = {}
  for (const k of sortedKeys) {
    orderedData[k] = rawPayload[k]
  }

  const serialized = JSON.stringify(orderedData)
  const verifyHash = crypto
    .createHmac('sha1', secretKey)
    .update(serialized)
    .digest('hex')

  const fullPayload = { ...rawPayload, verify_hash: verifyHash }

  console.log('\n2. Calculated HMAC-SHA1 verify_hash:', verifyHash)
  console.log('📦 Sending Payload to Webhook...')

  // 4. Send POST request to local Webhook
  try {
    const res = await fetch('http://localhost:3000/api/v1/webhooks/plisio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    })

    const resData = await res.json()
    console.log(`\n3. Webhook HTTP ${res.status} Response:`, resData)
  } catch (err) {
    console.error('❌ Fetch Error:', err.message)
  }

  // 5. Query DB to verify result
  console.log('\n4. Verifying post-webhook database state...')
  const [{ data: updatedReq }, { data: activeSub }] = await Promise.all([
    supabase.from('upgrade_requests').select('*').eq('id', req.id).single(),
    supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('account_id', req.account_id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  console.log('✅ Updated Request status:', updatedReq.status, '| plisio_status:', updatedReq.plisio_status, '| paid_at:', updatedReq.paid_at)
  console.log(
    '✅ Active Subscription in DB:',
    activeSub
      ? {
          id: activeSub.id,
          plan: activeSub.plans?.name,
          status: activeSub.status,
          billing_cycle: activeSub.billing_cycle,
        }
      : 'No active subscription found'
  )
}

testPlisioWebhook()
