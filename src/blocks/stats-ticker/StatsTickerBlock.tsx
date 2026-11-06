'use client'

export function StatsTickerBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const settings = block?.settings || {}
  const cols = settings?.columns === 4 ? 'lg:grid-cols-4' : settings?.columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  const title = block?.headline || data.headline || block?.title || data.title || ''
  const eyebrow = block?.eyebrow || data.eyebrow || block?.badge || data.badge || ''
  const metrics: any[] = Array.isArray(block?.metrics)
    ? block.metrics
    : Array.isArray(data.metrics)
    ? data.metrics
    : Array.isArray(block?.items)
    ? block.items
    : Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.stats)
    ? data.stats
    : Array.isArray(block?.stats)
    ? block.stats
    : []

  return (
    <section className="py-20 bg-[var(--color-surface)] border-y border-[var(--card-border)] text-white">
      <div className="container container--wide">
        {title ? (
          <div className="mb-12 text-center max-w-2xl mx-auto">
            {eyebrow ? (
              <p className="mono text-xs uppercase tracking-widest text-accent mb-2">{eyebrow}</p>
            ) : null}
            <h2 className="display-sm font-bold">{title}</h2>
          </div>
        ) : null}

        <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} cq-cols-3 gap-8 text-center`}>
          {metrics.map((metric, idx) => {
            const value = typeof metric === 'object' && metric ? (metric.value ?? metric.val ?? '') : metric
            const label = typeof metric === 'object' && metric ? (metric.label ?? metric.title ?? '') : ''
            const detail = typeof metric === 'object' && metric ? (metric.detail ?? metric.desc ?? '') : ''
            return (
              <div key={idx} className="p-8 border border-[var(--card-border)] rounded-2xl bg-[var(--color-background)]">
                <div className="display-lg font-bold text-accent mb-2 mono">{value}</div>
                <div className="text-base font-semibold text-white mb-1">{label}</div>
                {detail ? (
                  <div className="text-xs text-[var(--text-dim)]">{detail}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
