'use client'

import Link from 'next/link'
import { Icon } from '@/components/Icon'

export function InteractiveCtaBlock({ block }: { block: any }) {
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
