'use client'

import React, { useCallback, useDeferredValue, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, Keyboard, PenLine, Plus, Redo2, Undo2, X } from 'lucide-react'
import { createBlock, getBlockEntry, validateBlockList, type BlockIssue, type BlockTarget } from '@/lib/blocks/catalog'
import { BlockOutline, headerSelector, type RowActions } from './BlockOutline'
import { BlockPalette } from './BlockPalette'
import { BlockPreview, type ContextData } from './BlockPreview'
import { useModKeyLabel, useUndoable } from './hooks'
import { Button, Dialog, IconButton, Kbd } from './ui'
import {
  type EditorBlock,
  catalogIssues,
  cloneBlock,
  groupIssuesByBlock,
  moveItem,
  pathKey,
  removeItem,
  writeField,
} from './model'

export type BlockEditorLayout = 'split' | 'editor' | 'preview'

export type BlockEditorPanel = { id: string; label: string; content: React.ReactNode; badge?: React.ReactNode }

export type BlockEditorProps = {
  target: BlockTarget
  blocks: EditorBlock[]
  onChange: (blocks: EditorBlock[]) => void
  /** Controlled selection (optional). */
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Registers Ctrl/⌘+S. */
  onSave?: () => void
  /** All current issues (schema + catalogue-required), after each validation pass. */
  onIssuesChange?: (issues: BlockIssue[]) => void
  layout?: BlockEditorLayout
  contextData?: ContextData
  /** Rendered above the outline (e.g. draft-recovery notice). */
  notice?: React.ReactNode
  /** Extra tabs next to "Blok" in the editing column (e.g. SEO, history). */
  panels?: BlockEditorPanel[]
  activePanel?: string
  onActivePanelChange?: (id: string) => void
  /** Accessible name for the block list, e.g. "Blok halaman". */
  label?: string
}

type FocusRequest = { kind: 'header' | 'field'; id: string } | { kind: 'add' } | null
type Toast = { message: string } | null

