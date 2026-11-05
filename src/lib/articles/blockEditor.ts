import { CollapsibleLinkItem, generateCollapsibleLinksHtml } from './linkBlock'

/**
 * Block Editor data types, converter, and real-time openSEO / Yoast-style scoring engine.
 */

export type BlockType =
  | 'html'
  | 'paragraph'
  | 'heading2'
  | 'heading3'
  | 'image'
  | 'video'
  | 'quote'
  | 'list'
  | 'faq'
  | 'code'
  | 'divider'
  | 'internal-links'
  | 'table'

export interface ParagraphBlock {
  id: string
  type: 'paragraph'
  text: string
}

export interface Heading2Block {
  id: string
  type: 'heading2'
  text: string
}

export interface Heading3Block {
  id: string
  type: 'heading3'
  text: string
}

export interface ImageBlock {
  id: string
  type: 'image'
  url: string
  alt: string
  caption: string
  alignment: 'center' | 'full'
}

export interface VideoBlock {
  id: string
  type: 'video'
  url: string
  title: string
  embedUrl: string
}

export interface QuoteBlock {
  id: string
  type: 'quote'
  text: string
  author?: string
}

export interface ListBlock {
  id: string
  type: 'list'
  items: string[]
  ordered: boolean
}

export interface FaqBlock {
  id: string
  type: 'faq'
  question: string
  answer: string
}

export interface CodeBlock {
  id: string
  type: 'code'
  code: string
  language: string
}

export interface DividerBlock {
  id: string
  type: 'divider'
}

export interface InternalLinksBlock {
  id: string
  type: 'internal-links'
  title?: string
  links: CollapsibleLinkItem[]
}

export interface TableBlock {
  id: string
  type: 'table'
  headers: string[]
  rows: string[][]
  columnWidths?: number[] // Percentage per column e.g. [30, 40, 30]
  hasHeaderRow?: boolean
  caption?: string
}

export interface HtmlBlock { id: string; type: 'html'; html: string }

export function generateBlockId(prefix = 'b'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export type ContentBlock =
  | HtmlBlock
  | ParagraphBlock
  | Heading2Block
  | Heading3Block
  | ImageBlock
  | VideoBlock
  | QuoteBlock
  | ListBlock
  | FaqBlock
  | CodeBlock
  | DividerBlock
  | InternalLinksBlock
  | TableBlock

/**
 * Convert any video URL (YouTube, Vimeo, etc.) into an embeddable iframe URL
 */
export function extractEmbedUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()

  // YouTube standard watch or shorts
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+))/i)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // If already an embed or valid https iframe url
  if (trimmed.startsWith('https://')) {
    return trimmed
  }

  return trimmed
}

/**
 * Generate a URL-friendly anchor slug from heading text (for TOC jump links and SEO anchors)
 */
