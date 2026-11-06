import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db as prisma } from '../prisma/db'
import { POST } from '../src/app/api/mcp/route'
import { createMcpApiKey } from '../src/lib/mcp/keys'
import { mcpRateLimiter } from '../src/lib/mcp/rate-limit'
import type { McpScope } from '../src/lib/mcp/scopes'

/**
 * MCP content tools (articles, portfolio, services) against the live local
 * PostgreSQL, through the real route handler: scopes, draft-only writes,
 * optimistic concurrency, audit trail and publication gates.
 */

const RUN = Date.now().toString(36)
const keyIds: number[] = []
const created = { article: [] as number[], portfolio: [] as number[], service: [] as number[] }
let writerKey = ''
let articleReaderKey = ''
let categoryId = 0
let serviceCategoryId = 0
const categorySlug = `mcp-kategori-${RUN}`
const serviceCategorySlug = `mcp-use-case-${RUN}`
const tagName = `mcp-tag-${RUN}`

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

type ToolCallResult = { content: { type: string; text: string }[]; structuredContent?: Record<string, any>; isError?: boolean }
async function call(name: string, args: Record<string, unknown>, key = writerKey): Promise<ToolCallResult> {
  const body = await rpc('tools/call', { name, arguments: args }, key)
  expect(body.error).toBeUndefined()
  return body.result
}

beforeAll(async () => {
  writerKey = await makeKey('vitest-content', [
    'blocks:read',
    'articles:read',
    'articles:draft',
    'portfolio:read',
    'portfolio:draft',
    'services:read',
    'services:draft',
  ])
  articleReaderKey = await makeKey('vitest-article-reader', ['articles:read'])
  categoryId = (await prisma.orm.public.Category.create({ name: `Kategori MCP ${RUN}`, slug: categorySlug })).id
  serviceCategoryId = (
    await prisma.orm.public.ServiceCategory.create({ slug: serviceCategorySlug, title: `Use case MCP ${RUN}`, status: 'draft' })
  ).id
})

beforeEach(() => mcpRateLimiter.reset())

afterAll(async () => {
  const cleanup: [keyof typeof created, string][] = [
    ['article', 'article'],
    ['portfolio', 'portfolio'],
    ['service', 'service'],
  ]
  for (const id of created.article) await prisma.orm.public.Article.where({ id }).deleteAll()
  for (const id of created.portfolio) await prisma.orm.public.Portfolio.where({ id }).deleteAll()
  for (const id of created.service) await prisma.orm.public.Service.where({ id }).deleteAll()
  for (const [list, entityType] of cleanup) {
    for (const id of created[list]) {
      await prisma.orm.public.ContentRevision.where({ entityType, entityId: String(id) }).deleteAll()
      await prisma.orm.public.SeoAuditLog.where({ entityType, entityId: String(id) }).deleteAll()
    }
  }
  await prisma.orm.public.Tag.where({ name: tagName }).deleteAll()
  await prisma.orm.public.Category.where({ id: categoryId }).deleteAll()
  await prisma.orm.public.ServiceCategory.where({ id: serviceCategoryId }).deleteAll()
  for (const id of keyIds) {
    await prisma.orm.public.McpApiKey.where({ id }).deleteAll()
    await prisma.orm.public.SeoAuditLog.where({ entityType: 'mcp_key', entityId: String(id) }).deleteAll()
  }
})

describe('MCP content scopes', () => {
  it('lists only the tools a key is scoped for', async () => {
    const all = (await rpc('tools/list', undefined, writerKey)).result.tools.map((t: { name: string }) => t.name)
    expect(all).toEqual(
      expect.arrayContaining([
        'list_articles', 'get_article', 'list_article_taxonomy', 'create_article_draft', 'update_article_draft',
        'list_portfolios', 'get_portfolio', 'create_portfolio_draft', 'update_portfolio_draft',
        'list_services', 'get_service', 'create_service_draft', 'update_service_draft',
      ]),
    )
    expect(all).not.toContain('create_page_draft')
    expect(all.some((n: string) => /publish|delete|archive|schedule/.test(n))).toBe(false)

    const reader = (await rpc('tools/list', undefined, articleReaderKey)).result.tools.map((t: { name: string }) => t.name)
    expect(reader.sort()).toEqual(['get_article', 'list_article_taxonomy', 'list_articles'])
    const denied = await call('create_article_draft', { title: 'X', content: '<p>x</p>' }, articleReaderKey)
    expect(denied.isError).toBe(true)
    expect(denied.content[0].text).toMatch(/articles:draft/)
  })

  it('publishes input schemas that reject unknown keys', async () => {
    const tools = (await rpc('tools/list', undefined, writerKey)).result.tools as { name: string; inputSchema: Record<string, unknown> }[]
    const create = tools.find((t) => t.name === 'create_article_draft')
    expect(create?.inputSchema.additionalProperties).toBe(false)
  })
})

