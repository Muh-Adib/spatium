'use client'

import { AlertTriangle } from 'lucide-react'
import { EditorDialog, dialogButton } from './EditorDialog'

interface ArticleConflictModalProps {
  open: boolean
  serverUpdatedAt: string | null
  onClose: () => void
  onReload: () => void
  onForceOverwrite: () => void
}

export function ArticleConflictModal({ open, serverUpdatedAt, onClose, onReload, onForceOverwrite }: ArticleConflictModalProps) {
  const when = serverUpdatedAt ? new Date(serverUpdatedAt) : null
  return (
    <EditorDialog
      open={open}
      onClose={onClose}
      size="md"
      icon={<AlertTriangle className="h-5 w-5 text-amber-300" />}
      title="Artikel diubah oleh editor lain"
      description={`Versi di server lebih baru${when && !Number.isNaN(when.getTime()) ? ` (${when.toLocaleString('id-ID')})` : ''} daripada versi yang Anda buka. Pilih cara melanjutkan.`}
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogButton.secondary}>
            Kembali ke editor
          </button>
          <button type="button" onClick={onForceOverwrite} className={dialogButton.danger}>
            Timpa versi server
          </button>
          <button type="button" onClick={onReload} className={dialogButton.primary}>
            Muat versi terbaru
          </button>
        </>
      }
    >
      <p className="text-xs leading-relaxed text-neutral-300">
        &ldquo;Muat versi terbaru&rdquo; membuang perubahan Anda di layar (salinan lokal tetap tersimpan di browser).
        &ldquo;Timpa versi server&rdquo; menyimpan versi Anda dan menghapus perubahan editor lain.
      </p>
    </EditorDialog>
  )
}
