import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db as prisma } from '../prisma/db'
import { POST, GET, DELETE } from '../src/app/api/mcp/route'
import { createMcpApiKey, revokeMcpApiKey, hashMcpKey, verifyMcpApiKey, parseStoredScopes } from '../src/lib/mcp/keys'
import { mcpRateLimiter, TokenBucketLimiter } from '../src/lib/mcp/rate-limit'
import { listToolsFor } from '../src/lib/mcp/tools'

/**
 * MCP server: protocol, auth and an end-to-end page-building flow against the
 * live local PostgreSQL, exercised through the real route handler.
 */

const RUN = Date.now().toString(36)
const keyIds: number[] = []
const pageIds: number[] = []
let fullKey = ''
let readOnlyKey = ''

async function makeKey(name: string, scopes: ('blocks:read' | 'pages:read' | 'pages:draft')[], expiresAt?: string) {
  const { plaintext, key } = await createMcpApiKey({ name: `${name}-${RUN}`, scopes, expiresAt }, 'test:vitest')
  keyIds.push(key.id)
  return { plaintext, id: key.id }
}

function req(body: unknown, opts: { key?: string | null; headers?: Record<string, string>; raw?: string } = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    ...opts.headers,
  }
  const key = opts.key === undefined ? fullKey : opts.key
  if (key) headers.Authorization = `Bearer ${key}`
  return new Request('http://localhost:3002/api/mcp', { method: 'POST', headers, body: opts.raw ?? JSON.stringify(body) })
}

let nextId = 1
async function rpc(method: string, params?: Record<string, unknown>, key?: string) {
  const res = await POST(req({ jsonrpc: '2.0', id: nextId++, method, ...(params ? { params } : {}) }, { key }))
  return { status: res.status, body: await res.json() }
}

async function call(name: string, args: Record<string, unknown>, key?: string) {
  const { body } = await rpc('tools/call', { name, arguments: args }, key)
  expect(body.error).toBeUndefined()
  return body.result as { content: { type: string; text: string }[]; structuredContent?: Record<string, any>; isError?: boolean }
}

beforeAll(async () => {
  fullKey = (await makeKey('vitest-full', ['blocks:read', 'pages:read', 'pages:draft'])).plaintext
  readOnlyKey = (await makeKey('vitest-read', ['blocks:read', 'pages:read'])).plaintext
})

beforeEach(() => mcpRateLimiter.reset())

afterAll(async () => {
  for (const id of pageIds) {
    await prisma.orm.public.Page.where({ id }).deleteAll()
    await prisma.orm.public.ContentRevision.where({ entityType: 'page', entityId: String(id) }).deleteAll()
    await prisma.orm.public.SeoAuditLog.where({ entityType: 'page', entityId: String(id) }).deleteAll()
  }
  for (const id of keyIds) {
    await prisma.orm.public.McpApiKey.where({ id }).deleteAll()
    await prisma.orm.public.SeoAuditLog.where({ entityType: 'mcp_key', entityId: String(id) }).deleteAll()
  }
})

