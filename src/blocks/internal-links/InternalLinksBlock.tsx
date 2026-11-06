import Link from 'next/link'

export function InternalLinksBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const title = block?.title || data.title || 'Tautan Internal & Artikel Terkait'
  const rawLinks = block?.links || data.links || []

  if (!rawLinks.length) return null

  return (
    <section className="py-8 bg-[var(--color-background)] text-white">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6">
        {title && (
          <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#4d8bff] rounded-sm inline-block" />
            {title}
          </h3>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rawLinks.map((link: any, idx: number) => {
            const href = link.href || link.url || (link.slug ? `/journal/${link.slug}` : '#')
            const text = link.title || link.text || link.name || 'Lihat Selengkapnya'
            const desc = link.description || link.excerpt
            return (
              <Link
                key={idx}
                href={href}
                className="group block p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#4d8bff]/40 transition-all"
              >
                <div className="flex items-center justify-between text-sm font-medium text-white group-hover:text-[#4d8bff] transition-colors">
                  <span>{text}</span>
                  <span className="text-xs text-[#4d8bff] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                {desc && (
                  <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                    {desc}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
