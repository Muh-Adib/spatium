import Image from 'next/image'
import { CheckCircle2, Layers } from 'lucide-react'
import { ThematicWave } from '@/components/ui/ThematicWave'

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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md">
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
                  alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title || 'Visual digital twin SPATIUM'}
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--surface-translucent)] text-accent border border-accent/30 text-xs font-mono mb-6 backdrop-blur-md">
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
                alt={block?.alt || (block as { data?: { alt?: string } })?.data?.alt || title || 'Visual digital twin SPATIUM'}
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
