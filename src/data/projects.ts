export type ProjectCategory =
  | 'filmmaking'
  | 'marketing'
  | 'entertainment'
  | 'memory'
  | 'hospitality'
  | 'healthcare'
  | 'industrial'
  | 'agriculture'
  | 'property'
  | '2d'
  | '3d'
  | 'motion'
  | 'assets'

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
  liveUrl?: string
  splatId?: string
  isGaussianSplat?: boolean
  pointCount?: string
  accuracy?: string
  captureMethod?: string
  location?: string
  scenePairSlug?: string
  scenePairLabel?: string
}

export const PROJECT_CATEGORIES: { id: 'all' | ProjectCategory; label: string }[] = [
  { id: 'all', label: 'Semua Proyek' },
  { id: 'marketing', label: 'Marketing & Retail' },
  { id: 'hospitality', label: 'Hospitality & Wisata' },
  { id: 'healthcare', label: 'Healthcare & Medis' },
  { id: 'industrial', label: 'Industrial & Manufaktur' },
  { id: 'agriculture', label: 'Agrikultur & Riset' },
  { id: 'property', label: 'Properti & Arsitektur' },
  { id: 'memory', label: 'Memori & Dokumenter' },
  { id: 'filmmaking', label: 'Filmmaking & VFX' },
]

