/**
 * Default Solution Catalog & Config Data
 *
 * Provides static defaults and type-safe data for Solution Finder and
 * catalog fallback when database config is not yet loaded.
 * All dynamic strings use serialized templates ({industry}, {goal}, {needs}).
 */

import type {
  BusinessGoal,
  Industry,
  DynamicQuestion,
  SolutionTaxonomyItemStored,
} from './scoring'

export const DEFAULT_BUSINESS_GOALS: BusinessGoal[] = [
  {
    "id": "increase_sales",
    "title": "Meningkatkan Penjualan",
    "description": "Mendapatkan lebih banyak pelanggan baru dan mempermudah proses transaksi.",
    "bulletPoints": [
      "Mendapatkan lebih banyak pelanggan baru",
      "Meningkatkan konversi penjualan (conversion rate)",
      "Mempermudah alur pemesanan dan pembayaran"
    ],
    "iconName": "TrendingUp"
  },
  {
    "id": "build_brand",
    "title": "Membangun Brand & Kredibilitas",
    "description": "Meningkatkan reputasi dan kepercayaan publik terhadap institusi atau merek Anda.",
    "bulletPoints": [
      "Membangun reputasi dan trust yang kuat",
      "Menampilkan portofolio, legalitas, dan pencapaian",
      "Memiliki identitas visual digital yang profesional"
    ],
    "iconName": "ShieldCheck"
  },
  {
    "id": "digitalize_business",
    "title": "Mendigitalisasi Bisnis",
    "description": "Mengubah proses manual menjadi sistem terintegrasi yang rapi dan terukur.",
    "bulletPoints": [
      "Mengganti pencatatan manual/kertas ke sistem digital",
      "Mengelola data pelanggan dan operasional lebih tertib",
      "Menghubungkan layanan agar dapat diakses dari mana saja"
    ],
    "iconName": "Layers"
  },
  {
    "id": "automate_workflow",
    "title": "Mengotomatiskan Proses Kerja",
    "description": "Mengurangi beban kerja repetitif dan menghubungkan alur kerja antar tim.",
    "bulletPoints": [
      "Mengurangi pekerjaan manual yang menyita waktu",
      "Mengotomatiskan alur verifikasi dan persetujuan",
      "Menghubungkan data antar cabang atau departemen"
    ],
    "iconName": "Cpu"
  },
  {
    "id": "digital_presence",
    "title": "Meningkatkan Kehadiran Digital",
    "description": "Memiliki website modern berkecepatan tinggi yang mudah ditemukan di Google.",
    "bulletPoints": [
      "Website performa tinggi yang memuat sub-detik",
      "Struktur SEO semantik agar mudah dicari di Google",
      "Tampilan responsif sempurna di smartphone calon klien"
    ],
    "iconName": "Globe"
  },
  {
    "id": "custom_app",
    "title": "Membangun Aplikasi Khusus",
    "description": "Membangun perangkat lunak kustom yang 100% mengikuti SOP bisnis Anda.",
    "bulletPoints": [
      "Sistem dirancang khusus sesuai alur kerja unik",
      "Aplikasi web internal untuk operasional staf",
      "Platform mandiri tanpa biaya lisensi per user bulanan"
    ],
    "iconName": "Code2"
  },
  {
    "id": "immersive_exp",
    "title": "Menciptakan Pengalaman Interaktif",
    "description": "Menghadirkan wahana interaktif sensorik, pameran virtual, atau atraksi 3D.",
    "bulletPoints": [
      "Instalasi dinding/lantai sensor sentuh (Interactive Projection)",
      "Wahana scanner mewarnai karakter/ikan 3D hidup",
      "Tur virtual 360° dan display 3D peluncuran produk"
    ],
    "iconName": "Sparkles"
  }
]

export const DEFAULT_INDUSTRIES: Industry[] = [
  {
    "id": "pendidikan",
    "name": "Pendidikan & Kampus",
    "desc": "Universitas, sekolah, politeknik, yayasan & bimbel",
    "iconName": "GraduationCap"
  },
  {
    "id": "restoran",
    "name": "Restoran, Kafe & F&B",
    "desc": "Restoran, coffee shop, lounge & kuliner multi-cabang",
    "iconName": "Utensils"
  },
  {
    "id": "retail",
    "name": "Retail & Toko Produk",
    "desc": "Toko retail, butik, grosir, e-commerce & distributor",
    "iconName": "ShoppingBag"
  },
  {
    "id": "pariwisata",
    "name": "Pariwisata & Hiburan",
    "desc": "Museum, destinasi wisata, akuarium, galeri & wahana",
    "iconName": "Landmark"
  },
  {
    "id": "kesehatan",
    "name": "Kesehatan & Medis",
    "desc": "Klinik, rumah sakit, laboratorium & farmasi",
    "iconName": "Activity"
  },
  {
    "id": "hospitality",
    "name": "Hospitality & Hotel",
    "desc": "Hotel, resort, villa, glamping & convention hall",
    "iconName": "Hotel"
  },
  {
    "id": "corporate",
    "name": "Korporat & B2B",
    "desc": "Perusahaan B2B, konsultan, holding & firma hukum",
    "iconName": "Building2"
  },
  {
    "id": "kreatif",
    "name": "Industri Kreatif & Event",
    "desc": "Event organizer, studio desain, agensi & expo",
    "iconName": "Palette"
  },
  {
    "id": "properti",
    "name": "Properti & Real Estate",
    "desc": "Developer, perumahan, arsitek & agen properti",
    "iconName": "Home"
  },
  {
    "id": "manufaktur",
    "name": "Manufaktur & Logistik",
    "desc": "Pabrik, logistik pengiriman, pergudangan & supply chain",
    "iconName": "Boxes"
  },
  {
    "id": "keuangan",
    "name": "Keuangan & Fintech",
    "desc": "Koperasi, BPR, modal ventura & asuransi",
    "iconName": "Wallet"
  },
  {
    "id": "umkm",
    "name": "UMKM & Usaha Mandiri",
    "desc": "Usaha berkembang, jasa profesional & toko lokal",
    "iconName": "Store"
  },
  {
    "id": "startup",
    "name": "Startup Digital",
    "desc": "Platform teknologi, SaaS, aplikasi web & AI",
    "iconName": "Rocket"
  },
  {
    "id": "pemerintahan",
    "name": "Pemerintahan & Publik",
    "desc": "Dinas, BUMN, lembaga publik & komunitas",
    "iconName": "Flag"
  },
  {
    "id": "lainnya",
    "name": "Lainnya",
    "desc": "Kategori industri khusus lainnya",
    "iconName": "Briefcase"
  }
]

