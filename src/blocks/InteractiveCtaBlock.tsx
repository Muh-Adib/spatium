'use client'

import React from 'react'
import Link from 'next/link'
import { InteractiveCtaBlockInstance, TextEditorialBlockInstance } from './contracts'
import { Icon } from '@/components/Icon'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'

export function InteractiveCtaBlock({ block }: { block: InteractiveCtaBlockInstance | any }) {
  const data = block?.data || block || {}
  const eyebrow = block?.eyebrow || data.eyebrow || block?.badge || data.badge || ''
  const headline = block?.headline || data.headline || block?.title || data.title || 'Mulai Proyek Animasi'
  const body = block?.subheadline || data.subheadline || block?.body || data.body || block?.description || data.description || ''
  const primaryCta =
    block?.primaryCta ||
    data.primaryCta ||
    (block?.ctaText || data.ctaText || block?.buttonText
      ? {
          label: block?.ctaText || data.ctaText || block?.buttonText || 'Mulai Sekarang',
          href: block?.ctaLink || data.ctaLink || block?.buttonHref || '/contact',
        }
      : { label: 'Mulai Sekarang', href: '/contact' })
  const secondaryCta =
    block?.secondaryCta ||
    data.secondaryCta ||
    (block?.secondaryCtaText || data.secondaryCtaText
      ? {
          label: block?.secondaryCtaText || data.secondaryCtaText || 'Pelajari Lebih Lanjut',
          href: block?.secondaryCtaLink || data.secondaryCtaLink || '/portfolio',
        }
      : undefined)

  return (
    <section className="py-24 bg-accent/10 border-t border-accent/20 text-white relative overflow-hidden">
      <div className="container container--wide relative z-10 text-center max-w-3xl mx-auto">
        {eyebrow ? (
          <p className="mono text-xs uppercase tracking-widest text-accent mb-4">{eyebrow}</p>
        ) : null}

        <h2 className="display-md font-bold mb-6">{headline}</h2>

        {body ? (
          <p className="text-[var(--text-muted)] text-lg mb-10 leading-relaxed">{body}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-4">
          {primaryCta ? (
            <Link href={primaryCta.href || '/contact'} className="btn btn--primary">
              {primaryCta.label || 'Mulai Sekarang'}
              <span className="btn__icon">
                <Icon name="arrow-right" size={16} />
              </span>
            </Link>
          ) : null}

          {secondaryCta ? (
            <Link href={secondaryCta.href || '/contact'} className="btn btn--secondary">
              {secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function TextEditorialBlock({ block }: { block: TextEditorialBlockInstance | any }) {
  const data = block?.data || block || {}
  const settings = block?.settings || {}
  const isSplit = settings?.layout === 'split'
  const eyebrow = block?.eyebrow || data.eyebrow || block?.badge || data.badge || ''
  const headline = block?.headline || data.headline || block?.title || data.title || ''
  const contentHtml = block?.contentHtml || data.contentHtml || block?.content || data.content || ''
  const asideNote = block?.asideNote || data.asideNote || ''

  return (
    <section className="py-20 bg-[var(--color-background)] text-white">
      <div className="container container--wide">
        <div className={isSplit ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : 'max-w-3xl mx-auto'}>
          <div className={isSplit ? 'lg:col-span-5' : 'mb-8'}>
            {eyebrow ? (
              <p className="mono text-xs uppercase tracking-widest text-accent mb-2">{eyebrow}</p>
            ) : null}
            <h2 className="display-sm font-bold">{headline}</h2>
            {asideNote ? (
              <div className="p-4 mt-6 rounded border border-[var(--card-border)] bg-[var(--surface-translucent)] text-xs text-[var(--text-dim)]">
                {asideNote}
              </div>
            ) : null}
          </div>

          <div
            className={`prose prose-invert max-w-none ${isSplit ? 'lg:col-span-7' : ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(contentHtml) }}
          />
        </div>
      </div>
    </section>
  )
}
