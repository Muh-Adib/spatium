'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Bot, History, RotateCcw, User } from 'lucide-react'
import type { CatalogHistoryEntry } from '@/lib/catalog/history'
import { Badge, Button, Dialog } from '../blocks/ui'
import { DateTime, STATUS_META, formatDate, isEditorialStatus } from '../pages/shared'
import { entityApi } from './client'
import { ENTITY_LABEL, changedFieldLabels, historyActionLabel, type EntityKind } from './model'

type Props = {
  kind: EntityKind
  id: number
  /** Reloads the list when it changes (the row's `updatedAt` after a save). */
  refreshKey: string
  /** Roles that can edit may restore; the tab is only shown to them. */
  canRestore: boolean
  /** Applies a version's content to the form as unsaved changes. */
  onRestore: (version: Record<string, unknown>, entry: CatalogHistoryEntry) => void
}

const statusLabel = (s: string | null) => (isEditorialStatus(s) ? STATUS_META[s].label : (s ?? 'tanpa status'))

/**
 * Riwayat tab of the entity editor: who changed what and when (ContentRevision,
 * newest first), with "Pulihkan versi ini" loading the content a change
 * produced into the editor as unsaved changes (after a confirm dialog).
 */
export function HistoryPanel({ kind, id, refreshKey, canRestore, onRestore }: Props) {
  const label = ENTITY_LABEL[kind]
  const [entries, setEntries] = useState<CatalogHistoryEntry[] | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<CatalogHistoryEntry | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await entityApi.revisions(kind, id)
    if (res.ok) {
      setEntries(res.data.revisions)
      setTruncated(res.data.truncated)
    } else setError(res.failure.error)
  }, [kind, id])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">Riwayat gagal dimuat: {error}</span>
        <Button size="sm" icon={RotateCcw} onClick={() => void load()}>
          Coba lagi
        </Button>
      </div>
    )
  }
  if (!entries) {
    return (
      <p role="status" aria-busy="true" className="text-sm text-neutral-300">
        Memuat riwayat…
      </p>
    )
  }
  if (entries.length === 0) {
    return <p className="text-sm text-neutral-300">Belum ada riwayat. Perubahan berikutnya akan tercatat di sini.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-300">
        Setiap simpan dari Studio atau klien MCP tercatat di sini. “Pulihkan versi ini” memuat isi versi itu ke editor sebagai perubahan yang belum disimpan.
      </p>
      <ol className="space-y-2">
        {entries.map((entry) => {
          const fields = changedFieldLabels(entry.changedFields)
          const restorable = canRestore && entry.version !== null && !entry.isCurrent
          return (
            <li key={`${entry.kind}-${entry.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={entry.kind === 'baseline' ? 'info' : 'neutral'}>{historyActionLabel(entry.action)}</Badge>
                  {entry.isCurrent ? <Badge tone="success">Versi saat ini</Badge> : null}
                </span>
                <span className="text-xs text-neutral-300">
                  <DateTime iso={entry.createdAt} />
                </span>
              </div>
              {entry.kind === 'change' ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-neutral-200 [overflow-wrap:anywhere]">
                  {entry.actorKind === 'mcp' ? <Bot className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <User className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  <span>
                    oleh {entry.actorKind === 'mcp' ? 'klien MCP ' : ''}
                    <span className="font-mono">{entry.actor}</span>
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-neutral-200">Isi sebelum perubahan pertama yang tercatat.</p>
              )}
              {entry.statusChange ? (
                <p className="mt-1 text-xs text-neutral-200">
                  Status: {statusLabel(entry.statusChange.from)} → {statusLabel(entry.statusChange.to)}
                </p>
              ) : null}
              {fields.length ? <p className="mt-1 text-xs text-neutral-200 [overflow-wrap:anywhere]">Diubah: {fields.join(', ')}</p> : null}
              {entry.kind === 'change' && entry.action !== 'delete' && entry.version === null ? (
                <p className="mt-1 text-xs text-neutral-300">Isi versi ini tidak tersimpan, jadi tidak bisa dipulihkan.</p>
              ) : null}
              {restorable ? (
                <div className="mt-2">
                  <Button size="sm" icon={History} onClick={() => setPending(entry)}>
                    Pulihkan versi ini<span className="sr-only"> ({formatDate(entry.createdAt)})</span>
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      {truncated ? <p className="text-xs text-neutral-300">Menampilkan perubahan terbaru saja. Versi yang lebih lama tetap tersimpan di log audit.</p> : null}

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={`Pulihkan versi ${pending ? formatDate(pending.createdAt) : ''}?`}
        description={`Isi tab Konten, SEO & berbagi, dan semua blok ${label.one} ini diganti dengan versi tersebut. Slug dan status tidak berubah. Belum tersimpan sampai Anda menekan Simpan; tekan “Buang perubahan” saat keluar untuk membatalkan.`}
        footer={
          <>
            <Button autoFocus onClick={() => setPending(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              icon={History}
              onClick={() => {
                const entry = pending
                setPending(null)
                if (entry?.version) onRestore(entry.version, entry)
              }}
            >
              Pulihkan versi ini
            </Button>
          </>
        }
      />
    </div>
  )
}
