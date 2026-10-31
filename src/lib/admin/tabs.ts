import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Boxes,
  Sparkles,
  Image as ImageIcon,
  Megaphone,
  Target,
  ShieldCheck,
  Gauge,
  TrendingUp,
  ArrowRightLeft,
  History,
  Bot,
  Sliders,
  Download,
  Server,
  Shield,
  Settings,
  Crown,
  Edit3,
  PenTool,
  SearchCheck,
  PenSquare,
  Users,
} from 'lucide-react'

export const ADMIN_TABS = [
  'overview',
  'articles',
  'portfolio',
  'services',
  'solutions',
  'blocks',
  'media',
  'cta',
  'keywords',
  'audit',
  'perf',
  'gsc',
  'redirects',
  'migration',
  'ai',
  'ai-settings',
  'import',
  'system',
  'users',
  'settings',
] as const

export type AdminTab = (typeof ADMIN_TABS)[number]

export const isAdminTab = (v: string | null | undefined): v is AdminTab =>
  !!v && (ADMIN_TABS as readonly string[]).includes(v)

export interface TabMeta {
  label: string
  description: string
  icon: LucideIcon
}

export const TAB_META: Record<AdminTab, TabMeta> = {
  overview: { label: 'Ringkasan', description: 'Metrik konten, perlindungan migrasi SEO, dan status platform.', icon: LayoutDashboard },
  articles: { label: 'Artikel', description: 'Kelola artikel, status editorial, metadata, dan tautan internal.', icon: FileText },
  portfolio: { label: 'Portofolio', description: 'Studi kasus dan katalog proyek interaktif.', icon: Briefcase },
  services: { label: 'Layanan', description: 'Departemen layanan beserta layanan turunannya.', icon: Boxes },
  solutions: { label: 'Solusi', description: 'Solusi bisnis, venue, dan finder quiz.', icon: Sparkles },
  blocks: { label: 'Blok Elemen', description: 'Katalog dynamic block contracts, schema variabel, animasi, dan AI agent blueprints.', icon: Boxes },
  media: { label: 'Media', description: 'Pustaka gambar, rename otomatis dengan 301, audit alt-text, dan optimasi WebP.', icon: ImageIcon },
  cta: { label: 'Blok CTA', description: 'Preset ajakan bertindak yang bisa disisipkan di artikel, layanan, dan portofolio.', icon: Megaphone },
  keywords: { label: 'Keyword', description: 'Bank keyword dan peluang kueri dari data GSC.', icon: Target },
  audit: { label: 'Audit SEO', description: 'Audit data internal pra-terbit (Lapis 1) dan crawler situs produksi (Lapis 2).', icon: ShieldCheck },
  perf: { label: 'Performa', description: 'Lighthouse, Core Web Vitals (LCP, INP, CLS), dan pengiriman IndexNow.', icon: Gauge },
  gsc: { label: 'Search Console', description: 'Performa SERP, kata kunci bernilai tinggi, dan peluang CTR.', icon: TrendingUp },
  redirects: { label: 'Redirect', description: 'Aturan 301 menjaga otoritas domain dan mencegah error 404.', icon: ArrowRightLeft },
  migration: { label: 'URL Legacy', description: 'Pemetaan URL WordPress lama, redirect, dan hasil pemeriksaan HTTP.', icon: History },
  ai: { label: 'Asisten AI', description: 'Asisten dengan akses database lokal, analitik GSC, dan alur draf yang aman.', icon: Bot },
  'ai-settings': { label: 'Pengaturan AI', description: 'Penyedia AI, model inferensi, dan tools bawaan platform.', icon: Sliders },
  import: { label: 'Impor WordPress', description: 'Migrasi artikel, kategori, dan media dari REST API atau file XML.', icon: Download },
  system: { label: 'Sistem', description: 'Kesehatan database, sinkronisasi data, dan server MCP.', icon: Server },
  users: { label: 'Pengguna', description: 'Kelola akun pengguna studio, peran tim editorial, dan kredensial akses.', icon: Users },
  settings: { label: 'Pengaturan', description: 'Konfigurasi global situs dan SEO.', icon: Settings },
}

export const WRITE_ARTICLE_META: TabMeta = {
  label: 'Tulis artikel',
  description: 'Studio blok dan editor penuh untuk artikel baru.',
  icon: PenSquare,
}

/** Groups are separated by a divider in the nav rail (no text headings needed). */
export const NAV_GROUPS: { id: string; tabs: AdminTab[] }[] = [
  { id: 'content', tabs: ['overview', 'articles', 'portfolio', 'services', 'solutions', 'blocks', 'media', 'cta'] },
  { id: 'seo', tabs: ['keywords', 'audit', 'perf', 'gsc', 'redirects', 'migration'] },
  { id: 'ai', tabs: ['ai-settings'] },
  { id: 'engine', tabs: ['import', 'system'] },
  { id: 'governance', tabs: ['users', 'settings'] },
]

export const tabHref = (tab: AdminTab) => (tab === 'overview' ? '/admin' : `/admin?tab=${tab}`)

export interface RoleMeta {
  label: string
  description: string
  icon: LucideIcon
  badge: string
  canPublish: boolean
  canDelete: boolean
}

export const ROLE_META: Record<string, RoleMeta> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Kontrol penuh sistem, database, deployment, dan penghapusan artikel.',
    icon: Crown,
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    canPublish: true,
    canDelete: true,
  },
  CONTENT_ADMIN: {
    label: 'Content Admin',
    description: 'Mengelola seluruh konten, audit URL, redirect 301, dan publikasi.',
    icon: Shield,
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    canPublish: true,
    canDelete: true,
  },
  EDITOR: {
    label: 'Editor',
    description: 'Meninjau draf, menyetujui konten, dan menerbitkan artikel yang sudah approved.',
    icon: Edit3,
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    canPublish: true,
    canDelete: false,
  },
  REVIEWER: {
    label: 'Reviewer',
    description: 'Memvalidasi kelayakan draf. Berhak menyetujui atau meminta revisi.',
    icon: SearchCheck,
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    canPublish: false,
    canDelete: false,
  },
  AUTHOR: {
    label: 'Author',
    description: 'Membuat draf dan mengajukan review. Tidak bisa menerbitkan langsung.',
    icon: PenTool,
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    canPublish: false,
    canDelete: false,
  },
  SEO_MANAGER: {
    label: 'SEO Manager',
    description: 'Mengelola metadata penelusuran, audit sitemap, dan aturan 301.',
    icon: TrendingUp,
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    canPublish: false,
    canDelete: false,
  },
}
