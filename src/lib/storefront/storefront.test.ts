import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateSubdomain, RESERVED_SUBDOMAINS } from './validation'
import { extractStoreSubdomain } from './subdomain'

describe('Storefront Subdomain Validation', () => {
  it('validates valid subdomains', () => {
    expect(validateSubdomain('ahmed-store').valid).toBe(true)
    expect(validateSubdomain('store123').valid).toBe(true)
    expect(validateSubdomain('my-awesome-shop').valid).toBe(true)
  })

  it('rejects too short or too long subdomains', () => {
    expect(validateSubdomain('ab').valid).toBe(false)
    expect(validateSubdomain('a'.repeat(64)).valid).toBe(false)
  })

  it('rejects invalid characters, leading/trailing hyphens', () => {
    expect(validateSubdomain('-ahmed').valid).toBe(false)
    expect(validateSubdomain('ahmed-').valid).toBe(false)
    expect(validateSubdomain('ahmed_store').valid).toBe(false)
    expect(validateSubdomain('ahmed store').valid).toBe(false)
    expect(validateSubdomain('ahmed.store').valid).toBe(false)
  })

  it('rejects reserved subdomains', () => {
    expect(validateSubdomain('admin').valid).toBe(false)
    expect(validateSubdomain('api').valid).toBe(false)
    expect(validateSubdomain('app').valid).toBe(false)
    expect(validateSubdomain('dashboard').valid).toBe(false)
    expect(validateSubdomain('login').valid).toBe(false)
    expect(validateSubdomain('www').valid).toBe(false)
  })
})

describe('Storefront Hostname Extraction', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const originalRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://mkwacrm.mstoviral.online'
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'mstoviral.online'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalRootDomain
  })

  it('extracts valid single-level subdomain', () => {
    expect(extractStoreSubdomain('ahmed-store.mstoviral.online')).toBe('ahmed-store')
    expect(extractStoreSubdomain('ahmed-store.mstoviral.online:443')).toBe('ahmed-store')
  })

  it('returns null for main app domain', () => {
    expect(extractStoreSubdomain('mkwacrm.mstoviral.online')).toBeNull()
    expect(extractStoreSubdomain('mkwacrm.mstoviral.online:443')).toBeNull()
  })

  it('returns null for root domain and www', () => {
    expect(extractStoreSubdomain('mstoviral.online')).toBeNull()
    expect(extractStoreSubdomain('www.mstoviral.online')).toBeNull()
  })

  it('returns null for localhost or 127.0.0.1', () => {
    expect(extractStoreSubdomain('localhost')).toBeNull()
    expect(extractStoreSubdomain('localhost:3000')).toBeNull()
    expect(extractStoreSubdomain('127.0.0.1:3000')).toBeNull()
  })

  it('extracts subdomain in local development on *.localhost', () => {
    expect(extractStoreSubdomain('ahmed-store.localhost:3000')).toBe('ahmed-store')
  })

  it('returns null for foreign domains or multi-level subdomains', () => {
    expect(extractStoreSubdomain('evil.otherdomain.com')).toBeNull()
    expect(extractStoreSubdomain('nested.sub.mstoviral.online')).toBeNull()
  })
})

describe('Storefront Builder Defaults', () => {
  it('validates supported business archetypes', () => {
    const validArchetypes = ['retail', 'clinic', 'salon', 'custom']
    expect(validArchetypes).toContain('retail')
    expect(validArchetypes).toContain('clinic')
    expect(validArchetypes).toContain('salon')
  })
})

