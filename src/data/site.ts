export const STUDIO_EMAIL = process.env.NEXT_PUBLIC_STUDIO_EMAIL || 'hello@spatium.id'

export const CONTACT = {
  email: STUDIO_EMAIL,
  phone: process.env.NEXT_PUBLIC_PHONE || '+6281234567890',
  location: 'Jakarta & Bandung, Indonesia · Global Captures',
  hours: 'Mon–Fri · 09:00–18:00 WIB',
} as const

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
      { label: 'Marketing & Branding', to: '/services/marketing-branding', blurb: 'ZMOT, tur spasial 3DGS & WebGL display' },
      { label: 'Entertainment & Installation', to: '/services/entertainment-installation', blurb: 'Projection mapping & immersive exhibits' },
      { label: 'Memory & Documentary', to: '/services/memory-documentary', blurb: 'Wedding sanctuary & heritage digital twin' },
    ],
  },
  { label: 'Portofolio', to: '/portfolio' },
  { label: 'Tentang', to: '/about' },
  { label: 'Artikel', to: '/journal' },
  { label: 'Kontak', to: '/contact' },
]

export const PROCESS = [
  {
    index: '01',
    title: 'Laser Scan & Drone Capture',
    duration: 'Tahap 1',
    summary:
      'Perekaman lapangan berkecepatan tinggi menggunakan terrestrial laser scanner LiDAR, drone photogrammetry, dan rig kamera spasial calibrated.',
    outputs: ['Jutaan koordinat XYZ', 'Data intensitas laser LiDAR', 'Foto resolusi ultra-tinggi', 'Peta survei geospasial'],
  },
  {
    index: '02',
    title: 'Dense Point Cloud Reconstruction',
    duration: 'Tahap 2',
    summary:
      'Pemrosesan densifikasi awan titik spasial dengan akurasi sub-sentimeter (3–5mm) sebagai cetak biru digital ruang fisik.',
    outputs: ['Dense point cloud terkalibrasi', 'Pembersihan noise spasial', 'Koordinat batas ruang', 'Registrasi multi-scan'],
  },
  {
    index: '03',
    title: '3D Geometry & CAD Modeling',
    duration: 'Tahap 3',
    summary:
      'Konversi awan titik ke dalam model mesh permukaan 3D dan CAD yang presisi untuk kebutuhan analisis arsitektur atau integrasi engine.',
    outputs: ['Mesh 3D bersih & teroptimasi', 'Model CAD / BIM', 'Format OBJ / FBX / USDZ', 'Peta UV unwrap'],
  },
  {
    index: '04',
    title: '3D Gaussian Splatting (3DGS)',
    duration: 'Tahap 4',
    summary:
      'Pelatihan neural radiance fields menghasilkan jutaan elipsoid spasial fotorealistis yang dapat diakses langsung pada 60 FPS WebGL.',
    outputs: ['Aset 3DGS Master (.ply / .splat)', 'Player WebGL interaktif', 'Scene-pairing eksterior/interior', 'Kompatibilitas VR / WebXR'],
  },
] as const

export const VALUES = [
  {
    title: 'Walkable Images 3D',
    body: 'Bukan sekadar foto statis atau video pasif. Pengunjung bebas berjalan, berputar, dan terbang ke sudut mana pun dengan skala nyata 1:1.',
    icon: 'expertise',
  },
  {
    title: 'Sub-Centimeter Precision',
    body: 'Akurasi pemindaian laser LiDAR terestrial hingga toleransi di bawah 5mm, menghadirkan replika fisik yang dapat dipercaya dan diverifikasi.',
    icon: 'technical',
  },
  {
    title: 'Zero Moment of Truth (ZMOT)',
    body: 'Memberikan kepastian ruang dan atmosfer nyata sebelum konsumen memutuskan memesan kamar, menyewa tempat, atau membeli properti.',
    icon: 'story',
  },
  {
    title: 'One Point, Unlimited Possibilities',
    body: 'Pindai sekali di lokasi, aset dapat digunakan selamanya untuk embed WebGL, VR/Vision Pro, VFX film, survei teknis, hingga arsip digital.',
    icon: 'quality',
  },
  {
    title: 'Native WebGL Real-Time 60 FPS',
    body: 'Dapat diakses instan di browser smartphone, laptop, tablet, dan headset VR tanpa perlu mengunduh atau menginstal aplikasi apa pun.',
    icon: 'collaboration',
  },
] as const

export type Industry = { name: string; blurb: string; icon: string }

export const INDUSTRIES: Industry[] = [
  { name: 'Filmmaking & VFX', blurb: 'Virtual scouting, set reconstruction, dan kamera previz sebelum hari syuting.', icon: 'gaming' },
  { name: 'Food & Beverage', blurb: 'Eksplorasi spasial restoran & kafe untuk mendongkrak reservasi meja ZMOT.', icon: 'brand' },
  { name: 'Hospitality & Hotel', blurb: 'Tur fotorealistis kamar suite dan resort untuk memaksimalkan direct booking.', icon: 'product' },
  { name: 'Industrial & Manufaktur', blurb: 'Audit virtual pabrik, mesin presisi CNC, dan orientasi teknis jarak jauh.', icon: 'manufacturing' },
  { name: 'Healthcare & Medis', blurb: 'Digital twin ruang bedah steril presisi sub-3mm untuk simulasi klinis.', icon: 'education' },
  { name: 'Properti & Arsitektur', blurb: 'Walkthrough apartemen dan residensial skala 1:1 tanpa distorsi lensa wide-angle.', icon: 'architecture' },
  { name: 'Agrikultur & Riset', blurb: 'Kembaran digital greenhouse pembibitan dan pemantauan mikroklimat botani.', icon: 'government' },
  { name: 'Memori & Cagar Budaya', blurb: 'Preservasi spasial dekorasi pernikahan mewah dan arsip warisan pusaka abadi.', icon: 'agency' },
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
  { label: 'GitHub', href: 'https://github.com/spatium' },
] as const
