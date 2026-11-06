'use client'

import { memo, useState, useMemo } from 'react'
import { siteConfig } from '@/config/site'
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Calendar,
  ListTree,
} from 'lucide-react'
import { ContentBlock, generateHeadingSlug } from '@/lib/articles/blockEditor'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'

interface ArticleLivePreviewProps {
  title: string
  slug: string
  category: string
  author: string
  publicationDate?: string
  readingTimeMinutes: number
  coverUrl: string
  coverAlt: string
  excerpt: string
  blocks: ContentBlock[]
  rawContent?: string
  editorStyle: 'blocks' | 'raw'
  tags?: string[]
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export const ArticleLivePreview = memo(function ArticleLivePreview({
  title,
  slug,
  category,
  author,
  publicationDate,
  readingTimeMinutes,
  coverUrl,
  coverAlt,
  excerpt,
  blocks,
  rawContent,
  editorStyle,
  tags = [],
}: ArticleLivePreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null)
  const [tocExpanded, setTocExpanded] = useState(true)

  // Extract structured hierarchical Table of Contents from headings
  const tocItems = useMemo(() => {
    const items: Array<{ id: string; text: string; level: 2 | 3; anchor: string; h2Index?: number }> = []
    let currentH2Index = 0
    blocks.forEach((b) => {
      if (b.type === 'heading2' && b.text.trim()) {
        const anchor = generateHeadingSlug(b.text)
        if (anchor) {
          currentH2Index++
          items.push({ id: b.id, text: b.text, level: 2, anchor, h2Index: currentH2Index })
        }
      } else if (b.type === 'heading3' && b.text.trim()) {
        const anchor = generateHeadingSlug(b.text)
        if (anchor) {
          items.push({ id: b.id, text: b.text, level: 3, anchor })
        }
      }
    })
    return items
  }, [blocks])

  const dateString = publicationDate
    ? new Date(publicationDate).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0D0D0D] overflow-hidden select-none">
      {/* Top Device Bar */}
      <div className="h-10 shrink-0 px-4 bg-[var(--studio-bg)] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE PREVIEW</span>
          </div>
          <span className="text-xs font-mono text-neutral-400 hidden sm:inline truncate max-w-[200px]">
            /journal/{slug || 'preview'}
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/50 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            aria-label="Pratinjau Desktop (100%)"
            aria-pressed={device === 'desktop'}
            className={`p-1.5 rounded-md transition-all ${
              device === 'desktop'
                ? 'bg-white/20 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            aria-label="Pratinjau Tablet (768px)"
            aria-pressed={device === 'tablet'}
            className={`p-1.5 rounded-md transition-all ${
              device === 'tablet'
                ? 'bg-white/20 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            aria-label="Pratinjau Seluler (375px)"
            aria-pressed={device === 'mobile'}
            className={`p-1.5 rounded-md transition-all ${
              device === 'mobile'
                ? 'bg-white/20 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {slug && (
          <a
            href={`${siteConfig.url}/journal/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-accent-400 hover:text-accent-300 transition-colors"
          >
            <span>Buka Tab Baru</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Preview Canvas Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-start justify-center scrollbar-thin">
        <div
          className={`transition-all duration-300 bg-[var(--studio-sidebar-bg)] text-neutral-100 rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${
            device === 'desktop'
              ? 'w-full max-w-[820px]'
              : device === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          }`}
        >
          {/* Simulated Public Article Hero */}
          <div className="relative overflow-hidden bg-surface-overlay px-6 py-10 sm:px-10 sm:py-14 border-b border-white/10">
            {/* Ambient Lighting Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#4d8bff]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                <span>Beranda</span>
                <span>/</span>
                <span>Artikel</span>
                <span>/</span>
                <span className="text-[#4d8bff] font-semibold">{category}</span>
              </div>

              {/* Category Badge */}
              <span className="inline-block px-3 py-1 rounded-full bg-surface-elevated text-[#4d8bff] border border-[#4d8bff]/30 font-mono text-xs font-semibold">
                {category}
              </span>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
                {title || 'Judul Artikel Anda Akan Tampil di Sini'}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#4d8bff]" />
                  <span>
                    Oleh: <strong className="text-white">{author || 'Tim SPATIUM'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4d8bff]" />
                  <span>{dateString}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4d8bff]" />
                  <span>{readingTimeMinutes} menit baca</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Cover Image Breakout */}
          {coverUrl && (
            <div className="px-6 -mt-6 sm:px-10 relative z-20">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt={coverAlt || title || 'Cover'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Article Body */}
          <div className="p-6 sm:p-10 space-y-6">
            {/* Excerpt Lead Box */}
            {excerpt && (
              <div className="rounded-2xl border-l-4 border-[#4d8bff] bg-[#4d8bff]/[0.05] p-5">
                <p className="text-sm sm:text-base font-medium text-neutral-200 italic leading-relaxed">
                  &ldquo;{excerpt}&rdquo;
                </p>
              </div>
            )}

            {/* Hierarchical Table of Contents (Daftar Isi) */}
            {tocItems.length >= 2 && (
              <nav aria-label="Daftar Isi Artikel" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm shadow-soft-sm">
                <div className="flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-accent-400" />
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-mono">
                      Daftar Isi Artikel
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">
                      {tocItems.filter((t) => t.level === 2).length} Bagian Utama
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTocExpanded((prev) => !prev)}
                    aria-expanded={tocExpanded}
                    className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    <span>{tocExpanded ? 'Tutup' : 'Lihat Semua'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${tocExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {tocExpanded && (
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 animate-fadeIn">
                    {tocItems.map((item, i) => (
                      <div
                        key={item.id || i}
                        className={`${
                          item.level === 3
                            ? 'pl-6 text-[13px] text-neutral-400 hover:text-white'
                            : 'text-sm font-semibold text-neutral-200 hover:text-accent-300 pt-1'
                        }`}
                      >
                        <a
                          href={`#${item.anchor}`}
                          className="flex items-baseline gap-2 group/toc transition-colors"
                        >
                          <span
                            className={`font-mono text-xs shrink-0 select-none ${
                              item.level === 3
                                ? 'text-neutral-600 group-hover/toc:text-neutral-400'
                                : 'text-accent-400'
                            }`}
                          >
                            {item.level === 3 ? '└' : `${item.h2Index}.`}
                          </span>
                          <span className="group-hover/toc:underline leading-relaxed">
                            {item.text}
                          </span>
                          <span className="opacity-0 group-hover/toc:opacity-100 text-[10px] font-mono text-neutral-600 transition-opacity">
                            #{item.anchor}
                          </span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </nav>
            )}

            {/* Render Content */}
            {editorStyle === 'raw' && rawContent ? (
              <div
                className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-neutral-300"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(rawContent) }}
              />
            ) : (
              <div className="space-y-5 text-sm sm:text-base leading-relaxed text-neutral-200">
                {blocks.map((block, idx) => {
                  const blockKey = block.id ? `${block.id}-${idx}` : `blk-${idx}`
                  switch (block.type) {
                    case 'paragraph':
                      return (
                        <div
                          key={blockKey}
                          className="leading-[1.8] text-neutral-300"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.text) }}
                        />
                      )
                    case 'heading2': {
                      const anchor = generateHeadingSlug(block.text)
                      return (
                        <h2
                          key={blockKey}
                          id={anchor || undefined}
                          className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-4 pb-1 border-b border-white/5 scroll-mt-20 group relative"
                        >
                          <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.text) }} />
                          {anchor && (
                            <a
                              href={`#${anchor}`}
                              className="ml-2 text-xs font-mono text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-accent-400 transition-opacity"
                              title={`Anchor: #${anchor}`}
                            >
                              #
                            </a>
                          )}
                        </h2>
                      )
                    }
                    case 'heading3': {
                      const anchor = generateHeadingSlug(block.text)
                      return (
                        <h3
                          key={blockKey}
                          id={anchor || undefined}
                          className="text-lg sm:text-xl font-semibold text-neutral-100 pt-2 scroll-mt-20 group relative"
                        >
                          <span dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.text) }} />
                          {anchor && (
                            <a
                              href={`#${anchor}`}
                              className="ml-2 text-xs font-mono text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-accent-400 transition-opacity"
                              title={`Anchor: #${anchor}`}
                            >
                              #
                            </a>
                          )}
                        </h3>
                      )
                    }
                    case 'image':
                      return (
                        <figure key={blockKey} className="my-4 space-y-2">
                          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={block.url}
                              alt={block.alt || 'Gambar'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {block.caption && (
                            <figcaption className="text-center text-xs text-neutral-400 italic">
                              {block.caption}
                            </figcaption>
                          )}
                        </figure>
                      )
                    case 'video':
                      return (
                        <div
                          key={blockKey}
                          className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 my-4"
                        >
                          <iframe
                            src={block.embedUrl || block.url}
                            title={block.title || 'Video'}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      )
                    case 'quote':
                      return (
                        <blockquote
                          key={blockKey}
                          className="border-l-4 border-amber-400 bg-amber-400/[0.04] p-4 rounded-r-xl my-4 space-y-1.5"
                        >
                          <p
                            className="italic text-base sm:text-lg text-neutral-100"
                            dangerouslySetInnerHTML={{ __html: `&ldquo;${sanitizeHtmlContent(block.text)}&rdquo;` }}
                          />
                          {block.author && (
                            <cite className="block text-xs font-mono text-amber-300 font-semibold not-italic">
                              — {block.author}
                            </cite>
                          )}
                        </blockquote>
                      )
                    case 'list':
                      return block.ordered ? (
                        <ol key={blockKey} className="list-decimal pl-6 space-y-1.5 my-3 text-neutral-300">
                          {block.items.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item) }} />
                          ))}
                        </ol>
                      ) : (
                        <ul key={blockKey} className="list-disc pl-6 space-y-1.5 my-3 text-neutral-300">
                          {block.items.map((item, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item) }} />
                          ))}
                        </ul>
                      )
                    case 'faq':
                      const isOpen = expandedFaqIndex === idx
                      return (
                        <div
                          key={blockKey}
                          className="rounded-xl border border-white/10 bg-black/40 overflow-hidden my-3"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-bold text-white hover:bg-white/5 transition-colors"
                          >
                            <span>{block.question}</span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-accent-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-0 text-xs text-neutral-300 leading-relaxed border-t border-white/5 bg-white/[0.02]">
                              {block.answer}
                            </div>
                          )}
                        </div>
                      )
                    case 'code':
                      return (
                        <pre
                          key={blockKey}
                          className="p-4 rounded-xl bg-black/80 border border-white/10 overflow-x-auto text-xs font-mono text-cyan-300 my-4"
                        >
                          <code>{block.code}</code>
                        </pre>
                      )
                    case 'divider':
                      return <hr key={blockKey} className="border-white/10 my-6" />
                    case 'html':
                      return (
                        <div
                          key={blockKey}
                          className="my-4 max-w-none overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(block.html) }}
                        />
                      )
                    case 'internal-links':
                      return (
                        <div key={blockKey} className="my-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
                          <h4 className="text-xs font-bold text-emerald-400 font-mono mb-2">{block.title || 'Indeks Tautan Terkait'}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                            {block.links.map((link, i) => (
                              <a key={i} href={link.href} className="text-accent-400 hover:underline truncate">
                                • {link.text || link.href}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    case 'table': {
                      const hasHeaders = block.hasHeaderRow !== false && block.headers && block.headers.length > 0
                      const colsCount = hasHeaders ? block.headers.length : (block.rows[0]?.length || 0)
                      const colWidths = block.columnWidths && block.columnWidths.length === colsCount ? block.columnWidths : null
                      return (
                        <div key={blockKey} className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/40 scrollbar-thin shadow-sm">
                          <table className={`w-full text-left text-xs sm:text-sm border-collapse ${colWidths ? 'table-fixed' : 'table-auto'}`}>
                            {colWidths && (
                              <colgroup>
                                {colWidths.map((w, idx) => (
                                  <col key={idx} style={{ width: `${w}%` }} />
                                ))}
                              </colgroup>
                            )}
                            {hasHeaders && (
                              <thead>
                                <tr className="bg-white/[0.05] border-b border-white/10 text-white font-semibold">
                                  {block.headers.map((h, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="p-3 text-left font-semibold"
                                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(h) }}
                                    />
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody className="divide-y divide-white/5">
                              {block.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="p-3 text-neutral-300 align-top"
                                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(cell) }}
                                    />
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                    default:
                      return null
                  }
                })}
              </div>
            )}

            {/* Tags footer */}
            {tags.length > 0 && (
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-neutral-400 mr-1">Tag:</span>
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
