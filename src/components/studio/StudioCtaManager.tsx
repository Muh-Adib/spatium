'use client'

import React, { useState, useEffect } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  X,
} from 'lucide-react'

interface CtaPreset {
  id: number
  name: string
  slug: string
  locale: 'id' | 'en'
  content: {
    title: string
    description: string
    primary: { label: string; href: string; rel: string; target?: string }
    secondary?: { label?: string; href?: string; rel?: string; target?: string }
  }
  style: {
    variant: 'banner' | 'card' | 'inline' | 'sticky' | 'split'
    bg: string
    text: string
    button: string
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    align: 'left' | 'center' | 'right'
  }
  placement?: {
    mode: 'after-paragraph' | 'end-of-article' | 'sidebar'
    index?: number
  }
  active: boolean
}

export function StudioCtaManager() {
  const [presets, setPresets] = useState<CtaPreset[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [locale, setLocale] = useState<'id' | 'en'>('id')
  const [editingPreset, setEditingPreset] = useState<CtaPreset | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  // Form State
  const [name, setName] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [primaryLabel, setPrimaryLabel] = useState<string>('')
  const [primaryHref, setPrimaryHref] = useState<string>('')
  const [variant, setVariant] = useState<'banner' | 'card' | 'inline' | 'sticky' | 'split'>('banner')
  const [placementMode, setPlacementMode] = useState<'after-paragraph' | 'end-of-article' | 'sidebar'>('after-paragraph')
  const [paragraphIndex, setParagraphIndex] = useState<number>(3)

  const fetchPresets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cta?locale=${locale}`)
      const json = await res.json()
      if (json.data) setPresets(json.data)
    } catch (err) {
      console.error('Failed to load CTA presets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [locale])

  const openCreateModal = () => {
    setEditingPreset(null)
    setName('')
    setSlug('')
    setTitle('Konsultasikan Transformasi Digital Bisnis Anda')
    setDescription('Diskusikan kebutuhan arsitektur Next.js enterprise dan sistem kustom bersama lead software engineer UNIMASI.')
    setPrimaryLabel('Jadwalkan Konsultasi')
    setPrimaryHref('/kontak')
    setVariant('banner')
    setPlacementMode('after-paragraph')
    setParagraphIndex(3)
    setIsModalOpen(true)
  }

  const openEditModal = (p: CtaPreset) => {
    setEditingPreset(p)
    setName(p.name)
    setSlug(p.slug)
    setTitle(p.content.title)
    setDescription(p.content.description)
    setPrimaryLabel(p.content.primary.label)
    setPrimaryHref(p.content.primary.href)
    setVariant(p.style.variant)
    setPlacementMode(p.placement?.mode || 'after-paragraph')
    setParagraphIndex(p.placement?.index || 3)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!name || !slug || !title || !primaryLabel || !primaryHref) return
    setSaving(true)
    try {
      const payload = {
        id: editingPreset?.id,
        name,
        slug,
        locale,
        content: {
          title,
          description,
          primary: { label: primaryLabel, href: primaryHref, rel: 'noopener', target: '_self' },
        },
        style: {
          variant,
          bg: 'token:brand-600',
          text: '#ffffff',
          button: 'token:brand-accent',
          radius: 'lg',
          align: 'center',
        },
        placement: {
          mode: placementMode,
          index: paragraphIndex,
        },
        active: true,
      }

      await fetch('/api/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setIsModalOpen(false)
      fetchPresets()
    } catch (err) {
      console.error('Failed to save CTA preset:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-medium text-neutral-300">
            Preset Blok CTA ({presets.length})
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
            <button
              onClick={() => setLocale('id')}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs ${
                locale === 'id' ? 'bg-sky-500 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs ${
                locale === 'en' ? 'bg-sky-500 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <Tooltip label="Buat Preset CTA" hint="Tambahkan blok call-to-action baru yang dapat disisipkan di konten">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Preset</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Memuat preset CTA...</p>
        </div>
      ) : presets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/30">
          <Boxes className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-300 font-medium">Belum ada Preset CTA untuk [{locale.toUpperCase()}]</p>
          <p className="text-xs text-neutral-500 mt-1">Buat preset banner konsultasi atau formulir penawaran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 space-y-4 hover:border-sky-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{preset.name}</h3>
                  <span className="text-[11px] font-mono text-neutral-500">slug: {preset.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {preset.style.variant}
                  </span>
                  <button
                    onClick={() => openEditModal(preset)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Card Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 space-y-2">
                <h4 className="text-xs font-semibold text-white">{preset.content.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{preset.content.description}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500 text-white rounded-md text-[11px] font-semibold">
                    <span>{preset.content.primary.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-white/5">
                <span>Posisi: {preset.placement?.mode || 'after-paragraph'} ({preset.placement?.index || 3})</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingPreset ? 'Edit Preset CTA' : 'Buat Preset CTA Baru'} [{locale.toUpperCase()}]
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Nama Preset</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CTA Konsultasi Enterprise"
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Slug Preset</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cta-konsultasi-enterprise"
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-mono">Judul CTA</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-mono">Deskripsi / Subteks</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Label Tombol Utama</label>
                  <input
                    type="text"
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Tautan Tombol</label>
                  <input
                    type="text"
                    value={primaryHref}
                    onChange={(e) => setPrimaryHref(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Varian Tampilan</label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200"
                  >
                    <option value="banner">Banner Penuh</option>
                    <option value="card">Kartu Terkurasi</option>
                    <option value="inline">Inline Teks</option>
                    <option value="sticky">Sticky Bar</option>
                    <option value="split">Split Kolom</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 font-mono">Posisi Otomatis</label>
                  <select
                    value={placementMode}
                    onChange={(e) => setPlacementMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-neutral-200"
                  >
                    <option value="after-paragraph">Setelah Paragraf ke-N</option>
                    <option value="end-of-article">Akhir Artikel</option>
                    <option value="sidebar">Sidebar Konten</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-neutral-400 hover:text-white text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-all shadow-md disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
