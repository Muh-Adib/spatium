'use client'

import React from 'react'
import { ProcessTimelineBlockInstance } from './contracts'
import { Reveal } from '@/components/ui/Reveal'
import '@/components/home/process-timeline.css'

export function ProcessTimelineBlock({ block }: { block: ProcessTimelineBlockInstance }) {
  const { data } = block

  return (
    <section className="section process-timeline bg-neutral-950 text-white py-24">
      <div className="container container--wide">
        <div className="mb-16">
          {data.eyebrow ? (
            <p className="mono text-xs uppercase tracking-widest text-neutral-400 mb-3">
              {data.eyebrow}
            </p>
          ) : null}
          <h2 className="display-md font-bold mb-4">{data.title}</h2>
          {data.description ? (
            <p className="text-neutral-400 max-w-2xl text-lg">{data.description}</p>
          ) : null}
        </div>

        <div className="process-timeline__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.steps.map((step, idx) => (
            <Reveal key={step.stepNumber || idx} delay={idx * 80} className="process-step">
              <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/60 h-full flex flex-col justify-between">
                <div>
                  <div className="mono text-2xl font-bold text-accent mb-4">
                    {step.stepNumber}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">{step.summary}</p>
                </div>

                {step.deliverables && step.deliverables.length > 0 ? (
                  <ul className="text-xs text-neutral-400 space-y-1.5 pt-4 border-t border-neutral-800">
                    {step.deliverables.map((d, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span>{d}</span>
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
