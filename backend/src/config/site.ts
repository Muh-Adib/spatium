// -----------------------------------------------------------------------------
// Site Configuration
// -----------------------------------------------------------------------------

export const siteConfig = {
  name: 'SegiaTech',
  tagline: 'Solusi Digital untuk Masa Depan Bisnis Anda',
  description:
    'SegiaTech adalah studio teknologi digital yang membangun website, aplikasi, dan sistem bisnis modern. Kami membantu UMKM, institusi pendidikan, dan perusahaan bertransformasi secara digital.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.segiatech.com',
  cmsUrl: process.env.CMS_URL ?? '/admin',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '6285227702811',
  email: 'contact@segiatech.com',
  phone: '+62 852-2770-2811',
  address: 'Yogyakarta, Indonesia',
  social: {
    instagram: 'https://instagram.com/segiatech',
    linkedin: 'https://linkedin.com/company/segiatech',
    github: 'https://github.com/segiatech',
  },
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    gtmId: process.env.NEXT_PUBLIC_GTM_ID,
  },
  defaultOgImage: '/images/og-default.jpg',
  locale: 'id_ID',
  alternateLocale: 'en_US',
} as const

export type SiteConfig = typeof siteConfig
