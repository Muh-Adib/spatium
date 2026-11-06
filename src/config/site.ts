// -----------------------------------------------------------------------------
// Site Configuration — Spatium
// -----------------------------------------------------------------------------

export function resolveSiteUrl(defaultFallback: string = 'https://spatium.com'): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.COOLIFY_URL ||
    process.env.SERVICE_URL_APP ||
    (process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : '') ||
    (process.env.SERVICE_FQDN_APP ? `https://${process.env.SERVICE_FQDN_APP}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    defaultFallback

  const primary = envUrl.split(',')[0].trim().replace(/\/+$/, '')
  if (!primary.startsWith('http://') && !primary.startsWith('https://')) {
    return `https://${primary}`
  }
  return primary
}

export const siteConfig = {
  name: 'Spatium',
  tagline: 'Modern Digital Space & Interactive Solutions',
  description:
    'Spatium — Flagship interactive digital platform and technology solutions.',
  url: resolveSiteUrl('https://spatium.com'),
  cmsUrl: process.env.CMS_URL ?? '/admin',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',
  email: 'hello@spatium.com',
  phone: process.env.NEXT_PUBLIC_PHONE || '',
  address: 'Indonesia',
  social: {
    instagram: 'https://instagram.com/spatium',
    linkedin: 'https://linkedin.com/company/spatium',
    github: 'https://github.com/spatium',
  },
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  },
  defaultOgImage: '/favicon.svg',
  locale: 'id_ID',
  alternateLocale: 'en_US',
  /** Canonical public route for the articles index (brand-specific). */
  articlesBasePath: '/journal',
} as const

export type SiteConfig = typeof siteConfig
