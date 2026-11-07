/**
 * Catalog save conflicts (optimistic concurrency) and the read-only revisions
 * endpoint, through the real route handlers against the local PostgreSQL.
 * The session is mocked like tests/rbac-route-enforcement.test.ts.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db as prisma } from '../prisma/db'

const session = vi.hoisted(() => ({ role: 'EDITOR' as string | null }))
const ACTOR = 'concurrency-test@spatium.test'

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => (session.role ? { id: 'usr_concurrency_test', email: ACTOR, name: 'Concurrency test' } : null)),
}))
vi.mock('@/lib/auth/secret', () => ({
  getValidatedAuthSecret: () => 'catalog-concurrency-test-secret-value',
  validateBearerToken: () => false,
}))
vi.mock('@/lib/auth/credentials', () => ({
  resolveCurrentRole: vi.fn(async () => session.role),
}))

const ORIGIN = 'http://localhost:3002'
const RUN = Date.now().toString(36)
const created = { portfolio: [] as number[], service_category: [] as number[] }

function post(path: string, body: unknown): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { origin: ORIGIN, host: 'localhost:3002', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}
const get = (path: string) => new NextRequest(`${ORIGIN}${path}`, { headers: { origin: ORIGIN, host: 'localhost:3002' } })

beforeEach(() => {
  session.role = 'EDITOR'
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterAll(async () => {
  for (const id of created.portfolio) await prisma.orm.public.Portfolio.where({ id }).deleteAll()
  for (const id of created.service_category) await prisma.orm.public.ServiceCategory.where({ id }).deleteAll()
  for (const [entityType, ids] of Object.entries(created)) {
    for (const id of ids) {
      await prisma.orm.public.ContentRevision.where({ entityType, entityId: String(id) }).deleteAll()
      await prisma.orm.public.SeoAuditLog.where({ entityType, entityId: String(id) }).deleteAll()
    }
  }
})

describe('portfolio saves with expectedUpdatedAt', () => {
  let id = 0
  let loadedAt = ''

  it('creates a draft and saves when the loaded version is current', async () => {
    const { POST } = await import('@/app/api/portfolio/route')
    const res = await POST(post('/api/portfolio', { title: `Konflik ${RUN}`, slug: `konflik-${RUN}` }))
    expect(res.status).toBe(200)
    const body = await res.json()
    id = body.id
    created.portfolio.push(id)
    loadedAt = body.updatedAt
    expect(typeof loadedAt).toBe('string')

    const update = await POST(post('/api/portfolio', { id, title: 'Versi rekan', slug: `konflik-${RUN}`, summary: 'Disimpan rekan', expectedUpdatedAt: loadedAt }))
    expect(update.status).toBe(200)
    const saved = await update.json()
    expect(saved.message).toBe('Perubahan disimpan.')
    expect(saved.updatedAt).not.toBe(loadedAt)
  })

  it('refuses a stale save with 409 conflict and keeps the newer version', async () => {
    const { POST } = await import('@/app/api/portfolio/route')
    const stored = await prisma.orm.public.Portfolio.where({ id }).first()
    const res = await POST(post('/api/portfolio', { id, title: 'Versi saya', slug: `konflik-${RUN}`, expectedUpdatedAt: loadedAt }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body).toMatchObject({ success: false, code: 'conflict', currentUpdatedAt: stored?.updatedAt })
    expect(body.error).toMatch(/^Portofolio ini sudah diubah orang lain/)
    expect(JSON.stringify(body)).not.toMatch(/stack|Error:/)
    expect((await prisma.orm.public.Portfolio.where({ id }).first())?.title).toBe('Versi rekan')
  })

  it('overwrites deliberately with the current updatedAt', async () => {
    const { POST } = await import('@/app/api/portfolio/route')
    const stored = await prisma.orm.public.Portfolio.where({ id }).first()
    const res = await POST(post('/api/portfolio', { id, title: 'Versi saya', slug: `konflik-${RUN}`, expectedUpdatedAt: stored?.updatedAt }))
    expect(res.status).toBe(200)
    const after = await prisma.orm.public.Portfolio.where({ id }).first()
    expect(after?.title).toBe('Versi saya')
    expect(after?.summary).toBe('Disimpan rekan')
  })

  it('lists revisions (who, what, when) with the content each change produced', async () => {
    const { GET } = await import('@/app/api/portfolio/[id]/revisions/route')
    const res = await GET(get(`/api/portfolio/${id}/revisions`), { params: Promise.resolve({ id: String(id) }) })
    expect(res.status).toBe(200)
    const { data } = await res.json()
    const actions = data.revisions.map((r: { action: string }) => r.action)
    expect(actions).toEqual(['update', 'update', 'create'])
    expect(data.revisions.every((r: { actor: string }) => r.actor === ACTOR)).toBe(true)
    expect(data.revisions[0]).toMatchObject({ isCurrent: true, changedFields: ['title'] })
    expect(data.revisions[0].version.title).toBe('Versi saya')
    expect(data.revisions[1]).toMatchObject({ isCurrent: false, changedFields: ['summary', 'title'] })
    expect(data.revisions[1].version.title).toBe('Versi rekan')
    expect(data.revisions[2].version.title).toBe(`Konflik ${RUN}`)
  })

  it('refuses revisions to roles that cannot edit, and unknown ids', async () => {
    const { GET } = await import('@/app/api/portfolio/[id]/revisions/route')
    session.role = 'AUTHOR'
    expect((await GET(get(`/api/portfolio/${id}/revisions`), { params: Promise.resolve({ id: String(id) }) })).status).toBe(403)
    session.role = 'REVIEWER'
    expect((await GET(get(`/api/portfolio/${id}/revisions`), { params: Promise.resolve({ id: String(id) }) })).status).toBe(403)
    session.role = 'EDITOR'
    const missing = await GET(get('/api/portfolio/999999999/revisions'), { params: Promise.resolve({ id: '999999999' }) })
    expect(missing.status).toBe(404)
    expect((await missing.json()).code).toBe('not_found')
  })
})

describe('service category saves with expectedUpdatedAt', () => {
  it('refuses a stale save with 409 conflict', async () => {
    const { POST } = await import('@/app/api/service-categories/route')
    const res = await POST(post('/api/service-categories', { title: `Kategori ${RUN}`, slug: `kategori-konflik-${RUN}` }))
    expect(res.status).toBe(200)
    const body = await res.json()
    const id: number = body.data.id
    created.service_category.push(id)

    const first = await POST(post('/api/service-categories', { id, title: 'Versi rekan', slug: `kategori-konflik-${RUN}`, expectedUpdatedAt: body.updatedAt }))
    expect(first.status).toBe(200)
    const stale = await POST(post('/api/service-categories', { id, title: 'Versi saya', slug: `kategori-konflik-${RUN}`, expectedUpdatedAt: body.updatedAt }))
    expect(stale.status).toBe(409)
    expect(await stale.json()).toMatchObject({ code: 'conflict', error: expect.stringMatching(/^Kategori layanan ini sudah diubah orang lain/) })
  })
})