describe('MCP article drafts (live DB)', () => {
  let id = 0
  let updatedAt = ''
  let slug = ''

  it('creates a sanitized draft with an audit trail, editUrl and gate issues', async () => {
    const res = await call('create_article_draft', {
      title: `Artikel MCP ${RUN}`,
      content: '<h2>Pengantar</h2><p onclick="alert(1)">Isi <strong>tebal</strong>.</p><script>alert(1)</script><img src="/uploads/contoh.webp">',
      excerpt: 'Ringkasan singkat.',
      category: categorySlug,
      tags: [tagName],
    })
    expect(res.isError).toBeUndefined()
    const article = res.structuredContent?.article
    id = article.id
    created.article.push(id)
    slug = article.slug
    updatedAt = article.updatedAt
    expect(article.status).toBe('draft')
    expect(slug).toBe(`artikel-mcp-${RUN}`)
    expect(article.category.slug).toBe(categorySlug)
    expect(article.tags).toEqual([tagName])
    expect(article.editUrl).toMatch(new RegExp(`/admin/buat-artikel\\?slug=${slug}$`))
    expect(article.publicUrl).toBeNull()
    // The inline image has no alt text: the Studio gate must flag it.
    expect(article.publication.ready).toBe(false)
    expect(JSON.stringify(article.publication.issues)).toMatch(/alt|Alt/)

    const row = await prisma.orm.public.Article.where({ id }).first()
    expect(row?.status).toBe('draft')
    expect(row?.content).not.toMatch(/script|onclick/)
    expect(row?.content).toMatch(/<strong>tebal<\/strong>/)
    const audit = await prisma.orm.public.SeoAuditLog.where({ entityType: 'article', entityId: String(id) }).first()
    expect(audit?.actor).toBe(`mcp:vitest-content-${RUN}`)
  })

  it('converts markdown content', async () => {
    const res = await call('create_article_draft', {
      title: `Artikel Markdown ${RUN}`,
      content: '## Bagian satu\n\nParagraf dengan **tebal**.\n\n- satu\n- dua',
      contentFormat: 'markdown',
    })
    expect(res.isError).toBeUndefined()
    created.article.push(res.structuredContent?.article.id)
    const full = (await call('get_article', { id: res.structuredContent?.article.id })).structuredContent
    expect(full?.content).toMatch(/<h2[^>]*>Bagian satu<\/h2>/)
    expect(full?.content).toMatch(/<li>/)
  })

  it('rejects unknown categories, status fields and duplicate slugs', async () => {
    const unknownCategory = await call('create_article_draft', { title: `Lain ${RUN}`, content: '<p>x</p>', category: 'tidak-ada-kategori-ini' })
    expect(unknownCategory.isError).toBe(true)
    expect(unknownCategory.content[0].text).toMatch(/list_article_taxonomy/)

    const publish = await call('create_article_draft', { title: `Terbit ${RUN}`, content: '<p>x</p>', status: 'published' })
    expect(publish.isError).toBe(true)
    expect(publish.content[0].text).toMatch(/human editor/)
    expect(await prisma.orm.public.Article.where({ slug: `terbit-${RUN}` }).first()).toBeNull()

    const duplicate = await call('create_article_draft', { title: `Artikel MCP ${RUN}`, content: '<p>x</p>' })
    expect(duplicate.isError).toBe(true)
    expect(duplicate.content[0].text).toMatch(/slug_taken/)
  })

  it('updates with optimistic concurrency and fixes gate issues', async () => {
    const res = await call('update_article_draft', {
      id,
      expectedUpdatedAt: updatedAt,
      content: '<h2>Pengantar</h2><p>Isi baru.</p><img src="/uploads/contoh.webp" alt="Pemindaian ruang dengan laser scanner">',
      metaTitle: 'Artikel MCP tentang pemindaian ruang',
      metaDescription: 'Deskripsi meta yang cukup panjang untuk lolos gerbang publikasi Studio SPATIUM dan tampil baik di hasil pencarian.',
    })
    expect(res.isError).toBeUndefined()
    const article = res.structuredContent?.article
    expect(article.updatedAt).not.toBe(updatedAt)
    expect(article.metaTitle).toBe('Artikel MCP tentang pemindaian ruang')
    expect(article.publication.issues).toEqual([])
    expect(article.status).toBe('draft')

    const stale = await call('update_article_draft', { id, expectedUpdatedAt: updatedAt, title: 'Basi' })
    expect(stale.isError).toBe(true)
    expect(stale.content[0].text).toMatch(/conflict/)
    updatedAt = article.updatedAt

    const statusAttempt = await call('update_article_draft', { id, expectedUpdatedAt: updatedAt, status: 'published' })
    expect(statusAttempt.isError).toBe(true)
    const scheduleAttempt = await call('update_article_draft', { id, expectedUpdatedAt: updatedAt, scheduledAt: new Date(Date.now() + 864e5).toISOString() })
    expect(scheduleAttempt.isError).toBe(true)
    const row = await prisma.orm.public.Article.where({ id }).first()
    expect(row?.status).toBe('draft')
    expect(row?.scheduledAt).toBeNull()
  })

  it('refuses to edit a published article', async () => {
    await prisma.orm.public.Article.where({ id }).update({ status: 'published' })
    const current = (await call('get_article', { id })).structuredContent
    expect(current?.editable).toBe(false)
    const refused = await call('update_article_draft', { id, expectedUpdatedAt: current?.updatedAt, title: 'Diubah agen' })
    expect(refused.isError).toBe(true)
    expect(refused.content[0].text).toMatch(/published/)
    expect((await prisma.orm.public.Article.where({ id }).first())?.title).toBe(`Artikel MCP ${RUN}`)
  })
})

