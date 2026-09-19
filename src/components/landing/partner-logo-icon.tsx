import React from 'react'
import Image from 'next/image'
import { Globe } from 'lucide-react'

interface PartnerLogoProps {
  name: string
  logoUrl?: string | null
  className?: string
}

export function PartnerLogoIcon({ name, logoUrl, className = 'h-5 w-5' }: PartnerLogoProps) {
  const nameLower = (name || '').toLowerCase()

  // 1. Local WooCommerce
  if (nameLower.includes('woo') || nameLower.includes('wordpress')) {
    return (
      <Image
        src="/logos/woocommerce.png"
        alt="WooCommerce"
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className={`${className} object-contain`}
      />
    )
  }

  // 2. Local Shopify
  if (nameLower.includes('shopify')) {
    return (
      <Image
        src="/logos/shopify.png"
        alt="Shopify"
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        className={`${className} object-contain`}
      />
    )
  }

  // 3. Crisp Embedded Local SVG: Stripe
  if (nameLower.includes('stripe')) {
    return (
      <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="#635BFF">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.839 3.771 6.491 6.861 7.607 2.443.896 3.309 1.577 3.309 2.537 0 .96-.865 1.547-2.342 1.547-2.022 0-4.833-.933-6.86-2.046l-.916 5.567c1.782.903 4.807 1.57 7.776 1.57 2.656 0 4.8-.65 6.33-1.898 1.583-1.286 2.379-3.158 2.379-5.503 0-4.81-3.72-6.438-6.278-7.468z" />
      </svg>
    )
  }

  // 4. Crisp Embedded Local SVG: Telegram
  if (nameLower.includes('telegram')) {
    return (
      <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="#26A5E4">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  }

  // 5. Crisp Embedded Local SVG: Google Sheets
  if (nameLower.includes('sheet') || nameLower.includes('google')) {
    return (
      <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="#0F9D58">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" />
      </svg>
    )
  }

  // 6. Crisp Embedded Local SVG: HubSpot
  if (nameLower.includes('hubspot')) {
    return (
      <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="#FF7A59">
        <path d="M18.885 8.163v-.002a2.385 2.385 0 0 0-2.384-2.384 2.386 2.386 0 0 0-2.384 2.384v.002c0 .248.04.485.11.71L10.37 11.23a2.382 2.382 0 0 0-1.428-.474 2.385 2.385 0 0 0-2.384 2.384 2.386 2.386 0 0 0 2.384 2.384c.594 0 1.127-.22 1.542-.58l3.633 2.213a2.386 2.386 0 1 0 .968-1.589l-3.633-2.213c.05-.18.077-.37.077-.566 0-.25-.04-.49-.112-.716l3.856-2.357a2.38 2.38 0 0 0 1.232.342 2.385 2.385 0 0 0 2.384-2.384z" />
      </svg>
    )
  }

  // 7. Fallback for custom uploaded logo or default Globe
  if (logoUrl && !logoUrl.includes('cdn.simpleicons.org')) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className={`${className} object-contain`}
      />
    )
  }

  return <Globe className={`${className} text-[#00685F]`} />
}
