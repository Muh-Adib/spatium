'use client'

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  FileText,
  FolderTree,
  PenSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/lib/auth/AuthContext'
import type { ArticleStatus, RolePermissions } from '@/lib/auth/types'
import { FormField, IconButton, Modal, StatusMessage, TextButton, fieldCls, type StatusTone } from '@/components/admin/AdminUi'
import { IndexingMicroBadge } from '@/components/studio/IndexingMicroBadge'
import { StudioCategoryManager } from '@/components/studio/StudioCategoryManager'
import { useIndexingCooldown } from '@/hooks/useIndexingCooldown'
import { fetchJson, jsonHeaders } from './fetchJson'

const PAGE_SIZE = 15

const articleSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string(),
  slug: z.string(),
  category: z.object({ name: z.string(), slug: z.string().optional() }).nullable().optional(),
  status: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})
type ArticleItem = z.infer<typeof articleSchema>

const listSchema = z.object({ articles: z.array(articleSchema), total: z.number() })
const categoriesSchema = z.object({
  data: z.array(z.object({ name: z.string(), slug: z.string(), articleCount: z.number().optional() })),
})
const messageSchema = z.object({ message: z.string().optional() }).passthrough()

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Semua status' },
  { value: 'published', label: 'Terbit' },
  { value: 'draft', label: 'Draf' },
  { value: 'in_review', label: 'Ditinjau' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'archived', label: 'Arsip' },
]

const STATUS_BADGE: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  draft: { label: 'Draf', icon: Edit2, cls: 'border-amber-400/40 text-amber-200' },
  in_review: { label: 'Ditinjau', icon: Clock, cls: 'border-sky-400/40 text-sky-200' },
  approved: { label: 'Disetujui', icon: CheckCircle2, cls: 'border-purple-400/40 text-purple-200' },
  scheduled: { label: 'Terjadwal', icon: Clock, cls: 'border-indigo-400/40 text-indigo-200' },
  archived: { label: 'Arsip', icon: Archive, cls: 'border-neutral-400/40 text-neutral-300' },
  published: { label: 'Terbit', icon: CheckCircle2, cls: 'border-emerald-400/40 text-emerald-200' },
}

type SortField = 'title' | 'category' | 'date' | 'status'
type SortOrder = 'asc' | 'desc'

function formatDate(raw?: string | null): { display: string; full: string } {
  if (!raw) return { display: '—', full: 'Belum ditentukan' }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return { display: '—', full: raw }
  return {
    display: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    full: d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }
}

const articleDate = (a: ArticleItem) => a.scheduledAt || a.publishedAt || a.createdAt || null

/* ------------------------------------------------------------------ */

