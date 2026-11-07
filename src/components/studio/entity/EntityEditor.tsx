'use client'

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Archive, ArrowLeft, CheckCircle2, ExternalLink, Eye, Globe, History, RotateCcw, Save, Send, Trash2, Undo2 } from 'lucide-react'
import { buildPreset } from '@/blocks/presets'
import type { BlockIssue } from '@/lib/blocks/catalog'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'
import { useAuth } from '@/lib/auth/AuthContext'
import { BlockEditor } from '../blocks/BlockEditor'
import { MoreMenu, type MoreMenuItem } from '../blocks/MoreMenu'
import { useLocalDraft, useModKeyLabel, useUnsavedGuard } from '../blocks/hooks'
import { ensureBlockIds, formatIssue, type EditorBlock } from '../blocks/model'
import { Button, Dialog, FOCUS_RING } from '../blocks/ui'
import { DateTime, StatusBadge } from '../pages/shared'
import type { EditorialStatus } from '../pages/status'
import { entityApi, type EntityApiFailure } from './client'
import { CategoryContent, PortfolioContent, ServiceContent, type EditorContext } from './content'
import { PreviewFrame } from './PreviewFrame'
import { SeoPanel } from './SeoPanel'
import {
  ENTITY_LABEL,
  FIELD_TAB,
  STATUS_SUCCESS,
  fieldDomId,
  gateInput,
  gateIssueTarget,
  gateIssueText,
  lifecycleActions,
  payloadFieldTarget,
  previewPath,
  publicPathOf,
  rowToForm,
  statusOf,
  titleOf,
  toSavePayload,
  validateForm,
  type EntityForm,
  type EntityKind,
  type EntityRow,
  type FieldErrors,
  type IssueTarget,
} from './model'

type BannerItem = { text: string; fixLabel?: string; onFix?: () => void }
type Banner = {
  tone: 'error' | 'success' | 'warning'
  title: string
  items?: BannerItem[]
  aboutBlocks?: boolean
  /** Focus stays where it was sent (e.g. the first invalid field). */
  keepFocus?: boolean
}

type Props = {
  kind: EntityKind
  id: number
  context: EditorContext
  onBack: () => void
  /** After a save/status change/delete the lists should reflect. */
  onChanged: () => void
  onDeleted: (title: string) => void
}

const ACTION_ICON: Record<EditorialStatus, typeof Globe> = {
  published: Globe,
  draft: Undo2,
  in_review: Send,
  approved: CheckCircle2,
  archived: Archive,
}

const TIME_FMT = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })

/**
 * One editor for service categories, services and portfolios. Normal flow
 * inside #studio-main (no overlay): header with lifecycle actions, an
 * actionable issue banner, then the block editor with tabs Konten · Blok ·
 * SEO & berbagi and a live preview of the public page (iframe + postMessage).
 */
