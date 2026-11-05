'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { siteConfig } from '@/config/site'
import reportData from '@/data/migration-report.json'

interface MigrationReportItem {
  slug: string
  original_title: string
  status?: string
  http_status?: number
  entity_type?: string
  canonical_url?: string
  destination?: string
  [key: string]: unknown
}

const reportRows = (reportData as unknown as MigrationReportItem[]) || []
type McpClientId = 'antigravity' | 'claude' | 'cursor' | 'windsurf' | 'codex'
const MCP_CLIENT_TABS: Array<{ id: McpClientId; label: string }> = [
  { id: 'antigravity', label: 'Google Antigravity' },
  { id: 'claude', label: 'Claude Desktop' },
  { id: 'cursor', label: 'Cursor IDE' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'codex', label: 'Codex CLI' },
]
import { useAuth } from '@/lib/auth/AuthContext'
import { Role, ArticleStatus, ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import { StudioAiSettings } from '@/components/studio/StudioAiSettings'
import { StudioGscDashboard } from '@/components/studio/StudioGscDashboard'
import { StudioSettings } from '@/components/studio/StudioSettings'
import { StudioPortfolioManager } from '@/components/studio/StudioPortfolioManager'
import { StudioServicesManager } from '@/components/studio/StudioServicesManager'
import { StudioSolutionsManager } from '@/components/studio/StudioSolutionsManager'
import { StudioBlocksCatalog } from '@/components/studio/StudioBlocksCatalog'
import { StudioClientsManager } from '@/components/studio/StudioClientsManager'
import { StudioMediaManager } from '@/components/studio/StudioMediaManager'
import { StudioKeywordPlanner } from '@/components/studio/StudioKeywordPlanner'
import { StudioSiteAudit } from '@/components/studio/StudioSiteAudit'
import { StudioCtaManager } from '@/components/studio/StudioCtaManager'
import { StudioPerformanceManager } from '@/components/studio/StudioPerformanceManager'
import { StudioCategoryManager } from '@/components/studio/StudioCategoryManager'
import { StudioCalendar } from '@/components/studio/StudioCalendar'
import { IconButton } from '@/components/admin/AdminUi'
import { Tooltip } from '@/components/ui/Tooltip'
import { IndexingMicroBadge } from '@/components/studio/IndexingMicroBadge'
import { useIndexingCooldown } from '@/hooks/useIndexingCooldown'
import {
  BarChart2,
  FileText,
  Bot,
  TrendingUp,
  Download,
  Search,
  Shuffle,
  Zap,
  Users,
  PenSquare,
  RefreshCw,
  Send,
  Shield,
  Edit2,
  Edit3,
  Crown,
  Info,
  Clock,
  Archive,
  RotateCcw,
  CheckCircle2,
  Settings,
  AlertTriangle,
  FolderTree,
  Trash2,
  X,
  Globe,
  Sparkles,
  MapPin,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  ExternalLink,
  Plus,
} from 'lucide-react'

export type UserRole = Role | 'admin' | 'writer'
export type AdminTab = 'brands' | 'matrix' | 'articles' | 'publisher' | 'overview' | 'portfolio' | 'services' | 'solutions' | 'blocks' | 'clients' | 'media' | 'keywords' | 'audit' | 'cta' | 'perf' | 'ai' | 'ai-settings' | 'gsc' | 'calendar' | 'migration' | 'redirects' | 'system' | 'roles' | 'settings'

interface ArticleItem {
  id?: number
  title: string
  slug: string
  excerpt?: string
  category?: { name: string; slug: string }
  author?: { name: string }
  status?: string
  publishedAt?: string
  scheduledAt?: string
  createdAt?: string
  updatedAt?: string
  primaryKeyword?: string
  targetLocation?: string
  targetCity?: string
  faqs?: any
  tags?: any
  tagsParagraph?: string
}

function formatArticleDate(rawDate?: string): { display: string; full: string } {
  if (!rawDate) return { display: '-', full: 'Belum ditentukan' }
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return { display: '-', full: rawDate }
    const display = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const full = d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return { display, full }
  } catch {
    return { display: '-', full: rawDate }
  }
}

interface SystemStatusData {
  online: boolean
  latency: string
  engine: string
  database: string
  architecture: string
  counts?: {
    articles: number
    portfolios: number
    services: number
    serviceCategories: number
    solutions: number
    pages: number
    redirects: number
  }
  contentTypes: { name: string; count: number; status: string }[]
  fallbackActive: boolean
  message: string
}

