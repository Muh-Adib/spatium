

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