export const PROJECTS: Project[] = [
  {
    slug: 'grand-glasshouse-wedding-sanctuary',
    title: 'Grand Glasshouse Wedding Sanctuary',
    client: 'Private Luxury Estate',
    category: 'memory',
    discipline: 'Memory Preservation · 3D Gaussian Splatting',
    year: '2024',
    tagline: 'Preservasi spasial 3D fotorealistik momen pernikahan dan kemewahan arsitektur kaca berkilau tanpa batasan waktu.',
    brief:
      'Dokumentasi video dan foto konvensional tidak mampu menghadirkan kembali pengalaman berdiri di dalam ruangan berhias bunga dan kaca kristal dengan skala 1:1 setelah acara selesai.',
    approach: [
      'Pemindaian spasial komprehensif menggunakan rig multi-kamera kalibrasi fotogrametri dan LiDAR terestrial saat dekorasi mencapai kesempurnaan puncak.',
      'Rekonstruksi 12.4 juta 3D Gaussian Splats untuk menangkap refraksi kaca, kilau lampu gantung, dan kedalaman susunan bunga secara akurat.',
      'Optimasi WebGL real-time 60fps untuk akses instan di smartphone, tablet, laptop, hingga headset VR spasial.',
    ],
    delivered: [
      'Rekonstruksi Spasial 3DGS (12.4M Splats)',
      'Tur Spasial WebGL Interaktif',
      'Arsip Memori Digital Abadi',
      'Preset Navigasi Kamera Sinematik',
    ],
    variant: 1,
    posterUrl: '/images/spatium/page_08_0.jpg',
    liveUrl: 'https://superspl.at/s?id=e318925e',
    splatId: 'e318925e',
    isGaussianSplat: true,
    pointCount: '12.4M Splats',
    accuracy: 'Sub-centimeter (< 8mm)',
    captureMethod: 'Terrestrial LiDAR + High-Density Photogrammetry',
    location: 'Bandung, Jawa Barat',
  },
  {
    slug: 'ruang-operasi-bedah-presisi',
    title: 'Ruang Operasi Bedah Presisi Tinggi',
    client: 'National Referral Hospital',
    category: 'healthcare',
    discipline: 'Healthcare & Medis · Clinical Spatial Digital Twin',
    year: '2024',
    tagline: 'Digital twin ruang bedah steril presisi sub-sentimeter untuk simulasi klinis dan orientasi prosedur bedah.',
    brief:
      'Ruang bedah berteknologi tinggi memerlukan sterilitas ketat 24/7, sehingga orientasi staf medis dan teknisi peralatan tidak dapat dilakukan sembarangan di lokasi fisik.',
    approach: [
      'Pemindaian laser LiDAR darat cepat tanpa sentuhan langsung pada area steril dengan kalibrasi koordinat sub-sentimeter (3mm).',
      'Pelatihan representasi medan radiansi saraf (3DGS) menghasilkan lingkungan virtual 9.8 juta splats berfidelitas tinggi.',
      'Integrasi titik inspeksi instrumen bedah, lampu operasi plafon, dan alur sirkulasi staf tanpa batas akses.',
    ],
    delivered: [
      'Model 3DGS Ruang Bedah Steril (9.8M Splats)',
      'Inspeksi Ruang WebGL Sub-3mm',
      'Aset Pelatihan Klinis Virtual',
      'Dokumentasi Arsitektur Medis',
    ],
    variant: 2,
    posterUrl: '/images/spatium/page_09_0.jpg',
    liveUrl: 'https://superspl.at/s?id=551b7432',
    splatId: '551b7432',
    isGaussianSplat: true,
    pointCount: '9.8M Splats',
    accuracy: 'Sub-centimeter (3mm)',
    captureMethod: 'Zero-Contact Laser LiDAR + Micro-Radiance Capture',
    location: 'Jakarta',
  },
  {
    slug: 'unicam-indonesia-manufaktur-presisi',
    title: 'Fasilitas Manufaktur Presisi Unicam Indonesia',
    client: 'PT Unicam Indonesia',
    category: 'industrial',
    discipline: 'Industrial & Manufaktur · Plant Digital Twin',
    year: '2024',
    tagline: 'Rekonstruksi spasial fotorealistik pabrik manufaktur mesin CNC dan lini produksi canggih untuk audit global.',
    brief:
      'Mitra internasional dari Jepang dan Eropa membutuhkan audit tata letak fasilitas dan verifikasi kapasitas mesin industri tanpa harus menempuh penerbangan jarak jauh.',
    approach: [
      'Pemetaan drone fotogrametri indoor dan pemindai LiDAR permukaan lantai industri berkecepatan tinggi.',
      'Sintesis 18.5 juta Gaussian Splats mereproduksi pantulan baja mesin CNC, tata pipa utilitas, dan koridor logistik pabrik.',
      'Platform inspeksi online terenkripsi dengan penandaan waypoint mesin dan anotasi spesifikasi operasional.',
    ],
    delivered: [
      'Digital Twin Fasilitas Pabrik (18.5M Splats)',
      'Inspeksi Jarak Jauh Audit Global',
      'Anotasi Waypoint Mesin CNC',
      'Integrasi WebGL Cloud 60fps',
    ],
    variant: 3,
    posterUrl: '/images/spatium/page_07_0.jpg',
    liveUrl: 'https://superspl.at/s?id=9c0284e8',
    splatId: '9c0284e8',
    isGaussianSplat: true,
    pointCount: '18.5M Splats',
    accuracy: 'Sub-centimeter (5mm)',
    captureMethod: 'Drone Photogrammetry + Floor LiDAR',
    location: 'Cikarang Industrial Estate, Jawa Barat',
  },
  {
    slug: 'batuna-resto-oceanfront-exterior',
    title: 'Batuna Resto Manado — Oceanfront Exterior & Deck',
    client: 'Batuna Resto & Resort',
    category: 'marketing',
    discipline: 'Marketing & Branding · Hospitality Exterior Capture',
    year: '2024',
    tagline: 'Eksplorasi spasial 3D area terbuka dan dek tepi laut Batuna Resto menghadirkan Zero Moment of Truth (ZMOT).',
    brief:
      'Pelanggan VIP dan pelancong sering ragu memesan area dek luar karena foto statis tidak mampu menangkap suasana panorama laut dan hembusan angin pantai secara nyata.',
    approach: [
      'Perekaman drone dan kamera sudut dinamis pada golden hour untuk menangkap gradasi warna matahari terbenam dan tekstur dek kayu.',
      'Pemrosesan 15.1 juta splats yang menangkap interaksi cahaya alami pada laut dan struktur atap terbuka secara fotorealistik.',
      'Penyediaan tautan beralih instan (scene-pair) langsung ke area interior restoran.',
    ],
    delivered: [
      'Model 3DGS Eksterior Tepi Laut (15.1M Splats)',
      'Scene-Pair Switcher (Eksterior ⇄ Interior)',
      'Peningkatan Konversi Reservasi ZMOT',
      'Integrasi Embed Website & Google Maps',
    ],
    variant: 1,
    posterUrl: '/images/spatium/page_01_0.jpg',
    liveUrl: 'https://superspl.at/s?id=dc1cd13b',
    splatId: 'dc1cd13b',
    isGaussianSplat: true,
    pointCount: '15.1M Splats',
    accuracy: 'Sub-centimeter (< 10mm)',
    captureMethod: 'Drone Photogrammetry + Mobile Radiance Field',
    location: 'Manado, Sulawesi Utara',
    scenePairSlug: 'batuna-resto-dining-interior',
    scenePairLabel: 'Masuk ke Interior Restoran',
  },
  {
    slug: 'batuna-resto-dining-interior',
    title: 'Batuna Resto Manado — Dining Hall & Architectural Interior',
    client: 'Batuna Resto & Resort',
    category: 'marketing',
    discipline: 'Marketing & Branding · Interior Spatial Experience',
    year: '2024',
    tagline: 'Pengalaman visual berjalan bebas di interior restoran dengan kehangatan tata cahaya kayu dan pemandangan laut lepas.',
    brief:
      'Tamu menginginkan kepastian posisi meja, jarak privasi, dan atmosfer pencahayaan ruangan sebelum mengadakan perjamuan makan malam privat.',
    approach: [
      'Pemindaian fotogrametri padat di setiap lorong meja makan dan sudut bar dengan pencahayaan interior hangat.',
      'Optimasi 11.7 juta splats mempertahankan tekstur serat kayu jati dan refleksi kaca jendela tanpa artefak visual.',
      'Tautan scene-pair untuk keluar kembali ke area dek luar ruangan dengan satu klik cepat.',
    ],
    delivered: [
      'Model 3DGS Interior Ruang Makan (11.7M Splats)',
      'Scene-Pair Switcher (Interior ⇄ Eksterior)',
      'Visualisasi Meja Reservasi Skala 1:1',
      'Akses WebGL Responsif Semua Perangkat',
    ],
    variant: 2,
    posterUrl: '/images/spatium/page_02_0.jpg',
    liveUrl: 'https://superspl.at/s?id=bd14a26a',
    splatId: 'bd14a26a',
    isGaussianSplat: true,
    pointCount: '11.7M Splats',
    accuracy: 'Sub-centimeter (5mm)',
    captureMethod: 'Handheld High-Dynamic-Range Radiance Rig',
    location: 'Manado, Sulawesi Utara',
    scenePairSlug: 'batuna-resto-oceanfront-exterior',
    scenePairLabel: 'Keluar ke Dek Tepi Laut',
  },
  {
    slug: 'kidang-nyaring-outdoor-canopy',
    title: 'Kidang Nyaring Cafe — Outdoor Canopy & Forest Garden',
    client: 'Kidang Nyaring Coffee',
    category: 'marketing',
    discipline: 'Marketing & Branding · F&B Spatial Atmosphere',
    year: '2024',
    tagline: 'Visualisasi spasial 3D suasana ngopi sejuk di bawah naungan pohon pinus dan kanopi hijau pegunungan Dago.',
    brief:
      'Kafe berkonsep alam sering kesulitan memperlihatkan luasan area duduk terbuka yang nyaman dan kontur tanah bertingkat melalui foto persegi datar.',
    approach: [
      'Pemetaan spasial dengan LiDAR darat dan fotogrametri daun pinus untuk menangkap tembusan sinar matahari (god rays).',
      'Pelatihan 13.9 juta splats yang mampu mereproduksi kerindangan pepohonan dan suasana santai terbuka.',
      'Tautan navigasi langsung menuju bar espresso di dalam ruangan.',
    ],
    delivered: [
      '3DGS Kanopi Outdoor Kafe (13.9M Splats)',
      'Scene-Pairing Eksterior & Interior',
      'Integrasi ZMOT Media Sosial & Web',
      'Navigasi Kamera Terbang Bebas',
    ],
    variant: 3,
    posterUrl: '/images/spatium/page_03_0.jpg',
    liveUrl: 'https://superspl.at/s?id=9373a4cd',
    splatId: '9373a4cd',
    isGaussianSplat: true,
    pointCount: '13.9M Splats',
    accuracy: 'Sub-centimeter (< 10mm)',
    captureMethod: 'Drone Canopy Mapping + Terrestrial Scanner',
    location: 'Dago Atas, Bandung',
    scenePairSlug: 'kidang-nyaring-espresso-interior',
    scenePairLabel: 'Masuk ke Bar Espresso Interior',
  },
  {
    slug: 'kidang-nyaring-espresso-interior',
    title: 'Kidang Nyaring Cafe — Espresso Bar & Warm Interior',
    client: 'Kidang Nyaring Coffee',
    category: 'marketing',
    discipline: 'Marketing & Branding · Artisanal Coffee Bar Capture',
    year: '2024',
    tagline: 'Eksplorasi interaktif bar espresso artisanal dan interior bernuansa rustic modern dengan pencahayaan hangat alami.',
    brief:
      'Menampilkan estetika mesin espresso kopi spesialisasi dan kehangatan interior kayu untuk menarik komunitas kopi dan pekerja jarak jauh.',
    approach: [
      'Pengambilan data medan radiansi jarak dekat (close-up) pada mesin kopi, rak seduh manual, dan tempat duduk kayu.',
      'Kompresi cerdas 8.2 juta splats menghasilkan waktu muat secepat kilat di koneksi seluler tanpa penurunan detail visual.',
      'Tautan balik cepat ke area taman luar.',
    ],
    delivered: [
      '3DGS Bar Espresso & Interior (8.2M Splats)',
      'Scene-Pairing Interior & Outdoor',
      'Fast-Loading Mobile WebGL',
      'Anotasi Menu & Peralatan Kopi',
    ],
    variant: 1,
    posterUrl: '/images/spatium/page_04_0.jpg',
    liveUrl: 'https://superspl.at/s?id=5d7b94aa',
    splatId: '5d7b94aa',
    isGaussianSplat: true,
    pointCount: '8.2M Splats',
    accuracy: 'Sub-centimeter (4mm)',
    captureMethod: 'Mobile High-Resolution Radiance Capture',
    location: 'Dago Atas, Bandung',
    scenePairSlug: 'kidang-nyaring-outdoor-canopy',
    scenePairLabel: 'Keluar ke Area Kanopi Terbuka',
  },
  {
    slug: 'greenhouse-anggrek-tropis-presisi',
    title: 'Greenhouse Anggrek Tropis Presisi Tinggi',
    client: 'Flora Botanica Nusantara',
    category: 'agriculture',
    discipline: 'Agrikultur & Riset · Precision Horticulture Twin',
    year: '2024',
    tagline: 'Kembaran digital greenhouse anggrek dengan kerapatan mikro untuk inspeksi agrikultur dan pemantauan botani.',
    brief:
      'Periset botani dan pengelola agribisnis membutuhkan catatan spasial 3D periodik untuk memantau pertumbuhan vegetatif dan sistem sprinkler kabut mikro.',
    approach: [
      'Perekaman multi-spektral dan fotogrametri jarak mikro di antara deretan pot anggrek dan atap peneduh greenhouse.',
      'Sintesis 16.3 juta Gaussian Splats mereproduksi detail urat daun, kelopak bunga, dan instalasi pipa fertigasi secara tajam.',
      'Penyajian antarmuka WebGL dengan alat ukur jarak digital untuk evaluasi pertumbuhan tanaman.',
    ],
    delivered: [
      'Digital Twin Greenhouse Botanis (16.3M Splats)',
      'Dokumentasi Spasial Siklus Pertumbuhan',
      'Akurasi Sub-5mm untuk Analisis Agrikultur',
      'Viewer WebGL Interaktif Riset Jarak Jauh',
    ],
    variant: 2,
    posterUrl: '/images/spatium/page_05_0.jpg',
    liveUrl: 'https://superspl.at/s?id=b8291451',
    splatId: 'b8291451',
    isGaussianSplat: true,
    pointCount: '16.3M Splats',
    accuracy: 'Sub-centimeter (< 5mm)',
    captureMethod: 'High-Density Macro Photogrammetry + LiDAR',
    location: 'Lembang, Jawa Barat',
  },
  {
    slug: 'apartemen-gateway-pasteur-suite',
    title: 'Apartemen Gateway Pasteur Bandung — Residential Suite',
    client: 'Gateway Pasteur Property',
    category: 'property',
    discipline: 'Properti & Arsitektur · Real Estate Reality Walkthrough',
    year: '2024',
    tagline: 'Walkthrough spasial 3D apartemen modern skala 1:1 tanpa rekayasa distorsi lensa wide-angle 2D.',
    brief:
      'Banyak calon pembeli properti merasa tertipu oleh foto wide-angle 2D yang membuat ruangan terlihat luas semu, memicu ketidakpercayaan saat serah terima unit.',
    approach: [
      'Pemindaian LiDAR presisi tinggi di setiap sudut ruang tamu, dapur, kamar tidur utama, dan balkon.',
      'Rekonstruksi 10.5 juta splats menghasilkan visual fotorealistik sejati dengan proporsi dimensi fisik akurat 100%.',
      'Fitur jalan bebas (free walk) dan sudut pandang mata (eye-level view) yang memungkinkan pembeli mengecek tata letak perabot nyata.',
    ],
    delivered: [
      '3DGS Walkthrough Unit Hunian (10.5M Splats)',
      'Verifikasi Dimensi Skala 1:1 Sejati',
      'Peningkatan Trust & Kecepatan Closing Properti',
      'Kompatibel Headset VR & Layar Sentuh',
    ],
    variant: 3,
    posterUrl: '/images/spatium/page_06_0.jpg',
    liveUrl: 'https://superspl.at/s?id=e9d83435',
    splatId: 'e9d83435',
    isGaussianSplat: true,
    pointCount: '10.5M Splats',
    accuracy: 'Sub-centimeter (5mm)',
    captureMethod: 'Terrestrial LiDAR Scanner + Ultra-HD Photogrammetry',
    location: 'Pasteur, Bandung',
  },
  {
    slug: 'aston-bogor-executive-suite',
    title: 'Aston Bogor Hotel — Executive Suite Double Bedroom',
    client: 'Aston Hotels & Resorts',
    category: 'hospitality',
    discipline: 'Hospitality & Wisata · Luxury Hotel Reality Showcase',
    year: '2024',
    tagline: 'Tur spasial fotorealistik kamar suite eksekutif dengan detail tekstur linen dan pencahayaan alami untuk konversi direct-booking.',
    brief:
      'Hotel bintang empat bersaing ketat memperebutkan tamu bisnis dan keluarga; pengalaman tur virtual konvensional 360 bola sering terlihat terdistorsi dan berkualitas rendah.',
    approach: [
      'Perekaman radiansi 3DGS berkecepatan tinggi merekam tekstur kain ranjang, pantulan marmer kamar mandi, dan pemandangan Gunung Salak dari jendela.',
      'Pengolahan 9.1 juta splats yang menghadirkan transisi gerakan mulus 60 FPS tanpa lompatan titik bola 360 yang kaku.',
      'Tombol call-to-action langsung ke sistem pemesanan resmi hotel untuk mendongkrak margin tanpa potongan OTA.',
    ],
    delivered: [
      '3DGS Kamar Suite Mewah (9.1M Splats)',
      'Navigasi Kamera Berjalan Mulus 60 FPS',
      'Peningkatan Direct-Booking Hotel',
      'Embed Siap Pakai di Web Resmi & Portal Promosi',
    ],
    variant: 1,
    posterUrl: '/images/spatium/page_10_0.jpg',
    liveUrl: 'https://superspl.at/s?id=26a6709a',
    splatId: '26a6709a',
    isGaussianSplat: true,
    pointCount: '9.1M Splats',
    accuracy: 'Sub-centimeter (4mm)',
    captureMethod: 'Multi-Exposure Radiance Capture + LiDAR Point Grid',
    location: 'Bogor, Jawa Barat',
  },
]

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug)
}

