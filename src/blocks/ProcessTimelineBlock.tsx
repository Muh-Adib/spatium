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
  const steps: any[] = Array.isArray(data.steps) ? data.steps : Array.isArray(block?.steps) ? block.steps : []

  return (
    <section className="section process-timeline bg-neutral-950 text-white py-24">
      <div className="container container--wide">
        <div className="mb-16">
          {eyebrow ? (
            <p className="mono text-xs uppercase tracking-widest text-neutral-400 mb-3">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="display-md font-bold mb-4">{title}</h2>
          {description ? (
            <p className="text-neutral-400 max-w-2xl text-lg">{description}</p>
          ) : null}
        </div>

        <div className="process-timeline__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 cq-cols-2 gap-8">
          {steps.map((step, idx) => (
            <Reveal key={step.stepNumber || step.step || step.number || idx} delay={idx * 80} className="process-step">
              <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/60 h-full flex flex-col justify-between">
                <div>
                  <div className="mono text-2xl font-bold text-accent mb-4">
                    {step.stepNumber || step.step || step.number || `0${idx + 1}`}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">{step.summary || step.description}</p>
                </div>

                {Array.isArray(step.deliverables) && step.deliverables.length > 0 ? (
                  <ul className="text-xs text-neutral-400 space-y-1.5 pt-4 border-t border-neutral-800">
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
