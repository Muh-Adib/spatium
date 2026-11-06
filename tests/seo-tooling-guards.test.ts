import { describe, it, expect } from 'vitest'
import { SEO_TOOL_ROLES } from '../src/lib/seo/access'
import { isSameSiteHost, resolveSameSiteUrl } from '../src/lib/seo/site-url'
import { findImagesMissingAlt, sameOriginUrl } from '../src/lib/seo/crawler'

describe('SEO tooling guards', () => {
  it('limits SEO tools to roles with canManageSeo', () => {
    expect([...SEO_TOOL_ROLES].sort()).toEqual(['CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER', 'SUPER_ADMIN'])
    for (const role of ['AUTHOR', 'REVIEWER', 'MEDIA_MANAGER'] as const) {
      expect(SEO_TOOL_ROLES).not.toContain(role)
    }
  })

  it('accepts only URLs on the configured site host', () => {
    const site = 'https://spatium.id'
    expect(isSameSiteHost('https://spatium.id/journal/x', site)).toBe(true)
    expect(isSameSiteHost('https://SPATIUM.ID/', site)).toBe(true)
    expect(isSameSiteHost('https://spatium.id.evil.com/', site)).toBe(false)
    expect(isSameSiteHost('http://169.254.169.254/', site)).toBe(false)
    expect(isSameSiteHost('not a url', site)).toBe(false)
  })

  it('resolves PageSpeed targets against the site and rejects other hosts', () => {
    const site = 'https://spatium.id'
    expect(resolveSameSiteUrl(undefined, site)).toBe('https://spatium.id/')
    expect(resolveSameSiteUrl('/journal', site)).toBe('https://spatium.id/journal')
    expect(resolveSameSiteUrl('https://example.com', site)).toBeNull()
    expect(resolveSameSiteUrl('//example.com/x', site)).toBeNull()
    expect(resolveSameSiteUrl('javascript:alert(1)', site)).toBeNull()
  })

  it('keeps crawler redirects and links on the site origin', () => {
    const base = 'https://spatium.id'
    expect(sameOriginUrl('/about', 'https://spatium.id/', base)).toBe('https://spatium.id/about')
    expect(sameOriginUrl('https://spatium.id/a#x', 'https://spatium.id/', base)).toBe('https://spatium.id/a')
    // Prefix match is not enough: spatium.id.evil.com starts with "https://spatium.id"
    expect(sameOriginUrl('https://spatium.id.evil.com/', 'https://spatium.id/', base)).toBeNull()
    expect(sameOriginUrl('//evil.com/x', 'https://spatium.id/', base)).toBeNull()
    expect(sameOriginUrl('http://169.254.169.254/latest', 'https://spatium.id/', base)).toBeNull()
  })

  it('reports images without alt but accepts decorative alt=""', () => {
    const html = [
      '<img src="/a.webp">',
      '<img alt="" src="/decorative.webp">',
      '<img src="/b.webp" alt="Pemindaian laser">',
      '<img data-src="/lazy.webp">',
    ].join('')
    expect(findImagesMissingAlt(html)).toEqual(['/a.webp'])
  })
})
