/** Merge partial editorial SEO updates without discarding imported graphs/social fields. */
export function mergeEditorialSeo(
  current: Record<string, any> | undefined,
  incoming: Record<string, any> | undefined,
  edits: { metaTitle?: string | null; metaDescription?: string | null; coverAlt?: string },
): Record<string, any> {
  const merged = { ...current, ...incoming }
  for (const key of ['openGraph', 'twitter', 'robots']) {
    if (incoming?.[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key])) {
      merged[key] = { ...current?.[key], ...incoming[key] }
    }
  }
  if (edits.metaTitle !== undefined) merged.seoTitle = edits.metaTitle
  if (edits.metaDescription !== undefined) merged.metaDescription = edits.metaDescription
  if (edits.coverAlt !== undefined) merged.openGraph = { ...merged.openGraph, imageAlt: edits.coverAlt }
  return merged
}
