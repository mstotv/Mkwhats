import React from 'react'

interface PlatformLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
  alt?: string
  variant?: 'wordmark' | 'square' | 'icon'
}

/**
 * Real Official WooCommerce ("Woo") Logo
 * Uses the modern Automattic Woo purple brand mark
 */
export function WooCommerceLogo({
  className = 'h-6 w-auto object-contain',
  alt = 'WooCommerce',
  variant = 'wordmark',
  ...props
}: PlatformLogoProps) {
  const src = variant === 'square' || variant === 'icon'
    ? '/logos/woocommerce-square.png'
    : '/logos/woocommerce.png'

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      {...props}
    />
  )
}

/**
 * Real Official Shopify 3D Bag Logo
 */
export function ShopifyLogo({
  className = 'h-6 w-6 object-contain',
  alt = 'Shopify',
  ...props
}: PlatformLogoProps) {
  return (
    <img
      src="/logos/shopify.png"
      alt={alt}
      className={className}
      loading="eager"
      {...props}
    />
  )
}
