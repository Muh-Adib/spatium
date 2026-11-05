'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, X, Save, ArrowRight } from 'lucide-react'

interface ArticleUnsavedModalProps {
  isOpen: boolean
  saving?: boolean
  onCancel: () => void
  onConfirmDiscard: () => void
  onSaveAndLeave?: () => void
}

export function ArticleUnsavedModal({
  isOpen,
  saving = false,
  onCancel,
  onConfirmDiscard,
  onSaveAndLeave,
}: ArticleUnsavedModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onCancel])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative max-w-md w-full rounded-2xl bg-surface-elevated border border-amber-500/30 p-6 space-y-5 shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="unsaved-modal-title" className="text-sm font-bold text-white">
                Perubahan Belum Disimpan
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Peringatan Navigasi Editor Studio
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            title="Tutup dialog (Batal)"
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-1">
          <p className="font-semibold text-amber-100">
            Artikel memiliki perubahan yang belum disimpan.
          </p>
          <p className="text-neutral-300">
            Jika Anda meninggalkan halaman sekarang, seluruh modifikasi draf terbaru Anda akan hilang secara permanen.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs">
          {/* Batal */}
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 font-semibold transition-colors disabled:opacity-50 text-center"
          >
            Batal Tetap di Sini
          </button>

          {/* Lanjut Tanpa Simpan */}
          <button
            type="button"
            disabled={saving}
            onClick={onConfirmDiscard}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-semibold transition-colors disabled:opacity-50 text-center"
          >
            Lanjut (Buang Perubahan)
          </button>

          {/* Simpan Draf & Keluar (Bonus Convenience Option) */}
          {onSaveAndLeave && (
            <button
              type="button"
              disabled={saving}
              onClick={onSaveAndLeave}
              className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-black font-bold transition-all shadow-md shadow-accent-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 text-center"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Keluar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