function isEditable(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

/**
 * Schema-driven block editor: outline with inline generated forms, live
 * preview, searchable palette, undo/redo, keyboard reordering and per-block
 * validation. Palette, defaults and forms all come from `lib/blocks/catalog`.
 */
export function BlockEditor({
  target,
  blocks,
  onChange,
  selectedId: selectedProp,
  onSelect,
  onSave,
  onIssuesChange,
  layout = 'split',
  contextData,
  notice,
  panels,
  activePanel: activePanelProp,
  onActivePanelChange,
  label = 'Blok',
}: BlockEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const modKey = useModKeyLabel()
  const baseId = useId()

  const { apply, undo, redo, canUndo, canRedo } = useUndoable(blocks, onChange)
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  // Selection (controlled or internal) + where it came from, for scroll sync.
  const [selectedInternal, setSelectedInternal] = useState<string | null>(null)
  const selectedId = selectedProp !== undefined ? selectedProp : selectedInternal
  const [selectSource, setSelectSource] = useState<'outline' | 'preview'>('outline')
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const select = useCallback((id: string | null, source: 'outline' | 'preview' = 'outline') => {
    setSelectSource(source)
    setSelectedInternal(id)
    onSelectRef.current?.(id)
  }, [])

  const [paletteAt, setPaletteAt] = useState<number | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [announcement, setAnnouncement] = useState('')
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const [panelInternal, setPanelInternal] = useState('blocks')
  const activePanel = activePanelProp ?? panelInternal
  const setActivePanel = (id: string) => {
    setPanelInternal(id)
    onActivePanelChange?.(id)
  }
  const focusRequest = useRef<FocusRequest>(null)

  const announce = useCallback((msg: string) => {
    // Toggle a trailing zero-width space so repeating the same message is still announced.
    setAnnouncement((prev) => (prev.replace(/​$/, '') === msg ? `${msg}​` : msg))
  }, [])

  // ── Validation (deferred so typing stays responsive) ──────────────────────
  const deferredBlocks = useDeferredValue(blocks)
  const issues = useMemo(() => {
    const schema = validateBlockList(deferredBlocks)
    return [...schema.issues, ...catalogIssues(deferredBlocks)]
  }, [deferredBlocks])
  const grouped = useMemo(() => groupIssuesByBlock(issues, deferredBlocks), [issues, deferredBlocks])
  const issueKeys = useMemo(() => {
    const keys = new Map<string, string>()
    for (const [id, g] of grouped) keys.set(id, JSON.stringify([g.general, [...g.byPath]]))
    return keys
  }, [grouped])
  const invalidBlockIds = useMemo(() => deferredBlocks.filter((b) => grouped.has(b.id)).map((b) => b.id), [deferredBlocks, grouped])
  const listIssues = grouped.get('')?.general ?? []

  const reportIssues = useEffectEvent((list: BlockIssue[]) => onIssuesChange?.(list))
  useEffect(() => {
    reportIssues(issues)
  }, [issues])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const commit = useCallback(
    (next: EditorBlock[], options: { coalesceKey?: string; undoLabel?: string; announce?: string } = {}) => {
      apply(next, { coalesceKey: options.coalesceKey })
      setToast(options.undoLabel ? { message: options.undoLabel } : null)
      if (options.announce) announce(options.announce)
      else if (options.undoLabel) announce(`${options.undoLabel}. Tekan Urungkan atau ${modKey}+Z untuk mengembalikan.`)
    },
    [apply, announce, modKey],
  )

  const labelOf = (b: EditorBlock | undefined) => (b ? (getBlockEntry(b.type)?.label ?? b.type) : 'Blok')

  const actions: RowActions = useMemo(
    () => ({
      select: (id) => select(id, 'outline'),
      move: (id, delta) => {
        const list = blocksRef.current
        const from = list.findIndex((b) => b.id === id)
        const to = from + delta
        if (from < 0 || to < 0 || to >= list.length) return
        focusRequest.current = { kind: 'header', id }
        commit(moveItem(list, from, to), { announce: `${labelOf(list[from])} dipindah ke posisi ${to + 1} dari ${list.length}.` })
      },
      duplicate: (id) => {
        const list = blocksRef.current
        const index = list.findIndex((b) => b.id === id)
        if (index < 0) return
        const copy = cloneBlock(list[index])
        const next = [...list]
        next.splice(index + 1, 0, copy)
        focusRequest.current = { kind: 'header', id: copy.id }
        commit(next, { announce: `${labelOf(copy)} diduplikat sebagai blok ${index + 2}.` })
        select(copy.id)
      },
      remove: (id) => {
        const list = blocksRef.current
        const index = list.findIndex((b) => b.id === id)
        if (index < 0) return
        const neighbour = list[index + 1] ?? list[index - 1]
        focusRequest.current = neighbour ? { kind: 'header', id: neighbour.id } : { kind: 'add' }
        commit(removeItem(list, index), { undoLabel: `Blok ${index + 1} (${labelOf(list[index])}) dihapus` })
        select(null)
      },
      insertAfter: (index) => setPaletteAt(index + 1),
      changeField: (id, path, value, options = {}) => {
        const list = blocksRef.current
        const next = list.map((b) => (b.id === id ? writeField(b, path, value) : b))
        commit(next, {
          coalesceKey: options.coalesce ? `${id}:${pathKey(path)}` : undefined,
          undoLabel: options.undoLabel,
          announce: options.announce,
        })
      },
      replace: (id, nextBlock) => {
        const list = blocksRef.current
        commit(list.map((b) => (b.id === id ? nextBlock : b)), { announce: 'Perubahan JSON diterapkan.' })
        return null
      },
    }),
    // labelOf is pure; commit/select are stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit, select],
  )

  const insertBlock = (type: string) => {
    const at = paletteAt ?? blocksRef.current.length
    const created = createBlock(type)
    const block: EditorBlock = created ? { ...(created as Record<string, unknown>), id: String(created.id), type } : { id: `${type}-${Date.now()}`, type }
    const next = [...blocksRef.current]
    next.splice(at, 0, block)
    setPaletteAt(null)
    focusRequest.current = { kind: 'field', id: block.id }
    commit(next, { announce: `${labelOf(block)} ditambahkan sebagai blok ${at + 1}. Formulirnya terbuka.` })
    select(block.id)
    setMobilePane('edit')
    setActivePanel('blocks')
  }

  const doUndo = useCallback(() => {
    if (undo()) {
      setToast(null)
      announce('Perubahan terakhir diurungkan.')
    }
  }, [undo, announce])
  const doRedo = useCallback(() => {
    if (redo()) announce('Perubahan diulang.')
  }, [redo, announce])

  // Keep selection valid when blocks disappear (undo, external reload).
  useEffect(() => {
    if (selectedId && !blocks.some((b) => b.id === selectedId)) select(null)
  }, [blocks, selectedId, select])

  // Process focus requests after the DOM reflects the change.
  useEffect(() => {
    const req = focusRequest.current
    if (!req || !rootRef.current) return
    focusRequest.current = null
    if (req.kind === 'add') {
      addButtonRef.current?.focus()
      return
    }
    if (req.kind === 'header') {
      rootRef.current.querySelector<HTMLElement>(headerSelector(req.id))?.focus()
      return
    }
    const panel = rootRef.current.querySelector(`[data-block-panel="${CSS.escape(req.id)}"]`)
    const field = panel?.querySelector<HTMLElement>('input:not([type=checkbox]), textarea, select') ?? rootRef.current.querySelector<HTMLElement>(headerSelector(req.id))
    field?.focus()
  })

  // Selecting in the preview reveals the row in the outline.
  useEffect(() => {
    if (!selectedId || selectSource !== 'preview') return
    rootRef.current?.querySelector(headerSelector(selectedId))?.scrollIntoView({ block: 'nearest' })
  }, [selectedId, selectSource])

  // ── Global shortcuts (scoped to this editor or an unfocused page) ─────────
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const root = rootRef.current
    if (!root) return
    const t = e.target
    const inScope = t === document.body || (t instanceof Node && root.contains(t))
    const mod = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (mod && key === 's' && onSave) {
      e.preventDefault()
      onSave()
      return
    }
    if (!inScope || document.querySelector('dialog[open]')) return
    if (mod && key === 'z') {
      e.preventDefault()
      if (e.shiftKey) doRedo()
      else doUndo()
    } else if (mod && key === 'y') {
      e.preventDefault()
      doRedo()
    } else if (mod && key === 'k') {
      e.preventDefault()
      setPaletteAt(blocksRef.current.length)
    } else if (e.key === '?' && !isEditable(t)) {
      e.preventDefault()
      setShortcutsOpen(true)
    }
  })
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const goToFirstIssue = () => {
    const id = invalidBlockIds[0]
    if (!id) return
    focusRequest.current = { kind: 'header', id }
    select(id)
    setMobilePane('edit')
    setActivePanel('blocks')
  }

  const placement =
    paletteAt === null || paletteAt >= blocks.length ? 'di akhir daftar' : paletteAt === 0 ? 'di awal daftar' : `setelah blok ${paletteAt}`

  const issueCount = issues.length
  const showEditor = layout !== 'preview'
  const showPreview = layout !== 'editor'
  const split = showEditor && showPreview
  const allPanels: BlockEditorPanel[] = [{ id: 'blocks', label: 'Blok', content: null, badge: blocks.length }, ...(panels ?? [])]
  const hasTabs = allPanels.length > 1

  const outline = (
    <div className="space-y-3">
      {notice}
      {listIssues.length ? (
        <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
          {listIssues.join(' ')}
        </div>
      ) : null}
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
          <p className="text-sm font-medium text-white">Belum ada blok.</p>
          <p className="mt-1 text-sm text-neutral-300">Mulai dengan hero atau viewer 3D, lalu tambahkan teks dan ajakan.</p>
        </div>
      ) : (
        <BlockOutline blocks={blocks} selectedId={selectedId} issues={grouped} issueKeys={issueKeys} actions={actions} modKey={modKey} label={label} />
      )}
      <Button ref={addButtonRef} icon={Plus} className="w-full" onClick={() => setPaletteAt(blocks.length)} aria-keyshortcuts="Control+K Meta+K">
        Tambah blok
        <span className="hidden text-xs text-neutral-400 sm:inline">
          <Kbd>{modKey}</Kbd>+<Kbd>K</Kbd>
        </span>
      </Button>
    </div>
  )

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <IconButton icon={Undo2} label="Urungkan" shortcut={`${modKey}+Z`} ariaShortcut="Control+Z Meta+Z" disabled={!canUndo} onClick={doUndo} />
        <IconButton icon={Redo2} label="Ulangi" shortcut={`${modKey}+Shift+Z`} ariaShortcut="Control+Shift+Z Meta+Shift+Z" disabled={!canRedo} onClick={doRedo} />
        <IconButton icon={Keyboard} label="Pintasan keyboard" shortcut="?" onClick={() => setShortcutsOpen(true)} />
        <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
        {issueCount ? (
          <Button size="sm" variant="ghost" icon={AlertCircle} className="text-red-200 hover:text-red-100" onClick={goToFirstIssue}>
            {issueCount} masalah di {Math.max(invalidBlockIds.length, 1)} blok — tampilkan
          </Button>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-xs ${blocks.length ? 'text-emerald-200' : 'text-neutral-400'}`}>
            {blocks.length ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
            {blocks.length ? 'Semua blok valid' : 'Belum ada blok'}
          </span>
        )}
        {split ? (
          <div className="ml-auto flex rounded-lg border border-white/15 p-0.5 lg:hidden" role="group" aria-label="Tampilan">
            <button
              type="button"
              aria-pressed={mobilePane === 'edit'}
              onClick={() => setMobilePane('edit')}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs ${mobilePane === 'edit' ? 'bg-white/15 text-white' : 'text-neutral-300'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400`}
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
            <button
              type="button"
              aria-pressed={mobilePane === 'preview'}
              onClick={() => setMobilePane('preview')}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs ${mobilePane === 'preview' ? 'bg-white/15 text-white' : 'text-neutral-300'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Pratinjau
            </button>
          </div>
        ) : null}
      </div>

      <div className={`grid min-h-0 flex-1 ${split ? 'lg:grid-cols-[minmax(20rem,30rem)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        {showEditor ? (
          <section
            aria-label="Editor"
            className={`relative flex min-h-0 min-w-0 flex-col ${split ? 'lg:border-r lg:border-white/10' : ''} ${split && mobilePane !== 'edit' ? 'hidden lg:flex' : ''}`}
          >
            {hasTabs ? (
              <PanelTabs baseId={baseId} panels={allPanels} active={activePanel} onChange={setActivePanel} />
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {allPanels.map((p) => {
                const isActive = activePanel === p.id
                const body = p.id === 'blocks' ? outline : p.content
                return hasTabs ? (
                  <div key={p.id} role="tabpanel" id={`${baseId}-panel-${p.id}`} aria-labelledby={`${baseId}-tab-${p.id}`} hidden={!isActive}>
                    {isActive ? body : null}
                  </div>
                ) : (
                  <div key={p.id} className={layout === 'editor' ? 'mx-auto max-w-3xl' : ''}>
                    {body}
                  </div>
                )
              })}
            </div>
            {toast ? (
              <div className="sticky bottom-0 z-10 border-t border-white/10 bg-surface-overlay px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-white">
                  <span className="min-w-0 flex-1">{toast.message}.</span>
                  <Button size="sm" icon={Undo2} onClick={doUndo}>
                    Urungkan
                  </Button>
                  <IconButton icon={X} size="sm" label="Tutup pemberitahuan" onClick={() => setToast(null)} />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showPreview ? (
          <section
            aria-label="Pratinjau langsung"
            className={`min-h-0 min-w-0 overflow-y-auto bg-[#030611] ${split && mobilePane !== 'preview' ? 'hidden lg:block' : ''}`}
          >
            <BlockPreview
              blocks={deferredBlocks}
              selectedId={selectedId}
              onSelect={(id) => {
                select(id, 'preview')
                setActivePanel('blocks')
              }}
              contextData={contextData}
              scrollToSelected={selectSource === 'outline'}
            />
          </section>
        ) : null}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <BlockPalette open={paletteAt !== null} target={target} placement={placement} onClose={() => setPaletteAt(null)} onPick={insertBlock} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} modKey={modKey} canSave={Boolean(onSave)} />
    </div>
  )
}

