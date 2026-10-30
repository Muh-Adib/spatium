'use client'

import React, { useState } from 'react'
import { Globe, X, Download, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, KeyRound, Sparkles } from 'lucide-react'

interface ArticleWordpressModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
}

export function ArticleWordpressModal({
  isOpen,
  onClose,
  onSuccess,
}: ArticleWordpressModalProps) {
  const [wpUrlInput, setWpUrlInput] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [wpUsername, setWpUsername] = useState('')
  const [wpAppPassword, setWpAppPassword] = useState('')
  const [wpSyncing, setWpSyncing] = useState(false)
  const [wpSyncMessage, setWpSyncMessage] = useState('')
  const [wpSyncError, setWpSyncError] = useState('')

  if (!isOpen) return null

  const handleSyncFromWordPress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wpUrlInput.trim() || wpSyncing) return

    setWpSyncing(true)
    setWpSyncError('')
    setWpSyncMessage('')

    try {
      const res = await fetch('/api/import/wp-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: wpUrlInput.trim(),
          username: wpUsername.trim() || undefined,
          applicationPassword: wpAppPassword.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menarik data dari WordPress.')
      }

      setWpSyncMessage(`Artikel "${json.data.title}" beserta metadata Yoast SEO berhasil dimuat!`)
      onSuccess(json.data)
      setTimeout(() => {
        onClose()
        setWpSyncMessage('')
        setWpUrlInput('')
        setWpUsername('')
        setWpAppPassword('')
      }, 900)
    } catch (err: any) {
      setWpSyncError(err.message || 'Terjadi kegagalan saat sinkronisasi.')
    } finally {
      setWpSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-lg w-full rounded-2xl bg-[#191919] border border-blue-400/40 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Tarik Artikel dari WordPress</span>
                <span className="text-[10px] bg-accent-500/20 text-accent-300 px-1.5 py-0.5 rounded border border-accent-500/30 font-mono">
                  Yoast Parity
                </span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">
                Sinkronisasi instan konten &amp; target kata kunci via REST API
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

        <form onSubmit={handleSyncFromWordPress} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
              URL Postingan Artikel WordPress
            </label>
            <input
              type="url"
              required
              value={wpUrlInput}
              onChange={(e) => setWpUrlInput(e.target.value)}
              placeholder="https://contoh-wordpress.com/arsitektur-next-js-16/"
              className="w-full rounded-xl bg-black/40 border border-white/15 p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-400 font-mono"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent-400 shrink-0" />
              <span>
                Menarik judul, blok konten, tag, cover, dan metadata Yoast SEO (Focus Keyphrase, Related Keywords, Meta Title, Description, Robots).
              </span>
            </p>
          </div>

          {/* Opsi Kredensial untuk WordPress yang memproteksi Rest Meta */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setShowAuth(!showAuth)}
              className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-neutral-500" />
                <span>Kredensial WordPress (Opsional - jika postmeta/draft diproteksi)</span>
              </span>
              {showAuth ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAuth && (
              <div className="p-3 pt-0 space-y-2.5 border-t border-white/5 animate-fadeIn">
                <p className="text-[10px] text-neutral-400">
                  Gunakan Username dan Application Password WordPress jika endpoint REST API Anda menyembunyikan custom field atau memerlukan izin baca draft.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Username WP</label>
                    <input
                      type="text"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full rounded-lg bg-black/50 border border-white/10 p-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Application Password</label>
                    <input
                      type="password"
                      value={wpAppPassword}
                      onChange={(e) => setWpAppPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full rounded-lg bg-black/50 border border-white/10 p-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {wpSyncError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{wpSyncError}</span>
            </div>
          )}

          {wpSyncMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{wpSyncMessage}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={wpSyncing || !wpUrlInput.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {wpSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghubungi WordPress &amp; Ekstraksi Yoast...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Tarik &amp; Muat ke Editor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
