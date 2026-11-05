import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Cpu,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  MessageSquare,
  Globe,
  ExternalLink,
  Server,
  Database,
  Lock,
  Workflow,
  TrendingUp,
  BarChart3,
  FileCode2,
  Terminal,
  Clock,
  Shield,
  Code2,
  Check,
  Monitor,
  Smartphone,
  Eye,
  Activity,
  Maximize2,
  ArrowRight,
  FileCode,
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import { ThematicWave } from '@/components/ui/ThematicWave'
import { IframeEmbed } from '@/components/ui/IframeEmbed'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'

// ─── 1. Hero Department ───────────────────────────────────────────────────────
export function HeroDepartmentBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const variant = block?.variant || data.variant || 'cinematic'
  const title = block?.title || data.title || ''
  const titleParts = title.split('&')
  const keyOutcomes = Array.isArray(block?.keyOutcomes)
    ? block.keyOutcomes
    : Array.isArray(data.keyOutcomes)
    ? data.keyOutcomes
    : []
  const heroImage = block?.heroImage || data.heroImage

  // Clean, client-oriented labels & caption
  const imageCaption =
    block?.imageCaption ||
    data.imageCaption ||
    block?.windowTitle ||
    data.windowTitle ||
    'Karya Nyata Klien: Portal Informasi & Sistem Online'
  const imageBadge =
    block?.imageBadge ||
    data.imageBadge ||
    block?.windowBadge ||
    data.windowBadge ||
    'Akses Cepat & Responsif'
  const floatingBadges = Array.isArray(block?.floatingBadges)
    ? block.floatingBadges
    : Array.isArray(data.floatingBadges)
    ? data.floatingBadges
    : []
  const badge = block?.badge || data.badge
  const description = block?.description || data.description

  if (variant === 'showcase') {
    return (
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-36 relative overflow-hidden text-white border-b border-[var(--card-border)] bg-[var(--color-background)]">
        <ThematicWave opacity={0.55} showBottomWave={true} />
        <div className="pointer-events-none absolute -left-20 top-1/4 w-[600px] h-[600px] rounded-full bg-accent/[0.05] blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0F3A79]/[0.04] blur-[150px]" />

        <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              {badge && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md shadow-yellow">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  <span>{badge}</span>
                </div>
              )}
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.14]">
                {titleParts[0]?.trim()}{' '}
                {titleParts.length > 1 && (
                  <span className="gradient-text-italic bg-gradient-to-r from-white via-[var(--text-muted)] to-accent">
                    & {titleParts[1]?.trim()}
                  </span>
                )}
              </h1>
              {description && (
                <p className="mt-6 text-body-lg sm:text-body-xl text-[var(--text-muted)] leading-relaxed font-normal">
                  {description}
                </p>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-translucent)] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-accent/40 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                      Keunggulan Solusi
                    </span>
                  </div>
                  <span className="font-mono text-xs text-accent">{imageBadge}</span>
                </div>

                <div className="space-y-4">
                  {keyOutcomes.map((metric: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                    >
                      <span className="font-mono text-xs text-[var(--text-muted)]">{metric.label}</span>
                      <span className="font-heading text-lg sm:text-xl font-bold text-accent">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Immersive Media Showcase */}
          {heroImage && (
            <div className="mt-14 rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative group hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between px-6 py-3.5 bg-[var(--surface-translucent)] backdrop-blur-md border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-mono text-xs text-[var(--text-muted)] font-medium truncate max-w-sm">
                    {imageCaption}
                  </span>
                </div>
                <span className="font-mono text-xs text-accent hidden sm:inline-block">
                  {imageBadge}
                </span>
              </div>
              <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-black">
                <Image
                  src={heroImage}
                  alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title || 'UNIMASI Showcase'}
                  fill
                  priority
                  className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Default: cinematic variant with rich atmospheric depth + clean visual showcase
  return (
    <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-36 relative overflow-hidden text-white border-b border-[var(--card-border)] bg-[var(--color-background)]">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-accent/[0.08] blur-[180px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/4 w-[450px] h-[450px] rounded-full bg-[#0F3A79]/[0.06] blur-[160px]" />

      <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-translucent)] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md shadow-yellow">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>{badge}</span>
            </div>
          )}

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            {titleParts[0]?.trim()}{' '}
            {titleParts.length > 1 && (
              <span className="gradient-text-italic bg-gradient-to-r from-white via-[var(--text-muted)] to-accent">
                & {titleParts[1]?.trim()}
              </span>
            )}
          </h1>

          {description && (
            <p className="mt-6 max-w-3xl text-body-lg sm:text-body-xl text-[var(--text-muted)] leading-relaxed font-normal">
              {description}
            </p>
          )}

          {keyOutcomes.length > 0 && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              {keyOutcomes.map((metric: any, mIdx: number) => (
                <div
                  key={mIdx}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-translucent)] p-4.5 backdrop-blur-md text-left hover:border-accent/40 transition-all hover:-translate-y-0.5 shadow-lg group"
                >
                  <span className="font-mono text-xs text-[var(--text-dim)] block truncate group-hover:text-[var(--text-muted)]">
                    {metric.label}
                  </span>
                  <span className="font-heading text-xl sm:text-2xl font-bold text-accent mt-1 block tracking-tight">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clean Immersive Media Showcase */}
        {heroImage && (
          <div className="mt-14 sm:mt-16 rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative group hover:border-accent/40 transition-all">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[var(--surface-translucent)] backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="font-mono text-xs text-[var(--text-muted)] font-medium truncate max-w-sm">
                  {imageCaption}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 hidden sm:inline-block">
                  {imageBadge}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-black">
              <Image
                src={heroImage}
                alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title || 'UNIMASI Showcase'}
                fill
                priority
                className="object-cover object-top group-hover:scale-[1.015] transition-transform duration-700"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent pointer-events-none" />

              {/* Floating Live Badge Overlays */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-wrap gap-2.5 pointer-events-none">
                {floatingBadges.map((fBadge: any, fIdx: number) => {
                  const label = typeof fBadge === 'string' ? fBadge : fBadge?.label
                  if (!label) return null
                  return (
                    <div
                      key={fIdx}
                      className="px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-[var(--card-border)] text-xs font-mono text-[var(--text)] flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 2. Hero Service ──────────────────────────────────────────────────────────
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
    'Pengembangan Sistem & Rekayasa Digital'
  const highlightWord = block?.highlightWord || data.highlightWord || ''
  const badge =
    block?.categoryBadge ||
    data.categoryBadge ||
    block?.badge ||
    data.badge ||
    'Layanan Rekayasa'
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-translucent)] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md shadow-yellow">
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
        {whatsappPrompt && (
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(whatsappPrompt)}`}
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
                    UNIMASI SHOWREEL
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">16:9 4K DCI</span>
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

// ─── 3. Feature Bento Grid ────────────────────────────────────────────────────
export function FeatureBentoGridBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const features = Array.isArray(block?.features)
    ? block.features
    : Array.isArray(data.features)
    ? data.features
    : []
  const variant = block?.variant || data.variant || 'asymmetric-bento'
  const title = block?.title || data.title
  const description = block?.description || data.description

  if (variant === 'asymmetric-bento' && features.length >= 3) {
    const [leadFeature, ...otherFeatures] = features

    return (
      <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/[0.03] blur-3xl" />
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {title && (
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-2 font-semibold">
                Core Capabilities
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {title}
              </h2>
              {description && (
                <p className="mt-3 text-[var(--text-muted)] max-w-2xl text-body-md sm:text-body-lg">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 cq-cols-3 gap-5">
            {/* Lead Feature Card (Spans 2 columns on desktop) with High-Res Interface Mockup */}
            <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--color-surface)] border border-accent/30 relative overflow-hidden group shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              <div className="p-7 sm:p-8">
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold block mb-2">
                  Solusi Unggulan
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3">
                  {leadFeature.title}
                </h3>
                {(leadFeature.description || leadFeature.desc) && (
                  <p className="text-body-md text-[var(--text-muted)] leading-relaxed max-w-xl">
                    {leadFeature.description || leadFeature.desc}
                  </p>
                )}
              </div>

              {/* Clean Immersive Visual Preview in Bento */}
              {leadFeature.image && (
                <div className="mt-4 px-6 sm:px-8 pb-6 sm:pb-8">
                  <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden bg-black/60 relative group-hover:border-accent/40 transition-all shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-translucent)] border-b border-white/[0.06] text-xs font-mono text-[var(--text-dim)]">
                      <span className="text-accent font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {leadFeature.badge || 'Pratinjau Multi-Perangkat'}
                      </span>
                      <span className="text-[11px] text-[var(--text-dim)] hidden sm:inline">Responsif Desktop &amp; Mobile</span>
                    </div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-background)]">
                      <Image
                        src={leadFeature.image}
                        alt={(leadFeature as { alt?: string; altText?: string; title?: string })?.alt || leadFeature.altText || leadFeature.title}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 750px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Feature Cards */}
            {otherFeatures.map((feat: any, idx: number) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[var(--card-border)] flex items-center justify-center text-accent mb-4 group-hover:scale-105 group-hover:bg-accent/10 transition-all">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white mb-2">{feat.title}</h3>
                  {(feat.description || feat.desc) && (
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feat.description || feat.desc}</p>
                  )}
                </div>
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[var(--text-dim)]">
                  <span>Keunggulan 0{idx + 2}</span>
                  <span className="text-accent">Teruji</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Uniform 3-column variant
  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-[var(--text-muted)] max-w-2xl text-body-md sm:text-body-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 cq-cols-3 gap-5">
          {features.map((feat: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-colors group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white">{feat.title}</h3>
              {(feat.description || feat.desc) && (
                <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{feat.description || feat.desc}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 4. Tech Stack Chips ──────────────────────────────────────────────────────
export function TechStackChipsBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title
  const subtitle = block?.subtitle || data.subtitle
  let technologies = block?.technologies || data.technologies || []
  if (typeof technologies === 'string') {
    try {
      technologies = JSON.parse(technologies)
    } catch {
      technologies = technologies.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  }
  if (!Array.isArray(technologies)) {
    technologies = []
  }

  // Support categories fallback if technologies array is empty but categories is defined
  const categories = block?.categories || data.categories
  if (technologies.length === 0 && Array.isArray(categories)) {
    technologies = categories.flatMap((c: any) =>
      (c.technologies || []).map((t: any) =>
        typeof t === 'string' ? { name: t, category: c.category } : { ...t, category: t.category || c.category }
      )
    )
  }

  return (
    <section className="py-16 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent mb-2 font-semibold">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {!subtitle && title && <div className="mb-4" />}
        <div className="flex flex-wrap gap-2.5">
          {technologies.map((tech: any, idx: number) => {
            const name = typeof tech === 'string' ? tech : (tech?.name || tech?.title || tech?.label || '')
            const category = typeof tech === 'object' ? tech?.category : null

            if (!name && !category) return null

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--card-border)] text-xs sm:text-sm font-mono text-[var(--text-muted)] hover:text-accent hover:border-accent/40 transition-colors shadow-sm"
              >
                <span>{name || category}</span>
                {category && name && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-accent/80 border border-accent/20">
                    {category}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 5. Executive Quote Card ──────────────────────────────────────────────────
export function ExecutiveQuoteCardBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const quote = block?.quote || data.quote || ''
  const author = block?.author || data.author || ''
  const role = block?.role || data.role || ''
  const company = block?.company || data.company || ''

  return (
    <section className="py-16 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />
          <p className="font-heading text-lg sm:text-xl md:text-2xl italic text-white leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="font-bold text-sm text-white">{author}</p>
              <p className="text-xs font-mono text-accent">
                {role} {company ? `— ${company}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 6. Engineering Pillars ───────────────────────────────────────────────────
export function EngineeringPillarsBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const pillars = Array.isArray(block?.pillars)
    ? block.pillars
    : Array.isArray(data.pillars)
    ? data.pillars
    : []
  const title = block?.title || data.title
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-2 font-semibold">
              Engineering Disciplines
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-[var(--text-muted)] max-w-2xl text-body-md sm:text-body-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 cq-cols-3 gap-6">
          {pillars.map((pil: any, idx: number) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 shadow-lg relative group overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-[var(--card-border)] flex items-center justify-center text-accent mb-5 group-hover:bg-accent/10 transition-colors">
                {idx === 0 ? <Cpu className="w-5 h-5" /> : idx === 1 ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">{pil.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{pil.description || pil.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. Workflow Phases ───────────────────────────────────────────────────────
export function WorkflowPhasesBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const phases = Array.isArray(block?.phases)
    ? block.phases
    : Array.isArray(data.phases)
    ? data.phases
    : []
  const title = block?.title || data.title
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-2 font-semibold">
              Execution Methodology
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-[var(--text-muted)] max-w-2xl text-body-md sm:text-body-lg">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 cq-cols-2 gap-5 relative">
          {phases.map((ph: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 relative group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-accent block">
                  {ph.step || `0${idx + 1}`}
                </span>
                <span className="w-2 h-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">{ph.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ph.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 8. Comparison Matrix (NEW) ───────────────────────────────────────────────
export function ComparisonMatrixBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const pickRows = (val: any): any[] | null =>
    Array.isArray(val) && val.length > 0 ? val : null
  const rawRows =
    pickRows(block?.rows) ||
    pickRows(data.rows) ||
    // Manifest documents the payload as `items`; normalise it here so an
    // admin-authored block renders instead of falling back to defaults.
    pickRows(block?.items) ||
    pickRows(data.items)
  const rows = (
    rawRows || [
      { feature: 'Kualitas Produksi', unimasi: 'Standar studio sinematik 4K', traditional: 'Aset stok generik' },
      { feature: 'Storytelling', unimasi: 'Narasi khusus sesuai tujuan komunikasi', traditional: 'Visual tanpa konteks' },
      { feature: 'Hak Kepemilikan Aset', unimasi: '100% hak milik klien', traditional: 'Lisensi terbatas platform' },
    ]
  ).map((row: any) => ({
    feature: row.feature || row.aspect || row.title || '',
    unimasi: row.unimasi || row.segia || '',
    traditional: row.traditional || row.conventional || '',
  }))
  const title = block?.title || data.title || 'Mengapa Memilih Layanan Kami untuk Proyek Anda'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-24 -translate-x-1/2 w-[700px] h-[350px] bg-accent/[0.05] rounded-full blur-[140px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Perbandingan Nilai
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[var(--card-border)] bg-[var(--color-surface)] text-xs font-mono">
            <div className="p-4 md:col-span-4 text-[var(--text-dim)] font-semibold uppercase tracking-wider">
              Kebutuhan Bisnis Anda
            </div>
            <div className="p-4 md:col-span-4 bg-accent/10 text-accent font-bold uppercase tracking-wider flex items-center gap-2 border-l border-r border-accent/20">
              <Check className="w-4 h-4 text-accent" />
              <span>Standar UNIMASI</span>
            </div>
            <div className="p-4 md:col-span-4 text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Agensi Konvensional
            </div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-white/5 text-sm">
            {rows.map((row: any, rIdx: number) => (
              <div
                key={rIdx}
                className="grid grid-cols-1 md:grid-cols-12 items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="p-4 md:col-span-4 font-medium text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  <span>{row.feature}</span>
                </div>
                <div className="p-4 md:col-span-4 bg-accent/[0.04] border-l border-r border-accent/15 font-mono text-xs text-accent flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>{row.unimasi}</span>
                </div>
                <div className="p-4 md:col-span-4 font-mono text-xs text-[var(--text-dim)] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[var(--text-dim)] shrink-0" />
                  <span>{row.traditional}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 9. Architecture Blueprint (Refactored to Business Solutions Pillar) ──────
export function ArchitectureBlueprintBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const rawLayers =
    Array.isArray(block?.layers) && block.layers.length > 0
      ? block.layers
      : Array.isArray(data.layers) && data.layers.length > 0
      ? data.layers
      : null
  if (!rawLayers || rawLayers.length === 0) return null
  const layers = rawLayers

  const architectureImage = block?.image || data.image
  const imageLabel = block?.imageLabel || data.imageLabel || 'Karya Klien'
  const imageBadge = block?.imageBadge || data.imageBadge || 'Hasil Produksi'
  const hudTitle = block?.hudTitle || data.hudTitle || 'Kualitas Produksi'
  const hudMetric = block?.hudMetric || data.hudMetric || 'Standar Studio'
  const hudDesc = block?.hudDesc || data.hudDesc || 'Hasil akhir dengan detail dan konsistensi visual terjaga'
  const badge = block?.badge || data.badge || 'Standar Keunggulan'
  const title = block?.title || data.title || '4 Jaminan Kualitas untuk Pertumbuhan Bisnis Anda'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/3 w-[600px] h-[600px] bg-[#0F3A79]/[0.05] rounded-full blur-[180px]" />
      <div className="pointer-events-none absolute left-0 bottom-10 w-[450px] h-[450px] bg-accent/[0.04] rounded-full blur-[160px]" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            {badge}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)] max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authentic Client Showcase Preview */}
          {architectureImage && (
            <div className="lg:col-span-5 rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl relative group hover:border-accent/40 transition-colors">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--color-surface)] border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs text-[var(--text-muted)] font-semibold truncate max-w-[220px]">
                    {imageLabel}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20 shrink-0">
                  {imageBadge}
                </span>
              </div>

              <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-[4/5] w-full overflow-hidden bg-black">
                <Image
                  src={architectureImage}
                  alt={block?.alt || data?.alt || imageLabel || title || 'Production Showcase'}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 450px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-70 pointer-events-none" />

                {/* Technical HUD Badges */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2 pointer-events-none">
                  <div className="p-3.5 rounded-xl bg-black/85 backdrop-blur-md border border-[var(--card-border)] text-xs font-mono text-[var(--text-muted)] shadow-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{hudTitle}</span>
                      <span className="text-emerald-400">{hudMetric}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-dim)] truncate">
                      {hudDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Solution Pillars */}
          <div className={architectureImage ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
            {layers.map((layer: any, idx: number) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:bg-[var(--surface-2)] shadow-xl group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-3">
                    {layer.level ? (
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-[var(--card-border)] text-[var(--text-muted)] font-semibold">
                        {layer.level}
                      </span>
                    ) : null}
                    <h3 className="font-heading text-base sm:text-lg font-bold text-white group-hover:text-accent transition-colors">
                      {layer.title}
                    </h3>
                  </div>
                  {layer.badge ? (
                    <span className="inline-flex items-center font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent w-fit">
                      {layer.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">{layer.desc}</p>
                {layer.tech ? (
                  <div className="flex items-center gap-2 pt-2.5 border-t border-white/5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs text-accent truncate">{layer.tech}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 10. Client Stats & Impact (NEW) ──────────────────────────────────────────
export function ClientStatsImpactBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const stats =
    Array.isArray(block?.stats) && block.stats.length > 0
      ? block.stats
      : Array.isArray(data.stats) && data.stats.length > 0
      ? data.stats
      : null

  if (!stats || stats.length === 0) return null

  const title = block?.title || data.title || 'Dampak Performa Nyata & Metrik Teruji'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-accent/[0.06] rounded-full blur-[170px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Proven Metrics
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 shadow-xl text-center group"
            >
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-accent tracking-tight block group-hover:scale-105 transition-transform">
                {s.value}
              </span>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white block mt-3 mb-1">
                {s.label}
              </span>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 11. Deliverables Checklist (NEW) ─────────────────────────────────────────
export function DeliverablesChecklistBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const items =
    Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!items || items.length === 0) return null

  const title = block?.title || data.title || 'Ruang Lingkup Serah Terima & Garansi Organisasi'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Scope & Handover Guarantee
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)] max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((it: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all shadow-xl flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-white mb-1.5">{it.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 12. Interactive Tech Matrix (Quality Standards) ──────────────────────────
export function InteractiveTechMatrixBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const categories =
    Array.isArray(block?.categories) && block.categories.length > 0
      ? block.categories
      : Array.isArray(data.categories) && data.categories.length > 0
      ? data.categories
      : null

  if (!categories || categories.length === 0) return null

  const title = block?.title || data.title || 'Standar Kualitas & Keandalan yang Anda Dapatkan'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Standar Kualitas
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)] max-w-2xl">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat: any, idx: number) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-bold text-white">{cat.name}</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-[var(--card-border)] text-accent">
                  {cat.badge}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(cat.items || []).map((tech: any, tIdx: number) => {
                  const label = typeof tech === 'string' ? tech : (tech?.name || tech?.title || '')
                  if (!label) return null
                  return (
                    <span
                      key={tIdx}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-[var(--card-border)] text-xs font-mono text-[var(--text-muted)] hover:text-accent hover:border-accent/40 transition-colors"
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 13. Portfolio Proof Grid ──────────────────────────────────────────────────
export function PortfolioProofGridBlock({
  block,
  contextPortfolios,
}: {
  block: any
  contextPortfolios?: any[]
}) {
  const data = block?.data || block || {}
  const portfolios =
    Array.isArray(block?.portfolios) && block.portfolios.length > 0
      ? block.portfolios
      : Array.isArray(data.portfolios) && data.portfolios.length > 0
      ? data.portfolios
      : Array.isArray(contextPortfolios) && contextPortfolios.length > 0
      ? contextPortfolios
      : Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!portfolios || portfolios.length === 0) return null

  const title = block?.title || data.title || 'Studi Kasus Terkait'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-[var(--text-muted)] text-body-md max-w-xl">{description}</p>
            )}
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
          >
            <span>Semua Portofolio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolios.map((p: any, idx: number) => (
            <Link
              key={idx}
              href={`/portfolio/${p.slug}`}
              className="group block rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all shadow-lg"
            >
              {p.heroImage ? (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.heroImage}
                    alt={p.alt || p.title || 'Portofolio UNIMASI'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative aspect-[16/10] bg-[var(--color-surface)] border-b border-white/5 flex items-center justify-center text-[var(--text-dim)]">
                  <Eye className="w-8 h-8 opacity-40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-dim)] mb-2">
                  <span>{p.category || 'Case Study'}</span>
                  {p.client && <span>{p.client}</span>}
                </div>
                <h3 className="font-heading text-lg font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
                  <span>{p.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-accent transition-colors" />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 14. FAQ Accordion ─────────────────────────────────────────────────────────
export function FaqAccordionBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const faqs =
    Array.isArray(block?.faqs) && block.faqs.length > 0
      ? block.faqs
      : Array.isArray(data.faqs) && data.faqs.length > 0
      ? data.faqs
      : Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!faqs || faqs.length === 0) return null

  const title = block?.title || data.title || 'Pertanyaan Umum'

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white mb-8">
          {title}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq: any, idx: number) => (
            <details
              key={idx}
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] transition-colors"
            >
              <summary className="cursor-pointer font-heading font-medium text-base sm:text-lg text-white flex items-center justify-between list-none">
                <span>{faq.question}</span>
                <span className="text-accent transition-transform group-open:rotate-45 font-mono text-xl">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pl-1 border-t border-white/5 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 15. Studio CTA ───────────────────────────────────────────────────────────
export interface StudioCTAProps {
  headline?: string
  subheadline?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function StudioCTA({
  headline = 'Siap Merekayasa Transformasi Digital Bisnis Anda?',
  subheadline = 'Diskusikan visi, tantangan sistem, atau kebutuhan aplikasi imersif Anda bersama tim spesialis kami.',
  secondaryLabel = 'Jelajahi Layanan',
  secondaryHref = '/layanan',
}: StudioCTAProps) {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=Halo,%20saya%20ingin%20berkonsultasi%20mengenai%20proyek%20rekayasa%20digital.`

  return (
    <section className="section-py relative overflow-hidden bg-[var(--surface-2)] text-white border-t border-[var(--card-border)]" aria-label="Ajakan Bertindak">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-r from-accent/[0.12] via-[#0F3A79]/[0.08] to-accent/[0.12] blur-[150px]" />
      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-[32px] sm:rounded-[40px] border border-[var(--card-border)] bg-[var(--color-surface)] p-8 sm:p-14 lg:p-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          <h2 className="font-heading text-display-md sm:text-display-lg lg:text-display-xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {headline}
          </h2>
          <p className="mt-6 text-body-lg sm:text-body-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed font-normal">
            {subheadline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
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
            Atau kirimkan brief sistem via email ke{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-accent hover:underline font-semibold">
              {siteConfig.email}
            </a>
          </div>
          <div className="mt-10 pt-8 border-t border-[var(--card-border)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-[var(--text-muted)] max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <span>Respon Cepat &lt; 24 Jam</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileCode className="w-4 h-4 text-accent shrink-0" />
              <span>Arsitektur &amp; Estimasi Gratis</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span>Perjanjian NDA Resmi</span>
            </div>
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
      headline={block?.headline || data.headline || block?.title || data.title || 'Mulai Proyek Digital Anda'}
      subheadline={block?.subheadline || data.subheadline || block?.description || data.description || 'Konsultasikan arsitektur dan kebutuhan spesifik sistem Anda.'}
      secondaryLabel={block?.buttonText || data.buttonText || block?.ctaText || data.ctaText || 'Konsultasi Sekarang'}
      secondaryHref={block?.buttonUrl || data.buttonUrl || block?.ctaUrl || data.ctaUrl || `https://wa.me/${siteConfig.whatsapp}`}
    />
  )
}

// ─── 16. Editorial Paragraph / Heading Blocks ──────────────────────────────────
export function EditorialParagraphBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const text = block?.text || data.text || block?.content || data.content || ''
  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
        <p>{text}</p>
      </div>
    </section>
  )
}

export function EditorialHeadingBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const isH2 = (block?.type || data.type) === 'heading2'
  const text = block?.text || data.text || block?.content || data.content || block?.title || data.title || ''
  return (
    <section className="pt-10 pb-4 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        {isH2 ? (
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {text}
          </h2>
        ) : (
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
            {text}
          </h3>
        )}
      </div>
    </section>
  )
}

export function TableBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const headers: string[] = block?.headers || data.headers || []
  const rows: string[][] = block?.rows || data.rows || []
  const caption: string = block?.caption || data.caption || ''
  const title: string = block?.title || data.title || ''

  if (!headers.length && !rows.length) return null

  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        {title && (
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white mb-4">
            {title}
          </h3>
        )}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm border-collapse">
            {headers.length > 0 && (
              <thead className="bg-[#0F3A79]/40 border-b border-white/10 text-white font-semibold">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-3 px-4 text-xs font-mono tracking-wider uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-white/5">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.04] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 text-[var(--text-muted)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {caption && (
          <p className="mt-2 text-xs text-neutral-400 font-mono italic">
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}

export function InternalLinksBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title || 'Tautan Internal & Artikel Terkait'
  const rawLinks = block?.links || data.links || []

  if (!rawLinks.length) return null

  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        {title && (
          <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#FFD600] rounded-sm inline-block" />
            {title}
          </h3>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rawLinks.map((link: any, idx: number) => {
            const href = link.href || link.url || (link.slug ? `/journal/${link.slug}` : '#')
            const text = link.title || link.text || link.name || 'Lihat Selengkapnya'
            const desc = link.description || link.excerpt
            return (
              <Link
                key={idx}
                href={href}
                className="group block p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#FFD600]/40 transition-all"
              >
                <div className="flex items-center justify-between text-sm font-medium text-white group-hover:text-[#FFD600] transition-colors">
                  <span>{text}</span>
                  <span className="text-xs text-[#FFD600] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                {desc && (
                  <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                    {desc}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 17. Department Service List (NEW) ─────────────────────────────────────────
export function DepartmentServiceListBlock({
  block,
  contextServices,
}: {
  block: any
  contextServices?: any[]
}) {
  const data = block?.data || block || {}
  const resolveImage = (img: any): string | null => {
    if (!img) return null
    if (typeof img === 'string') {
      const trimmed = img.trim()
      return trimmed.length > 0 ? trimmed : null
    }
    if (typeof img === 'object' && img.url) {
      const trimmed = typeof img.url === 'string' ? img.url.trim() : ''
      return trimmed.length > 0 ? trimmed : null
    }
    return null
  }

  const items =
    Array.isArray(block?.services) && block.services.length > 0
      ? block.services
      : Array.isArray(data.services) && data.services.length > 0
      ? data.services
      : Array.isArray(contextServices) && contextServices.length > 0
      ? contextServices.map((cs) => {
          return {
            slug: cs.slug,
            name: cs.name,
            badge: cs.categoryBadge || 'Spesialisasi',
            description: cs.shortDescription || cs.description,
            image: resolveImage(cs.heroImage),
            tags: Array.isArray(cs.technologies)
              ? cs.technologies.slice(0, 3).map((t: any) => (typeof t === 'string' ? t : t?.name || 'Fitur'))
              : ['Animasi 4K', 'Master Delivery'],
          }
        })
      : null

  if (!items || items.length === 0) return null

  const title = block?.title || data.title || 'Layanan Animasi & Motion Design yang Kami Sediakan'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/4 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute left-0 bottom-10 w-[450px] h-[450px] bg-[#0F3A79]/[0.03] blur-[150px]" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Layanan Studio UNIMASI
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {items.map((item: any, idx: number) => {
            const finalImg = resolveImage(item.image)
            return (
              <Link
                key={idx}
                href={`/services/${item.slug}`}
                className="group rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Visual Thumbnail Image */}
                  {finalImg ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-surface)] border-b border-white/5">
                      <Image
                        src={finalImg}
                        alt={item.alt || item.altText || item.name || 'Layanan Animasi UNIMASI'}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 550px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-60" />
                      <div className="absolute top-4 left-4">
                        <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[var(--card-border)] text-accent font-medium shadow-md">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 pb-0 flex items-center justify-between">
                      <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-white/5 border border-[var(--card-border)] text-accent font-medium shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Content Details */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-heading text-xl font-bold text-white group-hover:text-accent transition-colors leading-snug">
                        {item.name}
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-[var(--card-border)] flex items-center justify-center text-[var(--text-dim)] group-hover:bg-accent group-hover:text-[var(--color-primaryForeground)] group-hover:border-accent transition-all shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 mb-6">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Tags & Action Footer */}
                <div className="px-6 sm:px-7 pb-6 pt-0 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2 pt-3">
                    {(item.tags || []).map((tag: any, tIdx: number) => {
                      const tagLabel = typeof tag === 'string' ? tag : tag?.name || 'Fitur'
                      return (
                        <span
                          key={tIdx}
                          className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-[var(--card-border)] text-[var(--text-muted)]"
                        >
                          {tagLabel}
                        </span>
                      )
                    })}
                  </div>
                  <span className="text-xs font-mono text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 pt-3">
                    Detail Layanan &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 18. Visual Showcase Gallery (NEW) ─────────────────────────────────────────
export function VisualShowcaseGalleryBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const items =
    Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!items || items.length === 0) return null

  const badge = block?.badge || data.badge || 'Bukti Portofolio Nyata'
  const title = block?.title || data.title || 'Bukti Hasil Pengerjaan Nyata untuk Klien Kami'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.04] blur-[160px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            {badge}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden shadow-2xl group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.alt || item.altText || item.title || 'Karya Animasi UNIMASI'}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 400px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)] text-[var(--text-dim)]">
                      <Eye className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-60" />
                  {item.metric && (
                    <div className="absolute top-3.5 right-3.5">
                      <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[var(--card-border)] text-emerald-400 font-semibold shadow-md">
                        {item.metric}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {item.category && (
                    <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold block mb-2">
                      {item.category}
                    </span>
                  )}
                  <h3 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  {item.desc && (
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[var(--text-dim)]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                    <span>Karya Produksi Aktif</span>
                  </span>
                  <span className="text-accent">Terverifikasi</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 20. Media Showcase / Editorial Image Block ─────────────────────────────
export function MediaShowcaseBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const image = block?.image || data.image || block?.imageUrl || data.imageUrl || block?.heroImage || data.heroImage || ''
  const alt = block?.alt || data.alt || block?.altText || data.altText || block?.title || data.title || 'Tampilan Visual Sistem'
  const caption = block?.caption || data.caption || block?.description || data.description
  const rawFrameStyle = block?.frameStyle || data.frameStyle || 'immersive'
  const frameStyle = rawFrameStyle === 'browser' ? 'immersive' : rawFrameStyle // Backward compatible mapping
  const aspectRatio = block?.aspectRatio || data.aspectRatio || '16/10' // '16/9' | '16/10' | '21/9' | '4/3' | '1/1'
  const imageLabel = block?.imageLabel || data.imageLabel || block?.windowTitle || data.windowTitle || block?.title || data.title || 'Dokumentasi Visual Antarmuka'
  const badge = block?.badge || data.badge || 'Showcase Visual'
  const title = block?.title || data.title
  const subtitle = block?.subtitle || data.subtitle
  const floatingBadges = Array.isArray(block?.floatingBadges) ? block.floatingBadges : Array.isArray(data.floatingBadges) ? data.floatingBadges : []

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '16/9':
        return 'aspect-video'
      case '21/9':
        return 'aspect-[21/9]'
      case '4/3':
        return 'aspect-[4/3]'
      case '1/1':
        return 'aspect-square'
      case '16/10':
      default:
        return 'aspect-[16/10]'
    }
  }

  return (
    <section className="py-16 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/[0.03] blur-[150px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {(title || badge) && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            {badge && (
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
                {badge}
              </span>
            )}
            {title && (
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-body-md text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Clean, Minimalist Media Frame Container */}
        <div className={`mx-auto max-w-5xl ${
          frameStyle === 'immersive'
            ? 'rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] group hover:border-accent/40 transition-all'
            : frameStyle === 'floating-card'
            ? 'rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl p-2.5 sm:p-3 hover:border-accent/40 transition-all'
            : 'overflow-hidden rounded-2xl shadow-xl'
        }`}>
          {/* Minimalist Context Bar for Immersive style */}
          {frameStyle === 'immersive' && (imageLabel || badge) && (
            <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface-translucent)] backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-[var(--text-muted)] font-medium truncate max-w-sm sm:max-w-md">
                  {imageLabel}
                </span>
              </div>
              <span className="font-mono text-[11px] text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 hidden sm:inline-block">
                {badge}
              </span>
            </div>
          )}

          {/* Actual Media Image */}
          <div className={`relative ${getAspectClass()} w-full overflow-hidden bg-black/60 ${frameStyle === 'floating-card' ? 'rounded-2xl' : ''}`}>
            {image ? (
              <Image
                src={image}
                alt={alt}
                fill
                className="object-cover object-top group-hover:scale-[1.015] transition-transform duration-700"
                sizes="(max-width: 1200px) 100vw, 1100px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[var(--surface-2)] to-[var(--color-surface)] border border-dashed border-[var(--line-strong)] p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[var(--card-border)] flex items-center justify-center text-accent mb-3">
                  <Eye className="w-8 h-8 opacity-70" />
                </div>
                <p className="font-heading text-sm font-semibold text-white mb-1">
                  Showcase Media
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  Pratinjau visual belum tersedia.
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Floating Overlays */}
            {floatingBadges.length > 0 && (
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-wrap gap-2 pointer-events-none">
                {floatingBadges.map((fBadge: any, fIdx: number) => {
                  const label = typeof fBadge === 'string' ? fBadge : fBadge?.label
                  if (!label) return null
                  return (
                    <div
                      key={fIdx}
                      className="px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-[var(--card-border)] text-xs font-mono text-[var(--text)] flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        {caption && (
          <p className="mt-4 text-center text-xs text-[var(--text-dim)] font-mono max-w-2xl mx-auto leading-relaxed">
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}

// ─── 21. Hero Portfolio / Case Study ──────────────────────────────────────────
export function HeroPortfolioBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title || block?.headline || data.headline || 'Studi Kasus Animasi & Motion'
  const client = block?.client || data.client || 'UNIMASI Studio Partner'
  const year = block?.year || data.year || new Date().getFullYear()
  const category = block?.category || data.category || '3D Animation'
  const discipline = block?.discipline || data.discipline || 'Animation & Visual Production'
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
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Klien: <strong className="text-white">{client}</strong></span>
          </div>
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
                    {client} &bull; {category}
                  </span>
                  {liveUrl && (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-black font-bold hover:bg-[#ffe855] transition-colors shadow"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-[var(--color-primaryForeground)] font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] transition-all shadow-[0_0_20px_rgba(255,214,0,0.25)]"
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

// ─── 22. Portfolio Case Study Narrative ───────────────────────────────────────
export function PortfolioCaseStudyBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const eyebrow = block?.eyebrow || data.eyebrow || 'Studi Naratif & Rekayasa'
  const title = block?.title || data.title || 'Tantangan, Pendekatan & Solusi Produksi'
  const description = block?.description || data.description || 'Bagaimana UNIMASI menerjemahkan brief rumit klien menjadi eksekusi visual berkualitas tinggi.'
  const challenge = block?.challenge || data.challenge
  const approach = block?.approach || data.approach
  const solution = block?.solution || data.solution
  const result = block?.result || data.result
  const highlights = Array.isArray(block?.highlights) ? block.highlights : Array.isArray(data.highlights) ? data.highlights : []

  const sections = [
    {
      num: '01',
      badge: 'The Challenge',
      title: 'Tantangan & Problem Statement',
      content: challenge,
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      num: '02',
      badge: 'Creative Approach',
      title: 'Pendekatan Artistik & Storytelling',
      content: approach,
      borderColor: 'border-sky-500/30',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      num: '03',
      badge: 'CGI & Engineering',
      title: 'Solusi Teknis & Eksekusi Pipeline',
      content: solution,
      borderColor: 'border-accent/40',
      badgeColor: 'bg-accent/10 text-accent border-accent/30',
    },
    {
      num: '04',
      badge: 'Impact & Result',
      title: 'Hasil Akhir & Dampak Klien',
      content: result,
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ].filter((s) => Boolean(s.content))

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/3 top-10 w-[500px] h-[350px] bg-accent/[0.03] blur-[150px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            {eyebrow}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-body-md text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Narrative Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border ${sec.borderColor} bg-[var(--color-background)] p-6 sm:p-8 relative flex flex-col justify-between group hover:border-accent/50 transition-all shadow-xl`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${sec.badgeColor}`}>
                    {sec.badge}
                  </span>
                  <span className="font-mono text-xs text-neutral-600 font-bold">
                    {sec.num}
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                  {sec.title}
                </h3>
                <div className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed space-y-3 whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Highlights Bar if available */}
        {highlights.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--color-background)]/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {highlights.map((h: any, i: number) => (
              <div key={i} className="p-3">
                <p className="text-xl sm:text-2xl font-bold text-accent font-mono">{h.value}</p>
                <p className="text-xs text-white font-medium mt-1">{h.label}</p>
                {h.detail && <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{h.detail}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 23. Hero Solution ────────────────────────────────────────────────────────
export function HeroSolutionBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const badge = block?.badge || data.badge || 'Solusi Bisnis & Industri'
  const title = block?.title || data.title || block?.headline || data.headline || 'Solusi Animasi & Motion Berorientasi Hasil'
  const shortDescription = block?.shortDescription || data.shortDescription || block?.description || data.description || ''
  const heroImage = block?.heroImage || data.heroImage || ''
  const category = block?.category || data.category || 'Enterprise Solution'
  const rawBenefits = block?.keyBenefits || data.keyBenefits || []
  const benefits: string[] = Array.isArray(rawBenefits)
    ? rawBenefits
    : typeof rawBenefits === 'string'
    ? rawBenefits.split('\n').filter(Boolean)
    : []
  const primaryCta = block?.primaryCta || data.primaryCta || { label: 'Konsultasi Solusi Ini', href: '/contact' }
  const secondaryCta = block?.secondaryCta || data.secondaryCta || { label: 'Lihat Studi Kasus', href: '/portfolio' }

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute -left-20 top-20 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[160px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-[#0F3A79]/[0.08] blur-[150px]" />

      <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono font-semibold">
                {badge}
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--color-surface)] text-[var(--text-muted)] border border-[var(--card-border)] text-xs font-mono">
                {category}
              </span>
            </div>

            <h1 className="text-display-md sm:text-display-lg font-bold tracking-tight text-white leading-[1.15]">
              {title}
            </h1>

            {shortDescription && (
              <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
                {shortDescription}
              </p>
            )}

            {/* Key Benefits List */}
            {benefits.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Manfaat Utama Solusi:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{b.replace(/^[-*•]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              {primaryCta?.href && (
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-[var(--color-primaryForeground)] font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#ffe855] transition-all shadow-[0_0_25px_rgba(255,214,0,0.3)]"
                >
                  <span>{primaryCta.label || 'Konsultasi Solusi'}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-primaryForeground)]" />
                </Link>
              )}
              {secondaryCta?.href && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-surface)] border border-[var(--card-border)] text-white font-mono text-xs hover:border-accent hover:text-accent transition-all"
                >
                  <span>{secondaryCta.label || 'Lihat Portfolio Terkait'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Right Image / Showcase Column */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--color-surface)] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative group p-3">
              <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black/60">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#181818] to-[#101010]">
                    <Sparkles className="w-12 h-12 text-accent mb-3 opacity-60" />
                    <p className="font-heading text-lg font-bold text-white">{title}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] mt-1">{category}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/10 text-accent font-semibold">
                    UNIMASI Engine
                  </span>
                  <span className="text-white/80">Tailored Production</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 24. Case Study Chapter ───────────────────────────────────────────────────
export function CaseStudyChapterBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const chapterNumber = block?.chapterNumber || data.chapterNumber || '01'
  const title = block?.title || data.title || ''
  const subtitle = block?.subtitle || data.subtitle || ''
  const content = block?.content || data.content || ''

  return (
    <section className="py-16 sm:py-20 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--card-border)] text-xs font-mono text-accent font-bold">
            Bab {chapterNumber}
          </span>
          {subtitle && (
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
        <h3 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6">
          {title}
        </h3>
        <div
          className="text-body-md text-[var(--text-muted)] leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(content) }}
        />
      </div>
    </section>
  )
}



