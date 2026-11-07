import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db as prisma } from '../prisma/db'
import { POST } from '../src/app/api/mcp/route'
import { createMcpApiKey } from '../src/lib/mcp/keys'
import { mcpRateLimiter } from '../src/lib/mcp/rate-limit'
import { PRESET_TYPES } from '../src/blocks/presets'
import type { McpScope } from '../src/lib/mcp/scopes'

/**
 * MCP: block presets, service-category draft tools and preset-on-create for
 * portfolio / service drafts, against the live local PostgreSQL.
 */

const RUN = Date.now().toString(36)
const keyIds: number[] = []
const created = { service_category: [] as number[], portfolio: [] as number[], service: [] as number[] }
let writer = ''
let reader = ''

async function makeKey(name: string, scopes: McpScope[]) {
  const { plaintext, key } = await createMcpApiKey({ name: `${name}-${RUN}`, scopes }, 'test:vitest')
  keyIds.push(key.id)
  return plaintext
}

let nextId = 1
async function rpc(method: string, params: Record<string, unknown> | undefined, key: string) {
  const res = await POST(
    new Request('http://localhost:3002/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, ...(params ? { params } : {}) }),
    }),
  )
  return res.json()
}

type Result = { content: { type: string; text: string }[]; structuredContent?: Record<string, any>; isError?: boolean }
async function call(name: string, args: Record<string, unknown>, key = writer): Promise<Result> {
  const body = await rpc('tools/call', { name, arguments: args }, key)
  expect(body.error).toBeUndefined()
  return body.result
}

const typesOf = (raw: string | null) => (JSON.parse(raw ?? '[]') as { type: string }[]).map((b) => b.type)

beforeAll(async () => {
  writer = await makeKey('vitest-entity-writer', ['blocks:read', 'services:read', 'services:draft', 'portfolio:read', 'portfolio:draft'])
  reader = await makeKey('vitest-entity-reader', ['blocks:read', 'services:read'])
})

beforeEach(() => mcpRateLimiter.reset())

afterAll(async () => {
  for (const id of created.service) await prisma.orm.public.Service.where({ id }).deleteAll()
  for (const id of created.portfolio) await prisma.orm.public.Portfolio.where({ id }).deleteAll()
  for (const id of created.service_category) await prisma.orm.public.ServiceCategory.where({ id }).deleteAll()
  for (const [entityType, list] of Object.entries(created)) {
    for (const id of list) {
      await prisma.orm.public.ContentRevision.where({ entityType, entityId: String(id) }).deleteAll()
      await prisma.orm.public.SeoAuditLog.where({ entityType, entityId: String(id) }).deleteAll()
    }
  }
  for (const id of keyIds) {
    await prisma.orm.public.McpApiKey.where({ id }).deleteAll()
    await prisma.orm.public.SeoAuditLog.where({ entityType: 'mcp_key', entityId: String(id) }).deleteAll()
  }
})

describe('MCP block presets', () => {
  it('returns each entity preset with field docs, and lists data-bound blocks per target', async () => {
    for (const target of ['service-category', 'service', 'portfolio'] as const) {
      const res = await call('get_block_preset', { target }, reader)
      expect(res.isError).toBeUndefined()
      expect(res.structuredContent?.types).toEqual([...PRESET_TYPES[target]])
      expect(res.structuredContent?.blocks.every((b: { id?: string }) => b.id === undefined)).toBe(true)
      expect(Object.keys(res.structuredContent?.fields ?? {})).toEqual([...PRESET_TYPES[target]])
    }
    expect((await call('get_block_preset', { target: 'page' }, reader)).isError).toBe(true)
    const listed = await call('list_block_types', { target: 'service-category' }, reader)
    const hero = listed.structuredContent?.blocks.find((b: { type: string }) => b.type === 'category-hero')
    expect(hero?.dataBound).toBe(true)
  })

  it('validate_blocks refuses data-bound blocks outside their target', async () => {
    const res = await call('validate_blocks', { target: 'portfolio', blocks: [{ type: 'category-faq' }] }, reader)
    expect(res.structuredContent?.ok).toBe(false)
  })
})