function PanelTabs({ baseId, panels, active, onChange }: { baseId: string; panels: BlockEditorPanel[]; active: string; onChange: (id: string) => void }) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % panels.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + panels.length) % panels.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = panels.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(panels[next].id)
    document.getElementById(`${baseId}-tab-${panels[next].id}`)?.focus()
  }
  return (
    <div role="tablist" aria-label="Bagian editor" className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 pt-2">
      {panels.map((p, i) => {
        const selected = p.id === active
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${p.id}`}
            aria-selected={selected}
            aria-controls={`${baseId}-panel-${p.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(p.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm ${
              selected ? 'border-accent-400 text-white' : 'border-transparent text-neutral-300 hover:text-white'
            } focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-400`}
          >
            {p.label}
            {p.badge !== undefined && p.badge !== null ? <span className="rounded-full bg-white/10 px-1.5 text-xs text-neutral-200">{p.badge}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

function ShortcutsDialog({ open, onClose, modKey, canSave }: { open: boolean; onClose: () => void; modKey: string; canSave: boolean }) {
  const rows: [React.ReactNode, string][] = [
    [<><Kbd>{modKey}</Kbd>+<Kbd>K</Kbd></>, 'Tambah blok (cari, ↑/↓, Enter)'],
    [<><Kbd>{modKey}</Kbd>+<Kbd>Z</Kbd></>, 'Urungkan'],
    [<><Kbd>{modKey}</Kbd>+<Kbd>Shift</Kbd>+<Kbd>Z</Kbd></>, 'Ulangi'],
    ...(canSave ? ([[<><Kbd>{modKey}</Kbd>+<Kbd>S</Kbd></>, 'Simpan']] as [React.ReactNode, string][]) : []),
    [<><Kbd>↑</Kbd> <Kbd>↓</Kbd></>, 'Pindah antar blok (fokus di judul blok)'],
    [<><Kbd>Enter</Kbd></>, 'Buka / tutup formulir blok'],
    [<><Kbd>Alt</Kbd>+<Kbd>↑</Kbd> / <Kbd>↓</Kbd></>, 'Naikkan / turunkan blok'],
    [<><Kbd>{modKey}</Kbd>+<Kbd>D</Kbd></>, 'Duplikat blok'],
    [<><Kbd>Delete</Kbd></>, 'Hapus blok (bisa diurungkan)'],
    [<><Kbd>?</Kbd></>, 'Tampilkan daftar ini'],
  ]
  return (
    <Dialog open={open} onClose={onClose} title="Pintasan keyboard" width={30}>
      <dl className="divide-y divide-white/10 text-sm">
        {rows.map(([keys, desc], i) => (
          <div key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <dt className="text-neutral-200">{desc}</dt>
            <dd className="flex items-center gap-1 text-neutral-300">{keys}</dd>
          </div>
        ))}
      </dl>
    </Dialog>
  )
}
