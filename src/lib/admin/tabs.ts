import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FileText,
  Files,
  Briefcase,
  Boxes,
  Blocks,
  Image as ImageIcon,
  Megaphone,
  Target,
  ShieldCheck,
  Gauge,
  TrendingUp,
  ArrowRightLeft,
  History,
  CalendarDays,
  Server,
  Plug,
  Shield,
  Settings,
  Crown,
  Edit3,
  PenTool,
  SearchCheck,
  PenSquare,
  Users,
  Building2,
  Clapperboard,
} from 'lucide-react'
import type { Role } from '@/lib/auth/types'

/**
 * Single source of truth for Studio Admin tabs.
 * `src/app/admin/page.tsx` derives its valid `?tab=` values from here and the
 * nav rail in `src/app/admin/layout.tsx` renders `NAV_GROUPS`.
 */
export const ADMIN_TABS = [
  'overview',
  'articles',
  'pages',
  'portfolio',
  'services',
  'blocks',
  'clients',
  'media',
  'cta',
  'calendar',
  'keywords',
  'audit',
  'perf',
  'gsc',
  'redirects',
  'migration',
  'system',
  'mcp',
  'users',
  'settings',
] as const

export type AdminTab = (typeof ADMIN_TABS)[number]

export const isAdminTab = (v: string | null | undefined): v is AdminTab =>
  typeof v === 'string' && (ADMIN_TABS as readonly string[]).includes(v)

/** Old `?tab=` values that still resolve to a current tab (bookmarks, old links). */
const LEGACY_TAB_ALIASES: Record<string, AdminTab> = {
  roles: 'users',
}

/** Resolve a raw `?tab=` value to a tab; unknown values fall back to the overview. */
export function resolveAdminTab(raw: string | null | undefined): AdminTab {
  if (isAdminTab(raw)) return raw
  if (raw && raw in LEGACY_TAB_ALIASES) return LEGACY_TAB_ALIASES[raw]
  return 'overview'
}

export interface TabMeta {
  label: string
  description: string
  icon: LucideIcon
  /** When set, only these roles see the tab in the nav (the API still enforces access). */
  roles?: readonly Role[]
}

const USER_ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN', 'CONTENT_ADMIN']

export const TAB_META: Record<AdminTab, TabMeta> = {
  overview: { label: 'Ringkasan', description: 'Jumlah konten dan status database saat ini.', icon: LayoutDashboard },
  articles: { label: 'Artikel', description: 'Kelola artikel, status editorial, metadata, dan tautan internal.', icon: FileText },
  pages: { label: 'Halaman', description: 'Susun halaman situs dari blok konten.', icon: Files },
  portfolio: { label: 'Portofolio', description: 'Studi kasus dan katalog proyek.', icon: Briefcase },
  services: { label: 'Layanan', description: 'Kategori layanan beserta layanan turunannya.', icon: Boxes },
  blocks: { label: 'Blok', description: 'Katalog blok konten beserta skemanya.', icon: Blocks },
  clients: { label: 'Logo klien', description: 'Logo klien dan mitra yang tampil di situs.', icon: Building2 },
  media: { label: 'Media', description: 'Pustaka gambar, teks alternatif, dan optimasi WebP.', icon: ImageIcon },
  cta: { label: 'Blok CTA', description: 'Preset ajakan bertindak untuk artikel, layanan, dan portofolio.', icon: Megaphone },
  calendar: { label: 'Kalender', description: 'Jadwal terbit semua tipe konten dalam WIB.', icon: CalendarDays },
  keywords: { label: 'Keyword', description: 'Bank keyword dan peluang kueri dari Search Console.', icon: Target },
  audit: { label: 'Audit SEO', description: 'Audit data internal sebelum terbit dan crawler situs produksi.', icon: ShieldCheck },
  perf: { label: 'Performa', description: 'Lighthouse, Core Web Vitals, dan pengiriman IndexNow.', icon: Gauge },
  gsc: { label: 'Search Console', description: 'Performa pencarian, kueri, dan peluang CTR.', icon: TrendingUp },
  redirects: { label: 'Redirect', description: 'Aturan 301 untuk URL yang dipindahkan.', icon: ArrowRightLeft },
  migration: { label: 'URL lama', description: 'Pemetaan URL lama ke rute baru.', icon: History },
  system: { label: 'Sistem', description: 'Koneksi PostgreSQL dan jumlah data per tabel.', icon: Server },
  mcp: { label: 'MCP', description: 'Server MCP dan konfigurasi klien agen.', icon: Plug },
  users: {
    label: 'Pengguna',
    description: 'Akun studio, peran tim editorial, dan hak akses.',
    icon: Users,
    roles: USER_ADMIN_ROLES,
  },
  settings: { label: 'Pengaturan', description: 'Konfigurasi global situs dan SEO.', icon: Settings },
}

