import { describe, it, expect } from 'vitest'
import {
  articleEditorReducer,
  articleToDoc,
  createEmptyDoc,
  localDraftDiffers,
  parseLocalDraft,
  resolveSeoTemplate,
  serializeLocalDraft,
  setFieldAction,
  slugify,
  type ArticleEditorState,
} from '../src/lib/articles/editorState'
import { convertBlock, createBlock, publishableImageBlocks } from '../src/lib/articles/blockFactory'
import { blocksToContent, contentToBlocks, type ContentBlock } from '../src/lib/articles/blockEditor'

const fresh = (): ArticleEditorState => ({ doc: createEmptyDoc('QA'), isDirty: false, slugTouched: false })

describe('article editor reducer', () => {
  it('marks the document dirty on field changes and ignores no-op sets', () => {
    const s0 = fresh()
    expect(articleEditorReducer(s0, setFieldAction('title', ''))).toBe(s0)
    const s1 = articleEditorReducer(s0, setFieldAction('title', 'Halo'))
    expect(s1.doc.title).toBe('Halo')
    expect(s1.isDirty).toBe(true)
  })

  it('auto-derives the slug until the user edits it by hand', () => {
    let s = articleEditorReducer(fresh(), { type: 'autoSlug', slug: 'halo-dunia' })
    expect(s.doc.slug).toBe('halo-dunia')
    expect(s.isDirty).toBe(false)
    s = articleEditorReducer(s, { type: 'setSlug', slug: 'custom' })
    s = articleEditorReducer(s, { type: 'autoSlug', slug: 'other' })
    expect(s.doc.slug).toBe('custom')
  })

  it('remembers schema type changes so the saved schema is replaced', () => {
    const s = articleEditorReducer(fresh(), setFieldAction('schemaType', 'TechArticle'))
    expect(s.doc.schemaChanged).toBe(true)
  })

  it('keeps untouched block identities when one block is updated (row memoization)', () => {
    const a: ContentBlock = { id: 'a', type: 'paragraph', text: 'a' }
    const b: ContentBlock = { id: 'b', type: 'paragraph', text: 'b' }
    let s = articleEditorReducer(fresh(), { type: 'load', doc: { ...createEmptyDoc(), blocks: [a, b] } })
    s = articleEditorReducer(s, { type: 'updateBlocks', update: (prev) => prev.map((x) => (x.id === 'b' ? { ...x, text: 'B' } : x)) })
    expect(s.doc.blocks[0]).toBe(a)
    expect(s.doc.blocks[1]).not.toBe(b)
    expect(s.isDirty).toBe(true)
  })

  it('clears dirty on markSaved', () => {
    let s = articleEditorReducer(fresh(), setFieldAction('title', 'x'))
    s = articleEditorReducer(s, { type: 'markSaved', patch: { status: 'published' } })
    expect(s.isDirty).toBe(false)
    expect(s.doc.status).toBe('published')
  })
})

describe('slug + SEO template helpers', () => {
  it('slugifies titles to the API slug format', () => {
    expect(slugify('  Digital Twin: Gaussian Splatting 101! ')).toBe('digital-twin-gaussian-splatting-101')
    expect(slugify('snake_case & spaces')).toMatch(/^[a-z0-9-]+$/)
  })

  it('resolves template variables', () => {
    expect(resolveSeoTemplate('%title% %sep% %sitename%', { title: 'A', siteName: 'SPATIUM', category: 'X' })).toBe('A — SPATIUM')
  })
})

describe('local draft envelope', () => {
  it('round-trips and rejects foreign data', () => {
    const doc = { ...createEmptyDoc(), title: 'Draf', blocks: [{ id: 'x', type: 'paragraph' as const, text: 'isi' }] }
    const parsed = parseLocalDraft(serializeLocalDraft(doc, '2026-01-01T00:00:00.000Z'))
    expect(parsed?.doc.title).toBe('Draf')
    expect(parsed?.serverUpdatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(parseLocalDraft('{"v":2}')).toBeNull()
    expect(parseLocalDraft('not json')).toBeNull()
    expect(parseLocalDraft(null)).toBeNull()
  })

  it('detects meaningful differences only', () => {
    const a = { ...createEmptyDoc(), title: 'A' }
    expect(localDraftDiffers(a, { ...a })).toBe(false)
    expect(localDraftDiffers(a, { ...a, title: 'B' })).toBe(true)
  })
})

describe('articleToDoc', () => {
  it('maps a server article without throwing on missing fields', () => {
    const doc = articleToDoc(
      {
        title: 'Judul',
        slug: 'judul',
        category: { name: 'Riset' },
        author: { name: 'Ana' },
        status: 'in_review',
        content: '<h2>Bagian</h2><p>Isi</p>',
        seo: { robots: { index: false, follow: true } },
      },
      'fallback',
      'QA',
    )
    expect(doc.category).toBe('Riset')
    expect(doc.author).toBe('Ana')
    expect(doc.status).toBe('in_review')
    expect(doc.robots).toEqual({ index: false, follow: true, noarchive: undefined, nosnippet: undefined })
    expect(doc.blocks.map((b) => b.type)).toEqual(['heading2', 'paragraph'])
    expect(articleToDoc({}, 'fb', 'QA').slug).toBe('fb')
  })
})

describe('block factory', () => {
  it('creates empty blocks (no invented content)', () => {
    const quote = createBlock('quote', 'q')
    expect(quote).toEqual({ id: 'q', type: 'quote', text: '', author: '' })
    expect(createBlock('internal-links', 'l')).toMatchObject({ links: [] })
  })

  it('never serializes an image or video without a source', () => {
    expect(blocksToContent([createBlock('image', 'i'), createBlock('video', 'v')])).toBe('\n\n')
  })

  it('converts between text blocks keeping id and text', () => {
    const list = convertBlock({ id: 'p', type: 'paragraph', text: '- satu\n- dua' }, 'list')
    expect(list).toEqual({ id: 'p', type: 'list', items: ['satu', 'dua'], ordered: false })
    const p: ContentBlock = { id: 'p', type: 'paragraph', text: 'x' }
    expect(convertBlock(p, 'paragraph')).toBe(p)
  })

  it('lists only image blocks with a url', () => {
    const blocks: ContentBlock[] = [
      { id: 'a', type: 'image', url: '/a.webp', alt: 'a' },
      { id: 'b', type: 'image', url: '', alt: '' },
    ]
    expect(publishableImageBlocks(blocks).map((b) => b.id)).toEqual(['a'])
  })

  it('keeps the stored HTML format stable for headings and paragraphs', () => {
    const html = blocksToContent(contentToBlocks('<h2>Bagian Satu</h2>\n\n<p>Halo <strong>dunia</strong></p>'))
    expect(html).toBe('<h2 id="bagian-satu">Bagian Satu</h2>\n\n<p>Halo <strong>dunia</strong></p>')
  })
})