export const DEFAULT_QUESTIONS: DynamicQuestion[] = [
  {
    "id": "resto_needs",
    "category": "restoran",
    "title": "Apa bagian restoran atau kafe Anda yang paling ingin diperbaiki?",
    "subtitle": "Pilih satu atau beberapa kebutuhan utama agar solusi yang diracik tepat sasaran.",
    "options": [
      {
        "id": "menu_order",
        "label": "Menu Digital & Self-Order QR Meja",
        "desc": "Tamu scan QR di meja, langsung pilih menu dan pesan mandiri tanpa antre kasir.",
        "iconName": "QrCode"
      },
      {
        "id": "online_order",
        "label": "Pemesanan Online & Pengiriman",
        "desc": "Menerima order delivery dan takeaway langsung tanpa komisi aplikasi pihak ketiga.",
        "iconName": "ShoppingBag"
      },
      {
        "id": "payment_auto",
        "label": "Pembayaran QRIS & Bank Otomatis",
        "desc": "Verifikasi pelunasan instan, langsung cetak bukti dan masuk ke sistem kasir.",
        "iconName": "CheckCircle2"
      },
      {
        "id": "customer_data",
        "label": "Manajemen Data Pelanggan & Member",
        "desc": "Mendata nomor WhatsApp tamu dan poin loyalti untuk promosi repeat order.",
        "iconName": "Users"
      },
      {
        "id": "table_reservation",
        "label": "Reservasi Meja & Booking Tempat",
        "desc": "Tamu dapat memesan meja dan memilih jam kedatangan secara online.",
        "iconName": "Calendar"
      },
      {
        "id": "kitchen_inventory",
        "label": "Kontrol Stok Dapur & Laporan Omzet",
        "desc": "Sinkronisasi bahan baku otomatis dan laporan penjualan harian real-time.",
        "iconName": "BarChart3"
      }
    ]
  },
  {
    "id": "edu_needs",
    "category": "pendidikan",
    "title": "Bagian operasional sekolah atau kampus mana yang ingin ditingkatkan?",
    "subtitle": "Pilih alur pelayanan akademik atau pendaftaran yang ingin diotomatisasi.",
    "options": [
      {
        "id": "pmb_online",
        "label": "Sistem PMB / PPDB Online Bertahap",
        "desc": "Pendaftaran calon siswa/mahasiswa bertahap yang tahan lonjakan ribuan pendaftar.",
        "iconName": "GraduationCap"
      },
      {
        "id": "doc_verification",
        "label": "Verifikasi Berkas & Seleksi Nilai Digital",
        "desc": "Otomasi validasi dokumen dan penerbitan kartu tanda peserta ujian ber-QR.",
        "iconName": "FileCheck"
      },
      {
        "id": "tuition_bill",
        "label": "Pembayaran SPP / Uang Kuliah Terintegrasi",
        "desc": "Integrasi virtual account bank untuk verifikasi pembayaran biaya studi otomatis.",
        "iconName": "CreditCard"
      },
      {
        "id": "academic_portal",
        "label": "Portal Informasi & Profil Institusi Kredibel",
        "desc": "Website institusi resmi berkecepatan tinggi dengan struktur informasi teratur.",
        "iconName": "Globe"
      },
      {
        "id": "virtual_campus",
        "label": "Virtual Tour 360° Fasilitas Kampus",
        "desc": "Pameran ruangan 360° interaktif agar calon pendaftar bisa menjelajah fasilitas.",
        "iconName": "Compass"
      },
      {
        "id": "admin_dashboard",
        "label": "Dashboard Rekapitulasi Data Terpusat",
        "desc": "Panel kontrol pimpinan untuk memantau grafik pendaftar dan data siswa.",
        "iconName": "LayoutDashboard"
      }
    ]
  },
  {
    "id": "immersive_needs",
    "category": "immersive",
    "title": "Pengalaman interaktif seperti apa yang ingin Anda ciptakan?",
    "subtitle": "Pilih instalasi atau teknologi sensor yang ingin Anda terapkan di lokasi acara.",
    "options": [
      {
        "id": "wall_projection",
        "label": "Dinding & Lantai Sensor Sentuh (Interactive Wall)",
        "desc": "Dinding proyektor atau LED yang merespons sentuhan fisik pengunjung dengan visual hidup.",
        "iconName": "Monitor"
      },
      {
        "id": "live_scan_3d",
        "label": "Scanner Mewarnai Ikan/Karakter 3D Hidup",
        "desc": "Pengunjung mewarnai di kertas fisik, discan, lalu langsung hidup di layar LED raksasa.",
        "iconName": "Fish"
      },
      {
        "id": "virtual_tour_360",
        "label": "Tur Virtual 360° & Pameran Ruang Digital 3D",
        "desc": "Visualisasi ruang digital 360° interaktif yang dapat diakses langsung dari browser.",
        "iconName": "Globe"
      },
      {
        "id": "expo_touch_game",
        "label": "Game Layar Sentuh Berhadiah di Booth",
        "desc": "Gamifikasi layar sentuh dengan skor realtime untuk memicu antrean pengunjung booth.",
        "iconName": "Gamepad2"
      },
      {
        "id": "photo_booth_wa",
        "label": "Photo Booth Digital Kirim WhatsApp",
        "desc": "Pengunjung berfoto dengan frame acara, foto otomatis terkirim langsung ke nomor WhatsApp.",
        "iconName": "Camera"
      },
      {
        "id": "product_3d_display",
        "label": "Simulasi Display Produk 3D Interaktif",
        "desc": "Presentasi produk interaktif di mana pengunjung dapat memutar dan membongkar komponen 3D.",
        "iconName": "Sparkles"
      }
    ]
  },
  {
    "id": "sales_needs",
    "category": "sales",
    "title": "Bagian alur penjualan mana yang ingin dipermudah bagi calon pembeli?",
    "subtitle": "Pilih aspek yang paling berpengaruh pada peningkatan transaksi bisnis Anda.",
    "options": [
      {
        "id": "catalog_web",
        "label": "Katalog Produk Interaktif & Cepat",
        "desc": "Tampilan produk modern yang ringan, mudah dicari, dan responsif di smartphone.",
        "iconName": "Grid"
      },
      {
        "id": "online_checkout",
        "label": "Sistem Pemesanan Langsung Web / WhatsApp",
        "desc": "Pembeli bisa checkout langsung atau otomatis terhubung ke WhatsApp customer service.",
        "iconName": "MessageSquare"
      },
      {
        "id": "crm_customer",
        "label": "Pelacakan Prospek Klien & Follow-Up (CRM)",
        "desc": "Mencatat riwayat prospek dan notifikasi jadwal follow-up agar tidak ada order lepas.",
        "iconName": "Users"
      },
      {
        "id": "payment_gateway",
        "label": "Pembayaran Otomatis Semua Bank & E-Wallet",
        "desc": "Integrasi payment gateway resmi untuk konfirmasi pembayaran tanpa kirim struk manual.",
        "iconName": "CreditCard"
      },
      {
        "id": "stock_multi",
        "label": "Sinkronisasi Stok Otomatis Multi-Gudang",
        "desc": "Stok barang terpotong otomatis saat ada penjualan dari toko offline maupun online.",
        "iconName": "Boxes"
      },
      {
        "id": "lead_capture",
        "label": "Formulir Penangkap Kontak & Promo",
        "desc": "Mendata pengunjung potensial dengan formulir cepat penawaran promo.",
        "iconName": "FileText"
      }
    ]
  },
  {
    "id": "workflow_needs",
    "category": "corporate",
    "title": "Proses bisnis mana yang saat ini paling banyak menyita waktu manual?",
    "subtitle": "Pilih alur kerja yang ingin disederhanakan dengan sistem perangkat lunak mandiri.",
    "options": [
      {
        "id": "erp_internal",
        "label": "Sistem Operasional ERP Kustom",
        "desc": "Penyatuan alur kerja antar divisi ke dalam satu sistem terpadu sesuai SOP bisnis.",
        "iconName": "Building2"
      },
      {
        "id": "sales_pipeline_crm",
        "label": "Manajemen Prospek & Pipeline Penjualan (CRM)",
        "desc": "Mencatat status prospek sales dari awal kontak hingga deal secara terpusat.",
        "iconName": "TrendingUp"
      },
      {
        "id": "approval_doc",
        "label": "Alur Pengajuan & Persetujuan Dokumen Digital",
        "desc": "Pemberian persetujuan (approval) berjenjang digital tanpa tanda tangan kertas fisik.",
        "iconName": "FileCheck"
      },
      {
        "id": "branch_integration",
        "label": "Integrasi Data & Laporan Antar Cabang",
        "desc": "Sinkronisasi otomatis laporan keuangan, aset, dan kegiatan antar kantor cabang.",
        "iconName": "Network"
      },
      {
        "id": "dashboard_bi",
        "label": "Dashboard Analitik Eksekutif untuk Owner/Direksi",
        "desc": "Grafik pemantauan kinerja bisnis dan performa tim secara real-time.",
        "iconName": "BarChart3"
      },
      {
        "id": "rbac_security",
        "label": "Pembatasan Hak Akses Staf (Keamanan Data)",
        "desc": "Pengaturan izin akses data sensitif sesuai jabatan masing-masing karyawan.",
        "iconName": "ShieldCheck"
      }
    ]
  },
  {
    "id": "brand_needs",
    "category": "default",
    "title": "Apa fokus utama dari platform digital yang ingin Anda bangun?",
    "subtitle": "Pilih elemen yang paling penting untuk memperkuat reputasi dan konversi bisnis Anda.",
    "options": [
      {
        "id": "high_speed_web",
        "label": "Website Cepat Sub-Detik (< 1.2s FCP)",
        "desc": "Situs web dengan arsitektur server-side modern yang tidak membuat pengunjung menunggu.",
        "iconName": "Zap"
      },
      {
        "id": "seo_dominance",
        "label": "Optimasi SEO Teknis Dominasi Google",
        "desc": "Struktur kode semantik dan Core Web Vitals hijau agar bisnis Anda menempati halaman 1.",
        "iconName": "Search"
      },
      {
        "id": "conversion_focus",
        "label": "Arsitektur Halaman Berorientasi Konversi",
        "desc": "Alur navigasi intuitif yang membimbing pengunjung melakukan pembelian atau kontak tim.",
        "iconName": "Target"
      },
      {
        "id": "auto_leads",
        "label": "Penangkap Prospek Otomatis ke WhatsApp",
        "desc": "Formulir cerdas yang meneruskan rincian kebutuhan prospek langsung ke chat tim sales.",
        "iconName": "Send"
      },
      {
        "id": "custom_cms",
        "label": "Panel Admin Mandiri Mudah Digunakan",
        "desc": "Kemudahan memperbarui konten dan foto tanpa perlu bantuan tim teknis setiap hari.",
        "iconName": "LayoutDashboard"
      },
      {
        "id": "enterprise_security",
        "label": "Keamanan Data & SLA Server 99.9%",
        "desc": "Perlindungan dari serangan DDoS, backup otomatis, dan jaminan uptime server tinggi.",
        "iconName": "ShieldCheck"
      }
    ]
  }
]

