'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Globe,
  PenSquare,
} from 'lucide-react'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThematicWave } from '@/components/ui/ThematicWave'
import { siteConfig } from '@/config/site'

export interface StudioLivePreviewProps {
  blocks: any[]
  contextData?: {
    portfolios?: any[]
    subServices?: any[]
    services?: any[]
  }
  title?: string
  slug?: string
  targetType?: 'department' | 'service' | 'portfolio' | 'solution'
  onClose?: () => void
  onSwitchToCanvas?: () => void
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export default function StudioLivePreview({
  blocks,
  contextData,
  title = 'Pratinjau Halaman',
  slug = '',
  targetType = 'department',
  onClose,
  onSwitchToCanvas,
}: StudioLivePreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const previewBasePath =
    targetType === 'department' || targetType === 'service'
      ? 'layanan'
      : targetType === 'solution'
      ? 'solusi'
      : 'portofolio'

  const previewUrl = `${siteConfig.url}/${previewBasePath}/${slug || 'preview'}`

  const firstBlockType = blocks && blocks.length > 0 ? (blocks[0]?.type || blocks[0]?.__component) : null
  const hasFirstHeroBlock = firstBlockType === 'hero-department' || firstBlockType === 'hero-service' || firstBlockType === 'blocks.hero'

  const targetTypeLabel =
    targetType === 'department'
      ? 'Departemen Layanan'
      : targetType === 'service'
      ? 'Layanan Rekayasa'
      : targetType === 'solution'
      ? 'Solusi Bisnis'
      : 'Studi Kasus Portofolio'

  return (
    <div className="flex flex-col h-full w-full bg-[#0D0D0D] border-l border-white/10 select-none overflow-hidden">
      {/* ── Top Header & Device Switcher Bar ───────────────────────────────── */}
      <div className="h-12 shrink-0 px-4 bg-[#141414] border-b border-white/[0.08] flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE PREVIEW</span>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-[#F2C7A0] hidden sm:inline-block shrink-0">
            {targetType}
          </span>

          <span className="text-xs font-mono text-neutral-400 truncate max-w-[180px] sm:max-w-[280px]">
            {previewUrl}
          </span>
        </div>

        {/* Device Switcher (Desktop 100%, Tablet 768px, Mobile 375px) */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/60 border border-white/10 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            title="Tampilan Desktop Penuh (100% Rasio Web Asli)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              device === 'desktop'
                ? 'bg-white/20 text-white font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-[#F2C7A0]" />
            <span className="hidden md:inline">Desktop (100%)</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            title="Tampilan Tablet (768px)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              device === 'tablet'
                ? 'bg-white/20 text-white font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Tablet (768px)</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            title="Tampilan Smartphone (375px)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              device === 'mobile'
                ? 'bg-white/20 text-white font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Mobile (375px)</span>
          </button>
        </div>

        {/* Utility Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat Ulang Render"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {slug && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka Halaman Publik di Tab Baru"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-300 hover:text-[#F2C7A0] hover:bg-white/10 transition-colors"
            >
              <span className="hidden sm:inline">Tab Baru</span>
              <ExternalLink className="w-3 h-3 text-[#F2C7A0]" />
            </a>
          )}

          {onSwitchToCanvas && (
            <button
              type="button"
              onClick={onSwitchToCanvas}
              title="Kembali ke Mode Edit Kanvas"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PenSquare className="w-3 h-3 text-sky-400" />
              <span>Edit Kanvas</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Tutup Pratinjau"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Viewport Frame Container (100% Web Ratio on Desktop) ─────────────── */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-thin ${
          device === 'desktop'
            ? 'p-0 bg-[#0A0A0A]'
            : 'p-4 sm:p-8 bg-[#070707] flex justify-center items-start'
        }`}
      >
        <div
          key={refreshKey}
          className={`transition-all duration-300 ${
            device === 'desktop'
              ? targetType === 'portfolio'
                ? 'w-full min-h-full bg-gradient-to-b from-[#2B2B2B] via-[#242424] to-[#2B2B2B] text-white flex flex-col relative'
                : 'w-full min-h-full bg-[#0A0A0A] text-white flex flex-col relative'
              : device === 'tablet'
              ? targetType === 'portfolio'
                ? 'w-[768px] max-w-full min-h-[920px] rounded-3xl overflow-hidden border-4 border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.85)] bg-gradient-to-b from-[#2B2B2B] via-[#242424] to-[#2B2B2B] text-white flex flex-col relative my-4'
                : 'w-[768px] max-w-full min-h-[920px] rounded-3xl overflow-hidden border-4 border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.85)] bg-[#0A0A0A] text-white flex flex-col relative my-4'
              : targetType === 'portfolio'
              ? 'w-[375px] max-w-full min-h-[780px] rounded-[44px] overflow-hidden border-[10px] border-[#222] shadow-[0_25px_70px_rgba(0,0,0,0.95)] bg-gradient-to-b from-[#2B2B2B] via-[#242424] to-[#2B2B2B] text-white flex flex-col relative my-4'
              : 'w-[375px] max-w-full min-h-[780px] rounded-[44px] overflow-hidden border-[10px] border-[#222] shadow-[0_25px_70px_rgba(0,0,0,0.95)] bg-[#0A0A0A] text-white flex flex-col relative my-4'
          }`}
        >
          {/* Mobile phone speaker & notch */}
          {device === 'mobile' && (
            <div className="sticky top-0 left-0 right-0 h-6 bg-[#222] flex items-center justify-center z-50 rounded-b-xl mb-1">
              <div className="w-16 h-3 bg-neutral-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-800" />
              </div>
            </div>
          )}

          {/* 1. Real Reading Progress Bar (Exact Public Match) */}
          <div className="sticky top-0 z-50 h-0.5 w-full bg-neutral-900/40 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F2C7A0] via-[#E08E45] to-[#F2C7A0] w-3/4 animate-pulse opacity-90" />
          </div>

          {/* 2. Real Floating Glass Pill Navbar (Exact Public Header Match) */}
          <div className="sticky top-3 sm:top-4 z-40 w-full px-3 sm:px-6 mb-4 flex justify-center pointer-events-auto">
            <div className="relative w-full max-w-[1280px] h-[64px] sm:h-[68px] flex items-center justify-between px-4 sm:px-6 rounded-[24px] bg-[#2B2B2B]/90 border border-[#2B2B2B] shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(242,199,160,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl">
              <div className="flex items-center">
                <BrandLogo siteName="SegiaTech" />
              </div>

              <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-neutral-300">
                <span
                  className={`transition-colors hover:text-[#F2C7A0] cursor-pointer ${
                    targetType === 'department' || targetType === 'service'
                      ? 'text-[#F2C7A0] font-bold underline underline-offset-4 decoration-[#F2C7A0]/50'
                      : ''
                  }`}
                >
                  Layanan
                </span>
                <span
                  className={`transition-colors hover:text-[#F2C7A0] cursor-pointer ${
                    targetType === 'solution'
                      ? 'text-[#F2C7A0] font-bold underline underline-offset-4 decoration-[#F2C7A0]/50'
                      : ''
                  }`}
                >
                  Solusi
                </span>
                <span
                  className={`transition-colors hover:text-[#F2C7A0] cursor-pointer ${
                    targetType === 'portfolio'
                      ? 'text-[#F2C7A0] font-bold underline underline-offset-4 decoration-[#F2C7A0]/50'
                      : ''
                  }`}
                >
                  Portofolio
                </span>
                <span className="transition-colors hover:text-[#F2C7A0] cursor-pointer">
                  Artikel
                </span>
                <span className="transition-colors hover:text-[#F2C7A0] cursor-pointer">
                  Kontak
                </span>
              </nav>

              <div className="flex items-center gap-3">
                <a
                  href="https://wa.me/6283121138821?text=Halo%20SegiaTech,%20saya%20tertarik%20dengan%20layanan%20Anda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2C7A0] text-black font-mono text-[11px] font-bold shadow hover:bg-[#ebd5c1] transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-black" />
                  <span className="hidden sm:inline">Konsultasi WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. Real Hero Section for Portfolio (When first block is not already a Hero) */}
          {targetType === 'portfolio' && !hasFirstHeroBlock && (
            <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden text-white border-b border-[#2B2B2B]">
              <ThematicWave opacity={0.65} showBottomWave={true} />
              <div className="container relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
                <nav className="mb-6 text-xs text-[#999898] font-mono flex items-center flex-wrap gap-2" aria-label="Breadcrumb">
                  <span className="hover:text-white cursor-pointer">Home</span>
                  <span className="text-[#2B2B2B]">/</span>
                  <span className="hover:text-white cursor-pointer">Portofolio</span>
                  <span className="text-[#2B2B2B]">/</span>
                  <span className="text-[#F2C7A0] font-medium line-clamp-1 max-w-xs">{title || 'Studi Kasus Digital Inovatif'}</span>
                </nav>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#191919] text-[#F2C7A0] border border-[#2B2B2B] text-xs font-mono font-medium">
                    Studi Kasus Rekayasa
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#191919] text-[#DBD7D5] border border-[#2B2B2B] text-xs font-mono">
                    Tahun {new Date().getFullYear()}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#191919] text-[#DBD7D5] border border-[#2B2B2B] text-xs font-mono">
                    Production Ready
                  </span>
                </div>

                <h1 className="text-display-md sm:text-display-lg font-bold tracking-tight text-white leading-[1.18]">
                  {title || 'Studi Kasus Digital Inovatif'}
                </h1>

                <p className="mt-4 text-sm sm:text-base text-[#DBD7D5] font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F2C7A0] animate-pulse" />
                  <span>Mitra Klien: <strong className="text-white">SegiaTech Enterprise Client</strong></span>
                </p>
              </div>
            </section>
          )}

          {/* 4. Ambient Background Lighting & Dynamic Blocks Rendering */}
          <div className="relative w-full flex-1 overflow-hidden">
            {/* Ambient Lighting Orbs */}
            <div className="pointer-events-none absolute -left-20 top-20 w-[600px] h-[600px] rounded-full bg-[#F2C7A0]/[0.04] blur-[160px]" />
            <div className="pointer-events-none absolute right-0 top-1/3 w-[500px] h-[500px] rounded-full bg-[#C68D5D]/[0.03] blur-[150px]" />

            {/* Dynamic Real-time BlockRenderer */}
            {blocks && blocks.length > 0 ? (
              <div className="relative z-10 w-full text-white">
                <BlockRenderer blocks={blocks} contextData={contextData} />
              </div>
            ) : (
              <div className="py-28 px-6 text-center text-neutral-400 relative z-10">
                <Sparkles className="w-12 h-12 text-[#F2C7A0] mx-auto mb-4 opacity-60 animate-pulse" />
                <h4 className="font-display text-xl font-bold text-white mb-2">
                  Halaman Belum Memiliki Blok Visual
                </h4>
                <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed mb-6">
                  Tambahkan blok dari katalog atau terapkan preset template di mode Kanvas. Setiap perubahan yang Anda lakukan akan langsung dirender secara dinamis di sini.
                </p>
                {onSwitchToCanvas && (
                  <button
                    type="button"
                    onClick={onSwitchToCanvas}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F2C7A0] text-[#191919] font-medium text-xs font-mono uppercase tracking-wider hover:bg-[#ebd5c1] transition-all shadow-[0_0_20px_rgba(242,199,160,0.25)]"
                  >
                    <PenSquare className="w-4 h-4" />
                    <span>Mulai Susun Blok di Kanvas</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 5. Studio Preview Footer Indicator */}
          <footer className="border-t border-[#2B2B2B] bg-[#111111] py-8 text-center text-xs text-neutral-500">
            <p>&copy; {new Date().getFullYear()} SegiaTech Studio Preview Environment &middot; Server-Driven Block Engine</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
