'use client'

import React from 'react'
import Link from 'next/link'
import { InteractiveCtaBlockInstance, TextEditorialBlockInstance } from './contracts'
import { Icon } from '@/components/Icon'

export function InteractiveCtaBlock({ block }: { block: InteractiveCtaBlockInstance }) {
  const { data } = block

  return (
    <section className="py-24 bg-accent/10 border-t border-accent/20 text-white relative overflow-hidden">
      <div className="container container--wide relative z-10 text-center max-w-3xl mx-auto">
        {data.eyebrow ? (
          <p className="mono text-xs uppercase tracking-widest text-accent mb-4">{data.eyebrow}</p>
        ) : null}

        <h2 className="display-md font-bold mb-6">{data.headline}</h2>

        {data.body ? (
          <p className="text-neutral-300 text-lg mb-10 leading-relaxed">{data.body}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={data.primaryCta.href} className="btn btn--primary">
            {data.primaryCta.label}
            <span className="btn__icon">
              <Icon name="arrow-right" size={16} />
            </span>
          </Link>

          {data.secondaryCta ? (
            <Link href={data.secondaryCta.href} className="btn btn--secondary">
              {data.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function TextEditorialBlock({ block }: { block: TextEditorialBlockInstance }) {
  const { data, settings } = block
  const isSplit = settings?.layout === 'split'

  return (
    <section className="py-20 bg-black text-white">
      <div className="container container--wide">
        <div className={isSplit ? 'grid grid-cols-1 lg:grid-cols-12 gap-12' : 'max-w-3xl mx-auto'}>
          <div className={isSplit ? 'lg:col-span-5' : 'mb-8'}>
            {data.eyebrow ? (
              <p className="mono text-xs uppercase tracking-widest text-accent mb-2">{data.eyebrow}</p>
            ) : null}
            <h2 className="display-sm font-bold">{data.headline}</h2>
            {data.asideNote ? (
              <div className="p-4 mt-6 rounded border border-neutral-800 bg-neutral-900/50 text-xs text-neutral-400">
                {data.asideNote}
              </div>
            ) : null}
          </div>

          <div
            className={`prose prose-invert max-w-none ${isSplit ? 'lg:col-span-7' : ''}`}
            dangerouslySetInnerHTML={{ __html: data.contentHtml }}
          />
        </div>
      </div>
    </section>
  )
}
