import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'

export function CaseStudyChapterBlock({ block }: { block: any }) {
  const data = block?.data || block || {}
  const chapterNumber = block?.chapterNumber || data.chapterNumber || '01'
  const title = block?.title || data.title || ''
  const subtitle = block?.subtitle || data.subtitle || ''
  const content = block?.content || data.content || ''

  return (
    <section className="py-16 sm:py-20 bg-[var(--color-background)] text-white border-b border-[var(--card-border)]">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--card-border)] text-xs font-mono text-accent font-bold">
            Bab {chapterNumber}
          </span>
          {subtitle && (
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
        <h3 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6">
          {title}
        </h3>
        <div
          className="text-body-md text-[var(--text-muted)] leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(content) }}
        />
      </div>
    </section>
  )
}
