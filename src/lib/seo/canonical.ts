/** A canonical must point to a content URL, never its migrated redirect source. */
export function articleCanonical(article: { slug: string; canonicalUrl?: string | null; wpSourceUrl?: string | null }, siteUrl: string): string {
  return contentCanonical(article.canonicalUrl, article.wpSourceUrl, `/artikel/${article.slug}`, siteUrl)
}

export function contentCanonical(value: string | null | undefined, sourceUrl: string | null | undefined, targetPath: string, siteUrl: string): string {
  const target = new URL(targetPath, siteUrl).href
  if (!value) return target
  try {
    const canonical = new URL(value, siteUrl)
    if (!['http:', 'https:'].includes(canonical.protocol)) return target
    if (sourceUrl) {
      const source = new URL(sourceUrl)
      if (canonical.origin === source.origin && canonical.pathname.replace(/\/$/, '') === source.pathname.replace(/\/$/, '')) return target
    }
    return canonical.href
  } catch { return target }
}

export function articleStructuredData(schema: unknown, fallback: Record<string, unknown>, sourceUrl?: string | null, canonicalUrl?: string): Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return fallback
  const input = schema as Record<string, unknown>
  if (typeof input.type === 'string' && ['Article', 'BlogPosting', 'TechArticle', 'NewsArticle'].includes(input.type)) return { ...fallback, '@type': input.type }
  if (!input['@graph'] && !input['@type']) return fallback
  const rewrite = (value: unknown): unknown => {
    if (typeof value === 'string' && sourceUrl && canonicalUrl) {
      const original = sourceUrl.replace(/\/$/, '')
      const candidate = value.replace(/\/$/, '')
      if (candidate === original) return canonicalUrl
      if (value.startsWith(`${original}/#`)) return canonicalUrl + value.slice(original.length + 1)
      if (value.startsWith(`${original}#`)) return canonicalUrl + value.slice(original.length)
    }
    if (Array.isArray(value)) return value.map(rewrite)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, rewrite(v)]))
    return value
  }
  return rewrite(input) as Record<string, unknown>
}
