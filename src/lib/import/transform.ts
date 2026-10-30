/**
 * WordPress Content Transformer & Cleaner
 * Cleans raw WordPress HTML, extracts media, calculates reading time,
 * and formats metadata for the WebShift engine.
 */

export interface WpPostRaw {
  id: number
  date?: string
  date_gmt?: string
  modified?: string
  slug: string
  status?: string
  link?: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt?: { rendered: string }
  author?: number
  featured_media?: number
  categories?: number[]
  tags?: number[]
  yoast_head_json?: {
    title?: string
    description?: string
    canonical?: string
    author?: string
    og_locale?: string
    og_type?: string
    og_title?: string
    og_description?: string
    og_url?: string
    og_site_name?: string
    og_image?: Array<{ url: string; width?: number; height?: number; type?: string }>
    article_published_time?: string
    article_modified_time?: string
    twitter_card?: string
    twitter_title?: string
    twitter_description?: string
    twitter_image?: string
    robots?: Record<string, string> & { index?: string; follow?: string }
    schema?: Record<string, unknown>
  }
}

export function cleanWpHtml(rawHtml: string): string {
  if (!rawHtml) return ''

  return (
    rawHtml
      // Remove WordPress shortcodes like [vc_row], [/vc_row], [caption], etc.
      .replace(/\[\/?(vc_[^\]]+|caption[^\]]*|wp_caption[^\]]*)\]/gi, '')
      // Remove inline WordPress Gutenberg comments like <!-- wp:paragraph -->
      .replace(/<!--\s*\/?wp:[^>]*-->/gi, '')
      // Remove WordPress emoji spans / image hacks
      .replace(/<img[^>]*class="[^"]*wp-smiley[^"]*"[^>]*alt="([^"]*)"[^>]*>/gi, '$1')
      // Normalize consecutive empty paragraphs
      .replace(/(<p>\s*(&nbsp;|\s)*<\/p>)+/gi, '')
      // Trim surrounding whitespace
      .trim()
  )
}

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
