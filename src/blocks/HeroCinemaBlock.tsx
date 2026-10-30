'use client'

import React from 'react'
import Link from 'next/link'
import { HeroCinemaBlockInstance } from './contracts'
import { Icon } from '@/components/Icon'
import '@/components/home/hero.css'

export function HeroCinemaBlock({ block }: { block: HeroCinemaBlockInstance }) {
  const { data, settings } = block
  const heightClass =
    settings?.height === 'medium'
      ? 'min-h-[50vh]'
      : settings?.height === 'compact'
      ? 'min-h-[40vh]'
      : 'min-h-[85vh]'

  const isCenter = settings?.alignment === 'center'

  return (
    <section className={`hero relative flex items-center ${heightClass} overflow-hidden bg-black text-white py-24`}>
      <div className="bg-grid hero__grid" aria-hidden="true" />
      <div className="container container--wide relative z-10">
        <div className={`max-w-4xl ${isCenter ? 'mx-auto text-center' : ''}`}>
          {data.badge ? (
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="pill pill--accent">{data.badge}</span>
            </div>
          ) : null}

          <h1 className="hero__title display-xl font-bold tracking-tight mb-8">
            {data.headline}
          </h1>

          {data.subheadline ? (
            <p className="hero__lede text-lg sm:text-xl text-neutral-400 mb-10 leading-relaxed max-w-2xl">
              {data.subheadline}
            </p>
          ) : null}

          <div className={`flex flex-wrap gap-4 ${isCenter ? 'justify-center' : ''}`}>
            {data.primaryCta ? (
              <Link href={data.primaryCta.href} className="btn btn--primary">
                {data.primaryCta.label}
                <span className="btn__icon">
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            ) : null}

            {data.secondaryCta ? (
              <Link href={data.secondaryCta.href} className="btn btn--secondary">
                {data.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