export function EntityEditor({ kind, id, context, onBack, onChanged, onDeleted }: Props) {
  const label = ENTITY_LABEL[kind]
  const { can } = useAuth()
  const canEdit = can(`${label.capability}:update`)
  const canPublish = can(`${label.capability}:publish`)
  const canDelete = can(`${label.capability}:delete`)
  const modKey = useModKeyLabel()

  const [row, setRow] = useState<EntityRow | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<EntityForm | null>(null)
  const [baseline, setBaseline] = useState<EntityForm | null>(null)
  const [version, setVersion] = useState(0)
  const [savedVersion, setSavedVersion] = useState(0)
  const [blockIssues, setBlockIssues] = useState<BlockIssue[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [panel, setPanel] = useState('content')
  const [busy, setBusy] = useState<'save' | EditorialStatus | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [dialog, setDialog] = useState<'delete' | 'leave' | 'preset' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const versionRef = useRef(0)
  versionRef.current = version
  const pendingFocus = useRef<string | null>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusedHeading = useRef(false)

  const fetchRow = useCallback(async (): Promise<EntityRow | null> => {
    const res = await entityApi.list(kind)
    if (!res.ok) {
      setLoadError(res.failure.error)
      return null
    }
    const found = res.data.find((r) => r.id === id)
    if (!found) setLoadError(`${label.one[0]?.toUpperCase()}${label.one.slice(1)} ini tidak ditemukan. Mungkin sudah dihapus.`)
    return found ?? null
  }, [kind, id, label.one])

  const load = useCallback(async () => {
    setLoadError(null)
    const found = await fetchRow()
    if (!found) return
    const f = rowToForm(kind, found)
    setRow(found)
    setForm(f)
    setBaseline(f)
    setVersion(0)
    setSavedVersion(0)
    setErrors({})
  }, [fetchRow, kind])

  useEffect(() => {
    void load()
  }, [load])

  // Move focus into the editor once it has content (the list's Edit button is gone).
  useEffect(() => {
    if (focusedHeading.current || !headingRef.current) return
    focusedHeading.current = true
    headingRef.current.focus()
  })

  const dirty = version !== savedVersion
  useUnsavedGuard(dirty)
  const draft = useLocalDraft<EntityForm | null>(row ? `spatium:entity-draft:${kind}:${row.id}` : null, form, baseline)

  const patch = useCallback((partial: Partial<EntityForm>) => {
    setForm((f) => (f ? ({ ...f, ...partial } as EntityForm) : f))
    setVersion((v) => v + 1)
    const keys = Object.keys(partial)
    setErrors((e) => {
      if (!keys.some((k) => e[k])) return e
      const next = { ...e }
      for (const k of keys) delete next[k]
      return next
    })
  }, [])
  const onBlocksChange = useCallback((blocks: EditorBlock[]) => patch({ blocks }), [patch])

  const deferredForm = useDeferredValue(form)
  const gate = useMemo(() => (deferredForm ? validateCatalogPublication(gateInput(deferredForm)) : null), [deferredForm])

  useEffect(() => {
    const domId = pendingFocus.current
    if (!domId) return
    const el = document.getElementById(domId)
    if (el) {
      pendingFocus.current = null
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: 'center' })
    }
  })

  useEffect(() => {
    if (blockIssues.length === 0) setBanner((b) => (b?.aboutBlocks ? null : b))
  }, [blockIssues])

  // Errors take focus (they need action); success is announced only.
  useEffect(() => {
    if (banner && banner.tone !== 'success' && !banner.keepFocus) bannerRef.current?.focus()
  }, [banner])

  const goToField = useCallback(
    (field: string) => {
      setPanel(FIELD_TAB[kind][field] === 'seo' ? 'seo' : 'content')
      pendingFocus.current = fieldDomId(field)
    },
    [kind],
  )

  const goToBlocks = useCallback(
    (index?: number) => {
      setPanel('blocks')
      const list = form?.blocks ?? []
      const target = index !== undefined ? list[index] : blockIssues[0] ? list[blockIssues[0].index] : undefined
      if (target) setSelectedBlock(target.id)
    },
    [form, blockIssues],
  )

  const goTo = useCallback((t: IssueTarget) => (t.kind === 'blocks' ? goToBlocks(t.index) : goToField(t.field)), [goToBlocks, goToField])
  const openContent = useCallback(() => setPanel('content'), [])

  const blockItems = (issues: readonly BlockIssue[], blocks: readonly EditorBlock[]): BannerItem[] =>
    issues.map((i) => ({ text: formatIssue(i, blocks), fixLabel: 'Buka blok', onFix: i.index >= 0 ? () => goToBlocks(i.index) : undefined }))

  const failureBanner = (title: string, failure: EntityApiFailure, f: EntityForm): Banner => {
    const fieldErrors: FieldErrors = {}
    const items: BannerItem[] = []
    for (const issue of failure.fieldIssues) {
      const target = payloadFieldTarget(kind, issue.field)
      if (target?.kind === 'field') fieldErrors[target.field] = issue.message
      items.push({ text: issue.message, fixLabel: target?.kind === 'blocks' ? 'Buka blok' : 'Ke kolom', onFix: target ? () => goTo(target) : undefined })
    }
    if (failure.blockIssues.length) items.push(...blockItems(failure.blockIssues, f.blocks))
    else {
      for (const issue of failure.issues) {
        const target = gateIssueTarget(kind, issue)
        items.push({ text: gateIssueText(kind, issue), fixLabel: target?.kind === 'blocks' ? 'Buka blok' : 'Perbaiki', onFix: target ? () => goTo(target) : undefined })
      }
    }
    if (failure.status === 409) fieldErrors.slug = failure.error
    setErrors(fieldErrors)
    return { tone: 'error', title, items }
  }

  /** Local checks: instant and pointing at the exact field. Returns false when blocked. */
  const checkLocally = (f: EntityForm, publishing: boolean): boolean => {
    const found = validateForm(f)
    setErrors(found)
    const keys = Object.keys(found)
    if (keys.length) {
      setBanner({
        tone: 'error',
        title: 'Belum bisa menyimpan. Perbaiki kolom berikut:',
        keepFocus: true,
        items: keys.map((k) => ({ text: found[k] ?? '', fixLabel: 'Ke kolom', onFix: () => goToField(k) })),
      })
      const first = keys[0]
      if (first) goToField(first)
      return false
    }
    if (blockIssues.length) {
      setBanner({ tone: 'error', aboutBlocks: true, title: `Belum bisa menyimpan: ${blockIssues.length} masalah pada blok.`, items: blockItems(blockIssues, f.blocks) })
      return false
    }
    if (publishing) {
      const check = validateCatalogPublication(gateInput(f))
      if (!check.canPublish) {
        setBanner({
          tone: 'error',
          title: 'Belum bisa diterbitkan. Lengkapi syarat berikut:',
          items: check.issues.map((issue) => {
            const target = gateIssueTarget(kind, issue)
            return { text: gateIssueText(kind, issue), fixLabel: target?.kind === 'blocks' ? 'Buka blok' : 'Perbaiki', onFix: target ? () => goTo(target) : undefined }
          }),
        })
        return false
      }
    }
    return true
  }

  /** Saves the form (changed fields only), optionally with a status change, in one request. */
  const persist = async (status?: EditorialStatus): Promise<boolean> => {
    if (!form || !row || busy) return false
    if (!checkLocally(form, status === 'published')) return false
    setBusy(status ?? 'save')
    const versionAtSave = version
    const res = await entityApi.save(kind, toSavePayload(form, baseline, row, status ? { status } : {}))
    if (!res.ok) {
      setBusy(null)
      setBanner(failureBanner(`${status ? 'Status belum berubah' : 'Belum tersimpan'}: ${res.failure.error}`, res.failure, form))
      return false
    }
    const fresh = await fetchRow()
    setBusy(null)
    if (!fresh) return false
    const f = rowToForm(kind, fresh)
    setRow(fresh)
    setBaseline(f)
    // Edits made while the request was in flight stay in the form (still unsaved).
    if (versionRef.current === versionAtSave) {
      setForm(f)
      setSavedVersion(versionAtSave)
    }
    setSavedAt(new Date())
    draft.clear()
    setBanner(status ? { tone: 'success', title: STATUS_SUCCESS[status] } : null)
    onChanged()
    return true
  }

  const remove = async () => {
    if (!row || !form || deleting) return
    setDeleting(true)
    const res = await entityApi.remove(kind, row.id)
    setDeleting(false)
    setDialog(null)
    if (res.ok) {
      draft.clear()
      onDeleted(titleOf(form) || row.slug)
      return
    }
    setBanner({ tone: 'error', title: `Belum terhapus: ${res.failure.error}` })
  }

  const restorePreset = () => {
    patch({ blocks: ensureBlockIds(buildPreset(kind, { ids: 'fresh' })) })
    setSelectedBlock(null)
    setDialog(null)
    setPanel('blocks')
  }

  const requestBack = () => (dirty ? setDialog('leave') : onBack())

  /* --------------------------------- Render -------------------------------- */

  if (loadError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">
        <p>{loadError}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={ArrowLeft} onClick={onBack}>
            {label.all}
          </Button>
          <Button size="sm" icon={RotateCcw} onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      </div>
    )
  }
  if (!row || !form || !gate) {
    return (
      <p role="status" aria-busy="true" className="rounded-xl border border-white/10 p-6 text-sm text-neutral-300">
        Memuat {label.one}…
      </p>
    )
  }

  const status = statusOf(row)
  const title = titleOf(form)
  const parent = form.kind === 'service' ? context.categories.find((c) => c.id === row.categoryId) : undefined
  const storedForm = baseline ?? form
  const publicPath = publicPathOf(storedForm, parent?.slug ?? null)
  const live = status === 'published' && (form.kind !== 'service' || parent?.status === 'published')
  const saveState = busy === 'save' ? 'Menyimpan…' : dirty ? 'Belum disimpan' : savedAt ? `Perubahan disimpan · ${TIME_FMT.format(savedAt)}` : 'Tersimpan'

  const actions = lifecycleActions(status).filter((a) => canEdit && (!a.publisher || canPublish))
  const primary = actions.filter((a) => a.primary)
  const menuItems: MoreMenuItem[] = [
    ...actions.filter((a) => !a.primary).map((a) => ({ label: a.label, icon: ACTION_ICON[a.to], onSelect: () => void persist(a.to) })),
    ...(canDelete ? [{ label: `Hapus ${label.one}…`, icon: Trash2, danger: true, onSelect: () => setDialog('delete') }] : []),
  ]

  const contentErrors = Object.keys(errors).filter((k) => FIELD_TAB[kind][k] === 'content').length
  const contentProps = { stored: row, errors, context }
  const contentPanel =
    form.kind === 'service-category' ? (
      <CategoryContent form={form} onPatch={patch} {...contentProps} />
    ) : form.kind === 'service' ? (
      <ServiceContent form={form} onPatch={patch} {...contentProps} />
    ) : (
      <PortfolioContent form={form} onPatch={patch} {...contentProps} />
    )

  const recoverNotice = draft.recoverable?.value ? (
    <div role="status" className="mx-3 mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100 sm:mx-4">
      <p className="flex items-start gap-2">
        <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Ada perubahan yang belum disimpan dari <DateTime iso={new Date(draft.recoverable.savedAt).toISOString()} /> di perangkat ini.
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            const stored = draft.recoverable?.value
            if (stored && stored.kind === kind) {
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

  const blocksNotice = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-white/10 p-3 text-sm text-neutral-200">
      <p className="min-w-0 flex-1">
        Blok bertanda <span className="font-medium text-info-300">Isi dari tab Konten</span> menampilkan data {label.one} ini; blok lain bisa disisipkan di mana saja.
      </p>
      {canEdit ? (
        <Button size="sm" icon={RotateCcw} onClick={() => setDialog('preset')}>
          Pulihkan preset
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-surface-base lg:h-[calc(100dvh-9rem)] lg:min-h-[34rem] lg:overflow-clip">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={requestBack}>
          {label.all}
        </Button>
        <div className="min-w-[12rem] flex-1">
          <h2 ref={headingRef} tabIndex={-1} className="font-heading text-base font-semibold text-white outline-none [overflow-wrap:anywhere]">
            {title || 'Tanpa judul'}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300">
            <span className="font-mono [overflow-wrap:anywhere]">{publicPath ?? 'Belum ada kategori induk'}</span>
            <StatusBadge status={status} />
            <span role="status" className="inline-flex items-center gap-1">
              {dirty && busy !== 'save' ? <AlertCircle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> : null}
              {saveState}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={previewPath(kind, row.id)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white hover:bg-white/[0.08] ${FOCUS_RING}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Pratinjau<span className="sr-only"> versi tersimpan (tab baru)</span>
          </a>
          {live && publicPath ? (
            <a
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white hover:bg-white/[0.08] ${FOCUS_RING}`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Lihat di situs<span className="sr-only"> (tab baru)</span>
            </a>
          ) : null}
          {primary.map((a) => (
            <Button key={a.to} icon={ACTION_ICON[a.to]} busy={busy === a.to} onClick={() => void persist(a.to)}>
              {busy === a.to ? 'Memproses…' : a.label}
            </Button>
          ))}
          <MoreMenu items={menuItems} />
          {canEdit ? (
            <Button variant="primary" icon={Save} busy={busy === 'save'} onClick={() => void persist()} aria-keyshortcuts="Control+S Meta+S">
              {busy === 'save' ? 'Menyimpan…' : 'Simpan'}
              <span className="hidden font-mono text-xs font-normal xl:inline" aria-hidden="true">
                {modKey}S
              </span>
            </Button>
          ) : null}
        </div>
        {!canEdit ? (
          <p className="w-full text-xs text-neutral-300">Peran Anda hanya dapat melihat {label.one} ini.</p>
        ) : !canPublish ? (
          <p className="w-full text-xs text-neutral-300">Peran Anda dapat menyunting dan mengirim ke review. Menerbitkan, menarik, dan mengarsipkan dilakukan peran penerbit.</p>
        ) : null}
      </header>

      {recoverNotice}

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
              <p className="font-medium [overflow-wrap:anywhere]">{banner.title}</p>
              {banner.items?.length ? (
                <ul className="space-y-1.5">
                  {banner.items.map((item, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.text}</span>
                      {item.onFix ? (
                        <Button size="sm" variant="ghost" onClick={item.onFix}>
                          {item.fixLabel ?? 'Perbaiki'}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setBanner(null)}>
              Tutup
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-h-[28rem] flex-1 lg:min-h-0">
        <BlockEditor
          target={kind}
          blocks={form.blocks}
          onChange={onBlocksChange}
          selectedId={selectedBlock}
          onSelect={setSelectedBlock}
          onSave={() => void persist()}
          onIssuesChange={setBlockIssues}
          notice={blocksNotice}
          label={`Blok ${label.one}`}
          activePanel={panel}
          onActivePanelChange={setPanel}
          onOpenContent={openContent}
          panels={[
            { id: 'content', label: 'Konten', content: contentPanel, badge: contentErrors ? `${contentErrors} perlu diperbaiki` : undefined },
            { id: 'blocks', label: 'Blok', content: null },
            { id: 'seo', label: 'SEO & berbagi', content: <SeoPanel form={form} gate={gate} errors={errors} onPatch={patch} onFix={goTo} />, badge: gate.issues.length ? `${gate.issues.length} syarat` : undefined },
          ]}
          renderPreview={({ selectedId, onSelect }) =>
            deferredForm ? <PreviewFrame form={deferredForm} row={row} title={title} selectedId={selectedId} onSelect={onSelect} /> : null
          }
        />
      </div>

      <Dialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title={`Hapus ${label.one} “${title || row.slug}”?`}
        description={
          <>
            {status === 'published' ? `Sedang terbit: setelah dihapus, ${publicPath ?? 'alamatnya'} menampilkan 404. Untuk menyembunyikan saja, pilih “Tarik dari situs”. ` : ''}
            {kind === 'service-category' ? 'Layanan di kategori ini tetap ada tetapi kehilangan kategori induk, jadi halamannya tidak tampil sampai dipindah. ' : ''}
            Data dihapus permanen; riwayatnya tetap di log audit.
          </>
        }
        footer={
          <>
            <Button autoFocus onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button variant="danger" icon={Trash2} busy={deleting} onClick={() => void remove()}>
              {deleting ? 'Menghapus…' : 'Hapus permanen'}
            </Button>
          </>
        }
      />

      <Dialog
        open={dialog === 'preset'}
        onClose={() => setDialog(null)}
        title="Pulihkan blok preset?"
        description={`Semua blok ${label.one} ini diganti dengan susunan bawaan. Isi tab Konten tidak berubah. Belum tersimpan sampai Anda menekan Simpan; tekan “Buang perubahan” saat keluar untuk membatalkan.`}
        footer={
          <>
            <Button autoFocus onClick={() => setDialog(null)}>
              Batal
            </Button>
            <Button variant="danger" icon={RotateCcw} onClick={restorePreset}>
              Ganti dengan preset
            </Button>
          </>
        }
      />

      <Dialog
        open={dialog === 'leave'}
        onClose={() => setDialog(null)}
        title="Simpan perubahan sebelum keluar?"
        description="Ada perubahan yang belum disimpan. Salinannya juga tersimpan sementara di perangkat ini."
        footer={
          <>
            <Button autoFocus onClick={() => setDialog(null)}>
              Tetap di sini
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDialog(null)
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
                setDialog(null)
                if (await persist()) onBack()
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
