import { useEffect } from 'react'

export const SITE_URL = 'https://unimasi.studio'
export const SITE_NAME = 'UNIMASI'

type SeoProps = {
  title: string
  description: string
  /** Route path beginning with "/" — used to build the canonical URL. */
  path: string
  /** Optional structured data (schema.org) for the page. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  type?: 'website' | 'article'
  image?: string
  /** Prevents indexing (used for 404 and utility routes). */
  noIndex?: boolean
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value))
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Keeps document head in sync with the active route. Runs client-side for this
 * single-page build; the same values are mirrored in `/sitemap.xml` for crawlers.
 */
export function Seo({ title, description, path, jsonLd, type = 'website', image, noIndex }: SeoProps) {
  const canonical = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`
  const fullTitle = path === '/' ? title : `${title} — ${SITE_NAME}`
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow',
    })

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })

    if (image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: `${SITE_URL}${image}` })
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: `${SITE_URL}${image}` })
    }

    upsertLink('canonical', canonical)

    const SCRIPT_ID = 'unimasi-jsonld'
    document.getElementById(SCRIPT_ID)?.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = SCRIPT_ID
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jsonLdKey is the stable identity of jsonLd
  }, [fullTitle, description, canonical, type, image, noIndex, jsonLdKey])

  return null
}
