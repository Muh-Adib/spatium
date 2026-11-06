export type ServiceVisual = 'filmmaking' | 'marketing' | 'entertainment' | 'memory' | '2d' | '3d' | 'motion' | 'assets'

export type Capability = { title: string; description: string }

export type Service = {
  slug: string
  index: string
  name: string
  shortName: string
  tagline: string
  summary: string
  metaDescription: string
  intro: string[]
  capabilities: Capability[]
  deliverables: string[]
  tools: string[]
  visual: ServiceVisual
  /** CSS colour token used for this discipline's accent. */
  accent: string
  faqs: { q: string; a: string }[]
  related: { label: string; to: string }[]
}

export const SERVICES: Service[] = [
  {
    slug: 'filmmaking-vfx',
    index: '01',
    name: 'Filmmaking & VFX',
    shortName: 'Filmmaking',
    tagline: 'Virtual scouting, set reconstruction, and camera precision before the first take.',
    summary:
      'Rekonstruksi lokasi syuting fotorealistik, pre-visualization (Previz), techviz, dan supervisi on-site untuk sutradara, sinematografer, dan tim visual effects.',
    metaDescription:
      'Layanan spasial Filmmaking & VFX dari SPATIUM: Set reconstruction presisi 3DGS, Pre-visualization (Previz), Virtual Scouting lokasi, dan integrasi kamera Unreal Engine untuk produksi film.',
    intro: [
      'Produksi film modern tidak lagi bergantung pada spekulasi lokasi atau pemborosan hari syuting akibat ketidaktahuan sudut lensa kamera. Dengan pemindaian spasial LiDAR dan 3D Gaussian Splatting, sutradara dan DoP dapat menjelajahi lokasi syuting nyata secara virtual berminggu-minggu sebelum kru tiba.',
      'Pipeline Spatium merekonstruksi set fisik dengan akurasi sub-sentimeter ke dalam ruang digital, memungkinkan line-up kamera virtual, simulasi pencahayaan matahari, hingga penggabungan visual effects (VFX) tanpa tebak-tebakan.',
    ],
    capabilities: [
      {
        title: 'Virtual Scouting',
        description: 'Eksplorasi lokasi syuting jarak jauh dengan sudut pandang kamera nyata, fokal lensa sinema, dan pergerakan dolly/crane virtual.',
      },
      {
        title: 'Set Reconstruction',
        description: 'Pemindaian set fisik berkecepatan tinggi menjadi aset 3D fidelitas tinggi untuk kontinuitas artistik dan perpanjangan set virtual (set extension).',
      },
      {
        title: 'Pre-visualization (Previz) & Techviz',
        description: 'Penyusunan koreografi kamera, pergerakan aktor, dan kalkulasi rig teknis di atas geometri lokasi yang terkalibrasi secara matematis.',
      },
      {
        title: 'On-Site Supervision & Tracking Alignment',
        description: 'Penyelarasan koordinat kamera fisik di lapangan dengan environment digital untuk mempermudah pipeline matchmoving dan compositing VFX.',
      },
      {
        title: 'Lighting & Sun Position Simulation',
        description: 'Simulasi lintasan matahari dan bayangan arsitektural sepanjang hari untuk menentukan waktu pengambilan gambar (golden hour) yang optimal.',
      },
      {
        title: 'Real-time LED Volume Integration',
        description: 'Optimasi background medan radiansi untuk penayangan di dinding panggung virtual produksi LED secara parallax-correct.',
      },
    ],
    deliverables: [
      'Digital Twin Lokasi Syuting 3DGS (60 FPS WebGL)',
      'Aset Geometri Terkalibrasi (OBJ / FBX / USDZ)',
      'Dokumen Techviz & Diagram Line-up Kamera Sinema',
      'Lingkungan Virtual Unreal Engine / Blender Siap Pakai',
      'Peta Kedalaman dan Koordinat Survei Sub-sentimeter',
    ],
    tools: ['3D Gaussian Splatting', 'Unreal Engine 5', 'Blender', 'RealityCapture', 'Terrestrial LiDAR Scanner'],
    visual: 'filmmaking',
    accent: '#00E5FF',
    faqs: [
      {
        q: 'Seberapa akurat rekonstruksi lokasi untuk kebutuhan kamera sinema?',
        a: 'Akurasi geometri kami mencapai sub-sentimeter (< 5mm), sehingga fokal lensa 24mm, 35mm, atau 50mm pada kamera virtual akan menghasilkan bidang pandang (FOV) dan perspektif yang 100% identik dengan kamera sinema nyata di lapangan.',
      },
      {
        q: 'Apakah aset bisa langsung dibuka di Unreal Engine atau Blender?',
        a: 'Tentu. Kami menyediakan aset dalam format USDZ, FBX, OBJ teroptimasi dan plugin Gaussian Splatting native untuk Unreal Engine dan Blender.',
      },
      {
        q: 'Berapa lama proses pemindaian lokasi di lapangan?',
        a: 'Untuk area set berukuran sedang (500–1.500 m²), pemindaian lapangan menggunakan LiDAR terestrial dan drone berlangsung antara 2 hingga 4 jam tanpa mengganggu persiapan kru lain.',
      },
    ],
    related: [
      { label: 'Lihat Proyek Ruang Operasi Medis', to: '/portfolio/ruang-operasi-bedah-presisi' },
      { label: 'Eksplorasi Marketing & Branding', to: '/services/marketing-branding' },
      { label: 'Konsultasi Pra-Produksi Film', to: '/contact' },
    ],
  },
  {
    slug: 'marketing-branding',
    index: '02',
    name: 'Marketing & Branding',
    shortName: 'Marketing',
    tagline: 'Zero Moment of Truth: Turn passive viewers into experiential buyers.',
    summary:
      'Tur spasial fotorealistik, display interaktif 3D, dan integrasi Google Maps digital twin yang memicu keyakinan beli seketika (Zero Moment of Truth).',
    metaDescription:
      'Solusi Marketing & Branding SPATIUM: Tur spasial 3D Gaussian Splatting untuk F&B, hotel, ritel, dan properti. Meningkatkan direct-booking dan konversi penjualan dengan pengalaman berjalan nyata.',
    intro: [
      'Di era digital saat ini, konsumen tidak lagi percaya pada foto 2D bersudut lebar yang terdistorsi atau video promosi yang penuh rekayasa. Mereka ingin memverifikasi sendiri sebelum membeli — fenomena ini dikenal sebagai Zero Moment of Truth (ZMOT).',
      'SPATIUM menghadirkan "Walkable Images": ruang bisnis Anda diabadikan ke dalam replika digital fotorealistik 3D yang dapat dijelajahi langsung dari browser ponsel atau laptop pelanggan. Mereka dapat berjalan, melihat detail menu/meja, dan merasakan atmosfer tempat Anda seolah-olah sudah berada di sana.',
    ],
    capabilities: [
      {
        title: 'Zero Moment of Truth (ZMOT) Experience',
        description: 'Memberikan kepastian ruang dan suasana nyata kepada calon pelanggan sebelum mereka memutuskan berkunjung atau bertransaksi.',
      },
      {
        title: '3D Interactive Spatial Displays',
        description: 'Tampilan interaktif WebGL ringan dan mulus 60 FPS di situs web tanpa instalasi aplikasi pihak ketiga.',
      },
      {
        title: 'Multi-Scene Pairing (Exterior & Interior)',
        description: 'Navigasi instan menghubungkan area luar ruangan dan dalam ruangan dengan satu sentuhan jari.',
      },
      {
        title: 'Interactive Hotspots & Direct Booking',
        description: 'Penyematan tombol reservasi, katalog produk, dan detail menu langsung di titik-titik strategis dalam ruang virtual.',
      },
      {
        title: 'Google Maps & Spatial SEO Integration',
        description: 'Optimalisasi pencarian lokal dengan visualisasi digital twin yang mendongkrak profil bisnis Google Maps.',
      },
      {
        title: 'Cross-Device Responsiveness',
        description: 'Didesain adaptif untuk layar iPhone, Android, tablet, layar sentuh kios pameran, hingga headset Vision Pro.',
      },
    ],
    deliverables: [
      'Embed WebGL Tur Spasial Responsif',
      'Paket Aset Scene-Pairing Eksterior & Interior',
      'Integrasi Tombol CTA Reservasi / Pembelian',
      'Aset Konten Media Sosial Video Loop 4K',
      'Laporan Analitik Interaksi Pengunjung Spasial',
    ],
    tools: ['SuperSplat WebGL', 'Gaussian Splatting', 'Drone Photogrammetry', 'LiDAR Sensors', 'Three.js'],
    visual: 'marketing',
    accent: '#00E5FF',
    faqs: [
      {
        q: 'Bagaimana cara menaruh tur 3D ini ke website kami?',
        a: 'Sangat mudah. Kami menyediakan satu baris kode embed iframe yang ringan, atau Anda dapat meng-host langsung bundle HTML dan asetnya di server Anda menggunakan fitur Tour Upload SPATIUM.',
      },
      {
        q: 'Apakah tur ini berat dibuka di HP pelanggan?',
        a: 'Tidak. Pipeline kompresi cerdas kami mengoptimalkan splats hingga ukuran berkas minimal, memuat dalam hitungan 1-2 detik pada koneksi 4G seluler.',
      },
      {
        q: 'Berapa kenaikan konversi yang biasa dialami klien?',
        a: 'Klien kami di sektor F&B dan hotel mencatat kenaikan reservasi langsung antara 34% hingga 78% setelah pelanggan dapat menjelajahi ruangan secara 3D.',
      },
    ],
    related: [
      { label: 'Lihat Batuna Resto Manado', to: '/portfolio/batuna-resto-oceanfront-exterior' },
      { label: 'Lihat Kidang Nyaring Cafe', to: '/portfolio/kidang-nyaring-outdoor-canopy' },
      { label: 'Konsultasi Brand & Space', to: '/contact' },
    ],
  },
  {
    slug: 'entertainment-installation',
    index: '03',
    name: 'Entertainment & Installation',
    shortName: 'Installation',
    tagline: 'Physical-digital convergence for exhibitions, projection mapping, and immersive arts.',
    summary:
      'Kalibrasi spasial presisi untuk instalasi seni imersif, projection mapping arsitektural, dan pengalaman interaktif berbasis lokasi (Location-Based Entertainment).',
    metaDescription:
      'Layanan Entertainment & Installation SPATIUM: Kalibrasi projection mapping, environment spasial AR/VR, dan instalasi interaktif museum serta galeri pameran seni digital.',
    intro: [
      'Menggabungkan cahaya digital ke atas arsitektur fisik membutuhkan pemetaan ruang yang bebas dari kesalahan geometris. Deviasi 1 sentimeter saja pada model 3D dapat merusak fokus dan ilusi kedalaman projection mapping.',
      'SPATIUM menyediakan digital twin akurasi milimeter untuk gedung bersejarah, arena pameran, museum, dan instalasi festival. Kreator konten dapat langsung menganimasikan visual di atas model digital yang 100% kongruen dengan fisik bangunan nyata.',
    ],
    capabilities: [
      {
        title: 'Projection Mapping Calibration',
        description: 'Pemindaian laser fasad gedung dan interior melengkung untuk menghasilkan template UV mapping akurat bagi tim motion graphic.',
      },
      {
        title: 'Location-Based AR/VR Experiences',
        description: 'Penyelarasan konten augmented reality dengan objek nyata di galeri, pameran seni, atau taman hiburan tanpa pergeseran (drift).',
      },
      {
        title: 'Virtual Exhibition Spaces',
        description: 'Menciptakan kembali pameran seni atau museum fisik ke dalam ruang maya yang dapat diakses oleh penikmat seni di seluruh dunia.',
      },
      {
        title: 'Spatial Audio Integration',
        description: 'Pemetaan akustik ruang untuk sinkronisasi tata suara surround 3D dengan visual interaktif.',
      },
      {
        title: 'Interactive Kinetic Sensors',
        description: 'Integrasi sistem sensor gerak pengunjung untuk memicu respons visual dinamis pada dinding instalasi.',
      },
    ],
    deliverables: [
      'Model 3D Mesh Fasad Bangunan (Akurasi Milimeter)',
      'Template UV Map dan Panduan Proyektor',
      'Lingkungan Virtual WebGL untuk Pameran Online',
      'Dokumentasi Spasial Arsip Pameran Abadi',
    ],
    tools: ['Terrestrial LiDAR', '3D Photogrammetry', 'TouchDesigner', 'Unreal Engine', 'MadMapper'],
    visual: 'entertainment',
    accent: '#00E5FF',
    faqs: [
      {
        q: 'Apakah bisa memindai gedung berketinggian lebih dari 20 meter?',
        a: 'Bisa. Kami mengombinasikan drone photogrammetry bersertifikasi dan LiDAR darat jarak jauh untuk memindai bangunan hingga puluhan lantai dengan presisi tinggi.',
      },
      {
        q: 'Apakah template UV mapping siap diimpor ke software mapping seperti MadMapper atau Resolume?',
        a: 'Ya, kami menghasilkan file mesh 3D yang sudah di-unwrap dengan layout UV rapi, siap untuk dihubungkan ke proyektor di lokasi.',
      },
    ],
    related: [
      { label: 'Lihat Unicam Industrial Plant', to: '/portfolio/unicam-indonesia-manufaktur-presisi' },
      { label: 'Jelajahi Memory & Documentary', to: '/services/memory-documentary' },
      { label: 'Diskusikan Proyek Instalasi', to: '/contact' },
    ],
  },
  {
    slug: 'memory-documentary',
    index: '04',
    name: 'Memory & Documentary',
    shortName: 'Memory',
    tagline: 'Preserving precious places and moments across generations.',
    summary:
      'Preservasi spasial 3D fotorealistik pernikahan mewah, situs cagar budaya, dan rumah pusaka keluarga sebelum berubah termakan zaman.',
    metaDescription:
      'Layanan Memory & Documentary SPATIUM: Preservasi spasial 3D momen pernikahan mewah, digital twin cagar budaya bersejarah, dan arsip properti keluarga abadi.',
    intro: [
      'Waktu terus berjalan, dan tempat-tempat terpenting dalam hidup kita tidak selamanya berada dalam wujud yang sama. Rumah masa kecil akan direnovasi, dekorasi pesta pernikahan impian akan dibongkar esok pagi, dan bangunan bersejarah rentan mengalami degradasi alamiah.',
      'Melalui teknologi 3D Gaussian Splatting, SPATIUM mengabadikan ruang dan atmosfer emosional secara abadi. Anda tidak hanya melihat foto atau menonton rekaman video masa lalu; Anda dapat "masuk kembali" dan berjalan di dalam memori tersebut bersama anak-cucu kelak.',
    ],
    capabilities: [
      {
        title: 'Immersive Wedding Sanctuary Memory',
        description: 'Mengabadikan dekorasi pernikahan megah, susunan bunga, dan tata cahaya resepsi sebelum dibongkar.',
      },
      {
        title: 'Cultural Heritage Digital Twins',
        description: 'Arsip 3D presisi tinggi untuk candi, keraton, museum, dan situs sejarah guna kepentingan edukasi dan restorasi masa depan.',
      },
      {
        title: 'Family Estate & Ancestral Home Archiving',
        description: 'Dokumentasi ruang hunian keluarga lintas generasi dengan kehangatan detail perabot dan interior asli.',
      },
      {
        title: 'Walkable Legacy Archives',
        description: 'Pengalaman interaktif yang dapat diwariskan dalam format file digital mandiri yang tahan uji perubahan teknologi.',
      },
      {
        title: 'Spatial Headset Ready (VR / Vision Pro)',
        description: 'Kompatibilitas penuh dengan kacamata spasial untuk pengalaman kembali ke masa lalu yang mengharukan.',
      },
    ],
    deliverables: [
      'Model 3DGS Master Memori Abadi',
      'Tur Spasial WebGL Privat Berpassword',
      'File Offline Eksekutif untuk Arsip Keluarga',
      'Klip Video Loop Sinematik Kamera Spasial 4K',
    ],
    tools: ['3D Gaussian Splatting', 'HDR Photogrammetry', 'LiDAR Scanner', 'VR Spatial Viewers'],
    visual: 'memory',
    accent: '#00E5FF',
    faqs: [
      {
        q: 'Apakah data arsip memori keluarga kami terjamin privasinya?',
        a: 'Ya, privasi adalah prioritas tertinggi kami. Tur memori dapat dilindungi kata sandi pribadi atau diserahkan secara luring (offline storage) tanpa diunggah ke domain publik.',
      },
      {
        q: 'Kapan waktu terbaik memindai dekorasi pernikahan?',
        a: 'Waktu ideal adalah 1-2 jam sebelum akad/pemberkatan dimulai, saat dekorasi dan pencahayaan telah selesai 100% dan ruangan dalam kondisi prima.',
      },
    ],
    related: [
      { label: 'Lihat Grand Glasshouse Wedding Sanctuary', to: '/portfolio/grand-glasshouse-wedding-sanctuary' },
      { label: 'Lihat Gateway Pasteur Residence', to: '/portfolio/apartemen-gateway-pasteur-suite' },
      { label: 'Konsultasi Preservasi Memori', to: '/contact' },
    ],
  },
]

export const CORE_SERVICES = SERVICES.slice(0, 4)

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug)
}
