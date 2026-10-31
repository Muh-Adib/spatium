'use client'

import React from 'react'
import Link from 'next/link'
import { HeroCinemaBlockInstance } from './contracts'
import { Icon } from '@/components/Icon'
import '@/components/home/hero.css'

export function HeroCinemaBlock({ block }: { block: HeroCinemaBlockInstance | any }) {
  const data = block?.data || block || {}
  const settings = block?.settings || {}
  const heightClass =
    settings?.height === 'medium'
      ? 'min-h-[50vh]'
      : settings?.height === 'compact'
      ? 'min-h-[40vh]'
      : 'min-h-[85vh]'

  const isCenter = settings?.alignment === 'center'
  const badge = block?.badge || data.badge || block?.categoryBadge
  const headline = block?.headline || data.headline || block?.title || data.title || block?.name || 'Cinematic Motion Showcase'
  const subheadline = block?.subheadline || data.subheadline || block?.description || data.description || block?.summary || ''
  const primaryCta = block?.primaryCta || data.primaryCta || (block?.buttonText ? { label: block.buttonText, href: block.buttonHref || '#reel' } : undefined)
  const secondaryCta = block?.secondaryCta || data.secondaryCta

  return (
    <section className={`hero relative flex items-center ${heightClass} overflow-hidden bg-black text-white py-24`}>
      <div className="bg-grid hero__grid" aria-hidden="true" />
      <div className="container container--wide relative z-10">
        <div className={`max-w-4xl ${isCenter ? 'mx-auto text-center' : ''}`}>
          {badge ? (
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="pill pill--accent">{badge}</span>
            </div>
          ) : null}

          <h1 className="hero__title display-xl font-bold tracking-tight mb-8">
            {headline}
          </h1>

          {subheadline ? (
            <p className="hero__lede text-lg sm:text-xl text-neutral-400 mb-10 leading-relaxed max-w-2xl">
              {subheadline}
            </p>
          ) : null}

          <div className={`flex flex-wrap gap-4 ${isCenter ? 'justify-center' : ''}`}>
            {primaryCta ? (
              <Link href={primaryCta.href || '#'} className="btn btn--primary">
                {primaryCta.label || 'Lihat Portfolio'}
                <span className="btn__icon">
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            ) : null}

            {secondaryCta ? (
              <Link href={secondaryCta.href || '#'} className="btn btn--secondary">
                {secondaryCta.label || 'Mulai Proyek'}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
