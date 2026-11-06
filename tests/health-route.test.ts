import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const first = vi.fn()
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: { Site: { first } } } } }))

const { GET } = await import('../src/app/api/health/route')

describe('GET /api/health (ROADMAP 3.3)', () => {
  beforeEach(() => {
    first.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 when the database answers', async () => {
    first.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok', db: 'up' })
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('returns 503 without leaking the error when the database is down', async () => {
    first.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:5432 password=secret'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toMatchObject({ status: 'degraded', db: 'down' })
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED')
  })

  it('shares one in-flight query across concurrent probes', async () => {
    let resolve: (value: null) => void = () => undefined
    first.mockReturnValue(new Promise<null>((r) => { resolve = r }))
    const probes = Promise.all([GET(), GET(), GET()])
    resolve(null)
    const results = await probes
    expect(first).toHaveBeenCalledTimes(1)
    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
  })
})
