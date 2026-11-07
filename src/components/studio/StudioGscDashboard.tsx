'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Smartphone,
  Laptop,
  Tablet,
  FileText,
  KeyRound,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

interface TimeSeriesItem {
  date: string
  clicks: number
  impressions: number
  position: number
}

interface GscData {
  totalClicks: number
  totalImpressions: number
  averageCtr: number
  averagePosition: number
  clicksChange: number
  impressionsChange: number
  timeSeries: TimeSeriesItem[]
}

interface QueryItem {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface PageItem {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface DeviceItem {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface CountryItem {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface ConnectionStatus {
  connected: boolean
  reason?: string
  howToConnect?: string
}

type DimensionTab = 'queries' | 'pages' | 'dates' | 'devices' | 'countries'

export function StudioGscDashboard() {
  const { can } = useAuth()
  const [siteUrl, setSiteUrl] = useState('https://spatium.id')
  const [overview, setOverview] = useState<GscData | null>(null)
  const [queries, setQueries] = useState<QueryItem[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [countries, setCountries] = useState<CountryItem[]>([])
  const [activeTab, setActiveTab] = useState<DimensionTab>('queries')
  const [connection, setConnection] = useState<ConnectionStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null)
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const canSync = can('seo:manage')

  const loadGscData = async () => {
    try {
      const res = await fetch('/api/gsc?type=all', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        setConnection({
          connected: false,
          reason:
            typeof json.message === 'string'
              ? json.message
              : typeof json.error === 'string'
                ? json.error
                : 'Data Search Console tidak dapat dimuat.',
        })
        return
      }

      if (json.siteUrl) setSiteUrl(json.siteUrl)

      // 1. Overview
      if (json.overview) {
        if (json.overview.connected === false) {
          setConnection({
            connected: false,
            reason: json.overview.reason,
            howToConnect: json.overview.howToConnect,
          })
        } else if (json.overview.connected === true) {
          setConnection({ connected: true })
          setOverview(json.overview.data || json.overview)
        }
      }

      // 2. Queries
      if (json.queries) {
        const queryList = json.queries.data || (Array.isArray(json.queries) ? json.queries : [])
        setQueries(queryList)
      }

      // 3. Pages
      if (json.pages) {
        const pageList = json.pages.data || (Array.isArray(json.pages) ? json.pages : [])
        setPages(pageList)
      }

      // 4. Devices
      if (json.devices) {
        const deviceList = json.devices.data || (Array.isArray(json.devices) ? json.devices : [])
        setDevices(deviceList)
      }

      // 5. Countries
      if (json.countries) {
        const countryList = json.countries.data || (Array.isArray(json.countries) ? json.countries : [])
        setCountries(countryList)
      }
    } catch (err) {
      console.error('Failed to load GSC data:', err)
      setConnection({ connected: false, reason: 'Server Studio tidak dapat dihubungi untuk memuat data Search Console.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGscData()
  }, [])

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncSuccessMessage(null)
    setSyncErrorMessage(null)

    try {
      const res = await fetch('/api/gsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 28 }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjalankan sinkronisasi data GSC.')
      }

      if (data.result?.connected === false) {
        throw new Error(data.result.reason || 'Sinkronisasi GSC tidak berjalan.')
      }
      const syncedRows = data.result?.data?.syncedRows ?? 0
      setSyncSuccessMessage(
        `Sinkronisasi berhasil! ${syncedRows} baris data performa harian berhasil ditarik langsung dari Google Search Console.`
      )
      await loadGscData()
    } catch (err) {
      setSyncErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan saat sinkronisasi.')
    } finally {
      setSyncing(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedText(text)
        setTimeout(() => setCopiedText(null), 2000)
      },
      (err) => console.warn('Clipboard write failed:', err),
    )
  }

  // Format Date Helper
  const formatDateId = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Format Device Icon & Name
  const renderDeviceIcon = (dev: string) => {
    const d = dev.toUpperCase()
    if (d.includes('MOBILE')) return <Smartphone className="w-4 h-4 text-[#4d8bff]" />
    if (d.includes('TABLET')) return <Tablet className="w-4 h-4 text-[#6fb0ff]" />
    return <Laptop className="w-4 h-4 text-emerald-400" />
  }

  // Clean Page Pathname for readability
  const cleanPageUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.pathname === '/' ? '/' : parsed.pathname
    } catch {
      return url
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center bg-[var(--studio-bg)] border border-white/10 rounded-2xl space-y-4">
        <div className="w-9 h-9 border-2 border-[#4d8bff] border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">Menghubungkan ke Google Search Console API...</p>
          <p className="text-xs text-[#999898]">Mengambil data analitik resmi dari Google Cloud</p>
        </div>
      </div>
    )
  }

