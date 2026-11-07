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

/**
 * Public contact channels (email, phone, WhatsApp, address, hours, socials)
 * are NOT part of this static config: they are managed in Studio → Pengaturan
 * and read with getPublicContact() (src/lib/content/contact.ts).
 */
export const siteConfig = {
  name: 'Spatium',
  tagline: 'Real places. New perspectives. | One Point, Unlimited Possibilities',
  description:
    'SPATIUM — Spatial Technology Studio specializing in 3D Gaussian Splatting, LiDAR laser scanning, photogrammetry digital twins, and walkable spatial computing for Filmmaking, Marketing, Entertainment, and Memory Preservation.',
  url: resolveSiteUrl('https://spatium.id'),
  cmsUrl: process.env.CMS_URL ?? '/admin',
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  },
  defaultOgImage: '/icon-512.png',
  locale: 'id_ID',
  alternateLocale: 'en_US',
  /** Canonical public route for the articles index (brand-specific). */
  articlesBasePath: '/journal',
} as const

export type SiteConfig = typeof siteConfig
