'use client'

import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import {
  TrendingUp,
  Search,
  Sparkles,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Target,
  Layers,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Tag,
  FolderPlus,
} from 'lucide-react'

interface KeywordOpportunity {
  query: string
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  opportunityType: 'striking_distance' | 'low_ctr' | 'high_impression_rising'
  score: number
  recommendation: string
}

interface CannibalizationIssue {
  query: string
  pages: Array<{ page: string; clicks: number; impressions: number; position: number }>
  totalImpressions: number
  recommendation: string
}

interface KeywordBankItem {
  id: number
  keyword: string
  locale: 'id' | 'en'
  intent: string
  status: string
  tags: string[]
  gscImpressions: number
  gscClicks: number
  gscPosition: number
  priorityScore: number
}

export function StudioKeywordPlanner() {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'bank' | 'cannibalization'>('opportunities')
  const [locale, setLocale] = useState<'id' | 'en'>('id')
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([])
  const [cannibalization, setCannibalization] = useState<CannibalizationIssue[]>([])
  const [bankItems, setBankItems] = useState<KeywordBankItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newKeywordInput, setNewKeywordInput] = useState<string>('')
  const [copiedKw, setCopiedKw] = useState<string | null>(null)

  const requestSequence = useRef(0)
  const [error, setError] = useState('')
  const [integration, setIntegration] = useState<{ connected: boolean; reason?: string; howToConnect?: string; siteUrl?: string; startDate?: string; endDate?: string; syncedAt?: string; truncated?: boolean } | null>(null)
  const fetchData = async (forceRefresh = false) => {
    const sequence = ++requestSequence.current
    setLoading(true)
    setError('')
    try {
      const action = activeTab === 'bank' ? '' : `action=${activeTab}&`
      const bust = forceRefresh ? `&_t=${Date.now()}` : ''
      const response = await fetch(`/api/keywords?${action}locale=${locale}${bust}`, {
        cache: forceRefresh ? 'no-store' : 'default',
      })
      const json = await response.json()
      if (sequence !== requestSequence.current) return
      if (!response.ok) throw new Error(json.error || json.errors?.[0] || 'Data keyword tidak dapat dimuat.')
      setIntegration(activeTab === 'bank' ? null : json.integration || null)
      if (activeTab === 'opportunities') setOpportunities(json.data || [])
      if (activeTab === 'cannibalization') setCannibalization(json.data || [])
      if (activeTab === 'bank') setBankItems(json.data || [])
    } catch (cause) {
      if (sequence === requestSequence.current) setError(cause instanceof Error ? cause.message : 'Data keyword tidak dapat dimuat.')
    } finally { if (sequence === requestSequence.current) setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, locale])

  const handleAddToBank = async (kw: string) => {
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          keyword: kw,
          locale,
          intent: 'informational',
          status: 'planned',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || result.errors?.[0] || 'Keyword gagal disimpan.')
      setNewKeywordInput('')
      setError('')
      setCopiedKw(kw)
      setTimeout(() => setCopiedKw(null), 2000)
      if (activeTab === 'bank') fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Keyword gagal disimpan.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Tabs & Locale Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'opportunities'
                ? 'bg-info/20 text-info-300 border border-info/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Peluang Ranking (Pos 8-20)
          </button>
          <button
            onClick={() => setActiveTab('cannibalization')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'cannibalization'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Deteksi Kanibalisasi
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'bank'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Keyword Bank
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'bank' && (<div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-lg text-xs">
            <button
              onClick={() => setLocale('id')}
              className={`px-2.5 py-1 rounded-md font-mono ${
                locale === 'id' ? 'bg-accent-500 text-accent-950 font-semibold' : 'text-neutral-400'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-2.5 py-1 rounded-md font-mono ${
                locale === 'en' ? 'bg-accent-500 text-accent-950 font-semibold' : 'text-neutral-400'
              }`}
            >
              EN
            </button>
          </div>)}

          <button
            onClick={() => fetchData(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">{error}</p>}
      {activeTab === 'bank' ? (
        <p className="text-sm text-neutral-400">Daftar keyword yang disimpan editor. Ini bukan data volume pencarian atau hasil pengukuran peringkat.</p>
      ) : !loading && integration?.connected ? (
        <div className="space-y-1 rounded-lg border border-white/10 p-4 text-sm text-neutral-300">
          <p>Sumber: Google Search Console · {integration.siteUrl}</p>
          <p>Periode {integration.startDate} – {integration.endDate} · Sinkronisasi {integration.syncedAt ? new Date(integration.syncedAt).toLocaleString('id-ID') : 'tidak diketahui'}</p>
          <p className="text-xs text-neutral-400">Posisi dibobot berdasarkan impresi; CTR = klik ÷ impresi. Skor merupakan prioritas editorial, bukan prediksi ranking.</p>
          {integration.truncated && <p className="text-amber-300">Respons API mencapai batas; analisis belum mencakup semua kueri.</p>}
        </div>
      ) : null}

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-info animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Memuat analisis kata kunci...</p>
        </div>
      ) : error ? null : activeTab !== 'bank' && !integration?.connected ? (
        <div className="space-y-3 rounded-xl border border-white/10 p-5"><h3 className="font-semibold text-white">Analisis GSC belum tersedia</h3><p className="text-sm text-neutral-300">{integration?.reason || 'Status sumber data belum terverifikasi.'}</p><p className="text-sm text-neutral-400">{integration?.howToConnect}</p><Link href="/admin?tab=gsc" className="inline-block text-sm text-info-300 underline">Buka integrasi Google Search Console</Link></div>
      ) : activeTab === 'opportunities' ? (
        /* Opportunities View (Striking Distance Pos 8-20 & Low CTR) */
        <div className="space-y-4">
          <div className="max-w-full overflow-x-auto bg-neutral-900/70 border border-white/10 rounded-xl">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-black/40 text-neutral-400 font-mono text-[11px] uppercase border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Kueri Penelusuran</th>
                  <th className="py-3 px-4">Halaman Landing</th>
                  <th className="py-3 px-4">Posisi</th>
                  <th className="py-3 px-4">Impresi</th>
                  <th className="py-3 px-4">CTR</th>
                  <th className="py-3 px-4">Skor Peluang</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                      Tidak ada kueri yang memenuhi kriteria peluang dalam dataset dan periode ini.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{opp.query}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{opp.recommendation}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-info">{opp.page}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">{opp.position}</td>
                      <td className="py-3 px-4 font-mono text-neutral-200">{opp.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-neutral-200">{opp.ctr}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-info-400 to-emerald-400 rounded-full"
                              style={{ width: `${opp.score}%` }}
                            />
                          </div>
                          <span className="font-mono text-neutral-400 text-[11px]">{opp.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleAddToBank(opp.query)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-neutral-200 rounded-md text-[11px] font-medium transition-all"
                        >
                          {copiedKw === opp.query ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Disimpan
                            </span>
                          ) : (
                            <span>+ Simpan ke Bank</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'cannibalization' ? (
        /* Real Search Cannibalization View */
        <div className="space-y-4">
          {cannibalization.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-neutral-900/40 text-neutral-400 text-xs">
              Tidak terdeteksi tabrakan kanibalisasi kueri yang signifikan pada dataset saat ini.
            </div>
          ) : (
            cannibalization.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-900/70 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white text-sm">Kueri: &ldquo;{item.query}&rdquo;</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {item.pages.length} Halaman Berebut
                  </span>
                </div>

                <p className="text-xs text-neutral-400">{item.recommendation}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {item.pages.map((p, pIdx) => (
                    <div key={pIdx} className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-xs font-mono flex items-center justify-between">
                      <span className="text-info-300 truncate max-w-[200px]">{p.page}</span>
                      <span className="text-neutral-400 text-[11px]">
                        Pos {p.position} · {p.clicks} klik
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Keyword Bank View */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              aria-label="Keyword baru"
              placeholder="Tambahkan kata kunci target baru..."
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-neutral-900/80 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-accent-500"
            />
            <button
              onClick={() => {
                if (newKeywordInput.trim()) {
                  handleAddToBank(newKeywordInput.trim())
                }
              }}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-300 text-accent-950 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kata Kunci</span>
            </button>
          </div>

          <div className="max-w-full overflow-x-auto bg-neutral-900/70 border border-white/10 rounded-xl">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-black/40 text-neutral-400 font-mono text-[11px] uppercase border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Kata Kunci Target</th>
                  <th className="py-3 px-4">Search Intent</th>
                  <th className="py-3 px-4">Status Konten</th>
                  <th className="py-3 px-4">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bankItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-neutral-400">
                      Belum ada kata kunci target di Keyword Bank. Tambahkan kata kunci baru melalui input di atas.
                    </td>
                  </tr>
                ) : (
                  bankItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{item.keyword}</td>
                      <td className="py-3 px-4 font-mono text-neutral-400">{item.intent}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-info/10 text-info border border-info/20">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300">{item.priorityScore}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
