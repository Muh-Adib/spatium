

export function FaqAccordionBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const faqs =
    Array.isArray(block?.faqs) && block.faqs.length > 0
      ? block.faqs
      : Array.isArray(data.faqs) && data.faqs.length > 0
      ? data.faqs
      : Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!faqs || faqs.length === 0) return null

  const title = block?.title || data.title || 'Pertanyaan Umum'

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white mb-8">
          {title}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq: any, idx: number) => (
            <details
              key={idx}
              className="group p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--card-border)] transition-colors"
            >
              <summary className="cursor-pointer font-heading font-medium text-base sm:text-lg text-white flex items-center justify-between list-none">
                <span>{faq.question}</span>
                <span className="text-accent transition-transform group-open:rotate-45 font-mono text-xl">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed pl-1 border-t border-white/5 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
