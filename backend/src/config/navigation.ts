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

export const primaryNav: NavEntry[] = [
  {
    label: 'Solusi',
    href: '/solusi',
  },
  {
    label: 'Layanan',
    href: '/layanan',
  },
  {
    label: 'Portofolio',
    href: '/portofolio',
  },
  {
    label: 'Artikel',
    href: '/artikel',
  },
  {
    label: 'Tentang',
    href: '/tentang',
  },
]

// --- Canonical Footer Navigation Fallback ------------------------------------

export const footerNav = [
  {
    title: 'Layanan & Solusi',
    items: [
      { label: 'Semua Layanan', href: '/layanan' },
      { label: 'Katalog Solusi', href: '/solusi' },
      { label: 'Studi Kasus Portofolio', href: '/portofolio' },
    ],
  },
  {
    title: 'Wawasan',
    items: [
      { label: 'Semua Artikel', href: '/artikel' },
      { label: 'Pencarian Konten', href: '/search' },
    ],
  },
  {
    title: 'Perusahaan',
    items: [
      { label: 'Tentang Kami', href: '/tentang' },
      { label: 'Kontak', href: '/kontak' },
    ],
  },
  {
    title: 'Hukum',
    items: [
      { label: 'Kebijakan Privasi', href: '/privasi' },
      { label: 'Syarat & Ketentuan', href: '/syarat-ketentuan' },
    ],
  },
]
