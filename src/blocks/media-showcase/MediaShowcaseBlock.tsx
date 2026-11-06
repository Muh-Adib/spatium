import Image from 'next/image'
import { CheckCircle2, Eye } from 'lucide-react'

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
