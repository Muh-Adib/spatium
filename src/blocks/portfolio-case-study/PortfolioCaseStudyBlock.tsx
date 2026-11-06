

export function PortfolioCaseStudyBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const eyebrow = block?.eyebrow || data.eyebrow || 'Studi Kasus Spasial'
  const title = block?.title || data.title || 'Tantangan, Pendekatan & Hasil'
  const description = block?.description || data.description || 'Bagaimana SPATIUM merekam ruang nyata dan mengubahnya menjadi aset digital twin yang siap dipakai.'
  const challenge = block?.challenge || data.challenge
  const approach = block?.approach || data.approach
  const solution = block?.solution || data.solution
  const result = block?.result || data.result
  const highlights = Array.isArray(block?.highlights) ? block.highlights : Array.isArray(data.highlights) ? data.highlights : []

  const sections = [
    {
      num: '01',
      badge: 'The Challenge',
      title: 'Tantangan & Problem Statement',
      content: challenge,
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      num: '02',
      badge: 'Creative Approach',
      title: 'Pendekatan Artistik & Storytelling',
      content: approach,
      borderColor: 'border-sky-500/30',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      num: '03',
      badge: 'CGI & Engineering',
      title: 'Solusi Teknis & Eksekusi Pipeline',
      content: solution,
      borderColor: 'border-accent/40',
      badgeColor: 'bg-accent/10 text-accent border-accent/30',
    },
    {
      num: '04',
      badge: 'Impact & Result',
      title: 'Hasil Akhir & Dampak Klien',
      content: result,
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ].filter((s) => Boolean(s.content))

  return (
    <section className="py-20 sm:py-28 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/3 top-10 w-[500px] h-[350px] bg-accent/[0.03] blur-[150px] rounded-full" />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-2">
            {eyebrow}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-body-md text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Narrative Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border ${sec.borderColor} bg-[var(--color-background)] p-6 sm:p-8 relative flex flex-col justify-between group hover:border-accent/50 transition-all shadow-xl`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${sec.badgeColor}`}>
                    {sec.badge}
                  </span>
                  <span className="font-mono text-xs text-neutral-600 font-bold">
                    {sec.num}
                  </span>
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                  {sec.title}
                </h3>
                <div className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed space-y-3 whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Highlights Bar if available */}
        {highlights.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--color-background)]/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {highlights.map((h: any, i: number) => (
              <div key={i} className="p-3">
                <p className="text-xl sm:text-2xl font-bold text-accent font-mono">{h.value}</p>
                <p className="text-xs text-white font-medium mt-1">{h.label}</p>
                {h.detail && <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{h.detail}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
