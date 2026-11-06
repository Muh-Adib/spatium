import Image from 'next/image'
import Link from 'next/link'
import { Zap, MessageSquare } from 'lucide-react'
import { siteConfig, whatsappHref } from '@/config/site'
import { ThematicWave } from '@/components/ui/ThematicWave'
import { IframeEmbed } from '@/components/ui/IframeEmbed'

export function HeroServiceBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const metrics = Array.isArray(block?.metrics)
    ? block.metrics
    : Array.isArray(data.metrics)
    ? data.metrics
    : []
  const primaryMedia = block?.primaryMedia || data.primaryMedia
  const heroImageUrl =
    block?.heroImage ||
    data.heroImage ||
    primaryMedia?.imageUrl ||
    primaryMedia?.url ||
    ''
  const title =
    block?.name ||
    data.name ||
    block?.title ||
    data.title ||
    'Layanan Spasial SPATIUM'
  const highlightWord = block?.highlightWord || data.highlightWord || ''
  const badge =
    block?.categoryBadge ||
    data.categoryBadge ||
    block?.badge ||
    data.badge ||
    'Layanan Spasial'
  const description =
    block?.description ||
    data.description ||
    block?.shortDescription ||
    data.shortDescription ||
    block?.summary ||
    data.summary ||
    ''
  const subtitle = block?.subtitle || data.subtitle
  const client = block?.client || data.client
  const whatsappPrompt = block?.whatsappPrompt || data.whatsappPrompt

  return (
    <section className="pt-28 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32 relative overflow-hidden bg-[var(--color-background)] text-white border-b border-[var(--card-border)] w-full">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute -right-20 top-1/4 w-[650px] h-[650px] rounded-full bg-accent/[0.06] blur-[160px]" />
      <div className="pointer-events-none absolute -left-20 bottom-10 w-[500px] h-[500px] rounded-full bg-[#0F3A79]/[0.04] blur-[140px]" />

      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-translucent)] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>{badge}</span>
          </div>
        )}

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          {title}{' '}
          {highlightWord && (
            <span className="gradient-text-italic bg-gradient-to-r from-white via-[var(--text-muted)] to-accent">
              {highlightWord}
            </span>
          )}
        </h1>

        {subtitle && (
          <p className="mt-3 text-sm sm:text-base font-mono text-accent/90">
            {subtitle}
          </p>
        )}

        {client && (
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Mitra Klien: <strong className="text-white">{client}</strong></span>
          </p>
        )}

        {description && (
          <p className="mt-6 max-w-3xl text-body-lg sm:text-body-xl text-[var(--text-muted)] leading-relaxed font-normal">
            {description}
          </p>
        )}

        {/* WhatsApp CTA button */}
        {whatsappPrompt && whatsappHref(siteConfig.whatsapp, whatsappPrompt) && (
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              href={whatsappHref(siteConfig.whatsapp, whatsappPrompt) ?? '/contact'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              <span className="btn__icon">
                <MessageSquare className="w-4 h-4" />
              </span>
              <span>Konsultasikan Spesifikasi</span>
            </Link>
          </div>
        )}

        {/* Primary Media & Metrics */}
        {(heroImageUrl || primaryMedia?.videoUrl || metrics.length > 0) && (
          <div className="mt-12 rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--color-surface)] p-3 shadow-2xl relative group">
            {primaryMedia?.type === 'video' && primaryMedia?.videoUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <IframeEmbed url={primaryMedia.videoUrl} title={title} aspectRatio="16/9" />
              </div>
            ) : heroImageUrl && heroImageUrl.trim() !== '' && !heroImageUrl.includes('default') ? (
              <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-black/40">
                <Image
                  src={heroImageUrl}
                  alt={primaryMedia?.altText || block.altText || title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--color-background)] via-[#0F3A79]/40 to-[var(--color-background)] p-6 flex flex-col justify-between border border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30 uppercase tracking-wider">
                    SPATIUM 3DGS
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">Walkable Reality</span>
                </div>
                <div className="text-center my-auto py-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 mx-auto flex items-center justify-center text-accent font-heading font-bold text-lg mb-2">
                    ▶
                  </div>
                  <p className="text-sm font-heading font-bold text-white/90">{title}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-dim)] border-t border-white/5 pt-2">
                  <span>ANIMATION &amp; 3D CGI</span>
                  <span className="text-accent">MASTER RENDER</span>
                </div>
              </div>
            )}

            {metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[var(--color-surface)] border-t border-[var(--card-border)]">
                {metrics.map((m: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-accent/40 transition-colors">
                    <p className="font-mono text-xs text-[var(--text-dim)]">{m.label}</p>
                    <p className="font-heading text-xl font-bold text-accent mt-1">{m.value}</p>
                    {m.detail && <p className="text-xs text-[var(--text-dim)] mt-0.5">{m.detail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
