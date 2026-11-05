'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  RefreshCw,
  Globe,
  Database,
  ArrowRight,
  CheckCircle2,
  Filter,
  ExternalLink,
  ChevronDown,
  Layers,
} from 'lucide-react'

interface SiteAuditIssue {
  id: number
  auditId: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  urlOrPath?: string | null
  contentType?: string | null
  contentId?: number | null
  title: string
  description: string
  recommendation: string
  resolved: boolean
}

interface SiteAuditSummary {
  auditId: string
  type: 'internal_db' | 'live_crawl'
  status: 'running' | 'completed' | 'failed'
  totalIssues: number
  criticalCount: number
  warningCount: number
  infoCount: number
  seoHealthScore: number
  startedAt: string
  finishedAt?: string
  diff?: {
    newIssues: number
    resolvedIssues: number
  }
}

export function StudioSiteAudit() {
  const [summary, setSummary] = useState<SiteAuditSummary | null>(null)
  const [issues, setIssues] = useState<SiteAuditIssue[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [runningType, setRunningType] = useState<'internal_db' | 'live_crawl' | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')

  const fetchAudit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit')
      const json = await res.json()
      if (json.data) {
        setSummary(json.data.summary)
        setIssues(json.data.issues || [])
      }
    } catch (err) {
      console.error('Failed to load audit report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudit()
  }, [])

  const runAudit = async (type: 'internal_db' | 'live_crawl') => {
    setRunningType(type)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const json = await res.json()
      if (json.data) {
        setSummary(json.data.summary)
        setIssues(json.data.issues || [])
      }
    } catch (err) {
      console.error('Audit run failed:', err)
    } finally {
      setRunningType(null)
    }
  }

  const filteredIssues = issues.filter((iss) => {
    if (selectedCategory !== 'all' && iss.category !== selectedCategory) return false
    if (selectedSeverity !== 'all' && iss.severity !== selectedSeverity) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-info" />
            <span>Audit Situs &amp; Integritas SEO Teknis (Section 15.3)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dua lapis perlindungan: audit database pra-terbit (cepat) dan live crawler pasca-deploy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => runAudit('internal_db')}
            disabled={runningType !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          >
            {runningType === 'internal_db' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-info" />
            ) : (
              <Database className="w-4 h-4 text-info" />
            )}
            <span>Audit Data DB (Cepat)</span>
          </button>

          <button
            onClick={() => runAudit('live_crawl')}
            disabled={runningType !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-500 hover:bg-accent-300 text-accent-950 rounded-lg text-xs font-semibold transition-all shadow-md disabled:opacity-50"
          >
            {runningType === 'live_crawl' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span>Live Crawler (Live Web)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-info animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Memuat laporan audit situs...</p>
        </div>
      ) : summary ? (
        <>
          {/* Health Score & Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-neutral-400 uppercase">Skor Kesehatan SEO</div>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {summary.seoHealthScore}
                  <span className="text-xs font-normal text-neutral-500 ml-1">/100</span>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                  summary.seoHealthScore >= 90
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : summary.seoHealthScore >= 75
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {summary.seoHealthScore}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-xs font-mono text-rose-300 uppercase">Isu Kritis (Memblokir Terbit)</div>
              <div className="text-3xl font-extrabold text-rose-400 mt-1">{summary.criticalCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs font-mono text-amber-300 uppercase">Peringatan (Optimasi)</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">{summary.warningCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5">
              <div className="text-xs font-mono text-neutral-400 uppercase">Tipe &amp; Waktu Audit</div>
              <div className="text-sm font-semibold text-info mt-1">
                {summary.type === 'internal_db' ? 'Lapis 1: Database Internal' : 'Lapis 2: Live Crawler'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {new Date(summary.startedAt).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/60 border border-white/5 p-3 rounded-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['all', 'meta', 'images', 'links', 'headings', 'redirects', 'performance'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-mono uppercase transition-all ${
                    selectedCategory === cat
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-300 px-3 py-1 focus:outline-none focus:border-accent-500"
              >
                <option value="all">Semua Tingkat Keparahan</option>
                <option value="critical">Kritis Saja</option>
                <option value="warning">Peringatan Saja</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          <div className="bg-neutral-900/70 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
            {filteredIssues.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 text-xs">
                Tidak ada isu ditemukan untuk filter yang dipilih.
              </div>
            ) : (
              filteredIssues.map((iss) => (
                <div key={iss.id} className="p-4 hover:bg-white/5 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {iss.severity === 'critical' ? (
                        <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{iss.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-neutral-400 border border-white/10">
                            {iss.category}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1">{iss.description}</p>
                      </div>
                    </div>

                    {iss.urlOrPath && (
                      <a
                        href={iss.urlOrPath.startsWith('/') ? `${siteConfig.url}${iss.urlOrPath}` : iss.urlOrPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-info-300 rounded text-xs font-mono flex items-center gap-1 shrink-0"
                      >
                        <span>{iss.urlOrPath}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="pl-10 text-xs text-emerald-400/90 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                    <strong>Rekomendasi Perbaikan:</strong> {iss.recommendation}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
