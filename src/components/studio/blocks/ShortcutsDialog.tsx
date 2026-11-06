'use client'

import type React from 'react'
import { Dialog, Kbd } from './ui'

/** Keyboard shortcut reference for the block editor (opened with `?`). */
export function ShortcutsDialog({ open, onClose, modKey, canSave }: { open: boolean; onClose: () => void; modKey: string; canSave: boolean }) {
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
