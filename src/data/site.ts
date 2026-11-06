export const STUDIO_EMAIL = process.env.NEXT_PUBLIC_STUDIO_EMAIL || 'hello@spatium.id'

function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Public contact details. Only the email is confirmed; every other channel is
 * env-driven and `null` when unset so the UI hides it instead of rendering a
 * placeholder (§3.11 Zero-Mock).
 */
export type ContactInfo = {
  email: string
  phone: string | null
  whatsapp: string | null
  location: string | null
  hours: string | null
}

export const CONTACT: ContactInfo = {
  email: STUDIO_EMAIL,
  phone: optionalEnv(process.env.NEXT_PUBLIC_PHONE),
  whatsapp: optionalEnv(process.env.NEXT_PUBLIC_WHATSAPP),
  location: optionalEnv(process.env.NEXT_PUBLIC_STUDIO_ADDRESS),
  hours: optionalEnv(process.env.NEXT_PUBLIC_STUDIO_HOURS),
}

export type NavChild = { label: string; to: string; blurb?: string }
export type NavItem = { label: string; to: string; children?: NavChild[] }

export const NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'Layanan',
    to: '/services',
    children: [
      { label: 'Semua Layanan', to: '/services', blurb: '4 Vertikal Spasial Utama SPATIUM' },
      { label: 'Filmmaking & VFX', to: '/services/filmmaking-vfx', blurb: 'Set reconstruction, previz & virtual scouting' },
      { label: 'Marketing & Branding', to: '/services/marketing-branding', blurb: 'ZMOT, spatial tour & interactive showcase' },
      { label: 'Entertainment & Installation', to: '/services/entertainment-installation', blurb: 'Projection mapping & immersive exhibits' },
      { label: 'Memory & Documentary', to: '/services/memory-documentary', blurb: 'Wedding memory, event & cultural heritage' },
    ],
  },
  { label: 'Portofolio', to: '/portfolio' },
  { label: 'Tentang', to: '/about' },
  { label: 'Artikel', to: '/journal' },
  { label: 'Kontak', to: '/contact' },
]

// Brand methodology (not CMS content). Copy follows the product deck's workflow slide;
// no accuracy, frame-rate or device-compatibility claims that the deck does not make.
export const PROCESS = [
  {
    index: '01',
    title: 'Laser Scan',
    duration: 'Capture the real world',
    summary:
      'Laser scanner merekam jutaan pengukuran spasial (XYZ + intensitas) dari dunia nyata dengan akurasi tinggi.',
    outputs: ['Pengukuran XYZ + intensitas', 'Data lokasi nyata'],
  },
  {
    index: '02',
    title: 'Point Cloud',
    duration: 'Accurate spatial data',
    summary:
      'Hasilnya point cloud — representasi 3D presisi dari jutaan titik spasial dengan informasi warna dan intensitas.',
    outputs: ['Point cloud berwarna', 'Data spasial akurat'],
  },
  {
    index: '03',
    title: '3D Geometry',
    duration: 'Structured and editable',
    summary:
      'Dari point cloud dibuat 3D geometry (mesh) — model terstruktur yang bisa diedit, dengan topologi dan tekstur rapi, siap untuk produksi 3D, visualisasi, dan simulasi.',
    outputs: ['Mesh bertekstur', 'Aset untuk produksi 3D'],
  },
  {
    index: '04',
    title: '3D Gaussian Splat',
    duration: 'Photorealistic and immersive',
    summary:
      'Data yang sama dikonversi menjadi 3D Gaussian Splat — representasi ringan, fotorealistis, dan imersif untuk pengalaman real-time, tur virtual, dan aplikasi interaktif.',
    outputs: ['Scene 3D Gaussian Splat', 'Viewer interaktif di browser'],
  },
] as const

export const VALUES = [
  {
    title: 'Walkable Image',
    body: 'Bukan sekadar foto atau video. Jelajahi dan rasakan ruang seolah benar-benar berada di sana.',
    icon: 'expertise',
  },
  {
    title: 'Real-World Accuracy',
    body: 'Skala dan detail ruang yang sebenarnya menjadi fondasi setiap output.',
    icon: 'technical',
  },
  {
    title: 'Zero Moment of Truth (ZMOT)',
    body: 'First impression yang bisa dijelajahi: calon pelanggan merasakan ruang Anda sebelum datang.',
    icon: 'story',
  },
  {
    title: 'One Point, Unlimited Possibilities',
    body: 'Capture once, use everywhere — satu data spasial untuk output 3D, 2D, interaktif, dan imersif.',
    icon: 'quality',
  },
  {
    title: 'Creative Freedom',
    body: 'Memberi seniman 3D dan visual tempat nyata untuk berkarya.',
    icon: 'collaboration',
  },
] as const

export type Industry = { name: string; blurb: string; icon: string }

// Sectors covered by the published scene portfolio (reference portfolio HTML) and the deck's use cases.
export const INDUSTRIES: Industry[] = [
  { name: 'Filmmaking & VFX', blurb: 'Set reconstruction, pre-visualization, dan tech-visualization di lokasi nyata.', icon: 'gaming' },
  { name: 'Food & Beverage', blurb: 'Eksterior dan interior restoran atau kafe yang bisa dijelajahi sebelum berkunjung.', icon: 'brand' },
  { name: 'Hospitality', blurb: 'Pratinjau kamar dan venue agar tamu mengenal ruang sebelum check-in.', icon: 'product' },
  { name: 'Manufacturing', blurb: 'Ruang produksi yang lebih mudah diinspeksi dan dikomunikasikan dari jarak jauh.', icon: 'manufacturing' },
  { name: 'Healthcare', blurb: 'Rekaman imersif lingkungan klinis untuk peninjauan dan dokumentasi fasilitas.', icon: 'education' },
  { name: 'Property', blurb: 'Showcase properti untuk peninjauan jarak jauh dan presentasi proyek.', icon: 'architecture' },
  { name: 'Agriculture', blurb: 'Dokumentasi fasilitas budidaya yang bisa dibagikan dari jarak jauh.', icon: 'government' },
  { name: 'Memory & Heritage', blurb: 'Preservasi venue pernikahan, acara, dan warisan budaya.', icon: 'agency' },
]

export const BUDGET_RANGES = [
  'Di bawah Rp 15 Juta',
  'Rp 15 Juta – Rp 35 Juta',
  'Rp 35 Juta – Rp 75 Juta',
  'Rp 75 Juta – Rp 150 Juta',
  'Rp 150 Juta+',
  'Belum yakin — butuh konsultasi',
] as const

export const TIMELINES = [
  'Segera (< 1 minggu)',
  '1–2 minggu',
  '2–4 minggu',
  '1–2 bulan',
  'Kemitraan berkelanjutan',
] as const

export const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/spatium.studio' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/spatium-studio' },
] as const