export function generateHeadingSlug(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[*_`#]/g, '') // strip markdown symbols
    .trim()
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .replace(/[\s_-]+/g, '-') // spaces to hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
}

/**
 * Clean heading text from raw formatting characters (e.g. asterisks or bold tags)
 * since headings are visually bold by design.
 */
export function cleanHeadingText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/<gwmw\b[^>]*>[\s\S]*?<\/gwmw>/gi, '')
    .replace(/<gwmw\b[^>]*\/?>/gi, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Serialize block array into clean semantic HTML / Markdown for saving & rendering
 */
export function blocksToContent(blocks: ContentBlock[]): string {
  return blocks
    .map((rawBlock) => {
      const b = rawBlock
      switch (b.type) {
        case 'html': return b.html
        case 'paragraph':
          return `<p>${b.text}</p>`
        case 'heading2': {
          const anchor = generateHeadingSlug(b.text)
          return anchor ? `<h2 id="${anchor}">${b.text}</h2>` : `<h2>${b.text}</h2>`
        }
        case 'heading3': {
          const anchor = generateHeadingSlug(b.text)
          return anchor ? `<h3 id="${anchor}">${b.text}</h3>` : `<h3>${b.text}</h3>`
        }
        case 'image': {
          const captionHtml = b.caption ? `<figcaption>${b.caption}</figcaption>` : ''
          const fullClass = b.alignment === 'full' ? ' w-full' : ' max-w-2xl mx-auto'
          return `<figure class="article-figure${fullClass}"><img src="${b.url}" alt="${b.alt || b.caption || 'Gambar Artikel'}" loading="lazy" />${captionHtml}</figure>`
        }
        case 'video': {
          const embed = b.embedUrl || extractEmbedUrl(b.url)
          return `<div class="article-video-wrapper aspect-video w-full my-8 rounded-2xl overflow-hidden shadow-lg border border-border"><iframe src="${embed}" title="${b.title || 'Video Embed'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full border-0"></iframe></div>`
        }
        case 'quote':
          return `<blockquote><p>&ldquo;${b.text}&rdquo;</p>${b.author ? `<cite>— ${b.author}</cite>` : ''}</blockquote>`
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul'
          const lis = b.items.filter((item) => item.trim()).map((item) => `<li>${item}</li>`).join('')
          return `<${tag}>${lis}</${tag}>`
        }
        case 'faq':
          return `<div class="faq-item my-4 p-4 rounded-xl border border-sky-400/20 bg-sky-950/20"><h4>${b.question}</h4><p>${b.answer}</p></div>`
        case 'code':
          return `<pre><code class="language-${b.language || 'text'}">${b.code}</code></pre>`
        case 'divider':
          return `<hr />`
        case 'internal-links':
          return generateCollapsibleLinksHtml(b.links, b.title)
        case 'table': {
          const hasHeaders = b.hasHeaderRow !== false && b.headers && b.headers.length > 0
          const colsCount = hasHeaders ? b.headers.length : (b.rows[0]?.length || 0)
          const colWidths = b.columnWidths && b.columnWidths.length === colsCount ? b.columnWidths : null
          const colgroup = colWidths
            ? `<colgroup>${colWidths.map((w) => `<col style="width: ${w}%" />`).join('')}</colgroup>`
            : ''
          let thead = ''
          if (hasHeaders) {
            thead = `<thead><tr class="bg-white/5 border-b border-white/10 text-neutral-200">${b.headers.map((h) => `<th class="p-3 text-left font-semibold">${h}</th>`).join('')}</tr></thead>`
          }
          const tbody = `<tbody>${b.rows.map((row) => `<tr class="border-b border-white/5 hover:bg-white/[0.02]">${row.map((c) => `<td class="p-3">${c}</td>`).join('')}</tr>`).join('')}</tbody>`
          const captionHtml = b.caption ? `<caption class="text-xs text-neutral-400 py-2 caption-bottom">${b.caption}</caption>` : ''
          return `<div class="article-table-wrapper my-6 overflow-x-auto rounded-xl border border-white/10"><table class="w-full text-left text-sm border-collapse">${colgroup}${captionHtml}${thead}${tbody}</table></div>`
        }
        default: {
          const block = rawBlock as unknown as Record<string, unknown>
          const type = String(block.type || '')
          if (type === 'feature-bento-grid') {
            const rawFeatures = Array.isArray(block.features) ? block.features : []
            const features = rawFeatures.map((f) => {
              const item = f as Record<string, unknown>
              return `<div class="bento-card p-5 rounded-2xl bg-white/[0.03] border border-white/10 my-3">
                ${item.tag ? `<span class="badge text-xs font-mono text-[#FFD600] mb-2 inline-block">${item.tag}</span>` : ''}
                <h4 class="font-bold text-white text-lg">${item.title || ''}</h4>
                <p class="text-sm text-neutral-300 mt-1">${item.description || ''}</p>
              </div>`
            }).join('')
            return `<section class="article-bento-grid my-8">
              ${block.title ? `<h3 class="text-2xl font-bold text-white mb-2">${block.title}</h3>` : ''}
              ${block.description ? `<p class="text-neutral-400 mb-4">${block.description}</p>` : ''}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${features}</div>
            </section>`
          }
          if (type === 'comparison-matrix') {
            const rawRows = Array.isArray(block.rows) ? block.rows : []
            const rows = rawRows.map((r) => {
              const item = r as Record<string, unknown>
              return `<tr class="border-b border-white/10">
                <td class="p-3 font-semibold text-white">${item.feature || ''}</td>
                <td class="p-3 text-[#FFD600]">${item.us || ''}</td>
                <td class="p-3 text-neutral-400">${item.standard || ''}</td>
              </tr>`
            }).join('')
            return `<section class="article-comparison-matrix my-8 overflow-x-auto">
              ${block.title ? `<h3 class="text-2xl font-bold text-white mb-3">${block.title}</h3>` : ''}
              <table class="w-full text-left text-sm border-collapse border border-white/10 rounded-xl">
                <thead><tr class="bg-white/5 border-b border-white/10"><th class="p-3">Fitur / Dimensi</th><th class="p-3">UNIMASI Enterprise</th><th class="p-3">Solusi Konvensional</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </section>`
          }
          if (type === 'client-stats-impact') {
            const rawStats = Array.isArray(block.stats) ? block.stats : []
            const stats = rawStats.map((s) => {
              const item = s as Record<string, unknown>
              return `<div class="stat-card p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span class="block text-3xl font-extrabold text-[#FFD600]">${item.value || ''}</span>
                <strong class="block text-xs uppercase tracking-wider text-white mt-1">${item.label || ''}</strong>
                ${item.detail ? `<span class="block text-xs text-neutral-400 mt-1">${item.detail}</span>` : ''}
              </div>`
            }).join('')
            return `<section class="article-stats-impact my-8">
              ${block.title ? `<h3 class="text-xl font-bold text-white mb-4 text-center">${block.title}</h3>` : ''}
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">${stats}</div>
            </section>`
          }
          if (type === 'architecture-blueprint') {
            const rawLayers = Array.isArray(block.layers) ? block.layers : []
            const layers = rawLayers.map((l) => {
              const item = l as Record<string, unknown>
              return `<div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-3">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-white text-base">${item.name || ''}</span>
                  <span class="text-xs font-mono text-[#FFD600]">${item.tech || ''}</span>
                </div>
                <p class="text-xs text-neutral-300">${item.desc || ''}</p>
              </div>`
            }).join('')
            return `<section class="article-blueprint my-8">
              ${block.title ? `<h3 class="text-2xl font-bold text-white mb-2">${block.title}</h3>` : ''}
              ${block.description ? `<p class="text-neutral-400 text-sm mb-4">${block.description}</p>` : ''}
              <div>${layers}</div>
            </section>`
          }
          if (type === 'deliverables-checklist') {
            const rawItems = Array.isArray(block.items) ? block.items : []
            const items = rawItems.map((it) => {
              const item = it as Record<string, unknown>
              return `<li class="flex items-start gap-2 mb-3">
                <span class="text-[#FFD600] font-bold">✓</span>
                <div>
                  <strong class="text-white block">${item.title || ''}</strong>
                  <span class="text-neutral-300 text-sm">${item.desc || ''}</span>
                </div>
              </li>`
            }).join('')
            return `<section class="article-deliverables my-8 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              ${block.title ? `<h3 class="text-xl font-bold text-white mb-4">${block.title}</h3>` : ''}
              <ul class="list-none pl-0 space-y-2">${items}</ul>
            </section>`
          }
          if (type === 'faq-accordion') {
            const rawFaqs = Array.isArray(block.faqs) ? block.faqs : Array.isArray(block.items) ? block.items : []
            const faqs = rawFaqs.map((f) => {
              const item = f as Record<string, unknown>
              return `<details class="group p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-3">
                <summary class="cursor-pointer font-semibold text-white">${item.question || ''}</summary>
                <p class="mt-2 text-sm text-neutral-300 leading-relaxed border-t border-white/5 pt-2">${item.answer || ''}</p>
              </details>`
            }).join('')
            return `<section class="article-faqs my-8">
              ${block.title ? `<h3 class="text-2xl font-bold text-white mb-4">${block.title}</h3>` : ''}
              <div>${faqs}</div>
            </section>`
          }
          if (type === 'studio-cta') {
            return `<div class="article-cta my-10 p-8 rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-white/15 text-center">
              <h3 class="text-2xl font-bold text-white mb-2">${(block.title as string) || 'Mulai Konsultasi Proyek Digital Anda'}</h3>
              <p class="text-sm text-neutral-300 max-w-xl mx-auto mb-6">${(block.description as string) || 'Diskusikan arsitektur dan kebutuhan spesifik sistem Anda bersama tim spesialis UNIMASI.'}</p>
              <a href="${(block.buttonUrl as string) || (process.env.NEXT_PUBLIC_WHATSAPP ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}` : '/contact')}" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 rounded-xl bg-[#FFD600] text-neutral-900 font-bold text-sm hover:opacity-90 transition-opacity">
                ${(block.buttonText as string) || 'Konsultasi Sekarang'}
              </a>
            </div>`
          }
          if (type === 'media-showcase' || type === 'editorial-image') {
            const img = (block.image || block.imageUrl || block.url) as string | undefined
            if (!img) return ''
            return `<figure class="article-media-showcase my-8 rounded-2xl overflow-hidden border border-white/10">
              <img src="${img}" alt="${(block.alt || block.title || 'Showcase Visual') as string}" class="w-full object-cover" loading="lazy" />
              ${block.caption || block.title ? `<figcaption class="p-3 text-center text-xs text-neutral-400 bg-neutral-900/80">${(block.caption || block.title) as string}</figcaption>` : ''}
            </figure>`
          }
          const anyBlock = block as Record<string, string | undefined>
          if (anyBlock?.text) return `<p>${anyBlock.text}</p>`
          if (anyBlock?.content) return `<p>${anyBlock.content}</p>`
          if (anyBlock?.title) return `<h3>${anyBlock.title}</h3>`
          return ''
        }
      }
    })
    .join('\n\n')
}

/**
 * Convert inline markdown syntax (*italic*, **bold**, [link](url), `code`, ~~strikethrough~~)
 * into safe semantic HTML tags.
 */
export function convertInlineMarkdown(text: string): string {
  if (!text) return ''
  return text
    // Markdown images: ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Markdown links: [anchor](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold + Italic: ***text***
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold: **text**
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    // Bold: __text__ (word bounded)
    .replace(/(^|[^a-zA-Z0-9_])__([^_]+)__(?![a-zA-Z0-9_])/g, '$1<strong>$2</strong>')
    // Italic: *text* (excluding **)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    // Italic: _text_ (word bounded, not in urls)
    .replace(/(^|[^a-zA-Z0-9_])_([^_]+)_(?![a-zA-Z0-9_])/g, '$1<em>$2</em>')
    // Inline code: `code`
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // Strikethrough: ~~text~~
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
}

/**
 * Convert GFM Markdown tables into responsive, cleanly styled HTML tables.
 */
export function convertMarkdownTablesToHtml(markdown: string): string {
  if (!markdown || !markdown.includes('|')) return markdown
  const lines = markdown.split('\n')
  const outputLines: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null

    const isHeaderLine = line.includes('|') && line.trim().startsWith('|')
    const isDelimiterLine = nextLine && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(nextLine)

    if (isHeaderLine && isDelimiterLine) {
      const tableLines: string[] = [line, nextLine]
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }

      const headerRow = tableLines[0]
      const delimiterRow = tableLines[1]
      const bodyRows = tableLines.slice(2)

      const splitCells = (row: string) => {
        let trimmed = row.trim()
        if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
        if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
        return trimmed.split('|').map((c) => c.trim())
      }

      const headers = splitCells(headerRow)
      const alignments = splitCells(delimiterRow).map((d) => {
        const left = d.startsWith(':')
        const right = d.endsWith(':')
        if (left && right) return 'text-center'
        if (right) return 'text-right'
        return 'text-left'
      })

      let tableHtml = '<div class="article-table-wrapper my-6 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-1">\n'
      tableHtml += '  <table class="w-full border-collapse text-left text-sm">\n'
      tableHtml += '    <thead class="bg-white/5 border-b border-white/10 text-xs text-white uppercase font-mono tracking-wider">\n      <tr>\n'
      headers.forEach((h, idx) => {
        const align = alignments[idx] || 'text-left'
        const cellContent = convertInlineMarkdown(h)
        tableHtml += `        <th class="p-3 font-semibold ${align}">${cellContent}</th>\n`
      })
      tableHtml += '      </tr>\n    </thead>\n'

      if (bodyRows.length > 0) {
        tableHtml += '    <tbody class="divide-y divide-white/5 text-neutral-300">\n'
        bodyRows.forEach((row) => {
          const cells = splitCells(row)
          tableHtml += '      <tr class="hover:bg-white/[0.02] transition-colors">\n'
          headers.forEach((_, idx) => {
            const align = alignments[idx] || 'text-left'
            const rawCell = cells[idx] || ''
            const cellContent = convertInlineMarkdown(rawCell)
            tableHtml += `        <td class="p-3 ${align}">${cellContent}</td>\n`
          })
          tableHtml += '      </tr>\n'
        })
        tableHtml += '    </tbody>\n'
      }
      tableHtml += '  </table>\n</div>'

      outputLines.push(tableHtml)
    } else {
      outputLines.push(line)
      i++
    }
  }

  return outputLines.join('\n')
}

/**
 * Parse an HTML table or article-table-wrapper into a structured Notion-style TableBlock
 */
export function parseHtmlTableToTableBlock(html: string): Omit<TableBlock, 'id'> | null {
  try {
    const colgroupMatch = html.match(/<colgroup[\s\S]*?<\/colgroup>/i)
    let columnWidths: number[] | undefined = undefined
    if (colgroupMatch) {
      const colMatches = Array.from(colgroupMatch[0].matchAll(/<col[^>]*style=["'][^"']*width:\s*(\d+(?:\.\d+)?)%[^"']*["']/gi))
      if (colMatches.length > 0) {
        columnWidths = colMatches.map((m) => parseFloat(m[1]))
      }
    }

    const theadMatch = html.match(/<thead[\s\S]*?<\/thead>/i)
    let headers: string[] = []
    if (theadMatch) {
      const thRegex = /<th\b[^>]*>([\s\S]*?)<\/th>/gi
      let thm
      while ((thm = thRegex.exec(theadMatch[0])) !== null) {
        headers.push(preserveInlineElements(thm[1]))
      }
    }

    const tbodyMatch = html.match(/<tbody[\s\S]*?<\/tbody>/i) || html
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
    const rows: string[][] = []
    let rm
    while ((rm = rowRegex.exec(tbodyMatch ? tbodyMatch[0] : html)) !== null) {
      const rowInner = rm[1]
      // If no thead, check if this first row contains th
      if (headers.length === 0 && /<th\b/i.test(rowInner)) {
        const thRegex = /<th\b[^>]*>([\s\S]*?)<\/th>/gi
        let thm
        while ((thm = thRegex.exec(rowInner)) !== null) {
          headers.push(preserveInlineElements(thm[1]))
        }
        continue
      }
      const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi
      const cells: string[] = []
      let tdm
      while ((tdm = tdRegex.exec(rowInner)) !== null) {
        cells.push(preserveInlineElements(tdm[1]))
      }
      if (cells.length > 0) {
        rows.push(cells)
      }
    }

    const capMatch = html.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)
    const caption = capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : undefined

    if (headers.length > 0 || rows.length > 0) {
      return {
        type: 'table',
        headers,
        rows,
        columnWidths,
        hasHeaderRow: headers.length > 0,
        caption,
      }
    }
  } catch (err) {
    console.warn('Error parsing table block', err)
  }
  return null
}

/**
 * Convert Markdown blockquotes (> Quote or contiguous > lines)
 * into semantic <blockquote> elements or rich callout boxes.
 */
export function convertMarkdownBlockquotes(markdown: string): string {
  if (!markdown || !markdown.includes('>')) return markdown
  const lines = markdown.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && (/^\s*>\s?/.test(lines[i]) || (quoteLines.length > 0 && lines[i].trim() === ''))) {
        if (/^\s*>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ''))
          i++
        } else if (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) {
          quoteLines.push('')
          i++
        } else {
          break
        }
      }

      const rawBody = quoteLines.join('\n').trim()
      const hasList = /^\s*[-*•\d.]+\s+/m.test(rawBody)

      if (hasList) {
        const parts = rawBody.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
        let html = '<blockquote class="article-callout border-l-4 border-accent-400 bg-white/5 p-4 rounded-r-xl my-4 space-y-2">\n'
        for (const part of parts) {
          if (/^\s*[-*•\d.]+\s+/m.test(part)) {
            const isNum = /^\s*\d+\.\s+/.test(part)
            const tag = isNum ? 'ol' : 'ul'
            const cls = isNum ? 'list-decimal pl-5 space-y-1 text-sm text-neutral-300' : 'list-disc pl-5 space-y-1 text-sm text-neutral-300'
            const items = part
              .split('\n')
              .filter((l) => l.trim())
              .map((l) => {
                const cleaned = l.replace(/^\s*[-*•\d.]+\s*/, '')
                return `  <li>${convertInlineMarkdown(cleaned)}</li>`
              })
              .join('\n')
            html += `<${tag} class="${cls}">\n${items}\n</${tag}>\n`
          } else {
            html += `<p class="text-sm font-medium text-neutral-200">${convertInlineMarkdown(part)}</p>\n`
          }
        }
        html += '</blockquote>'
        output.push(html)
      } else {
        const authorMatch = rawBody.match(/(?:\n|^)\s*(?:—|–|-)\s*([^\n]+)$/)
        let textOnly = rawBody
        let author = ''
        if (authorMatch) {
          author = authorMatch[1].trim()
          textOnly = rawBody.replace(/(?:\n|^)\s*(?:—|–|-)\s*([^\n]+)$/, '').trim()
        }
        const converted = convertInlineMarkdown(textOnly)
        const citeHtml = author ? `<cite>— ${author}</cite>` : ''
        output.push(`<blockquote><p>${converted}</p>${citeHtml}</blockquote>`)
      }
    } else {
      output.push(line)
      i++
    }
  }

  return output.join('\n')
}

/**
 * Extract Title and Content from Markdown text if user pasted starting with # Title
 */
export function extractTitleAndContentFromMarkdown(raw: string): { title?: string; content: string } {
  if (!raw) return { content: '' }
  const trimmed = raw.trim()

  const h1Match = trimmed.match(/^#\s+([^\n]+)(?:\n+([\s\S]*))?$/)
  if (h1Match) {
    const title = h1Match[1].replace(/[*_`]/g, '').trim()
    const content = h1Match[2] ? h1Match[2].trim() : ''
    return { title, content }
  }

  const frontmatterMatch = trimmed.match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/)
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1]
    const content = frontmatterMatch[2]
    const titleMatch = yaml.match(/^title:\s*["']?([^"'\n]+)["']?/m)
    return {
      title: titleMatch ? titleMatch[1].trim() : undefined,
      content: content.trim(),
    }
  }

  return { content: trimmed }
}