export function mapProjectCategory(raw: unknown): ProjectCategoryValue {
  if (typeof raw !== 'string') return 'unknown'
  const normalized = raw.trim().toLowerCase()
  if (normalized.includes('filmmak') || normalized.includes('vfx') || normalized.includes('cinema')) return 'filmmaking'
  if (normalized.includes('market') || normalized.includes('brand') || normalized.includes('retail') || normalized.includes('food') || normalized.includes('resto') || normalized.includes('cafe')) return 'marketing'
  if (normalized.includes('entertain') || normalized.includes('install') || normalized.includes('exhibit')) return 'entertainment'
  if (normalized.includes('memor') || normalized.includes('docu') || normalized.includes('heritage') || normalized.includes('wed')) return 'memory'
  if (normalized.includes('hospit') || normalized.includes('hotel') || normalized.includes('resort')) return 'hospitality'
  if (normalized.includes('health') || normalized.includes('medic') || normalized.includes('klinis') || normalized.includes('bedah')) return 'healthcare'
  if (normalized.includes('indust') || normalized.includes('manufak') || normalized.includes('plant') || normalized.includes('cnc')) return 'industrial'
  if (normalized.includes('agri') || normalized.includes('horti') || normalized.includes('farm') || normalized.includes('tani')) return 'agriculture'
  if (normalized.includes('prop') || normalized.includes('estate') || normalized.includes('arsitek') || normalized.includes('apart')) return 'property'
  if (normalized === '2d' || normalized.includes('2d')) return '2d'
  if (normalized === '3d' || normalized.includes('3d')) return '3d'
  if (normalized === 'motion' || normalized.includes('motion')) return 'motion'
  if (normalized === 'assets' || normalized.includes('asset') || normalized.includes('ai')) return 'assets'
  return 'unknown'
}
