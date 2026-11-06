'use client'

import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'

export function TextEditorialBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const settings = block?.settings || {}
  const isSplit = settings?.layout === 'split'
  const eyebrow = block?.eyebrow || data.eyebrow || block?.badge || data.badge || ''
  const headline = block?.headline || data.headline || block?.title || data.title || ''
  const contentHtml = block?.contentHtml || data.contentHtml || block?.content || data.content || ''
  const asideNote = block?.asideNote || data.asideNote || ''

  return (
    <section className="py-20 bg-[var(--color-background)] text-white">
      <div className="container container--wide">
        <div className={isSplit ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : 'max-w-3xl mx-auto'}>
          <div className={isSplit ? 'lg:col-span-5' : 'mb-8'}>
            {eyebrow ? (
              <p className="mono text-xs uppercase tracking-widest text-accent mb-2">{eyebrow}</p>
            ) : null}
            <h2 className="display-sm font-bold">{headline}</h2>
            {asideNote ? (
              <div className="p-4 mt-6 rounded border border-[var(--card-border)] bg-[var(--surface-translucent)] text-xs text-[var(--text-dim)]">
                {asideNote}
              </div>
            ) : null}
          </div>

          <div
            className={`prose prose-invert max-w-none ${isSplit ? 'lg:col-span-7' : ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(contentHtml) }}
          />
        </div>
      </div>
    </section>
  )
}
