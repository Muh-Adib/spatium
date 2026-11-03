export type ProjectCategory = '2d' | '3d' | 'motion' | 'assets'
export type ProjectCategoryValue = ProjectCategory | 'unknown'

export type Project = {
  slug: string
  title: string
  client: string
  category: ProjectCategoryValue
  discipline: string
  year: string
  tagline: string
  brief: string
  approach: string[]
  delivered: string[]
  variant: number
  videoUrl?: string
  posterUrl?: string
  clientLogoUrl?: string
}

export const PROJECT_CATEGORIES: { id: 'all' | ProjectCategory; label: string }[] = [
  { id: 'all', label: 'All work' },
  { id: '2d', label: '2D Animation' },
  { id: '3d', label: '3D Animation' },
  { id: 'motion', label: 'Motion Graphics' },
  { id: 'assets', label: 'Digital Assets & AI' },
]

export const PROJECTS: Project[] = [
  {
    slug: 'telkom-dfe-explainer',
    title: 'Telkom Digital Future Enterprise: Menembus Batas Konektivitas',
    client: 'Telkom Indonesia',
    category: 'motion',
    discipline: 'Motion Graphics · Tech Explainer',
    year: '2024',
    tagline: 'Animasi teknologi futuristik memvisualisasikan jaringan fiber optik, satellite gateway, dan cloud hybrid Telkom DFE.',
    brief:
      'Konsep telekomunikasi skala makro dan transfer data digital sangat abstrak untuk divisualisasikan dalam alur cerita berdurasi 90 detik.',
    approach: [
      'Memadukan grafis isometrik neon dengan garis jaringan kinetik berkecepatan tinggi yang menghubungkan kepulauan Indonesia secara dinamis.',
      'Pergerakan kamera 2.5D dinamis dengan aksen Bright Yellow (#FFD600) untuk menonjolkan titik backbone jaringan nasional.',
      'Integrasi tipografi kinetik komprehensif untuk menyajikan arsitektur cloud enterprise secara komunikatif.',
    ],
    delivered: ['Naskah & Narasi Teknologi', 'Desain Visual Isometrik 2.5D', 'Animasi Motion Graphics 4K', 'Desain Suara & Audio Sinematik'],
    variant: 1,
    posterUrl: '/images/portfolio/telkom-dfe.webp',
    clientLogoUrl: '/images/clients/telkomsel-dfe.webp',
    videoUrl: '/videos/unimasi-showreel.webm',
  },
  {
    slug: 'pt-ypti-history-impact',
    title: 'Dari Visi ke Presisi: Menelusuri Sejarah dan Dampak YPTI',
    client: 'PT Yogya Presisi Tehnikatama Industri (YPTI)',
    category: '3d',
    discipline: '3D Animation · Corporate Industrial',
    year: '2024',
    tagline: 'Animasi profil korporat manufaktur presisi tinggi dengan visualisasi 3D CGI mesin CNC 5-axis.',
    brief:
      'Memperlihatkan proses pemesinan mikro dengan toleransi mikron secara jelas tanpa terhalang cipratan pendingin atau keterbatasan lensa kamera industri nyata.',
    approach: [
      'Rekonstruksi model 3D CAD presisi dari mesin manufaktur dan cetakan injeksi plastik tingkat tinggi.',
      'Simulasi visual pergerakan alat potong dengan pencahayaan studio industri dramatis.',
      'Sinematografi 3D macro shot yang menonjolkan kualitas tekstur logam hasil proses pemesinan.',
    ],
    delivered: ['Modeling 3D CAD Presisi', 'Simulasi Pemotongan Logam', 'Lighting & Texturing Fotorealistik', 'Compositing & Grading Sinematik'],
    variant: 2,
    posterUrl: '/images/portfolio/pt-ypti-3d.webp',
    clientLogoUrl: '/images/clients/pt-ypti.webp',
    videoUrl: '/videos/unimasi-showreel.webm',
  },
  {
    slug: 'in-memoriam',
    title: 'In Memoriam: Merangkai Jejak Kehidupan & Warisan Sejarah',
    client: 'Sanata Dharma Heritage Foundation',
    category: '3d',
    discipline: '3D Animation · Spatial Documentary',
    year: '2024',
    tagline: 'Animasi spasial 3D menghidupkan arsip sejarah dan dedikasi tokoh pendidikan dalam dunia visual hidup.',
    brief:
      'Menghidupkan foto-foto hitam putih berusia puluhan tahun dengan tetap menjaga integritas sejarah dan rasa hormat yang mendalam.',
    approach: [
      'Teknik 2.5D camera projection mapping dipadukan dengan simulasi partikel debu waktu dan pencahayaan chiaroscuro dramatis.',
      'Rekonstruksi lingkungan 3D historis yang akurat secara arsitektur zaman.',
      'Penyelarasan storytelling dokumenter yang menyentuh hati audiens lintas generasi.',
    ],
    delivered: ['Camera Projection Mapping', 'Rekonstruksi Arsip Digital 3D', 'Animasi Partikel Atmosferik', 'Soundscape Emosional Orkestral'],
    variant: 3,
    posterUrl: '/images/portfolio/sanata-dharma.webp',
    clientLogoUrl: '/images/clients/itb.webp',
  },
  {
    slug: 'wilmar-replanting-sawit',
    title: 'Restorasi Unsur Hara dalam Replanting Sawit',
    client: 'Wilmar International',
    category: 'motion',
    discipline: 'Motion Graphics · Infografis',
    year: '2024',
    tagline: 'Video infografis animasi strategi restorasi hara dan peremajaan sawit berkelanjutan.',
    brief:
      'Menerjemahkan proses biokimia tanah yang rumit dan pedoman agronomi agronomi sawit ke dalam video edukasi yang mudah dicerna oleh petani mitra dan pemangku kepentingan.',
    approach: [
      'Visualisasi infografis 2D dinamis dengan palet warna earthy-modern dan diagram alir animasi penyerapan hara.',
      'Penyusunan storytelling naratif yang sistematis membedah fase persiapan lahan hingga pemeliharaan tanaman muda.',
      'Integrasi tipografi kinetik untuk mempertegas data statistik efisiensi biaya dan hasil panen.',
    ],
    delivered: ['Naskah & Narasi Edukasi', 'Storyboard Infografis', 'Animasi 2D Motion Graphics', 'Paket Sound Design & Voiceover'],
    variant: 1,
    posterUrl: '/images/portfolio/motion-stills-1.png',
    clientLogoUrl: '/images/clients/wilmar.webp',
  },
  {
    slug: 'my-safe-harbor',
    title: 'My Safe Harbor: Kisah Menemukan Rumah',
    client: 'Danone Indonesia & Family Care Initiative',
    category: '2d',
    discipline: '2D Animation · Narrative Story',
    year: '2024',
    tagline: 'Film animasi pendek naratif emosional tentang kehangatan keluarga dan kepulangan ke rumah.',
    brief:
      'Membangun ikatan emosional mendalam melalui animasi karakter ekspresif dengan sentuhan visual hand-drawn watercolor yang hangat dan sinematik.',
    approach: [
      'Pengerjaan animasi frame-by-frame 24 FPS dengan desain karakter yang kuat dan ekspresif.',
      'Pergerakan kamera multi-plane untuk menciptakan kedalaman spasial 2D yang puitis.',
      'Penyusunan tata musik orisinal dan tata suara atmosferik yang menyatu dengan alur cerita.',
    ],
    delivered: ['Desain Karakter Orisinal', 'Animatic Sinematik', 'Animasi Frame-by-Frame', 'Master Color Grading'],
    variant: 2,
    posterUrl: '/images/portfolio/3d-short-film.webp',
    clientLogoUrl: '/images/clients/danone-indonesia.webp',
  },
  {
    slug: 'mercu-buana-branding',
    title: 'Transformasi Akademik Digital Mercu Buana',
    client: 'Universitas Mercu Buana',
    category: '2d',
    discipline: '2D Explainer · Educational Series',
    year: '2024',
    tagline: 'Seri video animasi edukatif memperkenalkan kurikulum adaptif dan ekosistem perkuliahan modern.',
    brief:
      'Menjelaskan jalur studi interdisipliner dan fasilitas kampus dalam format animasi ramah generasi muda yang dinamis.',
    approach: [
      'Karakter animasi bergaya flat modern dengan rigging halus dan ekspresi energik.',
      'Transisi adegan seamless mengalir dari ruang kelas ke simulasi industri nyata.',
      'Tipografi bold dengan palet warna aksen cerah membangkitkan antusiasme calon mahasiswa.',
    ],
    delivered: ['Konsep Cerita & Naskah', 'Ilustrasi Karakter Dinamis', 'Animasi 2D Vector Rigging', 'Master Distribusi Multi-Rasio'],
    variant: 3,
    posterUrl: '/images/portfolio/mercu-buana.webp',
    clientLogoUrl: '/images/clients/umby.webp',
  },
  {
    slug: 'ugm-interactive-visualization',
    title: 'Visualisasi Riset & Inovasi Teknologi UGM',
    client: 'Universitas Gadjah Mada',
    category: 'assets',
    discipline: 'Digital Visual Assets & AI · Scientific Visual',
    year: '2024',
    tagline: 'Visualisasi 3D fotorealistik inovasi teknologi biomedis dan rekayasa material mutakhir.',
    brief:
      'Membantu periset mempresentasikan temuan ilmiah kompleks ke hadapan investor dan publik melalui visual 3D berstandar internasional.',
    approach: [
      'Modeling struktur mikro molekuler dengan shader refraksi dan subsurface scattering.',
      'Eksplorasi kamera mikroskopik virtual dengan depth of field sinematik.',
      'Optimasi aset 3D real-time untuk penayangan pameran interaktif.',
    ],
    delivered: ['3D Asset Modeling', 'Scientific Animation', 'Interactive Web Assets', 'High-Res Print Renders'],
    variant: 1,
    posterUrl: '/images/portfolio/ugm.webp',
    clientLogoUrl: '/images/clients/ugm.webp',
  },
  {
    slug: 'itokoh-industrial-animation',
    title: 'Presisi Pengecoran Logam Berkelanjutan ITOKOH',
    client: 'PT Itokoh Ceperindo',
    category: '3d',
    discipline: '3D Animation · Industrial Process',
    year: '2024',
    tagline: 'Visualisasi 3D proses peleburan, pencetakan logam, dan kendali mutu cor presisi ramah lingkungan.',
    brief:
      'Menggambarkan alur pabrikasi suhu tinggi dan keselamatan kerja industri peleburan besi tanpa bahaya rekaman langsung.',
    approach: [
      'Simulasi fluida cairan logam pijar dengan sistem partikel termal realistik.',
      'Potongan melintang 3D (cutaway view) mesin cetak otomatis resolusi tinggi.',
      'Visualisasi alur QC toleransi mekanikal dengan visual callout interaktif.',
    ],
    delivered: ['Simulasi Fisika Fluida Logam', 'Animasi Cutaway 3D Mesin', 'Lighting Studio Industri', 'Audio Foley Industri'],
    variant: 2,
    posterUrl: '/images/portfolio/itokoh.png',
    clientLogoUrl: '/images/clients/pt-itokoh-ceperindo.webp',
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug)
}

export function mapProjectCategory(raw: unknown): ProjectCategoryValue {
  if (typeof raw !== 'string') return 'unknown'
  const normalized = raw.trim().toLowerCase()
  if (normalized === '2d' || normalized.includes('2d')) return '2d'
  if (normalized === '3d' || normalized.includes('3d')) return '3d'
  if (normalized === 'motion' || normalized.includes('motion')) return 'motion'
  if (normalized === 'assets' || normalized.includes('asset') || normalized.includes('ai')) return 'assets'
  return 'unknown'
}
