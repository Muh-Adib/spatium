/**
 * Pure helpers that create and convert article editor blocks.
 *
 * New blocks start empty (placeholders live in the UI, not in the content) so nothing
 * invented ever gets saved by accident — see AGENTS.md §3.3 (zero fictional data).
 */
import { generateBlockId, type BlockType, type ContentBlock } from './blockEditor'

export function createBlock(type: BlockType, id: string = generateBlockId('b')): ContentBlock {
  switch (type) {
    case 'heading2':
      return { id, type: 'heading2', text: '' }
    case 'heading3':
      return { id, type: 'heading3', text: '' }
    case 'image':
      return { id, type: 'image', url: '', alt: '', caption: '', alignment: 'center' }
    case 'video':
      return { id, type: 'video', url: '', title: '', embedUrl: '' }
    case 'quote':
      return { id, type: 'quote', text: '', author: '' }
    case 'list':
      return { id, type: 'list', items: [''], ordered: false }
    case 'faq':
      return { id, type: 'faq', question: '', answer: '' }
    case 'code':
      return { id, type: 'code', code: '', language: 'typescript' }
    case 'html':
      return { id, type: 'html', html: '' }
    case 'divider':
      return { id, type: 'divider' }
    case 'internal-links':
      return { id, type: 'internal-links', title: '', links: [] }
    case 'table':
      return { id, type: 'table', headers: ['Kolom 1', 'Kolom 2'], rows: [['', '']] }
    case 'paragraph':
      return { id, type: 'paragraph', text: '' }
    default: {
      const unreachable: never = type
      return unreachable
    }
  }
}

/** Plain-text projection of a block, used when converting it to another type. */
function blockText(block: ContentBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading2':
    case 'heading3':
    case 'quote':
      return block.text
    case 'list':
      return block.items.join('\n')
    case 'code':
      return block.code
    case 'faq':
      return `${block.question}\n${block.answer}`
    case 'table':
      return [block.headers.join(' | '), ...block.rows.map((r) => r.join(' | '))].join('\n')
    case 'html':
      return block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    default:
      return ''
  }
}

/** Convert a block to another type, keeping its id and as much text as the target can hold. */
export function convertBlock(block: ContentBlock, targetType: BlockType): ContentBlock {
  if (block.type === targetType) return block
  const text = blockText(block)
  const id = block.id
  switch (targetType) {
    case 'heading2':
      return { id, type: 'heading2', text }
    case 'heading3':
      return { id, type: 'heading3', text }
    case 'quote':
      return { id, type: 'quote', text, author: block.type === 'quote' ? block.author : '' }
    case 'list': {
      const items = text
        .split('\n')
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(Boolean)
      return { id, type: 'list', items: items.length > 0 ? items : [''], ordered: false }
    }
    case 'code':
      return { id, type: 'code', code: text.replace(/<[^>]*>/g, ''), language: 'typescript' }
    case 'table':
      return { id, type: 'table', headers: ['Kolom 1', 'Kolom 2'], rows: [[text, '']] }
    case 'html':
      return { id, type: 'html', html: text ? `<p>${text}</p>` : '' }
    case 'paragraph':
      return { id, type: 'paragraph', text }
    default:
      return createBlock(targetType, id)
  }
}

/** Image blocks that will be published (have a URL), in document order. */
export function publishableImageBlocks(blocks: ContentBlock[]): Array<Extract<ContentBlock, { type: 'image' }>> {
  return blocks.filter((b): b is Extract<ContentBlock, { type: 'image' }> => b.type === 'image' && Boolean(b.url))
}
