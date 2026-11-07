'use client'

import React, { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Eye,
  ExternalLink,
  Globe,
  History,
  ImagePlus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { BlockIssue } from '@/lib/blocks/catalog'
import { computePageGate, gateIssueTarget, type GateTarget } from '@/lib/pages/gate'
import { pageSlugSchema, type PageStatus } from '@/lib/pages/page-schema'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/lib/auth/AuthContext'
import MediaPickerModal from '@/components/studio/MediaPickerModal'
import { BlockEditor } from '../blocks/BlockEditor'
import { useLocalDraft, useModKeyLabel, useUnsavedGuard } from '../blocks/hooks'
import { ensureBlockIds, formatIssue, type EditorBlock } from '../blocks/model'
import { Badge, Button, Dialog, FOCUS_RING, FieldError, FieldHelp, describedBy, inputClass } from '../blocks/ui'
import { pagesApi, type PageDto, type RevisionDto } from './client'
import { DateTime, StatusBadge } from './shared'

type Form = {
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  ogImage: string
  ogImageAlt: string
  robots: 'index, follow' | 'noindex, follow' | 'noindex, nofollow'
  blocks: EditorBlock[]
}

type FieldKey = Exclude<keyof Form, 'blocks'>
type FieldErrors = Partial<Record<FieldKey, string>>

type Banner = {
  tone: 'error' | 'success' | 'warning'
  /** Banner about block issues: cleared automatically once the blocks validate. */
  aboutBlocks?: boolean
  title: string
  items?: { text: string; onFix?: () => void; fixLabel?: string }[]
  actions?: React.ReactNode
}

const ROBOTS: { value: Form['robots']; label: string }[] = [
  { value: 'index, follow', label: 'Tampilkan di mesin pencari (index, follow)' },
  { value: 'noindex, follow', label: 'Sembunyikan dari pencarian, ikuti tautan (noindex, follow)' },
  { value: 'noindex, nofollow', label: 'Sembunyikan sepenuhnya (noindex, nofollow)' },
]

function toForm(page: PageDto): Form {
  const robots = ROBOTS.some((r) => r.value === page.robots) ? (page.robots as Form['robots']) : 'index, follow'
  return {
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle ?? '',
    metaDescription: page.metaDescription ?? '',
    ogImage: page.ogImage ?? '',
    ogImageAlt: page.ogImageAlt ?? '',
    robots,
    blocks: ensureBlockIds(page.blocks),
  }
}

const FIELD_ID: Record<FieldKey, string> = {
  title: 'page-title',
  slug: 'page-slug',
  metaTitle: 'page-meta-title',
  metaDescription: 'page-meta-description',
  ogImage: 'page-og-image',
  ogImageAlt: 'page-og-image-alt',
  robots: 'page-robots',
}

const nullable = (s: string) => (s.trim() ? s.trim() : null)

const ACTION_LABEL: Record<string, string> = {
  create: 'Dibuat',
  update: 'Diubah',
  delete: 'Dihapus',
  'status:draft': 'Dijadikan draf',
  'status:in_review': 'Dikirim ke review',
  'status:published': 'Diterbitkan',
  'status:archived': 'Diarsipkan',
}

/** Length counter: text + state word, never color alone. */
function Counter({ id, value, min, ideal, max }: { id: string; value: string; min: number; ideal: number; max: number }) {
  const n = value.trim().length
  const state = n === 0 ? 'Kosong' : n < min ? `Terlalu pendek (min. ${min})` : n > max ? `Terlalu panjang (maks. ${max})` : n > ideal ? 'Mungkin terpotong di Google' : 'Panjang pas'
  const ok = n >= min && n <= ideal
  return (
    <p id={id} className={`mt-1.5 flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-200' : 'text-neutral-300'}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
      {n} karakter · {state}
    </p>
  )
}

type Props = {
  pageId: number
  onBack: () => void
  /** Called after a change the list should reflect (save, status, delete). */
  onChanged: () => void
  onDeleted: (title: string) => void
}

export function PageEditor({ pageId, onBack, onChanged, onDeleted }: Props) {
  const [page, setPage] = useState<PageDto | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [baseline, setBaseline] = useState<Form | null>(null)
  const [version, setVersion] = useState(0)
  const [savedVersion, setSavedVersion] = useState(0)
  const [blockIssues, setBlockIssues] = useState<BlockIssue[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [panel, setPanel] = useState('blocks')
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState<PageStatus | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const versionRef = useRef(0)
  versionRef.current = version
  const pendingFocus = useRef<string | null>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  // Same capabilities the API enforces, so the UI never offers a forbidden action.
  const { can } = useAuth()
  const canEdit = can('page:update')
  const canPublish = can('page:publish')
  const canDelete = can('page:delete')
  const modKey = useModKeyLabel()

  const load = useCallback(async () => {
    setLoadError(null)
    const res = await pagesApi.get(pageId)
    if (!res.ok) {
      setLoadError(res.failure.error)
      return
    }
    const f = toForm(res.data.page)
    setPage(res.data.page)
    setForm(f)
    setBaseline(f)
    setVersion(0)
    setSavedVersion(0)
    setFieldErrors({})
  }, [pageId])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = version !== savedVersion
  useUnsavedGuard(dirty)

  const draft = useLocalDraft<Form | null>(page ? `spatium:page-draft:${page.id}` : null, form, baseline)

  const patch = useCallback((partial: Partial<Form>) => {
    setForm((f) => (f ? { ...f, ...partial } : f))
    setVersion((v) => v + 1)
  }, [])
  const onBlocksChange = useCallback((blocks: EditorBlock[]) => patch({ blocks }), [patch])

  const deferredForm = useDeferredValue(form)
  const gate = useMemo(
    () =>
      deferredForm
        ? computePageGate({
            title: deferredForm.title,
            slug: deferredForm.slug,
            metaTitle: nullable(deferredForm.metaTitle),
            metaDescription: nullable(deferredForm.metaDescription),
            ogImage: nullable(deferredForm.ogImage),
            ogImageAlt: nullable(deferredForm.ogImageAlt),
            blocks: deferredForm.blocks,
          })
        : null,
    [deferredForm],
  )

  // Focus a field after switching panels (gate "Perbaiki" links, save errors).
  useEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    const el = document.getElementById(id)
    if (el) {
      pendingFocus.current = null
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: 'nearest' })
    }
  })

  useEffect(() => {
    if (blockIssues.length === 0) setBanner((b) => (b?.aboutBlocks ? null : b))
  }, [blockIssues])

  // Errors take focus (they need action); success messages are only announced.
  useEffect(() => {
    if (banner && banner.tone !== 'success') bannerRef.current?.focus()
  }, [banner])

  const goToField = (field: FieldKey) => {
    setPanel('settings')
    pendingFocus.current = FIELD_ID[field]
  }

  const goToBlocks = (index?: number) => {
    setPanel('blocks')
    const block = index !== undefined && form ? form.blocks[index] : undefined
    const target = block ?? (blockIssues[0] && form ? form.blocks[blockIssues[0].index] : undefined)
    if (target) setSelectedBlock(target.id)
  }

  const goToGateTarget = (target: GateTarget) => (target === 'blocks' ? goToBlocks() : goToField(target))

  const blockIssueItems = (issues: BlockIssue[], blocks: EditorBlock[]) =>
    issues.map((i) => ({ text: formatIssue(i, blocks), fixLabel: 'Buka blok', onFix: i.index >= 0 ? () => goToBlocks(i.index) : undefined }))

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = async (): Promise<PageDto | null> => {
    if (!form || !page || saving) return null
    // Local checks first: they are instant and point at the exact field.
    const errors: FieldErrors = {}
    if (!form.title.trim()) errors.title = 'Isi judul halaman.'
    const slug = pageSlugSchema.safeParse(form.slug)
    if (!slug.success) errors.slug = slug.error.issues[0]?.message ?? 'Slug tidak valid.'
    if (form.ogImage.trim() && !form.ogImageAlt.trim()) errors.ogImageAlt = 'Isi teks alternatif untuk gambar pratinjau.'
    setFieldErrors(errors)
    const firstField = (Object.keys(errors) as FieldKey[])[0]
    if (firstField) {
      setBanner({
        tone: 'error',
        title: 'Belum bisa menyimpan. Periksa kolom berikut:',
        items: (Object.keys(errors) as FieldKey[]).map((k) => ({ text: errors[k] ?? '', fixLabel: 'Ke kolom', onFix: () => goToField(k) })),
      })
      return null
    }
    if (blockIssues.length > 0) {
      setBanner({
        tone: 'error',
        aboutBlocks: true,
        title: `Belum bisa menyimpan: ${blockIssues.length} masalah pada blok.`,
        items: blockIssueItems(blockIssues, form.blocks),
      })
      return null
    }

    setSaving(true)
    const versionAtSave = version
    const res = await pagesApi.update(page.id, {
      title: form.title.trim(),
      slug: form.slug.trim(),
      metaTitle: nullable(form.metaTitle),
      metaDescription: nullable(form.metaDescription),
      ogImage: nullable(form.ogImage),
      ogImageAlt: nullable(form.ogImageAlt),
      robots: form.robots,
      blocks: form.blocks,
      expectedUpdatedAt: page.updatedAt,
    })
    setSaving(false)

    if (res.ok) {
      const saved = res.data.page
      const f = toForm(saved)
      setPage(saved)
      setBaseline(f)
      // Edits made while the request was in flight stay in the form (still dirty).
      if (versionRef.current === versionAtSave) {
        setForm(f)
        setSavedVersion(versionAtSave)
      }
      setLastSavedAt(saved.updatedAt)
      setBanner(null)
      draft.clear()
      onChanged()
      return saved
    }

    const { failure } = res
    if (failure.code === 'conflict') {
      setBanner({
        tone: 'warning',
        title: failure.error,
        actions: (
          <Button size="sm" icon={RotateCcw} onClick={() => void load().then(() => setBanner(null))}>
            Muat versi terbaru (buang perubahan saya)
          </Button>
        ),
      })
      return null
    }
    if (failure.code === 'slug_taken') {
      setFieldErrors({ slug: failure.error })
      goToField('slug')
    }
    const issueItems = (failure.issues ?? []).map((text) => {
      const field = (Object.keys(FIELD_ID) as FieldKey[]).find((k) => text.startsWith(`${k}:`))
      return { text, fixLabel: 'Ke kolom', onFix: field ? () => goToField(field) : undefined }
    })
    setBanner({
      tone: 'error',
      title: `Gagal menyimpan: ${failure.error}`,
      items: [...issueItems, ...blockIssueItems(failure.blockIssues ?? [], form.blocks)],
    })
    return null
  }

  // ── Status ─────────────────────────────────────────────────────────────────
  const changeStatus = async (to: PageStatus) => {
    if (!page || !form || statusBusy) return
    setStatusBusy(to)
    let current = page
    if (dirty) {
      const saved = await save()
      if (!saved) {
        setStatusBusy(null)
        return
      }
      current = saved
    }
    if (to === 'published' && gate && (gate.issues.length > 0 || gate.blockIssues.length > 0)) {
      setStatusBusy(null)
      setBanner({
        tone: 'error',
        title: 'Belum bisa diterbitkan. Lengkapi syarat berikut:',
        items: [
          ...gate.issues.map((text) => ({ text, fixLabel: 'Perbaiki', onFix: () => goToGateTarget(gateIssueTarget(text)) })),
          ...blockIssueItems(gate.blockIssues, form.blocks),
        ],
      })
      return
    }
    const res = await pagesApi.setStatus(current.id, to)
    setStatusBusy(null)
    if (res.ok) {
      setPage(res.data.page)
      const msg: Record<PageStatus, string> = {
        published: `Halaman terbit di /${res.data.page.slug}.`,
        draft: 'Halaman dijadikan draf dan tidak lagi tampil di situs.',
        in_review: 'Halaman dikirim untuk review.',
        archived: 'Halaman diarsipkan dan tidak tampil di situs.',
      }
      setBanner({ tone: 'success', title: msg[to] })
      onChanged()
      return
    }
    setBanner({
      tone: 'error',
      title: res.failure.error,
      items: [
        ...(res.failure.issues ?? []).map((text) => ({ text, fixLabel: 'Perbaiki', onFix: () => goToGateTarget(gateIssueTarget(text)) })),
        ...blockIssueItems(res.failure.blockIssues ?? [], form.blocks),
      ],
    })
  }

  const remove = async () => {
    if (!page || deleting) return
    setDeleting(true)
    const res = await pagesApi.remove(page.id)
    setDeleting(false)
    if (res.ok) {
      setDeleteOpen(false)
      draft.clear()
      onDeleted(page.title)
      return
    }
    setDeleteOpen(false)
    setBanner({ tone: 'error', title: `Gagal menghapus: ${res.failure.error}` })
  }

  const requestBack = () => (dirty ? setLeaveOpen(true) : onBack())

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        <p>Halaman gagal dimuat: {loadError}</p>
        <div className="flex gap-2">
          <Button size="sm" icon={ArrowLeft} onClick={onBack}>
            Kembali ke daftar
          </Button>
          <Button size="sm" icon={RotateCcw} onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      </div>
    )
  }
  if (!page || !form) {
    return (
      <p aria-busy="true" className="rounded-xl border border-white/10 p-6 text-sm text-neutral-300">
        Memuat halaman…
      </p>
    )
  }

  const published = page.status === 'published'
  // Editing a live page is a publishing decision (PATCH /api/pages/:id needs page:publish then).
  const canSave = canEdit && (!published || canPublish)
  const saveState = saving ? 'Menyimpan…' : dirty ? 'Perubahan belum disimpan' : lastSavedAt ? 'Semua perubahan tersimpan' : ''

  const lifecycle: { to: PageStatus; label: string; icon: typeof Globe; needsPublisher: boolean }[] =
    page.status === 'published'
      ? [{ to: 'draft', label: 'Tarik dari situs', icon: Undo2, needsPublisher: true }]
      : page.status === 'archived'
        ? [{ to: 'draft', label: 'Pulihkan ke draf', icon: RotateCcw, needsPublisher: true }]
        : [{ to: 'published', label: 'Terbitkan', icon: Globe, needsPublisher: true }]
  const secondary: { to: PageStatus; label: string; icon: typeof Globe; needsPublisher: boolean }[] = [
    ...(page.status === 'draft' ? [{ to: 'in_review' as const, label: 'Kirim ke review', icon: Send, needsPublisher: false }] : []),
    ...(page.status === 'in_review' ? [{ to: 'draft' as const, label: 'Kembalikan ke draf', icon: Undo2, needsPublisher: false }] : []),
    ...(page.status !== 'archived' ? [{ to: 'archived' as const, label: 'Arsipkan', icon: Archive, needsPublisher: true }] : []),
  ]

  const recoverNotice = draft.recoverable?.value ? (
    <div role="status" className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
      <p className="flex items-start gap-2">
        <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Ada perubahan yang belum disimpan dari <DateTime iso={new Date(draft.recoverable.savedAt).toISOString()} /> di perangkat ini.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            const stored = draft.recoverable?.value
            if (stored) {
              setForm({ ...stored, blocks: ensureBlockIds(stored.blocks) })
              setVersion((v) => v + 1)
            }
            draft.dismiss()
          }}
        >
          Pulihkan perubahan
        </Button>
        <Button size="sm" onClick={draft.clear}>
          Buang
        </Button>
      </div>
    </div>
  ) : null

  const settingsPanel = (
    <SettingsPanel
      form={form}
      page={page}
      errors={fieldErrors}
      onPatch={(p) => {
        patch(p)
        const keys = Object.keys(p) as FieldKey[]
        if (keys.some((k) => fieldErrors[k])) {
          setFieldErrors((e) => {
            const next = { ...e }
            for (const k of keys) delete next[k]
            return next
          })
        }
      }}
      gate={gate}
      onFix={goToGateTarget}
    />
  )

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-surface-base lg:h-[calc(100dvh-9rem)] lg:min-h-[34rem] lg:overflow-clip">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={requestBack}>
          Semua halaman
        </Button>
        <div className="min-w-[12rem] flex-1">
          <h2 className="font-heading text-base font-semibold text-white [overflow-wrap:anywhere]">{form.title || 'Tanpa judul'}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300">
            <span className="font-mono [overflow-wrap:anywhere]">/{page.slug}</span>
            <StatusBadge status={page.status} />
            <span role="status" className="inline-flex items-center gap-1">
              {dirty && !saving ? <AlertCircle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> : null}
              {saveState}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/admin/preview/page/${page.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white hover:bg-white/[0.08] ${FOCUS_RING}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Pratinjau<span className="sr-only"> versi tersimpan (tab baru)</span>
          </a>
          {published ? (
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white hover:bg-white/[0.08] ${FOCUS_RING}`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Lihat halaman<span className="sr-only"> (tab baru)</span>
            </a>
          ) : null}
          {lifecycle.map((a) =>
            !canEdit || (a.needsPublisher && !canPublish) ? null : (
              <Button key={a.to} icon={a.icon} busy={statusBusy === a.to} onClick={() => void changeStatus(a.to)}>
                {statusBusy === a.to ? 'Memproses…' : a.label}
              </Button>
            ),
          )}
          <MoreMenu
            items={[
              ...secondary
                .filter((a) => canEdit && (!a.needsPublisher || canPublish))
                .map((a) => ({ label: a.label, icon: a.icon, onSelect: () => void changeStatus(a.to) })),
              ...(canDelete ? [{ label: 'Hapus halaman…', icon: Trash2, danger: true, onSelect: () => setDeleteOpen(true) }] : []),
            ]}
          />
          {canSave ? (
            <Button variant="primary" icon={Save} busy={saving} onClick={() => void save()} aria-keyshortcuts="Control+S Meta+S">
              {saving ? 'Menyimpan…' : 'Simpan'}
              <span className="hidden font-mono text-xs font-normal xl:inline" aria-hidden="true">
                {modKey}S
              </span>
            </Button>
          ) : null}
        </div>
        {!canEdit ? (
          <p className="w-full text-xs text-neutral-400">Peran Anda hanya dapat melihat halaman ini.</p>
        ) : !canPublish ? (
          <p className="w-full text-xs text-neutral-400">Peran Anda dapat menyunting draf. Menerbitkan, menarik, dan mengarsipkan dilakukan oleh peran yang berwenang menerbitkan.</p>
        ) : null}
      </header>

      {banner ? (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role={banner.tone === 'success' ? 'status' : 'alert'}
          className={`mx-3 mt-3 rounded-xl border p-3 text-sm outline-none sm:mx-4 ${
            banner.tone === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
              : banner.tone === 'warning'
                ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                : 'border-red-400/40 bg-red-500/10 text-red-100'
          }`}
        >
          <div className="flex items-start gap-2">
            {banner.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-medium">{banner.title}</p>
              {banner.items?.length ? (
                <ul className="space-y-1.5">
                  {banner.items.map((item, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="min-w-0 flex-1 text-xs [overflow-wrap:anywhere]">{item.text}</span>
                      {item.onFix ? (
                        <Button size="sm" variant="ghost" onClick={item.onFix}>
                          {item.fixLabel ?? 'Perbaiki'}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {banner.actions}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setBanner(null)}>
              Tutup
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-h-[28rem] flex-1 lg:min-h-0">
        <BlockEditor
          target="page"
          blocks={form.blocks}
          onChange={onBlocksChange}
          selectedId={selectedBlock}
          onSelect={setSelectedBlock}
          onSave={() => void save()}
          onIssuesChange={setBlockIssues}
          notice={recoverNotice}
          label="Blok halaman"
          activePanel={panel}
          onActivePanelChange={setPanel}
          panels={[
            {
              id: 'settings',
              label: 'Halaman & SEO',
              content: settingsPanel,
              badge: gate && gate.issues.length > 0 ? `${gate.issues.length} syarat` : undefined,
            },
            { id: 'history', label: 'Riwayat', content: <HistoryPanel pageId={page.id} refreshKey={page.updatedAt} /> },
          ]}
        />
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Hapus halaman “${page.title}”?`}
        description={
          published
            ? `Halaman ini sedang terbit. Setelah dihapus, /${page.slug} akan menampilkan 404. Jika hanya ingin menyembunyikannya, pilih “Tarik dari situs”.`
            : 'Halaman dan isinya dihapus permanen. Riwayat perubahan tetap tercatat di log audit.'
        }
        footer={
          <>
            <Button autoFocus onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" icon={Trash2} busy={deleting} onClick={() => void remove()}>
              {deleting ? 'Menghapus…' : 'Hapus permanen'}
            </Button>
          </>
        }
      />

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Simpan perubahan sebelum keluar?"
        description="Ada perubahan yang belum disimpan. Draf juga tersimpan sementara di perangkat ini."
        footer={
          <>
            <Button autoFocus onClick={() => setLeaveOpen(false)}>
              Tetap di sini
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setLeaveOpen(false)
                draft.clear()
                onBack()
              }}
            >
              Buang perubahan
            </Button>
            <Button
              variant="primary"
              icon={Save}
              onClick={async () => {
                setLeaveOpen(false)
                if (await save()) onBack()
              }}
            >
              Simpan lalu keluar
            </Button>
          </>
        }
      />
    </div>
  )
}

function MoreMenu({ items }: { items: { label: string; icon: typeof Globe; danger?: boolean; onSelect: () => void }[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('button')?.focus()
    const onDown = (e: MouseEvent) => {
      if (!listRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (items.length === 0) return null
  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  return (
    <div className="relative" onKeyDown={(e) => e.key === 'Escape' && open && (e.stopPropagation(), close(true))}>
      <Button ref={buttonRef} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Lainnya
        <ChevronDown className={`h-4 w-4 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </Button>
      {open ? (
        <ul
          ref={listRef}
          id={id}
          className="absolute right-0 top-[calc(100%+0.375rem)] z-30 w-64 max-w-[calc(100vw-2rem)] space-y-0.5 rounded-xl border border-white/15 bg-surface-overlay p-1 shadow-2xl"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== buttonRef.current) setOpen(false)
          }}
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  close(false)
                  item.onSelect()
                }}
                className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm ${
                  item.danger ? 'text-red-200 hover:bg-red-500/15' : 'text-neutral-100 hover:bg-white/[0.08]'
                } ${FOCUS_RING}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function SettingsPanel({
  form,
  page,
  errors,
  onPatch,
  gate,
  onFix,
}: {
  form: Form
  page: PageDto
  errors: FieldErrors
  onPatch: (p: Partial<Form>) => void
  gate: ReturnType<typeof computePageGate> | null
  onFix: (target: GateTarget) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const host = siteConfig.url.replace(/^https?:\/\//, '')
  const slugChangedOnLive = page.status === 'published' && form.slug.trim() !== page.slug

  const err = (k: FieldKey) => (errors[k] ? `${FIELD_ID[k]}-error` : null)
  const gateCount = (gate?.issues.length ?? 0) + (gate?.blockIssues.length ? 1 : 0)

  return (
    <div className="space-y-6">
      <section aria-labelledby="gate-heading" className="rounded-xl border border-white/10 bg-surface-elevated p-3">
        <h3 id="gate-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
          {gateCount === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <AlertCircle className="h-4 w-4 text-amber-300" aria-hidden="true" />}
          {gateCount === 0 ? 'Siap diterbitkan' : `Syarat publikasi: ${gateCount} belum terpenuhi`}
        </h3>
        {gate && gateCount > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {gate.issues.map((issue) => (
              <li key={issue} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-200">
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{issue}</span>
                <Button size="sm" variant="ghost" onClick={() => onFix(gateIssueTarget(issue))}>
                  Perbaiki
                </Button>
              </li>
            ))}
            {gate.blockIssues.length ? (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-200">
                <span className="min-w-0 flex-1">{gate.blockIssues.length} masalah skema pada blok.</span>
                <Button size="sm" variant="ghost" onClick={() => onFix('blocks')}>
                  Buka blok
                </Button>
              </li>
            ) : null}
          </ul>
        ) : null}
        {gate?.warnings.length ? (
          <ul className="mt-2 space-y-1 text-xs text-amber-100">
            {gate.warnings.map((w) => (
              <li key={w} className="flex items-start gap-1.5">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="page-basics" className="space-y-4">
        <h3 id="page-basics" className="text-sm font-semibold text-white">
          Halaman
        </h3>
        <div>
          <label htmlFor={FIELD_ID.title} className="mb-1.5 block text-sm font-medium text-neutral-100">
            Judul halaman
          </label>
          <input
            id={FIELD_ID.title}
            type="text"
            value={form.title}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy(err('title'))}
            onChange={(e) => onPatch({ title: e.target.value })}
            className={inputClass(Boolean(errors.title), 'h-10')}
          />
          <FieldError id={`${FIELD_ID.title}-error`} messages={errors.title ? [errors.title] : undefined} />
        </div>
        <div>
          <label htmlFor={FIELD_ID.slug} className="mb-1.5 block text-sm font-medium text-neutral-100">
            Slug (alamat URL)
          </label>
          <div className="flex items-stretch">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-white/15 bg-white/[0.06] px-2.5 font-mono text-xs text-neutral-300" aria-hidden="true">
              /
            </span>
            <input
              id={FIELD_ID.slug}
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={form.slug}
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={describedBy(err('slug'), `${FIELD_ID.slug}-help`)}
              onChange={(e) => onPatch({ slug: e.target.value })}
              className={inputClass(Boolean(errors.slug), 'h-10 rounded-l-none font-mono')}
            />
          </div>
          <FieldError id={`${FIELD_ID.slug}-error`} messages={errors.slug ? [errors.slug] : undefined} />
          <FieldHelp id={`${FIELD_ID.slug}-help`}>
            Alamat publik: <span className="font-mono [overflow-wrap:anywhere]">{host}/{form.slug || '…'}</span>
            {slugChangedOnLive ? (
              <span className="mt-1 block text-amber-200">Halaman ini sudah terbit: URL lama /{page.slug} akan otomatis dialihkan (301) ke slug baru saat disimpan.</span>
            ) : null}
          </FieldHelp>
        </div>
      </section>

      <section aria-labelledby="page-seo" className="space-y-4">
        <h3 id="page-seo" className="text-sm font-semibold text-white">
          SEO & berbagi
        </h3>
        <div>
          <label htmlFor={FIELD_ID.metaTitle} className="mb-1.5 block text-sm font-medium text-neutral-100">
            Meta title
          </label>
          <input
            id={FIELD_ID.metaTitle}
            type="text"
            value={form.metaTitle}
            maxLength={120}
            aria-invalid={errors.metaTitle ? true : undefined}
            aria-describedby={describedBy(err('metaTitle'), `${FIELD_ID.metaTitle}-count`)}
            onChange={(e) => onPatch({ metaTitle: e.target.value })}
            className={inputClass(Boolean(errors.metaTitle), 'h-10')}
          />
          <FieldError id={`${FIELD_ID.metaTitle}-error`} messages={errors.metaTitle ? [errors.metaTitle] : undefined} />
          <Counter id={`${FIELD_ID.metaTitle}-count`} value={form.metaTitle} min={10} ideal={60} max={70} />
        </div>
        <div>
          <label htmlFor={FIELD_ID.metaDescription} className="mb-1.5 block text-sm font-medium text-neutral-100">
            Meta description
          </label>
          <textarea
            id={FIELD_ID.metaDescription}
            rows={3}
            value={form.metaDescription}
            maxLength={320}
            aria-invalid={errors.metaDescription ? true : undefined}
            aria-describedby={describedBy(err('metaDescription'), `${FIELD_ID.metaDescription}-count`)}
            onChange={(e) => onPatch({ metaDescription: e.target.value })}
            className={inputClass(Boolean(errors.metaDescription), 'min-h-[5.5rem] resize-y py-2 leading-relaxed [field-sizing:content]')}
          />
          <FieldError id={`${FIELD_ID.metaDescription}-error`} messages={errors.metaDescription ? [errors.metaDescription] : undefined} />
          <Counter id={`${FIELD_ID.metaDescription}-count`} value={form.metaDescription} min={20} ideal={155} max={165} />
        </div>

        <fieldset className="min-w-0 rounded-xl border border-white/10 p-3">
          <legend className="px-1 text-sm font-medium text-neutral-100">Gambar pratinjau (Open Graph)</legend>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
              {form.ogImage ? (
                // Plain <img>: thumbnail of an arbitrary URL; decorative here (alt text is edited below).
                <img src={form.ogImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2 text-center text-[11px] text-neutral-400">Gambar default situs</span>
              )}
            </div>
            <div className="min-w-[12rem] flex-1 space-y-2">
              <label htmlFor={FIELD_ID.ogImage} className="sr-only">
                URL gambar pratinjau
              </label>
              <input
                id={FIELD_ID.ogImage}
                type="text"
                inputMode="url"
                spellCheck={false}
                placeholder="/images/… atau https://…"
                value={form.ogImage}
                onChange={(e) => onPatch({ ogImage: e.target.value })}
                className={inputClass(false, 'h-10')}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={ImagePlus} onClick={() => setPickerOpen(true)}>
                  Pilih dari media
                </Button>
                {form.ogImage ? (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onPatch({ ogImage: '', ogImageAlt: '' })}>
                    Hapus gambar
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor={FIELD_ID.ogImageAlt} className="mb-1.5 block text-sm font-medium text-neutral-100">
              Teks alternatif{form.ogImage ? <span className="ml-1 text-red-300" aria-hidden="true">*</span> : null}
              {form.ogImage ? <span className="sr-only"> (wajib bila gambar dipakai)</span> : null}
            </label>
            <input
              id={FIELD_ID.ogImageAlt}
              type="text"
              value={form.ogImageAlt}
              aria-invalid={errors.ogImageAlt ? true : undefined}
              aria-describedby={describedBy(err('ogImageAlt'))}
              onChange={(e) => onPatch({ ogImageAlt: e.target.value })}
              className={inputClass(Boolean(errors.ogImageAlt), 'h-10')}
            />
            <FieldError id={`${FIELD_ID.ogImageAlt}-error`} messages={errors.ogImageAlt ? [errors.ogImageAlt] : undefined} />
          </div>
        </fieldset>

        <div>
          <label htmlFor={FIELD_ID.robots} className="mb-1.5 block text-sm font-medium text-neutral-100">
            Visibilitas di mesin pencari
          </label>
          <select id={FIELD_ID.robots} value={form.robots} onChange={(e) => onPatch({ robots: e.target.value as Form['robots'] })} className={inputClass(false, 'h-10')}>
            {ROBOTS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {form.robots !== 'index, follow' ? (
            <p className="mt-1.5 text-xs text-neutral-300">Halaman noindex tidak dimasukkan ke sitemap.</p>
          ) : null}
        </div>
      </section>

      {pickerOpen ? (
        <MediaPickerModal
          isOpen
          currentUrl={form.ogImage}
          title="Pilih gambar pratinjau"
          onClose={() => setPickerOpen(false)}
          onSelect={(url) => onPatch({ ogImage: url })}
        />
      ) : null}
    </div>
  )
}

function HistoryPanel({ pageId, refreshKey }: { pageId: number; refreshKey: string }) {
  const [revisions, setRevisions] = useState<RevisionDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await pagesApi.revisions(pageId)
    if (res.ok) setRevisions(res.data.revisions)
    else setError(res.failure.error)
  }, [pageId])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
        <span className="flex-1">Riwayat gagal dimuat: {error}</span>
        <Button size="sm" icon={RotateCcw} onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }
  if (!revisions) return <p aria-busy="true" className="text-sm text-neutral-300">Memuat riwayat…</p>
  if (revisions.length === 0) return <p className="text-sm text-neutral-300">Belum ada riwayat.</p>

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400">Setiap perubahan menyimpan salinan versi sebelumnya dan tercatat di log audit.</p>
      <ol className="space-y-2">
        {revisions.map((r) => (
          <li key={r.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={r.action === 'status:published' ? 'success' : 'neutral'}>{ACTION_LABEL[r.action] ?? r.action}</Badge>
              <span className="text-xs text-neutral-400">
                <DateTime iso={r.createdAt} />
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-300 [overflow-wrap:anywhere]">oleh {r.actor}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
