/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Runs ONCE when the server (Node.js runtime) starts - before any
 * request is handled. We use it to print the commit hash and build
 * timestamp so Coolify logs immediately show WHICH version is live.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initNodeStartup } = await import('./instrumentation.node')
    await initNodeStartup()
  }
}

