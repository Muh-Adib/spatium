'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  Gauge,
  Globe,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react'
import { useIndexingCooldown } from '@/hooks/useIndexingCooldown'
import { useAuth } from '@/lib/auth/AuthContext'

/** Readable message from an API error body (`message`, `error`, or `errors[0]`). */
function apiErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === 'object') {
    const body = json as { message?: unknown; error?: unknown; errors?: unknown }
    if (Array.isArray(body.errors) && typeof body.errors[0] === 'string') return body.errors[0]
    if (typeof body.message === 'string') return body.message
    if (typeof body.error === 'string') return body.error
  }
  return fallback
}

const PROVIDER_OK = new Set(['accepted', 'success'])

interface PageSpeedReport {
  url: string
  device: 'mobile' | 'desktop'
  performanceScore: number
  seoScore: number
  accessibilityScore: number
  bestPracticesScore: number
  lcpMs: number
  inpMs: number
  cls: number
  fcpMs: number
  capturedAt: string
}

interface IndexingSubmissionItem {
  id: number
  url: string
  entityType: 'article' | 'page' | 'custom' | null
  entityId: number | null
  provider: 'indexnow' | 'google' | string
  status: 'accepted' | 'success' | 'failed' | 'rate_limited' | 'unconfigured' | 'in_progress' | string
  httpStatus: number | null
  responsePayload: any
  trigger: 'auto' | 'manual' | 'bulk' | 'mcp' | string
  actor: string | null
  submittedAt: string
}

interface SubmissionResultSummary {
  url: string
  providers: {
    indexnow?: { status: string; httpStatus: number | null; message: string }
    google?: { status: string; httpStatus: number | null; message: string }
  }
}

