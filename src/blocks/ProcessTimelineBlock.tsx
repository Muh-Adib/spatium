'use client'

import React from 'react'
import { ProcessTimelineBlockInstance } from './contracts'
import { Reveal } from '@/components/ui/Reveal'
import '@/components/home/process-timeline.css'

export function ProcessTimelineBlock({ block }: { block: ProcessTimelineBlockInstance | any }) {
  const data = block?.data || block || {}
  const title = block?.headline || data.headline || block?.title || data.title || 'Alur Produksi Animasi'
  const description = block?.subheadline || data.subheadline || block?.description || data.description || block?.subtitle || ''
  const eyebrow = block?.eyebrow || data.eyebrow || block?.badge || data.badge || ''
  const rawSteps: any[] = Array.isArray(data.steps)
    ? data.steps
    : Array.isArray(block?.steps)
    ? block.steps
    : Array.isArray(data.pillars)
    ? data.pillars
    : Array.isArray(block?.pillars)
    ? block.pillars
    : [
        {
          stepNumber: '01',
          title: 'Concept & Storyboard',
          summary: 'Eksplorasi ide cerita, visual script breakdown, mood board, dan perancangan sketsa storyboard dinamis.',
          deliverables: ['Color Script', 'Animatic Review', 'Audio Scratch'],
        },
        {
          stepNumber: '02',
          title: '3D Modeling & Rigging',
          summary: 'Pembuatan geometri karakter, lingkungan 3D, material shading prosedural, dan skeletal bone rigging presisi.',
          deliverables: ['High-poly Meshes', 'PBR Shading', 'Face/Body Rigging'],
        },
        {
          stepNumber: '03',
          title: 'Lighting & VFX Simulation',
          summary: 'Pencahayaan dramatis berbasis studio, simulasi partikel, kain, cairan, dan dinamika kamera sinematik.',
          deliverables: ['Raytraced Lighting', 'Particle Systems', 'Camera Motion'],
        },
        {
          stepNumber: '04',
          title: '4K Render & Post-Production',
          summary: 'Proses komputasi render GPU cloud multi-pass, color grading HDR di DaVinci Resolve, dan mastering audio.',
          deliverables: ['4K DCI ProRes', 'Sound Design', 'Master Delivery'],
        },
      ]

  const steps = rawSteps.map((step: any, idx: number) => ({
    stepNumber: step.stepNumber || step.step || step.number || `0${idx + 1}`,
    title: step.title || step.name || `Fase 0${idx + 1}`,
    summary: step.summary || step.description || step.desc || '',
    deliverables: step.deliverables || step.items || [],
  }))

  return (
    <section className="section process-timeline bg-[var(--color-background)] text-white py-24">
      <div className="container container--wide">
        <div className="mb-16">
          {eyebrow ? (
            <p className="mono text-xs uppercase tracking-widest text-[var(--text-dim)] mb-3">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="display-md font-bold mb-4">{title}</h2>
          {description ? (
            <p className="text-[var(--text-muted)] max-w-2xl text-lg">{description}</p>
          ) : null}
        </div>

        <div className="process-timeline__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 cq-cols-2 gap-8">
          {steps.map((step, idx) => (
            <Reveal key={step.stepNumber || idx} delay={idx * 80} className="process-step">
              <div className="p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-translucent)] h-full flex flex-col justify-between">
                <div>
                  <div className="mono text-2xl font-bold text-accent mb-4">
                    {step.stepNumber}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-[var(--text-dim)] text-sm leading-relaxed mb-6">{step.summary}</p>
                </div>

                {Array.isArray(step.deliverables) && step.deliverables.length > 0 ? (
                  <ul className="text-xs text-[var(--text-dim)] space-y-1.5 pt-4 border-t border-[var(--card-border)]">
                    {step.deliverables.map((d: any, dIdx: number) => (
                      <li key={dIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span>{typeof d === 'string' ? d : d.label || d.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
