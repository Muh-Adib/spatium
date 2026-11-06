

export function EditorialParagraphBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const text = block?.text || data.text || block?.content || data.content || ''
  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-base sm:text-lg leading-relaxed text-[var(--text-muted)]">
        <p>{text}</p>
      </div>
    </section>
  )
}
