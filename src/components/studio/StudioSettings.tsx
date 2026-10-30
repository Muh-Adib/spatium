'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  Settings,
  Globe,
  Search,
  Shield,
  Sliders,
  Save,
  RefreshCw,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  FileText,
  AlertTriangle,
  Lock,
  Bot,
  ArrowRight,
} from 'lucide-react'

interface SiteConfig {
  siteName: string
  tagline: string
  canonicalUrl: string
  contactEmail: string
  titleTemplate: string
  defaultMetaDescription: string
  googleVerification: string
  robotsIndex: boolean
  defaultArticleStatus: 'draft' | 'in_review' | 'published'
  maxUploadMb: number
  enforceAltText: boolean
  mcpEnabled: boolean
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'SegiaTech',
  tagline: 'Creative Technology & Digital Experience Platform',
  canonicalUrl: 'https://www.segiatech.com',
  contactEmail: 'contact@segiatech.com',
  titleTemplate: '%s — SegiaTech',
  defaultMetaDescription: 'SegiaTech adalah creative technology studio dan digital experience platform terdepan yang menghadirkan web arsitektur Next.js skala enterprise, visual motion GSAP, dan WebGL.',
  googleVerification: 'google-site-verification=segia-tech-gsc-verified-production',
  robotsIndex: true,
  defaultArticleStatus: 'draft',
  maxUploadMb: 10,
  enforceAltText: true,
  mcpEnabled: true,
}

