

export function ExecutiveQuoteCardBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const quote = block?.quote || data.quote || ''
  const author = block?.author || data.author || ''
  const role = block?.role || data.role || ''
  const company = block?.company || data.company || ''

  return (
    <section className="py-16 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)] relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-[var(--color-surface)] border border-[var(--card-border)] overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />
          <p className="font-heading text-lg sm:text-xl md:text-2xl italic text-white leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div>
              <p className="font-bold text-sm text-white">{author}</p>
              <p className="text-xs font-mono text-accent">
                {role} {company ? `— ${company}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
