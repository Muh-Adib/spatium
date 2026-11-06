import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ExternalLink, ArrowRight } from 'lucide-react'
import { ThematicWave } from '@/components/ui/ThematicWave'
import { IframeEmbed } from '@/components/ui/IframeEmbed'

export function HeroPortfolioBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title || block?.headline || data.headline || 'Studi Kasus Digital Twin'
  const client = block?.client || data.client || ''
  const year = block?.year || data.year || new Date().getFullYear()
  const category = block?.category || data.category || 'Digital Twin'
  const discipline = block?.discipline || data.discipline || 'Spatial Capture & 3D Gaussian Splatting'
  const summary = block?.summary || data.summary || block?.description || data.description || ''
  const heroImage = block?.heroImage || data.heroImage || block?.posterUrl || data.posterUrl || ''
  const videoUrl = block?.videoUrl || data.videoUrl || ''
  const liveUrl = block?.liveUrl || data.liveUrl || ''
  const primaryCta = block?.primaryCta || data.primaryCta || { label: 'Mulai Proyek Serupa', href: '/contact' }
  const tags = Array.isArray(block?.tags) ? block.tags : Array.isArray(data.tags) ? data.tags : [category, discipline].filter(Boolean)

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute -left-20 top-20 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[160px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-[#0F3A79]/[0.08] blur-[150px]" />

      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb & Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link href="/portfolio" className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1.5">
            <span>Portofolio</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          </Link>
          <span className="px-3 py-1 rounded-full bg-[var(--color-surface)] text-accent border border-[var(--card-border)] text-xs font-mono font-medium">
            {category}
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--text-muted)] border border-[var(--card-border)] text-xs font-mono">
            Tahun {year}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Production Ready
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-display-md sm:text-display-lg font-bold tracking-tight text-white leading-[1.15]">
          {title}
        </h1>

        {/* Client & Discipline Info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-mono text-[var(--text-muted)]">
          {client && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Klien: <strong className="text-white">{client}</strong></span>
            </div>
          )}
          {discipline && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">•</span>
              <span>Disiplin: <strong className="text-white">{discipline}</strong></span>
            </div>
          )}
        </div>

        {/* Summary Narrative */}
        {summary && (
          <p className="mt-6 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-3xl">
            {summary}
          </p>
        )}

        {/* Hero Media Showcase (Poster or Video Embed) */}
        {(heroImage || videoUrl) && (
          <div className="mt-10 rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative group">
            {videoUrl ? (
              <IframeEmbed url={videoUrl} title={title} aspectRatio="16/9" />
            ) : (
              <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                <Image
                  src={heroImage}
                  alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-neutral-300">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white">
                    {client ? <>{client} &bull; {category}</> : category}
                  </span>
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-black font-bold hover:bg-[#6fb0ff] transition-colors shadow"
                    >
                      <span>Lihat Live Preview</span>
                      <ExternalLink className="w-3.5 h-3.5 text-black" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[var(--card-border)]">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag: string, idx: number) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--card-border)] text-[11px] font-mono text-[var(--text-muted)]">
                #{tag}
              </span>
            ))}
          </div>
          {primaryCta?.href && (
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-[var(--color-primaryForeground)] font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-[0_0_20px_rgba(77,139,255,0.25)]"
            >
              <span>{primaryCta.label || 'Konsultasi Brief Ini'}</span>
              <ArrowRight className="w-4 h-4 text-[var(--color-primaryForeground)]" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
