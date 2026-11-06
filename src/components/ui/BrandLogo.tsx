import React from 'react'
import Image from 'next/image'

export interface BrandLogoProps {
  siteName?: string
  logoUrl?: string | null
  className?: string
  iconSize?: number
  showText?: boolean
  subtext?: string
}

export function BrandLogo({
  siteName = 'SPATIUM',
  logoUrl,
  className = '',
  iconSize = 28,
  showText = true,
  subtext,
}: BrandLogoProps) {
  // If a custom logo URL is provided from site settings
  if (logoUrl) {
    return (
      <div className={`flex items-center select-none py-1 px-1 sm:px-1.5 ${className}`}>
        <Image
          src={logoUrl}
          alt={siteName}
          width={130}
          height={38}
          className="h-7 sm:h-[30px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          priority
        />
      </div>
    )
  }

  // Official SPATIUM Logo
  return (
    <div className={`flex items-center gap-2 select-none py-1 px-1 sm:px-1.5 ${className}`}>
      <Image
        src="/brand/logo-spatium-white.svg"
        alt={siteName}
        width={130}
        height={34}
        className="h-7 sm:h-[32px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        priority
      />
    </div>
  )
}


