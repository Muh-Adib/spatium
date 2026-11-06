export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'callout'; title: string; text: string }

export type ArticleCategory =
  | 'Teknologi 3DGS'
  | 'Marketing & ZMOT'
  | 'Filmmaking & VFX'
  | 'Preservasi Memori'
  | 'Arsitektur & LiDAR'

export type Article = {
  slug: string
  title: string
  category: ArticleCategory
  excerpt: string
  metaDescription: string
  /** ISO date string (publication). */
  date: string
  author: string
  readMinutes: number
  tags: string[]
  artVariant: number
  featured?: boolean
  body: Block[]
  serviceCta: { label: string; to: string; blurb: string }
  relatedLinks: { label: string; to: string }[]
  relatedSlugs: string[]
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Teknologi 3DGS',
  'Marketing & ZMOT',
  'Filmmaking & VFX',
  'Preservasi Memori',
  'Arsitektur & LiDAR',
]

export const ARTICLES: Article[] = [
  {
    slug: 'memahami-3d-gaussian-splatting-revolusi-radiance-fields',
    title: 'Memahami 3D Gaussian Splatting: Revolusi Visual 60 FPS di Web Peramban',
    category: 'Teknologi 3DGS',
    excerpt:
      'Bagaimana algoritma 3DGS menggantikan mesh poligon konvensional dan photogrammetry berat dengan jutaan elipsoid radiance field yang mulus di browser smartphone.',
    metaDescription:
      'Panduan mendalam 3D Gaussian Splatting (3DGS) dari SPATIUM: prinsip kerja neural radiance fields, komparasi dengan photogrammetry klasik, dan akselerasi WebGL 60 FPS.',
    date: '2026-10-15',
    author: 'SPATIUM Engineering Team',
    readMinutes: 6,
    tags: ['3DGS', 'WebGL', 'Neural Radiance', 'LiDAR'],
    artVariant: 1,
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Selama beberapa dekade, representasi lingkungan 3D di komputer selalu bergantung pada jaring segitiga (polygon mesh) dan tekstur bitmap. Meskipun efektif untuk game buatan, teknik ini kesulitan mereplikasi pantulan cahaya kompleks, serat transparan, dan atmosfer kabur di dunia nyata tanpa menghasilkan jutaan poligon yang membuat browser tersendat.',
      },
      {
        type: 'h2',
        text: 'Mengapa 3D Gaussian Splatting Mengubah Segalanya',
      },
      {
        type: 'p',
        text: '3D Gaussian Splatting (3DGS) tidak menggunakan segitiga datar. Sebaliknya, ruang nyata direkonstruksi menjadi jutaan "elipsoid spasial" semi-transparan yang masing-masing membawa informasi posisi XYZ, kovarian bentuk elips, opasitas, dan koefisien spherical harmonics untuk menangkap perubahan warna cahaya saat sudut pandang kamera bergeser.',
      },
      {
        type: 'ul',
        items: [
          'Rendering 60 FPS Real-Time: Menggunakan rasterisasi berbasis kartu grafis tanpa beban komputasi ray-tracing yang berat.',
          'Fotorealisme Sempurna: Merekam kilau cermin, refraksi kaca, dan efek pencahayaan dinamis secara alami.',
          'Langsung di Peramban: Berjalan mulus di Chrome, Safari, dan Firefox di laptop maupun HP tanpa perlu unduh plugin.',
        ],
      },
      {
        type: 'callout',
        title: 'Prinsip SPATIUM',
        text: 'One point, unlimited possibilities. Pemindaian LiDAR dan 3DGS di lokasi fisik menghasilkan aset master yang dapat diakses selamanya untuk web, VR, hingga pipeline film profesional.',
      },
    ],
    serviceCta: {
      label: 'Jelajahi Showcase 3DGS',
      to: '/portfolio',
      blurb: 'Lihat bagaimana 10 proyek nyata SPATIUM berjalan interaktif 60 FPS di browser Anda.',
    },
    relatedLinks: [
      { label: 'Lihat Batuna Resto Manado', to: '/portfolio/batuna-resto-oceanfront-exterior' },
      { label: 'Konsultasi Ruang Spasial', to: '/contact' },
    ],
    relatedSlugs: ['zero-moment-of-truth-mengapa-foto-2d-tak-cukup', 'virtual-scouting-previz-sinematik-lidar'],
  },
  {
    slug: 'zero-moment-of-truth-mengapa-foto-2d-tak-cukup',
    title: 'Zero Moment of Truth (ZMOT): Mengapa Foto 2D dan Video Pasif Tak Lagi Cukup',
    category: 'Marketing & ZMOT',
    excerpt:
      'Konsumen era kini enggan mempercayai foto wide-angle yang menipu. Pengalaman "Walkable Images" 3DGS memberikan verifikasi skala nyata 1:1 yang mendongkrak konversi reservasi bisnis.',
    metaDescription:
      'Penerapan Zero Moment of Truth (ZMOT) menggunakan tur spasial 3D Gaussian Splatting untuk industri perhotelan, restoran, dan properti menurut SPATIUM Studio.',
    date: '2026-10-02',
    author: 'SPATIUM Strategy & Research',
    readMinutes: 5,
    tags: ['ZMOT', 'Marketing', 'F&B', 'Hospitality'],
    artVariant: 2,
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Berapa kali Anda memesan hotel atau meja restoran berdasarkan foto wide-angle dramatis, hanya untuk kecewa saat tiba di lokasi karena ruangan aslinya sempit dan layout-nya membingungkan? Ini adalah krisis kepercayaan yang dihadapi industri hospitality saat ini.',
      },
      {
        type: 'h2',
        text: 'The Curse of Distance: Memutus Ragu Calon Pelanggan',
      },
      {
        type: 'p',
        text: 'Konsumen menginginkan kepastian sebelum mereka mengeluarkan uang atau menempuh perjalanan jauh. Konsep Zero Moment of Truth (ZMOT) membuktikan bahwa keputusan transaksi ditentukan pada momen eksplorasi digital pertama.',
      },
      {
        type: 'p',
        text: 'Dengan tur spasial 3DGS SPATIUM, pelanggan tidak hanya menonton video pasif. Mereka dapat "berjalan bebas" dari pintu masuk ke balkon, memeriksa jarak antar meja, melihat sudut pemandangan laut, dan menekan tombol reservasi dengan keyakinan penuh 100%.',
      },
    ],
    serviceCta: {
      label: 'Layanan Marketing & Branding',
      to: '/services/marketing-branding',
      blurb: 'Tingkatkan direct-booking dan konversi ruang bisnis Anda dengan Walkable 3DGS.',
    },
    relatedLinks: [
      { label: 'Tur Kidang Nyaring Cafe', to: '/portfolio/kidang-nyaring-outdoor-canopy' },
      { label: 'Tur Suite Aston Bogor', to: '/portfolio/aston-bogor-executive-suite' },
    ],
    relatedSlugs: ['memahami-3d-gaussian-splatting-revolusi-radiance-fields'],
  },
  {
    slug: 'virtual-scouting-previz-sinematik-lidar',
    title: 'Virtual Scouting & Previz Sinematik: Rekonstruksi Set Presisi LiDAR untuk Sutradara',
    category: 'Filmmaking & VFX',
    excerpt:
      'Menghilangkan spekulasi lensa dan pemborosan hari syuting film dengan merekonstruksi set lokasi fisik menjadi lingkungan 3D akurasi milimeter sebelum kamera menyala.',
    metaDescription:
      'Integrasi LiDAR scanning, 3DGS, dan Previz kamera Unreal Engine untuk produksi film dan efek visual dari SPATIUM Spatial Studio.',
    date: '2026-09-20',
    author: 'SPATIUM Cinema Lab',
    readMinutes: 7,
    tags: ['Filmmaking', 'VFX', 'Previz', 'Unreal Engine'],
    artVariant: 3,
    body: [
      {
        type: 'p',
        text: 'Di industri perfilman dan iklan berskala besar, satu hari syuting tambahan di lokasi terpencil dapat memakan biaya ratusan juta rupiah. Sering kali masalah timbul karena sutradara dan penata sinematografi (DoP) baru menyadari keterbatasan jarak fokal lensa saat kru sudah tiba di set fisik.',
      },
      {
        type: 'h2',
        text: 'Rekonstruksi Set Sub-Sentimeter',
      },
      {
        type: 'p',
        text: 'Dengan alur teknologi SPATIUM, lokasi syuting dipindai menggunakan laser LiDAR darat berkecepatan tinggi. Dalam hitungan jam, model 3D berskala 1:1 dengan akurasi sub-5mm tersedia untuk diimpor ke Unreal Engine atau Blender.',
      },
      {
        type: 'p',
        text: 'Tim kreatif dapat mencoba berbagai focal length kamera, merencanakan pergerakan dolly crane, mensimulasikan arah cahaya matahari sepanjang hari, dan menyelaraskan penanda tracking VFX tanpa perlu bolak-balik ke lokasi nyata.',
      },
    ],
    serviceCta: {
      label: 'Layanan Filmmaking & VFX',
      to: '/services/filmmaking-vfx',
      blurb: 'Konsultasikan kebutuhan virtual scouting dan set reconstruction untuk produksi film Anda.',
    },
    relatedLinks: [
      { label: 'Studi Kasus Unicam Industrial', to: '/portfolio/unicam-indonesia-manufaktur-presisi' },
      { label: 'Jadwalkan Konsultasi', to: '/contact' },
    ],
    relatedSlugs: ['memahami-3d-gaussian-splatting-revolusi-radiance-fields'],
  },
  {
    slug: 'preservasi-spasial-wedding-dan-heritage',
    title: 'Preservasi Spasial Memori: Mengabadikan Wedding Sanctuary dan Warisan Budaya',
    category: 'Preservasi Memori',
    excerpt:
      'Dekorasi pernikahan mewah dan bangunan bersejarah dapat dibongkar atau tergerus zaman. 3DGS mengabadikannya ke dalam replika digital abadi lintas generasi.',
    metaDescription:
      'Bagaimana SPATIUM mengabadikan momen sakral pernikahan dan cagar budaya menggunakan pemindaian spasial fotorealistis abadi.',
    date: '2026-09-05',
    author: 'SPATIUM Heritage Lab',
    readMinutes: 5,
    tags: ['Wedding', 'Heritage', 'Digital Twin', 'Archiving'],
    artVariant: 4,
    body: [
      {
        type: 'p',
        text: 'Momen terbaik dalam hidup sering kali berlangsung di tempat-tempat yang ephemeral. Dekorasi pernikahan yang dirancang berbulan-bulan dengan anggaran ratusan juta rupiah hanya bertahan satu hari sebelum dibongkar tuntas keesokan paginya.',
      },
      {
        type: 'h2',
        text: 'Kembali Berjalan di Dalam Memori Nyata',
      },
      {
        type: 'p',
        text: 'Album foto dan video sinematik adalah kenangan yang indah, namun keduanya bersifat datar dan pasif. Anda tidak bisa memilih untuk melangkah ke sudut pilar di mana bunga favorit Anda diletakkan, atau melihat kembali pantulan kristal lampu gantung dari sudut pandang Anda sendiri.',
      },
      {
        type: 'p',
        text: 'SPATIUM memindai seluruh venue pernikahan saat dekorasi mencapai kesempurnaan puncaknya. Hasilnya adalah digital twin interaktif yang memungkinkan pasangan dan keluarga berjalan kembali di hari bahagia mereka puluhan tahun mendatang, bahkan menggunakan kacamata spasial VR atau Apple Vision Pro.',
      },
    ],
    serviceCta: {
      label: 'Layanan Memory & Documentary',
      to: '/services/memory-documentary',
      blurb: 'Abadikan dekorasi sakral dan properti keluarga Anda ke dalam arsip spasial abadi.',
    },
    relatedLinks: [
      { label: 'Lihat Grand Glasshouse Wedding Sanctuary', to: '/portfolio/grand-glasshouse-wedding-sanctuary' },
    ],
    relatedSlugs: ['memahami-3d-gaussian-splatting-revolusi-radiance-fields'],
  },
]

export const SORTED_ARTICLES = [...ARTICLES].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  if (article.relatedSlugs && article.relatedSlugs.length > 0) {
    const matched = article.relatedSlugs
      .map((slug) => getArticle(slug))
      .filter((a): a is Article => Boolean(a))
    if (matched.length >= limit) return matched.slice(0, limit)
  }
  return ARTICLES.filter((a) => a.slug !== article.slug).slice(0, limit)
}
