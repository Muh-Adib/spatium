import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Sparkles, Layers, Box, Globe, FileText } from 'lucide-react'

export interface LinkCardProps {
  target: {
    type: string
    url: string
    title: string
    summary?: string | null
    image?: string | null
    reason?: string | null
  }
  variant?: 'card' | 'inline' | 'compact'
  blurbOverride?: string
}

export function LinkCard({ target, variant = 'card', blurbOverride }: LinkCardProps) {
  if (!target || !target.url) return null

  const displaySummary = blurbOverride || target.summary || ''

  const typeIcons: Record<string, any> = {
    landing: Globe,
    service: Box,
    solution: Sparkles,
    portfolio: Layers,
    article: FileText,
  }

  const IconComponent = typeIcons[target.type] || Globe

  const typeBadges: Record<string, string> = {
    landing: 'Wilayah Layanan',
    service: 'Departemen & Kapabilitas',
    solution: 'Katalog Solusi',
    portfolio: 'Studi Kasus Pembuktian',
    article: 'Wawasan Terkait',
  }

  if (variant === 'inline') {
    return (
      <Link
        href={target.url}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-accent-500/10 border border-accent-400/30 text-accent-400 hover:bg-accent-500/20 text-xs font-mono font-medium transition-all mx-1 align-baseline hover:scale-105"
      >
        <IconComponent className="w-3 h-3 shrink-0" />
        <span>{target.title}</span>
        <ArrowUpRight className="w-3 h-3 opacity-60" />
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={target.url}
        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all group my-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-400/20 text-accent-400 flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-accent-400 uppercase tracking-wider block">
              {typeBadges[target.type] || target.type}
            </span>
            <h4 className="text-sm font-semibold text-white group-hover:text-accent-400 transition-colors truncate">
              {target.title}
            </h4>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
      </Link>
    )
  }

  // Default 'card' variant
  return (
    <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-accent-400/40 transition-all group">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {target.image && (
          <div className="relative w-full sm:w-40 aspect-[16/10] rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/5">
            <Image
              src={target.image}
              alt={target.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-accent-500/10 text-accent-400 border border-accent-400/20">
              {typeBadges[target.type] || target.type}
            </span>
            {target.reason && (
              <span className="text-[11px] text-neutral-500 truncate">
                {target.reason}
              </span>
            )}
          </div>
          <h4 className="text-base font-bold text-white group-hover:text-accent-400 transition-colors">
            {target.title}
          </h4>
          {displaySummary && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {displaySummary}
            </p>
          )}
          <div className="pt-2">
            <Link
              href={target.url}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-400 hover:text-accent-300 transition-colors"
            >
              <span>Pelajari Detail Solusi</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface RelatedLinksBlockProps {
  title?: string
  links: Array<{
    type: string
    url: string
    title: string
    summary?: string | null
  }>
}

export function RelatedLinksBlock({ title = 'Tautan & Ekosistem Terkait', links }: RelatedLinksBlockProps) {
  if (!links || links.length === 0) return null

  return (
    <div className="my-10 p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent-400" />
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
          {title} ({links.length})
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link, idx) => (
          <Link
            key={idx}
            href={link.url}
            className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 transition-all flex items-start gap-2.5 group"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-accent-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors block truncate">
                {link.title}
              </span>
              {link.summary && (
                <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                  {link.summary}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