describe('MCP portfolio drafts (live DB)', () => {
  let id = 0
  let updatedAt = ''

  it('creates a draft portfolio entry with gate issues', async () => {
    const res = await call('create_portfolio_draft', {
      title: `Scene MCP ${RUN}`,
      summary: 'Pindaian interior galeri.',
      heroImage: '/images/spatium/web/pipe-04-splat.webp',
      technologies: ['Terrestrial laser scanning'],
      blocks: [{ type: 'paragraph', content: 'Catatan proyek.' }],
    })
    expect(res.isError).toBeUndefined()
    const portfolio = res.structuredContent?.portfolio
    id = portfolio.id
    created.portfolio.push(id)
    updatedAt = portfolio.updatedAt
    expect(portfolio.status).toBe('draft')
    expect(portfolio.publicUrl).toBeNull()
    expect(portfolio.editUrl).toMatch(/\/admin\?tab=portfolio&slug=/)
    expect(portfolio.outline[0].id).toEqual(expect.any(String))
    expect(portfolio.publication.ready).toBe(false)
    expect(portfolio.publication.issues.join(' ')).toMatch(/Alt Text/)
    expect((await prisma.orm.public.Portfolio.where({ id }).first())?.status).toBe('draft')
    const audit = await prisma.orm.public.SeoAuditLog.where({ entityType: 'portfolio', entityId: String(id) }).first()
    expect(audit?.actor).toBe(`mcp:vitest-content-${RUN}`)
  })

  it('rejects bad image URLs, invalid blocks and status', async () => {
    const js = await call('create_portfolio_draft', { title: `Buruk ${RUN}`, heroImage: 'javascript:alert(1)' })
    expect(js.isError).toBe(true)
    const blocks = await call('create_portfolio_draft', { title: `Buruk ${RUN}`, blocks: [{ type: 'mystery' }] })
    expect(blocks.isError).toBe(true)
    expect(blocks.content[0].text).toMatch(/portfolio/)
    const status = await call('update_portfolio_draft', { id, expectedUpdatedAt: updatedAt, status: 'published' })
    expect(status.isError).toBe(true)
  })

  it('updates with expectedUpdatedAt and refuses published entries', async () => {
    const res = await call('update_portfolio_draft', {
      id,
      expectedUpdatedAt: updatedAt,
      heroImageAlt: 'Interior galeri hasil 3D Gaussian Splat',
      metaTitle: 'Scene MCP galeri interior',
      metaDescription: 'Pindaian interior galeri untuk tur virtual.',
    })
    expect(res.isError).toBeUndefined()
    expect(res.structuredContent?.portfolio.heroImageAlt).toBe('Interior galeri hasil 3D Gaussian Splat')
    expect(res.structuredContent?.portfolio.publication.issues).toEqual([])

    const stale = await call('update_portfolio_draft', { id, expectedUpdatedAt: updatedAt, summary: 'Basi' })
    expect(stale.isError).toBe(true)
    expect(stale.content[0].text).toMatch(/conflict/)

    await prisma.orm.public.Portfolio.where({ id }).update({ status: 'published' })
    const current = (await call('get_portfolio', { id })).structuredContent
    const refused = await call('update_portfolio_draft', { id, expectedUpdatedAt: current?.updatedAt, summary: 'Diubah agen' })
    expect(refused.isError).toBe(true)
    expect(refused.content[0].text).toMatch(/published/)
  })
})

