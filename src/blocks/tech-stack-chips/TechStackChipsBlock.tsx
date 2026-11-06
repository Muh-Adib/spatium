

export function TechStackChipsBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title
  const subtitle = block?.subtitle || data.subtitle
  let technologies = block?.technologies || data.technologies || []
  if (typeof technologies === 'string') {
    try {
      technologies = JSON.parse(technologies)
    } catch {
      technologies = technologies.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  }
  if (!Array.isArray(technologies)) {
    technologies = []
  }

  // Support categories fallback if technologies array is empty but categories is defined
  const categories = block?.categories || data.categories
  if (technologies.length === 0 && Array.isArray(categories)) {
    technologies = categories.flatMap((c: any) =>
      (c.technologies || []).map((t: any) =>
        typeof t === 'string' ? { name: t, category: c.category } : { ...t, category: t.category || c.category }
      )
    )
  }

  return (
    <section className="py-16 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="font-mono text-xs uppercase tracking-widest text-accent mb-2 font-semibold">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {!subtitle && title && <div className="mb-4" />}
        <div className="flex flex-wrap gap-2.5">
          {technologies.map((tech: any, idx: number) => {
            const name = typeof tech === 'string' ? tech : (tech?.name || tech?.title || tech?.label || '')
            const category = typeof tech === 'object' ? tech?.category : null

            if (!name && !category) return null

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--card-border)] text-xs sm:text-sm font-mono text-[var(--text-muted)] hover:text-accent hover:border-accent/40 transition-colors shadow-sm"
              >
                <span>{name || category}</span>
                {category && name && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-accent/80 border border-accent/20">
                    {category}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
