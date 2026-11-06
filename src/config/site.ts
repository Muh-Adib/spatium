// -----------------------------------------------------------------------------
// Site Configuration — Spatium
// -----------------------------------------------------------------------------

export function resolveSiteUrl(defaultFallback: string = 'https://spatium.id'): string {
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
  tagline: 'Real places. New perspectives. | One Point, Unlimited Possibilities',
  description:
    'SPATIUM — Spatial Technology Studio specializing in 3D Gaussian Splatting, LiDAR laser scanning, photogrammetry digital twins, and walkable spatial computing for Filmmaking, Marketing, Entertainment, and Memory Preservation.',
  url: resolveSiteUrl('https://spatium.id'),
  cmsUrl: process.env.CMS_URL ?? '/admin',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '+6281234567890',
  email: 'hello@spatium.id',
  phone: process.env.NEXT_PUBLIC_PHONE || '+6281234567890',
  address: 'Jakarta & Bandung, Indonesia',
  social: {
    instagram: 'https://instagram.com/spatium.studio',
    linkedin: 'https://linkedin.com/company/spatium-studio',
    github: 'https://github.com/spatium',
  },
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  },
  defaultOgImage: '/images/spatium-logo.png',
  locale: 'id_ID',
  alternateLocale: 'en_US',
  /** Canonical public route for the articles index (brand-specific). */
  articlesBasePath: '/journal',
} as const

export type SiteConfig = typeof siteConfig