/**
 * Helper to extract balanced opening and closing HTML tags.
 */
function extractBalancedTag(
  html: string,
  tagStartIndex: number,
  tagName: string
): { fullHtml: string; innerHtml: string; endIndex: number } | null {
  const openTagPattern = new RegExp(`^<${tagName}\\b[^>]*>`, 'i')
  const match = html.slice(tagStartIndex).match(openTagPattern)
  if (!match) return null

  const openTag = match[0]
  let depth = 1
  let cur = tagStartIndex + openTag.length
  const lower = html.toLowerCase()
  const openStr = `<${tagName.toLowerCase()}`
  const closeStr = `</${tagName.toLowerCase()}>`

  while (cur < html.length && depth > 0) {
    const nextOpen = lower.indexOf(openStr, cur)
    const nextClose = lower.indexOf(closeStr, cur)

    if (nextClose === -1) break

    if (nextOpen !== -1 && nextOpen < nextClose) {
      const charAfter = lower[nextOpen + openStr.length]
      if (charAfter === ' ' || charAfter === '>' || charAfter === '/') {
        depth++
        cur = nextOpen + openStr.length
        continue
      }
    }

    depth--
    if (depth === 0) {
      const fullEnd = nextClose + closeStr.length
      return {
        fullHtml: html.slice(tagStartIndex, fullEnd),
        innerHtml: html.slice(tagStartIndex + openTag.length, nextClose),
        endIndex: fullEnd,
      }
    }
    cur = nextClose + closeStr.length
  }
  return null
}

