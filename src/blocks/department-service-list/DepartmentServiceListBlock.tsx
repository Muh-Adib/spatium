import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

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
              : ['3D Gaussian Splat', 'Digital Twin'],
          }
        })
      : null

  if (!items || items.length === 0) return null

  const title = block?.title || data.title || 'Layanan Spasial yang Kami Sediakan'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-background)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/4 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute left-0 bottom-10 w-[450px] h-[450px] bg-[#0F3A79]/[0.03] blur-[150px]" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="mb-14 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Layanan SPATIUM
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
                        alt={item.alt || item.altText || item.name || 'Layanan SPATIUM'}
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
