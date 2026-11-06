import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { siteConfig, whatsappHref } from '@/config/site'

/** Headline and subheadline come only from the block; nothing is rendered in their place when empty. */
export interface StudioCTAProps {
  headline?: string
  subheadline?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function StudioCTA({
  headline,
  subheadline,
  secondaryLabel = 'Jelajahi Layanan',
  secondaryHref = '/services',
}: StudioCTAProps) {
  const whatsappUrl = whatsappHref(siteConfig.whatsapp, 'Halo SPATIUM, saya ingin berkonsultasi mengenai proyek digital twin.')

  return (
    <section className="section-py relative overflow-hidden bg-[var(--surface-2)] text-white border-t border-[var(--card-border)]" aria-label="Ajakan Bertindak">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-r from-accent/[0.12] via-[#0F3A79]/[0.08] to-accent/[0.12] blur-[150px]" />
      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-[32px] sm:rounded-[40px] border border-[var(--card-border)] bg-[var(--color-surface)] p-8 sm:p-14 lg:p-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          {headline ? (
            <h2 className="font-heading text-display-md sm:text-display-lg lg:text-display-xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
              {headline}
            </h2>
          ) : null}
          {subheadline ? (
            <p className="mt-6 text-body-lg sm:text-body-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed font-normal">
              {subheadline}
            </p>
          ) : null}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary w-full sm:w-auto"
              >
                <span className="btn__icon">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <span>Konsultasi Proyek (WhatsApp)</span>
              </a>
            ) : (
              <Link href="/contact" className="btn btn--primary w-full sm:w-auto">
                <span className="btn__icon">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <span>Konsultasi Proyek</span>
              </Link>
            )}
            <Link
              href={secondaryHref}
              className="btn btn--ghost w-full sm:w-auto"
            >
              <span>{secondaryLabel}</span>
              <span className="btn__icon">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          <div className="mt-8 text-xs font-mono text-[var(--text-dim)]">
            Atau kirimkan brief proyek via email ke{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline font-semibold">
              {siteConfig.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function StudioCtaBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  return (
    <StudioCTA
      headline={block?.headline || data.headline || block?.title || data.title || undefined}
      subheadline={block?.subheadline || data.subheadline || block?.description || data.description || undefined}
      secondaryLabel={block?.buttonText || data.buttonText || block?.ctaText || data.ctaText || 'Konsultasi Sekarang'}
      secondaryHref={block?.buttonUrl || data.buttonUrl || block?.ctaUrl || data.ctaUrl || '/contact'}
    />
  )
}