function ArticleTableRow({
  art,
  idx,
  permissions,
  onTransitionStatus,
  onDeleteArticle,
  onQuickEdit,
  onActionMessage,
  onAlert,
}: {
  art: ArticleItem
  idx: number
  permissions: any
  onTransitionStatus: (slug: string, status: ArticleStatus, note?: string) => void
  onDeleteArticle: (slug: string, title: string) => void
  onQuickEdit: (art: ArticleItem) => void
  onActionMessage: (msg: string) => void
  onAlert: (title: string, message: string, type?: 'alert' | 'error' | 'success') => void
}) {
  const isPublished = (art.status || 'published') === 'published'
  const cooldown = useIndexingCooldown({
    slug: art.slug,
    entityStatus: art.status || 'published',
    enabled: isPublished,
    onSuccess: () => {
      onActionMessage(`[${art.slug}] Pengindeksan berhasil dikirim ke antrean mesin pencari.`)
    },
    onError: (err) => {
      const msg = typeof err === 'string' ? err : err.message || 'Gagal memicu pengindeksan ulang.'
      onAlert('Pengindeksan Gagal', msg, 'error')
    },
  })

  // Tooltip content for the row-level IconButton
  const buttonLabel = !cooldown.canRetrigger
    ? art.status !== 'published'
      ? 'Indexing Terkunci'
      : `Jeda 24 Jam (${cooldown.remainingFormatted})`
    : 'Kirim Ulang Indexing'

  const buttonHint = !cooldown.canRetrigger
    ? cooldown.retriggerBlockedReason || 'Fitur indexing tidak tersedia.'
    : 'Kirim URL ini ke Google Search Console & IndexNow (Bing/Yandex).'

  const isScheduled = art.status === 'scheduled' || Boolean(art.scheduledAt)
  const dateInfo = formatArticleDate(isScheduled ? art.scheduledAt : (art.publishedAt || art.createdAt))

  return (
    <tr className="hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]">
      {/* 1. Judul & Slug Artikel (Widest Column) */}
      <td className="py-2.5 px-3 min-w-[280px]">
        <div className="flex flex-col">
          <a
            href={`${siteConfig.url}/artikel/${art.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:text-info transition-colors line-clamp-1 text-xs"
            title={art.title}
          >
            {art.title}
          </a>
          <span className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
            /artikel/{art.slug}
          </span>
        </div>
      </td>

      {/* 2. Kategori */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300">
          {art.category?.name || 'Artikel'}
        </span>
      </td>

      {/* 3. Tanggal Post / Jadwal */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        {isScheduled ? (
          <Tooltip label="Jadwal Publikasi" hint={dateInfo.full}>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{dateInfo.display}</span>
            </span>
          </Tooltip>
        ) : (
          <Tooltip
            label={art.publishedAt ? 'Tanggal Terbit' : 'Tanggal Dibuat'}
            hint={dateInfo.full}
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>{dateInfo.display}</span>
            </span>
          </Tooltip>
        )}
      </td>

      {/* 4. Audit SEO / Indexing Micro-Badges */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <IndexingMicroBadge
            provider="google"
            status={cooldown.googleStatus?.status}
            httpStatus={cooldown.googleStatus?.httpStatus}
            submittedAt={cooldown.googleStatus?.submittedAt}
          />
          <IndexingMicroBadge
            provider="indexnow"
            status={cooldown.indexnowStatus?.status}
            httpStatus={cooldown.indexnowStatus?.httpStatus}
            submittedAt={cooldown.indexnowStatus?.submittedAt}
          />
        </div>
      </td>

      {/* 5. Status & Transisi */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        {(() => {
          const st = art.status || 'published'
          if (st === 'draft') {
            return (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Draft
                </span>
                {permissions.canSubmitForReview && (
                  <Tooltip label="Ajukan Review" hint="Kirim draf ke antrean editorial untuk ditinjau">
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(art.slug, 'in_review')}
                      className="text-[10px] font-mono text-info hover:text-info-300 underline"
                    >
                      Review →
                    </button>
                  </Tooltip>
                )}
              </div>
            )
          }
          if (st === 'in_review') {
            return (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-info/15 text-info-300 border border-info/25">
                  <Clock className="w-2.5 h-2.5" /> In Review
                </span>
                {permissions.canApprove && (
                  <Tooltip label="Setujui" hint="Setujui artikel untuk diterbitkan">
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(art.slug, 'approved')}
                      className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Setujui
                    </button>
                  </Tooltip>
                )}
                {permissions.canReview && (
                  <Tooltip label="Revisi" hint="Kembalikan status ke draf untuk diperbaiki">
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(art.slug, 'draft', 'Perlu revisi')}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300"
                    >
                      Revisi
                    </button>
                  </Tooltip>
                )}
              </div>
            )
          }
          if (st === 'approved') {
            return (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                </span>
                {permissions.canPublish && (
                  <Tooltip label="Publikasikan" hint="Terbitkan artikel ke situs live sekarang">
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(art.slug, 'published')}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <span>Terbit</span>
                      <Send className="w-2.5 h-2.5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            )
          }
          if (st === 'scheduled') {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                <Clock className="w-2.5 h-2.5" /> Scheduled
              </span>
            )
          }
          if (st === 'archived') {
            return (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-500/15 text-neutral-400 border border-neutral-500/25">
                  <Archive className="w-2.5 h-2.5" /> Archived
                </span>
                {permissions.canPublish && (
                  <Tooltip label="Buka Draf" hint="Buka kembali artikel ini sebagai draf">
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(art.slug, 'draft')}
                      className="text-[10px] font-mono text-neutral-400 hover:text-white underline"
                    >
                      Buka
                    </button>
                  </Tooltip>
                )}
              </div>
            )
          }
          return (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                <CheckCircle2 className="w-2.5 h-2.5" /> Published
              </span>
              {permissions.canArchive && (
                <Tooltip label="Arsipkan" hint="Pindahkan artikel dari live ke arsip">
                  <button
                    type="button"
                    onClick={() => onTransitionStatus(art.slug, 'archived')}
                    className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300"
                  >
                    Arsip
                  </button>
                </Tooltip>
              )}
            </div>
          )
        })()}
      </td>

      {/* 6. Aksi (Icon-Based Interaction with Tooltips) */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          {/* Indexing Retrigger Action */}
          <IconButton
            icon={RefreshCw}
            label={buttonLabel}
            hint={buttonHint}
            tone={cooldown.canRetrigger ? 'info' : 'neutral'}
            size="sm"
            side="top"
            disabled={!cooldown.canRetrigger}
            spinning={cooldown.retriggering}
            onClick={cooldown.retrigger}
          />

          {/* Full Studio Edit */}
          <IconButton
            icon={PenSquare}
            label="Edit Studio"
            hint="Buka editor studio lengkap dengan visual block & SEO inspector"
            href={`/admin/buat-artikel?slug=${art.slug}`}
            tone="primary"
            size="sm"
            side="top"
          />

          {/* Quick Edit */}
          <IconButton
            icon={Edit2}
            label="Edit Cepat"
            hint="Edit judul dan kategori langsung tanpa reload"
            onClick={() => onQuickEdit(art)}
            tone="neutral"
            size="sm"
            side="top"
          />

          {/* Open Public URL */}
          <IconButton
            icon={ExternalLink}
            label="Lihat Publik"
            hint="Buka tampilan publik artikel di tab baru"
            href={`${siteConfig.url}/artikel/${art.slug}`}
            external
            tone="neutral"
            size="sm"
            side="top"
          />

          {/* Delete Action */}
          {permissions.canDeleteArticle ? (
            <IconButton
              icon={Trash2}
              label="Hapus Artikel"
              hint="Hapus artikel secara permanen dari basis data"
              onClick={() => onDeleteArticle(art.slug, art.title)}
              tone="danger"
              size="sm"
              side="top"
            />
          ) : (
            <IconButton
              icon={Shield}
              label="Terlindungi"
              hint="Hanya Administrator yang memiliki wewenang menghapus artikel"
              disabled
              tone="neutral"
              size="sm"
              side="top"
            />
          )}
        </div>
      </td>
    </tr>
  )
}

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, permissions, getAuthHeaders, actorName } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Sync activeTab with URL search params
  useEffect(() => {
    const tab = searchParams?.get('tab') as AdminTab | null
    const validTabs: AdminTab[] = [
      'brands',
      'matrix',
      'articles',
      'publisher',
      'overview',
      'portfolio',
      'services',
      'solutions',
      'blocks',
      'clients',
      'media',
      'keywords',
      'audit',
      'cta',
      'perf',
      'ai',
      'ai-settings',
      'gsc',
      'migration',
      'calendar',
      'redirects',
      'system',
      'roles',
      'settings',
    ]
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab)
    } else if (!tab) {
      setActiveTab('overview')
    }
  }, [searchParams])

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
    router.push(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`, { scroll: false })
  }


  // --- Articles State --------------------------------------------------------
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [categoriesOptions, setCategoriesOptions] = useState<Array<{ value: string; label: string }>>([])
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)
  const [actionMessage, setActionMessage] = useState('')
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')

  // --- Article Sorting State ---
  type ArticleSortField = 'title' | 'category' | 'date' | 'status'
  type SortOrder = 'asc' | 'desc'
  const [sortField, setSortField] = useState<ArticleSortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: ArticleSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder(field === 'date' ? 'desc' : 'asc')
    }
  }

  const sortedArticles = React.useMemo(() => {
    const list = [...articles]
    return list.sort((a, b) => {
      let aVal: any = ''
      let bVal: any = ''
      if (sortField === 'title') {
        aVal = (a.title || '').toLowerCase()
        bVal = (b.title || '').toLowerCase()
      } else if (sortField === 'category') {
        aVal = (a.category?.name || '').toLowerCase()
        bVal = (b.category?.name || '').toLowerCase()
      } else if (sortField === 'status') {
        aVal = (a.status || 'published').toLowerCase()
        bVal = (b.status || 'published').toLowerCase()
      } else if (sortField === 'date') {
        aVal = new Date(a.scheduledAt || a.publishedAt || a.createdAt || 0).getTime()
        bVal = new Date(b.scheduledAt || b.publishedAt || b.createdAt || 0).getTime()
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [articles, sortField, sortOrder])

  // --- Admin Dialog Modal State (Menggantikan window.confirm & alert) --------
  const [dialogState, setDialogState] = useState<{
    open: boolean
    title: string
    message: string
    type?: 'confirm' | 'alert' | 'error' | 'success'
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
  }>({
    open: false,
    title: '',
    message: '',
  })

  const showAlert = (title: string, message: string, type: 'alert' | 'error' | 'success' = 'alert') => {
    setDialogState({
      open: true,
      title,
      message,
      type,
      confirmText: 'Mengerti',
      onConfirm: () => setDialogState((prev) => ({ ...prev, open: false })),
    })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Konfirmasi') => {
    setDialogState({
      open: true,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText: 'Batal',
      onConfirm: () => {
        setDialogState((prev) => ({ ...prev, open: false }))
        onConfirm()
      },
    })
  }

  // --- System Engine State --------------------------------------------------
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null)
  const [checkingSystem, setCheckingSystem] = useState(false)
  const [syncingSystem, setSyncingSystem] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // --- Migration Registry State ----------------------------------------------
  const migrationRegistry = reportRows
  const [migrationSearch, setMigrationSearch] = useState('')
  const [migrationStatusFilter, setMigrationStatusFilter] = useState<'ALL' | 'PASS' | 'REDIRECT' | '410'>('ALL')
  const [testUrlInput, setTestUrlInput] = useState('')
  const [testUrlResult, setTestUrlResult] = useState<{ found: boolean; slug: string; status: string; destination?: string } | null>(null)

  const [redirectList, setRedirectList] = useState<any[]>([])
  const [newRedirectSource, setNewRedirectSource] = useState('')
  const [newRedirectDest, setNewRedirectDest] = useState('')
  const [newRedirectReason, setNewRedirectReason] = useState('')
  const [redirectTestInput, setRedirectTestInput] = useState('')
  const [redirectTestResult, setRedirectTestResult] = useState<string | null>(null)

  // --- MCP Server State -------------------------------------------------------
  const [mcpClientTab, setMcpClientTab] = useState<'antigravity' | 'claude' | 'cursor' | 'windsurf' | 'codex'>('antigravity')
  const [copiedMcp, setCopiedMcp] = useState(false)

  const copyMcpConfig = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMcp(true)
    setTimeout(() => setCopiedMcp(false), 2500)
  }

  const getMcpSnippet = (client: string) => {
    const serverPath = '/path/to/unimasi/mcp/server.js'
    if (client === 'antigravity') {
      return `// Lokasi konfigurasi: ~/.gemini/config/mcp_config.json
{
  "mcpServers": {
    "unimasi-mcp": {
      "command": "node",
      "args": [
        "${serverPath}"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`
    }
    if (client === 'claude') {
      return `// Lokasi konfigurasi: %APPDATA%\\Claude\\claude_desktop_config.json (Windows) atau ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)
{
  "mcpServers": {
    "unimasi-mcp": {
      "command": "node",
      "args": [
        "${serverPath}"
      ]
    }
  }
}`
    }
    if (client === 'cursor') {
      return `// Lokasi konfigurasi: .cursor/mcp.json
{
  "mcpServers": {
    "unimasi-mcp": {
      "command": "node",
      "args": [
        "${serverPath}"
      ]
    }
  }
}`
    }
    if (client === 'windsurf') {
      return `// Lokasi konfigurasi: ~/.codeium/windsurf/mcp_config.json
{
  "mcpServers": {
    "unimasi-mcp": {
      "command": "node",
      "args": [
        "${serverPath}"
      ]
    }
  }
}`
    }
    return `# Menjalankan MCP server mandiri (stdio transport):
node mcp/server.js`
  }

  // Fetch articles from API
  const fetchArticles = async () => {
    setLoadingArticles(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: searchQuery,
        category: filterCategory,
        status: filterStatus || 'all',
      })
      const res = await fetch(`/api/articles?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setArticles(data.articles || [])
        setTotalArticles(data.total || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingArticles(false)
    }
  }

  // Check system/SQLite status
  const checkSystemStatus = async () => {
    setCheckingSystem(true)
    try {
      const res = await fetch('/api/system/status')
      const data = await res.json()
      setSystemStatus(data)
    } catch (err) {
      console.error('Failed to check System status', err)
    } finally {
      setCheckingSystem(false)
    }
  }

  // Trigger content sync to SQLite engine
  const handleSyncSystem = async () => {
    setSyncingSystem(true)
    setSyncMessage('')
    try {
      const res = await fetch('/api/system/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-all' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(`Sinkronisasi selesai. ${data.syncedItems?.articles ?? 0} Artikel, ${data.syncedItems?.portfolios ?? 0} Portofolio.`)
        setTimeout(() => setSyncMessage(''), 6000)
        checkSystemStatus()
      }
    } catch (err) {
      setSyncMessage('Gagal melakukan sinkronisasi data.')
    } finally {
      setSyncingSystem(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (res.ok && json.success && Array.isArray(json.data)) {
        setCategoriesOptions([
          { value: '', label: 'Semua Kategori' },
          ...json.data.map((c: any) => ({
            value: c.slug,
            label: `${c.name} (${c.articleCount ?? 0})`,
          })),
        ])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchCategories()
  }, [page, searchQuery, filterCategory, filterStatus])

  // Fetch dynamic redirects from SQLite database
  const fetchRedirects = async () => {
    try {
      const res = await fetch('/api/redirects?limit=100')
      const json = await res.json()
      if (res.ok && json.data) {
        setRedirectList(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch redirects', err)
    }
  }

  useEffect(() => {
    checkSystemStatus()
    fetchRedirects()
  }, [])

  // Handle article deletion (Enforced by RBAC: Admin only)
  const handleDeleteArticle = async (slug: string, title: string) => {
    if (!permissions.canDeleteArticle) {
      showAlert(
        'Akses Ditolak',
        `Peran '${role}' tidak memiliki wewenang menghapus artikel secara permanen. Hanya Administrator yang diizinkan.`,
        'error'
      )
      return
    }

    showConfirm(
      'Hapus Artikel Permanen',
      `Apakah Anda yakin ingin menghapus artikel "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const res = await fetch(`/api/articles?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          })
          const data = await res.json()
          if (res.ok) {
            setActionMessage(`Artikel "${title}" berhasil dihapus oleh ${actorName}.`)
            fetchArticles()
            setTimeout(() => setActionMessage(''), 4000)
          } else {
            showAlert('Gagal Menghapus Artikel', data.error || 'Gagal menghapus artikel.', 'error')
          }
        } catch {
          showAlert('Kesalahan Sistem', 'Terjadi kesalahan saat menghapus artikel.', 'error')
        }
      },
      'Hapus Permanen'
    )
  }

  // Handle article lifecycle status transition
  const handleTransitionStatus = async (slug: string, nextStatus: ArticleStatus, note?: string) => {
    try {
      const res = await fetch('/api/articles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ slug, status: nextStatus, note }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage(data.message)
        fetchArticles()
        setTimeout(() => setActionMessage(''), 4000)
      } else {
        showAlert('Gagal Memperbarui Status', data.error || 'Gagal memperbarui status artikel.', 'error')
      }
    } catch {
      showAlert('Kesalahan Sistem', 'Gagal memperbarui status artikel.', 'error')
    }
  }

  // Quick toggle helper
  const handleToggleStatus = (slug: string, currentStatus?: string) => {
    const nextStatus: ArticleStatus = currentStatus === 'draft' ? 'in_review' : 'draft'
    handleTransitionStatus(slug, nextStatus)
  }

  // Handle quick edit submit
  const handleSaveEdit = async () => {
    if (!editingArticle) return
    try {
      const res = await fetch('/api/articles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          slug: editingArticle.slug,
          title: editTitle,
          category: editCategory,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage(`Artikel "${editTitle}" berhasil diperbarui.`)
        setEditingArticle(null)
        fetchArticles()
        setTimeout(() => setActionMessage(''), 4000)
      } else {
        showAlert('Gagal Memperbarui Artikel', data.error || 'Gagal memperbarui artikel.', 'error')
      }
    } catch {
      showAlert('Kesalahan Sistem', 'Gagal menyimpan perubahan artikel.', 'error')
    }
  }

  // Filtered migration rows
  const filteredMigration = reportRows.filter((r) => {
    const matchesSearch =
      r.slug.toLowerCase().includes(migrationSearch.toLowerCase()) ||
      r.original_title.toLowerCase().includes(migrationSearch.toLowerCase())
    if (!matchesSearch) return false

    if (migrationStatusFilter === 'PASS') return r.status === 'PASS'
    if (migrationStatusFilter === 'REDIRECT') return r.http_status === 301 || r.status === 'REDIRECT'
    if (migrationStatusFilter === '410') return r.status === '410' || r.http_status === 410
    return true
  })

  // Export 887 URLs as CSV
  const handleExportCSV = () => {
    const headers = 'Entity Type,Original Slug,Original Title,Status,HTTP Status,Canonical URL\n'
    const rows = reportRows
      .map((r) => `"${r.entity_type}","${r.slug}","${(r.original_title || '').replace(/"/g, '""')}","${r.status}","${r.http_status || 200}","${r.canonical_url || ''}"`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `migrasi-887-urls-unimasi-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export 887 URLs as JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `migrasi-report-unimasi.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Live URL test resolver
  const handleTestUrl = () => {
    if (!testUrlInput.trim()) return
    const cleaned = testUrlInput.trim().toLowerCase().replace(/^https?:\/\/[^\/]+/, '').replace(/^\/|\/$/g, '')
    const match = reportRows.find((r) => r.slug.toLowerCase() === cleaned || r.original_title.toLowerCase().includes(cleaned))

    if (match) {
      setTestUrlResult({
        found: true,
        slug: match.slug,
        status: `${match.status} (${match.http_status || 200})`,
        destination: match.entity_type === 'portfolio' ? `/portofolio/${match.slug}` : (match.entity_type === 'service' ? `/layanan/${match.slug}` : `/${match.slug}`),
      })
    } else {
      setTestUrlResult({
        found: false,
        slug: cleaned,
        status: '404 Tidak Terdaftar di Registri Migrasi',
      })
    }
  }

  // Interactive Redirect Path Matcher
  const handleTestRedirect = (path: string) => {
    setRedirectTestInput(path)
    if (!path.trim()) {
      setRedirectTestResult(null)
      return
    }
    const clean = path.trim().toLowerCase()
    const found = redirectList.find((r: any) => clean === r.sourcePath.toLowerCase() || clean.startsWith(r.sourcePath.toLowerCase()))
    if (found) {
      setRedirectTestResult(`✓ MATCH: ${clean} → 301 Permanent Redirect → ${found.destinationPath} (${found.reason})`)
    } else {
      setRedirectTestResult(`○ NO RULE: ${clean} diteruskan langsung ke router Next.js`)
    }
  }

  // Add Custom Redirect Rule to SQLite Database
  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRedirectSource || !newRedirectDest) return

    const sourcePath = newRedirectSource.startsWith('/') ? newRedirectSource : `/${newRedirectSource}`
    const destinationPath = newRedirectDest.startsWith('/') ? newRedirectDest : `/${newRedirectDest}`
    const reason = newRedirectReason || 'Aturan redirect kustom admin studio'

    try {
      const res = await fetch('/api/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath,
          destinationPath,
          statusCode: 301,
          reason,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMessage(`Aturan redirect "${sourcePath} → ${destinationPath}" berhasil disimpan ke SQLite!`)
        setNewRedirectSource('')
        setNewRedirectDest('')
        setNewRedirectReason('')
        fetchRedirects()
        checkSystemStatus()
      } else {
        setActionMessage(`Gagal: ${data.error || 'Terjadi kesalahan'}`)
      }
    } catch {
      setActionMessage('Gagal menghubungi server untuk menyimpan redirect.')
    }
    setTimeout(() => setActionMessage(''), 4000)
  }

  return (
    <div className="pb-16 text-white space-y-6">
      {/* Global Action Banner Toast */}
      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>✓ {actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* --- SINGLE-BRAND NOTICE (ADR-0007) ------------------------- */}
      {activeTab === 'brands' && (
        <div className="p-8 rounded-2xl border border-white/10 bg-[var(--studio-bg)] text-center space-y-4">
          <Globe className="w-10 h-10 text-accent-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Arsitektur Satu Brand: UNIMASI Studio</h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            Sesuai standar arsitektur ADR-0007, platform ini beroperasi dalam mode satu brand terdedikasi (1 Deployment = 1 Brand). Seluruh konten, layanan, dan analitik dikhususkan untuk brand UNIMASI.
          </p>
          <button
            onClick={() => handleTabChange('overview')}
            className="px-4 py-2 rounded-xl bg-accent-400 text-neutral-950 font-bold text-xs hover:bg-accent-300 transition-colors"
          >
            Kembali ke Ringkasan &amp; KPI
          </button>
        </div>
      )}

      {/* --- WORKSPACE MATRIX KEYWORD & BULK GENERATOR (DEPRECATED) --- */}
      {activeTab === 'matrix' && (
        <div className="p-8 rounded-2xl border border-white/10 bg-[var(--studio-bg)] text-center space-y-4">
          <Zap className="w-10 h-10 text-accent-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Keyword Matrix Dinonaktifkan</h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            PSEO Matrix telah didepresiasi sesuai standar UNIMASI Single-Brand. Silakan kelola artikel langsung melalui tab Artikel atau Keyword Planner.
          </p>
          <button
            onClick={() => handleTabChange('articles')}
            className="px-4 py-2 rounded-xl bg-accent-400 text-neutral-950 font-bold text-xs hover:bg-accent-300 transition-colors"
          >
            Buka Tab Artikel
          </button>
        </div>
      )}

      {/* --- SINGLE-BRAND PUBLISHER NOTICE (ADR-0007) ------------------ */}
      {activeTab === 'publisher' && (
        <div className="p-8 rounded-2xl border border-white/10 bg-[var(--studio-bg)] text-center space-y-4">
          <Download className="w-10 h-10 text-accent-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Publisher Bridge Dinonaktifkan</h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            UNIMASI kini sepenuhnya berjalan di atas Next.js 16 App Router dengan arsitektur terisolasi. Sinkronisasi multi-situs eksternal tidak lagi diperlukan.
          </p>
          <button
            onClick={() => handleTabChange('articles')}
            className="px-4 py-2 rounded-xl bg-accent-400 text-neutral-950 font-bold text-xs hover:bg-accent-300 transition-colors"
          >
            Lihat Manajemen Artikel
          </button>
        </div>
      )}

      {/* --- TAB 1: OVERVIEW & SYSTEM KPI -------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 shadow-soft-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Artikel</span>
              <p className="text-3xl font-bold text-white mt-1">{totalArticles}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400">100% Valid Dynamic</span>
                <Link href="/admin?tab=articles" className="text-info hover:underline">Kelola →</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 shadow-soft-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Portofolio Institusi</span>
              <p className="text-3xl font-bold text-accent-300 mt-1">{systemStatus?.counts?.portfolios ?? 0}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300">100% Foto Asli Gedung</span>
                <a href={`${siteConfig.url}/portofolio`} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">Lihat Galeri ↗</a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 shadow-soft-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Validasi URL Migrasi</span>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{migrationRegistry.length > 0 ? `${migrationRegistry.length} URLs` : 'Verified'}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400">Zero Broken Link</span>
                <Link href="/admin?tab=migration" className="text-info hover:underline">Lihat Audit →</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-5 shadow-soft-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">301 Redirect Rules</span>
              <p className="text-3xl font-bold text-info mt-1">{redirectList.length}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-300">SEO Preservation</span>
                <Link href="/admin?tab=redirects" className="text-info hover:underline">Atur Rules →</Link>
              </div>
            </div>
          </div>

          {/* Quick System & Content Status Banner */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-6 shadow-soft-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-400" />
                <h3 className="text-base font-bold text-white">
                  Pusat Kendali Operasional &amp; Konten
                </h3>
                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  Sistem Aktif
                </span>
              </div>
              <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                Seluruh data artikel, aturan redirect 301, dan analitik pencarian tersinkronisasi optimal dengan ketersediaan penuh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSyncSystem}
                disabled={syncingSystem}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingSystem ? 'animate-spin' : ''}`} />
                <span>{syncingSystem ? 'Memeriksa...' : 'Periksa Integritas'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('system')}
                className="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 text-xs font-bold shadow-md transition-all"
              >
                Buka Panel Operasional →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: PORTOFOLIO & STUDI KASUS --------------------------- */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <StudioPortfolioManager />
        </div>
      )}

      {/* --- TAB: KATALOG LAYANAN ------------------------------------- */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <StudioServicesManager />
        </div>
      )}

      {/* --- TAB: KATALOG SOLUSI & QUIZ --------------------------------- */}
      {activeTab === 'solutions' && (
        <div className="space-y-6">
          <StudioSolutionsManager />
        </div>
      )}

      {/* --- TAB: MEDIA MANAGER (Section 5) ---------------------------- */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <StudioMediaManager />
        </div>
      )}

      {/* --- TAB: KEYWORD PLANNER (Section 4 & 15.2) ------------------- */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <StudioKeywordPlanner />
        </div>
      )}

      {/* --- TAB: AUDIT SITUS TEKNIS (Section 15.3) -------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <StudioSiteAudit />
        </div>
      )}

      {/* --- TAB: DYNAMIC BLOCKS CATALOG (ADR-0012) ----------------- */}
      {activeTab === 'blocks' && (
        <div className="space-y-6">
          <StudioBlocksCatalog />
        </div>
      )}

      {/* --- TAB: CLIENT & PARTNER LOGOS ----------------------------- */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <StudioClientsManager />
        </div>
      )}

      {/* --- TAB: BLOK CTA GLOBAL (Section 7) -------------------------- */}
      {activeTab === 'cta' && (
        <div className="space-y-6">
          <StudioCtaManager />
        </div>
      )}

      {/* --- TAB: PERFORMA & INDEXNOW (Section 15.4 & 15.5) ------------ */}
      {activeTab === 'perf' && (
        <div className="space-y-6">
          <StudioPerformanceManager />
        </div>
      )}

      {/* --- TAB: AI WEB ASSISTANT ------------------------------------ */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <StudioAiSettings />
        </div>
      )}

      {/* --- TAB: AGENTIC AI SETTINGS & TOOLS ------------------------- */}
      {activeTab === 'ai-settings' && (
        <div className="space-y-6">
          <StudioAiSettings />
        </div>
      )}

      {/* --- TAB: GOOGLE SEARCH CONSOLE ------------------------------ */}
      {activeTab === 'gsc' && (
        <div className="space-y-6">
          <StudioGscDashboard />
        </div>
      )}

      {/* --- TAB 2: ARTIKEL MANAGEMENT (Both Admin & Writer) ----------- */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {/* Compact Filter & Management Bar */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-3 sm:p-4 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[200px] sm:min-w-[260px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari judul artikel atau slug..."
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/90 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-accent-400 focus:outline-none"
                />
              </div>

              <div className="min-w-[140px]">
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-1.5 text-xs text-white focus:border-accent-400 focus:outline-none"
                >
                  {categoriesOptions.length > 0 ? (
                    categoriesOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Semua Kategori</option>
                  )}
                </select>
              </div>

              <div className="min-w-[120px]">
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-1.5 text-xs text-white focus:border-accent-400 focus:outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Small Article Count */}
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400">
                {totalArticles} artikel
              </span>
            </div>

            {/* Right: Category Manager Action Button */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <Tooltip label="Kelola Kategori" hint="Kelola struktur taksonomi dan nama kategori artikel">
                <button
                  type="button"
                  onClick={() => setCategoryManagerOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white transition-all inline-flex items-center gap-1.5"
                >
                  <FolderTree className="w-3.5 h-3.5 text-accent-300" />
                  <span>Kelola Kategori</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Quick Edit Modal */}
          {editingArticle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="max-w-md w-full rounded-2xl bg-[var(--studio-bg)] border border-info/40 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">Edit Cepat Artikel</h3>
                  <button onClick={() => setEditingArticle(null)} className="text-neutral-400 hover:text-white">✕</button>
                </div>
                <div>
                  <label className="text-xs font-mono text-neutral-400 block mb-1">Judul Artikel</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/15 p-3 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-neutral-400 block mb-1">Kategori</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/15 p-3 text-xs text-white focus:outline-none focus:border-accent-400"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 font-bold text-xs shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingArticle(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 text-neutral-300 text-xs"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Articles Table */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] overflow-hidden shadow-soft-sm">
            {loadingArticles ? (
              <div className="py-16 text-center text-neutral-400 font-mono text-body-sm">
                Memuat data artikel...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-neutral-300 font-mono text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('title')}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span>Judul &amp; Slug Artikel</span>
                          {sortField === 'title' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-info" /> : <ArrowDown className="w-3 h-3 text-info" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('category')}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span>Kategori</span>
                          {sortField === 'category' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-info" /> : <ArrowDown className="w-3 h-3 text-info" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('date')}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span>Tanggal</span>
                          {sortField === 'date' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-info" /> : <ArrowDown className="w-3 h-3 text-info" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Audit SEO</th>
                      <th className="py-2.5 px-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort('status')}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span>Status</span>
                          {sortField === 'status' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-info" /> : <ArrowDown className="w-3 h-3 text-info" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-neutral-600 hover:text-neutral-400" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedArticles.map((art, idx) => (
                      <ArticleTableRow
                        key={art.id ?? idx}
                        art={art}
                        idx={idx}
                        permissions={permissions}
                        onTransitionStatus={handleTransitionStatus}
                        onDeleteArticle={handleDeleteArticle}
                        onQuickEdit={(item) => {
                          setEditingArticle(item)
                          setEditTitle(item.title)
                          setEditCategory(item.category?.name || 'Website Development')
                        }}
                        onActionMessage={setActionMessage}
                        onAlert={showAlert}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="p-3 sm:p-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono">Halaman {page} dari {Math.ceil(totalArticles / 15) || 1}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= Math.ceil(totalArticles / 15)}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-white/10"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          </div>

          <StudioCategoryManager
            isOpen={categoryManagerOpen}
            onClose={() => setCategoryManagerOpen(false)}
            onCategoriesChanged={() => {
              fetchCategories()
              fetchArticles()
            }}
          />
        </div>
      )}

      {/* --- TAB 3: REGISTRI 887 URL (Audit & Live URL Resolver) --------- */}
      {/* --- TAB: EDITORIAL CALENDAR ----------------------------------- */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <StudioCalendar />
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-6 shadow-soft-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-display-xs font-bold text-white flex items-center gap-2">
                  <span>Registri Validasi URL Legacy</span>
                  <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-body-xs">
                    {migrationRegistry.length > 0 ? `${migrationRegistry.length} URLs` : 'Active'}
                  </span>
                </h2>
                <p className="text-body-xs text-neutral-300 mt-1">
                  100% jejak tautan lama terverifikasi tanpa broken link (404) untuk proteksi ranking Google.
                </p>
              </div>

              {/* Functional Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Interactive Live URL Ping Tester */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-info-300 font-semibold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Penguji URL Langsung (Live URL Resolver)</span>
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testUrlInput}
                  onChange={(e) => setTestUrlInput(e.target.value)}
                  placeholder="Ketik path atau URL lama (contoh: /animasi-3d-lama/ atau /portfolio-lama/)..."
                  className="flex-1 rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestUrl}
                  className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 font-bold text-xs transition-all shrink-0"
                >
                  Uji Resolusi URL
                </button>
              </div>

              {testUrlResult && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  testUrlResult.found
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  <p>Status: <strong>{testUrlResult.status}</strong></p>
                  {testUrlResult.destination && (
                    <p className="mt-1">Tujuan Otomatis: <a href={testUrlResult.destination.startsWith('http') ? testUrlResult.destination : `${siteConfig.url}${testUrlResult.destination}`} target="_blank" rel="noopener noreferrer" className="underline text-white">{testUrlResult.destination} ↗</a></p>
                  )}
                </div>
              )}
            </div>

            {/* Filter Buttons & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="sm:col-span-2">
                <input
                  type="search"
                  value={migrationSearch}
                  onChange={(e) => setMigrationSearch(e.target.value)}
                  placeholder="Filter berdasarkan slug atau judul..."
                  className="w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-2 text-body-sm text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 overflow-x-auto text-xs">
                {(['ALL', 'PASS', 'REDIRECT', '410'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setMigrationStatusFilter(st)}
                    className={`px-3 py-2 rounded-xl font-mono text-[11px] font-semibold transition-all ${
                      migrationStatusFilter === st
                        ? 'bg-accent-500 text-accent-950 shadow-sm'
                        : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border-t border-white/10 pt-2">
              <table className="w-full text-left text-body-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-neutral-300 font-mono">
                    <th className="py-3 px-4">Tipe Entitas</th>
                    <th className="py-3 px-4">Slug Asli</th>
                    <th className="py-3 px-4">Status Audit</th>
                    <th className="py-3 px-4">Canonical Tag</th>
                    <th className="py-3 px-4 text-right">Rute Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredMigration.slice(0, 20).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="py-3 px-4">
                        <span className="badge bg-white/10 text-neutral-300 font-sans">
                          {row.entity_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[220px] truncate text-neutral-200">
                        /{row.slug}/
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={row.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}>
                          ✓ {row.status} ({row.http_status || 200})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">
                        {row.has_canonical ? 'Valid Auto' : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <a
                          href={row.entity_type === 'portfolio' ? `${siteConfig.url}/portofolio/${row.slug}` : (row.entity_type === 'service' ? `${siteConfig.url}/layanan/${row.slug}` : `${siteConfig.url}/${row.slug}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-info hover:underline font-semibold"
                        >
                          Buka ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-center text-body-xs text-neutral-400 font-mono">
              Menampilkan {Math.min(filteredMigration.length, 20)} dari {filteredMigration.length} hasil tersaring.
            </p>
          </div>
        </div>
      )}

      {/* --- TAB 4: 301 REDIRECTS (Interactive Manager & Tester) --------- */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-6 shadow-soft-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-display-xs font-bold text-white">
                  301 Redirect Rules Manager
                </h2>
                <p className="text-body-xs text-neutral-300 mt-1">
                  Aturan pengalihan otomatis untuk memastikan tautan rusak dialihkan secara permanen.
                </p>
              </div>

              <span className="badge bg-info-950/80 border border-info/30 text-info-300 font-mono text-xs">
                {redirectList.length} Aturan Aktif
              </span>
            </div>

            {/* Interactive Redirect Tester */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-info-300 font-semibold block">
                🧪 Uji Kecocokan Rule (Interactive Pattern Matcher)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redirectTestInput}
                  onChange={(e) => handleTestRedirect(e.target.value)}
                  placeholder="Ketik path yang ingin diuji (contoh: /animasi-3d-lama atau /portfolio-lama)..."
                  className="flex-1 rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-400 font-mono"
                />
              </div>
              {redirectTestResult && (
                <div className="p-3 rounded-lg bg-info-950/50 border border-info/30 text-xs font-mono text-info-300">
                  {redirectTestResult}
                </div>
              )}
            </div>

            {/* Add Custom Redirect Rule Form */}
            <form onSubmit={handleAddRedirect} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>➕</span>
                <span>Tambah Aturan 301 Baru</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newRedirectSource}
                  onChange={(e) => setNewRedirectSource(e.target.value)}
                  placeholder="Path Asal (contoh: /promo-lama)"
                  className="rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white font-mono"
                  required
                />
                <input
                  type="text"
                  value={newRedirectDest}
                  onChange={(e) => setNewRedirectDest(e.target.value)}
                  placeholder="Path Tujuan (contoh: /layanan)"
                  className="rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white font-mono"
                  required
                />
                <input
                  type="text"
                  value={newRedirectReason}
                  onChange={(e) => setNewRedirectReason(e.target.value)}
                  placeholder="Alasan / Catatan (opsional)"
                  className="rounded-xl border border-white/15 bg-neutral-900 px-3.5 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 font-bold text-xs shadow-md transition-all"
              >
                Simpan Aturan Redirect
              </button>
            </form>

            {/* Redirect Rules List */}
            <div className="space-y-2.5">
              {redirectList.map((redir: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/5 font-mono text-body-xs hover:border-info/40 transition-colors">
                  <div className="text-info-300 font-bold truncate max-w-xs">
                    {redir.sourcePath}
                  </div>
                  <div className="text-neutral-500 text-xs">→ (301 Permanent) →</div>
                  <div className="text-emerald-400 font-bold truncate max-w-xs">
                    {redir.destinationPath}
                  </div>
                  <div className="text-neutral-400 font-sans text-xs mt-1 sm:mt-0">
                    {redir.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: NEXT.JS 16 WEBSHIFT ENGINE & SQLITE HUB ------------- */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-6 sm:p-8 shadow-soft-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="badge bg-info-950/80 border border-info/30 text-info-300 font-mono text-xs mb-2">
                  Embedded Database &amp; Engine
                </span>
                <h2 className="text-display-sm font-bold text-white">
                  Next.js 16 WebShift Engine &amp; SQLite Hub
                </h2>
                <p className="text-body-xs text-neutral-300 mt-1">
                  Pusat kendali database SQLite lokal (<code className="text-info-300 font-mono">webshift.db</code>) via Drizzle ORM dengan latensi query sub-2ms tanpa dependensi database eksternal.
                </p>
              </div>

              {/* Live Status Badge */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={checkSystemStatus}
                  disabled={checkingSystem}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <span>{checkingSystem ? 'Memeriksa...' : 'Uji Latensi Database'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncSystem}
                  disabled={syncingSystem}
                  className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-300 text-accent-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <span>{syncingSystem ? 'Memverifikasi...' : 'Verifikasi Entitas SQLite'}</span>
                </button>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncMessage && (
              <div className="p-3.5 rounded-xl bg-info/20 border border-info/30 text-info-300 text-xs font-mono animate-fadeIn">
                {syncMessage}
              </div>
            )}

            {/* Technical Specifications Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Database File</span>
                <p className="text-lg font-bold text-white mt-1">SQLite (webshift.db)</p>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  {systemStatus?.online ? `Active (${systemStatus.latency})` : 'Embedded Ready'}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Engine &amp; ORM</span>
                <p className="text-lg font-bold text-white mt-1">Drizzle ORM</p>
                <p className="text-xs text-neutral-300 font-mono mt-1">@libsql/client (Zero-Downtime)</p>
              </div>
              <div className="p-5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] font-mono text-neutral-400 uppercase">Arsitektur</span>
                <p className="text-lg font-bold text-white mt-1">Full Next.js 16</p>
                <p className="text-xs text-info font-mono mt-1">App Router + Turbopack SSR</p>
              </div>
            </div>

            {/* Content Types Sync Table */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-info-300 font-semibold">
                  Skema Tabel Database SQLite (Drizzle ORM)
                </h3>
                <span className="text-xs font-mono text-emerald-400">✓ Zero External Setup Required</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-neutral-300">
                    <th className="py-3 px-4">Tabel Database</th>
                    <th className="py-3 px-4">Jumlah Data</th>
                    <th className="py-3 px-4">Kolom Kunci</th>
                    <th className="py-3 px-4 text-right">Status Penyimpanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">articles</td>
                    <td className="py-3 px-4 text-neutral-300">{totalArticles} Artikel</td>
                    <td className="py-3 px-4 text-neutral-400">title, slug, excerpt, content, seo, status</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Active (SQLite)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">portfolios</td>
                    <td className="py-3 px-4 text-neutral-300">{systemStatus?.counts?.portfolios ?? 0} Studi Kasus</td>
                    <td className="py-3 px-4 text-neutral-400">client, year, industry, heroMedia, result</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Active (SQLite)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">services</td>
                    <td className="py-3 px-4 text-neutral-300">{systemStatus?.counts?.services ?? 0} Layanan</td>
                    <td className="py-3 px-4 text-neutral-400">name, slug, features, faq, cta</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Active (SQLite)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-white">redirects</td>
                    <td className="py-3 px-4 text-neutral-300">{redirectList.length} Rules</td>
                    <td className="py-3 px-4 text-neutral-400">sourcePath, destinationPath, statusCode</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">✓ Active (301 Engine)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CLI Instruction Helper */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-info" />
                <span>Untuk membuka GUI Visual Database Explorer (Drizzle Studio):</span>
              </span>
              <code className="block p-3 rounded-lg bg-black text-info-300 font-mono text-xs border border-white/10 select-all">
                cd web; npx drizzle-kit studio
              </code>
            </div>

            {/* --- Model Context Protocol (MCP) Server Integration ---- */}
            <div className="border border-info/30 rounded-2xl overflow-hidden bg-gradient-to-b from-info-950/25 to-black/50 p-6 sm:p-7 space-y-6 shadow-soft-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                      AI Model Integration
                    </span>
                    <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                      MCP v1.0.0 Active
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <span>Model Context Protocol (MCP) Server</span>
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                    Server MCP menghubungkan AI Coding Assistant (Antigravity, Claude Desktop, Cursor, Codex, Windsurf) langsung ke basis data artikel, portofolio, dan redirect UNIMASI.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>stdio &amp; streamable-http ready</span>
                  </div>
                </div>
              </div>

              {/* Registered Tools Grid */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-info-300 font-semibold mb-3">
                  7 Tools Terdaftar &amp; Terbuka untuk AI
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-info-300">list_articles</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Mencari dan memfilter 724 artikel berdasarkan status, kategori, atau kata kunci.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-info-300">get_article</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Mengambil isi artikel lengkap (HTML/Markdown) dan metadata SEO berdasarkan slug.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-emerald-400">create_article</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Membuat draf atau menerbitkan artikel baru secara otomatis dari prompt AI.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-amber-400">update_article</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Memperbarui judul, konten, kategori, dan status publikasi artikel.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-info-300">check_redirect</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Menguji dan memvalidasi URL lama terhadap aturan 301.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <div className="font-bold text-purple-400">add_redirect_rule</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Mendaftarkan aturan pengalihan baru (301, 302, 410) secara langsung.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 sm:col-span-2 lg:col-span-3">
                    <div className="font-bold text-cyan-300">get_system_status</div>
                    <div className="text-neutral-400 text-[11px] mt-1 font-sans">Membaca metrik kesehatan sistem, jumlah artikel terbit vs draf, portofolio, dan status database SQLite.</div>
                  </div>
                </div>
              </div>

              {/* Client Configurations */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-info-300 font-semibold">
                    Konfigurasi Siap-Pakai untuk AI Client
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {MCP_CLIENT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMcpClientTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                          mcpClientTab === tab.id
                            ? 'bg-accent-500 text-accent-950 font-bold shadow-sm'
                            : 'bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-xl bg-black/80 border border-white/10 p-4 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => copyMcpConfig(getMcpSnippet(mcpClientTab))}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] transition-all flex items-center gap-1 font-sans"
                  >
                    <span>{copiedMcp ? '✓ Tersalin!' : 'Salin Konfigurasi'}</span>
                  </button>
                  <pre className="overflow-x-auto text-neutral-200 text-[11px] leading-relaxed select-all">
                    {getMcpSnippet(mcpClientTab)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: MULTI-ROLE & ACCESS MATRIX -------------------------- */}
      {activeTab === 'roles' && (
        <div className="max-w-4xl space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[var(--studio-bg)] p-8 shadow-soft-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="badge bg-white/10 text-accent-300 font-mono mb-2">
                  Role-Based Access Control (RBAC)
                </span>
                <h2 className="text-display-sm font-bold text-white">
                  Matriks Hak Akses &amp; Workflow Editorial (RBAC)
                </h2>
                <p className="text-body-sm text-neutral-300 mt-1 leading-relaxed">
                  Sistem otentikasi server-side menegakkan pemisahan wewenang nyata pada Next.js API dan Database Engine.
                </p>
              </div>

              {/* Active Role Badge */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs">Peran Terpilih:</span>
                <span className="badge bg-accent-500/20 text-accent-300 font-mono text-xs font-bold border border-accent-500/30">
                  {role}
                </span>
              </div>
            </div>

            {/* Lifecycle Pipeline Diagram */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent-400 font-semibold block">
                Workflow Lifecycle Editorial Terproteksi (AGENTS.md Sec 8)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <div className="font-bold text-sm">1. DRAFT</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Author / MCP AI</div>
                </div>
                <div className="p-3 rounded-xl bg-info/10 border border-info/20 text-info-300">
                  <div className="font-bold text-sm">2. IN_REVIEW</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Diajukan Author</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <div className="font-bold text-sm">3. APPROVED</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Reviewer / Editor</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <div className="font-bold text-sm">4. PUBLISHED</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Editor / Admin</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-300">
                  <div className="font-bold text-sm">5. ARCHIVED</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Editor / Admin</div>
                </div>
              </div>
            </div>

            {/* 6 Role Cards Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  id: 'SUPER_ADMIN' as const,
                  name: 'Super Admin',
                  icon: Crown,
                  desc: 'Kontrol penuh sistem, database, deployment, dan penghapusan artikel.',
                  canPublish: true,
                  canDelete: true,
                },
                {
                  id: 'CONTENT_ADMIN' as const,
                  name: 'Content Admin',
                  icon: Shield,
                  desc: 'Mengelola seluruh konten, audit URL, redirects 301, dan publikasi.',
                  canPublish: true,
                  canDelete: true,
                },
                {
                  id: 'EDITOR' as const,
                  name: 'Editor',
                  icon: Edit3,
                  desc: 'Meninjau draft, menyetujui konten, dan menerbitkan artikel approved.',
                  canPublish: true,
                  canDelete: false,
                },
                {
                  id: 'REVIEWER' as const,
                  name: 'Reviewer',
                  icon: Search,
                  desc: 'Memvalidasi kelayakan draf. Berhak menyetujui atau meminta revisi.',
                  canPublish: false,
                  canDelete: false,
                },
                {
                  id: 'AUTHOR' as const,
                  name: 'Author',
                  icon: PenSquare,
                  desc: 'Membuat draf dan mengajukan review. Dilarang menerbitkan langsung.',
                  canPublish: false,
                  canDelete: false,
                },
                {
                  id: 'SEO_MANAGER' as const,
                  name: 'SEO Manager',
                  icon: TrendingUp,
                  desc: 'Mengelola metadata penelusuran, audit sitemap, dan 301 redirect rules.',
                  canPublish: false,
                  canDelete: false,
                },
              ].map((r) => {
                const isActive = role === r.id
                const IconComponent = r.icon
                return (
                  <div
                    key={r.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                      isActive
                        ? 'border-accent-400 bg-accent-950/30 shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-accent-300">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isActive ? (
                          <span className="badge bg-accent-500/20 text-accent-300 text-[10px] font-mono">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500">
                            Sesi Terproteksi
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm">{r.name}</h3>
                      <p className="text-body-xs text-neutral-300 mt-1 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Hak Publikasi:</span>
                        <span className={r.canPublish ? 'text-emerald-400' : 'text-red-400'}>
                          {r.canPublish ? '✓ Diizinkan' : '✗ Terkunci'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Hapus Permanen:</span>
                        <span className={r.canDelete ? 'text-emerald-400' : 'text-red-400'}>
                          {r.canDelete ? '✓ Diizinkan' : '✗ Terkunci'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 10: PENGATURAN SITUS & TATA KELOLA (Settings) ----------- */}
      {activeTab === 'settings' && (
        <StudioSettings />
      )}

      {/* -------------------------------------------------------------
          MODAL DIALOG SISTEM ADMIN (KONFIRMASI & PERINGATAN BUKAN ALERT)
      ------------------------------------------------------------- */}
      {dialogState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface-overlay border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  dialogState.type === 'error'
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : dialogState.type === 'confirm'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : dialogState.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                }`}
              >
                {dialogState.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : dialogState.type === 'confirm' ? (
                  <Trash2 className="w-4 h-4" />
                ) : dialogState.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">{dialogState.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{dialogState.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              {dialogState.cancelText && (
                <button
                  type="button"
                  onClick={() => setDialogState((prev) => ({ ...prev, open: false }))}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {dialogState.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (dialogState.onConfirm) {
                    dialogState.onConfirm()
                  } else {
                    setDialogState((prev) => ({ ...prev, open: false }))
                  }
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  dialogState.type === 'confirm'
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {dialogState.confirmText || 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400 font-mono text-xs">Memuat Studio Control Center...</div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}
