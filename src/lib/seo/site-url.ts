/**
 * Same-site URL guards for SEO tooling: PageSpeed, IndexNow and URL
 * inspection only accept URLs on the configured site.
 */

/** True when `url` is on the same hostname as `siteUrl`. */
export function isSameSiteHost(url: string, siteUrl: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase() === new URL(siteUrl).hostname.toLowerCase()
  } catch (err) {
    console.warn('[seo/site-url] Could not compare URL hosts', url, err)
    return false
  }
}

/**
 * Resolves `raw` (absolute URL or path) against `siteUrl` and returns it only
 * when it is an http(s) URL on the same host. Empty input means the site root.
 */
export function resolveSameSiteUrl(raw: string | undefined, siteUrl: string): string | null {
  if (!raw) return new URL(siteUrl).toString()
  let target: URL
  try {
    target = new URL(raw, siteUrl)
  } catch (err) {
    console.warn('[seo/site-url] Malformed URL', raw, err)
    return null
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return null
  return isSameSiteHost(target.toString(), siteUrl) ? target.toString() : null
}
