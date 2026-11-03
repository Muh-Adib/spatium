/**
 * Generic Content Utilities
 * HTML sanitizing helpers, entity decoding, reading-time, and slug generation.
 * Brand-agnostic: used by editor, AI drafting, and block rendering.
 */

export function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

/**
 * Normalizes pasted/imported HTML: strips shortcode leftovers, Gutenberg
 * comment markers, emoji spans, and empty paragraphs.
 */
export function cleanRichHtml(rawHtml: string): string {
  if (!rawHtml) return ''
  return rawHtml
    .replace(/\[\/?(vc_[^\]]+|caption[^\]]*|wp_caption[^\]]*)\]/gi, '')
    .replace(/<!--\s*\/?wp:[^>]*-->/gi, '')
    .replace(/<img[^>]*class="[^"]*wp-smiley[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '$1')
    .replace(/(<p>\s*(&nbsp;|\s)*<\/p>)+/gi, '')
    .trim()
}

export function stripHtml(html: string): string {
  if (!html) return ''
  const clean = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return decodeHtmlEntities(clean)
}

export function calculateReadingTime(content: string): number {
  const text = stripHtml(content)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
