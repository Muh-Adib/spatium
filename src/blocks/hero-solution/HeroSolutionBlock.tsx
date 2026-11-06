import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, Sparkles, ChevronRight, ArrowRight } from 'lucide-react'
import { ThematicWave } from '@/components/ui/ThematicWave'

export function HeroSolutionBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const badge = block?.badge || data.badge || 'Solusi Bisnis & Industri'
  const title = block?.title || data.title || block?.headline || data.headline || 'Solusi Spasial Berorientasi Hasil'
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-[var(--color-primaryForeground)] font-bold text-xs font-mono uppercase tracking-wider hover:bg-[#6fb0ff] transition-all shadow-[0_0_25px_rgba(77,139,255,0.3)]"
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
                    SPATIUM 3DGS
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
