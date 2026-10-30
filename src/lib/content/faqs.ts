/**
 * SEGIA Centralized FAQ Content Service (Lane 8 / L8-T3)
 * Provides centralized deterministic retrieval for FAQs across homepage, services,
 * portfolio, and location landing pages.
 */

export interface FAQItem {
  question: string
  answer: string
}

export const SEED_FAQS: Record<'homepage' | 'services' | 'portfolio', FAQItem[]> = {
  homepage: [
    {
      question: 'Berapa lama proses pengerjaan website atau aplikasi di SegiaTech?',
      answer:
        'Waktu pengerjaan bervariasi tergantung kompleksitas sistem. Untuk landing page atau website profil korporat umumnya memakan waktu 2–3 minggu. Sedangkan untuk aplikasi web kustom, sistem PMB, atau CRM enterprise biasanya membutuhkan waktu 6–10 minggu dengan metode pengembangan agile bertahap.',
    },
    {
      question: 'Apakah website yang dibuat sudah ramah SEO dan mudah terindeks Google?',
      answer:
        'Ya, seluruh website dan aplikasi dibangun dengan prinsip SEO-first sejak awal arsitektur. Kami mengimplementasikan Next.js server-side rendering, struktur heading semantik, schema JSON-LD terverifikasi, canonical tags otomatis, performa Core Web Vitals tinggi, dan peta situs XML otomatis.',
    },
    {
      question: 'Apakah SegiaTech menyediakan layanan pemeliharaan (maintenance) berkala?',
      answer:
        'Tentu. Setiap proyek kami sertakan garansi pasca-peluncuran, pembaruan keamanan, backup data otomatis, serta opsi SLA maintenance bulanan untuk penambahan fitur dan pemantauan performa server 24/7.',
    },
    {
      question: 'Teknologi apa saja yang menjadi keunggulan utama SegiaTech?',
      answer:
        'Kami berspesialisasi dalam ekosistem modern: Next.js (App Router), React, TypeScript, Tailwind CSS, PostgreSQL via Prisma ORM, GSAP untuk animasi interaktif, serta infrastruktur cloud berbasis Docker.',
    },
    {
      question: 'Bagaimana jika bisnis kami belum memiliki gambaran teknis yang matang?',
      answer:
        'Anda dapat langsung mencoba fitur "Interactive Solution Builder" di website kami untuk meracik konsep ruang dan fitur interaktif tanpa batasan templat, atau mendiskusikan rancangan blueprint tersebut bersama tim konsultan kami via WhatsApp.',
    },
  ],
  services: [
    {
      question: 'Berapa lama proses pembuatan website profil korporat dan portal institusi?',
      answer:
        'Untuk website profil korporat standar atau landing page konversi tinggi, proses pengerjaan memakan waktu antara 2 hingga 3 minggu. Sementara untuk portal institusi kompleks atau platform akademik skala kampus, waktu pengerjaan berkisar 4 hingga 8 minggu mencakup fase discovery arsitektur, riset pengguna, wireframing Figma, pengkodean arsitektur Next.js 16 SSR, hingga uji beban (load testing) dan optimasi Technical SEO menyeluruh.',
    },
    {
      question: 'Apakah SegiaTech menyediakan layanan pemeliharaan (maintenance) server & software?',
      answer:
        'Ya, seluruh solusi rekayasa software dan website kami didukung opsi Service Level Agreement (SLA) pemeliharaan berkala. Cakupan layanan mencakup pemantauan uptime 99.9%, backup otomatis database terenkripsi, pembaruan patch keamanan sistem operasi & dependensi, perbaikan bug teknis, audit Core Web Vitals berkala, serta konsultasi optimasi query data.',
    },
    {
      question: 'Bagaimana alur kerja perancangan hardware untuk Interactive Wall Projection & 3D Aquarium?',
      answer:
        'Kami menyediakan solusi turnkey end-to-end: mulai dari kalkulasi throw ratio lensa dan lumens proyektor, pemilihan spesifikasi mini-PC GPU industri, pengadaan dan kalibrasi sensor LiDAR/depth camera sentuh milidetik (<15ms latency), hingga perakitan stasiun scanner kertas fisik. Seluruh software dikonfigurasi untuk berjalan stabil secara offline (on-premise) tanpa ketergantungan koneksi internet.',
    },
    {
      question: 'Apakah sistem software yang dibangun SegiaTech dapat diintegrasikan dengan API internal perusahaan?',
      answer:
        'Tentu. Seluruh arsitektur software dan portal kami dirancang dengan pendekatan API-first (RESTful API & Webhooks aman). Kami berpengalaman mengintegrasikan sistem dengan berbagai pihak ketiga seperti payment gateway (Midtrans, Xendit, QRIS), WhatsApp Official Business API, ERP SAP/Oracle, hingga sistem informasi akademik (SIAKAD) perguruan tinggi.',
    },
    {
      question: 'Bagaimana perlindungan hak cipta dan kepemilikan source code proyek?',
      answer:
        'Transparansi dan kepemilikan penuh adalah prinsip kerja SegiaTech. Kami selalu menandatangani Non-Disclosure Agreement (NDA) resmi sebelum proyek dimulai. Setelah serah terima dan termin pembayaran selesai, seluruh hak cipta intelektual (IP), repositori kode sumber (source code), dan aset desain diserahkan 100% kepada pihak klien tanpa adanya royalti atau biaya sewa lisensi tahunan tersembunyi.',
    },
  ],
  portfolio: [
    {
      question: 'Bagaimana tahapan pengerjaan proyek dari konsep hingga rilis?',
      answer:
        'Setiap proyek diawali dengan tahap Discovery & Arsitektur untuk membedah proses bisnis, kebutuhan pengguna, dan skema data. Selanjutnya, tim merancang wireframe visual dan prototype interaktif sebelum penulisan kode dimulai. Pengerjaan dilakukan secara bertahap (agile sprint), diakhiri dengan uji performa Core Web Vitals, audit keamanan, dan peluncuran produksi tanpa downtime.',
    },
    {
      question: 'Apakah SegiaTech menyediakan layanan maintenance sistem dan web?',
      answer:
        'Ya, seluruh proyek yang kami kerjakan dilengkapi dengan masa garansi pasca-peluncuran dan opsi Service Level Agreement (SLA) berkelanjutan. Layanan maintenance mencakup pemantauan uptime 99.9%, backup database berkala terenkripsi, pembaruan patch keamanan sistem operasi & dependensi, serta optimalisasi performa berkala.',
    },
    {
      question: 'Bagaimana skema integrasi hardware sensorik dengan software interaktif?',
      answer:
        'Untuk solusi imersif seperti Interactive 3D Aquarium (Scan-to-Swim) maupun Interactive Wall Projection Mapping, kami menyediakan instalasi terpadu antara perangkat lunak dan keras. Tim kami mengonfigurasi stasiun optical scanner berkecepatan tinggi, sensor LiDAR sentuh akurasi milidetik (<15ms latency), proyektor resolusi tinggi, serta mini-PC industri berbasis WebGL/Three.js yang mampu beroperasi nonstop dengan stabil.',
    },
    {
      question: 'Apakah aplikasi dan website yang dibangun sudah ramah SEO dan skalabel?',
      answer:
        'Tentu. Fondasi aplikasi publik dibangun di atas Next.js 16 App Router dengan kombinasi Static Site Generation (SSG) dan Server-Side Rendering (SSR). Seluruh halaman otomatis dilengkapi metadata dinamis, struktur data JSON-LD (Schema.org), sitemap XML otomatis, serta preservasi URL lama (301 redirect map) untuk menjaga dan meningkatkan peringkat di mesin pencari Google.',
    },
    {
      question: 'Bagaimana perlindungan hak cipta source code dan kerahasiaan (NDA) proyek kami?',
      answer:
        'Kerahasiaan data dan keunggulan kompetitif klien adalah prioritas utama kami. Kami selalu menandatangani Non-Disclosure Agreement (NDA) resmi sebelum proyek dieksekusi. Setelah serah terima dan termin pembayaran diselesaikan, seluruh hak cipta source code, repositori, dan aset digital diserahkan 100% kepada pihak klien.',
    },
  ],
}

