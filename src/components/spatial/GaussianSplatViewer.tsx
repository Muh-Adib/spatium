'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
  Eye,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Box,
  Glasses,
} from 'lucide-react'

export interface GaussianSplatViewerProps {
  liveUrl?: string
  splatId?: string
  title: string
  client?: string
  category?: string
  pointCount?: string
  accuracy?: string
  captureMethod?: string
  scenePairSlug?: string
  scenePairLabel?: string
  heightClass?: string
  autoLoad?: boolean
}

export function GaussianSplatViewer({
  liveUrl,
  splatId,
  title,
  client,
  category,
  pointCount = '12.4M Splats',
  accuracy = 'Sub-centimeter (5mm)',
  captureMethod = 'Terrestrial LiDAR + High-Density Photogrammetry',
  scenePairSlug,
  scenePairLabel,
  heightClass = 'h-[520px] md:h-[640px]',
  autoLoad = true,
}: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activePreset, setActivePreset] = useState<'orbit' | 'fly' | 'top'>('orbit')

  // Resolve source URL
  let embedUrl = liveUrl || ''
  if (!embedUrl && splatId) {
    embedUrl = `https://superspl.at/s?id=${splatId}`
  }

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-2xl md:rounded-3xl overflow-hidden bg-[#0A1628] border border-white/10 shadow-2xl transition-all duration-300 group`}
    >
      {/* 3D Gaussian Splat WebGL Iframe */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; gyroscope; magnetometer; xr-spatial-tracking; fullscreen"
          loading={autoLoad ? 'eager' : 'lazy'}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-[#060D1A]"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-[#0F1E38]/40 via-[#080E1E] to-[#040711]">
          <Box className="w-12 h-12 text-cyan-400 animate-pulse mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Simulasi 3D Gaussian Splatting</h3>
          <p className="text-sm text-neutral-400 max-w-md mb-6">
            Pilih scene atau muat URL tur spasial untuk memulai penjelajahan interaktif skala 1:1.
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && embedUrl && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#040711]/85 backdrop-blur-md transition-opacity duration-500">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <p className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-semibold mb-1">
            Loading Neural Radiance Field
          </p>
          <p className="text-[11px] text-neutral-400 font-mono">
            Memuat {pointCount} · WebGL 60 FPS
          </p>
        </div>
      )}

      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Project & Tech Spec Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#040711]/85 backdrop-blur-md border border-white/15 text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-400 font-semibold">
              3DGS REALTIME
            </span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-[11px] text-neutral-300 font-mono hidden sm:inline">
              {pointCount}
            </span>
            <span className="text-white/30 text-xs hidden sm:inline">|</span>
            <span className="text-[11px] text-neutral-300 font-mono hidden md:inline">
              {accuracy}
            </span>
          </div>

          {category && (
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono tracking-wider uppercase hidden lg:inline">
              {category}
            </span>
          )}
        </div>

        {/* Right: Controls & Scene-Pair Link */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Scene Pair Quick Switcher (e.g. Exterior <-> Interior) */}
          {scenePairSlug && (
            <Link
              href={`/portfolio/${scenePairSlug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#040711] font-bold text-xs tracking-wide hover:bg-cyan-100 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all shadow-lg hover:scale-105"
            >
              <span>{scenePairLabel || 'Beralih Sudut Scene'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* WebXR / Vision Pro Ready Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-[11px] font-mono">
            <Glasses className="w-3.5 h-3.5 text-cyan-400" />
            <span>WebXR Ready</span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-full bg-[#040711]/85 backdrop-blur-md border border-white/15 text-neutral-200 hover:text-white hover:bg-white/15 transition-all shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Navigation Hint Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Navigation Instructions */}
        <div className="px-3.5 py-1.5 rounded-xl bg-[#040711]/85 backdrop-blur-md border border-white/15 text-neutral-300 text-[11px] font-mono flex items-center gap-2 shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            <strong className="text-white">Navigasi Spasial:</strong> Drag untuk rotasi 360°, Scroll untuk maju-mundur skala 1:1.
          </span>
        </div>

        {/* View Details / External Link */}
        {embedUrl && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-[11px] font-mono transition-all"
            >
              <ExternalLink className="w-3 h-3 text-cyan-400" />
              <span>Buka Standalone</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
