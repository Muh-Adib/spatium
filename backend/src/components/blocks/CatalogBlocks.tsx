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

// ─── 1. Hero Department ───────────────────────────────────────────────────────
export function HeroDepartmentBlock({ block }: { block: any }) {
  const variant = block.variant || 'cinematic'
  const titleParts = (block.title || '').split('&')
  const keyOutcomes = block.keyOutcomes || []
  const heroImage = block.heroImage

  // Clean, client-oriented labels & caption
  const imageCaption = block.imageCaption || block.windowTitle || 'Karya Nyata Klien: Portal Informasi & Sistem Online'
  const imageBadge = block.imageBadge || block.windowBadge || 'Akses Cepat & Responsif'
  const floatingBadges = block.floatingBadges || []

  if (variant === 'showcase') {
    return (
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-36 relative overflow-hidden text-white border-b border-white/[0.08] bg-[#0A0A0A]">
        <ThematicWave opacity={0.55} showBottomWave={true} />
        <div className="pointer-events-none absolute -left-20 top-1/4 w-[600px] h-[600px] rounded-full bg-[#F2C7A0]/[0.05] blur-[160px]" />
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#C68D5D]/[0.04] blur-[150px]" />

        <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              {block.badge && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] text-[#F2C7A0] border border-[#F2C7A0]/30 text-xs font-mono mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(242,199,160,0.12)]">
                  <Layers className="w-3.5 h-3.5 text-[#F2C7A0]" />
                  <span>{block.badge}</span>
                </div>
              )}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.14]">
                {titleParts[0]?.trim()}{' '}
                {titleParts.length > 1 && (
                  <span className="gradient-text-italic bg-gradient-to-r from-[#FFFFFF] via-[#DBD7D5] to-[#F2C7A0]">
                    & {titleParts[1]?.trim()}
                  </span>
                )}
              </h1>
              {block.description && (
                <p className="mt-6 text-body-lg sm:text-body-xl text-[#DBD7D5] leading-relaxed font-normal">
                  {block.description}
                </p>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-[#141414]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-[#F2C7A0]/40 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2C7A0]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-semibold">
                      Keunggulan Solusi
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#F2C7A0]">{imageBadge}</span>
                </div>

                <div className="space-y-4">
                  {keyOutcomes.map((metric: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                    >
                      <span className="font-mono text-xs text-neutral-300">{metric.label}</span>
                      <span className="font-display text-lg sm:text-xl font-bold text-[#F2C7A0]">
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
            <div className="mt-14 rounded-3xl border border-white/10 bg-[#121212] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative group hover:border-[#F2C7A0]/30 transition-all">
              <div className="flex items-center justify-between px-6 py-3.5 bg-[#161616]/80 backdrop-blur-md border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#F2C7A0]" />
                  <span className="font-mono text-xs text-neutral-300 font-medium truncate max-w-sm">
                    {imageCaption}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#F2C7A0] hidden sm:inline-block">
                  {imageBadge}
                </span>
              </div>
              <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-black">
                <Image
                  src={heroImage}
                  alt={block.title || 'Platform Showcase'}
                  fill
                  priority
                  className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Default: cinematic variant with rich atmospheric depth + clean visual showcase
  return (
    <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-36 relative overflow-hidden text-white border-b border-white/[0.08] bg-[#0A0A0A]">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-[#F2C7A0]/[0.08] blur-[180px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/4 w-[450px] h-[450px] rounded-full bg-[#C68D5D]/[0.06] blur-[160px]" />

      <div className="container relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl">
          {block.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818]/90 text-[#F2C7A0] border border-[#F2C7A0]/30 text-xs font-mono mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(242,199,160,0.15)]">
              <Layers className="w-3.5 h-3.5 text-[#F2C7A0]" />
              <span>{block.badge}</span>
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.12]">
            {titleParts[0]?.trim()}{' '}
            {titleParts.length > 1 && (
              <span className="gradient-text-italic bg-gradient-to-r from-[#FFFFFF] via-[#DBD7D5] to-[#F2C7A0]">
                & {titleParts[1]?.trim()}
              </span>
            )}
          </h1>

          {block.description && (
            <p className="mt-6 max-w-3xl text-body-lg sm:text-body-xl text-[#DBD7D5] leading-relaxed font-normal">
              {block.description}
            </p>
          )}

          {keyOutcomes.length > 0 && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              {keyOutcomes.map((metric: any, mIdx: number) => (
                <div
                  key={mIdx}
                  className="rounded-2xl border border-white/10 bg-[#161616]/80 p-4.5 backdrop-blur-md text-left hover:border-[#F2C7A0]/40 transition-all hover:-translate-y-0.5 shadow-lg group"
                >
                  <span className="font-mono text-xs text-neutral-400 block truncate group-hover:text-neutral-300">
                    {metric.label}
                  </span>
                  <span className="font-display text-xl sm:text-2xl font-bold text-[#F2C7A0] mt-1 block tracking-tight">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clean Immersive Media Showcase */}
        {heroImage && (
          <div className="mt-14 sm:mt-16 rounded-3xl border border-white/15 bg-[#121212] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative group hover:border-[#F2C7A0]/30 transition-all">
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#161616]/90 backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#F2C7A0]" />
                <span className="font-mono text-xs text-neutral-300 font-medium truncate max-w-sm">
                  {imageCaption}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#F2C7A0] px-2.5 py-0.5 rounded-full bg-[#F2C7A0]/10 border border-[#F2C7A0]/20 hidden sm:inline-block">
                  {imageBadge}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden bg-black">
              <Image
                src={heroImage}
                alt={block.title || 'Platform Showcase'}
                fill
                priority
                className="object-cover object-top group-hover:scale-[1.015] transition-transform duration-700"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent pointer-events-none" />

              {/* Floating Live Badge Overlays */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-wrap gap-2.5 pointer-events-none">
                {floatingBadges.map((fBadge: any, fIdx: number) => {
                  const label = typeof fBadge === 'string' ? fBadge : fBadge?.label
                  if (!label) return null
                  return (
                    <div
                      key={fIdx}
                      className="px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono text-neutral-200 flex items-center gap-2 shadow-lg"
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
  const metrics = block.metrics || []
  const primaryMedia = block.primaryMedia
  const heroImageUrl = block.heroImage || primaryMedia?.imageUrl || block.primaryMedia?.url || ''
  const title = block.name || block.title || 'Pengembangan Sistem & Rekayasa Digital'
  const highlightWord = block.highlightWord || ''
  const badge = block.categoryBadge || block.badge || 'Layanan Rekayasa'
  const description = block.description || block.shortDescription || block.summary || ''

  return (
    <section className="pt-28 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32 relative overflow-hidden bg-[#0A0A0A] text-white border-b border-white/[0.08] w-full">
      <ThematicWave opacity={0.65} showBottomWave={true} />
      <div className="pointer-events-none absolute -right-20 top-1/4 w-[650px] h-[650px] rounded-full bg-[#F2C7A0]/[0.06] blur-[160px]" />
      <div className="pointer-events-none absolute -left-20 bottom-10 w-[500px] h-[500px] rounded-full bg-[#C68D5D]/[0.04] blur-[140px]" />

      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818]/90 text-[#F2C7A0] border border-[#F2C7A0]/30 text-xs font-mono mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(242,199,160,0.12)]">
            <Zap className="w-3.5 h-3.5 text-[#F2C7A0]" />
            <span>{badge}</span>
          </div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          {title}{' '}
          {highlightWord && (
            <span className="gradient-text-italic bg-gradient-to-r from-[#FFFFFF] via-[#DBD7D5] to-[#F2C7A0]">
              {highlightWord}
            </span>
          )}
        </h1>

        {block.subtitle && (
          <p className="mt-3 text-sm sm:text-base font-mono text-[#F2C7A0]/90">
            {block.subtitle}
          </p>
        )}

        {block.client && (
          <p className="mt-3 text-sm sm:text-base text-[#DBD7D5] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F2C7A0] animate-pulse" />
            <span>Mitra Klien: <strong className="text-white">{block.client}</strong></span>
          </p>
        )}

        {description && (
          <p className="mt-6 max-w-3xl text-body-lg sm:text-body-xl text-[#DBD7D5] leading-relaxed font-normal">
            {description}
          </p>
        )}

        {/* WhatsApp CTA button */}
        {block.whatsappPrompt && (
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              href={`https://wa.me/6285227702811?text=${encodeURIComponent(block.whatsappPrompt)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F2C7A0] text-[#191919] font-medium text-sm hover:bg-[#ebd5c1] transition-all shadow-[0_0_25px_rgba(242,199,160,0.25)] hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Konsultasikan Spesifikasi</span>
            </Link>
          </div>
        )}

        {/* Primary Media & Metrics */}
        {(heroImageUrl || primaryMedia?.videoUrl || metrics.length > 0) && (
          <div className="mt-12 rounded-3xl overflow-hidden border border-white/10 bg-[#141414] p-3 shadow-2xl relative group">
            {primaryMedia?.type === 'video' && primaryMedia?.videoUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <IframeEmbed url={primaryMedia.videoUrl} title={title} aspectRatio="16/9" />
              </div>
            ) : heroImageUrl ? (
              <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden">
                <Image
                  src={heroImageUrl}
                  alt={primaryMedia?.altText || block.altText || title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </div>
            ) : null}

            {metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#141414] border-t border-white/[0.08]">
                {metrics.map((m: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#F2C7A0]/30 transition-colors">
                    <p className="font-mono text-xs text-neutral-400">{m.label}</p>
                    <p className="font-display text-xl font-bold text-[#F2C7A0] mt-1">{m.value}</p>
                    {m.detail && <p className="text-xs text-neutral-400 mt-0.5">{m.detail}</p>}
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
  const features = block.features || []
  const variant = block.variant || 'asymmetric-bento'

  if (variant === 'asymmetric-bento' && features.length >= 3) {
    const [leadFeature, ...otherFeatures] = features

    return (
      <section className="py-20 sm:py-24 bg-[#111111] text-white border-b border-white/[0.08] relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#F2C7A0]/[0.03] blur-3xl" />
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {block.title && (
            <div className="mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] block mb-2 font-semibold">
                Core Capabilities
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {block.title}
              </h2>
              {block.description && (
                <p className="mt-3 text-[#DBD7D5] max-w-2xl text-body-md sm:text-body-lg">
                  {block.description}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Lead Feature Card (Spans 2 columns on desktop) with High-Res Interface Mockup */}
            <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#F2C7A0]/30 relative overflow-hidden group shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2C7A0]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              <div className="p-7 sm:p-8">
                <div className="w-12 h-12 rounded-2xl bg-[#F2C7A0]/15 border border-[#F2C7A0]/40 flex items-center justify-center text-[#F2C7A0] mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#F2C7A0] font-semibold block mb-2">
                  Solusi Unggulan
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">
                  {leadFeature.title}
                </h3>
                {(leadFeature.description || leadFeature.desc) && (
                  <p className="text-body-md text-[#DBD7D5] leading-relaxed max-w-xl">
                    {leadFeature.description || leadFeature.desc}
                  </p>
                )}
              </div>

              {/* Clean Immersive Visual Preview in Bento */}
              {leadFeature.image && (
                <div className="mt-4 px-6 sm:px-8 pb-6 sm:pb-8">
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/60 relative group-hover:border-[#F2C7A0]/40 transition-all shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#161616]/90 border-b border-white/[0.06] text-xs font-mono text-neutral-400">
                      <span className="text-[#F2C7A0] font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {leadFeature.badge || 'Pratinjau Multi-Perangkat'}
                      </span>
                      <span className="text-[11px] text-neutral-400 hidden sm:inline">Responsif Desktop &amp; Mobile</span>
                    </div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
                      <Image
                        src={leadFeature.image}
                        alt={leadFeature.title}
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
                className="p-6 rounded-2xl bg-[#161616] border border-white/[0.08] hover:border-[#F2C7A0]/40 transition-all hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F2C7A0] mb-4 group-hover:scale-105 group-hover:bg-[#F2C7A0]/10 transition-all">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{feat.title}</h3>
                  {(feat.description || feat.desc) && (
                    <p className="text-sm text-[#DBD7D5] leading-relaxed">{feat.description || feat.desc}</p>
                  )}
                </div>
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Keunggulan 0{idx + 2}</span>
                  <span className="text-[#F2C7A0]">Teruji</span>
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
    <section className="py-20 sm:py-24 bg-[#111111] text-white border-b border-white/[0.08]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {block.title && (
          <div className="mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {block.title}
            </h2>
            {block.description && (
              <p className="mt-3 text-[#DBD7D5] max-w-2xl text-body-md sm:text-body-lg">
                {block.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#181818] border border-white/[0.08] hover:border-[#F2C7A0]/40 transition-colors group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F2C7A0]/10 border border-[#F2C7A0]/20 flex items-center justify-center text-[#F2C7A0] mb-4 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">{feat.title}</h3>
              {(feat.description || feat.desc) && (
                <p className="mt-2 text-sm text-[#DBD7D5] leading-relaxed">{feat.description || feat.desc}</p>
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
  let technologies = block.technologies || []
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
  if (technologies.length === 0 && Array.isArray(block.categories)) {
    technologies = block.categories.flatMap((c: any) =>
      (c.technologies || []).map((t: any) =>
        typeof t === 'string' ? { name: t, category: c.category } : { ...t, category: t.category || c.category }
      )
    )
  }

  return (
    <section className="py-16 bg-[#0E0E0E] text-white border-b border-white/[0.08]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {block.title && (
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] mb-2 font-semibold">
            {block.title}
          </h2>
        )}
        {block.subtitle && (
          <p className="text-sm text-[#DBD7D5] mb-6 max-w-2xl leading-relaxed">
            {block.subtitle}
          </p>
        )}
        {!block.subtitle && block.title && <div className="mb-4" />}
        <div className="flex flex-wrap gap-2.5">
          {technologies.map((tech: any, idx: number) => {
            const name = typeof tech === 'string' ? tech : (tech?.name || tech?.title || tech?.label || '')
            const category = typeof tech === 'object' ? tech?.category : null

            if (!name && !category) return null

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181818] border border-white/10 text-xs sm:text-sm font-mono text-[#DBD7D5] hover:text-[#F2C7A0] hover:border-[#F2C7A0]/30 transition-colors shadow-sm"
              >
                <span>{name || category}</span>
                {category && name && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-[#F2C7A0]/80 border border-[#F2C7A0]/20">
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
  return (
    <section className="py-16 bg-[#131313] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-[#181818] border border-white/10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F2C7A0] to-transparent opacity-80" />
          <p className="font-display text-lg sm:text-xl md:text-2xl italic text-white leading-relaxed">
            &ldquo;{block.quote}&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="font-bold text-sm text-white">{block.author}</p>
              <p className="text-xs font-mono text-[#F2C7A0]">
                {block.role} {block.company ? `— ${block.company}` : ''}
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
  const pillars = block.pillars || []
  const variant = block.variant || 'blueprint'

  return (
    <section className="py-20 sm:py-24 bg-[#0F0F0F] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {block.title && (
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] block mb-2 font-semibold">
              Engineering Disciplines
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {block.title}
            </h2>
            {block.description && (
              <p className="mt-3 text-[#DBD7D5] max-w-2xl text-body-md sm:text-body-lg">
                {block.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pil: any, idx: number) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-[#161616] border border-white/10 hover:border-[#F2C7A0]/40 transition-all hover:-translate-y-1 shadow-lg relative group overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#F2C7A0]/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform" />
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F2C7A0] mb-5 group-hover:bg-[#F2C7A0]/10 transition-colors">
                {idx === 0 ? <Cpu className="w-5 h-5" /> : idx === 1 ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">{pil.title}</h3>
              <p className="text-sm text-[#DBD7D5] leading-relaxed">{pil.description || pil.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. Workflow Phases ───────────────────────────────────────────────────────
export function WorkflowPhasesBlock({ block }: { block: any }) {
  const phases = block.phases || []
  const variant = block.variant || 'timeline-connected'

  return (
    <section className="py-20 sm:py-24 bg-[#141414] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {block.title && (
          <div className="mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] block mb-2 font-semibold">
              Execution Methodology
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {block.title}
            </h2>
            {block.description && (
              <p className="mt-3 text-[#DBD7D5] max-w-2xl text-body-md sm:text-body-lg">
                {block.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {phases.map((ph: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#F2C7A0]/50 transition-all hover:-translate-y-1 relative group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-[#F2C7A0] block">
                  {ph.step || `0${idx + 1}`}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F2C7A0]/40 group-hover:bg-[#F2C7A0] transition-colors" />
              </div>
              <h3 className="font-display text-base font-bold text-white mb-2">{ph.title}</h3>
              <p className="text-xs text-[#DBD7D5] leading-relaxed">{ph.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 8. Comparison Matrix (NEW) ───────────────────────────────────────────────
export function ComparisonMatrixBlock({ block }: { block: any }) {
  const rows = (Array.isArray(block.rows) && block.rows.length > 0)
    ? block.rows
    : [
        { feature: 'Kecepatan Muat LCP', segia: 'Sub-detik (< 1.0s)', traditional: '3.0 - 5.0 detik' },
        { feature: 'Ownership & Source Code', segia: '100% Hak Milik Klien', traditional: 'Terkunci Platform / Vendor' },
        { feature: 'Arsitektur Sistem', segia: 'Next.js 16 App Router + Prisma 8', traditional: 'Template Monolitik Konvensional' },
      ]

  return (
    <section className="py-20 sm:py-24 bg-[#0E0E0E] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-24 -translate-x-1/2 w-[700px] h-[350px] bg-[#F2C7A0]/[0.05] rounded-full blur-[140px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            Perbandingan Nilai
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {block.title || 'Mengapa Memilih SegiaTech untuk Proyek Anda'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5]">
              {block.description}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141414] overflow-hidden shadow-2xl">
          {/* Header row */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/10 bg-[#181818] text-xs font-mono">
            <div className="p-4 md:col-span-4 text-neutral-400 font-semibold uppercase tracking-wider">
              Kebutuhan Bisnis Anda
            </div>
            <div className="p-4 md:col-span-4 bg-[#F2C7A0]/10 text-[#F2C7A0] font-bold uppercase tracking-wider flex items-center gap-2 border-l border-r border-[#F2C7A0]/20">
              <Check className="w-4 h-4 text-[#F2C7A0]" />
              <span>Standar SegiaTech</span>
            </div>
            <div className="p-4 md:col-span-4 text-neutral-300 font-semibold uppercase tracking-wider">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F2C7A0]/60" />
                  <span>{row.feature}</span>
                </div>
                <div className="p-4 md:col-span-4 bg-[#F2C7A0]/[0.04] border-l border-r border-[#F2C7A0]/15 font-mono text-xs text-[#F2C7A0] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F2C7A0] shrink-0" />
                  <span>{row.segia}</span>
                </div>
                <div className="p-4 md:col-span-4 font-mono text-xs text-neutral-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-neutral-500 shrink-0" />
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
  const layers = (Array.isArray(block.layers) && block.layers.length > 0)
    ? block.layers
    : [
        { title: 'Performa Tinggi', desc: 'Arsitektur Next.js 16 dengan sub-second LCP', icon: 'zap' },
        { title: 'Antarmuka Intuitif', desc: 'Desain responsif multi-perangkat berstandar Dogstudio', icon: 'sparkles' },
        { title: 'Keamanan Data', desc: 'Validasi Zod & enkripsi PostgreSQL', icon: 'shield-check' },
        { title: 'Garansi Sistem', desc: 'Dukungan pemeliharaan dan pemantauan SLA berkelanjutan', icon: 'check-circle' },
      ]

  const architectureImage = block.image
  const imageLabel = block.imageLabel || 'Karya Nyata Klien: Portal Edukasi & Informasi'
  const imageBadge = block.imageBadge || 'Hasil Produksi Aktif'
  const hudTitle = block.hudTitle || 'Kecepatan Akses Nyata'
  const hudMetric = block.hudMetric || 'Waktu Muat < 1 Detik'
  const hudDesc = block.hudDesc || 'Pengunjung langsung masuk tanpa menunggu loading'

  return (
    <section className="py-20 sm:py-24 bg-[#0A0A0A] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/3 w-[600px] h-[600px] bg-[#C68D5D]/[0.05] rounded-full blur-[180px]" />
      <div className="pointer-events-none absolute left-0 bottom-10 w-[450px] h-[450px] bg-[#F2C7A0]/[0.04] rounded-full blur-[160px]" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            {block.badge || 'Standar Keunggulan'}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {block.title || '4 Jaminan Kualitas untuk Pertumbuhan Bisnis Anda'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5] max-w-2xl">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authentic Client Showcase Preview */}
          {architectureImage && (
            <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#121212] overflow-hidden shadow-2xl relative group hover:border-[#F2C7A0]/40 transition-colors">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#161616] border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs text-neutral-300 font-semibold truncate max-w-[220px]">
                    {imageLabel}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#F2C7A0] px-2 py-0.5 rounded bg-[#F2C7A0]/10 border border-[#F2C7A0]/20 shrink-0">
                  {imageBadge}
                </span>
              </div>

              <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-[4/5] w-full overflow-hidden bg-black">
                <Image
                  src={architectureImage}
                  alt="SegiaTech Client Production Showcase"
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 450px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-70 pointer-events-none" />

                {/* Technical HUD Badges */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2 pointer-events-none">
                  <div className="p-3.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-300 shadow-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{hudTitle}</span>
                      <span className="text-emerald-400">{hudMetric}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
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
                className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-white/10 hover:border-[#F2C7A0]/40 transition-all hover:bg-[#181818] shadow-xl group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-300 font-semibold">
                      {layer.level}
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-bold text-white group-hover:text-[#F2C7A0] transition-colors">
                      {layer.title}
                    </h3>
                  </div>
                  <span className="inline-flex items-center font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[#F2C7A0]/10 border border-[#F2C7A0]/30 text-[#F2C7A0] w-fit">
                    {layer.badge}
                  </span>
                </div>
                <p className="text-sm text-[#DBD7D5] leading-relaxed mb-3">{layer.desc}</p>
                <div className="flex items-center gap-2 pt-2.5 border-t border-white/5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs text-[#F2C7A0] truncate">{layer.tech}</span>
                </div>
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
  const fallbackStats = [
    { value: '99.9%', label: 'Ketersediaan Sistem', detail: 'SLA uptime arsitektur cloud terdistribusi' },
    { value: '<100ms', label: 'Latensi Akses', detail: 'Optimasi global Edge Caching & WebAssembly' },
    { value: '10x', label: 'Efisiensi Operasional', detail: 'Automasi workflow cerdas terintegrasi' },
    { value: '100%', label: 'Keamanan Data', detail: 'Enkripsi standar end-to-end multi-tenant' },
  ]
  const stats = (block.stats && Array.isArray(block.stats) && block.stats.length > 0)
    ? block.stats
    : fallbackStats

  return (
    <section className="py-20 sm:py-24 bg-[#121212] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-[#F2C7A0]/[0.06] rounded-full blur-[170px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            Proven Metrics
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {block.title || 'Dampak Performa Nyata & Metrik Teruji'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5]">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#181818] border border-white/10 hover:border-[#F2C7A0]/40 transition-all hover:-translate-y-1 shadow-xl text-center group"
            >
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#F2C7A0] tracking-tight block group-hover:scale-105 transition-transform">
                {s.value}
              </span>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white block mt-3 mb-1">
                {s.label}
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 11. Deliverables Checklist (NEW) ─────────────────────────────────────────
export function DeliverablesChecklistBlock({ block }: { block: any }) {
  const fallbackItems = [
    { title: 'Arsitektur & Kode Sumber Lengkap', desc: 'Hak milik penuh atas repository, dokumentasi teknis, dan clean-code standar enterprise.' },
    { title: 'Deployment Pipeline Otomatis (CI/CD)', desc: 'Konfigurasi zero-downtime deployment, automated testing, dan backup database berkala.' },
    { title: 'Optimasi SEO & Performa Core Web Vitals', desc: 'Skor Lighthouse 90+, struktur Schema JSON-LD, sitemap dinamis, dan index engine.' },
    { title: 'Dukungan & Garansi Pemeliharaan', desc: 'Pemantauan sistem 24/7, perbaikan bug prioritas, dan transfer pengetahuan tim.' },
  ]
  const items = (block.items && Array.isArray(block.items) && block.items.length > 0)
    ? block.items
    : fallbackItems

  return (
    <section className="py-20 sm:py-24 bg-[#0F0F0F] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            Scope & Handover Guarantee
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {block.title || 'Ruang Lingkup Serah Terima & Garansi Organisasi'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5] max-w-2xl">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((it: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#161616] border border-white/10 hover:border-[#F2C7A0]/40 transition-all shadow-xl flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F2C7A0]/10 border border-[#F2C7A0]/30 flex items-center justify-center text-[#F2C7A0] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white mb-1.5">{it.title}</h3>
                <p className="text-xs sm:text-sm text-[#DBD7D5] leading-relaxed">{it.desc}</p>
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
  const fallbackCategories = [
    { name: 'Core Framework & Frontend', badge: 'Next.js 16 + React 19', items: ['TypeScript', 'Tailwind CSS', 'Turbopack', 'GSAP / Motion'] },
    { name: 'Backend & Data Engine', badge: 'PostgreSQL + Prisma 8', items: ['Edge Runtime', 'Redis Caching', 'Vector Embeddings', 'GraphQL / REST'] },
    { name: 'Keamanan & Kepatuhan', badge: 'Enterprise Ready', items: ['SSRF Protection', 'RBAC Multi-Level', 'Audit Trail', 'SSL Strict TLS 1.3'] },
    { name: 'Infrastruktur & Cloud', badge: 'Zero Downtime', items: ['Docker Container', 'Coolify Edge Proxy', 'Cloudflare CDN', 'Prometheus Metrics'] },
  ]
  const categories = (block.categories && Array.isArray(block.categories) && block.categories.length > 0)
    ? block.categories
    : fallbackCategories

  return (
    <section className="py-20 sm:py-24 bg-[#111111] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            Standar Kualitas
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {block.title || 'Standar Kualitas & Keandalan yang Anda Dapatkan'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5] max-w-2xl">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat: any, idx: number) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-[#181818] border border-white/10 hover:border-[#F2C7A0]/30 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-white">{cat.name}</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#F2C7A0]">
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
                      className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-[#DBD7D5] hover:text-[#F2C7A0] hover:border-[#F2C7A0]/30 transition-colors"
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
  const fallbackPortfolios = [
    {
      slug: 'sistem-informasi-enterprise',
      title: 'Transformasi Digital Portal Enterprise',
      category: 'Web Platform',
      client: 'Enterprise Client',
      heroImage: '/images/portfolio/portfolio-1.webp',
    },
    {
      slug: 'platform-ecommerce-omnichannel',
      title: 'Platform E-Commerce Terdistribusi Skala Besar',
      category: 'Full-Stack Ecosystem',
      client: 'Retail Multi-National',
      heroImage: '/images/portfolio/portfolio-2.webp',
    },
  ]
  const portfolios =
    (block.portfolios && block.portfolios.length > 0)
      ? block.portfolios
      : (contextPortfolios && contextPortfolios.length > 0)
      ? contextPortfolios
      : (block.items && block.items.length > 0)
      ? block.items
      : fallbackPortfolios

  return (
    <section className="py-20 sm:py-24 bg-[#131313] text-white border-b border-white/[0.08]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {block.title || 'Studi Kasus Terkait'}
            </h2>
            {block.description && (
              <p className="mt-2 text-[#DBD7D5] text-body-md max-w-xl">{block.description}</p>
            )}
          </div>
          <Link
            href="/portofolio"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#F2C7A0] hover:underline"
          >
            <span>Semua Portofolio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolios.map((p: any, idx: number) => (
            <Link
              key={idx}
              href={`/portofolio/${p.slug}`}
              className="group block rounded-2xl overflow-hidden bg-[#181818] border border-white/10 hover:border-[#F2C7A0]/50 transition-all shadow-lg"
            >
              {p.heroImage ? (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.heroImage}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative aspect-[16/10] bg-neutral-900 border-b border-white/5 flex items-center justify-center text-neutral-500">
                  <Eye className="w-8 h-8 opacity-40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
                  <span>{p.category || 'Case Study'}</span>
                  {p.client && <span>{p.client}</span>}
                </div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-[#F2C7A0] transition-colors flex items-center justify-between">
                  <span>{p.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F2C7A0] transition-colors" />
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
  const fallbackFaqs = [
    { question: 'Berapa lama estimasi pengerjaan proyek?', answer: 'Timeline pengerjaan berkisar antara 2 hingga 8 minggu tergantung pada kompleksitas modul, integrasi sistem, dan cakupan fitur.' },
    { question: 'Apakah kode sumber diserahkan kepada klien?', answer: 'Ya, seluruh kode sumber, aset, dan dokumentasi teknis menjadi hak milik penuh klien dengan standar clean code enterprise.' },
    { question: 'Bagaimana dukungan dan pemeliharaan pasca peluncuran?', answer: 'Kami menyediakan garansi teknis pasca peluncuran, monitoring performa 24/7, serta opsi pemeliharaan berkala.' },
  ]
  const faqs = (block.faqs && block.faqs.length > 0)
    ? block.faqs
    : (block.items && block.items.length > 0)
    ? block.items
    : fallbackFaqs

  return (
    <section className="py-20 sm:py-24 bg-[#0E0E0E] text-white border-b border-white/[0.08]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-8">
          {block.title || 'Pertanyaan Umum'}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq: any, idx: number) => (
            <details
              key={idx}
              className="group p-5 rounded-2xl bg-[#161616] border border-white/10 transition-colors"
            >
              <summary className="cursor-pointer font-display font-medium text-base sm:text-lg text-white flex items-center justify-between list-none">
                <span>{faq.question}</span>
                <span className="text-[#F2C7A0] transition-transform group-open:rotate-45 font-mono text-xl">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm sm:text-base text-[#DBD7D5] leading-relaxed pl-1 border-t border-white/5 pt-3">
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
  subheadline = 'Diskusikan visi, tantangan sistem, atau kebutuhan aplikasi imersif Anda bersama arsitek perangkat lunak SegiaTech.',
  secondaryLabel = 'Jelajahi Layanan',
  secondaryHref = '/layanan',
}: StudioCTAProps) {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsapp}?text=Halo%20SegiaTech,%20saya%20ingin%20berkonsultasi%20mengenai%20proyek%20rekayasa%20digital.`

  return (
    <section className="section-py relative overflow-hidden bg-gradient-to-b from-[#2B2B2B] via-[#242424] to-[#2B2B2B] text-white border-t border-[#2B2B2B]" aria-label="Ajakan Bertindak">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-r from-[#F2C7A0]/12 via-[#B29279]/08 to-[#F2C7A0]/12 blur-[150px]" />
      <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-[32px] sm:rounded-[40px] border border-[#2B2B2B] bg-[#191919] p-8 sm:p-14 lg:p-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#F2C7A0]/40 to-transparent" />
          <h2 className="font-display text-display-md sm:text-display-lg lg:text-display-xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {headline}
          </h2>
          <p className="mt-6 text-body-lg sm:text-body-xl text-[#DBD7D5] max-w-2xl mx-auto leading-relaxed font-normal">
            {subheadline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F2C7A0] hover:bg-[#D3AD8D] active:bg-[#B29279] px-8 py-4 font-sans text-sm sm:text-base font-bold text-[#000000] shadow-[0_4px_25px_rgba(242,199,160,0.35)] transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-[#000000] text-[#000000]" />
              <span>Konsultasi Proyek (WhatsApp)</span>
            </a>
            <Link
              href={secondaryHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#2B2B2B] bg-transparent px-8 py-4 font-sans text-sm sm:text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#B29279] hover:text-[#F2C7A0] active:scale-95"
            >
              <span>{secondaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-8 text-xs font-mono text-[#999898]">
            Atau kirimkan brief sistem via email ke{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-[#F2C7A0] hover:underline font-semibold">
              {siteConfig.email}
            </a>
          </div>
          <div className="mt-10 pt-8 border-t border-[#2B2B2B] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-[#DBD7D5] max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#F2C7A0] shrink-0" />
              <span>Respon Cepat &lt; 24 Jam</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FileCode className="w-4 h-4 text-[#F2C7A0] shrink-0" />
              <span>Arsitektur &amp; Estimasi Gratis</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F2C7A0] shrink-0" />
              <span>Perjanjian NDA Resmi</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function StudioCtaBlock({ block }: { block: any }) {
  return (
    <StudioCTA
      headline={block.title || 'Mulai Proyek Digital Anda'}
      subheadline={block.description || 'Konsultasikan arsitektur dan kebutuhan spesifik sistem Anda.'}
      secondaryLabel={block.buttonText || 'Konsultasi Sekarang'}
      secondaryHref={block.buttonUrl || 'https://wa.me/6285227702811'}
    />
  )
}

// ─── 16. Editorial Paragraph / Heading Blocks ──────────────────────────────────
export function EditorialParagraphBlock({ block }: { block: any }) {
  const text = block.text || block.content || ''
  return (
    <section className="py-8 bg-[#0D0D0D] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-base sm:text-lg leading-relaxed text-[#DBD7D5]">
        <p>{text}</p>
      </div>
    </section>
  )
}

export function EditorialHeadingBlock({ block }: { block: any }) {
  const isH2 = block.type === 'heading2'
  const text = block.text || block.content || block.title || ''
  return (
    <section className="pt-10 pb-4 bg-[#0D0D0D] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        {isH2 ? (
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {text}
          </h2>
        ) : (
          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
            {text}
          </h3>
        )}
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

  const fallbackServices = [
    {
      slug: 'pengembangan-web-modern',
      name: 'Pengembangan Web Modern & Skalabel',
      badge: 'Layanan Utama',
      description: 'Arsitektur web berkecepatan tinggi dengan Next.js 16, SEO dinamis, dan pengalaman interaktif Dogstudio-grade.',
      image: '/images/services/web-dev.webp',
      tags: ['Next.js 16', 'SSR/ISR', 'Core Web Vitals'],
    },
    {
      slug: 'integrasi-ai-otomasi',
      name: 'Integrasi AI & Automasi Alur Kerja',
      badge: 'Teknologi Cerdas',
      description: 'Solusi agen AI otonom, LLM reasoning engine, dan automasi proses bisnis enterprise.',
      image: '/images/services/ai-integration.webp',
      tags: ['ReAct Engine', 'Function Calling', 'RAG'],
    },
  ]

  const items =
    (block.services && block.services.length > 0)
      ? block.services
      : (contextServices && contextServices.length > 0)
      ? contextServices.map((cs) => {
          return {
            slug: cs.slug,
            name: cs.name,
            badge: cs.categoryBadge || 'Spesialisasi',
            description: cs.shortDescription || cs.description,
            image: resolveImage(cs.heroImage),
            tags: Array.isArray(cs.technologies)
              ? cs.technologies.slice(0, 3).map((t: any) => (typeof t === 'string' ? t : t?.name || 'Fitur'))
              : ['Responsif Ponsel', 'Akses Cepat'],
          }
        })
      : fallbackServices

  return (
    <section className="py-20 sm:py-28 bg-[#0D0D0D] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/4 w-[500px] h-[500px] bg-[#F2C7A0]/[0.04] rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute left-0 bottom-10 w-[450px] h-[450px] bg-[#C68D5D]/[0.03] blur-[150px]" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            Pilihan Solusi Digital
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            {block.title || 'Layanan Pembuatan Website & Aplikasi yang Kami Sediakan'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5] leading-relaxed">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {items.map((item: any, idx: number) => {
            const finalImg = resolveImage(item.image)
            return (
              <Link
                key={idx}
                href={`/layanan/${item.slug}`}
                className="group rounded-3xl bg-[#141414] border border-white/10 hover:border-[#F2C7A0]/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Visual Thumbnail Image */}
                  {finalImg ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900 border-b border-white/5">
                      <Image
                        src={finalImg}
                        alt={item.name}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 550px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60" />
                      <div className="absolute top-4 left-4">
                        <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[#F2C7A0] font-medium shadow-md">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 pb-0 flex items-center justify-between">
                      <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#F2C7A0] font-medium shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Content Details */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-display text-xl font-bold text-white group-hover:text-[#F2C7A0] transition-colors leading-snug">
                        {item.name}
                      </h3>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:bg-[#F2C7A0] group-hover:text-[#191919] group-hover:border-[#F2C7A0] transition-all shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-sm text-[#DBD7D5] leading-relaxed line-clamp-3 mb-6">
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
                          className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300"
                        >
                          {tagLabel}
                        </span>
                      )
                    })}
                  </div>
                  <span className="text-xs font-mono text-[#F2C7A0] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 pt-3">
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
  const fallbackItems = [
    {
      image: '/images/showcase/system-dashboard.webp',
      metric: '99.98% Akurasi',
      category: 'Dashboard Arsitektur',
      title: 'Pusat Kontrol Operasional Real-Time',
      desc: 'Visualisasi metrik operasional dan analitik transaksi data secara real-time dengan latensi rendah.',
    },
    {
      image: '/images/showcase/mobile-experience.webp',
      metric: '< 1.2s LCP',
      category: 'Mobile First App',
      title: 'Antarmuka Pengguna Responsif & Adaptif',
      desc: 'Pengalaman pengguna interaktif dengan performa optimal di berbagai ukuran layar dan perangkat seluler.',
    },
    {
      image: '/images/showcase/cloud-infrastructure.webp',
      metric: 'Zero Downtime',
      category: 'Cloud Engineering',
      title: 'Infrastruktur Cloud Terdistribusi',
      desc: 'Keandalan arsitektur multi-zone dengan orkestrasi otomatis dan perlindungan keamanan berlapis.',
    },
  ]
  const items = (block.items && Array.isArray(block.items) && block.items.length > 0)
    ? block.items
    : fallbackItems

  return (
    <section className="py-20 sm:py-28 bg-[#090909] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[800px] h-[400px] bg-[#F2C7A0]/[0.04] blur-[160px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
            {block.badge || 'Bukti Portofolio Nyata'}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {block.title || 'Bukti Hasil Pengerjaan Nyata untuk Klien Kami'}
          </h2>
          {block.description && (
            <p className="mt-3 text-body-md text-[#DBD7D5]">
              {block.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-3xl bg-[#141414] border border-white/10 hover:border-[#F2C7A0]/40 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden shadow-2xl group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 400px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-600">
                      <Eye className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60" />
                  {item.metric && (
                    <div className="absolute top-3.5 right-3.5">
                      <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-emerald-400 font-semibold shadow-md">
                        {item.metric}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {item.category && (
                    <span className="font-mono text-xs uppercase tracking-wider text-[#F2C7A0] font-semibold block mb-2">
                      {item.category}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-[#F2C7A0] transition-colors">
                    {item.title}
                  </h3>
                  {item.desc && (
                    <p className="text-sm text-[#DBD7D5] leading-relaxed">
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Karya Produksi Aktif</span>
                  </span>
                  <span className="text-[#F2C7A0]">Terverifikasi</span>
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
  const image = block.image || block.imageUrl || block.heroImage || ''
  const alt = block.alt || block.altText || block.title || 'Tampilan Visual Sistem'
  const caption = block.caption || block.description
  const rawFrameStyle = block.frameStyle || 'immersive'
  const frameStyle = rawFrameStyle === 'browser' ? 'immersive' : rawFrameStyle // Backward compatible mapping
  const aspectRatio = block.aspectRatio || '16/10' // '16/9' | '16/10' | '21/9' | '4/3' | '1/1'
  const imageLabel = block.imageLabel || block.windowTitle || block.title || 'Dokumentasi Visual Antarmuka'
  const badge = block.badge || 'Showcase Visual'
  const floatingBadges = block.floatingBadges || []

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
    <section className="py-16 sm:py-24 bg-[#0A0A0A] text-white border-b border-white/[0.08] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#F2C7A0]/[0.03] blur-[150px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {(block.title || block.badge) && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            {badge && (
              <span className="font-mono text-xs uppercase tracking-widest text-[#F2C7A0] font-semibold block mb-2">
                {badge}
              </span>
            )}
            {block.title && (
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {block.title}
              </h2>
            )}
            {block.subtitle && (
              <p className="mt-3 text-body-md text-[#DBD7D5]">
                {block.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Clean, Minimalist Media Frame Container */}
        <div className={`mx-auto max-w-5xl ${
          frameStyle === 'immersive'
            ? 'rounded-3xl border border-white/10 bg-[#121212] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] group hover:border-[#F2C7A0]/30 transition-all'
            : frameStyle === 'floating-card'
            ? 'rounded-3xl border border-white/10 bg-[#141414] overflow-hidden shadow-2xl p-2.5 sm:p-3 hover:border-[#F2C7A0]/30 transition-all'
            : 'overflow-hidden rounded-2xl shadow-xl'
        }`}>
          {/* Minimalist Context Bar for Immersive style */}
          {frameStyle === 'immersive' && (imageLabel || badge) && (
            <div className="flex items-center justify-between px-6 py-3 bg-[#161616]/80 backdrop-blur-md border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-neutral-300 font-medium truncate max-w-sm sm:max-w-md">
                  {imageLabel}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#F2C7A0] px-2.5 py-0.5 rounded-full bg-[#F2C7A0]/10 border border-[#F2C7A0]/20 hidden sm:inline-block">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#111111] border border-dashed border-white/20 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F2C7A0] mb-3">
                  <Eye className="w-8 h-8 opacity-70" />
                </div>
                <p className="font-display text-sm font-semibold text-white mb-1">
                  Placeholder Showcase Media
                </p>
                <p className="text-xs text-[#DBD7D5] max-w-sm">
                  Masukkan URL gambar atau pilih dari Media Manager pada pengaturan blok ini.
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
                      className="px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono text-neutral-200 flex items-center gap-2 shadow-lg"
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
          <p className="mt-4 text-center text-xs text-neutral-400 font-mono max-w-2xl mx-auto leading-relaxed">
            {caption}
          </p>
        )}
      </div>
    </section>
  )
}


