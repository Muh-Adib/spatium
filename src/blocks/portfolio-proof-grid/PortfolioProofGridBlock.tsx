import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronRight, Eye } from 'lucide-react'

export function PortfolioProofGridBlock({
  block,
  contextPortfolios,
}: {
  block: any
  contextPortfolios?: any[]
}) {
  const data = block?.data || block || {}
  const portfolios =
    Array.isArray(block?.portfolios) && block.portfolios.length > 0
      ? block.portfolios
      : Array.isArray(data.portfolios) && data.portfolios.length > 0
      ? data.portfolios
      : Array.isArray(contextPortfolios) && contextPortfolios.length > 0
      ? contextPortfolios
      : Array.isArray(block?.items) && block.items.length > 0
      ? block.items
      : Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : null

  if (!portfolios || portfolios.length === 0) return null

  const title = block?.title || data.title || 'Studi Kasus Terkait'
  const description = block?.description || data.description

  return (
    <section className="py-20 sm:py-24 bg-[var(--color-surface)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-[var(--text-muted)] text-body-md max-w-xl">{description}</p>
            )}
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
          >
            <span>Semua Portofolio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolios.map((p: any, idx: number) => (
            <Link
              key={idx}
              href={`/portfolio/${p.slug}`}
              className="group block rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--card-border)] hover:border-accent/40 transition-all shadow-lg"
            >
              {p.heroImage ? (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.heroImage}
                    alt={p.alt || p.title || 'Portofolio SPATIUM'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative aspect-[16/10] bg-[var(--color-surface)] border-b border-white/5 flex items-center justify-center text-[var(--text-dim)]">
                  <Eye className="w-8 h-8 opacity-40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-dim)] mb-2">
                  <span>{p.category || 'Case Study'}</span>
                  {p.client && <span>{p.client}</span>}
                </div>
                <h3 className="font-heading text-lg font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
                  <span>{p.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-accent transition-colors" />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
