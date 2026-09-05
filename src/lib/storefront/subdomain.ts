/**
 * Helper to inspect the request host and determine if the request is destined
 * for an account's storefront subdomain.
 */
export function extractStoreSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null

  // Clean host (remove port and whitespace)
  const host = hostHeader.split(':')[0].trim().toLowerCase()
  if (!host || host === 'localhost' || host === '127.0.0.1') return null

  // Determine root domain (e.g. mstoviral.online)
  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    (process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname : '') ||
    ''
  )
    .toLowerCase()
    .trim()

  // Determine main app hostname (e.g. mkwacrm.mstoviral.online)
  let mainAppHost = ''
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      mainAppHost = new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase().trim()
    } catch {}
  }

  // Explicit main app hosts -> not a storefront
  if (mainAppHost && host === mainAppHost) return null
  if (rootDomain && (host === rootDomain || host === `www.${rootDomain}`)) return null

  // Check if host is a subdomain of rootDomain (e.g. ahmed-store.mstoviral.online)
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const candidate = host.slice(0, -(rootDomain.length + 1))
    // Only accept single-level valid subdomain (e.g. "ahmed-store", not "a.b")
    if (candidate && !candidate.includes('.')) {
      return candidate
    }
    return null
  }

  // Development mode: support *.localhost (e.g. ahmed-store.localhost)
  if (host.endsWith('.localhost')) {
    const candidate = host.slice(0, -('.localhost'.length))
    if (candidate && !candidate.includes('.')) {
      return candidate
    }
  }

  return null
}