describe('MCP service drafts (live DB)', () => {
  let id = 0
  let updatedAt = ''

  it('creates a draft service linked to an existing category', async () => {
    const list = (await call('list_services', {})).structuredContent
    expect(list?.categories.map((c: { slug: string }) => c.slug)).toContain(serviceCategorySlug)

    const res = await call('create_service_draft', {
      name: `Layanan MCP ${RUN}`,
      category: serviceCategorySlug,
      shortDescription: 'Pemindaian laser untuk interior.',
    })
    expect(res.isError).toBeUndefined()
    const service = res.structuredContent?.service
    id = service.id
    created.service.push(id)
    updatedAt = service.updatedAt
    expect(service.status).toBe('draft')
    expect(service.category.slug).toBe(serviceCategorySlug)
    expect(service.publicUrl).toBeNull()
    expect(service.publication.ready).toBe(false)
    const row = await prisma.orm.public.Service.where({ id }).first()
    expect(row?.status).toBe('draft')
    expect(row?.description).toBe('Pemindaian laser untuk interior.')
  })

  it('rejects unknown categories and status', async () => {
    const bad = await call('create_service_draft', { name: `Lain ${RUN}`, category: 'tidak-ada' })
    expect(bad.isError).toBe(true)
    const publish = await call('create_service_draft', { name: `Terbit ${RUN}`, status: 'published' })
    expect(publish.isError).toBe(true)
    expect(await prisma.orm.public.Service.where({ slug: `terbit-${RUN}` }).first()).toBeNull()
  })

  it('updates with expectedUpdatedAt and refuses published services', async () => {
    const res = await call('update_service_draft', {
      id,
      expectedUpdatedAt: updatedAt,
      metaTitle: 'Layanan MCP pemindaian interior',
      metaDescription: 'Pemindaian laser interior untuk digital twin.',
      blocks: [{ type: 'paragraph', content: 'Detail layanan.' }],
    })
    expect(res.isError).toBeUndefined()
    expect(res.structuredContent?.service.publication.issues).toEqual([])
    expect(res.structuredContent?.service.blockCount).toBe(1)

    const stale = await call('update_service_draft', { id, expectedUpdatedAt: updatedAt, name: 'Basi' })
    expect(stale.isError).toBe(true)

    await prisma.orm.public.Service.where({ id }).update({ status: 'published' })
    const current = (await call('get_service', { id })).structuredContent
    const refused = await call('update_service_draft', { id, expectedUpdatedAt: current?.updatedAt, name: 'Diubah agen' })
    expect(refused.isError).toBe(true)
    expect(refused.content[0].text).toMatch(/published/)
    expect((await prisma.orm.public.Service.where({ id }).first())?.name).toBe(`Layanan MCP ${RUN}`)
  })
})
