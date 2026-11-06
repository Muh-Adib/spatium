import Image from 'next/image'
import { Eye } from 'lucide-react'

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
                      alt={item.alt || item.altText || item.title || 'Karya SPATIUM'}
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
