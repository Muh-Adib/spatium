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
  siteName = 'SegiaTech',
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
          width={120}
          height={36}
          className="h-6 sm:h-[28px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          priority
        />
      </div>
    )
  }

  // If SegiaTech default official logo exists
  if (siteName.toLowerCase() === 'segiatech') {
    return (
      <div className={`flex items-center select-none py-1 px-1 sm:px-1.5 ${className}`}>
        <Image
          src="/images/logo-segiatech-official.png"
          alt="SegiaTech"
          width={110}
          height={33}
          className="h-6 sm:h-[26px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          priority
        />
      </div>
    )
  }

  // Dynamic White-Label Brand Mark for any other brand
  const initial = siteName.charAt(0).toUpperCase()
  return (
    <div className={`flex items-center gap-2.5 select-none py-1 px-1 sm:px-1.5 group ${className}`}>
      {/* Modern geometric glowing icon mark */}
      <div
        style={{ width: iconSize, height: iconSize }}
        className="relative flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-black font-bold font-mono text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-transform duration-200 group-hover:scale-105 shrink-0"
      >
        <span>{initial}</span>
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {siteName}
          </span>
          {subtext && (
            <span className="text-[10px] tracking-wider uppercase text-neutral-400 font-mono -mt-1">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

