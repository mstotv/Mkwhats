import type { NextRequest } from 'next/server'

/**
 * Extracts the real client IP address from request headers.
 *
 * Handles reverse proxies (Coolify, Cloudflare, Nginx, etc.) where `x-forwarded-for`
 * contains a comma-separated list of proxies (e.g. `client, proxy1, proxy2, coolify`).
 * The VERY FIRST IP in the list is the original client's IP.
 */
export function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim()
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback for local development or direct connection without proxy
  return '127.0.0.1'
}
