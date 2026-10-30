'use client'

import React from 'react'
import { Link2, X } from 'lucide-react'

interface ArticleLinkModalProps {
  isOpen: boolean
  onClose: () => void
  linkTextInput: string
  onChangeLinkTextInput: (val: string) => void
  linkUrlInput: string
  onChangeLinkUrlInput: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ArticleLinkModal({
  isOpen,
  onClose,
  linkTextInput,
  onChangeLinkTextInput,
  linkUrlInput,
  onChangeLinkUrlInput,
  onSubmit,
}: ArticleLinkModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full rounded-2xl bg-[#191919] border border-accent-400/40 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 border border-accent-400/30 text-accent-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sisipkan Tautan / Link</h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                Tautan internal artikel atau URL eksternal
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              Teks Jangkar (Anchor Text)
            </label>
            <input
              type="text"
              value={linkTextInput}
              onChange={(e) => onChangeLinkTextInput(e.target.value)}
              placeholder="Contoh: Layanan Web Development SegiaTech"
              className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              URL Tujuan (Internal / Eksternal) *
            </label>
            <input
              type="text"
              required
              value={linkUrlInput}
              onChange={(e) => onChangeLinkUrlInput(e.target.value)}
              placeholder="Contoh: /artikel/nama-artikel atau /layanan"
              className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-accent-400 font-mono"
            />
          </div>

          {/* Quick shortcuts for popular internal URLs */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-neutral-400 font-semibold block">
              Pintasan Cepat Tautan Internal:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Katalog Layanan', url: '/layanan' },
                { label: 'Portofolio', url: '/portofolio' },
                { label: 'Indeks Artikel', url: '/artikel' },
                { label: 'Kontak', url: '/kontak' },
              ].map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => {
                    onChangeLinkUrlInput(p.url)
                    if (!linkTextInput) onChangeLinkTextInput(p.label)
                  }}
                  className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-mono text-neutral-300 hover:text-accent-300 border border-white/10 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!linkUrlInput.trim()}
              className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-accent-950 font-bold text-xs shadow-md disabled:opacity-50 transition-colors"
            >
              Sisipkan Tautan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