/**
 * Process WordPress Gutenberg Columns (wp-block-columns).
 * If columns contain a directory of internal links (> 5 links), convert into native internal-links block.
 * Otherwise, preserve as compound HTML block so other article content can be converted natively.
 */
function processWpBlockColumns(
  html: string,
  registerCompound: (block: any) => string
): string {
  const marker = 'wp-block-columns'
  let lower = html.toLowerCase()
  let idx = lower.indexOf(marker)

  while (idx !== -1) {
    const tagStart = html.lastIndexOf('<div', idx)
    if (tagStart === -1) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const balanced = extractBalancedTag(html, tagStart, 'div')
    if (!balanced) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const { fullHtml, innerHtml, endIndex } = balanced
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    const links: CollapsibleLinkItem[] = []
    let lm: RegExpExecArray | null
    while ((lm = linkRegex.exec(innerHtml)) !== null) {
      const href = lm[1]
      const text = lm[2].replace(/<[^>]+>/g, '').trim()
      if (href && text && !links.some((l) => l.href === href)) {
        links.push({ href, text })
      }
    }

    let replacement = ''
    if (links.length > 5) {
      replacement = registerCompound({
        type: 'internal-links',
        title: 'Indeks Tautan Internal Terkait (SEO Reference)',
        links,
      })
    } else {
      // Preserve this specific column container as an HTML block without aborting the rest of the article
      replacement = registerCompound({
        type: 'html',
        html: fullHtml,
      })
    }

    html = html.slice(0, tagStart) + replacement + html.slice(endIndex)
    lower = html.toLowerCase()
    idx = lower.indexOf(marker, tagStart + replacement.length)
  }

  return html
}

/**
 * Process WordPress Gutenberg Galleries (wp-block-gallery).
 * Extracts each inner image and registers them as native image blocks.
 */
function processWpBlockGalleries(
  html: string,
  registerCompound: (block: any) => string
): string {
  const marker = 'wp-block-gallery'
  let lower = html.toLowerCase()
  let idx = lower.indexOf(marker)

  while (idx !== -1) {
    const tagStart = html.lastIndexOf('<figure', idx)
    if (tagStart === -1) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const balanced = extractBalancedTag(html, tagStart, 'figure')
    if (!balanced) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const { innerHtml, endIndex } = balanced
    const imgRegex = /<img\b([^>]*)src=["']([^"']+)["']([^>]*)\/?>/gi
    const tokens: string[] = []
    let im: RegExpExecArray | null

    while ((im = imgRegex.exec(innerHtml)) !== null) {
      const fullTag = im[0]
      const src = im[2]
      const altMatch = fullTag.match(/alt=["']([^"']*)["']/i)
      const capMatch = innerHtml.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      tokens.push(
        registerCompound({
          type: 'image',
          url: src,
          alt: altMatch ? altMatch[1] : '',
          caption: capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : '',
          alignment: 'center',
        })
      )
    }

    const replacement = tokens.length > 0 ? tokens.join('\n\n') : ''
    html = html.slice(0, tagStart) + replacement + html.slice(endIndex)
    lower = html.toLowerCase()
    idx = lower.indexOf(marker, tagStart + replacement.length)
  }

  return html
}

/**
 * Process WordPress Gutenberg Buttons (wp-block-buttons / wp-block-button).
 * Converts styled button links into clean paragraphs with anchor tags.
 */
function processWpBlockButtons(html: string): string {
  const marker = 'wp-block-buttons'
  let lower = html.toLowerCase()
  let idx = lower.indexOf(marker)

  while (idx !== -1) {
    const tagStart = html.lastIndexOf('<div', idx)
    if (tagStart === -1) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const balanced = extractBalancedTag(html, tagStart, 'div')
    if (!balanced) {
      idx = lower.indexOf(marker, idx + marker.length)
      continue
    }

    const { innerHtml, endIndex } = balanced
    const btnRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    const links: string[] = []
    let bm: RegExpExecArray | null
    while ((bm = btnRegex.exec(innerHtml)) !== null) {
      const href = bm[1]
      const text = bm[2].replace(/<[^>]+>/g, '').trim()
      if (href && text) {
        links.push(`<p><a href="${href}">${text}</a></p>`)
      }
    }

    const replacement = links.length > 0 ? `\n\n${links.join('\n\n')}\n\n` : ''
    html = html.slice(0, tagStart) + replacement + html.slice(endIndex)
    lower = html.toLowerCase()
    idx = lower.indexOf(marker, tagStart + replacement.length)
  }

  return html
}

