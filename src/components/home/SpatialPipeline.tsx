'use client'

import React from 'react'
import { Camera, Cpu, Layers, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export function SpatialPipeline() {
  const steps = [
    {
      number: '01',
      title: 'Laser Scan & Drone Capture',
      subtitle: 'Akuisisi Data Multi-Sensor',
      description:
        'Perekaman lapangan berkecepatan tinggi menggunakan terrestrial laser scanner (LiDAR), drone photogrammetry, dan rig kamera spasial calibrated untuk menangkap jutaan koordinat XYZ dan intensitas warna.',
      icon: Camera,
      metrics: 'Jutaan titik koordinat XYZ',
    },
    {
      number: '02',
      title: 'Dense Point Cloud',
      subtitle: 'Komputasi Spasial Akurasi Tinggi',
      description:
        'Pemrosesan komputasi fotogrametri dan point cloud densification menghasilkan kerapatan awan titik sub-sentimeter (toleransi 3–5mm) sebagai fondasi geometri yang kokoh.',
      icon: Cpu,
      metrics: 'Akurasi sub-sentimeter < 5mm',
    },
    {
      number: '03',
      title: '3D Geometry & CAD Reconstruction',
      subtitle: 'Pemodelan Dimensi & Analisis Ruang',
      description:
        'Konversi titik spasial ke dalam model mesh permukaan 3D dan CAD yang presisi. Siap diintegrasikan ke Unreal Engine, Blender, Revit, maupun software perancangan arsitektur.',
      icon: Layers,
      metrics: 'Topologi mesh bersih & terkalibrasi',
    },
    {
      number: '04',
      title: '3D Gaussian Splatting (3DGS)',
      subtitle: 'Medan Radiansi Fotorealistis 60 FPS',
      description:
        'Pelatihan neural radiance fields menghasilkan representasi jutaan elipsoid 3D spasial fotorealistis. Berjalan mulus di WebGL browser HP, laptop, hingga kacamata spasial VR/Vision Pro.',
      icon: Sparkles,
      metrics: '60 FPS Real-time WebGL Native',
    },
  ]

  return (
    <section className="relative py-24 md:py-32 bg-[#040810] border-b border-white/10 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0F3A79]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>End-to-End Reality Capture Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Alur Teknologi <span className="text-cyan-400">4-Langkah</span> SPATIUM
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
            Dari pemindaian sensor fisik di dunia nyata hingga menjadi representasi digital kembaran spasial fotorealistis 60 FPS yang siap dijelajahi di seluruh dunia.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className="relative rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-7 flex flex-col justify-between hover:border-cyan-400/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400 group-hover:text-[#040711] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-4">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{step.metrics}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
