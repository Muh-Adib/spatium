'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/Icon'

export function HeroCinemaBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const settings = block?.settings || {}
  const heightClass =
    settings?.height === 'medium'
      ? 'min-h-[50vh]'
      : settings?.height === 'compact'
      ? 'min-h-[40vh]'
      : 'min-h-[85vh]'

  const isCenter = settings?.alignment === 'center'
  const badge = block?.badge || data.badge || block?.categoryBadge || 'SPATIUM SPATIAL STUDIO'
  const headline = block?.headline || data.headline || block?.title || data.title || block?.name || ''
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
    media?.alt || block?.mediaAlt || block?.alt || data?.alt || headline || 'Visual digital twin SPATIUM'

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

          <h1
            className="hero__title font-medium mb-8 text-balance"
            style={{ fontFamily: 'var(--font-plus-jakarta), system-ui, sans-serif', fontSize: 'clamp(2.4rem, 6.2vw, 5.6rem)', lineHeight: 1.02, letterSpacing: '-0.04em', overflowWrap: 'normal' }}
          >
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

        {/* Media frame: only when there is real media to show. */}
        {showreelUrl || hasValidImage ? (
          <div className="mt-12 rounded-3xl overflow-hidden border border-white/10 bg-[#060A17] p-3 sm:p-5 shadow-2xl relative w-full">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10">
              {showreelUrl ? (
                <iframe
                  src={showreelUrl}
                  title={headline || 'Media'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <Image
                  src={heroImage}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>
        ) : null}

        {metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            {metrics.map((m: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-semibold text-[#6fb0ff] mb-0.5">{m.value}</div>
                <div className="text-[11px] font-mono text-white/90 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
