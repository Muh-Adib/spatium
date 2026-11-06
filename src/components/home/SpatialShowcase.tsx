'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  Maximize2,
  Box,
  Compass,
  Layers,
  MapPin,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react'
import { PROJECTS, PROJECT_CATEGORIES, type Project, type ProjectCategory } from '@/data/projects'
import { GaussianSplatViewer } from '@/components/spatial/GaussianSplatViewer'

interface SpatialShowcaseProps {
  initialProjects?: Project[]
}

export function SpatialShowcase({ initialProjects }: SpatialShowcaseProps) {
  const allProjects = useMemo(() => {
    return initialProjects && initialProjects.length > 0 ? initialProjects : PROJECTS
  }, [initialProjects])

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null)

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return allProjects
    return allProjects.filter((p) => p.category === activeCategory)
  }, [allProjects, activeCategory])

  return (
    <section id="spatial-showcase" className="relative py-24 md:py-32 bg-[#060D1A] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#0F3A79]/20 to-transparent rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real Captures · 10 Active Showcases</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Karya Nyata <span className="text-cyan-400">3D Gaussian Splatting</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-300 font-normal">
              Eksplorasi representasi medan radiansi fotorealistis berskala 1:1 di berbagai sektor industri: dari restoran tepi laut Manado, ruang bedah klinis, pabrik industri, hingga greenhouse botani.
            </p>
          </div>

          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 self-start md:self-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-mono tracking-wider uppercase transition-all hover:scale-105"
          >
            <span>Semua Studi Kasus</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {PROJECT_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-[#040711] font-bold shadow-lg shadow-white/20 scale-105'
                    : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Featured Showcase Item (First one in list) */}
        {filteredProjects.length > 0 && (
          <div className="mb-14">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Embed Viewer Container */}
                <div className="lg:col-span-7">
                  <GaussianSplatViewer
                    liveUrl={filteredProjects[0].liveUrl}
                    splatId={filteredProjects[0].splatId}
                    title={filteredProjects[0].title}
                    client={filteredProjects[0].client}
                    category={filteredProjects[0].discipline}
                    pointCount={filteredProjects[0].pointCount}
                    accuracy={filteredProjects[0].accuracy}
                    scenePairSlug={filteredProjects[0].scenePairSlug}
                    scenePairLabel={filteredProjects[0].scenePairLabel}
                    heightClass="h-[380px] sm:h-[480px] lg:h-[520px]"
                  />
                </div>

                {/* Details Column */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-[11px] font-mono uppercase tracking-wider font-semibold">
                        Featured Capture
                      </span>
                      {filteredProjects[0].location && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{filteredProjects[0].location}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                      {filteredProjects[0].title}
                    </h3>
                    <p className="text-sm font-mono text-cyan-400 mb-4">
                      {filteredProjects[0].client}
                    </p>
                    <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                      {filteredProjects[0].brief}
                    </p>

                    {/* Technical Specs List */}
                    <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-0.5">
                          Kerapatan Splats
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {filteredProjects[0].pointCount || '15.1M Splats'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-0.5">
                          Akurasi Spasial
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {filteredProjects[0].accuracy || '< 5mm'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/portfolio/${filteredProjects[0].slug}`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#040711] font-bold text-xs font-mono uppercase tracking-wider hover:bg-cyan-100 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all shadow-lg"
                    >
                      <span>Lihat Detail Studi Kasus</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {filteredProjects[0].scenePairSlug && (
                      <Link
                        href={`/portfolio/${filteredProjects[0].scenePairSlug}`}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all"
                      >
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Scene Terhubung</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remaining Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.slice(1).map((project, idx) => (
            <div
              key={project.slug}
              className="group rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Media Container with Quick Preview Button */}
              <div className="relative aspect-video w-full overflow-hidden bg-[#0A1628]">
                {project.posterUrl ? (
                  <Image
                    src={project.posterUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#070F1E] text-neutral-600">
                    <Box className="w-8 h-8" />
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-[#040711]/85 backdrop-blur-md border border-cyan-400/30 text-cyan-300 text-[10px] font-mono tracking-wider uppercase font-semibold">
                    {project.pointCount || '12.0M Splats'}
                  </span>
                  {project.scenePairSlug && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/80 backdrop-blur-md text-[#040711] font-bold text-[9px] font-mono uppercase tracking-wider">
                      Pair Active
                    </span>
                  )}
                </div>

                {/* Hover Quick View Trigger */}
                <div className="absolute inset-0 bg-[#040711]/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForModal(project)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#040711] font-bold text-xs font-mono uppercase tracking-wider hover:bg-cyan-100 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all transform scale-90 group-hover:scale-100 shadow-xl"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Jelajahi 3DGS</span>
                  </button>

                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                    <span className="text-cyan-400 font-semibold">{project.client}</span>
                    {project.location && <span>{project.location}</span>}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>

                  <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-4">
                    {project.tagline || project.brief}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">{project.accuracy || '< 5mm'}</span>
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="text-cyan-400 inline-flex items-center gap-1 hover:underline font-semibold"
                  >
                    <span>Studi Kasus</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive 3DGS Modal Viewer */}
      {selectedProjectForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#070F1E] border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0A1628] border-b border-white/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedProjectForModal.title}
                </h3>
                <p className="text-xs font-mono text-cyan-400">
                  {selectedProjectForModal.client} · {selectedProjectForModal.pointCount}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/portfolio/${selectedProjectForModal.slug}`}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors hidden sm:inline-flex items-center gap-1.5"
                >
                  <span>Detail Lengkap</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedProjectForModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Viewer Body */}
            <div className="flex-1 w-full h-[600px] bg-black">
              <GaussianSplatViewer
                liveUrl={selectedProjectForModal.liveUrl}
                splatId={selectedProjectForModal.splatId}
                title={selectedProjectForModal.title}
                client={selectedProjectForModal.client}
                category={selectedProjectForModal.discipline}
                pointCount={selectedProjectForModal.pointCount}
                accuracy={selectedProjectForModal.accuracy}
                scenePairSlug={selectedProjectForModal.scenePairSlug}
                scenePairLabel={selectedProjectForModal.scenePairLabel}
                heightClass="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
