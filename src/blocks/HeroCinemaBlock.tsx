'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const badge = block?.badge || data.badge || block?.categoryBadge || 'UNIMASI ANIMATION STUDIO'
  const headline = block?.headline || data.headline || block?.title || data.title || block?.name || 'Cinematic 3D Animation Showcase'
  const subheadline = block?.subheadline || data.subheadline || block?.description || data.description || block?.summary || ''
  const primaryCta = block?.primaryCta || data.primaryCta || (block?.buttonText ? { label: block.buttonText, href: block.buttonHref || '#reel' } : undefined)
  const secondaryCta = block?.secondaryCta || data.secondaryCta

  const media = block?.media || data?.media
  const mediaUrl = block?.mediaUrl || data?.mediaUrl || media?.src || media?.url
  const mediaType = block?.mediaType || data?.mediaType || media?.type
  const showreelUrl =
    block?.showreelUrl || data?.showreelUrl || block?.videoUrl || data?.videoUrl ||
    (mediaType === 'video' ? mediaUrl : undefined)
  const heroImage =
    block?.heroImage || data?.heroImage || block?.image || data?.image ||
    (mediaType !== 'video' ? mediaUrl : undefined) || media?.poster
  const rawMetrics = block?.metrics || data?.metrics || block?.stats || data?.stats || []
  const metrics = Array.isArray(rawMetrics) ? rawMetrics : []
  const [imgError, setImgError] = useState(false)
  const hasValidImage = Boolean(heroImage && typeof heroImage === 'string' && heroImage.trim().length > 0 && !imgError)

  const imageAlt =
    media?.alt || block?.mediaAlt || block?.alt || data?.alt || headline || 'Visual showcase UNIMASI Studio'

  return (
    <section className={`hero relative flex items-center ${heightClass} overflow-hidden bg-[var(--color-background)] text-white py-20 lg:py-28`}>
      <div className="bg-grid hero__grid" aria-hidden="true" />
      <div className="container container--wide relative z-10 w-full">
        <div className={`max-w-4xl ${isCenter ? 'mx-auto text-center' : ''}`}>
          {badge ? (
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="pill pill--accent">{badge}</span>
            </div>
          ) : null}

          <h1 className="hero__title display-xl font-syne font-bold tracking-tight mb-8">
            {headline}
          </h1>

          {subheadline ? (
            <p className="hero__lede text-lg sm:text-xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-2xl">
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
                {secondaryCta.label || 'Konsultasi Produksi'}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Cinematic Media Showcase Frame / 4K Preview */}
        <div className="mt-12 rounded-3xl overflow-hidden border border-white/10 bg-[#060A17] p-3 sm:p-5 shadow-2xl relative w-full">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center group">
            {showreelUrl ? (
              <iframe
                src={showreelUrl}
                title={headline}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : hasValidImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={heroImage}
                  alt={imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  onError={() => setImgError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFD600]/90 text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,214,0,0.5)] group-hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-2xl font-bold ml-1">▶</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#060A17] via-[#0F3A79]/30 to-[#060A17] p-8 flex flex-col justify-between items-center text-center min-h-[220px]">
                <div className="px-3 py-1 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600] font-mono text-xs font-bold uppercase tracking-wider">
                  4K DCI CINEMATIC MASTER
                </div>
                <div className="w-14 h-14 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/30 flex items-center justify-center text-[#FFD600] text-2xl shadow-[0_0_25px_rgba(255,214,0,0.2)] my-auto">
                  ▶
                </div>
                <div className="text-xs font-mono text-neutral-400">UNIMASI HIGH-FIDELITY ANIMATION ENGINE</div>
              </div>
            )}
          </div>

          {/* 3 Metric Pills below media */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {metrics.map((m: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-xl sm:text-2xl font-syne font-bold text-[#FFD600] mb-0.5">
                    {m.value}
                  </div>
                  <div className="text-[11px] font-mono text-white/90 font-medium">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
