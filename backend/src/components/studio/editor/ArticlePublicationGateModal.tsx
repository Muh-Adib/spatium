'use client'

import React from 'react'
import { ShieldAlert, X } from 'lucide-react'

interface ArticlePublicationGateModalProps {
  violations: string[]
  onClose: () => void
  onFixSeo: () => void
}

export function ArticlePublicationGateModal({
  violations,
  onClose,
  onFixSeo,
}: ArticlePublicationGateModalProps) {
  if (violations.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full rounded-2xl bg-[#191919] border border-red-500/40 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gerbang Publikasi Terkunci</h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                Syarat Wajib Publikasi SEO &amp; Aksesibilitas
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300">
          Artikel tidak dapat diterbitkan sebelum seluruh masalah wajib berikut diselesaikan:
        </p>

        <ul className="space-y-2 text-xs text-red-300 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20 list-disc pl-5">
          {violations.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onFixSeo}
            className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-black text-xs font-bold transition-all shadow-md"
          >
            Buka Panel SEO &amp; Perbaiki
          </button>
        </div>
      </div>
    </div>
  )
}