export function StudioPerformanceManager() {
  const { can } = useAuth()
  const canUseSeoTools = can('seo:manage')
  // ─── Sub-Tab Navigation ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'indexing' | 'pagespeed'>(canUseSeoTools ? 'indexing' : 'pagespeed')
  // Roles without SEO tools only ever see the PageSpeed history.
  const currentTab = canUseSeoTools ? activeTab : 'pagespeed'

  // ─── Unified Quick Submitter State ───────────────────────────────────────────
  const [submitUrl, setSubmitUrl] = useState<string>('')
  const [providerChoice, setProviderChoice] = useState<'all' | 'indexnow' | 'google'>('all')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitResult, setSubmitResult] = useState<SubmissionResultSummary | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUrlPreviouslySubmitted, setIsUrlPreviouslySubmitted] = useState<boolean>(false)

  // Cooldown Hook for Quick Submitter
  const {
    inCooldown,
    remainingSeconds,
    remainingFormatted,
    startCooldown,
  } = useIndexingCooldown()

  // ─── Live Submission History State ───────────────────────────────────────────
  const [historyItems, setHistoryItems] = useState<IndexingSubmissionItem[]>([])
  const [historyTotal, setHistoryTotal] = useState<number>(0)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const pageSize = 15
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [retriggeringId, setRetriggeringId] = useState<number | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [rowNotice, setRowNotice] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // ─── PageSpeed State ─────────────────────────────────────────────────────────
  const [psHistory, setPsHistory] = useState<PageSpeedReport[]>([])
  const [psLoading, setPsLoading] = useState<boolean>(true)
  const [runningAudit, setRunningAudit] = useState<boolean>(false)
  const [targetUrl, setTargetUrl] = useState<string>('')
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [latestReport, setLatestReport] = useState<PageSpeedReport | null>(null)
  const [auditError, setAuditError] = useState<{ reason: string; howToConnect?: string; disconnected: boolean } | null>(null)

  // ─── Fetch Submission History ────────────────────────────────────────────────
  const fetchIndexingHistory = useCallback(async () => {
    if (!canUseSeoTools) return
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const offset = (page - 1) * pageSize
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      })
      if (filterProvider !== 'all') params.set('provider', filterProvider)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (searchTerm.trim()) params.set('search', searchTerm.trim())

      const res = await fetch(`/api/indexing/history?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        const items = json.data || json.items || []
        const total = json.pagination?.total ?? json.total ?? items.length
        setHistoryItems(items)
        setHistoryTotal(total)
      } else {
        const json = await res.json().catch(() => null)
        setHistoryError(apiErrorMessage(json, 'Riwayat pengindeksan tidak dapat dimuat.'))
      }
    } catch (err) {
      console.error('Failed to load indexing history:', err)
      setHistoryError('Riwayat pengindeksan tidak dapat dimuat.')
    } finally {
      setHistoryLoading(false)
    }
  }, [canUseSeoTools, page, pageSize, filterProvider, filterStatus, searchTerm])

  useEffect(() => {
    fetchIndexingHistory()
  }, [fetchIndexingHistory])

  // ─── Check URL Cooldown on Blur / Change ──────────────────────────────────────
  const checkUrlStatus = useCallback(async (url: string) => {
    if (!url.trim() || !canUseSeoTools) return
    try {
      const res = await fetch(`/api/indexing/status?url=${encodeURIComponent(url.trim())}`)
      if (res.ok) {
        const json = await res.json()
        const hasPrior = Boolean(json.providers?.indexnow || json.providers?.google)
        setIsUrlPreviouslySubmitted(hasPrior)
        if (json.cooldown?.inCooldown && json.cooldown?.nextAvailableAt) {
          startCooldown(json.cooldown.nextAvailableAt, json.cooldown.remainingSeconds)
        }
      }
    } catch (err) {
      console.warn('Failed to check indexing status for URL:', err)
    }
  }, [canUseSeoTools, startCooldown])

  // ─── Handle Quick Submit ─────────────────────────────────────────────────────
  const handleQuickSubmit = async () => {
    if (!submitUrl.trim() || submitting || inCooldown) return
    setSubmitting(true)
    setSubmitError(null)
    setSubmitResult(null)

    try {
      const res = await fetch('/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: submitUrl.trim(),
          provider: providerChoice,
        }),
      })

      const json = await res.json()

      if (res.status === 429) {
        const remainingSecs = json.remainingSeconds || 86400
        const remainingHours = Math.floor(remainingSecs / 3600)
        const remainingMins = Math.floor((remainingSecs % 3600) / 60)
        setSubmitError(
          `Masa jeda 24 jam masih aktif. Tunggu ${remainingHours} jam ${remainingMins} menit untuk pengiriman ulang.`
        )
        if (json.nextAvailableAt) {
          startCooldown(json.nextAvailableAt, remainingSecs)
        }
        return
      }

      if (!res.ok) {
        setSubmitError(apiErrorMessage(json, 'Gagal mengirim indexing.'))
        return
      }

      if (json.success) {
        setSubmitResult({
          url: json.url,
          providers: json.providers,
        })
        setIsUrlPreviouslySubmitted(true)
        if (json.cooldown?.nextAvailableAt) {
          startCooldown(json.cooldown.nextAvailableAt, json.cooldown.durationSeconds || 86400)
        }
        fetchIndexingHistory()
      }
    } catch (err) {
      console.error('Indexing submit failed:', err)
      setSubmitError('Gagal menghubungi server indexing.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Retrigger Individual Row ────────────────────────────────────────────────
  const handleRetriggerRow = async (item: IndexingSubmissionItem) => {
    setRetriggeringId(item.id)
    setRowNotice(null)
    try {
      const res = await fetch('/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          provider: item.provider === 'google' || item.provider === 'indexnow' ? item.provider : 'all',
        }),
      })
      const json = await res.json()
      if (res.status === 429) {
        setRowNotice(json.message || `URL ini masih dalam masa jeda 24 jam (${json.remainingFormatted} tersisa).`)
      } else if (!res.ok) {
        setRowNotice(apiErrorMessage(json, 'Pengiriman ulang gagal.'))
      } else {
        setRowNotice(`Pengiriman ulang untuk ${item.url} telah diproses. Lihat status terbaru di tabel.`)
        fetchIndexingHistory()
      }
    } catch (err) {
      console.error('Indexing retrigger failed:', err)
      setRowNotice('Gagal menghubungi server indexing.')
    } finally {
      setRetriggeringId(null)
    }
  }

  // ─── Copy URL Handler ────────────────────────────────────────────────────────
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedUrl(url)
        setTimeout(() => setCopiedUrl(null), 2000)
      },
      (err) => console.warn('Clipboard write failed:', err),
    )
  }

  // ─── PageSpeed Handlers ──────────────────────────────────────────────────────
  const fetchPageSpeedHistory = async () => {
    setPsLoading(true)
    try {
      const res = await fetch('/api/perf')
      const json = await res.json()
      if (!res.ok) {
        setAuditError({ reason: apiErrorMessage(json, 'Riwayat performa tidak dapat dimuat.'), disconnected: false })
      } else if (json.data?.history) {
        setPsHistory(json.data.history)
        if (json.data.history.length > 0 && !latestReport) {
          setLatestReport(json.data.history[0])
        }
      }
    } catch (err) {
      console.error('Failed to load performance history:', err)
    } finally {
      setPsLoading(false)
    }
  }

  useEffect(() => {
    if (currentTab === 'pagespeed') {
      fetchPageSpeedHistory()
    }
  }, [currentTab])

  const handleRunAudit = async () => {
    setRunningAudit(true)
    setAuditError(null)
    try {
      const res = await fetch('/api/perf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, device }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setLatestReport(json.data)
        setPsHistory((prev) => [json.data, ...prev])
      } else if (json.connected === false) {
        setAuditError({
          reason: json.reason || 'PAGESPEED_API_KEY belum dikonfigurasi.',
          howToConnect: json.howToConnect,
          disconnected: true,
        })
      } else {
        setAuditError({ reason: apiErrorMessage(json, 'Audit PageSpeed gagal.'), disconnected: false })
      }
    } catch (err) {
      console.error('Audit run failed:', err)
      setAuditError({ reason: 'Gagal menghubungi server.', disconnected: false })
    } finally {
      setRunningAudit(false)
    }
  }

  // ─── Render Helpers ──────────────────────────────────────────────────────────
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>{status === 'accepted' ? 'Diterima' : 'Sukses'}</span>
          </span>
        )
      case 'rate_limited':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>Rate Limited</span>
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>Gagal</span>
          </span>
        )
      case 'unconfigured':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-white/10">
            <HelpCircle className="w-3 h-3" />
            <span>Unconfigured</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </span>
        )
    }
  }

  const getButtonText = () => {
    if (submitting) return 'Mengirim ke Mesin Pencari...'
    if (inCooldown) {
      const remainingHours = Math.floor(remainingSeconds / 3600)
      const remainingMins = Math.floor((remainingSeconds % 3600) / 60)
      return `Cooldown aktif (${remainingHours}j ${remainingMins}m)`
    }
    return isUrlPreviouslySubmitted ? 'Kirim Ulang ke Mesin Pencari' : 'Kirim ke IndexNow & Google'
  }

  const totalPages = Math.max(1, Math.ceil(historyTotal / pageSize))

  return (
    <div className="space-y-6">
      {/* ─── Top Level Sub-Tabs ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Performa, Core Web Vitals &amp; Pengindeksan Mesin Pencari</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit Lighthouse lab, metrik CrUX Google, dan pengiriman instan protokol IndexNow &amp; Google Search Console.
          </p>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-medium">
          {canUseSeoTools && (
            <button
              type="button"
              aria-pressed={currentTab === 'indexing'}
              onClick={() => setActiveTab('indexing')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                currentTab === 'indexing'
                  ? 'bg-white/15 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-info" />
              <span>Pengindeksan &amp; Riwayat</span>
            </button>
          )}

          <button
            type="button"
            aria-pressed={currentTab === 'pagespeed'}
            onClick={() => setActiveTab('pagespeed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              currentTab === 'pagespeed'
                ? 'bg-white/15 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>PageSpeed &amp; CWV</span>
          </button>
        </div>
      </div>

      {!canUseSeoTools && (
        <p className="text-xs text-neutral-400">
          Peran Anda tidak dapat mengirim pengindeksan atau menjalankan PageSpeed. Anda tetap dapat melihat riwayat PageSpeed.
        </p>
      )}

      {/* ─── TAB 1: REAL-TIME INDEXING (QUICK SUBMITTER & HISTORY TABLE) ─── */}
      {currentTab === 'indexing' && canUseSeoTools && (
        <div className="space-y-6">
          {/* 1. Unified Quick Submitter Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-info" />
                <span>Pengiriman Instan Cepat (Google &amp; IndexNow)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 border border-white/10">
                24h Cooldown Rate-Limited
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Serahkan URL ke Google Search Console (URL Inspection API) dan IndexNow protocol (Bing, Yandex, Seznam). Pengiriman dibatasi maksimal 1x dalam 24 jam per URL untuk mencegah kelebihan kuota perayap bot.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* URL Input */}
              <div className="md:col-span-8 flex items-center gap-2.5 bg-black/60 border border-white/10 px-3 py-2 rounded-xl">
                <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="url"
                  aria-label="URL yang akan dikirim ke mesin pencari"
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  onBlur={() => checkUrlStatus(submitUrl)}
                  placeholder="https://spatium.id/journal/judul-artikel"
                  className="flex-1 bg-transparent text-xs text-neutral-200 focus:outline-none font-mono"
                />
              </div>

              {/* Provider Selection */}
              <div className="md:col-span-4 flex items-center gap-2">
                <select
                  aria-label="Penyedia pengindeksan"
                  value={providerChoice}
                  onChange={(e) => setProviderChoice(e.target.value as 'all' | 'indexnow' | 'google')}
                  className="w-full bg-black/60 border border-white/10 rounded-xl text-xs text-neutral-300 px-3 py-2 focus:outline-none"
                >
                  <option value="all">Semua (IndexNow + Google)</option>
                  <option value="indexnow">Hanya IndexNow (Bing/Yandex)</option>
                  <option value="google">Hanya Google Search Console</option>
                </select>
              </div>
            </div>

            {/* Error or Notice Alert */}
            {submitError && (
              <div role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">{submitError}</span>
                </div>
              </div>
            )}

            {/* Success Result Summary */}
            <div role="status" aria-live="polite">
            {submitResult && (
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-neutral-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Send className="w-4 h-4 text-info" aria-hidden="true" />
                  <span>Hasil pengiriman untuk {submitResult.url}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-neutral-300">
                  {(
                    [
                      ['IndexNow', submitResult.providers.indexnow],
                      ['Google Search Console', submitResult.providers.google],
                    ] as const
                  ).map(([label, result]) =>
                    result ? (
                      <div key={label} className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
                        <div>
                          <span className="text-neutral-400">{label}: </span>
                          <strong className={PROVIDER_OK.has(result.status) ? 'text-emerald-300' : 'text-amber-300'}>
                            {PROVIDER_OK.has(result.status) ? 'Berhasil' : 'Tidak berhasil'} · {result.status}
                            {result.httpStatus ? ` (HTTP ${result.httpStatus})` : ''}
                          </strong>
                        </div>
                        <p className="text-neutral-400">{result.message}</p>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-neutral-500">
                {inCooldown
                  ? `Masa jeda aktif (${remainingFormatted} tersisa)`
                  : 'Siap dikirim ke antrean mesin pencari.'}
              </span>

              <button
                type="button"
                onClick={handleQuickSubmit}
                disabled={submitting || !submitUrl.trim() || inCooldown || !canUseSeoTools}
                className="px-5 py-2.5 bg-accent-500 hover:bg-accent-300 text-accent-950 rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{getButtonText()}</span>
              </button>
            </div>
          </div>

          {/* 2. Live Indexing Submission History Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Riwayat Pengindeksan Database (indexing_submissions)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Log pengiriman aktual dari PostgreSQL dengan status kode HTTP dan pemicu.
                </p>
              </div>

              {/* Filters & Refresh Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Segarkan riwayat pengindeksan"
                  onClick={fetchIndexingHistory}
                  disabled={historyLoading}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs transition-colors"
                  title="Segarkan Riwayat"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6 flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <input
                  type="search"
                  aria-label="Cari URL di riwayat"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari URL..."
                  className="w-full bg-transparent text-xs text-neutral-200 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  aria-label="Filter penyedia"
                  value={filterProvider}
                  onChange={(e) => {
                    setFilterProvider(e.target.value)
                    setPage(1)
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-neutral-300 px-3 py-1.5 focus:outline-none"
                >
                  <option value="all">Semua Provider</option>
                  <option value="indexnow">IndexNow</option>
                  <option value="google">Google</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  aria-label="Filter status"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setPage(1)
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl text-xs text-neutral-300 px-3 py-1.5 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="accepted">Accepted / Success</option>
                  <option value="rate_limited">Rate Limited</option>
                  <option value="failed">Failed</option>
                  <option value="unconfigured">Unconfigured</option>
                </select>
              </div>
            </div>

            <div role="status" aria-live="polite">
              {rowNotice && (
                <p className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-neutral-200">{rowNotice}</p>
              )}
            </div>
            {historyError && (
              <p role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">{historyError}</p>
            )}

            {/* Table Container */}
            <div className="rounded-2xl border border-white/10 bg-[var(--studio-sidebar-bg)] overflow-hidden shadow-soft-sm">
              {historyLoading && historyItems.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-mono text-xs">
                  Memuat riwayat pengindeksan...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-16 text-center text-neutral-400 font-mono text-xs space-y-2">
                  <HelpCircle className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-neutral-300 font-semibold">Belum ada riwayat pengindeksan.</p>
                  <p className="text-neutral-500 text-[11px]">
                    Kirim URL pertama kali menggunakan formulir di atas atau publikasikan konten baru.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-neutral-300 font-mono">
                        <th className="py-3 px-4 font-semibold">URL Target</th>
                        <th className="py-3 px-3 font-semibold">Tipe</th>
                        <th className="py-3 px-3 font-semibold">Penyedia</th>
                        <th className="py-3 px-3 font-semibold">Status</th>
                        <th className="py-3 px-3 font-semibold">HTTP</th>
                        <th className="py-3 px-3 font-semibold">Pemicu</th>
                        <th className="py-3 px-3 font-semibold">Waktu Kirim</th>
                        <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {historyItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          {/* URL Column */}
                          <td className="py-3 px-4 max-w-[280px]">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-neutral-200 select-all" title={item.url}>
                                {item.url}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(item.url)}
                                aria-label={copiedUrl === item.url ? 'URL disalin' : `Salin URL ${item.url}`}
                                title="Salin URL"
                                className="p-1 rounded text-neutral-500 hover:text-white transition-colors shrink-0"
                              >
                                {copiedUrl === item.url ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Buka URL di tab baru"
                                aria-label={`Buka ${item.url} di tab baru`}
                                className="p-1 rounded text-neutral-500 hover:text-info transition-colors shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>

                          {/* Entity Type Column */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-neutral-400 border border-white/10 capitalize">
                              {item.entityType || 'custom'}
                            </span>
                          </td>

                          {/* Provider Column */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {item.provider === 'google' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Google
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-info/15 text-info-300 border border-info/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-info" />
                                IndexNow
                              </span>
                            )}
                          </td>

                          {/* Status Pill */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {renderStatusPill(item.status)}
                          </td>

                          {/* HTTP Status Code */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold ${
                                item.httpStatus && item.httpStatus < 300
                                  ? 'text-emerald-400'
                                  : item.httpStatus === 429
                                  ? 'text-amber-400'
                                  : item.httpStatus
                                  ? 'text-rose-400'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {item.httpStatus ? `HTTP ${item.httpStatus}` : '—'}
                            </span>
                          </td>

                          {/* Trigger Type */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[10px] text-neutral-400 capitalize">
                              {item.trigger || 'auto'}
                            </span>
                          </td>

                          {/* Submitted At */}
                          <td className="py-3 px-3 whitespace-nowrap text-[11px] text-neutral-400">
                            {new Date(item.submittedAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          {/* Retrigger Action */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRetriggerRow(item)}
                              disabled={retriggeringId === item.id}
                              title="Kirim ulang URL ini sekarang"
                              className="px-2.5 py-1 rounded-lg bg-info/15 text-info-300 hover:bg-info/25 border border-info/30 text-[10px] font-semibold transition-all inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${retriggeringId === item.id ? 'animate-spin' : ''}`}
                              />
                              <span>Kirim Ulang</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-neutral-400">
                  <span>
                    Menampilkan halaman {page} dari {totalPages} ({historyTotal} riwayat)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      aria-label="Halaman sebelumnya"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      aria-label="Halaman berikutnya"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: AUDIT PAGESPEED & CORE WEB VITALS ───────────────────── */}
      {currentTab === 'pagespeed' && (
        <div className="space-y-6">
          {/* Controls Bar (only for roles that may run PageSpeed) */}
          {canUseSeoTools && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 border border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-2.5 flex-1">
              <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                aria-label="URL atau path yang diaudit (kosong = beranda situs)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/ atau /journal/judul-artikel (kosong = beranda)"
                className="flex-1 bg-transparent text-xs text-neutral-200 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Perangkat audit"
                value={device}
                onChange={(e) => setDevice(e.target.value as 'mobile' | 'desktop')}
                className="bg-black/50 border border-white/10 rounded-lg text-xs text-neutral-300 px-3 py-1.5 focus:outline-none"
              >
                <option value="mobile">Mobile (CrUX Standard)</option>
                <option value="desktop">Desktop</option>
              </select>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={runningAudit}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-lg text-xs transition-all shadow-md disabled:opacity-50"
              >
                {runningAudit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
                <span>{runningAudit ? 'Mengaudit...' : 'Uji PageSpeed'}</span>
              </button>
            </div>
          </div>
          )}

          {/* Disconnected / Audit Error Alert */}
          {auditError && (
            <div role="alert" className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                <span>{auditError.disconnected ? 'Integrasi PageSpeed Belum Terhubung' : 'Audit PageSpeed Gagal'}</span>
              </div>
              <p className="text-neutral-300">{auditError.reason}</p>
              {auditError.howToConnect && (
                <p className="text-neutral-400 font-mono text-[11px] bg-black/40 p-2 rounded">
                  {auditError.howToConnect}
                </p>
              )}
            </div>
          )}

          {/* Empty State when no reports exist */}
          {!latestReport && !auditError && (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/40 space-y-2">
              <Gauge className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">Belum Ada Riwayat Audit PageSpeed</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Masukkan URL target di atas dan klik tombol &quot;Uji PageSpeed&quot; untuk menjalankan audit Core Web Vitals melalui Google Lighthouse API.
              </p>
            </div>
          )}

          {/* Latest Report Gauges */}
          {latestReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900/70 border border-white/10 text-center space-y-1">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Performance</span>
                  <div
                    className={`text-3xl font-extrabold ${
                      latestReport.performanceScore >= 90
                        ? 'text-emerald-400'
                        : latestReport.performanceScore >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {latestReport.performanceScore}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Target &ge; 90</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/70 border border-white/10 text-center space-y-1">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">SEO Teknis</span>
                  <div
                    className={`text-3xl font-extrabold ${
                      latestReport.seoScore >= 95 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {latestReport.seoScore}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Target &ge; 95</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/70 border border-white/10 text-center space-y-1">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Accessibility</span>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {latestReport.accessibilityScore}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">WCAG AA Compliant</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/70 border border-white/10 text-center space-y-1">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">Best Practices</span>
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {latestReport.bestPracticesScore}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Security &amp; Modern Web</span>
                </div>
              </div>

              {/* Core Web Vitals Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">LCP (Largest Contentful)</span>
                  <div className="text-base font-bold text-white mt-1">{(latestReport.lcpMs / 1000).toFixed(2)}s</div>
                  <span className="text-[10px] text-emerald-400 font-mono">&le; 2.5s (Baik)</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">TBT (Total Blocking Time, lab)</span>
                  <div className="text-base font-bold text-white mt-1">{latestReport.inpMs}ms</div>
                  <span className="text-[10px] text-emerald-400 font-mono">&le; 200ms (Baik)</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">CLS (Visual Stability)</span>
                  <div className="text-base font-bold text-white mt-1">{latestReport.cls}</div>
                  <span className="text-[10px] text-emerald-400 font-mono">&le; 0.1 (Stabil)</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase">FCP (First Contentful)</span>
                  <div className="text-base font-bold text-white mt-1">{(latestReport.fcpMs / 1000).toFixed(2)}s</div>
                  <span className="text-[10px] text-emerald-400 font-mono">&le; 1.8s (Baik)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
