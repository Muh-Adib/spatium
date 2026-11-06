

export function ClientStatsImpactBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const stats =
    Array.isArray(block?.stats) && block.stats.length > 0
      ? block.stats
      : Array.isArray(data.stats) && data.stats.length > 0
      ? data.stats
      : null

  if (!stats || stats.length === 0) return null

  const title = block?.title || data.title || 'Dampak Performa Nyata & Metrik Teruji'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-accent/[0.06] rounded-full blur-[170px]" />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            Proven Metrics
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-body-md text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 shadow-xl text-center group"
            >
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-accent tracking-tight block group-hover:scale-105 transition-transform">
                {s.value}
              </span>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white block mt-3 mb-1">
                {s.label}
              </span>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
