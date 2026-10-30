'use client'

import React, { useState, useEffect, useRef } from 'react'
import { siteConfig } from '@/config/site'
import {
  Download,
  Shield,
  CheckCircle,
  ExternalLink,
  Globe,
  RefreshCw,
  Terminal,
  AlertTriangle,
  Database,
  FileText,
  Navigation,
  Sparkles,
  Wrench,
  User,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  Layers,
  Maximize2,
  Minimize2,
  X,
  Lock,
  Unlock,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

interface JobStatus {
  id: string
  source: string
  sourceUrl: string
  status: 'pending' | 'running' | 'completed' | 'partial' | 'failed'
  totalPosts: number
  imported: number
  skipped: number
  errors: number
  startedAt: string
  finishedAt?: string
  currentStep?: string
  recentLogs?: string[]
  importedPages?: number
  conflicts?: number
  coverage?: string
  details?: Array<{ entity: string; id?: number; error: string }>
}

interface DbStats {
  articlesCount: number
  pagesCount: number
  redirectsCount: number
}

export function StudioWpImporter() {
  const [authMode, setAuthMode] = useState<'authenticated' | 'public'>('authenticated')
  const [completeExport, setCompleteExport] = useState(false)
  const [username, setUsername] = useState('')
  const [applicationPassword, setApplicationPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [siteUrl, setSiteUrl] = useState('https://www.segiatech.com')
  const [loading, setLoading] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [dbStats, setDbStats] = useState<DbStats>({ articlesCount: 0, pagesCount: 0, redirectsCount: 0 })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [repairing, setRepairing] = useState(false)
  const [repairMessage, setRepairMessage] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [copiedLog, setCopiedLog] = useState(false)
  const [expandedLog, setExpandedLog] = useState(false)

  const logContainerRef = useRef<HTMLDivElement>(null)

  // Fetch initial stats & check if there is an active/recent job
  const fetchStatus = async (jobId?: string) => {
    try {
      const url = jobId ? `/api/import/status?jobId=${jobId}` : '/api/import/status'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setDbStats(data.stats)
        }
        if (data.job) {
          setJobStatus(data.job)
          if (data.job.status === 'running') {
            setActiveJobId(data.job.id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Auto-poll when a job is active/running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeJobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/import/status?jobId=${activeJobId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.stats) setDbStats(data.stats)
            if (data.job) {
              setJobStatus(data.job)
              if (data.job.status === 'completed' || data.job.status === 'partial' || data.job.status === 'failed') {
                setActiveJobId(null)
                setLoading(false)
              }
            }
          }
        } catch (e) {
          console.error('Error polling import status:', e)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeJobId])

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [jobStatus?.recentLogs])

  // Handle Starting Live Import
  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteUrl.trim() || loading || activeJobId) return

    // If authenticated mode is chosen, require username and application password
    if (authMode === 'authenticated' && (!username.trim() || !applicationPassword.trim())) {
      setErrorMessage('Untuk Jalur Terautentikasi, Username dan Sandi Aplikasi WordPress wajib diisi.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const payload: Record<string, any> = {
        siteUrl: siteUrl.trim(),
        completeExport: authMode === 'authenticated' ? completeExport : false,
      }

      if (authMode === 'authenticated') {
        payload.username = username.trim()
        payload.applicationPassword = applicationPassword.trim().replace(/\s+/g, '')
      }

      const res = await fetch('/api/import/wp-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setActiveJobId(data.jobId)
        fetchStatus(data.jobId)
      } else {
        setErrorMessage(data.error || 'Gagal memulai proses migrasi WordPress.')
        setLoading(false)
      }
    } catch {
      setErrorMessage('Terjadi kegagalan jaringan saat menghubungi API migrasi.')
      setLoading(false)
    }
  }

  // Handle Repair Missing Metadata
  const handleRepairMissing = async () => {
    setRepairing(true)
    setRepairMessage(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/import/repair', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setRepairMessage(data.message)
        fetchStatus()
      } else {
        setErrorMessage(data.error || 'Gagal memproses perbaikan metadata.')
      }
    } catch {
      setErrorMessage('Terjadi kegagalan jaringan saat menghubungi API perbaikan metadata.')
    } finally {
      setRepairing(false)
    }
  }

  // Handle Purge Old Articles
  const handlePurgeArticles = async () => {
    setPurging(true)
    setErrorMessage(null)
    setRepairMessage(null)

    try {
      const res = await fetch('/api/import/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'articles', confirm: true }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRepairMessage(data.message)
        setConfirmPurge(false)
        setJobStatus(null)
        setActiveJobId(null)
        fetchStatus()
      } else {
        setErrorMessage(data.error || 'Gagal membersihkan data lama.')
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat menghapus artikel lama.')
    } finally {
      setPurging(false)
    }
  }

  const handleCopyLogs = () => {
    if (!jobStatus?.recentLogs) return
    navigator.clipboard.writeText(jobStatus.recentLogs.join('\n'))
    setCopiedLog(true)
    setTimeout(() => setCopiedLog(false), 2000)
  }

  const isRunning = activeJobId !== null || jobStatus?.status === 'running'
  const progressPercent =
    jobStatus?.totalPosts && jobStatus.totalPosts > 0
      ? Math.min(100, Math.round((jobStatus.imported / jobStatus.totalPosts) * 100))
      : isRunning
      ? 5
      : 0

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          0. STATUS DATABASE AKTUAL & INTERAKSI BERBASIS IKON
      ------------------------------------------------------------- */}
      <div className="p-5 bg-[#141414] border border-white/10 rounded-2xl shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-sm tracking-wide">Penyimpanan Database PostgreSQL</h3>
              <Tooltip label="Engine Database" hint="Menggunakan PostgreSQL via Prisma 8 ORM dengan schema terisolasi." side="right">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold cursor-help">
                  Prisma 8
                </span>
              </Tooltip>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-300">
              <Tooltip label="Artikel Tersimpan" hint="Jumlah seluruh pos artikel aktif di basis data PostgreSQL." side="bottom">
                <span className="flex items-center gap-1.5 font-mono cursor-help">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <strong className="text-white">{dbStats.articlesCount}</strong> Artikel
                </span>
              </Tooltip>
              <span className="text-neutral-700">•</span>
              <Tooltip label="Halaman Statis" hint="Halaman publik & landing page tersimpan." side="bottom">
                <span className="flex items-center gap-1.5 font-mono cursor-help">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <strong className="text-white">{dbStats.pagesCount}</strong> Halaman
                </span>
              </Tooltip>
              <span className="text-neutral-700">•</span>
              <Tooltip label="Aturan 301 Redirect" hint="Pemetaan URL WordPress lama yang dilindungi agar ranking SEO tidak hilang." side="bottom">
                <span className="flex items-center gap-1.5 font-mono cursor-help">
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <strong className="text-white">{dbStats.redirectsCount}</strong> 301 Redirects
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Action Icon Controls with Tooltips */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {confirmPurge ? (
            <div className="flex items-center gap-1.5 p-1 bg-red-500/10 border border-red-500/30 rounded-xl animate-fadeIn">
              <span className="text-[11px] font-semibold text-red-300 px-2 font-mono">Hapus Semua Artikel?</span>
              <Tooltip label="Konfirmasi Hapus" hint="Bersihkan seluruh artikel lokal sekarang" side="top">
                <button
                  type="button"
                  onClick={handlePurgeArticles}
                  disabled={purging || isRunning}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip label="Batal" hint="Batalkan tindakan pembersihan" side="top">
                <button
                  type="button"
                  onClick={() => setConfirmPurge(false)}
                  disabled={purging}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip label="Bersihkan Data Lama" hint="Hapus seluruh artikel lokal untuk memulai sinkronisasi bersih terautentikasi" side="bottom">
              <button
                type="button"
                onClick={() => setConfirmPurge(true)}
                disabled={isRunning || purging}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 text-neutral-400 hover:text-red-400 border border-white/10 text-xs transition-all flex items-center justify-center disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          <Tooltip label="Perbaiki Metadata" hint="Pulihkan Yoast SEO & kata kunci yang belum terisi di database" side="bottom">
            <button
              type="button"
              onClick={handleRepairMissing}
              disabled={repairing || isRunning}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-accent-500/15 hover:border-accent-500/30 text-neutral-300 hover:text-accent-300 border border-white/10 text-xs transition-all flex items-center justify-center disabled:opacity-40"
            >
              <Sparkles className={`w-4 h-4 ${repairing ? 'animate-spin text-accent-400' : ''}`} />
            </button>
          </Tooltip>

          <Tooltip label="Segarkan Hitungan" hint="Ambil hitungan database terbaru secara real-time" side="bottom">
            <button
              type="button"
              onClick={() => fetchStatus()}
              disabled={isRunning}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs transition-all flex items-center justify-center disabled:opacity-40"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {repairMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{repairMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRepairMessage(null)}
            className="text-emerald-400 hover:text-white p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          1. FORM MIGRASI WORDPRESS REST (ICON BASED + TOOLTIP)
      ------------------------------------------------------------- */}
      <div className="p-6 bg-[#161616] border border-white/10 rounded-2xl shadow-soft-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-base font-bold shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              {authMode === 'authenticated' ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-base">
                  {authMode === 'authenticated' ? 'Jalur Terautentikasi (Draf & Data Penuh)' : 'Jalur Publik Standar (881 Pos Tayang)'}
                </h3>
                <Tooltip
                  label={authMode === 'authenticated' ? 'Autentikasi Sandi Aplikasi' : 'Endpoint Terbuka'}
                  hint={
                    authMode === 'authenticated'
                      ? 'Menggunakan Username & Sandi Aplikasi untuk mengakses draf, revisi, dan status any.'
                      : 'Mengambil seluruh 881 artikel yang sudah terbit di WordPress tanpa perlu password.'
                  }
                  side="top"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 cursor-help" />
                </Tooltip>
              </div>
              <p className="text-xs text-neutral-400">
                {authMode === 'authenticated'
                  ? 'Akses menyeluruh terhadap pos terbit, draf, revisi, metadata Yoast privat, dan taksonomi.'
                  : 'Tarik cepat seluruh konten publik langsung dari REST API tanpa hambatan autentikasi.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
            <Tooltip label="Gunakan Jalur Terautentikasi" hint="Tarik draf dan status privat dengan Sandi Aplikasi" side="bottom">
              <button
                type="button"
                onClick={() => setAuthMode('authenticated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  authMode === 'authenticated'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Terautentikasi</span>
              </button>
            </Tooltip>
            <Tooltip label="Gunakan Jalur Publik" hint="Tarik langsung seluruh 881 artikel terbit tanpa sandi" side="bottom">
              <button
                type="button"
                onClick={() => setAuthMode('public')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  authMode === 'public'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Publik (881 Pos)</span>
              </button>
            </Tooltip>
          </div>
        </div>

        <form onSubmit={handleStartImport} className="space-y-4">
          {/* Target URL */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Domain WordPress Target</span>
              </span>
              <Tooltip label="Endpoint Target" hint="URL WordPress yang menyediakan REST API aktif di /wp-json/wp/v2/." side="left">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help" />
              </Tooltip>
            </label>
            <div className="relative">
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://www.segiatech.com"
                required
                disabled={isRunning}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-60 transition-colors"
              />
              <Globe className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Credentials Grid (Visible only in authenticated mode) */}
          {authMode === 'authenticated' ? (
            <div className="grid gap-3 sm:grid-cols-2 animate-fadeIn">
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Username / Email WordPress</span>
                  </span>
                  <Tooltip label="Akun Pengguna" hint="Username akun administrator atau editor WordPress Anda." side="left">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help" />
                  </Tooltip>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_segiatech"
                    autoComplete="off"
                    required
                    disabled={isRunning}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-60 transition-colors"
                  />
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sandi Aplikasi (Application Password)</span>
                  </span>
                  <Tooltip
                    label="Cara Membuat Sandi Aplikasi"
                    hint="Masuk ke WP Admin → Pengguna → Profil Saya → Gulir ke 'Sandi Aplikasi' → Masukkan nama (misal: SegiaStudio) lalu salin kode sandi yang muncul."
                    side="left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help" />
                  </Tooltip>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={applicationPassword}
                    onChange={(e) => setApplicationPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    autoComplete="off"
                    required
                    disabled={isRunning}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 pl-10 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-60 transition-colors"
                  />
                  <Key className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Jalur Publik Aktif:</strong> Sistem akan menarik seluruh 881 artikel, kategori, tag, dan media yang sudah tayang di situs live tanpa sandi.
              </span>
            </div>
          )}

          {/* Options & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {authMode === 'authenticated' ? (
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={completeExport}
                  onChange={(e) => setCompleteExport(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ambil Seluruh Status Konten (Draf, Terjadwal &amp; Privat)</span>
                </span>
                <Tooltip label="Mode context=edit" hint="Mengambil pos non-publik menggunakan hak akses REST terautentikasi." side="top">
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help" />
                </Tooltip>
              </label>
            ) : <div />}

            <button
              type="submit"
              disabled={isRunning || !siteUrl.trim() || (authMode === 'authenticated' && (!username.trim() || !applicationPassword.trim()))}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 shadow-cyan-900/30"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sinkronisasi Berjalan...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{authMode === 'authenticated' ? 'Mulai Fetch Terautentikasi' : 'Mulai Tarik Data Publik (881 Pos)'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            2. VISUALISASI PROGRESS BAR & LOG STREAM BERBASIS IKON
        ------------------------------------------------------------- */}
        {(isRunning || jobStatus) && (
          <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{jobStatus?.currentStep || (isRunning ? 'Memproses batch artikel...' : 'Menunggu respon...')}</span>
                </span>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Job: {jobStatus?.id || activeJobId}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-cyan-400 font-mono">
                  {progressPercent}%
                </span>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {jobStatus?.imported || 0} / {jobStatus?.totalPosts || 0} Terunduh
                </p>
              </div>
            </div>

            {/* Glowing Progress Bar */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 relative">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Terminal Live Log Box with Icon Actions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400">
                  <Terminal className="w-3 h-3" />
                  <span>LIVE CONSOLE STREAM</span>
                </span>
                <div className="flex items-center gap-1">
                  <Tooltip label={copiedLog ? 'Tersalin!' : 'Salin Log'} hint="Salin seluruh output konsol ke clipboard" side="top">
                    <button
                      type="button"
                      onClick={handleCopyLogs}
                      className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    >
                      {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </Tooltip>
                  <Tooltip label={expandedLog ? 'Perkecil' : 'Perbesar'} hint="Ubah ukuran tampilan kotak konsol" side="top">
                    <button
                      type="button"
                      onClick={() => setExpandedLog(!expandedLog)}
                      className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                    >
                      {expandedLog ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </Tooltip>
                  {jobStatus?.id && (
                    <Tooltip label="Laporan Detail" hint="Buka laporan integritas konten dan hash SHA-256" side="top">
                      <a
                        href={`/api/import/report?jobId=${encodeURIComponent(jobStatus.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div
                ref={logContainerRef}
                className={`bg-[#0a0d14] border border-cyan-900/30 rounded-xl p-3 overflow-y-auto font-mono text-[11px] text-cyan-300/90 leading-relaxed shadow-inner transition-all duration-300 ${
                  expandedLog ? 'h-80' : 'h-36'
                }`}
              >
                {jobStatus?.recentLogs && jobStatus.recentLogs.length > 0 ? (
                  jobStatus.recentLogs.map((logLine, idx) => (
                    <div key={idx} className="whitespace-pre-wrap hover:bg-white/5 px-1 rounded">
                      {logLine}
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-500 italic">Menunggu log dari engine migrasi...</div>
                )}
              </div>
            </div>

            {/* Completed Summary Banner */}
            {jobStatus?.status === 'completed' && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Migrasi Selesai &amp; Tersimpan ke PostgreSQL</h4>
                    <p className="text-[11px] text-emerald-400/90">
                      Tersimpan {jobStatus.imported} artikel, {jobStatus.importedPages || 0} halaman, dan 301 redirect.
                    </p>
                  </div>
                </div>

                <a
                  href={`${siteConfig.url}/artikel`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Halaman Publik</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          3. STANDAR INTEGRITAS BERBASIS IKON & TOOLTIP (RAPI & MINIMALIS)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tooltip
          label="Perlindungan 301 Otomatis"
          hint="Setiap URL pos WordPress lama dipetakan otomatis ke 301 redirect di PostgreSQL agar posisi ranking mesin pencari 100% aman."
          side="top"
          className="w-full"
        >
          <div className="w-full p-3.5 bg-[#141414] hover:bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all flex items-center gap-3 cursor-help group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-white truncate">301 Redirect Guard</span>
              <span className="block text-[10px] text-neutral-400 truncate">Anti-broken link SEO</span>
            </div>
          </div>
        </Tooltip>

        <Tooltip
          label="Pembersihan Semantik & XSS"
          hint="Membersihkan komentar Gutenberg, shortcode visual composer, dan format HTML kotor menjadi kode semantik murni."
          side="top"
          className="w-full"
        >
          <div className="w-full p-3.5 bg-[#141414] hover:bg-white/[0.04] border border-white/10 hover:border-blue-500/30 rounded-xl transition-all flex items-center gap-3 cursor-help group">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/25 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-white truncate">Sanitasi Konten</span>
              <span className="block text-[10px] text-neutral-400 truncate">HTML semantik bersih</span>
            </div>
          </div>
        </Tooltip>

        <Tooltip
          label="Media WebP & Sharp"
          hint="Gambar artikel diunduh otomatis ke disk lokal /public/uploads dan dikonversi ke WebP untuk latensi muat sub-detik."
          side="top"
          className="w-full"
        >
          <div className="w-full p-3.5 bg-[#141414] hover:bg-white/[0.04] border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all flex items-center gap-3 cursor-help group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-white truncate">Optimasi Media</span>
              <span className="block text-[10px] text-neutral-400 truncate">Format WebP Sharp</span>
            </div>
          </div>
        </Tooltip>

        <Tooltip
          label="Kredensial Ephemeral"
          hint="Username dan Sandi Aplikasi hanya digunakan selama sesi pertukaran stream HTTP dan tidak pernah disimpan di database."
          side="top"
          className="w-full"
        >
          <div className="w-full p-3.5 bg-[#141414] hover:bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex items-center gap-3 cursor-help group">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left overflow-hidden">
              <span className="block text-xs font-semibold text-white truncate">Keamanan Sesi</span>
              <span className="block text-[10px] text-neutral-400 truncate">Sandi tidak disimpan</span>
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
