'use client'

import React, { memo, useCallback } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, Copy, Database, History, Plus, Trash2 } from 'lucide-react'
import { DATA_BOUND_TYPES } from '@/blocks/registry'
import { getBlockEntry, type BlockCatalogEntry } from '@/lib/blocks/catalog'
import { BlockFieldsForm, type FieldChange, type FieldChangeOptions } from './BlockFieldsForm'
import { JsonField } from './JsonField'
import { Badge, Button, IconButton } from './ui'
import { CategoryIcon } from './icons'
import { type BlockIssueGroup, type EditorBlock, type FieldPath, blockSummary, extraKeys, issuesForForm } from './model'

export type RowActions = {
  select: (id: string | null) => void
  move: (id: string, delta: -1 | 1) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  insertAfter: (index: number) => void
  changeField: (id: string, path: FieldPath, value: unknown, options?: FieldChangeOptions) => void
  /** Replace a block wholesale (JSON editor). Returns an error message to reject. */
  replace: (id: string, next: EditorBlock) => string | null
}

type RowProps = {
  block: EditorBlock
  index: number
  count: number
  selected: boolean
  issues: BlockIssueGroup | undefined
  /** Cheap equality key for `issues` so memoized rows skip re-render when nothing changed. */
  issuesKey: string
  actions: RowActions
  modKey: string
  /** Shown on data-bound blocks: opens the tab where the entity's content is edited. */
  onOpenContent?: () => void
}

export const headerSelector = (id: string) => `[data-block-header="${CSS.escape(id)}"]`

function focusSibling(current: HTMLElement, delta: number | 'first' | 'last') {
  const list = current.closest('[data-block-outline]')
  if (!list) return
  const headers = Array.from(list.querySelectorAll<HTMLElement>('[data-block-header]'))
  const i = headers.indexOf(current)
  const target =
    delta === 'first' ? headers[0] : delta === 'last' ? headers[headers.length - 1] : headers[Math.min(Math.max(i + delta, 0), headers.length - 1)]
  target?.focus()
}

