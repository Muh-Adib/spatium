'use client'

import React from 'react'
import { StatsTickerBlockInstance } from './contracts'

export function StatsTickerBlock({ block }: { block: StatsTickerBlockInstance }) {
  const { data, settings } = block
  const cols = settings?.columns === 4 ? 'lg:grid-cols-4' : settings?.columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'

  return (
    <section className="py-20 bg-neutral-900 border-y border-neutral-800 text-white">
      <div className="container container--wide">
        {data.title ? (
          <div className="mb-12 text-center max-w-2xl mx-auto">
            {data.eyebrow ? (
              <p className="mono text-xs uppercase tracking-widest text-accent mb-2">{data.eyebrow}</p>
            ) : null}
            <h2 className="display-sm font-bold">{data.title}</h2>
          </div>
        ) : null}

        <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-8 text-center`}>
          {data.metrics.map((metric, idx) => (
            <div key={idx} className="p-8 border border-neutral-800/80 rounded-lg bg-neutral-950/40">
              <div className="display-lg font-bold text-accent mb-2 mono">{metric.value}</div>
              <div className="text-base font-semibold text-white mb-1">{metric.label}</div>
              {metric.detail ? (
                <div className="text-xs text-neutral-400">{metric.detail}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
