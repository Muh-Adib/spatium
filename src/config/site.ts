// -----------------------------------------------------------------------------
// Site Configuration — UNIMASI Studio
// -----------------------------------------------------------------------------

export function resolveSiteUrl(defaultFallback: string = 'https://unimasi.com'): string {
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
  name: 'UNIMASI Studio',
  tagline: 'We Make Ideas Move — 2D & 3D Animation, Motion Graphics & Videotron',
  description:
    'UNIMASI adalah studio animasi 2D, 3D, motion graphics, dan visual production untuk edukasi, industri, dan brands.',
  url: resolveSiteUrl('https://unimasi.com'),
  cmsUrl: process.env.CMS_URL ?? '/admin',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',
  email: 'hello@unimasi.studio',
  phone: process.env.NEXT_PUBLIC_PHONE || '',
  address: 'Yogyakarta, Indonesia',
  social: {
    instagram: 'https://instagram.com/unimasi.studio',
    linkedin: 'https://linkedin.com/company/unimasi',
    github: 'https://github.com/unimasi',
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
