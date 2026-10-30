import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ aggregate: vi.fn(), denied: false }))
vi.mock('@/lib/auth/rbac', () => ({
  requireUser: async () => state.denied ? { error: new Response('Denied', { status: 401 }) } : { error: null, user: { id: 'test' } },
  requireRole: vi.fn(),
}))
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: Object.fromEntries(['Article', 'Portfolio', 'Service', 'ServiceCategory', 'Solution', 'Page', 'Redirect'].map((name) => [name, { aggregate: state.aggregate }])) } } }))
import { GET } from '../src/app/api/system/status/route'
const request = () => new NextRequest('http://localhost/api/system/status')
beforeEach(() => { state.denied = false; state.aggregate.mockReset() })
describe('Truthful database health reporting', () => {
  it('returns measured counts and disables caching on success', async () => {
    state.aggregate.mockResolvedValue({ count: 7 })
    const response = await GET(request())
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(data.online).toBe(true)
    expect(data.counts.articles).toBe(7)
    expect(data.contentTypes).toHaveLength(7)
    expect(data.latency).toMatch(/^\d+ms$/)
    expect(Date.parse(data.checkedAt)).toBeGreaterThan(0)
  })
  it('reports unavailable counts instead of fabricated zeros or active entities when a query fails', async () => {
    state.aggregate.mockRejectedValue(new Error('Database unavailable'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await GET(request())
      const data = await response.json()
      expect(response.status).toBe(503)
      expect(data).toMatchObject({ online: false, counts: null, latency: null, contentTypes: [] })
      expect(log).toHaveBeenCalledWith(expect.stringContaining('database_health_failure'))
    } finally { log.mockRestore() }
  })
  it('requires authentication before reading aggregate counts', async () => {
    state.denied = true
    expect((await GET(request())).status).toBe(401)
    expect(state.aggregate).not.toHaveBeenCalled()
  })
})