  if (!connection.connected) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--studio-bg)] border border-amber-500/30 space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Google Search Console Belum Terhubung</h3>
            <p className="text-xs text-[#DBD7D5] leading-relaxed">
              {connection.reason ||
                'Kredensial resmi Google Search Console belum dikonfigurasi di environment server.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-surface-3 border border-white/10 rounded-xl space-y-3 text-xs">
          <p className="font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#4d8bff]" />
            Cara Menghubungkan Google Search Console:
          </p>
          <p className="text-[#999898] leading-relaxed">
            {connection.howToConnect ||
              'Tambahkan Service Account Google Cloud (GSC_CLIENT_EMAIL dan GSC_PRIVATE_KEY) ke file web/.env.local.'}
          </p>
          <div className="font-mono text-[11px] text-[#4d8bff] bg-[var(--studio-bg)] p-3 rounded-lg border border-white/10 space-y-1">
            <div>GSC_CLIENT_EMAIL=seo-engine@your-project.iam.gserviceaccount.com</div>
            <div>GSC_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n&quot;</div>
          </div>
          <p className="text-[11px] text-[#999898]">
            Pastikan email Service Account tersebut telah ditambahkan sebagai pengguna dengan izin{' '}
            <strong className="text-white font-medium">Read</strong> di Google Search Console properti Anda.
          </p>
        </div>
      </div>
    )
  }

  // Filtered queries & pages
  const filteredQueries = queries.filter((q) =>
    q.query.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredPages = pages.filter((p) =>
    p.page.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const timeSeries = overview?.timeSeries || []
  const filteredDates = timeSeries.filter((t) =>
    t.date.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* ─── Header & Sync Action Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--studio-bg)] border border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <h2 className="text-base font-bold text-white tracking-tight">Google Search Console</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#4d8bff]/10 text-[#4d8bff] border border-[#4d8bff]/20">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-[#999898]">
            Properti: <span className="text-white font-mono">{siteUrl}</span> · Data analitik langsung dari Google Search Console API (28 hari terakhir).
          </p>
        </div>

        {canSync && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={syncing}
              onClick={handleSync}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4d8bff] hover:bg-[#6fb0ff] active:bg-[#B29279] text-[#191919] font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Data GSC'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Feedback Alerts ────────────────────────────────────────── */}
      <div role="status" aria-live="polite">
      {syncSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncSuccessMessage(null)}
            aria-label="Tutup pesan sinkronisasi"
            className="text-emerald-400/80 hover:text-emerald-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      </div>

      {syncErrorMessage && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{syncErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncErrorMessage(null)}
            aria-label="Tutup pesan galat"
            className="text-red-400/80 hover:text-red-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── KPI Cards (Website Themed) ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Klik */}
        <div className="p-5 rounded-2xl bg-[var(--studio-bg)] border border-white/10 hover:border-white/20 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#999898]">
              Total Klik
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/5 text-[#DBD7D5] border border-white/10">
              28 Hari
            </span>
          </div>
          <div className="text-3xl font-bold text-white font-mono tracking-tight">
            {(overview?.totalClicks ?? 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-[#999898] leading-tight">Klik langsung dari hasil penelusuran Google</p>
        </div>

        {/* KPI 2: Total Impresi */}
        <div className="p-5 rounded-2xl bg-[var(--studio-bg)] border border-white/10 hover:border-white/20 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#999898]">
              Total Impresi
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#4d8bff]/10 text-[#4d8bff] border border-[#4d8bff]/20">
              Pencarian
            </span>
          </div>
          <div className="text-3xl font-bold text-white font-mono tracking-tight">
            {(overview?.totalImpressions ?? 0).toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-[#999898] leading-tight">Total kemunculan halaman web di SERP</p>
        </div>

        {/* KPI 3: Rata-Rata CTR */}
        <div className="p-5 rounded-2xl bg-[var(--studio-bg)] border border-white/10 hover:border-white/20 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#999898]">
              Rata-rata CTR
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                (overview?.averageCtr ?? 0) >= 3
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/5 text-[#DBD7D5] border border-white/10'
              }`}
            >
              {(overview?.averageCtr ?? 0) >= 3 ? 'Di Atas Rata-rata' : 'Stabil'}
            </span>
          </div>
          <div className="text-3xl font-bold text-[#4d8bff] font-mono tracking-tight">
            {overview?.averageCtr ?? 0}%
          </div>
          <p className="text-xs text-[#999898] leading-tight">Click-through rate (rasio klik tayang)</p>
        </div>

        {/* KPI 4: Posisi Rata-Rata */}
        <div className="p-5 rounded-2xl bg-[var(--studio-bg)] border border-white/10 hover:border-white/20 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#999898]">
              Posisi Rata-rata
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                (overview?.averagePosition ?? 0) <= 10
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : (overview?.averagePosition ?? 0) <= 20
                  ? 'bg-[#4d8bff]/10 text-[#4d8bff] border border-[#4d8bff]/20'
                  : 'bg-white/5 text-[#DBD7D5] border border-white/10'
              }`}
            >
              {(overview?.averagePosition ?? 0) <= 10
                ? 'Halaman 1'
                : (overview?.averagePosition ?? 0) <= 20
                ? 'Halaman 2 (Striking)'
                : `Halaman ${Math.ceil((overview?.averagePosition ?? 0) / 10)}`}
            </span>
          </div>
          <div className="text-3xl font-bold text-[#6fb0ff] font-mono tracking-tight">
            #{overview?.averagePosition ?? 0}
          </div>
          <p className="text-xs text-[#999898] leading-tight">Peringkat rata-rata kata kunci di Google</p>
        </div>
      </div>

      {/* ─── Dimension Selector Bar & Table ─────────────────────────── */}
      <div className="bg-[var(--studio-bg)] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {/* Navigation Tabs (Kueri, Halaman, Harian, Perangkat, Negara) */}
        <div className="p-4 border-b border-white/10 bg-surface-3/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              aria-pressed={activeTab === 'queries'}
              onClick={() => { setActiveTab('queries'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'queries'
                  ? 'bg-[#4d8bff] text-[#191919] shadow-sm'
                  : 'text-[#999898] hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Kueri ({queries.length})</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'pages'}
              onClick={() => { setActiveTab('pages'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'pages'
                  ? 'bg-[#4d8bff] text-[#191919] shadow-sm'
                  : 'text-[#999898] hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Halaman ({pages.length})</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'dates'}
              onClick={() => { setActiveTab('dates'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dates'
                  ? 'bg-[#4d8bff] text-[#191919] shadow-sm'
                  : 'text-[#999898] hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian ({timeSeries.length} Hari)</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'devices'}
              onClick={() => { setActiveTab('devices'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'devices'
                  ? 'bg-[#4d8bff] text-[#191919] shadow-sm'
                  : 'text-[#999898] hover:text-white hover:bg-white/5'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Perangkat ({devices.length})</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'countries'}
              onClick={() => { setActiveTab('countries'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'countries'
                  ? 'bg-[#4d8bff] text-[#191919] shadow-sm'
                  : 'text-[#999898] hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Negara ({countries.length})</span>
            </button>
          </div>

          {/* Search Field (Hidden on devices & countries) */}
          {['queries', 'pages', 'dates'].includes(activeTab) && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#999898] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label={
                  activeTab === 'queries' ? 'Cari kueri' : activeTab === 'pages' ? 'Cari URL halaman' : 'Cari tanggal'
                }
                placeholder={
                  activeTab === 'queries'
                    ? 'Cari kueri...'
                    : activeTab === 'pages'
                    ? 'Cari URL...'
                    : 'Cari tanggal (YYYY-MM-DD)...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-[#999898] focus:outline-none focus:border-[#4d8bff] transition-colors w-full sm:w-56"
              />
            </div>
          )}
        </div>

        {/* ─── TAB CONTENT 1: QUERIES ─────────────────────────────────── */}
        {activeTab === 'queries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-[11px] font-mono font-semibold text-[#999898] border-b border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Kueri / Kata Kunci Pencarian</th>
                  <th className="py-3 px-4 text-right">Klik</th>
                  <th className="py-3 px-4 text-right">Impresi</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-5 text-right">Posisi Google</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#DBD7D5]">
                {filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#999898]">
                      {searchTerm
                        ? `Tidak ada kueri yang cocok dengan "${searchTerm}".`
                        : 'Belum ada data kueri dari Google Search Console.'}
                    </td>
                  </tr>
                ) : (
                  filteredQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3.5 px-5 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#999898] font-mono w-6">#{idx + 1}</span>
                          <span className="font-semibold text-white group-hover:text-[#4d8bff] transition-colors">
                            {q.query}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(q.query)}
                            title="Salin kata kunci"
                            aria-label={copiedText === q.query ? 'Kata kunci disalin' : `Salin kata kunci ${q.query}`}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-[#999898] hover:text-white"
                          >
                            {copiedText === q.query ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                        {q.clicks.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#DBD7D5]">
                        {q.impressions.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#4d8bff] font-medium">
                        {q.ctr}%
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                            q.position <= 3
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : q.position <= 10
                              ? 'bg-[#4d8bff]/15 text-[#4d8bff] border border-[#4d8bff]/30'
                              : q.position <= 20
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-white/5 text-[#999898] border border-white/10'
                          }`}
                        >
                          posisi #{q.position}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB CONTENT 2: PAGES ───────────────────────────────────── */}
        {activeTab === 'pages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-[11px] font-mono font-semibold text-[#999898] border-b border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Halaman / URL Halaman</th>
                  <th className="py-3 px-4 text-right">Klik</th>
                  <th className="py-3 px-4 text-right">Impresi</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-5 text-right">Posisi Google</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#DBD7D5]">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#999898]">
                      {searchTerm
                        ? `Tidak ada halaman yang cocok dengan "${searchTerm}".`
                        : 'Belum ada data halaman dari Google Search Console.'}
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3.5 px-5 font-medium text-white max-w-md">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#999898] font-mono w-6">#{idx + 1}</span>
                          <span className="font-mono text-xs text-[#DBD7D5] group-hover:text-[#4d8bff] transition-colors truncate">
                            {cleanPageUrl(p.page)}
                          </span>
                          <a
                            href={p.page}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka halaman"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-[#999898] hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                        {p.clicks.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#DBD7D5]">
                        {p.impressions.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#4d8bff] font-medium">
                        {p.ctr}%
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                            p.position <= 3
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : p.position <= 10
                              ? 'bg-[#4d8bff]/15 text-[#4d8bff] border border-[#4d8bff]/30'
                              : p.position <= 20
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-white/5 text-[#999898] border border-white/10'
                          }`}
                        >
                          posisi #{p.position}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB CONTENT 3: DATES (TIME SERIES) ─────────────────────── */}
        {activeTab === 'dates' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-[11px] font-mono font-semibold text-[#999898] border-b border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Tanggal</th>
                  <th className="py-3 px-4 text-right">Klik</th>
                  <th className="py-3 px-4 text-right">Impresi</th>
                  <th className="py-3 px-4">Distribusi Impresi</th>
                  <th className="py-3 px-5 text-right">Posisi Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#DBD7D5]">
                {filteredDates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#999898]">
                      Belum ada data tanggal dari Google Search Console.
                    </td>
                  </tr>
                ) : (
                  filteredDates.map((t, idx) => {
                    const maxImp = Math.max(...timeSeries.map((i) => i.impressions || 1), 1)
                    const percent = Math.min(100, Math.round((t.impressions / maxImp) * 100))
                    return (
                      <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#4d8bff]" />
                            <span>{formatDateId(t.date)}</span>
                            <span className="text-[10px] text-[#999898]">({t.date})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                          {t.clicks.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#DBD7D5]">
                          {t.impressions.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden max-w-[200px]">
                            <div
                              className="bg-[#4d8bff] h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-xs text-[#6fb0ff]">
                          #{t.position}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB CONTENT 4: DEVICES ─────────────────────────────────── */}
        {activeTab === 'devices' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {devices.map((dev, idx) => {
                const totalClicksAll = overview?.totalClicks || 1
                const totalImpAll = overview?.totalImpressions || 1
                const clickShare = Math.round((dev.clicks / totalClicksAll) * 100)
                const impShare = Math.round((dev.impressions / totalImpAll) * 100)

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-surface-3/60 border border-white/10 space-y-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white uppercase text-sm tracking-wider font-mono">
                        {renderDeviceIcon(dev.device)}
                        <span>{dev.device}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#4d8bff]/10 text-[#4d8bff]">
                        Posisi #{dev.position}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#999898] block">Klik</span>
                        <span className="text-xl font-bold font-mono text-white">
                          {dev.clicks.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-[#999898] block font-mono">({clickShare}% dari total)</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#999898] block">Impresi</span>
                        <span className="text-xl font-bold font-mono text-[#DBD7D5]">
                          {dev.impressions.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-[#999898] block font-mono">({impShare}% share)</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-[#999898] mb-1 font-mono">
                        <span>CTR Perangkat</span>
                        <span className="text-[#4d8bff] font-semibold">{dev.ctr}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#4d8bff] h-2 rounded-full"
                          style={{ width: `${Math.min(100, dev.ctr * 20)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT 5: COUNTRIES ───────────────────────────────── */}
        {activeTab === 'countries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-[11px] font-mono font-semibold text-[#999898] border-b border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Negara</th>
                  <th className="py-3 px-4 text-right">Klik</th>
                  <th className="py-3 px-4 text-right">Impresi</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-5 text-right">Posisi Google</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#DBD7D5]">
                {countries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#999898]">
                      Belum ada data negara dari Google Search Console.
                    </td>
                  </tr>
                ) : (
                  countries.map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-white">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-[#4d8bff]" />
                          <span className="font-bold uppercase">{c.country}</span>
                          {c.country.toLowerCase() === 'idn' && (
                            <span className="text-xs text-neutral-400 font-sans">(Indonesia)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                        {c.clicks.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#DBD7D5]">
                        {c.impressions.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#4d8bff] font-medium">
                        {c.ctr}%
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-xs text-[#6fb0ff]">
                        #{c.position}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Table Footer ───────────────────────────────────────────── */}
        <div className="p-4 border-t border-white/10 bg-surface-3/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#999898]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Sumber: Google Search Console Search Analytics API resmi</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Dimensi: {activeTab.toUpperCase()}</span>
            <span>·</span>
            <span>Jendela Waktu: 28 Hari</span>
          </div>
        </div>
      </div>
    </div>
  )
}
