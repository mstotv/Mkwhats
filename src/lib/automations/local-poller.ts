import { supabaseAdmin } from './admin-client'
import { resumePendingExecution } from './engine'
import type { AutomationContext } from './engine'

let pollerTimer: NodeJS.Timeout | null = null

/**
 * Ensures a lightweight local background poller is running during development mode.
 * Checks for due `automation_pending_executions` every 15 seconds.
 * Safe to call multiple times (singleton pattern).
 */
export function initLocalAutomationPoller(): void {
  // Only run in development or non-production server environments
  if (process.env.NODE_ENV === 'production') return
  if (pollerTimer) return // already running

  console.log('[automations] Starting local dev background wait poller (interval: 15s)')

  const poll = async () => {
    try {
      const admin = supabaseAdmin()
      const nowStr = new Date().toISOString()

      const { data: due, error } = await admin
        .from('automation_pending_executions')
        .select('*')
        .eq('status', 'pending')
        .lte('run_at', nowStr)
        .order('run_at', { ascending: true })
        .limit(20)

      if (error || !due || due.length === 0) return

      for (const row of due) {
        // Claim row to avoid duplicate processing
        const { data: claim } = await admin
          .from('automation_pending_executions')
          .update({ status: 'running' })
          .eq('id', row.id)
          .eq('status', 'pending')
          .select('id')
          .maybeSingle()

        if (!claim) continue

        console.log(`[automations-dev-poller] Resuming wait step for pending execution ${row.id}...`)

        await resumePendingExecution({
          id: row.id as string,
          automation_id: row.automation_id as string,
          account_id: row.account_id as string,
          user_id: row.user_id as string,
          contact_id: (row.contact_id as string | null) ?? null,
          log_id: (row.log_id as string | null) ?? null,
          parent_step_id: (row.parent_step_id as string | null) ?? null,
          branch: (row.branch as 'yes' | 'no' | null) ?? null,
          next_step_position: row.next_step_position as number,
          context: (row.context as AutomationContext) ?? {},
        })
      }
    } catch (err) {
      console.error('[automations-dev-poller] error during polling cycle:', err)
    }
  }

  // Run initial poll check after 2 seconds
  setTimeout(poll, 2000)

  // Repeat poll check every 15 seconds
  pollerTimer = setInterval(poll, 15_000)
  if (pollerTimer.unref) {
    pollerTimer.unref() // allow process to exit cleanly if needed
  }
}
