/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Runs ONCE when the server (Node.js runtime) starts - before any
 * request is handled. We use it to print the commit hash and build
 * timestamp so Coolify logs immediately show WHICH version is live.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

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
    '[STARTUP] Node   : ' + process.version,
    '[STARTUP] Env    : ' + (process.env.NODE_ENV ?? 'unknown'),
    '[STARTUP] ========================================',
  ]
  console.log(lines.join('\n'))
}