/**
 * Synchronous fallback retrieval (client components and build utilities)
 */
export function getFaqsByScopeSync(
  scope: 'homepage' | 'services' | 'portfolio' | 'city',
  context?: { cityName?: string }
): FAQItem[] {
  if (scope === 'city') {
    const cityName = context?.cityName || 'Indonesia'
    return [
      {
        question: `Berapa lama estimasi waktu pembuatan website di wilayah ${cityName}?`,
        answer: `Waktu pengerjaan umumnya berkisar antara 2 hingga 4 minggu untuk website profil perusahaan (Company Profile) dan 4 hingga 8 minggu untuk platform korporat atau sistem aplikasi khusus. Jadwal disesuaikan dengan kompleksitas fitur dan kesiapan materi dari klien.`,
      },
      {
        question: `Apa saja cakupan layanan dalam paket pembuatan website SegiaTech?`,
        answer: `Setiap proyek mencakup arsitektur modern Next.js, desain UI/UX bespoke responsif (mobile, tablet, desktop), optimasi SEO teknis & On-Page, integrasi Google Search Console, keamanan SSL, panduan manajemen konten, serta garansi pemeliharaan teknis.`,
      },
      {
        question: `Apakah website yang dibuat dijamin teroptimasi untuk pencarian Google di ${cityName}?`,
        answer: `Ya, kami menerapkan standar Technical SEO tingkat lanjut termasuk implementasi Schema.org (LocalBusiness / Organization), Open Graph tags, canonical URLs, dan penataan kata kunci wilayah agar website Anda memiliki otoritas tinggi di hasil pencarian Google wilayah ${cityName}.`,
      },
      {
        question: `Bagaimana alur komunikasi dan pelaporan progress selama proyek berjalan?`,
        answer: `Kami mengedepankan transparansi penuh dengan menyediakan akses staging server (preview langsung), komunikasi rutin melalui WhatsApp/Google Meet, serta laporan berkala di setiap fase (desain, pengembangan frontend, integrasi database, hingga peluncuran).`,
      },
      {
        question: `Apakah website ramah perangkat mobile dan memiliki kecepatan tinggi?`,
        answer: `Seluruh website yang kami kembangkan dirancang dengan pendekatan mobile-first dan dioptimalkan untuk lulus audit Google Core Web Vitals (LCP < 1.5 detik), menjamin pengalaman penjelajahan yang instan dan mulus bagi pengunjung Anda.`,
      },
    ]
  }

  return SEED_FAQS[scope] || []
}
