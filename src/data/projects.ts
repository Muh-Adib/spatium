export type ProjectCategory = '2d' | '3d' | 'motion' | 'assets'

export type Project = {
  slug: string
  title: string
  client: string
  category: ProjectCategory
  discipline: string
  year: string
  tagline: string
  brief: string
  approach: string[]
  delivered: string[]
  variant: number
  videoUrl?: string
  posterUrl?: string
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
    posterUrl: '/images/clients/unified-gray/wilmar.svg',
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
    posterUrl: '/images/clients/unified-gray/danone.webp',
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
    delivered: ['Pemodelan 3D CAD & Rigging', 'Tekstur Logam Photorealistic', 'Sinematografi Kamera 3D', 'Video Profil Korporat 4K'],
    variant: 3,
    posterUrl: '/images/clients/unified-gray/pt-ypti.webp',
  },
  {
    slug: 'in-memoriam',
    title: 'In Memoriam: Merangkai Jejak Kehidupan',
    client: 'Sanata Dharma Heritage Foundation',
    category: '3d',
    discipline: '3D Animation · Stylized Heritage',
    year: '2023',
    tagline: 'Animasi penghormatan tokoh sejarah dengan rekonstruksi foto arsip menjadi dunia 3D spasial.',
    brief:
      'Menghidupkan foto-foto hitam putih berusia puluhan tahun dengan tetap menjaga integritas sejarah dan rasa hormat yang mendalam.',
    approach: [
      'Teknik 2.5D camera projection mapping dipadukan dengan simulasi partikel debu waktu.',
      'Pencahayaan chiaroscuro dramatis untuk membangun suasana reflektif dan penuh martabat.',
      'Kombinasi narasi biografi dengan transisi scene yang mengalir dinamis.',
    ],
    delivered: ['Restorasi & Proyeksi 2.5D', 'Simulasi Partikel Spasial', 'Kompositing & Grading Sinematik'],
    variant: 4,
    posterUrl: '/images/clients/unified-gray/itb.webp',
  },
  {
    slug: 'p4mu-surabaya-journey',
    title: 'Perjalanan P4MU Surabaya: Dari Awal Sederhana ke Dampak Luas',
    client: 'P4MU Surabaya & Pemprov Jatim',
    category: 'assets',
    discipline: 'AI & Production · Video Profil Publik',
    year: '2024',
    tagline: 'Eksplorasi konsep visual generative AI yang dipoles oleh keahlian senior animator studio.',
    brief:
      'Kebutuhan produksi profil institusi 30 scene dalam waktu kilat 10 hari kerja untuk peresmian fasilitas baru.',
    approach: [
      'Implementasi pipeline AI-assisted concept generation untuk percepatan eksplorasi visual style frame.',
      'Penyelarasan manual oleh tim lead artist UNIMASI guna menjaga konsistensi proporsi dan identitas institusi.',
      'Penggabungan rekaman dokumenter nyata dengan grafis motion kinetik terarah.',
    ],
    delivered: ['Pipeline Generasi Visual AI', 'Finishing & Motion Graphics', 'Audio Mixing & Master Video'],
    variant: 1,
    posterUrl: '/images/clients/unified-gray/kemenperin.svg',
  },
  {
    slug: 'telkom-dfe-explainer',
    title: 'Telkom Digital Future Enterprise: Menembus Batas Konektivitas',
    client: 'Telkom Indonesia',
    category: 'motion',
    discipline: 'Motion Graphics · Enterprise Tech',
    year: '2024',
    tagline: 'Animasi futuristik memvisualisasikan jaringan fiber optik, satellite gateway, dan cloud hybrid.',
    brief:
      'Konsep telekomunikasi skala makro dan transfer data digital sangat abstrak untuk divisualisasikan dalam alur cerita 90 detik.',
    approach: [
      'Memadukan grafis isometrik neon dengan garis jaringan kinetik berkecepatan tinggi yang menghubungkan kepulauan Indonesia.',
      'Visualisasi data center dan arsitektur cloud hybrid secara terstruktur dan mudah dimengerti para CIO enterprise.',
      'Iringan ritme audio dinamis yang membangkitkan rasa kemajuan teknologi masa depan.',
    ],
    delivered: ['Desain Konsep Isometrik 3D', 'Animasi Alur Data Kinetik', 'Paket Motion Bumper & Promo Medsos'],
    variant: 2,
    posterUrl: '/images/clients/unified-gray/telkomsel.svg',
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug)
}

export function getRelatedProjects(slug: string, limit = 2): Project[] {
  return PROJECTS.filter((p) => p.slug !== slug).slice(0, limit)
}
