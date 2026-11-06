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

/** Read an optional public env value; empty/whitespace → null (never a fake fallback). */
function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Contact channels are intentionally env-driven and nullable (§3.11 Zero-Mock):
 * consumers must hide the item when the value is null.
 */
const whatsapp: string | null = optionalEnv(process.env.NEXT_PUBLIC_WHATSAPP)
const phone: string | null = optionalEnv(process.env.NEXT_PUBLIC_PHONE)
const address: string | null = optionalEnv(process.env.NEXT_PUBLIC_STUDIO_ADDRESS)

export const siteConfig = {
  name: 'Spatium',
  tagline: 'Real places. New perspectives. | One Point, Unlimited Possibilities',
  description:
    'SPATIUM — Spatial Technology Studio specializing in 3D Gaussian Splatting, LiDAR laser scanning, photogrammetry digital twins, and walkable spatial computing for Filmmaking, Marketing, Entertainment, and Memory Preservation.',
  url: resolveSiteUrl('https://spatium.id'),
  cmsUrl: process.env.CMS_URL ?? '/admin',
  whatsapp,
  email: 'hello@spatium.id',
  phone,
  address,
  // Social handles are pending owner confirmation — see CONTACT/SOCIALS in src/data/site.ts.
  social: {
    instagram: 'https://instagram.com/spatium.studio',
    linkedin: 'https://linkedin.com/company/spatium-studio',
  },
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

/**
 * Build a wa.me deep link from a configured WhatsApp number.
 * Returns null when no number is configured so callers can hide the CTA.
 */
export function whatsappHref(number: string | null | undefined, text?: string): string | null {
  const digits = (number ?? '').replace(/\D+/g, '')
  if (!digits) return null
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`
}

/** Build a tel: link; null when no phone is configured. */
export function telHref(number: string | null | undefined): string | null {
  const cleaned = (number ?? '').replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : null
}
