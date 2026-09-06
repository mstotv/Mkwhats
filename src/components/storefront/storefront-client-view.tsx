'use client'

import React from 'react'
import type { StorefrontFullConfig, StorefrontItem } from '@/lib/storefront/types'
import { BioStorefront } from './bio-storefront'

export function StorefrontClientView({
  storefront,
}: {
  storefront: StorefrontFullConfig
  items?: StorefrontItem[]
  currency?: string
}) {
  const primaryColor = storefront.theme_config?.primary_color || '#d4eb3d'

  // 100% Dedicated Bio-Link / Linktree Storefront
  return (
    <BioStorefront
      storefront={storefront}
      primaryColor={primaryColor}
    />
  )
}

