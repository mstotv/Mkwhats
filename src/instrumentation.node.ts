/**
 * Node.js-only startup logic for Next.js Instrumentation
 */
export async function initNodeStartup() {
  const commit =
    process.env.NEXT_PUBLIC_COMMIT_SHA ??
    process.env.COMMIT_SHA ??
    process.env.GIT_COMMIT ??
    process.env.RENDER_GIT_COMMIT ??
    'unknown'

  const buildTime =
    process.env.NEXT_PUBLIC_BUILD_TIME ??
    process.env.BUILD_TIME ??
    new Date().toISOString()

  const lines = [
    '[STARTUP] ========================================',
    '[STARTUP] App server started',
    '[STARTUP] Commit : ' + commit,
    '[STARTUP] Built  : ' + buildTime,
    '[STARTUP] Node   : ' + (typeof process !== 'undefined' ? process.version : 'unknown'),
    '[STARTUP] ========================================',
  ]
  console.log(lines.join('\n'))

  // Start internal background timer for appointment reminders (every 60 seconds)
  try {
    const { processDueReminders } = await import('@/lib/appointments/reminder-runner')
    // Run once after 5s startup delay
    setTimeout(() => {
      void processDueReminders(false).catch((err) =>
        console.error('[STARTUP] Initial appointment reminders check error:', err)
      )
    }, 5000)

    // Repeat every 60 seconds
    setInterval(() => {
      void processDueReminders(false).catch((err) =>
        console.error('[BACKGROUND] Appointment reminders runner error:', err)
      )
    }, 60000)

    console.log('[STARTUP] ✅ Automated appointment reminders background runner started (interval: 60s)')
  } catch (runnerErr) {
    console.error('[STARTUP] Failed to initialize appointment reminders background runner:', runnerErr)
  }
}
