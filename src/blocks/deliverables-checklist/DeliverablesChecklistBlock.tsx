import { CheckCircle2 } from 'lucide-react'

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