export const DEFAULT_STORED_TAXONOMY: SolutionTaxonomyItemStored[] = [
  {
    "id": "booking-transaction-platform",
    "name": "Platform Booking & Online Transaction",
    "badge": "Smart Booking & Commerce System",
    "category": "business_commerce",
    "shortDesc": "Platform digital yang membantu bisnis mengelola informasi layanan/destinasi, menerima reservasi jadwal, dan memproses transaksi secara online dalam satu alur pengalaman yang lancar.",
    "targetGoals": [
      "increase_sales",
      "digitalize_business",
      "automate_workflow"
    ],
    "targetIndustries": [
      "pariwisata",
      "hospitality",
      "kesehatan",
      "kreatif",
      "umkm"
    ],
    "matchedKeywords": [
      "table_reservation",
      "online_order",
      "payment_auto",
      "customer_data",
      "catalog_web",
      "online_checkout"
    ],
    "whyItFitsTemplate": "Kebutuhan bisnis {industry} Anda untuk mengelola pemesanan dan transaksi online membutuhkan platform booking mandiri yang mempermudah pelanggan memilih tanggal, melihat ketersediaan slot secara real-time, dan melakukan pembayaran instan tanpa hambatan admin manual.",
    "whyPointsTemplate": [
      "Membantu meningkatkan transaksi penjualan online secara terpusat",
      "Mendukung kebutuhan booking dan pembayaran instan tanpa perantara",
      "Dapat disesuaikan sepenuhnya dengan proses bisnis {industry}",
      "Memudahkan pelanggan melakukan reservasi dari smartphone kapan saja"
    ],
    "differenceFromAlternative": "Fokus pada sistem penjadwalan slot dan reservasi transaksi langsung dibanding sekadar katalog produk statis.",
    "keyFeatures": [
      "Kalender ketersediaan slot & reservasi waktu interaktif real-time",
      "Integrasi gerbang pembayaran otomatis (QRIS, Virtual Account, Kartu Kredit)",
      "Notifikasi konfirmasi otomatis via WhatsApp & email ke pelanggan",
      "Panel manajemen reservasi & pelacakan status pesanan staf",
      "Database kontak pelanggan & riwayat booking untuk promosi repeat order"
    ],
    "businessBenefits": [
      "Mempermudah pelanggan melakukan reservasi dari mana saja",
      "Meningkatkan peluang konversi transaksi tanpa perlu admin standby 24 jam",
      "Mengeliminasi risiko jadwal tumpang-tindih (double booking)",
      "Memusatkan pencatatan pendapatan dan data pelanggan dalam satu sistem",
      "Memberikan pengalaman digital yang modern dan profesional bagi klien"
    ],
    "deliverables": [
      "Platform Web Booking Responsif Cepat",
      "Dashboard Admin Manajemen Jadwal & Pesanan",
      "Integrasi Pembayaran Otomatis Multi-Channel",
      "Sistem Notifikasi WhatsApp Gateway Otomatis"
    ],
    "relatedPortfolio": {
      "slug": "interactive-3d-aquarium-edutainment",
      "title": "Platform Reservasi & Transaksi Wisata",
      "client": "Oceanic Hub & Tourism Operator",
      "category": "Sistem Booking & Transaksi",
      "image": "/images/portfolio/interactive-3d-aquarium.png",
      "highlight": "Memproses ratusan reservasi tiket dan slot waktu per hari secara otomatis dengan verifikasi instan."
    },
    "technologies": [
      "Next.js 16 App Router",
      "UNIMASI Studio CMS",
      "PostgreSQL",
      "Payment Gateway API"
    ]
  },
  {
    "id": "ecommerce-platform",
    "name": "Platform E-Commerce & Toko Online Mandiri",
    "badge": "Direct-to-Consumer Digital Store",
    "category": "business_commerce",
    "shortDesc": "Platform toko online mandiri berkecepatan tinggi untuk mengelola katalog produk, memproses transaksi keranjang belanja, integrasi ongkos kirim kurir, dan pembayaran tanpa potongan komisi marketplace.",
    "targetGoals": [
      "increase_sales",
      "digitalize_business",
      "digital_presence"
    ],
    "targetIndustries": [
      "retail",
      "umkm",
      "kreatif",
      "manufaktur",
      "restoran"
    ],
    "matchedKeywords": [
      "catalog_web",
      "online_checkout",
      "payment_gateway",
      "stock_multi",
      "lead_capture"
    ],
    "whyItFitsTemplate": "Untuk membantu bisnis {industry} Anda meningkatkan penjualan mandiri dan mempercepat alur transaksi pembeli, platform e-commerce dengan checkout ringkas dan hitung ongkir otomatis akan memaksimalkan konversi belanja tanpa bergantung pada marketplace pihak ketiga.",
    "whyPointsTemplate": [
      "Membantu mendongkrak penjualan langsung tanpa potongan komisi marketplace",
      "Mendukung katalog produk interaktif dan checkout cepat",
      "Dapat disesuaikan dengan alur inventaris dan logistik {industry}",
      "Memungkinkan Anda menguasai data pelanggan sendiri untuk repeat order"
    ],
    "differenceFromAlternative": "Dirancang khusus untuk penjualan banyak produk retail dengan keranjang belanja dan kalkulasi logistik otomatis.",
    "keyFeatures": [
      "Katalog produk cepat dengan filter kategori & pencarian instan",
      "Keranjang belanja fleksibel dengan checkout instan ke Payment Gateway & WhatsApp",
      "Kalkulasi ongkos kirim otomatis terhubung ekspedisi logistik Indonesia",
      "Sinkronisasi stok barang berkurang otomatis saat pesanan terbayar",
      "Panel pengelolaan pesanan, resi pengiriman, dan laporan omzet penjualan"
    ],
    "businessBenefits": [
      "Meningkatkan margin keuntungan bersih karena bebas potongan komisi platform",
      "Mempercepat proses pembelian dan mengurangi cart abandonment",
      "Mengurangi kesalahan pengiriman dengan pencatatan alamat dan resi terpadu",
      "Membangun aset digital brand milik perusahaan Anda sendiri secara mandiri"
    ],
    "deliverables": [
      "Website Toko Online Mandiri Cepat & Responsif",
      "Dashboard Pengelolaan Produk, Stok & Pesanan",
      "Integrasi Payment Gateway & Kalkulator Ongkir Otomatis",
      "Panduan Operasional & Setup Pelacakan Meta Pixel / Google Analytics"
    ],
    "relatedPortfolio": {
      "slug": "interactive-wall-projection-museum",
      "title": "Platform Commerce & Katalog Interaktif",
      "client": "Retail & Creative Merchandise Hub",
      "category": "E-Commerce & Transaksi",
      "image": "/images/companies/unicam-creative-studio.jpg",
      "highlight": "Meningkatkan konversi penjualan online langsung sebesar 40% dalam 3 bulan pertama rilis."
    },
    "technologies": [
      "Next.js 16 App Router",
      "UNIMASI Studio CMS",
      "PostgreSQL",
      "Tailwind CSS"
    ]
  },
  {
    "id": "pmb-education-platform",
    "name": "Sistem Portal PMB & Platform Akademik Terintegrasi",
    "badge": "Education Platform & Admission System",
    "category": "platform",
    "shortDesc": "Platform digital terpadu untuk institusi pendidikan: pendaftaran calon mahasiswa/siswa baru bertahap, seleksi nilai, verifikasi berkas terenkripsi, dan integrasi pembayaran bank otomatis.",
    "targetGoals": [
      "digitalize_business",
      "automate_workflow",
      "custom_app",
      "build_brand"
    ],
    "targetIndustries": [
      "pendidikan"
    ],
    "matchedKeywords": [
      "pmb_online",
      "doc_verification",
      "tuition_bill",
      "academic_portal",
      "elearning_lms",
      "admin_dashboard"
    ],
    "whyItFitsTemplate": "Kebutuhan institusi {industry} Anda untuk mengotomatisasi pendaftaran dan verifikasi berkas membutuhkan fondasi Next.js yang tahan menampung ribuan pendaftar serentak tanpa server down, sekaligus memangkas 90% waktu verifikasi manual panitia.",
    "whyPointsTemplate": [
      "Membantu digitalisasi seluruh tahapan pendaftaran penerimaan peserta didik baru",
      "Mendukung verifikasi berkas digital tanpa antrean berkas fisik",
      "Dapat disesuaikan dengan alur seleksi unik institusi {industry}",
      "Memudahkan calon pendaftar dan orang tua memantau status seleksi dari smartphone"
    ],
    "differenceFromAlternative": "Dikhususkan untuk alur birokrasi seleksi akademik, upload berkas persyaratan, dan kartu ujian bertahap.",
    "keyFeatures": [
      "Pendaftaran online bertahap dengan validasi NIK otomatis",
      "Upload berkas terenkripsi & verifikasi kelengkapan digital oleh verifikator",
      "Penerbitan kartu ujian QR & pengumuman seleksi instan",
      "Integrasi payment gateway virtual account bank & QRIS",
      "Dashboard admin panitia dengan rekapitulasi data mahasiswa real-time"
    ],
    "businessBenefits": [
      "Memangkas waktu proses verifikasi berkas panitia hingga 90%",
      "Mencegah server down saat hari pendaftaran membludak",
      "Meningkatkan citra modern dan kredibilitas institusi di mata masyarakat",
      "Memudahkan orang tua murid membayar biaya formulir secara instan"
    ],
    "deliverables": [
      "Platform Web PMB Responsif Cepat",
      "Dashboard Admin Panitia Seleksi & Verifikator",
      "Integrasi Pembayaran Otomatis Bank / QRIS",
      "SLA Monitoring & Garansi Server 99.9%"
    ],
    "relatedPortfolio": {
      "slug": "mercu-buana-branding",
      "title": "Transformasi Akademik Digital Mercu Buana",
      "client": "Universitas Mercu Buana",
      "category": "3D Educational Visualization",
      "image": "/images/portfolio/mercu-buana.webp",
      "highlight": "Visualisasi 3D sinematik kampus modern dan program studi akademik untuk menarik minat mahasiswa baru."
    },
    "technologies": [
      "Next.js 16 App Router",
      "UNIMASI Studio CMS",
      "PostgreSQL",
      "Docker"
    ]
  },
  {
    "id": "cafe-menu-order-app",
    "name": "Cafe Menu, Self-Order & Restaurant Operating App",
    "badge": "Smart F&B Digital Platform",
    "category": "business_commerce",
    "shortDesc": "Aplikasi web restoran dan kafe modern: menu digital interaktif berbasis QR scan meja, pemesanan mandiri pelanggan, pembayaran instan, dan integrasi pesanan langsung ke printer dapur.",
    "targetGoals": [
      "increase_sales",
      "digitalize_business",
      "automate_workflow"
    ],
    "targetIndustries": [
      "restoran",
      "hospitality",
      "umkm"
    ],
    "matchedKeywords": [
      "menu_order",
      "online_order",
      "payment_auto",
      "customer_data",
      "table_reservation",
      "kitchen_inventory",
      "sales_analytics"
    ],
    "whyItFitsTemplate": "Untuk bisnis {industry}, digitalisasi pemesanan melalui menu QR mandiri akan memangkas antrean kasir, mempercepat perputaran meja (table turnover), dan mengeliminasi salah catat pesanan dapur hingga 95%.",
    "whyPointsTemplate": [
      "Membantu meningkatkan omzet melalui kemudahan pelanggan memesan berulang (re-order)",
      "Mendukung pemesanan mandiri tanpa perlu antre di meja kasir",
      "Dapat disesuaikan dengan alur divisi dapur dan bar restoran Anda",
      "Mengurangi beban kerja staf pelayan sehingga pelayanan lebih cepat"
    ],
    "differenceFromAlternative": "Didesain optimal untuk pengalaman scan meja tamu restoran tanpa perlu instal aplikasi dari Play Store / App Store.",
    "keyFeatures": [
      "Menu digital interaktif berbasis QR scan tanpa download aplikasi",
      "Pemesanan mandiri langsung dari meja pelanggan ke kasir & dapur",
      "Pembayaran instan QRIS dinamis & e-wallet terverifikasi otomatis",
      "Pencatatan data kontak pelanggan untuk program loyalitas & promo broadcast",
      "Laporan omzet penjualan harian & manajemen stok bahan baku real-time"
    ],
    "businessBenefits": [
      "Mempercepat perputaran meja pelanggan hingga 30% pada jam sibuk",
      "Mengeliminasi salah catat pesanan antara pelayan dan dapur",
      "Mengetahui menu terlaris dan jam ramai lewat laporan otomatis",
      "Meningkatkan kepuasan tamu dengan pelayanan modern tanpa menunggu lama"
    ],
    "deliverables": [
      "Aplikasi Menu & Pemesanan Mandiri Tamu Berbasis Web",
      "Panel Kasir & Kitchen Display Order",
      "Sistem Pembayaran QRIS Dinamis Otomatis",
      "Laporan Penjualan Real-time & Data Pelanggan"
    ],
    "relatedPortfolio": {
      "slug": "interactive-3d-aquarium-edutainment",
      "title": "Aplikasi Operasional & Pemesanan Cepat",
      "client": "Unicam Creative Studio & F&B Hub",
      "category": "Aplikasi Web Pemesanan & Kasir",
      "image": "/images/companies/unicam-creative-studio.jpg",
      "highlight": "Mempercepat alur transaksi dari menit menjadi detik dengan sistem pemesanan terpadu."
    },
    "technologies": [
      "Next.js App Router",
      "TypeScript",
      "Tailwind CSS",
      "WebSockets Real-time"
    ]
  },
  {
    "id": "custom-enterprise-crm",
    "name": "Custom Enterprise CRM & Sales Pipeline Platform",
    "badge": "Enterprise Business Operating System",
    "category": "business_system",
    "shortDesc": "Platform manajemen hubungan pelanggan dan pipeline penjualan yang dirancang khusus mengikuti SOP bisnis Anda, memusatkan prospek tanpa biaya lisensi per-user bulanan yang membebani.",
    "targetGoals": [
      "increase_sales",
      "automate_workflow",
      "custom_app",
      "digitalize_business"
    ],
    "targetIndustries": [
      "corporate",
      "retail",
      "manufaktur",
      "properti",
      "keuangan",
      "startup",
      "umkm"
    ],
    "matchedKeywords": [
      "crm_customer",
      "sales_pipeline_crm",
      "crm_pipeline",
      "lead_capture",
      "approval_doc",
      "branch_integration",
      "dashboard_bi"
    ],
    "whyItFitsTemplate": "Di bidang {industry}, integrasi pelacakan prospek sangat krusial agar seluruh calon klien dari WhatsApp, website, dan tim sales terorganisasi rapi dalam satu alur visual tanpa ada prospek yang terlewat atau terlambat dihubungi.",
    "whyPointsTemplate": [
      "Membantu meningkatkan konversi penjualan dari prospek menjadi klien aktif",
      "Mendukung pelacakan tahapan negosiasi tim sales secara transparan",
      "Dapat disesuaikan dengan SOP sales dan hierarki persetujuan bisnis Anda",
      "Mencegah prospek hilang akibat pencatatan manual di chat pribadi staf"
    ],
    "differenceFromAlternative": "Berfokus pada pengelolaan tahapan hubungan prospek klien B2B dan aktivitas tim sales dibanding pengelolaan inventaris gudang.",
    "keyFeatures": [
      "Kanban board visual pelacakan status prospek penjualan (Leads Pipeline)",
      "Pencatatan riwayat interaksi, panggilan telepon, dan catatan meeting klien",
      "Otomasi notifikasi follow-up ke WhatsApp & email tim sales",
      "Pembatasan hak akses berbasis peran (Role-Based Access Control)",
      "Dashboard analitik rasio konversi penjualan dan performa tiap agen"
    ],
    "businessBenefits": [
      "Meningkatkan rasio penutupan deal (closing rate) hingga 35%",
      "Seluruh aset data klien tetap menjadi milik perusahaan meski sales resign",
      "Manajemen dapat memonitor performa tim sales harian secara objektif",
      "Bebas biaya langganan bulanan software asing yang melonjak setiap tahun"
    ],
    "deliverables": [
      "Sistem Web CRM Kustom Sesuai Alur Bisnis",
      "Aplikasi Mobile/Tablet Ramah Tim Sales Lapangan",
      "Database Mandiri Terenkripsi (Bebas Biaya Lisensi Bulanan)",
      "Sesi Training Penggunaan Tim & Dokumentasi Teknis"
    ],
    "relatedPortfolio": {
      "slug": "interactive-wall-projection-museum",
      "title": "Sistem Manajemen Data & Prospek Klien B2B",
      "client": "Institusi Mitra Strategis UNIMASI",
      "category": "Software Enterprise & CRM Kustom",
      "image": "/images/companies/unicam-creative-studio.jpg",
      "highlight": "Meningkatkan konversi penutupan penjualan hingga 35% dengan alur kerja terstruktur."
    },
    "technologies": [
      "Next.js App Router",
      "PostgreSQL",
      "Docker",
      "Role-Based Access Control (RBAC)"
    ]
  },
  {
    "id": "custom-erp-internal-system",
    "name": "Custom ERP & Business Management System",
    "badge": "Custom Enterprise Software",
    "category": "business_system",
    "shortDesc": "Sistem operasional perangkat lunak terpusat yang dirancang spesifik mengikuti SOP dan alur koordinasi bisnis Anda: manajemen inventaris multi-cabang, approval digital bertingkat, dan laporan eksekutif.",
    "targetGoals": [
      "automate_workflow",
      "custom_app",
      "digitalize_business"
    ],
    "targetIndustries": [
      "manufaktur",
      "corporate",
      "kesehatan",
      "retail",
      "properti",
      "keuangan"
    ],
    "matchedKeywords": [
      "erp_internal",
      "approval_doc",
      "branch_integration",
      "dashboard_bi",
      "rbac_security",
      "stock_multi"
    ],
    "whyItFitsTemplate": "Di bidang {industry}, integrasi sistem internal menghilangkan ketergantungan pada file spreadsheet yang tercecer, menyatukan seluruh cabang dan departemen ke dalam satu sumber kebenaran data terpercaya.",
    "whyPointsTemplate": [
      "Membantu mengotomatiskan alur kerja operasional antar divisi",
      "Mendukung pelaporan data terpusat dan persetujuan digital berjenjang",
      "Dapat disesuaikan 100% dengan proses bisnis dan regulasi perusahaan Anda",
      "Mengurangi kesalahan human-error pencatatan data hingga 85%"
    ],
    "differenceFromAlternative": "Menyatukan operasional menyeluruh (gudang, pengadaan, staf, keuangan) dibanding hanya menangani front-end penjualan.",
    "keyFeatures": [
      "Arsitektur modular disesuaikan 100% dengan alur kerja internal unik bisnis Anda",
      "Sistem persetujuan berjenjang (multi-level approval) dengan riwayat audit lengkap",
      "Sinkronisasi data multi-cabang otomatis tanpa jeda",
      "Enkripsi data sensitif & isolasi database PostgreSQL mandiri",
      "Ekspor laporan keuangan, stok, dan kinerja karyawan dalam hitungan detik"
    ],
    "businessBenefits": [
      "Menghemat ratusan jam kerja staf dari rekap manual spreadsheet",
      "Mempercepat pengambilan keputusan pimpinan dengan laporan real-time",
      "Mencegah kebocoran inventaris stok dengan pencatatan audit ketat",
      "Sistem scalable yang siap berkembang saat cabang dan skala bisnis bertambah"
    ],
    "deliverables": [
      "Sistem ERP Web Terpusat Berkecepatan Tinggi",
      "Aplikasi Khusus Staf & Panel Manajerial",
      "Migrasi Data dari Sistem Lama / Spreadsheet",
      "Dokumentasi SOP Teknis & Pendampingan Pemakaian"
    ],
    "relatedPortfolio": {
      "slug": "interactive-wall-projection-museum",
      "title": "Sistem Operasional & Platform Data Terintegrasi",
      "client": "Mitra Korporasi UNIMASI",
      "category": "Software Enterprise & ERP Kustom",
      "image": "/images/companies/unicam-creative-studio.jpg",
      "highlight": "Menghemat lebih dari 120 jam kerja manual per bulan melalui otomatisasi alur kerja."
    },
    "technologies": [
      "Next.js",
      "Prisma 8 ORM",
      "PostgreSQL",
      "Role-Based Access Control"
    ]
  },
  {
    "id": "ai-business-solution",
    "name": "Solusi AI Bisnis & Asisten Cerdas Terintegrasi",
    "badge": "AI Application & Workflow Automation",
    "category": "ai_automation",
    "shortDesc": "Penerapan kecerdasan buatan (AI) terapan untuk mengotomatisasi customer service, perangkuman dokumen bisnis, pencarian data internal cerdas, dan prediksi analitik operasional.",
    "targetGoals": [
      "automate_workflow",
      "custom_app",
      "increase_sales"
    ],
    "targetIndustries": [
      "startup",
      "corporate",
      "kesehatan",
      "keuangan",
      "retail",
      "pendidikan",
      "lainnya"
    ],
    "matchedKeywords": [
      "approval_doc",
      "erp_internal",
      "sales_pipeline_crm",
      "customer_data"
    ],
    "whyItFitsTemplate": "Kebutuhan automasi cerdas pada bisnis {industry} Anda dapat diakselerasi dengan integrasi modul AI yang mampu merespons prospek secara instan dan menganalisis data operasional tanpa menambah beban jam kerja staf.",
    "whyPointsTemplate": [
      "Membantu mengotomatiskan tugas repetitif menggunakan teknologi kecerdasan buatan",
      "Mendukung pelayanan prospek atau pencarian data 24/7 tanpa jeda",
      "Dapat dilatih dengan data dan konteks spesifik bisnis {industry}",
      "Mempercepat waktu respons tim operasional dari jam menjadi hitungan detik"
    ],
    "differenceFromAlternative": "Memanfaatkan model AI cerdas untuk memahami bahasa alami dan memproses dokumen kompleks secara otomatis.",
    "keyFeatures": [
      "Chatbot asisten AI kontekstual terintegrasi ke WhatsApp & situs web",
      "Pencarian cerdas dokumen internal berbasis basis pengetahuan (Knowledge Base RAG)",
      "Ekstraksi dan perangkuman data otomatis dari invoice, nota, dan formulir berkas",
      "Dashboard pantauan akurasi respons dan interaksi pengguna",
      "Keamanan data perusahaan dengan model AI terlindungi (Private LLM deployment)"
    ],
    "businessBenefits": [
      "Memberikan layanan tanya-jawab pelanggan 24 jam dengan jawaban akurat",
      "Memangkas beban kerja staf administrasi dari tugas-tugas menjawab pertanyaan berulang",
      "Mempercepat orientasi staf baru melalui pencarian SOP internal pintar",
      "Meningkatkan citra perusahaan sebagai pelopor teknologi terdepan"
    ],
    "deliverables": [
      "Modul AI Terintegrasi Siap Pakai di Web / WhatsApp",
      "Panel Pengelolaan Knowledge Base & Dokumen Bisnis",
      "API Endpoint Terproteksi & Dokumentasi Teknis",
      "Sesi Uji Coba Akurasi & Pelatihan Tim Internal"
    ],
    "relatedPortfolio": {
      "slug": "interactive-3d-aquarium-edutainment",
      "title": "Sistem Analitik Cerdas & Integrasi Data",
      "client": "Teknologi & Edutainment Partner",
      "category": "Solusi AI & Otomasi Digital",
      "image": "/images/companies/unicam-creative-studio.jpg",
      "highlight": "Mengotomatisasi 70% respons tanya-jawab awal pelanggan secara akurat dan instan."
    },
    "technologies": [
      "Python / FastAPI",
      "Next.js App Router",
      "Vector Database",
      "Private LLM / OpenAI API"
    ]
  },
  {
    "id": "high-performance-corporate-website",
    "name": "High-Performance Corporate Website & Web Architecture",
    "badge": "Modern Web Architecture & Technical SEO",
    "category": "digital_presence",
    "shortDesc": "Website profil perusahaan, platform institusi, dan landing page konversi tinggi dengan arsitektur Next.js server-side, skor Core Web Vitals skala hijau, dan optimasi SEO teknis terpadu.",
    "targetGoals": [
      "build_brand",
      "digital_presence",
      "increase_sales"
    ],
    "targetIndustries": [
      "corporate",
      "pendidikan",
      "kesehatan",
      "keuangan",
      "properti",
      "manufaktur",
      "umkm",
      "startup",
      "pemerintahan",
      "lainnya"
    ],
    "matchedKeywords": [
      "high_speed_web",
      "seo_dominance",
      "editorial_design",
      "portfolio_showcase",
      "conversion_landing",
      "lead_funnel",
      "fast_website"
    ],
    "whyItFitsTemplate": "Untuk memperkuat kredibilitas dan kehadiran online bisnis {industry} Anda, website dengan waktu muat di bawah 1,2 detik dan desain editorial berkelas akan langsung menanamkan kepercayaan tinggi di benak calon klien.",
    "whyPointsTemplate": [
      "Membantu meningkatkan reputasi dan kredibilitas brand di ranah digital",
      "Mendukung fondasi teknis SEO agar website mudah ditemukan di peringkat atas Google",
      "Dapat disesuaikan dengan estetika visual elegan khas {industry}",
      "Memberikan pengalaman menjelajah yang sangat cepat tanpa membuat pengunjung menunggu"
    ],
    "differenceFromAlternative": "Berfokus pada kecepatan muat sub-detik, struktur SEO skala hijau, dan tampilan editorial yang membangun kepercayaan tinggi.",
    "keyFeatures": [
      "Arsitektur Next.js App Router dengan Server-Side Rendering (SSR)",
      "Skor audit Google Lighthouse 95-100% pada performa & Core Web Vitals",
      "Struktur schema JSON-LD terverifikasi, OpenGraph, dan sitemap dinamis",
      "Pengelolaan artikel & portofolio mudah via UNIMASI Studio Control Center",
      "Desain editorial modern tanpa ketergantungan plugin pihak ketiga yang rentan"
    ],
    "businessBenefits": [
      "Meningkatkan konversi kontak masuk karena pengunjung tidak frustrasi menunggu loading",
      "Mendapatkan traffic calon klien berkualitas dari pencarian organik Google",
      "Menampilkan profil portofolio dan keunggulan bisnis secara meyakinkan",
      "Keamanan tinggi terhindar dari peretasan plugin CMS tradisional"
    ],
    "deliverables": [
      "Situs Web Lengkap Responsif Mobile & Desktop",
      "Panel Studio CMS untuk Pengelolaan Konten Mandiri",
      "Setup Lengkap SEO Teknis & Google Search Console",
      "Garansi Performa Core Web Vitals Hijau"
    ],
    "relatedPortfolio": {
      "slug": "telkom-dfe-explainer",
      "title": "Telkom Digital Future Enterprise: Menembus Batas Konektivitas",
      "client": "Telkom Indonesia",
      "category": "Motion Graphics · Tech Explainer",
      "image": "/images/portfolio/telkom-dfe.webp",
      "highlight": "Animasi teknologi futuristik memvisualisasikan jaringan fiber optik dan hybrid cloud berskala nasional."
    },
    "technologies": [
      "Next.js 16 App Router",
      "UNIMASI Studio CMS",
      "Tailwind CSS",
      "GSAP Motion"
    ]
  },
  {
    "id": "interactive-3d-aquarium",
    "name": "Interactive 3D Attraction & Live Sensor Station",
    "badge": "Immersive Software & Sensor Integration",
    "category": "digital_experience",
    "shortDesc": "Software atraksi 3D interaktif bertenaga WebGL di mana pengunjung berinteraksi secara sensorik, memindai karya fisik menjadi visual hidup di layar LED raksasa, dan menikmati wahana digital unik.",
    "targetGoals": [
      "immersive_exp",
      "build_brand",
      "increase_sales"
    ],
    "targetIndustries": [
      "pariwisata",
      "kreatif",
      "hospitality",
      "retail"
    ],
    "matchedKeywords": [
      "live_scan_3d",
      "wall_projection",
      "expo_touch_game",
      "virtual_tour_360"
    ],
    "whyItFitsTemplate": "Wahana sensorik interaktif terbukti menjadi daya tarik utama kerumunan pengunjung di sektor {industry}, memperpanjang durasi interaksi rata-rata hingga 200% serta memicu konten viral di media sosial.",
    "whyPointsTemplate": [
      "Menciptakan pengalaman tak terlupakan yang membedakan Anda dari kompetitor",
      "Mendukung interaksi sensorik fisik yang memikat ribuan audiens",
      "Dapat disesuaikan dengan tema visual dan karakter unik {industry}",
      "Dapat berjalan mandiri secara offline tanpa risiko jaringan internet ngadat"
    ],
    "differenceFromAlternative": "Menggabungkan perangkat lunak 3D dengan stasiun sensorik fisik untuk interaksi langsung di tempat (on-site).",
    "keyFeatures": [
      "Stasiun pemindai optik presisi tinggi (< 2 detik proses scan ke 3D)",
      "Simulasi visual 3D WebGL 60 FPS 4K photorealistic",
      "Interaksi sentuh layar interaktif yang responsif seketika",
      "100% berjalan offline tanpa ketergantungan koneksi internet acara",
      "Satu tombol auto-start & shutdown untuk kemudahan operasional staf harian"
    ],
    "businessBenefits": [
      "Menjadi pusat perhatian utama (crowd puller) yang ramai dikunjungi",
      "Mendorong pengunjung membagikan pengalaman di Instagram/TikTok",
      "Meningkatkan nilai jual tiket masuk atau daya tarik ruang komersial",
      "Operasional stabil tanpa khawatir kendala koneksi internet di lokasi"
    ],
    "deliverables": [
      "Software Atraksi 3D WebGL Siap Pakai",
      "Sistem Software Pemindai Sensorik Presisi",
      "Panduan Spesifikasi Hardware & Penataan Layar LED",
      "Pendampingan Teknisi Langsung di Hari Peluncuran"
    ],
    "relatedPortfolio": {
      "slug": "interactive-3d-aquarium-edutainment",
      "title": "Interactive 3D Aquarium & Live Fish Scanner",
      "client": "Oceanic Science & Edutainment Center",
      "category": "Live Scanner Mewarnai 3D",
      "image": "/images/portfolio/interactive-3d-aquarium.png",
      "highlight": "Pengunjung mewarnai di kertas, memindai, dan melihat karyanya langsung hidup di layar 3D raksasa."
    },
    "technologies": [
      "Three.js / WebGL",
      "OpenCV Scanner Engine",
      "Canvas Physics",
      "On-Premise App"
    ]
  },
  {
    "id": "interactive-wall-projection",
    "name": "Interactive Wall & Floor Projection Mapping",
    "badge": "Spatial Interaction & LiDAR Tracking",
    "category": "digital_experience",
    "shortDesc": "Instalasi sensorik dinding dan lantai interaktif berbasis sensor optik/LiDAR untuk museum, galeri seni, booth expo, dan showroom yang merespons sentuhan fisik secara real-time.",
    "targetGoals": [
      "immersive_exp",
      "build_brand"
    ],
    "targetIndustries": [
      "pariwisata",
      "kreatif",
      "corporate",
      "properti"
    ],
    "matchedKeywords": [
      "wall_projection",
      "expo_touch_game",
      "product_3d_display",
      "photo_booth_wa"
    ],
    "whyItFitsTemplate": "Mengubah ruang dinding atau lantai polos menjadi kanvas sensorik di bidang {industry} akan memukau audiens, menciptakan keterlibatan emosional mendalam terhadap materi yang dipamerkan.",
    "whyPointsTemplate": [
      "Menciptakan daya tarik visual megah di ruang fisik pameran atau showroom",
      "Mendukung respons sentuhan interaktif tanpa lag menggunakan sensor LiDAR",
      "Dapat disesuaikan dengan konten narasi sejarah atau promosi produk {industry}",
      "Sistem on-premise yang aman dan handal digunakan berjam-jam setiap hari"
    ],
    "differenceFromAlternative": "Berfokus pada interaksi proyeksi skala besar pada arsitektur dinding/lantai fisik pengunjung.",
    "keyFeatures": [
      "Sensor pelacak sentuhan fisik presisi tinggi tanpa delay (LiDAR/Optical)",
      "Animasi partikel interaktif & efek visual proyeksi dinamis beresolusi 4K",
      "Konten visual dapat disesuaikan berkala sesuai tema pameran",
      "Arsitektur mandiri on-premise 100% offline aman dari gangguan internet",
      "Mode hemat daya otomatis saat ruangan tidak ada aktivitas pengunjung"
    ],
    "businessBenefits": [
      "Menyulap ruangan statis menjadi pengalaman masa depan yang impresif",
      "Meningkatkan durasi pengunjung memperhatikan konten promosi",
      "Menciptakan citra brand yang inovatif dan terdepan dalam teknologi"
    ],
    "deliverables": [
      "Software Sensorik Interaktif",
      "Paket Visual Animasi Kustom Siap Tayang",
      "Kalibrasi Sensor Presisi di Lokasi Acara",
      "Dukungan Teknis Siaga Selama Durasi Acara"
    ],
    "relatedPortfolio": {
      "slug": "interactive-wall-projection-museum",
      "title": "Interactive Sensing Wall & Projection Mapping",
      "client": "Pusat Kebudayaan & Galeri Nusantara",
      "category": "Dinding Sensorik Interaktif",
      "image": "/images/portfolio/interactive-wall-projection.webp",
      "highlight": "Mengubah dinding polos menjadi kanvas dinamis yang merespons sentuhan ribuan pengunjung pameran."
    },
    "technologies": [
      "LiDAR / Optical Tracking",
      "Three.js WebGL",
      "GSAP Motion",
      "GLSL Shaders"
    ]
  },
  {
    "id": "virtual-tour-360-showcase",
    "name": "Virtual Exhibition & 360° Spatial Digital Twin",
    "badge": "WebGL Spatial Twin & Browser Experience",
    "category": "digital_experience",
    "shortDesc": "Eksplorasi virtual interaktif 360° berbasis WebGL untuk kampus, museum, showroom properti, dan galeri seni yang dapat dijelajahi langsung dari browser tanpa instalasi aplikasi tambahan.",
    "targetGoals": [
      "immersive_exp",
      "digital_presence",
      "build_brand"
    ],
    "targetIndustries": [
      "pendidikan",
      "properti",
      "pariwisata",
      "corporate",
      "kreatif"
    ],
    "matchedKeywords": [
      "virtual_campus",
      "virtual_tour_360",
      "product_3d_display"
    ],
    "whyItFitsTemplate": "Memungkinkan calon pembeli, mahasiswa, atau pengunjung global untuk menjelajahi ruang fisik Anda di bidang {industry} secara interaktif 360° kapan saja tanpa batasan jarak geografis.",
    "whyPointsTemplate": [
      "Menjangkau calon audiens dan pembeli dari seluruh dunia tanpa batas jarak",
      "Mendukung tur 360 derajat interaktif dengan hotspot multimedia lengkap",
      "Dapat disesuaikan dengan arsitektur ruangan dan fasilitas {industry}",
      "Dapat diakses langsung dari browser smartphone tanpa perlu instal aplikasi"
    ],
    "differenceFromAlternative": "Mengutamakan representasi visual spasial 360 derajat dari ruangan fisik nyata agar dapat dijelajahi secara online.",
    "keyFeatures": [
      "Panorama 360° resolusi ultra-tinggi dengan transisi pergerakan mulus",
      "Hotspot interaktif untuk memutar video, informasi audio, dan brosur digital",
      "Peta navigasi mini (minimap) interaktif untuk berpindah lantai/ruangan",
      "Dioptimalkan ringan untuk smartphone tanpa lag",
      "Integrasi formulir pendaftaran atau pemesanan langsung di dalam tur"
    ],
    "businessBenefits": [
      "Mempercepat keputusan pembelian properti atau pendaftaran siswa dari luar kota",
      "Memberikan visualisasi fasilitas secara transparan dan meyakinkan",
      "Dapat disematkan (embed) dengan mudah di situs web utama perusahaan"
    ],
    "deliverables": [
      "Platform WebGL 360° Responsif Semua Perangkat",
      "Hotspot Interaktif Informasi & Media",
      "Panel Admin Update Konten & Hotspot",
      "Link Embed Siap Pasang di Website Utama"
    ],
    "relatedPortfolio": {
      "slug": "virtual-exhibition-ugm",
      "title": "Virtual Exhibition & Interactive Showcase",
      "client": "Universitas Gadjah Mada",
      "category": "Virtual 360° & Pameran Online",
      "image": "/images/schools/ugm-kampus-boulevard.jpg",
      "highlight": "Pameran virtual 360° yang dapat dijelajahi audiens dari seluruh dunia tanpa hambatan jarak."
    },
    "technologies": [
      "Three.js",
      "WebGL",
      "Next.js",
      "CDN Image Optimizer"
    ]
  }
]

