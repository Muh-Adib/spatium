import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'

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
