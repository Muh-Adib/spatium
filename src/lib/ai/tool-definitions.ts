export interface ToolParameter {
  name: string
  type: string
  description: string
  required?: boolean
  defaultValue?: string | number | boolean
  allowedValues?: string[]
  example?: string | number | boolean
}

export interface ToolDefinition {
  id: string
  name: string
  label: string
  category: 'database' | 'seo' | 'serp' | 'editorial' | 'system'
  description: string
  parameters: ToolParameter[]
  enabledByDefault: boolean
  permissionLevel: 'ALL' | 'EDITOR' | 'SUPER_ADMIN'
}

export interface ToolCallExecution {
  id: string
  toolName: string
  label: string
  category: 'database' | 'seo' | 'serp' | 'editorial' | 'system'
  input?: Record<string, any>
  output?: Record<string, any>
  durationMs: number
  status: 'success' | 'warning' | 'error' | 'running' | 'completed'
}

export const UNIMASI_TOOLS_CATALOG: ToolDefinition[] = [
  {
    id: 'db_articles_query',
    name: 'db_articles_query',
    label: 'Kueri Basis Data Artikel (Prisma 8 ORM)',
    category: 'database',
    description: 'Pencarian, pemfilteran, pengambilan detail, dan penghitungan artikel pada basis data PostgreSQL via Prisma 8 (status draft/published, kategori, slug).',
    parameters: [
      {
        name: 'action',
        type: 'string',
        description: 'Jenis aksi kueri: menghitung total ("count"), mendaftar artikel ("list"), mencari berdasarkan kata kunci ("search"), atau mengambil detail spesifik ("get").',
        required: true,
        defaultValue: 'count',
        allowedValues: ['count', 'list', 'search', 'get'],
        example: 'get',
      },
      {
        name: 'slug',
        type: 'string',
        description: 'Slug unik artikel yang ingin diambil detailnya (untuk action: "get").',
        required: false,
        example: 'arsitektur-nextjs-16-modern',
      },
      {
        name: 'keyword',
        type: 'string',
        description: 'Kata kunci pencarian yang dicocokkan pada judul, slug, konten, atau primary keyword artikel.',
        required: false,
        example: 'arsitektur next.js',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Filter status editorial artikel pada database.',
        required: false,
        defaultValue: 'all',
        allowedValues: ['all', 'published', 'draft'],
        example: 'published',
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Batas maksimum baris artikel yang dikembalikan untuk inferensi AI.',
        required: false,
        defaultValue: 5,
        example: 10,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'inspect_article_seo',
    name: 'inspect_article_seo',
    label: 'Inspeksi Real-Time SEO & Keterbacaan Artikel',
    category: 'seo',
    description: 'Pemeriksaan real-time skor SEO (0-100), skor keterbacaan (0-100), rincian indikator masalah Yoast-parity, dan status kelulusan Gerbang Publikasi.',
    parameters: [
      { name: 'slug', type: 'string', description: 'Slug artikel di basis data untuk memuat data dasar awal jika ada.', required: false },
      { name: 'title', type: 'string', description: 'Judul artikel baru atau yang sedang diedit.', required: false },
      { name: 'content', type: 'string', description: 'Isi teks/markdown artikel yang ingin diinspeksi.', required: false },
      { name: 'focusKeyphrase', type: 'string', description: 'Kata kunci fokus utama target SEO.', required: false },
      { name: 'metaTitle', type: 'string', description: 'Judul SEO (40-65 karakter).', required: false },
      { name: 'metaDescription', type: 'string', description: 'Meta description (120-160 karakter).', required: false },
      { name: 'coverAlt', type: 'string', description: 'Alt text cover/hero visual.', required: false },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'suggest_internal_links',
    name: 'suggest_internal_links',
    label: 'Rekomendasi Link Internal Otomatis',
    category: 'seo',
    description: 'Rekomendasi URL internal berbobot tinggi dari katalog layanan, studi kasus portofolio, dan artikel terbitan lengkap dengan variasi anchor text natural.',
    parameters: [
      { name: 'topic', type: 'string', description: 'Topik atau kata kunci untuk pencocokan semantik konten.', required: false },
      { name: 'limit', type: 'number', description: 'Batas jumlah tautan yang disarankan (default 5).', required: false, defaultValue: 5 },
      { name: 'excludeSlug', type: 'string', description: 'Slug artikel saat ini untuk mencegah self-linking.', required: false },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'update_article_content',
    name: 'update_article_content',
    label: 'Pembaruan Konten & SEO Artikel (Prisma 8 ORM)',
    category: 'editorial',
    description: 'Memperbarui judul, konten, meta title, meta description, focus keyphrase, atau alt text artikel secara langsung di basis data PostgreSQL.',
    parameters: [
      {
        name: 'slug',
        type: 'string',
        description: 'Slug artikel target yang akan diperbarui.',
        required: true,
        example: 'arsitektur-nextjs-16-modern',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Judul baru artikel.',
        required: false,
      },
      {
        name: 'content',
        type: 'string',
        description: 'Isi konten lengkap yang telah dioptimasi.',
        required: false,
      },
      {
        name: 'metaTitle',
        type: 'string',
        description: 'Judul SEO baru (40–70 karakter).',
        required: false,
      },
      {
        name: 'metaDescription',
        type: 'string',
        description: 'Meta description baru (120–160 karakter).',
        required: false,
      },
      {
        name: 'focusKeyphrase',
        type: 'string',
        description: 'Kata kunci fokus target.',
        required: false,
      },
      {
        name: 'coverAlt',
        type: 'string',
        description: 'Alt text gambar cover.',
        required: false,
      },
      {
        name: 'excerpt',
        type: 'string',
        description: 'Ringkasan singkat artikel.',
        required: false,
      },
      {
        name: 'category',
        type: 'string',
        description: 'Nama kategori artikel.',
        required: false,
      },
      {
        name: 'tags',
        type: 'string',
        description: 'Daftar tag artikel.',
        required: false,
      },
      {
        name: 'status',
        type: 'string',
        description: 'Status editorial artikel (draft / in_review). Agen dilarang mengubah ke published.',
        required: false,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'EDITOR',
  },
  {
    id: 'db_portfolio_query',
    name: 'db_portfolio_query',
    label: 'Kueri Portofolio & Studi Kasus (Prisma 8 ORM)',
    category: 'database',
    description: 'Pencarian data 15 portofolio & proyek creative engineering klien UNIMASI (stack teknologi, industri, hasil dampak bisnis).',
    parameters: [
      {
        name: 'action',
        type: 'string',
        description: 'Aksi kueri portofolio: "count" untuk jumlah total atau "list" untuk data lengkap.',
        required: false,
        defaultValue: 'list',
        allowedValues: ['count', 'list', 'search'],
        example: 'list',
      },
      {
        name: 'keyword',
        type: 'string',
        description: 'Kata kunci pencarian nama klien, judul proyek, atau teknologi studi kasus.',
        required: false,
        example: 'kalasan valley',
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Batas jumlah studi kasus yang ditampilkan.',
        required: false,
        defaultValue: 5,
        example: 5,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'db_services_query',
    name: 'db_services_query',
    label: 'Katalog Layanan Digital Enterprise (Prisma 8 ORM)',
    category: 'database',
    description: 'Akses kueri 142 katalog layanan UNIMASI (web engineering, AI integration, headless CMS, technical SEO).',
    parameters: [
      {
        name: 'action',
        type: 'string',
        description: 'Aksi kueri layanan: "count" untuk jumlah total layanan atau "list" untuk rincian katalog.',
        required: false,
        defaultValue: 'list',
        allowedValues: ['count', 'list', 'search'],
        example: 'list',
      },
      {
        name: 'keyword',
        type: 'string',
        description: 'Kata kunci pencarian nama layanan atau kategori departemen.',
        required: false,
        example: 'website development',
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Batas jumlah layanan yang diambil.',
        required: false,
        defaultValue: 5,
        example: 10,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'gsc_keyword_intelligence',
    name: 'gsc_keyword_intelligence',
    label: 'Google Search Console & SERP Intelligence',
    category: 'serp',
    description: 'Pemeriksaan performa organik Google Search Console 28 hari (top queries, klik, impresi, CTR, peluang ranking halaman 1-2).',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: 'Batas jumlah kata kunci SERP teratas yang dianalisis.',
        required: false,
        defaultValue: 5,
        example: 10,
      },
      {
        name: 'opportunityFilter',
        type: 'boolean',
        description: 'Filter khusus kueri posisi 8-20 (halaman 2 Google) dengan volume impresi tinggi yang siap dioptimasi ke halaman 1.',
        required: false,
        defaultValue: false,
        example: true,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'EDITOR',
  },
  {
    id: 'technical_seo_audit',
    name: 'technical_seo_audit',
    label: 'Audit Technical SEO Database',
    category: 'seo',
    description: 'Audit otomatis on-page SEO: mendeteksi artikel tanpa meta description, gambar tanpa alt text, dan potensi slug ganda.',
    parameters: [
      {
        name: 'checkType',
        type: 'string',
        description: 'Jenis pengecekan: "all" (semua isu), "missing_meta" (hanya meta deskripsi kosong), atau "duplicates" (potensi duplikasi slug).',
        required: false,
        defaultValue: 'all',
        allowedValues: ['all', 'missing_meta', 'duplicates'],
        example: 'missing_meta',
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Batas jumlah sampel artikel bermasalah yang disertakan dalam laporan rekomendasi.',
        required: false,
        defaultValue: 5,
        example: 10,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'EDITOR',
  },
  {
    id: 'redirect_301_inspector',
    name: 'redirect_301_inspector',
    label: 'Pengawas Redirect 301',
    category: 'seo',
    description: 'Pemeriksaan integritas aturan pengalihan URL legacy ke URL kanonikal Next.js untuk mencegah broken link 404.',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'Path URL lama yang ingin diuji pencocokan aturan 301-nya.',
        required: false,
        example: '/jasa-pembuatan-website-bogor/',
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Batas sampel aturan redirect yang dikembalikan saat inspeksi massal.',
        required: false,
        defaultValue: 5,
        example: 5,
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'ALL',
  },
  {
    id: 'create_article_draft',
    name: 'create_article_draft',
    label: 'Generator Draf Artikel Terproteksi (Rule 8)',
    category: 'editorial',
    description: 'Pembuatan draf artikel mendalam dengan metadata SEO lengkap yang otomatis tersimpan aman ke database PostgreSQL via Prisma 8 sebagai DRAFT.',
    parameters: [
      {
        name: 'topic',
        type: 'string',
        description: 'Topik utama atau tema artikel yang ingin disusun secara komprehensif.',
        required: true,
        example: 'Arsitektur Next.js 16 untuk Aplikasi Enterprise',
      },
      {
        name: 'targetKeyword',
        type: 'string',
        description: 'Kata kunci target SEO utama yang akan dioptimasi pada judul, heading, dan konten artikel.',
        required: false,
        example: 'arsitektur nextjs enterprise',
      },
      {
        name: 'audience',
        type: 'string',
        description: 'Sasaran pembaca / target demografi artikel.',
        required: false,
        defaultValue: 'Pengembang Web & CTO',
        example: 'CTO, Tech Lead & Enterprise Architect',
      },
    ],
    enabledByDefault: true,
    permissionLevel: 'EDITOR',
  },
  {
    id: 'system_health_inspector',
    name: 'system_health_inspector',
    label: 'Diagnostik Kesehatan Sistem Platform',
    category: 'system',
    description: 'Inspeksi performa latensi basis data PostgreSQL via Prisma 8 (<2ms), status memori server, dan arsitektur Next.js 16.',
    parameters: [],
    enabledByDefault: true,
    permissionLevel: 'SUPER_ADMIN',
  },
]

export const SEGIA_TOOLS_CATALOG = UNIMASI_TOOLS_CATALOG
