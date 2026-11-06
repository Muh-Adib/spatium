

export function EditorialHeadingBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const isH2 = (block?.type || data.type) === 'heading2'
  const text = block?.text || data.text || block?.content || data.content || block?.title || data.title || ''
  return (
    <section className="pt-10 pb-4 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        {isH2 ? (
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {text}
          </h2>
        ) : (
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
            {text}
          </h3>
        )}
      </div>
    </section>
  )
}