function BlockRowImpl({ block, index, count, selected, issues, actions, modKey, onOpenContent }: RowProps) {
  const entry: BlockCatalogEntry | undefined = getBlockEntry(block.type)
  const dataBound = DATA_BOUND_TYPES.has(block.type)
  const label = entry?.label ?? block.type
  const summary = blockSummary(block)
  const panelId = `blk-panel-${block.id}`
  const headerId = `blk-header-${block.id}`
  const formIssues = issuesForForm(issues, entry, block)
  const issueCount = issues?.count ?? 0
  const name = `blok ${index + 1} (${label})`

  const onFieldChange: FieldChange = useCallback(
    (path, value, options) => actions.changeField(block.id, path, value, options),
    [actions, block.id],
  )

  const onHeaderKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const mod = e.metaKey || e.ctrlKey
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault()
      actions.move(block.id, -1)
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault()
      actions.move(block.id, 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusSibling(e.currentTarget, 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusSibling(e.currentTarget, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusSibling(e.currentTarget, 'first')
    } else if (e.key === 'End') {
      e.preventDefault()
      focusSibling(e.currentTarget, 'last')
    } else if (mod && e.key.toLowerCase() === 'd') {
      e.preventDefault()
      actions.duplicate(block.id)
    } else if (e.key === 'Delete' || (e.key === 'Backspace' && mod)) {
      e.preventDefault()
      actions.remove(block.id)
    }
  }

  const extras = extraKeys(block, entry)
  const extraValue = Object.fromEntries(extras.map((k) => [k, block[k]]))

  return (
    <li
      data-block-row={block.id}
      className={`rounded-xl border bg-surface-elevated transition-colors ${
        selected ? 'border-accent-400/60' : issueCount ? 'border-red-400/40' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <h3 className="m-0 font-sans text-base font-normal normal-case tracking-normal [word-spacing:normal]">
        <button
          type="button"
          id={headerId}
          data-block-header={block.id}
          aria-expanded={selected}
          aria-controls={panelId}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Delete"
          onClick={() => actions.select(selected ? null : block.id)}
          onKeyDown={onHeaderKeyDown}
          className="flex w-full min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] font-mono text-xs text-neutral-200" aria-hidden="true">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <CategoryIcon category={entry?.category ?? null} className="h-3.5 w-3.5 text-neutral-400" />
                <span className="sr-only">Blok {index + 1}: </span>
                {label}
              </span>
              {dataBound ? (
                <Badge tone="info" icon={Database}>
                  Isi dari tab Konten
                </Badge>
              ) : null}
              {!entry ? (
                <Badge tone="warning" icon={History}>
                  Tipe lama
                </Badge>
              ) : null}
              {issueCount ? (
                <Badge tone="danger" icon={AlertCircle}>
                  {issueCount} masalah
                </Badge>
              ) : null}
            </span>
            {summary ? <span className="mt-0.5 block break-words text-xs font-normal leading-relaxed text-neutral-400 [overflow-wrap:anywhere]">{summary}</span> : null}
          </span>
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-neutral-400 motion-safe:transition-transform ${selected ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h3>

      {selected ? (
        <div id={panelId} role="region" aria-labelledby={headerId} data-block-panel={block.id} className="space-y-4 border-t border-white/10 px-3 pb-4 pt-3">
          <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label={`Tindakan ${name}`}>
            <IconButton icon={ArrowUp} size="sm" label="Naikkan blok" shortcut="Alt+↑ pada judul blok" disabled={index === 0} onClick={() => actions.move(block.id, -1)} />
            <IconButton icon={ArrowDown} size="sm" label="Turunkan blok" shortcut="Alt+↓ pada judul blok" disabled={index === count - 1} onClick={() => actions.move(block.id, 1)} />
            <IconButton icon={Copy} size="sm" label="Duplikat blok" shortcut={`${modKey}+D pada judul blok`} onClick={() => actions.duplicate(block.id)} />
            <IconButton icon={Plus} size="sm" label="Sisipkan blok setelah ini" onClick={() => actions.insertAfter(index)} />
            <span className="flex-1" />
            <IconButton icon={Trash2} size="sm" tone="danger" label="Hapus blok" shortcut="Delete pada judul blok · bisa diurungkan" onClick={() => actions.remove(block.id)} />
          </div>

          {entry ? <p className="text-xs leading-relaxed text-neutral-300">{entry.description}</p> : null}
          {dataBound ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-info/30 bg-info/10 p-3 text-sm text-info-300">
              <p className="min-w-0 flex-1">Teks, gambar, dan daftar di blok ini diambil dari tab Konten. Di sini Anda hanya mengatur tampilannya.</p>
              {onOpenContent ? (
                <Button size="sm" onClick={onOpenContent}>
                  Buka tab Konten
                </Button>
              ) : null}
            </div>
          ) : null}

          {formIssues?.general.length ? (
            <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Perbaiki sebelum menyimpan:
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
                {formIssues.general.map((m, i) => (
                  <li key={i} className="[overflow-wrap:anywhere]">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {entry ? (
            <BlockFieldsForm block={block} fields={entry.fields} issues={formIssues} idPrefix={`blk-${block.id}`} onChange={onFieldChange} />
          ) : (
            <JsonField
              id={`blk-${block.id}-json`}
              label="Isi blok (JSON)"
              value={Object.fromEntries(Object.entries(block).filter(([k]) => k !== 'id'))}
              help={
                <>
                  Tipe <code className="font-mono">{block.type}</code> tidak lagi ditawarkan di katalog. Blok tetap tampil di situs dan bisa diubah
                  lewat JSON; perubahan diterapkan saat Anda keluar dari kolom ini. Untuk konten baru, gunakan blok dari katalog.
                </>
              }
              onCommit={(next) => actions.replace(block.id, { ...next, id: block.id, type: typeof next.type === 'string' ? next.type : block.type })}
            />
          )}

          {entry && extras.length > 0 ? (
            <details className="rounded-lg border border-white/10 px-3 py-2">
              <summary className="cursor-pointer rounded text-sm text-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400">
                Properti lain ({extras.length}) · JSON
              </summary>
              <div className="mt-3">
                <JsonField
                  id={`blk-${block.id}-extra`}
                  label="Properti di luar formulir"
                  value={extraValue}
                  help="Properti lama atau lanjutan yang tidak punya kolom di formulir. Hapus kuncinya untuk membuangnya."
                  onCommit={(next) => {
                    const base = Object.fromEntries(Object.entries(block).filter(([k]) => !extras.includes(k)))
                    return actions.replace(block.id, { ...next, ...base, id: block.id, type: block.type } as EditorBlock)
                  }}
                />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

const BlockRow = memo(
  BlockRowImpl,
  (a, b) =>
    a.block === b.block &&
    a.index === b.index &&
    a.count === b.count &&
    a.selected === b.selected &&
    a.issuesKey === b.issuesKey &&
    a.actions === b.actions &&
    a.modKey === b.modKey &&
    a.onOpenContent === b.onOpenContent,
)

type OutlineProps = {
  blocks: readonly EditorBlock[]
  selectedId: string | null
  issues: Map<string, BlockIssueGroup>
  issueKeys: Map<string, string>
  actions: RowActions
  modKey: string
  label: string
  onOpenContent?: () => void
}

export function BlockOutline({ blocks, selectedId, issues, issueKeys, actions, modKey, label, onOpenContent }: OutlineProps) {
  return (
    <ol data-block-outline="" aria-label={label} className="space-y-2">
      {blocks.map((block, index) => (
        <BlockRow
          key={block.id}
          block={block}
          index={index}
          count={blocks.length}
          selected={block.id === selectedId}
          issues={issues.get(block.id)}
          issuesKey={issueKeys.get(block.id) ?? ''}
          actions={actions}
          modKey={modKey}
          onOpenContent={onOpenContent}
        />
      ))}
    </ol>
  )
}