export const DEFAULT_PRACTICAL_SOLUTIONS_FAQ = [
  {
    "question": "Apakah UNIMASI menyediakan hardware (seperti layar touchscreen atau proyektor)?",
    "answer": "Fokus keahlian utama kami adalah merancang software, interaksi sensor, dan visualnya. Namun kami selalu memberikan panduan spesifikasi hardware yang tepat, serta siap berkolaborasi langsung dengan vendor rental hardware Anda di lokasi agar semuanya terpasang presisi."
  },
  {
    "question": "Bagaimana jika kami belum punya konsep visual yang pasti?",
    "answer": "Sangat wajar! Anda cukup menceritakan tujuan acara atau tipe pengunjung yang diharapkan. Tim desainer dan konsultan kami akan membantu membuatkan sketsa alur interaksi dan konsep visual yang paling menarik untuk disetujui bersama."
  },
  {
    "question": "Berapa lama waktu pengerjaan untuk instalasi pameran atau wahana wisata?",
    "answer": "Untuk pameran berdurasi singkat hingga menengah, proses perancangan konsep hingga software siap uji biasanya membutuhkan 2–4 minggu. Untuk instalasi permanen di wahana wisata atau sistem kampus, umumnya memakan waktu 4–8 minggu termasuk uji ketahanan."
  },
  {
    "question": "Apakah tim UNIMASI bisa mendampingi pemasangan langsung di lokasi acara?",
    "answer": "Tentu saja. Tim teknis kami siap hadir langsung di lokasi pameran atau institusi Anda (di berbagai kota di Indonesia) untuk melakukan kalibrasi sensor, pengujian akhir, dan pendampingan di hari pembukaan."
  },
  {
    "question": "Bagaimana jika koneksi internet di lokasi pameran mati atau sinyal buruk?",
    "answer": "Seluruh software instalasi kami dirancang 100% siap berjalan offline tanpa koneksi internet. Jika Anda mengumpulkan data kontak pengunjung, data akan tersimpan aman di komputer booth dan disinkronkan otomatis saat ada koneksi."
  }
]