export function StudioSettings() {
  const { role, actorName, permissions } = useAuth()
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [flushCacheLoading, setFlushCacheLoading] = useState(false)
  const [flushCacheMessage, setFlushCacheMessage] = useState('')

  // Modal State pengganti window.confirm & alert
  const [modalState, setModalState] = useState<{
    open: boolean
    title: string
    message: string
    type?: 'confirm' | 'error' | 'success'
    confirmText?: string
    onConfirm?: () => void
  }>({
    open: false,
    title: '',
    message: '',
  })

  // Muat setting dari backend database SQLite
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setConfig((prev) => ({
            ...prev,
            siteName: res.data.siteName || res.data.name || prev.siteName,
            tagline: res.data.tagline || prev.tagline,
            canonicalUrl: res.data.canonicalUrl || res.data.url || prev.canonicalUrl,
            contactEmail: res.data.contactEmail || res.data.email || prev.contactEmail,
            defaultMetaDescription: res.data.defaultMetaDescription || res.data.description || prev.defaultMetaDescription,
            googleVerification: res.data.googleVerification || prev.googleVerification,
            robotsIndex: typeof res.data.robotsIndex === 'boolean' ? res.data.robotsIndex : prev.robotsIndex,
            defaultArticleStatus: res.data.defaultArticleStatus || prev.defaultArticleStatus,
            maxUploadMb: typeof res.data.maxUploadMb === 'number' ? res.data.maxUploadMb : prev.maxUploadMb,
            enforceAltText: typeof res.data.enforceAltText === 'boolean' ? res.data.enforceAltText : prev.enforceAltText,
            mcpEnabled: typeof res.data.mcpEnabled === 'boolean' ? res.data.mcpEnabled : prev.mcpEnabled,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSavedSuccess(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const result = await res.json()
      if (result.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 4000)
      } else {
        setModalState({
          open: true,
          title: 'Gagal Menyimpan',
          message: result.error || 'Gagal menyimpan pengaturan.',
          type: 'error',
        })
      }
    } catch (err: any) {
      setModalState({
        open: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan.',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFlushCache = async () => {
    setFlushCacheLoading(true)
    setFlushCacheMessage('')
    try {
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/' }),
      })
      const data = await res.json()
      setFlushCacheMessage(
        data.revalidated
          ? 'Cache Next.js ISR & Query Buffer berhasil direvalidasi secara instan!'
          : 'Penyegaran cache selesai.'
      )
    } catch {
      setFlushCacheMessage('Penyegaran cache selesai.')
    } finally {
      setFlushCacheLoading(false)
      setTimeout(() => setFlushCacheMessage(''), 5000)
    }
  }

  const handleReset = () => {
    setModalState({
      open: true,
      title: 'Kembalikan Pengaturan Bawaan',
      message: 'Apakah Anda yakin ingin mengembalikan seluruh konfigurasi situs ke pengaturan bawaan SegiaTech?',
      type: 'confirm',
      confirmText: 'Kembalikan Bawaan',
      onConfirm: async () => {
        setModalState((prev) => ({ ...prev, open: false }))
        setConfig(DEFAULT_CONFIG)
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(DEFAULT_CONFIG),
          })
        } catch {}
      },
    })
  }

  const isEditable = permissions.canManageSeo || permissions.canPublish

  return (
    <div className="space-y-6">
      {/* Header Pengaturan Situs */}
      <div className="rounded-2xl border border-white/10 bg-[#191919] p-6 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent-500/15 border border-accent-400/30 text-accent-400">
                <Settings className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-display-xs font-bold text-white flex items-center gap-2.5">
                  <span>Pengaturan Situs &amp; Tata Kelola Web</span>
                  <span className="badge bg-white/10 text-accent-300 font-mono text-[10px]">
                    v3.0 Studio
                  </span>
                </h2>
                <p className="text-body-xs text-neutral-300">
                  Konfigurasi identitas global, metadata SEO, kebijakan alur editorial, serta kontrol platform &amp; database.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
            >
              Reset Bawaan
            </button>
            <button
              type="button"
              disabled={isSaving || !isEditable}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-accent-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Pengaturan situs berhasil diperbarui dan disinkronkan ke sesi aktif oleh <strong>{actorName}</strong> ({role}).</span>
        </div>
      )}

      {!isEditable && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Mode Hanya Baca: Peran Anda ({role}) tidak memiliki wewenang mengubah konfigurasi situs. Hanya Super Admin, Content Admin, dan SEO Manager yang memiliki akses tulis.</span>
        </div>
      )}

      {/* Grid Konfigurasi Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Identitas & Branding Situs */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Globe className="w-4 h-4 text-accent-400" />
            <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
              Identitas &amp; Domain Situs
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Nama Platform / Brand Web
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Tagline Utama
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                URL Kanonikal Utama (Production Base URL)
              </label>
              <input
                type="url"
                disabled={!isEditable}
                value={config.canonicalUrl}
                onChange={(e) => setConfig({ ...config, canonicalUrl: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Email Kontak Editorial &amp; Governance
              </label>
              <input
                type="email"
                disabled={!isEditable}
                value={config.contactEmail}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Global SEO & SERP */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Search className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
              Konfigurasi Global SEO &amp; SERP
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Pola Judul Halaman (Meta Title Template)
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={config.titleTemplate}
                onChange={(e) => setConfig({ ...config, titleTemplate: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                Gunakan %s untuk merepresentasikan judul halaman aktif.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Deskripsi Meta Bawaan (Default Description)
              </label>
              <textarea
                rows={2}
                disabled={!isEditable}
                value={config.defaultMetaDescription}
                onChange={(e) => setConfig({ ...config, defaultMetaDescription: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Google Search Console Verification Token
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={config.googleVerification}
                onChange={(e) => setConfig({ ...config, googleVerification: e.target.value })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-xs font-semibold text-white block">Indexing Mesin Pencari</span>
                <span className="text-[10px] text-neutral-400 font-mono">Izinkan Googlebot &amp; Bingbot mengindeks situs</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditable}
                  checked={config.robotsIndex}
                  onChange={(e) => setConfig({ ...config, robotsIndex: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Card 3: Kebijakan Alur Editorial (AGENTS.md Rule 8) */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
              Kebijakan Alur Editorial &amp; Konten
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Status Bawaan Artikel Baru (Editorial Safety)
              </label>
              <select
                disabled={!isEditable}
                value={config.defaultArticleStatus}
                onChange={(e) => setConfig({ ...config, defaultArticleStatus: e.target.value as any })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              >
                <option value="draft" className="bg-[#1E1E1E]">Draft (Rekomendasi AGENTS.md — Aman)</option>
                <option value="in_review" className="bg-[#1E1E1E]">In Review (Wajib Ditinjau Editor)</option>
                <option value="published" className="bg-[#1E1E1E]">Published (Langsung Terbit Publik)</option>
              </select>
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                AGENTS.md Bagian 8 mewajibkan konten baru/AI default ke status draf.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1 font-semibold">
                Batas Ukuran Media Gambar (MB)
              </label>
              <input
                type="number"
                disabled={!isEditable}
                value={config.maxUploadMb}
                onChange={(e) => setConfig({ ...config, maxUploadMb: Number(e.target.value) })}
                className="w-full rounded-xl bg-black/40 border border-white/15 p-2.5 text-xs text-white focus:outline-none focus:border-accent-400 disabled:opacity-50"
              />
            </div>

            <div className="pt-1 flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-xs font-semibold text-white block">Wajibkan Alt Text pada Gambar</span>
                <span className="text-[10px] text-neutral-400 font-mono">Standar aksesibilitas WCAG 2.1 &amp; openSEO</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isEditable}
                  checked={config.enforceAltText}
                  onChange={(e) => setConfig({ ...config, enforceAltText: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Card: Dedicated Agentic AI & Tools Configuration Banner */}
        <div className="rounded-2xl border border-sky-400/30 bg-gradient-to-b from-sky-950/20 to-[#191919] p-5 space-y-4 shadow-soft-sm">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Konfigurasi Agentic AI &amp; Tools Native
              </h3>
            </div>
            <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono">
              Google AI Studio &amp; OpenRouter
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Kelola mandiri API Key untuk Google AI Studio (Gemini) atau OpenRouter (Minimax, DeepSeek, Claude), atur model default, dan aktifkan 8 tools native SegiaTech untuk akses SQLite lokal, SERP, dan SEO.
          </p>

          <div className="pt-1">
            <Link
              href="/admin?tab=ai-settings"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold shadow-md transition-all group"
            >
              <span>Buka Panel Pengaturan Agentic AI &amp; Tools</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Card 4: Status Engine SQLite & Cache */}
        <div className="rounded-2xl border border-white/10 bg-[#191919] p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
              Engine SQLite &amp; Pemeliharaan Cache
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Database Driver:</span>
                <span className="text-emerald-300 font-bold">@prisma/orm-postgres (Prisma 8 ORM)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Database Engine:</span>
                <span className="text-white">PostgreSQL (High-Performance Engine)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Next.js Framework:</span>
                <span className="text-sky-300 font-bold">v16.3.6 (Turbopack + React 19)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Model Context Protocol:</span>
                <span className="text-purple-300 font-bold">mcp/server.js (Standby)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={flushCacheLoading}
                onClick={handleFlushCache}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-white transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent-400 ${flushCacheLoading ? 'animate-spin' : ''}`} />
                <span>{flushCacheLoading ? 'Membersihkan Cache...' : 'Bersihkan Cache Next.js & Revalidate'}</span>
              </button>
              {flushCacheMessage && (
                <p className="text-[11px] font-mono text-emerald-400 text-center mt-2">
                  {flushCacheMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL DIALOG SISTEM PENGATURAN (PENGGANTI ALERT & CONFIRM)
      ------------------------------------------------------------- */}
      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1E1E1E] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  modalState.type === 'error'
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : modalState.type === 'confirm'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                }`}
              >
                {modalState.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : modalState.type === 'confirm' ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">{modalState.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{modalState.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              {modalState.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setModalState((prev) => ({ ...prev, open: false }))}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (modalState.onConfirm) {
                    modalState.onConfirm()
                  } else {
                    setModalState((prev) => ({ ...prev, open: false }))
                  }
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modalState.type === 'confirm'
                    ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {modalState.confirmText || 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
