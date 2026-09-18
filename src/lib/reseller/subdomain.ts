/**
 * Helper to inspect the request host and determine if the request is destined
 * for a White-Label Reseller tenant (via subdomain or custom domain).
 */

export interface ResellerHostInfo {
  subdomain: string | null;
  customDomain: string | null;
  isMainPlatform: boolean;
}

export function extractResellerHostInfo(hostHeader: string | null): ResellerHostInfo {
  if (!hostHeader) {
    return { subdomain: null, customDomain: null, isMainPlatform: true };
  }

  // Clean host (remove port and whitespace)
  const host = hostHeader.split(':')[0].trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return { subdomain: null, customDomain: null, isMainPlatform: true };
  }

  // Determine root domain (default: mstoviral.online)
  let rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').toLowerCase().trim();
  if (!rootDomain && process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const siteHostname = new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase().trim();
      const parts = siteHostname.split('.');
      if (parts.length >= 2 && !siteHostname.includes('localhost') && siteHostname !== '127.0.0.1') {
        rootDomain = parts.slice(-2).join('.');
      } else {
        rootDomain = siteHostname;
      }
    } catch {}
  }
  if (!rootDomain) {
    rootDomain = 'mstoviral.online';
  }

  // Main app hostname (e.g. mkwacrm.mstoviral.online or mstoviral.online)
  let mainAppHost = '';
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      mainAppHost = new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase().trim();
    } catch {}
  }
  if (!mainAppHost) {
    mainAppHost = `mkwacrm.${rootDomain}`;
  }

  // Exact match to main app hosts
  if (host === mainAppHost || host === rootDomain || host === `www.${rootDomain}`) {
    return { subdomain: null, customDomain: null, isMainPlatform: true };
  }

  // Subdomain of rootDomain (e.g. acme.mstoviral.online)
  if (host.endsWith(`.${rootDomain}`)) {
    const candidate = host.slice(0, -(rootDomain.length + 1));
    if (candidate && !candidate.includes('.')) {
      return { subdomain: candidate, customDomain: null, isMainPlatform: false };
    }
    return { subdomain: null, customDomain: null, isMainPlatform: true };
  }

  // Development mode: support *.localhost (e.g. acme.localhost)
  if (host.endsWith('.localhost')) {
    const candidate = host.slice(0, -('.localhost'.length));
    if (candidate && !candidate.includes('.')) {
      return { subdomain: candidate, customDomain: null, isMainPlatform: false };
    }
  }

  // Otherwise, it's an external custom domain (e.g. crm.acme.com)
  return { subdomain: null, customDomain: host, isMainPlatform: false };
}
