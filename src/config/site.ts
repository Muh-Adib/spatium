// -----------------------------------------------------------------------------
// Site Configuration — UNIMASI Studio
// -----------------------------------------------------------------------------

export const siteConfig = {
  name: 'UNIMASI Studio',
  tagline: 'We Make Ideas Move — 2D & 3D Animation, Motion Graphics & Videotron',
  description:
    'UNIMASI adalah studio animasi 2D, 3D, motion graphics, dan visual production untuk edukasi, industri, dan brands.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://unimasi.studio',
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
