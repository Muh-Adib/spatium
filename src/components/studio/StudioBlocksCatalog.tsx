'use client'

import React, { useState, useEffect } from 'react'
import {
  Boxes,
  Sparkles,
  Layers,
  Code2,
  Copy,
  Check,
  Eye,
  Sliders,
  Play,
  Maximize2,
  Info,
  Palette,
  Workflow,
  Search,
} from 'lucide-react'

export interface BlockManifestItem {
  type: string
  name: string
  category: string
  description: string
  dataSchema: Record<string, { type: string; required?: boolean; description?: string }>
  settingsSchema?: Record<string, any[]>
  samplePayload: {
    type: string
    data: Record<string, any>
    settings?: Record<string, any>
  }
}

export function StudioBlocksCatalog() {
  const [blocks, setBlocks] = useState<BlockManifestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeBlock, setActiveBlock] = useState<BlockManifestItem | null>(null)
  const [activeTab, setActiveTab] = useState<'schema' | 'settings' | 'json' | 'preview'>('schema')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch('/api/blocks/manifest')
        const json = await res.json()
        if (json && Array.isArray(json.blocks)) {
          setBlocks(json.blocks)
          if (json.blocks.length > 0) {
            setActiveBlock(json.blocks[0])
          }
        }
      } catch (err) {
        console.error('Failed to load blocks manifest:', err)
      } finally {
        setLoading(false)
      }
    }
    loadManifest()
  }, [])

  const categories = ['all', ...Array.from(new Set(blocks.map((b) => b.category)))]

  const filteredBlocks = blocks.filter((b) => {
    const matchCat = selectedCategory === 'all' || b.category === selectedCategory
    const matchSearch =
      search === '' ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleCopyJson = () => {
    if (!activeBlock) return
    navigator.clipboard.writeText(JSON.stringify(activeBlock.samplePayload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-[#161616]">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" />
          <span className="font-mono text-xs">Memuat Manifest Blok Frontend…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#181818] via-[#141414] to-[#111111] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 ring-1 ring-accent-500/30">
                <Boxes className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Katalog Dynamic Blocks &amp; Manifest</h2>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-300">
                {blocks.length} Blok Terdaftar
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Komponen visual didefinisikan secara independen di frontend, namun struktur data, schema parameter, opsi ukuran, dan preset animasinya dikenali oleh Core Backend sehingga AI Agent dapat menyusun halaman frontend secara terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/blocks/manifest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Code2 className="h-3.5 w-3.5 text-accent-400" />
              <span>Buka Raw JSON API</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Explorer & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Block List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Category Filter */}
          <div className="rounded-2xl border border-white/10 bg-[#161616] p-3 space-y-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari blok atau tipe..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 scrollbar-none">
            {filteredBlocks.map((block) => {
              const isSelected = activeBlock?.type === block.type
              return (
                <button
                  key={block.type}
                  onClick={() => setActiveBlock(block)}
                  className={`w-full text-left rounded-2xl p-4 transition-all border ${
                    isSelected
                      ? 'border-accent-400/50 bg-white/[0.08] shadow-lg ring-1 ring-accent-400/20'
                      : 'border-white/5 bg-[#161616] hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] font-semibold text-accent-400 uppercase tracking-wider px-2 py-0.5 rounded bg-accent-500/10 border border-accent-500/20">
                      {block.category}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-500">{block.type}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{block.name}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{block.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Inspector Details (7 cols) */}
        <div className="lg:col-span-7">
          {activeBlock ? (
            <div className="rounded-2xl border border-white/10 bg-[#161616] p-6 space-y-6 shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-accent-400 px-2 py-0.5 rounded bg-accent-500/10 border border-accent-500/20">
                      {activeBlock.category.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-neutral-400">{activeBlock.type}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{activeBlock.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{activeBlock.description}</p>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-accent-400" />}
                  <span>{copied ? 'Tersalin' : 'Salin Payload AI'}</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeTab === 'schema'
                      ? 'border-accent-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Data Schema ({Object.keys(activeBlock.dataSchema || {}).length} Variabel)
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeTab === 'settings'
                      ? 'border-accent-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Animasi &amp; Tampilan
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`pb-2.5 transition-colors border-b-2 ${
                    activeTab === 'json'
                      ? 'border-accent-400 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Agent JSON Payload
                </button>
              </div>

              {/* Tab 1: Data Schema */}
              {activeTab === 'schema' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-neutral-400 font-mono text-[10px] uppercase border-b border-white/10">
                        <tr>
                          <th className="p-3">Variabel / Field</th>
                          <th className="p-3">Tipe Data</th>
                          <th className="p-3">Wajib</th>
                          <th className="p-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Object.entries(activeBlock.dataSchema || {}).map(([key, def]) => (
                          <tr key={key} className="hover:bg-white/[0.02]">
                            <td className="p-3 font-mono font-bold text-accent-300">{key}</td>
                            <td className="p-3 font-mono text-neutral-400">{def.type}</td>
                            <td className="p-3">
                              {def.required ? (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                  REQUIRED
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-500">OPSIONAL</span>
                              )}
                            </td>
                            <td className="p-3 text-neutral-300 text-[11px]">{def.description || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Settings & Animation */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  {activeBlock.settingsSchema ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(activeBlock.settingsSchema).map(([settingKey, options]) => (
                        <div key={settingKey} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Sliders className="h-3.5 w-3.5 text-accent-400" />
                            <h4 className="font-mono text-xs font-bold text-white capitalize">{settingKey}</h4>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(options) ? (
                              options.map((opt) => (
                                <span
                                  key={String(opt)}
                                  className="rounded px-2 py-0.5 font-mono text-[10px] bg-black/40 text-neutral-300 border border-white/10"
                                >
                                  {String(opt)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400">{String(options)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">Tidak ada pengaturan khusus untuk blok ini.</p>
                  )}
                </div>
              )}

              {/* Tab 3: JSON Payload */}
              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="relative rounded-xl border border-white/10 bg-[#0d0d0d] p-4 font-mono text-xs text-neutral-300 overflow-x-auto">
                    <pre>{JSON.stringify(activeBlock.samplePayload, null, 2)}</pre>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Format payload ini digunakan oleh AI Agent (Copilot) saat memanggil tool mutasi pembuatan halaman backend (<code className="text-accent-400">POST /api/v1/pages</code>).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-[#161616] text-neutral-500 text-xs">
              Pilih salah satu blok dari daftar untuk melihat spesifikasi detail.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