describe('MCP service-category drafts (live DB)', () => {
  let id = 0
  let updatedAt = ''

  it('is not writable with read scopes', async () => {
    const denied = await call('create_service_category_draft', { title: `Ditolak ${RUN}` }, reader)
    expect(denied.isError).toBe(true)
    expect(denied.content[0].text).toMatch(/services:draft/)
  })

  it('creates a hidden draft that starts from the preset, with an audit trail', async () => {
    const res = await call('create_service_category_draft', {
      title: `Use Case MCP ${RUN}`,
      tag: 'Tagline uji',
      shortDescription: 'Ringkasan use case uji.',
      deliverables: ['Scene 3D'],
      tools: ['Laser scan'],
      visual: 'memory',
    })
    expect(res.isError).toBeUndefined()
    const category = res.structuredContent?.category
    id = category.id
    created.service_category.push(id)
    updatedAt = category.updatedAt
    expect(category.status).toBe('draft')
    expect(category.blocksMode).toBe('explicit')
    expect(category.publicUrl).toBeNull()
    expect(category.editUrl).toContain(`category=use-case-mcp-${RUN}`)
    expect(category.previewUrl).toContain(`/admin/preview/service-category/${id}`)
    const row = await prisma.orm.public.ServiceCategory.where({ id }).first()
    expect(row?.showInNav).toBe(false)
    expect(typesOf(row?.blocks ?? null)).toEqual([...PRESET_TYPES['service-category']])
    expect(JSON.parse(row?.keyOutcomes ?? '[]')).toEqual([
      { label: 'deliverable', value: 'Scene 3D' },
      { label: 'tool', value: 'Laser scan' },
    ])
    const revisions = await prisma.orm.public.ContentRevision.where({ entityType: 'service_category', entityId: String(id) }).all()
    expect(revisions.length).toBe(1)
  })

  it('refuses publication fields, misplaced blocks and stale edits', async () => {
    const publish = await call('update_service_category_draft', { id, expectedUpdatedAt: updatedAt, status: 'published' })
    expect(publish.isError).toBe(true)
    expect(publish.content[0].text).toMatch(/cannot be set through MCP/)

    const misplaced = await call('update_service_category_draft', { id, expectedUpdatedAt: updatedAt, blocks: [{ type: 'portfolio-scene' }] })
    expect(misplaced.isError).toBe(true)

    const stale = await call('update_service_category_draft', { id, expectedUpdatedAt: '2000-01-01T00:00:00Z', tag: 'x' })
    expect(stale.isError).toBe(true)
    expect(stale.content[0].text).toMatch(/conflict/)
  })

  it('reads resolved blocks and updates a customised list', async () => {
    const got = await call('get_service_category', { id }, reader)
    const resolved = got.structuredContent?.resolvedBlocks as { type: string; id: string }[]
    expect(resolved.map((b) => b.type)).toEqual([...PRESET_TYPES['service-category']])
    const custom = [
      ...resolved.filter((b) => b.type !== 'category-next'),
      { type: 'paragraph', text: 'Paragraf tambahan.' },
    ]
    const res = await call('update_service_category_draft', { id, expectedUpdatedAt: got.structuredContent?.updatedAt, blocks: custom })
    expect(res.isError).toBeUndefined()
    const row = await prisma.orm.public.ServiceCategory.where({ id }).first()
    expect(typesOf(row?.blocks ?? null)).not.toContain('category-next')
    expect(typesOf(row?.blocks ?? null)).toContain('paragraph')
    const listed = await call('list_service_categories', { status: 'draft' }, reader)
    expect(listed.structuredContent?.categories.some((c: { id: number }) => c.id === id)).toBe(true)
  })

  it('refuses edits once a human published the category', async () => {
    await prisma.orm.public.ServiceCategory.where({ id }).update({ status: 'published' })
    const row = await prisma.orm.public.ServiceCategory.where({ id }).first()
    const res = await call('update_service_category_draft', { id, expectedUpdatedAt: row?.updatedAt ?? '', tag: 'x' })
    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/forbidden/)
  })
})

describe('MCP preset on create (portfolio, service)', () => {
  it('stores the preset when blocks are omitted', async () => {
    const portfolio = await call('create_portfolio_draft', { title: `Scene MCP ${RUN}` })
    expect(portfolio.isError).toBeUndefined()
    const pid = portfolio.structuredContent?.portfolio.id
    created.portfolio.push(pid)
    const prow = await prisma.orm.public.Portfolio.where({ id: pid }).first()
    expect(typesOf(prow?.blocks ?? null)).toEqual([...PRESET_TYPES.portfolio])

    const service = await call('create_service_draft', { name: `Layanan MCP ${RUN}` })
    expect(service.isError).toBeUndefined()
    const sid = service.structuredContent?.service.id
    created.service.push(sid)
    const srow = await prisma.orm.public.Service.where({ id: sid }).first()
    expect(typesOf(srow?.blocks ?? null)).toEqual([...PRESET_TYPES.service])
    expect(service.structuredContent?.service.publicUrl).toBeNull()
  })

  it('refuses blocks of another entity on create', async () => {
    const res = await call('create_service_draft', { name: `Layanan salah ${RUN}`, blocks: [{ type: 'category-hero' }] })
    expect(res.isError).toBe(true)
    expect(await prisma.orm.public.Service.where({ slug: `layanan-salah-${RUN}` }).first()).toBeFalsy()
  })
})
