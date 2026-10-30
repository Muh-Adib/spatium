/**
 * SEGIA SEO Text Extractor from Visual Blocks (L3-T7)
 * Extracts textual content, headings, and image accessibility data from visual block arrays
 * for SEO analysis, readability scoring, and snippet generation.
 */

export interface ExtractedSeoText {
  headings: Array<{ level: number; text: string }>
  paragraphs: string[]
  fullText: string
  wordCount: number
  imageCount: number
  imagesWithoutAlt: string[]
}

/**
 * Traverses visual block array and extracts clean text strings for SEO analysis.
 */
export function blocksToSeoText(blocks: any[]): ExtractedSeoText {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      headings: [],
      paragraphs: [],
      fullText: '',
      wordCount: 0,
      imageCount: 0,
      imagesWithoutAlt: [],
    }
  }

  const headings: Array<{ level: number; text: string }> = []
  const paragraphs: string[] = []
  let imageCount = 0
  const imagesWithoutAlt: string[] = []

  const checkImage = (src?: string, alt?: string, context?: string) => {
    if (!src || typeof src !== 'string' || !src.trim()) return
    imageCount++
    if (!alt || typeof alt !== 'string' || alt.trim().length < 3) {
      imagesWithoutAlt.push(context ? `${context}: ${src}` : src)
    }
  }

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue

    // 1. Headings & Titles
    if (block.title && typeof block.title === 'string' && block.title.trim()) {
      headings.push({ level: 2, text: block.title.trim() })
    }
    if (block.name && typeof block.name === 'string' && block.name.trim()) {
      headings.push({ level: 1, text: block.name.trim() })
    }
    if (block.subtitle && typeof block.subtitle === 'string' && block.subtitle.trim()) {
      paragraphs.push(block.subtitle.trim())
    }
    if (block.description && typeof block.description === 'string' && block.description.trim()) {
      paragraphs.push(block.description.trim())
    }
    if (block.text && typeof block.text === 'string' && block.text.trim()) {
      if (block.type === 'heading2') {
        headings.push({ level: 2, text: block.text.trim() })
      } else if (block.type === 'heading3') {
        headings.push({ level: 3, text: block.text.trim() })
      } else {
        paragraphs.push(block.text.trim())
      }
    }

    // 2. Images & Alt text
    if (block.heroImage) checkImage(block.heroImage, block.heroImageAlt || block.alt, `Blok ${block.type} (heroImage)`)
    if (block.image) checkImage(block.image, block.alt || block.imageAlt, `Blok ${block.type} (image)`)

    // 3. Nested Items (Galleries, Bento items, FAQs, etc.)
    if (Array.isArray(block.items)) {
      for (const item of block.items) {
        if (!item || typeof item !== 'object') continue
        if (item.title) paragraphs.push(item.title)
        if (item.desc || item.description) paragraphs.push(item.desc || item.description)
        if (item.image) checkImage(item.image, item.alt, `Item Galeri: ${item.title || 'Untitled'}`)
      }
    }

    if (Array.isArray(block.features)) {
      for (const f of block.features) {
        if (!f || typeof f !== 'object') continue
        if (f.title) paragraphs.push(f.title)
        if (f.description || f.desc) paragraphs.push(f.description || f.desc)
        if (f.image) checkImage(f.image, f.alt, `Fitur Bento: ${f.title || 'Untitled'}`)
      }
    }

    if (Array.isArray(block.faqs)) {
      for (const faq of block.faqs) {
        if (!faq || typeof faq !== 'object') continue
        if (faq.q || faq.question) paragraphs.push(faq.q || faq.question)
        if (faq.a || faq.answer) paragraphs.push(faq.a || faq.answer)
      }
    }

    if (Array.isArray(block.layers)) {
      for (const layer of block.layers) {
        if (!layer || typeof layer !== 'object') continue
        if (layer.title) paragraphs.push(layer.title)
        if (layer.desc) paragraphs.push(layer.desc)
        if (layer.tech) paragraphs.push(layer.tech)
      }
    }

    if (Array.isArray(block.rows)) {
      for (const row of block.rows) {
        if (!row || typeof row !== 'object') continue
        if (row.feature) paragraphs.push(row.feature)
        if (row.segia) paragraphs.push(row.segia)
        if (row.traditional) paragraphs.push(row.traditional)
      }
    }

    if (Array.isArray(block.phases)) {
      for (const p of block.phases) {
        if (!p || typeof p !== 'object') continue
        if (p.name) paragraphs.push(p.name)
        if (p.summary) paragraphs.push(p.summary)
      }
    }
  }

  const allTextParts = [
    ...headings.map((h) => h.text),
    ...paragraphs,
  ]
  const fullText = allTextParts.join(' ')
  const words = fullText.trim().split(/\s+/).filter(Boolean)

  return {
    headings,
    paragraphs,
    fullText,
    wordCount: words.length,
    imageCount,
    imagesWithoutAlt,
  }
}
