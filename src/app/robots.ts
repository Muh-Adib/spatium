import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

const SITE_URL = siteConfig.url

/**
 * Crawler policy (GEO). Search and AI-search crawlers are allowed so SPATIUM
 * work can be cited; training-only crawlers are disallowed.
 * Policy owner: site owner. Adjust the lists below to change crawler access.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot'],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot'],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot'],
        disallow: '/',
      },
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
