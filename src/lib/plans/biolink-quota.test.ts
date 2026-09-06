import { describe, it, expect } from 'vitest'

function calculateSubdomainChangePermission({
  bioLinkEnabled,
  maxSubdomainChanges,
  subdomainChangesCount,
  isInitialCreation,
}: {
  bioLinkEnabled: boolean
  maxSubdomainChanges: number
  subdomainChangesCount: number
  isInitialCreation: boolean
}) {
  if (!bioLinkEnabled) {
    return { allowed: false, canChangeSubdomain: false, remainingSubdomainChanges: 0 }
  }

  if (maxSubdomainChanges === -1) {
    return { allowed: true, canChangeSubdomain: true, remainingSubdomainChanges: null }
  }

  const remaining = Math.max(0, maxSubdomainChanges - subdomainChangesCount)
  const canChangeSubdomain = isInitialCreation || remaining > 0

  return { allowed: true, canChangeSubdomain, remainingSubdomainChanges: remaining }
}

describe('Bio Link Plan Feature & Subdomain Changes Quota Logic', () => {
  it('blocks bio link completely if bioLinkEnabled is false', () => {
    const res = calculateSubdomainChangePermission({
      bioLinkEnabled: false,
      maxSubdomainChanges: 0,
      subdomainChangesCount: 0,
      isInitialCreation: true,
    })
    expect(res.allowed).toBe(false)
    expect(res.canChangeSubdomain).toBe(false)
  })

  it('allows initial creation when bio link is enabled even if maxSubdomainChanges is 0', () => {
    const res = calculateSubdomainChangePermission({
      bioLinkEnabled: true,
      maxSubdomainChanges: 0,
      subdomainChangesCount: 0,
      isInitialCreation: true,
    })
    expect(res.allowed).toBe(true)
    expect(res.canChangeSubdomain).toBe(true)
    expect(res.remainingSubdomainChanges).toBe(0)
  })

  it('blocks subsequent changes when maxSubdomainChanges is 0 and storefront already exists', () => {
    const res = calculateSubdomainChangePermission({
      bioLinkEnabled: true,
      maxSubdomainChanges: 0,
      subdomainChangesCount: 0,
      isInitialCreation: false,
    })
    expect(res.allowed).toBe(true)
    expect(res.canChangeSubdomain).toBe(false)
    expect(res.remainingSubdomainChanges).toBe(0)
  })

  it('allows change when quota remains and blocks when quota is exhausted', () => {
    // 1 change allowed, 0 used
    const res1 = calculateSubdomainChangePermission({
      bioLinkEnabled: true,
      maxSubdomainChanges: 1,
      subdomainChangesCount: 0,
      isInitialCreation: false,
    })
    expect(res1.canChangeSubdomain).toBe(true)
    expect(res1.remainingSubdomainChanges).toBe(1)

    // 1 change allowed, 1 used
    const res2 = calculateSubdomainChangePermission({
      bioLinkEnabled: true,
      maxSubdomainChanges: 1,
      subdomainChangesCount: 1,
      isInitialCreation: false,
    })
    expect(res2.canChangeSubdomain).toBe(false)
    expect(res2.remainingSubdomainChanges).toBe(0)
  })

  it('allows unlimited changes when maxSubdomainChanges is -1', () => {
    const res = calculateSubdomainChangePermission({
      bioLinkEnabled: true,
      maxSubdomainChanges: -1,
      subdomainChangesCount: 99,
      isInitialCreation: false,
    })
    expect(res.allowed).toBe(true)
    expect(res.canChangeSubdomain).toBe(true)
    expect(res.remainingSubdomainChanges).toBe(null)
  })
})
