

export function WorkflowPhasesBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const phases = Array.isArray(block?.phases)
    ? block.phases
    : Array.isArray(data.phases)
    ? data.phases
    : []
  const title = block?.title || data.title
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <div className="mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-2 font-semibold">
              Execution Methodology
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 cq-cols-2 gap-5 relative">
          {phases.map((ph: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all hover:-translate-y-1 relative group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-accent block">
                  {ph.step || `0${idx + 1}`}
                </span>
                <span className="w-2 h-2 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">{ph.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ph.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