/**
 * Parse raw string/HTML/Markdown into block list
 */
export function contentToBlocks(raw: string): ContentBlock[] {
  let blockSeq = 0
  const createId = () => generateBlockId(`b${++blockSeq}`)

  if (!raw || !raw.trim()) {
    return [
      { id: createId(), type: 'heading2', text: 'Pengantar Arsitektur Modern' },
      { id: createId(), type: 'paragraph', text: 'Dalam era lanskap digital yang bergerak cepat, kinerja dan keandalan sistem web menjadi fondasi krusial bagi kesuksesan bisnis.' },
      { id: createId(), type: 'heading2', text: '1. Keunggulan Server-Side Rendering' },
      { id: createId(), type: 'paragraph', text: 'Dengan memadukan arsitektur Next.js App Router dan headless backend, halaman dapat disajikan dengan waktu muat di bawah satu detik.' },
      { id: createId(), type: 'quote', text: 'Kecepatan muat bukan sekadar fitur teknis, melainkan elemen pertama penentu kepuasan pengguna dan reputasi brand.' },
      { id: createId(), type: 'list', items: ['Selalu terapkan struktur heading semantik (H2 dan H3)', 'Optimasi aset gambar dengan format modern AVIF atau WebP', 'Pastikan metadata SEO lengkap sebelum artikel dipublikasikan'], ordered: false },
    ]
  }

  // Pre-extract already-collapsed internal links block to avoid fragmentation
  const existingLinks: CollapsibleLinkItem[] = []
  let internalLinksTitle = 'Indeks Tautan Internal Terkait (SEO Reference)'
  let workingRaw = raw

  // Clean browser/WordPress extension artifacts (<gwmw>)
  workingRaw = workingRaw.replace(/<gwmw\b[^>]*>[\s\S]*?<\/gwmw>/gi, '')
  workingRaw = workingRaw.replace(/<gwmw\b[^>]*\/?>/gi, '')

  // Normalize typography entities
  workingRaw = workingRaw
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')

  const detailsRegex = /<div[^>]*class=["'][^"']*article-internal-seo-links[^"']*["'][^>]*>[\s\S]*?<\/details>\s*<\/div>|<details[^>]*class=["'][^"']*(?:related-links|article-internal-seo-links)[^"']*["'][^>]*>[\s\S]*?<\/details>/gi
  workingRaw = workingRaw.replace(detailsRegex, (match) => {
    const summaryMatch = match.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
    if (summaryMatch) {
      const parsedTitle = summaryMatch[1].replace(/<[^>]+>/g, '').trim()
      if (parsedTitle) internalLinksTitle = parsedTitle
    }
    const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi
    let lm
    while ((lm = linkRegex.exec(match)) !== null) {
      const href = lm[2]
      const text = lm[3].replace(/<[^>]+>/g, '').trim()
      if (href && text && !existingLinks.some((l) => l.href === href)) {
        existingLinks.push({ href, text })
      }
    }
    return ''
  })

  // Clean HTML comments (including WordPress Gutenberg comments <!-- wp:... -->)
  workingRaw = workingRaw.replace(/<!--[\s\S]*?-->/g, '')

  // Pre-process WordPress Gutenberg buttons -> clean paragraph links
  workingRaw = processWpBlockButtons(workingRaw)

  // Pre-process: GFM Markdown tables -> HTML table blocks
  workingRaw = convertMarkdownTablesToHtml(workingRaw)

  // Pre-process: Markdown blockquotes -> HTML callouts or semantic blockquotes
  workingRaw = convertMarkdownBlockquotes(workingRaw)

  // Pre-process: Normalize adjacent headings & horizontal rules
  workingRaw = workingRaw.replace(/(^|[^\n])\n(#{1,6}\s+[^\n]+)/g, '$1\n\n$2')
  workingRaw = workingRaw.replace(/(#{1,6}\s+[^\n]+)\n([^\n])/g, '$1\n\n$2')
  workingRaw = workingRaw.replace(/(^|[^\n])\n(---|\*\*\*|___)\s*(\n|$)/g, '$1\n\n$2\n\n')

  const compoundMap = new Map<string, ContentBlock>()
  let compoundIndex = 0

  type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

  const registerCompound = (block: DistributiveOmit<ContentBlock, 'id'>): string => {
    const token = `___COMPOUND_TOKEN_${compoundIndex++}___`
    compoundMap.set(token, { ...block, id: createId() } as ContentBlock)
    return `\n\n${token}\n\n`
  }

  // Pre-process WordPress Gutenberg Galleries -> native image blocks
  workingRaw = processWpBlockGalleries(workingRaw, registerCompound)

  // Pre-process WordPress Gutenberg Columns -> native internal-links or compound HTML blocks
  workingRaw = processWpBlockColumns(workingRaw, registerCompound)

  // 1. FAQ blocks (div.faq-item or details.faq-item)
  workingRaw = workingRaw.replace(
    /<div[^>]*class=["'][^"']*faq-item[^"']*["'][^>]*>[\s\S]*?<\/div>|<details[^>]*class=["'][^"']*faq-item[^"']*["'][^>]*>[\s\S]*?<\/details>/gi,
    (match) => {
      const qMatch = match.match(/<h[45][^>]*>([\s\S]*?)<\/h[45]>/i) || match.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
      const aMatch = match.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
      const question = qMatch ? qMatch[1].replace(/<[^>]+>/g, '').trim() : 'Pertanyaan'
      const answer = aMatch ? preserveInlineElements(aMatch[1]) : ''
      return registerCompound({ type: 'faq', question, answer })
    }
  )

  // 2. Video wrapper blocks (div.article-video-wrapper or standalone iframe)
  workingRaw = workingRaw.replace(
    /<div[^>]*class=["'][^"']*article-video-wrapper[^"']*["'][^>]*>[\s\S]*?<\/div>|<iframe[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (match) => {
      const srcMatch = match.match(/src=["']([^"']+)["']/i)
      const titleMatch = match.match(/title=["']([^"']*)["']/i)
      const url = srcMatch ? srcMatch[1] : ''
      return registerCompound({
        type: 'video',
        url,
        title: titleMatch ? titleMatch[1] : 'Video Embed',
        embedUrl: extractEmbedUrl(url),
      })
    }
  )

  // 3. Table blocks (both HTML table wrapper and raw table) -> parse into Notion-style TableBlock if structured
  workingRaw = workingRaw.replace(
    /<div[^>]*class=["'][^"']*article-table-wrapper[\s\S]*?<\/div>|<table\b[\s\S]*?<\/table>/gi,
    (match) => {
      const parsedTable = parseHtmlTableToTableBlock(match)
      if (parsedTable) {
        return registerCompound(parsedTable)
      }
      return registerCompound({ type: 'html', html: match.trim() })
    }
  )

  // 3b. Callout blocks -> preserve intact as custom HTML block
  workingRaw = workingRaw.replace(
    /<blockquote[^>]*class=["'][^"']*article-callout[\s\S]*?<\/blockquote>/gi,
    (match) => {
      return registerCompound({ type: 'html', html: match.trim() })
    }
  )

  // 4. Code blocks (<pre><code ...>...</code></pre>)
  workingRaw = workingRaw.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const langMatch = match.match(/class=["'][^"']*language-([a-z0-9_-]+)/i)
    const codeMatch = match.match(/<code[^>]*>([\s\S]*?)<\/code>/i)
    let rawCode = codeMatch ? codeMatch[1] : match.replace(/<\/?pre[^>]*>/gi, '')
    // Decode common entities
    rawCode = rawCode
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return registerCompound({
      type: 'code',
      code: rawCode.trim(),
      language: langMatch ? langMatch[1] : 'typescript',
    })
  })

  // 5. Blockquote blocks (<blockquote>...<cite>...</cite>...</blockquote>)
  workingRaw = workingRaw.replace(/<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/gi, (match) => {
    const citeMatch = match.match(/<cite[^>]*>(?:—|–|-)?\s*([\s\S]*?)<\/cite>/i)
    const author = citeMatch ? citeMatch[1].replace(/^[—–-]\s*/, '').replace(/<[^>]+>/g, '').trim() : undefined
    let body = match.replace(/<cite[\s\S]*?<\/cite>/gi, '')
    body = body
      .replace(/<\/?blockquote[^>]*>/gi, '')
      .replace(/<\/?p[^>]*>/gi, '')
      .replace(/^(&ldquo;|&#8220;|["“”'«])\s*/i, '')
      .replace(/\s*(&rdquo;|&#8221;|["“”'»])$/i, '')
      .trim()
    const text = preserveInlineElements(body)
    return registerCompound({ type: 'quote', text, author })
  })

  // 6. Figure / Image blocks (<figure>...<img .../><figcaption>...</figcaption></figure>)
  workingRaw = workingRaw.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (match) => {
    const srcMatch = match.match(/<img[^>]*src=["']([^"']+)["']/i)
    const altMatch = match.match(/alt=["']([^"']*)["']/i)
    const capMatch = match.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
    const isFull = /class=["'][^"']*w-full[^"']*["']/i.test(match)
    return registerCompound({
      type: 'image',
      url: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
      caption: capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : '',
      alignment: isFull ? 'full' : 'center',
    })
  })

  // 7. Standalone Images (<img ... /> not inside figure)
  workingRaw = workingRaw.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (match) => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i)
    const altMatch = match.match(/alt=["']([^"']*)["']/i)
    return registerCompound({
      type: 'image',
      url: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
      caption: '',
      alignment: 'center',
    })
  })

  // 8. Lists (<ul> and <ol>)
  workingRaw = workingRaw.replace(/<(?:ul|ol)\b[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi, (match, inner) => {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    const items: string[] = []
    let liMatch: RegExpExecArray | null
    while ((liMatch = liRegex.exec(inner)) !== null) {
      if (liMatch[1]) {
        items.push(preserveInlineElements(liMatch[1]))
      }
    }
    if (items.length > 0) {
      // Check for SEO internal-links block pattern (> 5 pure links)
      const totalLinks = items.filter((it) => /<a\s+[^>]*href=/i.test(it)).length
      if (totalLinks > 5) {
        const links: CollapsibleLinkItem[] = []
        const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi
        for (const item of items) {
          let lm
          while ((lm = linkRegex.exec(item)) !== null) {
            const href = lm[2]
            const text = lm[3].replace(/<[^>]+>/g, '').trim()
            if (href && text && !links.some((l) => l.href === href)) {
              links.push({ href, text })
            }
          }
        }
        if (links.length > 5) {
          return registerCompound({
            type: 'internal-links',
            title: 'Indeks Tautan Internal Terkait (SEO Reference)',
            links,
          })
        }
      }
      return registerCompound({
        type: 'list',
        items,
        ordered: /<ol\b/i.test(match),
      })
    }
    return ''
  })

  // Unwrap generic wrapper divs and semantic containers (article, section, main, div)
  workingRaw = workingRaw
    .replace(/<\/?(?:article|section|main)\b[^>]*>/gi, '\n\n')
    .replace(/<\/?div\b[^>]*>/gi, '\n\n')

  // Split remaining paragraphs, headings, dividers, and tokens
  const parts = workingRaw
    .split(/(?<=<\/(?:p|h[1-6])>)|(?<=<hr[^>]*\/?>)|\n\n/i)
    .map((s) => s.trim())
    .filter(Boolean)

  const rawBlocks: ContentBlock[] = []

  for (const part of parts) {
    // Check if part is a registered compound token
    const tokenMatch = part.match(/___COMPOUND_TOKEN_\d+___/)
    if (tokenMatch) {
      const compoundBlock = compoundMap.get(tokenMatch[0])
      if (compoundBlock) {
        rawBlocks.push(compoundBlock)
        continue
      }
    }

    const id = createId()

    // Heading 1 & Heading 2 -> heading2 block
    if (/^<h[12][^>]*>(.*?)<\/h[12]>/i.test(part) || /^#{1,2}\s+(.*)/i.test(part)) {
      const match = part.match(/^<h[12][^>]*>(.*?)<\/h[12]>/i)
      const rawText = match ? match[1] : part.replace(/^#{1,2}\s+/, '')
      const text = cleanHeadingText(rawText)
      if (text) {
        rawBlocks.push({ id, type: 'heading2', text })
        continue
      }
    }

    // Heading 3, 4, 5, 6 -> heading3 block
    if (/^<h[3456][^>]*>(.*?)<\/h[3456]>/i.test(part) || /^#{3,6}\s+(.*)/i.test(part)) {
      const match = part.match(/^<h[3456][^>]*>(.*?)<\/h[3456]>/i)
      const rawText = match ? match[1] : part.replace(/^#{3,6}\s+/, '')
      const text = cleanHeadingText(rawText)
      if (text) {
        rawBlocks.push({ id, type: 'heading3', text })
        continue
      }
    }

    // Markdown Quote fallback
    if (/^>\s+(.*)/i.test(part)) {
      const text = part.replace(/^>\s+/, '').replace(/^["“”]/, '').replace(/["“”]$/, '').trim()
      rawBlocks.push({ id, type: 'quote', text: convertInlineMarkdown(text) })
      continue
    }

    // Markdown List fallback (bullet or ordered)
    if (/^[-*•+]\s+/m.test(part) || /^\d+\.\s+/m.test(part)) {
      const isOrdered = /^\d+\.\s+/m.test(part)
      const items = part
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => (isOrdered ? /^\d+\.\s+/.test(l) : /^[-*•+]\s+/.test(l)))
        .map((l) => l.replace(isOrdered ? /^\d+\.\s+/ : /^[-*•+]\s*/, '').trim())
        .map((l) => preserveInlineElements(l))
      if (items.length > 0) {
        rawBlocks.push({ id, type: 'list', items, ordered: isOrdered })
        continue
      }
    }

    // Markdown Code fallback
    if (/^```/m.test(part)) {
      const langMatch = part.match(/^```([a-z0-9_-]+)/i)
      const code = part.replace(/^```[a-z0-9_-]*\n?/i, '').replace(/\n?```$/i, '')
      rawBlocks.push({
        id,
        type: 'code',
        code: code.trim(),
        language: langMatch ? langMatch[1] : 'typescript',
      })
      continue
    }

    // Divider
    if (part.includes('<hr') || part === '---') {
      rawBlocks.push({ id, type: 'divider' })
      continue
    }

    // Default: Paragraph (pertahankan inline link <a>, <strong>, <em>, <u>, <code>, dll)
    const cleanText = preserveInlineElements(part)
    const textOnly = cleanText.replace(/<[^>]+>/g, '').replace(/[\s\u00A0]+/g, ' ').trim()
    if (cleanText && (textOnly.length > 0 || /<(?:img|iframe|a)\b/i.test(cleanText))) {
      rawBlocks.push({ id, type: 'paragraph', text: cleanText })
    } else if (part.trim() && /<[^>]+>/.test(part) && textOnly.length > 0) {
      rawBlocks.push({ id, type: 'html', html: part.trim() })
    }
  }

  // Kelompokkan paragraf link berurutan (>= 5 paragraf berurutan yang isinya link murni) ke dalam satu internal-links block
  const finalBlocks: ContentBlock[] = []
  let linkRun: ParagraphBlock[] = []

  const flushLinkRun = () => {
    if (linkRun.length >= 5) {
      const links: CollapsibleLinkItem[] = []
      const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi
      for (const p of linkRun) {
        let lm
        while ((lm = linkRegex.exec(p.text)) !== null) {
          const href = lm[2]
          const text = lm[3].replace(/<[^>]+>/g, '').trim()
          if (href && text && !links.some((l) => l.href === href)) {
            links.push({ href, text })
          }
        }
      }
      if (links.length >= 5) {
        finalBlocks.push({
          id: createId(),
          type: 'internal-links',
          title: 'Indeks Tautan Internal Terkait (SEO Reference)',
          links,
        })
      } else {
        finalBlocks.push(...linkRun)
      }
    } else {
      finalBlocks.push(...linkRun)
    }
    linkRun = []
  }

  for (const block of rawBlocks) {
    if (block.type === 'paragraph') {
      const isPureLink =
        /^<a\b[^>]*>[\s\S]*?<\/a>$/i.test(block.text) ||
        (/<a\s+[^>]*href=/i.test(block.text) && block.text.replace(/<[^>]+>/g, '').trim().length < 80)
      if (isPureLink) {
        linkRun.push(block)
        continue
      }
    }
    flushLinkRun()
    finalBlocks.push(block)
  }
  flushLinkRun()

  // Jika terdapat tautan yang sebelumnya sudah berada dalam container <details>, sertakan ke dalam blok
  if (existingLinks.length > 0) {
    finalBlocks.push({
      id: createId(),
      type: 'internal-links',
      title: internalLinksTitle,
      links: existingLinks,
    })
  }

  return finalBlocks.length > 0
    ? finalBlocks
    : [{ id: '1', type: 'paragraph', text: 'Tulis paragraf artikel Anda di sini...' }]
}

/**
 * Membersihkan tag pembungkus luar namun mempertahankan elemen inline
 * seperti tautan <a>, <strong>, <em>, dan <code> untuk SEO & formatting.
 */
export function preserveInlineElements(html: string): string {
  if (!html) return ''
  const withMarkdownConverted = convertInlineMarkdown(html)
  return withMarkdownConverted
    .replace(/<gwmw\b[^>]*>[\s\S]*?<\/gwmw>/gi, '')
    .replace(/<gwmw\b[^>]*\/?>/gi, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/^<p[^>]*>/i, '')
    .replace(/<\/p>$/i, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(?!(\/?(a|strong|b|em|i|u|s|del|code|span|br|mark|sub|sup)\b))[^>]+>/gi, '')
    .trim()
}

// -----------------------------------------------------------------------------
// Real-time SEO Scoring Engine (openSEO / Yoast style)
// -----------------------------------------------------------------------------

export interface SeoIndicator {
  id: string
  label: string
  status: 'good' | 'warning' | 'bad' // Green / Yellow / Red
  message: string
  value?: string | number
}

export interface SeoAuditReport {
  score: number // 0 - 100
  grade: 'Sangat Baik' | 'Cukup' | 'Perlu Perbaikan'
  targetKeyword: string
  indicators: SeoIndicator[]
}

export function calculateSeoScore(params: {
  title: string
  excerpt: string
  content: string
  targetKeyword: string
  blocks?: ContentBlock[]
}): SeoAuditReport {
  const { title, excerpt, content, targetKeyword, blocks = [] } = params
  const kw = targetKeyword.trim().toLowerCase()
  const indicators: SeoIndicator[] = []

  // Extract clean text
  const cleanContentText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = cleanContentText.split(/\s+/).filter(Boolean)
  const totalWords = words.length

  // 1. Keyword in Title (H1)
  if (!kw) {
    indicators.push({
      id: 'kw-title',
      label: 'Target Kata Kunci di Judul (H1)',
      status: 'warning',
      message: 'Tentukan kata kunci target di panel untuk evaluasi SEO.',
    })
  } else if (title.toLowerCase().includes(kw)) {
    indicators.push({
      id: 'kw-title',
      label: 'Target Kata Kunci di Judul (H1)',
      status: 'good',
      message: `Kata kunci "${targetKeyword}" ditemukan di judul.`,
    })
  } else {
    indicators.push({
      id: 'kw-title',
      label: 'Target Kata Kunci di Judul (H1)',
      status: 'bad',
      message: `Kata kunci "${targetKeyword}" belum ada di judul artikel.`,
    })
  }

  // 2. Keyword in First Paragraph
  const firstParagraph = blocks.find((b) => b.type === 'paragraph') as ParagraphBlock | undefined
  const firstParaText = (firstParagraph?.text || cleanContentText.slice(0, 300)).toLowerCase()
  if (!kw) {
    indicators.push({
      id: 'kw-first-para',
      label: 'Kata Kunci di Paragraf Pertama',
      status: 'warning',
      message: 'Masukkan kata kunci untuk memeriksa paragraf pembuka.',
    })
  } else if (firstParaText.includes(kw)) {
    indicators.push({
      id: 'kw-first-para',
      label: 'Kata Kunci di Paragraf Pertama',
      status: 'good',
      message: 'Kata kunci muncul pada paragraf pembuka artikel.',
    })
  } else {
    indicators.push({
      id: 'kw-first-para',
      label: 'Kata Kunci di Paragraf Pertama',
      status: 'bad',
      message: 'Sertakan kata kunci pada 100 kata pertama tulisan.',
    })
  }

  // 3. Image Alt-Text Presence
  const imageBlocks = blocks.filter((b) => b.type === 'image') as ImageBlock[]
  const htmlImgAlts = content.match(/<img[^>]*alt="[^"]*"/gi) || []
  const totalImages = imageBlocks.length || htmlImgAlts.length
  const missingAltCount = imageBlocks.filter((img) => !img.alt.trim()).length

  if (totalImages === 0) {
    indicators.push({
      id: 'img-alt',
      label: 'Atribut Alt-Text Gambar',
      status: 'warning',
      message: 'Belum ada gambar disisipkan. Sisipkan gambar pendukung dengan alt-text.',
    })
  } else if (missingAltCount === 0) {
    indicators.push({
      id: 'img-alt',
      label: 'Atribut Alt-Text Gambar',
      status: 'good',
      message: `Semua ${totalImages} gambar telah memiliki deskripsi Alt-Text.`,
    })
  } else {
    indicators.push({
      id: 'img-alt',
      label: 'Atribut Alt-Text Gambar',
      status: 'bad',
      message: `${missingAltCount} gambar belum memiliki Alt-Text (penting untuk aksesibilitas & SEO).`,
    })
  }

  // 4. Keyword Density & Stuffing Prevention
  if (!kw) {
    indicators.push({
      id: 'kw-density',
      label: 'Kepadatan Kata Kunci (Density)',
      status: 'warning',
      message: 'Menunggu input target kata kunci.',
    })
  } else {
    const kwRegex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi')
    const matches = cleanContentText.match(kwRegex) || []
    const occurrences = matches.length
    const densityPercent = totalWords > 0 ? (occurrences / totalWords) * 100 : 0
    const rounded = Math.round(densityPercent * 10) / 10

    if (densityPercent > 3.0) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Kata Kunci (Density)',
        status: 'bad',
        message: `Terlalu tinggi (${rounded}% - ${occurrences} kali)! Berpotensi terdeteksi spam/keyword stuffing oleh AI Google.`,
        value: `${rounded}%`,
      })
    } else if (densityPercent >= 0.8 && densityPercent <= 2.5) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Kata Kunci (Density)',
        status: 'good',
        message: `Kepadatan optimal (${rounded}% - ${occurrences} kali dari ${totalWords} kata).`,
        value: `${rounded}%`,
      })
    } else if (occurrences > 0) {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Kata Kunci (Density)',
        status: 'warning',
        message: `Kepadatan agak rendah (${rounded}% - ${occurrences} kali). Tambahkan penyebutan alami.`,
        value: `${rounded}%`,
      })
    } else {
      indicators.push({
        id: 'kw-density',
        label: 'Kepadatan Kata Kunci (Density)',
        status: 'bad',
        message: 'Kata kunci belum ditemukan di dalam isi artikel.',
        value: '0%',
      })
    }
  }

  // 5. Internal Links
  const internalLinksRegex = /href=["'](?:\/|\/layanan|\/portofolio|\/solusi|\/artikel|\/kontak|https?:\/\/(?:www\.)?unimasi\.com)[^"']*["']/gi
  const internalLinks = content.match(internalLinksRegex) || []
  if (internalLinks.length >= 2) {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal (Internal Links)',
      status: 'good',
      message: `Terdeteksi ${internalLinks.length} tautan internal ke ekosistem UNIMASI.`,
      value: internalLinks.length,
    })
  } else if (internalLinks.length === 1) {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal (Internal Links)',
      status: 'warning',
      message: 'Disarankan menambah minimal 1 tautan internal ke layanan atau studi kasus.',
      value: internalLinks.length,
    })
  } else {
    indicators.push({
      id: 'internal-links',
      label: 'Tautan Internal (Internal Links)',
      status: 'bad',
      message: 'Belum ada tautan internal. Tautkan ke layanan / portofolio relevan.',
      value: 0,
    })
  }

  // 6. External Links
  const externalLinksRegex = /href=["']https?:\/\/(?!www\.unimasi\.com|unimasi\.com|localhost)[^"']+["']/gi
  const externalLinks = content.match(externalLinksRegex) || []
  if (externalLinks.length >= 1) {
    indicators.push({
      id: 'external-links',
      label: 'Tautan Eksternal / Referensi',
      status: 'good',
      message: `Terdeteksi ${externalLinks.length} tautan rujukan eksternal.`,
      value: externalLinks.length,
    })
  } else {
    indicators.push({
      id: 'external-links',
      label: 'Tautan Eksternal / Referensi',
      status: 'warning',
      message: 'Menyertakan 1-2 sumber otoritatif dapat meningkatkan kredibilitas artikel.',
      value: 0,
    })
  }

  // 7. Title Length
  const titleLen = title.length
  if (titleLen >= 40 && titleLen <= 70) {
    indicators.push({
      id: 'title-len',
      label: 'Panjang Karakter Judul',
      status: 'good',
      message: `Ideal (${titleLen} karakter, standar Google 40–70 karakter).`,
      value: `${titleLen} char`,
    })
  } else if (titleLen >= 20 && titleLen < 40) {
    indicators.push({
      id: 'title-len',
      label: 'Panjang Karakter Judul',
      status: 'warning',
      message: `Agak pendek (${titleLen} karakter). Disarankan 40–70 karakter.`,
      value: `${titleLen} char`,
    })
  } else {
    indicators.push({
      id: 'title-len',
      label: 'Panjang Karakter Judul',
      status: 'bad',
      message: `Kurang optimal (${titleLen} karakter). Buat judul yang lebih spesifik.`,
      value: `${titleLen} char`,
    })
  }

  // 8. Meta Description / Excerpt Length
  const excerptLen = excerpt.length
  if (excerptLen >= 120 && excerptLen <= 160) {
    indicators.push({
      id: 'excerpt-len',
      label: 'Panjang Meta Description',
      status: 'good',
      message: `Sempurna (${excerptLen} karakter, ideal Google 120–160).`,
      value: `${excerptLen} char`,
    })
  } else if (excerptLen >= 60 && excerptLen < 120) {
    indicators.push({
      id: 'excerpt-len',
      label: 'Panjang Meta Description',
      status: 'warning',
      message: `Agak pendek (${excerptLen}/160 karakter). Perkaya ringkasan Anda.`,
      value: `${excerptLen} char`,
    })
  } else {
    indicators.push({
      id: 'excerpt-len',
      label: 'Panjang Meta Description',
      status: 'bad',
      message: excerptLen === 0 ? 'Meta description masih kosong.' : `Panjang (${excerptLen} karakter) melebihi batas 160 char Google.`,
      value: `${excerptLen} char`,
    })
  }

  // 9. Content Word Count
  if (totalWords >= 600) {
    indicators.push({
      id: 'content-words',
      label: 'Panjang Kata Artikel',
      status: 'good',
      message: `Lengkap & komprehensif (${totalWords} kata, melebihi target 600 kata).`,
      value: `${totalWords} kata`,
    })
  } else if (totalWords >= 300) {
    indicators.push({
      id: 'content-words',
      label: 'Panjang Kata Artikel',
      status: 'warning',
      message: `Cukup (${totalWords} kata), idealnya 600+ kata untuk topik teknis.`,
      value: `${totalWords} kata`,
    })
  } else {
    indicators.push({
      id: 'content-words',
      label: 'Panjang Kata Artikel',
      status: 'bad',
      message: `Terlalu singkat (${totalWords} kata). Minimal 300 kata agar tidak dianggap thin content.`,
      value: `${totalWords} kata`,
    })
  }

  // Calculate Numerical Score (0 - 100)
  let score = 0
  indicators.forEach((ind) => {
    if (ind.status === 'good') score += 11.1
    else if (ind.status === 'warning') score += 5.5
  })
  score = Math.min(100, Math.round(score))

  let grade: 'Sangat Baik' | 'Cukup' | 'Perlu Perbaikan' = 'Perlu Perbaikan'
  if (score >= 80) grade = 'Sangat Baik'
  else if (score >= 55) grade = 'Cukup'

  return {
    score,
    grade,
    targetKeyword,
    indicators,
  }
}