export const WRITE_ARTICLE_META: TabMeta = {
  label: 'Tulis artikel',
  description: 'Editor blok untuk artikel baru.',
  icon: PenSquare,
}

export interface NavGroup {
  id: string
  /** Visible heading when the rail is expanded; also the group's accessible name. */
  label: string
  tabs: AdminTab[]
}

export const NAV_GROUPS: NavGroup[] = [
  { id: 'content', label: 'Konten', tabs: ['overview', 'articles', 'pages', 'portfolio', 'services', 'blocks', 'clients', 'media', 'cta', 'calendar'] },
  { id: 'seo', label: 'SEO', tabs: ['keywords', 'audit', 'perf', 'gsc', 'redirects', 'migration'] },
  { id: 'engine', label: 'Sistem & integrasi', tabs: ['system', 'mcp'] },
  { id: 'governance', label: 'Tata kelola', tabs: ['users', 'settings'] },
]

export const canSeeTab = (tab: AdminTab, role: Role | null | undefined): boolean => {
  const allowed = TAB_META[tab].roles
  return !allowed || (role != null && allowed.includes(role))
}

export const tabHref = (tab: AdminTab) => (tab === 'overview' ? '/admin' : `/admin?tab=${tab}`)

export interface RoleMeta {
  label: string
  description: string
  icon: LucideIcon
  badge: string
}

export const ROLE_META: Record<Role, RoleMeta> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Kontrol penuh sistem, pengguna, dan penghapusan konten.',
    icon: Crown,
    badge: 'bg-accent-400/15 text-accent-300 border-accent-400/40',
  },
  CONTENT_ADMIN: {
    label: 'Content Admin',
    description: 'Mengelola seluruh konten, redirect 301, pengguna, dan publikasi.',
    icon: Shield,
    badge: 'bg-sky-400/10 text-sky-200 border-sky-400/40',
  },
  EDITOR: {
    label: 'Editor',
    description: 'Meninjau draf, menyetujui, dan menerbitkan artikel.',
    icon: Edit3,
    badge: 'bg-indigo-400/10 text-indigo-200 border-indigo-400/40',
  },
  REVIEWER: {
    label: 'Reviewer',
    description: 'Memeriksa draf. Bisa menyetujui atau meminta revisi.',
    icon: SearchCheck,
    badge: 'bg-amber-400/10 text-amber-200 border-amber-400/40',
  },
  AUTHOR: {
    label: 'Author',
    description: 'Membuat draf dan mengajukan review. Tidak bisa menerbitkan.',
    icon: PenTool,
    badge: 'bg-white/5 text-neutral-200 border-white/25',
  },
  SEO_MANAGER: {
    label: 'SEO Manager',
    description: 'Mengelola metadata pencarian, audit, dan aturan 301.',
    icon: TrendingUp,
    badge: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/40',
  },
  MEDIA_MANAGER: {
    label: 'Media Manager',
    description: 'Mengelola pustaka media dan teks alternatif gambar.',
    icon: Clapperboard,
    badge: 'bg-purple-400/10 text-purple-200 border-purple-400/40',
  },
}

export const ROLE_ORDER: readonly Role[] = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'EDITOR',
  'REVIEWER',
  'AUTHOR',
  'SEO_MANAGER',
  'MEDIA_MANAGER',
]

export const isRole = (v: unknown): v is Role =>
  typeof v === 'string' && (ROLE_ORDER as readonly string[]).includes(v)

/** Look up role metadata for an untrusted role string (falls back to Author). */
export const roleMetaFor = (role: unknown): RoleMeta => (isRole(role) ? ROLE_META[role] : ROLE_META.AUTHOR)
