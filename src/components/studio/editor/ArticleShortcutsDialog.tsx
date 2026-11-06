'use client'

import { Keyboard } from 'lucide-react'
import { EditorDialog } from './EditorDialog'

const SHORTCUTS: Array<{ keys: string[]; action: string }> = [
  { keys: ['Ctrl/⌘', 'S'], action: 'Simpan ke server tanpa mengubah status' },
  { keys: ['Ctrl/⌘', '/'], action: 'Buka atau tutup panel Dokumen & SEO' },
  { keys: ['?'], action: 'Tampilkan daftar pintasan ini (di luar kolom teks)' },
  { keys: ['Ctrl/⌘', 'B'], action: 'Tebal pada teks terpilih di paragraf' },
  { keys: ['Ctrl/⌘', 'I'], action: 'Miring pada teks terpilih di paragraf' },
  { keys: ['Ctrl/⌘', 'K'], action: 'Sisipkan tautan pada teks terpilih di paragraf' },
  { keys: ['Esc'], action: 'Tutup dialog atau panel yang terbuka' },
  { keys: ['←', '→'], action: 'Pindah tab di panel Dokumen & SEO' },
]

export function ArticleShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <EditorDialog
      open={open}
      onClose={onClose}
      size="md"
      icon={<Keyboard className="h-5 w-5 text-accent-300" />}
      title="Pintasan keyboard"
      description="Perubahan juga disimpan otomatis di browser ini setiap beberapa detik."
    >
      <dl className="divide-y divide-white/10 text-xs">
        {SHORTCUTS.map((s) => (
          <div key={s.action} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <dt className="text-neutral-200">{s.action}</dt>
            <dd className="flex shrink-0 items-center gap-1">
              {s.keys.map((k) => (
                <kbd key={k} className="rounded-md border border-white/20 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-white">
                  {k}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </EditorDialog>
  )
}
