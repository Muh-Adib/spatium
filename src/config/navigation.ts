// -----------------------------------------------------------------------------
// Navigation Configuration — Brand-Agnostic Navigation Types & Canonical Fallbacks
// -----------------------------------------------------------------------------

export interface NavItem {
  label: string
  href: string
  description?: string
  icon?: string
  isPopular?: boolean
  isNew?: boolean
  hasPlus?: boolean
  image?: string | { url?: string; src?: string }
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface NavMegaHeader {
  tag: string
  viewAllLabel: string
  viewAllHref: string
}

export interface NavEntry {
  label: string
  href: string
  mega?: boolean
  megaHeader?: NavMegaHeader
  sections?: NavSection[]
}

// --- Canonical Fallback Navigation (Used only when database is initializing) ---
// Hrefs must match real App Router routes under src/app:
// /services, /portfolio, /journal, /about, /contact.

export const primaryNav: NavEntry[] = [
  {
    label: 'Layanan',
    href: '/services',
  },
  {
    label: 'Portofolio',
    href: '/portfolio',
  },
  {
    label: 'Artikel',
    href: '/journal',
  },
  {
    label: 'Tentang',
    href: '/about',
  },
]

// --- Canonical Footer Navigation Fallback ------------------------------------

export const footerNav = [
  {
    title: 'Layanan',
    items: [
      { label: 'Semua Layanan', href: '/services' },
      { label: 'Studi Kasus Portofolio', href: '/portfolio' },
    ],
  },
  {
    title: 'Wawasan',
    items: [{ label: 'Semua Artikel', href: '/journal' }],
  },
  {
    title: 'Perusahaan',
    items: [
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Kontak', href: '/contact' },
    ],
  },
]
