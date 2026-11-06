import Image from 'next/image'
import { CheckCircle2, Sparkles } from 'lucide-react'

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