export const DEFAULT_REAL_PORTFOLIO_PROOF = [
  {
    "slug": "interactive-wall-projection-museum",
    "title": "Interactive Sensing Wall & Projection Mapping",
    "client": "Pusat Kebudayaan & Galeri Nusantara",
    "category": "Dinding Sensorik Interaktif",
    "highlight": "Mengubah dinding polos menjadi kanvas dinamis yang merespons sentuhan ribuan pengunjung pameran.",
    "image": "/images/portfolio/interactive-wall-projection.webp"
  },
  {
    "slug": "interactive-3d-aquarium-edutainment",
    "title": "Interactive 3D Aquarium & Live Fish Scanner",
    "client": "Oceanic Science & Edutainment Center",
    "category": "Live Scanner Mewarnai 3D",
    "highlight": "Anak-anak mewarnai ikan di kertas, memindai, dan melihat ikannya langsung berenang hidup di layar 3D raksasa.",
    "image": "/images/portfolio/interactive-3d-aquarium.png"
  },
  {
    "slug": "telkom-dfe-explainer",
    "title": "Telkom Digital Future Enterprise: Menembus Batas Konektivitas",
    "client": "Telkom Indonesia",
    "category": "Motion Graphics · Tech Explainer",
    "highlight": "Animasi teknologi futuristik memvisualisasikan jaringan fiber optik dan hybrid cloud berskala nasional.",
    "image": "/images/portfolio/telkom-dfe.webp"
  },
  {
    "slug": "virtual-exhibition-ugm",
    "title": "Visualisasi Riset & Inovasi Teknologi UGM",
    "client": "Universitas Gadjah Mada",
    "category": "Spatial & 3D Experience",
    "highlight": "Pameran virtual 3D yang dapat dijelajahi audiens dari seluruh dunia tanpa hambatan jarak.",
    "image": "/images/portfolio/ugm.webp"
  }
]
