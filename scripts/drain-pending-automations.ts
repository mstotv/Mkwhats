import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const cronSecret = process.env.AUTOMATION_CRON_SECRET

if (!url || !key) {
  console.error('Missing Supabase URL or Service Role Key in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function drain() {
  console.log('=== Draining pending automation executions ===')
  
  const nowStr = new Date().toISOString()
  const { data: dueRows, error: fetchErr } = await supabase
    .from('automation_pending_executions')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', nowStr)

  if (fetchErr) {
    console.error('Error fetching pending executions:', fetchErr)
    process.exit(1)
  }

  console.log(`Found ${dueRows?.length ?? 0} due pending executions.`)

  if (!dueRows || dueRows.length === 0) {
    console.log('No due pending executions found.')
    return
  }

  // We can hit the local endpoint or call resumePendingExecution via API
  // Using direct fetch to local Next.js server if running, or calling route handler logic
  console.log('Invoking cron route via fetch or engine...')
  
  // Dynamic import of engine to execute directly
  const { resumePendingExecution } = await import('../src/lib/automations/engine')

  let processed = 0
  for (const row of dueRows) {
    console.log(`Processing execution ${row.id} (Run at: ${row.run_at}, Automation: ${row.automation_id})...`)
    
    // Claim row
    const { data: claim } = await supabase
      .from('automation_pending_executions')
      .update({ status: 'running' })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (!claim) {
      console.log(`Row ${row.id} was already claimed. Skipping.`)
      continue
    }

    try {
      await resumePendingExecution({
        id: row.id,
        automation_id: row.automation_id,
        account_id: row.account_id,
        user_id: row.user_id,
        contact_id: row.contact_id ?? null,
        log_id: row.log_id ?? null,
        parent_step_id: row.parent_step_id ?? null,
        branch: row.branch ?? null,
        next_step_position: row.next_step_position,
        context: row.context ?? {},
      })
      processed++
      console.log(`Successfully completed execution ${row.id}`)
    } catch (err) {
      console.error(`Failed executing ${row.id}:`, err)
    }
  }

  console.log(`=== Drained ${processed} / ${dueRows.length} executions ===`)
}

drain()
