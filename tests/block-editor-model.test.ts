import { describe, it, expect } from 'vitest'
import { BLOCK_CATALOG, blockJsonSchema, createBlock, listBlocksFor, validateBlockList, type BlockField } from '../src/lib/blocks/catalog'
import {
  catalogIssues,
  ensureBlockIds,
  extraKeys,
  filterBlocks,
  formatIssue,
  getAt,
  groupIssuesByBlock,
  humanizeIssue,
  moveItem,
  readField,
  removeItem,
  setAt,
  splitIssueMessage,
  writeField,
  type EditorBlock,
} from '../src/components/studio/blocks/model'

type JsonSchema = { properties?: Record<string, JsonSchema>; items?: JsonSchema; anyOf?: JsonSchema[]; oneOf?: JsonSchema[]; allOf?: JsonSchema[]; type?: string | string[] }

/** Object properties of a (possibly union-wrapped) JSON schema node. */
function propsOf(node: JsonSchema | undefined): Record<string, JsonSchema> {
  if (!node) return {}
  const own = node.properties ?? {}
  const nested = [...(node.anyOf ?? []), ...(node.oneOf ?? []), ...(node.allOf ?? [])].map(propsOf)
  return Object.assign({}, ...nested, own)
}
function itemsOf(node: JsonSchema | undefined): JsonSchema | undefined {
  if (!node) return undefined
  return node.items ?? [...(node.anyOf ?? []), ...(node.oneOf ?? [])].map(itemsOf).find(Boolean)
}

function missingKeys(fields: readonly BlockField[], schema: JsonSchema, where: string): string[] {
  const props = propsOf(schema)
  const out: string[] = []
  for (const f of fields) {
    if (!(f.key in props)) out.push(`${where}.${f.key}`)
    if (f.kind === 'image' && !(f.altKey in props)) out.push(`${where}.${f.altKey}`)
    if (f.kind === 'link') {
      const linkProps = propsOf(props[f.key])
      for (const k of ['label', 'href']) if (!(k in linkProps)) out.push(`${where}.${f.key}.${k}`)
    }
    if (f.kind === 'table' && !fields.some((x) => x.key === f.columnsKey)) out.push(`${where}.${f.columnsKey} (columnsKey)`)
    if (f.kind === 'list') out.push(...missingKeys(f.fields, itemsOf(props[f.key]) ?? {}, `${where}.${f.key}[]`))
  }
  return out
}

describe('block catalogue ↔ generated forms', () => {
  it('every form field key exists in the block JSON schema (recursively)', () => {
    const missing = BLOCK_CATALOG.flatMap((entry) => {
      const schema = blockJsonSchema(entry.type) as JsonSchema
      return missingKeys(entry.fields, schema, entry.type)
    })
    expect(missing).toEqual([])
  })

  it('every example is valid and satisfies the catalogue required fields', () => {
    for (const entry of BLOCK_CATALOG) {
      const block = createBlock(entry.type)
      expect(block, entry.type).not.toBeNull()
      expect(validateBlockList([block]).ok, entry.type).toBe(true)
      expect(catalogIssues([block as EditorBlock]), entry.type).toEqual([])
    }
  })

  it('offers page blocks and keeps portfolio-only heroes out of pages', () => {
    const page = listBlocksFor('page').map((e) => e.type)
    expect(page).toContain('splat-viewer')
    expect(page).not.toContain('hero-portfolio')
    expect(listBlocksFor('portfolio').map((e) => e.type)).toContain('hero-portfolio')
  })

  it('palette search is multi-word and accent-insensitive', () => {
    expect(filterBlocks(BLOCK_CATALOG, 'splat').map((e) => e.type)).toContain('splat-viewer')
    expect(filterBlocks(BLOCK_CATALOG, 'galeri gambar').map((e) => e.type)).toEqual(['visual-showcase-gallery'])
    expect(filterBlocks(BLOCK_CATALOG, '').length).toBe(BLOCK_CATALOG.length)
    expect(filterBlocks(BLOCK_CATALOG, 'zzzz-nothing')).toEqual([])
  })
})

describe('block editor model', () => {
  it('sets and reads nested paths immutably, dropping empty optional strings', () => {
    const block: EditorBlock = { id: 'a', type: 'faq-accordion', items: [{ question: 'Q', answer: 'A' }] }
    const next = setAt(block, ['items', 0, 'answer'], 'B')
    expect(getAt(next, ['items', 0, 'answer'])).toBe('B')
    expect(getAt(block, ['items', 0, 'answer'])).toBe('A')
    expect(next.items).not.toBe(block.items)
    const cleared = setAt(next, ['title'], '')
    expect('title' in cleared).toBe(false)
  })

  it('moves and removes list items', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
    expect(removeItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  it('reads legacy alias keys and drops them when the canonical key is written', () => {
    const legacy: EditorBlock = { id: 'p', type: 'paragraph', text: 'Lama' }
    expect(readField(legacy, ['content'])).toBe('Lama')
    const written = writeField(legacy, ['content'], 'Baru')
    expect(written).toEqual({ id: 'p', type: 'paragraph', content: 'Baru' })
    expect(extraKeys({ id: 'h', type: 'hero-cinema', headline: 'x', data: {} }, BLOCK_CATALOG.find((e) => e.type === 'hero-cinema'))).toEqual(['data'])
  })

  it('assigns unique ids to legacy blocks and keeps the array when nothing changes', () => {
    const ok = [{ id: 'a', type: 'paragraph' }]
    expect(ensureBlockIds(ok)).toBe(ok)
    const fixed = ensureBlockIds([{ type: 'paragraph' }, { id: 'x', type: 'table' }, { id: 'x', type: 'table' }])
    expect(new Set(fixed.map((b) => b.id)).size).toBe(3)
    expect(fixed[1].id).toBe('x')
  })

  it('maps validation issues to blocks and field paths with plain-language messages', () => {
    const blocks: EditorBlock[] = [
      { id: 'ok', type: 'heading2', content: 'Judul' },
      { id: 'bad', type: 'splat-viewer', splatId: 'bad id!', posterUrl: '/p.webp' },
    ]
    const result = validateBlockList(blocks)
    const groups = groupIssuesByBlock([...result.issues, ...catalogIssues(blocks)], blocks)
    expect(groups.has('ok')).toBe(false)
    const bad = groups.get('bad')
    expect(bad?.byPath.has('splatId')).toBe(true)
    expect(bad?.byPath.has('posterAlt')).toBe(true)
    expect(formatIssue(result.issues[0], blocks)).toMatch(/^Blok 2 \(Viewer 3D Gaussian Splat\)/)
  })

  it('flags empty catalogue-required fields', () => {
    const issues = catalogIssues([{ id: 'f', type: 'faq-accordion', items: [{ question: '', answer: 'x' }] }])
    expect(issues.map((i) => splitIssueMessage(i.message).path)).toEqual(['items.0.question'])
  })

  it('humanizes common zod messages', () => {
    expect(humanizeIssue('Invalid input: expected string, received undefined')).toBe('Wajib diisi.')
    expect(humanizeIssue('Too big: expected string to have <=200 characters')).toBe('Maksimal 200 karakter.')
    expect(splitIssueMessage('steps.0.title: Wajib')).toEqual({ path: 'steps.0.title', text: 'Wajib' })
    expect(splitIssueMessage('paragraph harus memiliki content atau text')).toEqual({ path: null, text: 'paragraph harus memiliki content atau text' })
  })
})
