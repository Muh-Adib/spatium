export interface CollapsibleLinkItem { text: string; href: string; url?: string }
const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)

/** Existing manually edited related-link blocks; no keyword/tag generation. */
export function generateCollapsibleLinksHtml(links: CollapsibleLinkItem[], title = 'Informasi & Layanan Terkait'): string {
  if (!links?.length) return ''
  const items = links.map((link) => `<li><a href="${escapeHtml(link.href || link.url || '')}">${escapeHtml(link.text)}</a></li>`).join('')
  return `<details class="related-links"><summary>${escapeHtml(title)}</summary><ul>${items}</ul></details>`
}
