'use client'

import { AlertTriangle, Save } from 'lucide-react'
import { EditorDialog, dialogButton } from './EditorDialog'

interface ArticleUnsavedModalProps {
  isOpen: boolean
  saving?: boolean
  /** Whether a copy of the edits is kept in this browser (autosave), so the copy can say so honestly. */
  hasLocalCopy?: boolean
  onCancel: () => void
  onConfirmDiscard: () => void
  onSaveAndLeave?: () => void
}

export function ArticleUnsavedModal({
  isOpen,
  saving = false,
  hasLocalCopy = false,
  onCancel,
  onConfirmDiscard,
  onSaveAndLeave,
}: ArticleUnsavedModalProps) {
  return (
    <EditorDialog
      open={isOpen}
      onClose={onCancel}
      dismissible={!saving}
      size="md"
      icon={<AlertTriangle className="h-5 w-5 text-amber-300" />}
      title="Perubahan belum disimpan ke server"
      description={
        hasLocalCopy
          ? 'Salinan perubahan tersimpan di browser ini dan bisa dipulihkan saat artikel dibuka lagi, tetapi belum terlihat oleh tim lain.'
          : 'Jika Anda keluar sekarang, perubahan terakhir akan hilang.'
      }
      footer={
        <>
          <button type="button" disabled={saving} onClick={onCancel} className={dialogButton.secondary}>
            Tetap di editor
          </button>
          <button type="button" disabled={saving} onClick={onConfirmDiscard} className={dialogButton.danger}>
            Keluar tanpa menyimpan
          </button>
          {onSaveAndLeave && (
            <button type="button" disabled={saving} onClick={onSaveAndLeave} className={dialogButton.primary}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{saving ? 'Menyimpan…' : 'Simpan & keluar'}</span>
            </button>
          )}
        </>
      }
    />
  )
}
