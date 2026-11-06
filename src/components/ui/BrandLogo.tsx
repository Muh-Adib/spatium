import React from 'react'
import Image from 'next/image'

export interface BrandLogoProps {
  siteName?: string
  /** Custom logo from site settings; overrides the bundled SPATIUM wordmark. */
  logoUrl?: string | null
  className?: string
  /** `dark` = for dark backgrounds (white wordmark); `light`/`auto` = gradient wordmark. */
  color?: 'light' | 'dark' | 'auto'
  /** Rendered width in CSS px. Height follows the logo's own aspect ratio. */
  width?: number
  /** Preload the image (Next 16 replacement for `priority`). Only for above-the-fold use, e.g. the header. */
  preload?: boolean
}

/** viewBox of /brand/logo-spatium*.svg (2434.86 × 230.85). */
const WORDMARK_RATIO = 2434.86 / 230.85

export function BrandLogo({ siteName = 'SPATIUM', logoUrl, className = '', color = 'auto', width = 130, preload = false }: BrandLogoProps) {
  const src = logoUrl || (color === 'dark' ? '/brand/logo-spatium-white.svg' : '/brand/logo-spatium.svg')
  const height = Math.round(width / WORDMARK_RATIO)

  return (
    <Image
      src={src}
      alt={siteName}
      width={width}
      height={height}
      preload={preload}
      className={className}
      // Size by width only: a fixed height on a ~10:1 wordmark makes it huge.
      style={{ width, height: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
    />
  )
}
