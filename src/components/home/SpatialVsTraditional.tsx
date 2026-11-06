'use client'

import React from 'react'
import { Check, X, Sparkles, Compass, Eye, ShieldCheck, Box, Zap } from 'lucide-react'

export function SpatialVsTraditional() {
  const comparisonItems = [
    {
      feature: 'Kebebasan Sudut Pandang (Point of View)',
      photo: '1 Titik Sudut Terkunci (Fixed Angle)',
      video: 'Linier Pasif (Hanya apa yang disorot kamera)',
      spatium: 'Bebas 100% — Berjalan, berputar, & terbang ke sudut mana pun',
      isHighlight: true,
    },
    {
      feature: 'Skala & Proporsi Ruang Fisik',
      photo: 'Sering terdistorsi efek lensa wide-angle 2D',
      video: 'Tergantung pergerakan tangan juru kamera',
      spatium: 'Skala 1:1 Nyata (Akurasi sub-sentimeter LiDAR)',
      isHighlight: true,
    },
    {
      feature: 'Verifikasi Keyakinan Pembeli (ZMOT)',
      photo: 'Rendah (Calon pembeli sering ragu / tidak percaya)',
      video: 'Sedang (Bisa direkayasa efek visual / grading)',
      spatium: 'Maksimal — Pengalaman verifikasi langsung seperti di lokasi',
      isHighlight: true,
    },
    {
      feature: 'Interaksi & Kedalaman Atmosferik',
      photo: 'Statis tanpa rasa kedalaman nyata',
      video: 'Hanya melihat rekaman masa lalu',
      spatium: 'Fotorealistis 3DGS — Menangkap kilau cahaya, refraksi & detail mikro',
      isHighlight: false,
    },
    {
      feature: 'Kemudahan Akses Perangkat',
      photo: 'Format file standar',
      video: 'Streaming video',
      spatium: 'Langsung di Web Browser HP / Laptop 60 FPS + Ready WebXR/VR',
      isHighlight: false,
    },
    {
      feature: 'Efisiensi Waktu & Biaya Produksi',
      photo: 'Cepat namun nilai konversi terbatas',
      video: 'Produksi mahal, revisi syuting ulang sulit',
      spatium: 'One Point, Unlimited Possibilities — Scan sekali, pakai selamanya',
      isHighlight: true,
    },
  ]

  return (
    <section className="relative py-24 md:py-32 bg-[#050B14] border-t border-b border-white/10 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Curse of Distance Overcome</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Spatial Media <span className="text-cyan-400">vs</span> Foto & Video Konvensional
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal">
            Mengapa teknologi <strong className="text-white">3D Gaussian Splatting</strong> dari SPATIUM mengubah paradigma presentasi ruang dari sekadar <em>"melihat foto"</em> menjadi <em>"berjalan dan memverifikasi sendiri secara nyata"</em>.
          </p>
        </div>

        {/* Comparison Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Foto 2D */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Foto 2D Statis</h3>
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-6">
                Perspektif Terkunci
              </p>
              <ul className="space-y-3.5 text-xs text-neutral-400">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Hanya satu sudut pandang tetap tanpa konteks lingkungan</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Distorsi lensa wide-angle membuat ruang terlihat manipulatif</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Tidak ada data kedalaman (depth perception) dan skala fisik</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="text-[11px] font-mono text-neutral-400">Tingkat Verifikasi: Terbatas</span>
            </div>
          </div>

          {/* Card 2: Video 2D */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-6">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Sinematik 2D</h3>
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-6">
                Alur Kamera Pasif
              </p>
              <ul className="space-y-3.5 text-xs text-neutral-400">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Penonton pasif, hanya melihat ke arah yang ditentukan juru kamera</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Tidak bisa berhenti, berputar, atau memeriksa detail yang diminati</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Biaya reshoot sangat mahal jika ada perubahan tata letak</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <span className="text-[11px] font-mono text-neutral-400">Tingkat Verifikasi: Sedang</span>
            </div>
          </div>

          {/* Card 3: SPATIUM 3DGS (Featured Winner) */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0A162C]/90 to-[#040811] border-2 border-cyan-400 p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-cyan-500/20">
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-cyan-400 text-[#040711] font-extrabold text-[10px] font-mono uppercase tracking-widest">
              Walkable Reality
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-400 text-[#040711] flex items-center justify-center font-bold mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">SPATIUM Spatial Media</h3>
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-6">
                3D Gaussian Splatting (3DGS)
              </p>
              <ul className="space-y-3.5 text-xs text-white/90">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>100% Bebas Ditonton:</strong> Berjalan & terbang ke segala arah 60 FPS</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Skala Fisik 1:1 Nyata:</strong> Akurasi sub-sentimeter LiDAR tanpa distorsi</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Moment of Truth:</strong> Pembeli yakin bertransaksi sebelum datang</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Native WebGL:</strong> Buka instan di browser HP, PC, dan Headset VR</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/15">
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                Tingkat Verifikasi: 100% Nyata & Mandiri
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Table for Technical Decision Makers */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-xs font-mono uppercase tracking-wider text-neutral-400">
                <th className="p-4 sm:p-5">Parameter Evaluasi</th>
                <th className="p-4 sm:p-5">Foto 2D</th>
                <th className="p-4 sm:p-5">Video 2D</th>
                <th className="p-4 sm:p-5 text-cyan-400">SPATIUM 3DGS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm text-neutral-300">
              {comparisonItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 sm:p-5 font-medium text-white">{item.feature}</td>
                  <td className="p-4 sm:p-5 text-neutral-400">{item.photo}</td>
                  <td className="p-4 sm:p-5 text-neutral-400">{item.video}</td>
                  <td className="p-4 sm:p-5 font-semibold text-cyan-300 bg-cyan-400/[0.04]">
                    {item.spatium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