describe('MCP protocol', () => {
  it('negotiates the protocol version in initialize', async () => {
    const latest = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } })
    expect(latest.status).toBe(200)
    expect(latest.body.result.protocolVersion).toBe('2025-06-18')
    expect(latest.body.result.serverInfo.name).toBe('spatium')
    expect(latest.body.result.capabilities.tools).toEqual({ listChanged: false })
    expect(latest.body.result.instructions).toMatch(/DRAFT/)

    const older = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {} })
    expect(older.body.result.protocolVersion).toBe('2025-03-26')

    const unknown = await rpc('initialize', { protocolVersion: '2024-01-01', capabilities: {} })
    expect(unknown.body.result.protocolVersion).toBe('2025-06-18')

    const missing = await rpc('initialize', {})
    expect(missing.body.error.code).toBe(-32602)
  })

  it('answers notifications with 202 and no body', async () => {
    const res = await POST(req({ jsonrpc: '2.0', method: 'notifications/initialized' }))
    expect(res.status).toBe(202)
    expect(await res.text()).toBe('')
  })

  it('handles ping, unknown methods and invalid messages', async () => {
    expect((await rpc('ping')).body.result).toEqual({})
    const unknown = await rpc('does/not/exist')
    expect(unknown.body.error.code).toBe(-32601)
    const invalid = await POST(req({ jsonrpc: '1.0', id: 9, method: 'ping' }))
    expect((await invalid.json()).error).toMatchObject({ code: -32600 })
  })

  it('returns -32700 for invalid JSON', async () => {
    const res = await POST(req(null, { raw: '{"jsonrpc": "2.0", "id": 1,' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe(-32700)
  })

  it('rejects an unsupported MCP-Protocol-Version header and accepts supported ones', async () => {
    const bad = await POST(req({ jsonrpc: '2.0', id: 1, method: 'ping' }, { headers: { 'MCP-Protocol-Version': '1999-01-01' } }))
    expect(bad.status).toBe(400)
    const good = await POST(req({ jsonrpc: '2.0', id: 1, method: 'ping' }, { headers: { 'MCP-Protocol-Version': '2025-06-18' } }))
    expect(good.status).toBe(200)
  })

  it('processes batches in order and omits notification replies', async () => {
    const res = await POST(
      req([
        { jsonrpc: '2.0', id: 'a', method: 'ping' },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 'b', method: 'nope' },
      ]),
    )
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({ id: 'a', result: {} })
    expect(body[1]).toMatchObject({ id: 'b', error: { code: -32601 } })
    const empty = await POST(req([]))
    expect(empty.status).toBe(400)
  })

  it('lists tools with JSON Schema inputs and annotations', async () => {
    const { body } = await rpc('tools/list')
    const names = body.result.tools.map((t: { name: string }) => t.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'list_block_types', 'get_block_type', 'validate_blocks', 'list_pages', 'get_page', 'get_page_url',
        'create_page_draft', 'update_page_draft', 'insert_blocks', 'update_block', 'remove_block', 'move_block',
      ]),
    )
    for (const tool of body.result.tools) {
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.inputSchema.$schema).toBeUndefined()
      expect(typeof tool.description).toBe('string')
      expect(typeof tool.annotations.readOnlyHint).toBe('boolean')
      expect(names.filter((n: string) => n === tool.name)).toHaveLength(1)
    }
    expect(names.some((n: string) => /publish|delete|archive/.test(n))).toBe(false)
  })

  it('returns tool results, tool errors and protocol errors correctly', async () => {
    const list = await call('list_block_types', {})
    expect(list.isError).toBeUndefined()
    expect(list.structuredContent?.blocks.length).toBeGreaterThan(3)
    expect(JSON.parse(list.content[0].text).target).toBe('page')

    const detail = await call('get_block_type', { type: 'hero-cinema' })
    expect(detail.structuredContent?.jsonSchema).toBeTruthy()
    expect(detail.structuredContent?.example.type).toBe('hero-cinema')

    const unknownType = await call('get_block_type', { type: 'nope' })
    expect(unknownType.isError).toBe(true)

    const badArgs = await call('get_block_type', {})
    expect(badArgs.isError).toBe(true)
    expect(badArgs.content[0].text).toMatch(/Invalid arguments/)

    const invalid = await call('validate_blocks', { blocks: [{ type: 'heading2', content: 'OK' }, { type: 'mystery' }] })
    expect(invalid.structuredContent?.ok).toBe(false)
    expect(invalid.structuredContent?.issues[0].index).toBe(1)

    const unknownTool = await rpc('tools/call', { name: 'publish_page', arguments: {} })
    expect(unknownTool.body.error.code).toBe(-32602)
    const noName = await rpc('tools/call', {})
    expect(noName.body.error.code).toBe(-32602)
  })

  it('exposes the block catalogue resource and the landing page prompt', async () => {
    const resources = await rpc('resources/list')
    expect(resources.body.result.resources[0].uri).toBe('spatium://blocks/catalog')
    const read = await rpc('resources/read', { uri: 'spatium://blocks/catalog' })
    expect(JSON.parse(read.body.result.contents[0].text).length).toBeGreaterThan(3)
    const prompt = await rpc('prompts/get', { name: 'build_landing_page', arguments: { topic: 'Wedding venue tour' } })
    expect(prompt.body.result.messages[0].content.text).toMatch(/create_page_draft/)
  })

  it('refuses GET (no SSE) and DELETE (stateless) with 405', async () => {
    expect(GET().status).toBe(405)
    expect(DELETE().status).toBe(405)
  })

  it('rejects foreign browser origins but allows same-origin and no Origin', async () => {
    const evil = await POST(req({ jsonrpc: '2.0', id: 1, method: 'ping' }, { headers: { Origin: 'https://evil.example' } }))
    expect(evil.status).toBe(403)
    // DNS rebinding: the attacker controls Host too, so Host must not be trusted.
    const rebound = await POST(
      new Request('http://evil.example:3002/api/mcp', {
        method: 'POST',
        headers: { Host: 'evil.example:3002', Origin: 'http://evil.example:3002', Authorization: `Bearer ${fullKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      }),
    )
    expect(rebound.status).toBe(403)
    const same = await POST(req({ jsonrpc: '2.0', id: 1, method: 'ping' }, { headers: { Origin: 'http://localhost:3002' } }))
    expect(same.status).toBe(200)
  })
})

describe('MCP auth', () => {
  async function status(key: string | null) {
    const res = await POST(req({ jsonrpc: '2.0', id: 1, method: 'ping' }, { key }))
    return { status: res.status, challenge: res.headers.get('www-authenticate'), body: await res.json() }
  }

  it('requires a key and sends a WWW-Authenticate challenge', async () => {
    const missing = await status(null)
    expect(missing.status).toBe(401)
    expect(missing.challenge).toBe('Bearer realm="spatium-mcp"')
    expect(missing.body.error.code).toBe(-32001)

    const invalid = await status(`spm_${'A'.repeat(43)}`)
    expect(invalid.status).toBe(401)
    expect(invalid.challenge).toMatch(/error="invalid_token"/)

    expect((await status('not-a-key')).status).toBe(401)
  })

  it('rejects revoked and expired keys', async () => {
    const revoked = await makeKey('vitest-revoked', ['blocks:read'])
    expect((await status(revoked.plaintext)).status).toBe(200)
    await revokeMcpApiKey(revoked.id, 'test:vitest')
    const after = await status(revoked.plaintext)
    expect(after.status).toBe(401)
    expect(after.body.error.message).toMatch(/revoked/)

    const soon = await makeKey('vitest-expired', ['blocks:read'], new Date(Date.now() + 60_000).toISOString())
    expect((await verifyMcpApiKey(soon.plaintext, Date.now() + 120_000)).ok).toBe(false)
    await prisma.orm.public.McpApiKey.where({ id: soon.id }).update({ expiresAt: new Date(Date.now() - 1000).toISOString() })
    const expired = await status(soon.plaintext)
    expect(expired.status).toBe(401)
    expect(expired.body.error.message).toMatch(/expired/)
  })

  it('stores only a SHA-256 hash and a short prefix', async () => {
    const row = await prisma.orm.public.McpApiKey.where({ keyHash: hashMcpKey(fullKey) }).first()
    expect(row?.keyHash).toMatch(/^[0-9a-f]{64}$/)
    expect(row?.keyPrefix).toBe(fullKey.slice(0, 10))
    expect(JSON.stringify(row)).not.toContain(fullKey)
    expect(parseStoredScopes('["pages:read","bogus"]')).toEqual(['pages:read'])
    expect(parseStoredScopes('not json')).toEqual([])
  })

  it('enforces scopes: tools/list filters and tools/call refuses', async () => {
    const { body } = await rpc('tools/list', undefined, readOnlyKey)
    const names = body.result.tools.map((t: { name: string }) => t.name)
    expect(names).toContain('get_page')
    expect(names).not.toContain('create_page_draft')
    const denied = await call('create_page_draft', { title: 'X', blocks: [] }, readOnlyKey)
    expect(denied.isError).toBe(true)
    expect(denied.content[0].text).toMatch(/pages:draft/)
    expect(listToolsFor([]).length).toBe(0)
  })

  it('rate-limits per key with 429 + Retry-After', async () => {
    const limiter = new TokenBucketLimiter(2, 1)
    expect(limiter.take('k', 1, 0).allowed).toBe(true)
    expect(limiter.take('k', 1, 0).allowed).toBe(true)
    const third = limiter.take('k', 1, 0)
    expect(third.allowed).toBe(false)
    expect(limiter.take('k', 1, 1500).allowed).toBe(true)

    const batch = Array.from({ length: 50 }, (_, i) => ({ jsonrpc: '2.0', id: i, method: 'ping' }))
    expect((await POST(req(batch))).status).toBe(200)
    const limited = await POST(req(batch))
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
  })
})

describe('MCP end-to-end page building (live DB)', () => {
  let id = 0
  let updatedAt = ''

  it('creates a draft with auto ids and an audit trail under mcp:<key name>', async () => {
    const res = await call('create_page_draft', {
      title: `Halaman MCP ${RUN}`,
      blocks: [
        { type: 'hero-cinema', headline: 'Ruang nyata, sudut pandang baru' },
        { type: 'paragraph', content: 'Paragraf pertama.' },
      ],
    })
    expect(res.isError).toBeUndefined()
    const page = res.structuredContent?.page
    id = page.id
    pageIds.push(id)
    updatedAt = page.updatedAt
    expect(page.status).toBe('draft')
    expect(page.slug).toBe(`halaman-mcp-${RUN}`)
    expect(page.outline.every((b: { id: string | null }) => typeof b.id === 'string')).toBe(true)
    expect(page.editUrl).toMatch(new RegExp(`/admin\\?tab=pages&page=${id}$`))
    expect(page.publicUrl).toBeNull()
    expect(page.publication.ready).toBe(false)

    const audit = await prisma.orm.public.SeoAuditLog.where({ entityType: 'page', entityId: String(id) }).first()
    expect(audit?.actor).toBe(`mcp:vitest-full-${RUN}`)
  })

  it('inserts blocks after a given block, then moves one', async () => {
    const before = (await call('get_page', { id })).structuredContent
    const heroId = before?.blocks[0].id
    const inserted = await call('insert_blocks', {
      pageId: id,
      afterBlockId: heroId,
      blocks: [{ type: 'heading2', content: 'Cara kerjanya' }],
      expectedUpdatedAt: updatedAt,
    })
    expect(inserted.isError).toBeUndefined()
    expect(inserted.structuredContent?.page.outline.map((b: { type: string }) => b.type)).toEqual(['hero-cinema', 'heading2', 'paragraph'])

    const stale = await call('move_block', { pageId: id, index: 1, toIndex: 2, expectedUpdatedAt: updatedAt })
    expect(stale.isError).toBe(true)
    expect(stale.content[0].text).toMatch(/changed/)

    updatedAt = inserted.structuredContent?.page.updatedAt
    const moved = await call('move_block', { pageId: id, index: 1, toIndex: 2, expectedUpdatedAt: updatedAt })
    expect(moved.isError).toBeUndefined()
    expect(moved.structuredContent?.page.outline.map((b: { type: string }) => b.type)).toEqual(['hero-cinema', 'paragraph', 'heading2'])
  })

  it('updates and removes single blocks with re-validation', async () => {
    const invalid = await call('update_block', { pageId: id, index: 0, set: { headline: 42 } })
    expect(invalid.isError).toBe(true)
    const typeChange = await call('update_block', { pageId: id, index: 0, set: { type: 'paragraph' } })
    expect(typeChange.isError).toBe(true)
    const updated = await call('update_block', { pageId: id, index: 1, set: { content: 'Paragraf diperbarui.' } })
    expect(updated.isError).toBeUndefined()
    const removed = await call('remove_block', { pageId: id, index: 2 })
    expect(removed.structuredContent?.page.blockCount).toBe(2)
    const outOfRange = await call('remove_block', { pageId: id, index: 99 })
    expect(outOfRange.isError).toBe(true)
  })

  it('get_page returns blocks, updatedAt and publication issues', async () => {
    const page = (await call('get_page', { id })).structuredContent
    expect(page?.blocks).toHaveLength(2)
    expect(page?.blocks[1].content).toBe('Paragraf diperbarui.')
    expect(typeof page?.updatedAt).toBe('string')
    expect(page?.publication.issues.length).toBeGreaterThan(0)
    const bySlug = (await call('get_page', { slug: page?.slug })).structuredContent
    expect(bySlug?.id).toBe(id)
    const urls = await call('get_page_url', { id })
    expect(urls.structuredContent?.publicUrl).toBeNull()
  })

  it('refuses to edit a published page', async () => {
    await prisma.orm.public.Page.where({ id }).update({ status: 'published' })
    const page = (await call('get_page', { id })).structuredContent
    expect(page?.editable).toBe(false)
    const refused = await call('update_page_draft', { id, expectedUpdatedAt: page?.updatedAt, title: 'Diubah oleh agen' })
    expect(refused.isError).toBe(true)
    expect(refused.content[0].text).toMatch(/published/)
    const insertRefused = await call('insert_blocks', { pageId: id, blocks: [{ type: 'heading2', content: 'X' }] })
    expect(insertRefused.isError).toBe(true)
    const urls = await call('get_page_url', { id })
    expect(urls.structuredContent?.publicUrl).toMatch(/\/halaman-mcp-/)
  })
})
