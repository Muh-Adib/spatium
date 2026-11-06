import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BLOCK_DEFINITIONS, BLOCK_TYPES, PAGE_HERO_TYPES } from '../src/blocks/registry'
import { BLOCK_RENDERERS, getBlockRenderer } from '../src/blocks/renderers'
import { BLOCK_CATALOG, createBlock, getBlockEntry, type BlockField } from '../src/lib/blocks/catalog'
import { schemaTypes } from '../src/lib/blocks/define'
import { blockSchema } from '../src/lib/blocks/schema'
import { BlockRenderer } from '../src/components/blocks/BlockRenderer'
import { catalogIssues, type EditorBlock } from '../src/components/studio/blocks/model'

const BLOCKS_DIR = path.resolve(import.meta.dirname, '../src/blocks')

describe('block registry', () => {
  it('lists every type once, and the validator accepts exactly those types', () => {
    expect(new Set(BLOCK_TYPES).size).toBe(BLOCK_TYPES.length)
    const unionTypes = blockSchema.options.flatMap((o) => schemaTypes(o))
    expect([...unionTypes].sort()).toEqual([...BLOCK_TYPES].sort())
  })

  it('has exactly one renderer per registered type', () => {
    expect(Object.keys(BLOCK_RENDERERS).sort()).toEqual([...BLOCK_TYPES].sort())
    for (const type of BLOCK_TYPES) expect(typeof getBlockRenderer(type), type).toBe('function')
    expect(getBlockRenderer('unknown-type')).toBeUndefined()
    expect(getBlockRenderer('constructor')).toBeUndefined()
  })

  it('gives every catalogue entry a registered type, its own schema and a unique type', () => {
    const types = BLOCK_CATALOG.map((e) => e.type)
    expect(new Set(types).size).toBe(types.length)
    for (const entry of BLOCK_CATALOG) {
      expect(BLOCK_TYPES, entry.type).toContain(entry.type)
      const owner = BLOCK_DEFINITIONS.find((d) => schemaTypes(d.schema).includes(entry.type))
      expect(owner?.schema, entry.type).toBe(entry.schema)
      expect(getBlockEntry(entry.type)).toBe(entry)
    }
  })

  it('catalogue defaults validate against the schema and satisfy required fields', () => {
    for (const entry of BLOCK_CATALOG) {
      expect(entry.example.type, entry.type).toBe(entry.type)
      const own = entry.schema.safeParse(entry.example)
      expect(own.success, `${entry.type}: ${own.error?.message ?? ''}`).toBe(true)
      expect(blockSchema.safeParse(entry.example).success, entry.type).toBe(true)
      const created = createBlock(entry.type)
      expect(created, entry.type).not.toBeNull()
      expect(catalogIssues([created as EditorBlock]), entry.type).toEqual([])
    }
  })

  it('renders every catalogue default through BlockRenderer', () => {
    for (const entry of BLOCK_CATALOG) {
      const html = renderToStaticMarkup(createElement(BlockRenderer, { blocks: [{ ...entry.example, id: `t-${entry.type}` }] }))
      expect(html, entry.type).toContain(`data-block-type="${entry.type}"`)
    }
  })

  it('marks catalogue heroes as page heroes', () => {
    for (const entry of BLOCK_CATALOG.filter((e) => e.category === 'hero')) expect(PAGE_HERO_TYPES.has(entry.type), entry.type).toBe(true)
    for (const type of PAGE_HERO_TYPES) expect(BLOCK_TYPES).toContain(type)
  })

  it('declares aliases only for fields the entry renders', () => {
    const paths = (fields: readonly BlockField[], base = ''): string[] =>
      fields.flatMap((f) => {
        const p = base ? `${base}.${f.key}` : f.key
        const own = f.kind === 'image' ? [p, base ? `${base}.${f.altKey}` : f.altKey] : [p]
        return f.kind === 'list' ? [...own, ...paths(f.fields, p)] : own
      })
    for (const entry of BLOCK_CATALOG) {
      const known = new Set(paths(entry.fields))
      for (const key of Object.keys(entry.aliases ?? {})) expect(known.has(key), `${entry.type}: ${key}`).toBe(true)
    }
  })

  it('keeps definitions and the registry free of React (server-safe for MCP and the publication gate)', () => {
    const files = [
      path.join(BLOCKS_DIR, 'registry.ts'),
      ...fs
        .readdirSync(BLOCKS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(BLOCKS_DIR, d.name, 'definition.ts')),
    ]
    for (const file of files) {
      expect(fs.existsSync(file), file).toBe(true)
      const imports = [...fs.readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)].map((m) => m[1])
      for (const spec of imports) {
        expect(spec, `${path.relative(BLOCKS_DIR, file)} imports ${spec}`).not.toMatch(/^react|^next\/|\.tsx$|Block$|renderers/)
      }
    }
  })
})