const ArticleRow = React.memo(function ArticleRow({
  art,
  permissions,
  onTransition,
  onDelete,
  onQuickEdit,
  onNotify,
}: {
  art: ArticleItem
  permissions: RolePermissions
  onTransition: (slug: string, status: ArticleStatus, note?: string) => void
  onDelete: (art: ArticleItem) => void
  onQuickEdit: (art: ArticleItem) => void
  onNotify: (message: string, tone: StatusTone) => void
}) {
  const st = art.status || 'draft'
  const isPublished = st === 'published'
  const cooldown = useIndexingCooldown({
    slug: art.slug,
    entityStatus: st,
    enabled: isPublished,
    onSuccess: () => onNotify(`Permintaan pengindeksan untuk /journal/${art.slug} terkirim.`, 'success'),
    onError: (err) => onNotify(typeof err === 'string' ? err : err.message || 'Permintaan pengindeksan gagal.', 'error'),
  })
  const badge = STATUS_BADGE[st] ?? STATUS_BADGE.draft
  const BadgeIcon = badge.icon
  const date = formatDate(articleDate(art))
  const dateLabel = st === 'scheduled' ? 'Jadwal' : art.publishedAt ? 'Terbit' : 'Dibuat'

  const transition = (() => {
    if (st === 'draft' && permissions.canSubmitForReview) return { to: 'in_review' as const, label: 'Ajukan review' }
    if (st === 'in_review' && permissions.canApprove) return { to: 'approved' as const, label: 'Setujui' }
    if (st === 'approved' && permissions.canPublish) return { to: 'published' as const, label: 'Terbitkan' }
    if (st === 'archived' && permissions.canPublish) return { to: 'draft' as const, label: 'Buka sebagai draf' }
    if (st === 'published' && permissions.canArchive) return { to: 'archived' as const, label: 'Arsipkan' }
    return null
  })()

  return (
    <tr className="border-b border-white/[0.06] align-top hover:bg-white/[0.03]">
      <th scope="row" className="min-w-[16rem] px-3 py-3 text-left font-normal">
        <Link
          href={`/admin/buat-artikel?slug=${encodeURIComponent(art.slug)}`}
          className="block break-words text-[13px] font-semibold text-white hover:underline"
        >
          {art.title}
        </Link>
        <span className="mt-0.5 block break-all font-mono text-[11px] text-neutral-300">/journal/{art.slug}</span>
      </th>
      <td className="px-3 py-3 text-xs text-neutral-200">{art.category?.name || '—'}</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs text-neutral-200">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
          <span>
            <span className="sr-only">{dateLabel}: </span>
            <time dateTime={articleDate(art) ?? undefined} title={date.full}>
              {date.display}
            </time>
          </span>
        </span>
        <span className="block text-[11px] text-neutral-400">{dateLabel}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        {isPublished ? (
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
        ) : (
          <span className="text-[11px] text-neutral-400">Belum terbit</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
            <BadgeIcon className="h-3 w-3" aria-hidden="true" />
            {badge.label}
          </span>
          {transition && (
            <button
              type="button"
              onClick={() => onTransition(art.slug, transition.to, transition.to === 'draft' ? 'Dibuka kembali' : undefined)}
              className="min-h-8 rounded-lg border border-white/15 px-2 text-[11px] font-medium text-neutral-100 hover:bg-white/10"
            >
              {transition.label}
              <span className="sr-only">: {art.title}</span>
            </button>
          )}
          {st === 'in_review' && permissions.canReview && (
            <button
              type="button"
              onClick={() => onTransition(art.slug, 'draft', 'Perlu revisi')}
              className="min-h-8 rounded-lg border border-white/15 px-2 text-[11px] font-medium text-amber-200 hover:bg-white/10"
            >
              Minta revisi<span className="sr-only">: {art.title}</span>
            </button>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={PenSquare}
            label={`Buka editor: ${art.title}`}
            href={`/admin/buat-artikel?slug=${encodeURIComponent(art.slug)}`}
            size="sm"
          />
          <IconButton icon={Edit2} label={`Edit cepat: ${art.title}`} hint="Ubah judul dan kategori" onClick={() => onQuickEdit(art)} size="sm" />
          {isPublished && (
            <>
              <IconButton
                icon={RefreshCw}
                label={`Kirim ulang pengindeksan: ${art.title}`}
                hint={cooldown.canRetrigger ? 'Kirim URL ke Google dan IndexNow.' : cooldown.retriggerBlockedReason || `Tunggu ${cooldown.remainingFormatted}.`}
                disabled={!cooldown.canRetrigger}
                spinning={cooldown.retriggering}
                onClick={cooldown.retrigger}
                size="sm"
              />
              <IconButton
                icon={ExternalLink}
                label={`Lihat di situs: ${art.title}`}
                href={`${siteConfig.url}/journal/${art.slug}`}
                external
                size="sm"
              />
            </>
          )}
          {permissions.canDeleteArticle ? (
            <IconButton icon={Trash2} label={`Hapus: ${art.title}`} tone="danger" onClick={() => onDelete(art)} size="sm" />
          ) : (
            <IconButton icon={Shield} label="Hapus tidak tersedia" hint="Hanya Super Admin dan Content Admin yang bisa menghapus artikel." disabled size="sm" />
          )}
        </div>
      </td>
    </tr>
  )
})

/* ------------------------------------------------------------------ */

export default function ArticlesTab() {
  const { permissions } = useAuth()

  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [categories, setCategories] = useState<{ name: string; slug: string; articleCount?: number }[]>([])
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

  const [notice, setNotice] = useState<{ message: string; tone: StatusTone } | null>(null)
  const notify = useCallback((message: string, tone: StatusTone) => setNotice({ message, tone }), [])

  const [editing, setEditing] = useState<ArticleItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const editTitleRef = useRef<HTMLInputElement>(null)

  const [deleting, setDeleting] = useState<ArticleItem | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Debounce the search term so typing does not fire one request per key.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(deferredSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [deferredSearch])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      search: debouncedSearch,
      category,
      status: status || 'all',
    })
    fetchJson(`/api/articles?${params.toString()}`, listSchema, {
      signal: controller.signal,
      fallbackError: 'Daftar artikel belum bisa dimuat.',
    }).then((r) => {
      if (controller.signal.aborted) return
      if (r.ok) {
        setArticles(r.data.articles)
        setTotal(r.data.total)
        setLoadError(null)
      } else {
        setLoadError(r.error)
      }
      setLoading(false)
    })
    return () => controller.abort()
  }, [page, debouncedSearch, category, status, reloadKey])

  const loadCategories = useCallback(() => {
    fetchJson('/api/categories', categoriesSchema, { fallbackError: 'Kategori belum bisa dimuat.' }).then((r) => {
      if (r.ok) setCategories(r.data.data)
      else console.warn('[articles-tab] categories:', r.error)
    })
  }, [])
  useEffect(loadCategories, [loadCategories])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const sorted = useMemo(() => {
    const dir = sortOrder === 'asc' ? 1 : -1
    const key = (a: ArticleItem): string | number =>
      sortField === 'title'
        ? a.title.toLowerCase()
        : sortField === 'category'
        ? (a.category?.name || '').toLowerCase()
        : sortField === 'status'
        ? a.status || ''
        : new Date(articleDate(a) || 0).getTime()
    return [...articles].sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0))
  }, [articles, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortOrder(field === 'date' ? 'desc' : 'asc')
    }
  }

  const handleTransition = useCallback(
    async (slug: string, next: ArticleStatus, note?: string) => {
      const r = await fetchJson('/api/articles', messageSchema, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({ slug, status: next, note }),
        fallbackError: 'Status artikel belum berubah.',
      })
      if (r.ok) {
        notify(r.data.message || 'Status artikel diperbarui.', 'success')
        reload()
      } else notify(r.error, 'error')
    },
    [notify, reload]
  )

  const openQuickEdit = useCallback((art: ArticleItem) => {
    setEditing(art)
    setEditTitle(art.title)
    setEditCategory(art.category?.name || '')
    setEditError(null)
  }, [])

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || saving) return
    if (editTitle.trim().length < 3) {
      setEditError('Judul minimal 3 karakter.')
      editTitleRef.current?.focus()
      return
    }
    setSaving(true)
    const r = await fetchJson('/api/articles', messageSchema, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ slug: editing.slug, title: editTitle.trim(), ...(editCategory ? { category: editCategory } : {}) }),
      fallbackError: 'Perubahan belum tersimpan.',
    })
    setSaving(false)
    if (r.ok) {
      notify(`Artikel “${editTitle.trim()}” diperbarui.`, 'success')
      setEditing(null)
      reload()
    } else setEditError(r.error)
  }

  const handleDelete = async () => {
    if (!deleting || deleteBusy) return
    setDeleteBusy(true)
    const r = await fetchJson(`/api/articles?slug=${encodeURIComponent(deleting.slug)}`, messageSchema, {
      method: 'DELETE',
      fallbackError: 'Artikel belum terhapus.',
    })
    setDeleteBusy(false)
    if (r.ok) {
      notify(`Artikel “${deleting.title}” dihapus.`, 'success')
      setDeleting(null)
      reload()
    } else notify(r.error, 'error')
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const sortHeader = (field: SortField, children: React.ReactNode) => {
    const active = sortField === field
    const Icon = active ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <th
        scope="col"
        aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
        className="px-3 py-2.5 font-semibold"
      >
        <button type="button" onClick={() => handleSort(field)} className="inline-flex min-h-8 items-center gap-1.5 rounded hover:text-white">
          {children}
          <Icon className={`h-3.5 w-3.5 ${active ? 'text-accent-300' : 'text-neutral-400'}`} aria-hidden="true" />
        </button>
      </th>
    )
  }

  return (
    <div className="space-y-4">
      <StatusMessage message={notice?.message ?? null} tone={notice?.tone} onDismiss={() => setNotice(null)} />

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] p-3 sm:p-4 lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <label htmlFor="articles-search" className="mb-1 block text-[11px] font-semibold text-neutral-300">
              Cari
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                id="articles-search"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Judul atau slug"
                className={`${fieldCls} pl-9`}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label htmlFor="articles-category" className="mb-1 block text-[11px] font-semibold text-neutral-300">
              Kategori
            </label>
            <select
              id="articles-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className={fieldCls}
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.articleCount ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="articles-status" className="mb-1 block text-[11px] font-semibold text-neutral-300">
              Status
            </label>
            <select
              id="articles-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className={fieldCls}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <TextButton onClick={() => setCategoryManagerOpen(true)} className="shrink-0">
          <FolderTree className="h-4 w-4 text-accent-300" aria-hidden="true" />
          Kelola kategori
        </TextButton>
      </div>

      <section aria-labelledby="articles-table-caption" className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--studio-bg)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <h2 id="articles-table-caption" className="text-sm font-semibold">
            Daftar artikel
          </h2>
          <p className="text-xs text-neutral-300" aria-live="polite">
            {loading ? 'Memuat…' : `${total} artikel`}
          </p>
        </div>

        {loadError ? (
          <div role="alert" className="space-y-3 px-4 py-10 text-center text-sm text-red-200">
            <p>{loadError}</p>
            <TextButton onClick={reload}>Coba lagi</TextButton>
          </div>
        ) : !loading && sorted.length === 0 ? (
          <div className="space-y-3 px-4 py-12 text-center text-sm text-neutral-300">
            <FileText className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
            <p>{debouncedSearch || category || status ? 'Tidak ada artikel yang cocok dengan filter.' : 'Belum ada artikel.'}</p>
            {!(debouncedSearch || category || status) && (
              <Link href="/admin/buat-artikel" className="inline-flex text-accent-300 underline">
                Tulis artikel pertama
              </Link>
            )}
          </div>
        ) : (
          <>
          <p className="px-4 pt-2 text-[11px] text-neutral-300 md:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
          <div className="overflow-x-auto" aria-busy={loading} tabIndex={0} role="region" aria-label="Tabel artikel (bisa digeser)">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] text-neutral-200">
                  {sortHeader('title', 'Judul')}
                  {sortHeader('category', 'Kategori')}
                  {sortHeader('date', 'Tanggal')}
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Pengindeksan
                  </th>
                  {sortHeader('status', 'Status')}
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((art) => (
                  <ArticleRow
                    key={art.id ?? art.slug}
                    art={art}
                    permissions={permissions}
                    onTransition={handleTransition}
                    onDelete={setDeleting}
                    onQuickEdit={openQuickEdit}
                    onNotify={notify}
                  />
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <nav aria-label="Halaman daftar artikel" className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-neutral-300">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <TextButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </TextButton>
            <TextButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Berikutnya
            </TextButton>
          </div>
        </nav>
      </section>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit cepat artikel"
        icon={Edit2}
        tone="info"
        footer={
          <>
            <TextButton onClick={() => setEditing(null)}>Batal</TextButton>
            <TextButton tone="primary" type="submit" form="quick-edit-form" busy={saving}>
              {saving ? 'Menyimpan…' : 'Simpan perubahan'}
            </TextButton>
          </>
        }
      >
        <form id="quick-edit-form" onSubmit={handleSaveEdit} noValidate className="space-y-4">
          <FormField label="Judul" error={editError}>
            {(p) => (
              <input {...p} data-autofocus ref={editTitleRef} type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={fieldCls} />
            )}
          </FormField>
          <FormField label="Kategori" hint="Pilih dari kategori yang ada. Kategori baru dibuat lewat “Kelola kategori”.">
            {(p) => (
              <select {...p} value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={fieldCls}>
                <option value="">Tetap seperti sekarang</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Hapus artikel permanen?"
        description={
          <>
            “{deleting?.title}” akan dihapus dari database dan tidak bisa dipulihkan. Pertimbangkan mengarsipkan bila hanya ingin
            menurunkannya dari situs.
          </>
        }
        icon={Trash2}
        tone="danger"
        footer={
          <>
            <TextButton onClick={() => setDeleting(null)}>Batal</TextButton>
            <TextButton tone="danger" onClick={handleDelete} busy={deleteBusy}>
              {deleteBusy ? 'Menghapus…' : 'Hapus permanen'}
            </TextButton>
          </>
        }
      />

      <StudioCategoryManager
        isOpen={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        onCategoriesChanged={() => {
          loadCategories()
          reload()
        }}
      />
    </div>
  )
}
