import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  checkIndexingCooldown,
  createIndexingCooldownResponse,
  normalizeIndexingUrl,
  formatRemainingDurationIndonesian,
  INDEXING_COOLDOWN_MS,
} from '../src/lib/seo/indexing-rate-limit'
import {
  createIndexingSubmission,
  getLatestIndexingSubmission,
  getLatestSubmissionsForUrl,
  getIndexingHistory,
} from '../src/lib/db/indexing'

// Shared state for hoisted mocks
const mockState = vi.hoisted(() => ({
  firstResult: null as any,
  lastWhereQuery: null as any,
  lastOrderByQuery: null as any,
  createdRecords: [] as any[],
  articles: {} as Record<string, any>,
  pages: {} as Record<string, any>,
  authResult: { user: { id: 'admin-1', name: 'Admin', role: 'SUPER_ADMIN', authenticated: true, source: 'session_token' }, error: null } as any,
  indexNowResult: { success: true, submittedUrls: [], message: 'Success' },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requireRole: vi.fn(async (_req: any, allowedRoles: string[]) => {
    if (mockState.authResult.error) {
      return mockState.authResult
    }
    const userRole = mockState.authResult.user?.role
    if (!allowedRoles.includes(userRole)) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Forbidden', message: `Role ${userRole} unauthorized` },
          { status: 403 }
        ),
      }
    }
    return mockState.authResult
  }),
  requireUser: vi.fn(async () => mockState.authResult),
}))

vi.mock('@/lib/seo/indexnow', () => ({
  submitToIndexNow: vi.fn(async (urls: string[]) => {
    return {
      success: mockState.indexNowResult.success,
      statusCode: mockState.indexNowResult.success ? 202 : 500,
      submittedUrls: urls,
      message: mockState.indexNowResult.message,
    }
  }),
  getOrCreateIndexNowKey: vi.fn(async () => 'mock-indexnow-key-1234567890'),
}))

vi.mock('@/lib/db/siteProfile', () => ({
  getSiteProfile: vi.fn(async () => ({
    name: 'SegiaTech',
    url: 'https://www.segiatech.com',
  })),
}))

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        IndexingSubmission: {
          create: vi.fn(async (data: any) => {
            const record = {
              id: mockState.createdRecords.length + 1,
              url: data.url,
              entityType: data.entityType ?? null,
              entityId: data.entityId ?? null,
              provider: data.provider,
              status: data.status,
              httpStatus: data.httpStatus ?? null,
              responsePayload: data.responsePayload ?? null,
              trigger: data.trigger ?? 'auto',
              actor: data.actor ?? null,
              submittedAt: new Date().toISOString(),
            }
            mockState.createdRecords.push(record)
            return record
          }),
          where: (clause: any) => {
            mockState.lastWhereQuery = clause
            return {
              orderBy: (orderFn: any) => {
                mockState.lastOrderByQuery = orderFn
                return {
                  first: vi.fn(async () => mockState.firstResult),
                  limit: (lim: number) => ({
                    offset: (off: number) => ({
                      all: vi.fn(async () => {
                        let filtered = [...mockState.createdRecords]
                        if (clause.url) {
                          filtered = filtered.filter((r) => r.url === clause.url)
                        }
                        if (clause.provider) {
                          filtered = filtered.filter((r) => r.provider === clause.provider)
                        }
                        if (clause.status) {
                          filtered = filtered.filter((r) => r.status === clause.status)
                        }
                        return filtered.slice(off, off + lim)
                      }),
                    }),
                  }),
                }
              },
              aggregate: vi.fn(async () => ({ total: mockState.createdRecords.length })),
              first: vi.fn(async () => mockState.firstResult),
            }
          },
          aggregate: vi.fn(async () => ({ total: mockState.createdRecords.length })),
          orderBy: (orderFn: any) => ({
            limit: (lim: number) => ({
              offset: (off: number) => ({
                all: vi.fn(async () => mockState.createdRecords.slice(off, off + lim)),
              }),
            }),
          }),
        },
        Article: {
          where: (clause: any) => ({
            first: vi.fn(async () => {
              if (clause.slug && mockState.articles[clause.slug]) {
                return mockState.articles[clause.slug]
              }
              if (clause.id) {
                const found = Object.values(mockState.articles).find((a) => a.id === clause.id)
                return found || null
              }
              return null
            }),
          }),
        },
        Page: {
          where: (clause: any) => ({
            first: vi.fn(async () => {
              if (clause.slug && mockState.pages[clause.slug]) {
                return mockState.pages[clause.slug]
              }
              if (clause.id) {
                const found = Object.values(mockState.pages).find((p) => p.id === clause.id)
                return found || null
              }
              return null
            }),
          }),
        },
      },
    },
  },
}))

describe('Indexing Rate Limit Engine (Milestone 1)', () => {
  beforeEach(() => {
    mockState.firstResult = null
    mockState.lastWhereQuery = null
    mockState.lastOrderByQuery = null
    mockState.createdRecords = []
    mockState.articles = {}
    mockState.pages = {}
    mockState.authResult = {
      user: { id: 'admin-1', name: 'Admin', role: 'SUPER_ADMIN', authenticated: true, source: 'session_token' },
      error: null,
    }
    mockState.indexNowResult = { success: true, submittedUrls: [], message: 'Success' }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('1. URL Normalization (normalizeIndexingUrl)', () => {
    it('normalizes relative path with leading slash', () => {
      expect(normalizeIndexingUrl('/artikel/interactive-3d-aquarium')).toBe(
        'https://www.segiatech.com/artikel/interactive-3d-aquarium'
      )
    })

    it('normalizes relative path without leading slash', () => {
      expect(normalizeIndexingUrl('artikel/interactive-3d-aquarium')).toBe(
        'https://www.segiatech.com/artikel/interactive-3d-aquarium'
      )
    })

    it('removes trailing slash on subpath', () => {
      expect(
        normalizeIndexingUrl('https://www.segiatech.com/artikel/interactive-3d-aquarium/')
      ).toBe('https://www.segiatech.com/artikel/interactive-3d-aquarium')
    })

    it('preserves root trailing slash for homepage', () => {
      expect(normalizeIndexingUrl('/')).toBe('https://www.segiatech.com/')
      expect(normalizeIndexingUrl('https://www.segiatech.com')).toBe('https://www.segiatech.com/')
      expect(normalizeIndexingUrl('https://www.segiatech.com/')).toBe('https://www.segiatech.com/')
    })

    it('normalizes uppercase hostname and protocol', () => {
      expect(
        normalizeIndexingUrl('HTTP://WWW.SEGIATECH.COM/layanan/web-dev/')
      ).toBe('https://www.segiatech.com/layanan/web-dev')
    })

    it('strips query parameters and hash fragments', () => {
      expect(
        normalizeIndexingUrl('/artikel/post?utm_source=twitter&gclid=123#komentar')
      ).toBe('https://www.segiatech.com/artikel/post')
    })

    it('throws on unsupported protocols or empty input', () => {
      expect(() => normalizeIndexingUrl('')).toThrow()
      expect(() => normalizeIndexingUrl('javascript:alert(1)')).toThrow()
      expect(() => normalizeIndexingUrl('mailto:contact@segiatech.com')).toThrow()
    })
  })

  describe('2. Indonesian Duration Formatter', () => {
    it('formats exact hours, minutes, and seconds', () => {
      expect(formatRemainingDurationIndonesian(86390)).toBe('23 jam 59 menit 50 detik')
      expect(formatRemainingDurationIndonesian(3665)).toBe('1 jam 1 menit 5 detik')
      expect(formatRemainingDurationIndonesian(50)).toBe('0 jam 0 menit 50 detik')
      expect(formatRemainingDurationIndonesian(0)).toBe('0 detik')
    })
  })

  describe('3. Cooldown Verification & Edge Cases (checkIndexingCooldown)', () => {
    const fixedNow = new Date('2026-10-28T12:00:00.000Z').getTime()

    it('Edge Case: URL never submitted -> allowed immediately', async () => {
      mockState.firstResult = null

      const res = await checkIndexingCooldown('/artikel/post-baru', 'all', fixedNow)
      expect(res.allowed).toBe(true)
      expect(res.remainingSeconds).toBe(0)
      expect(res.remainingFormatted).toBe('')
      expect(res.lastSubmittedAt).toBeUndefined()
    })

    it('Edge Case: URL submitted >24 hours ago -> allowed', async () => {
      const submittedAt = new Date(fixedNow - 25 * 3600 * 1000).toISOString() // 25 hours ago
      mockState.firstResult = {
        url: 'https://www.segiatech.com/artikel/lama',
        provider: 'indexnow',
        submittedAt,
      }

      const res = await checkIndexingCooldown('/artikel/lama', 'all', fixedNow)
      expect(res.allowed).toBe(true)
      expect(res.remainingSeconds).toBe(0)
      expect(res.lastSubmittedAt).toBe(submittedAt)
    })

    it('Edge Case: URL submitted 10 seconds ago -> blocked with 23h 59m 50s cooldown', async () => {
      const submittedAt = new Date(fixedNow - 10_000).toISOString() // 10s ago
      mockState.firstResult = {
        url: 'https://www.segiatech.com/artikel/interactive-3d-aquarium',
        provider: 'all',
        submittedAt,
      }

      const res = await checkIndexingCooldown(
        '/artikel/interactive-3d-aquarium',
        'all',
        fixedNow
      )
      expect(res.allowed).toBe(false)
      expect(res.remainingSeconds).toBe(86390)
      expect(res.remainingFormatted).toBe('23 jam 59 menit 50 detik')
      expect(res.nextAvailableAt).toBe(
        new Date(fixedNow - 10_000 + INDEXING_COOLDOWN_MS).toISOString()
      )
    })

    it('Edge Case: boundary calculation at exactly 24 hours - 1 second', async () => {
      const submittedAt = new Date(fixedNow - (INDEXING_COOLDOWN_MS - 1000)).toISOString() // 1s left
      mockState.firstResult = {
        url: 'https://www.segiatech.com/artikel/hampir-selesai',
        provider: 'google',
        submittedAt,
      }

      const res = await checkIndexingCooldown('/artikel/hampir-selesai', 'google', fixedNow)
      expect(res.allowed).toBe(false)
      expect(res.remainingSeconds).toBe(1)
      expect(res.remainingFormatted).toBe('0 jam 0 menit 1 detik')
    })

    it('Provider isolation: IndexNow cooldown does not block independent Google retrigger', async () => {
      const submittedAt = new Date(fixedNow - 3600_000).toISOString() // 1 hour ago
      mockState.firstResult = {
        url: 'https://www.segiatech.com/artikel/isolated',
        provider: 'indexnow',
        submittedAt,
      }

      // Check IndexNow specifically -> blocked
      const resIndexNow = await checkIndexingCooldown('/artikel/isolated', 'indexnow', fixedNow)
      expect(resIndexNow.allowed).toBe(false)
      expect(mockState.lastWhereQuery.provider).toBe('indexnow')

      // Check Google specifically (when DB returns null for Google)
      mockState.firstResult = null
      const resGoogle = await checkIndexingCooldown('/artikel/isolated', 'google', fixedNow)
      expect(resGoogle.allowed).toBe(true)
      expect(mockState.lastWhereQuery.provider).toBe('google')
    })
  })

  describe('4. HTTP 429 Generator Helper (createIndexingCooldownResponse)', () => {
    it('sets HTTP 429 status, standard Retry-After header, and structured payload', async () => {
      const mockCooldownResult = {
        allowed: false,
        remainingSeconds: 86390,
        remainingFormatted: '23 jam 59 menit 50 detik',
        lastSubmittedAt: '2026-10-28T11:59:50.000Z',
        nextAvailableAt: '2026-10-29T11:59:50.000Z',
        url: 'https://www.segiatech.com/artikel/interactive-3d-aquarium',
        provider: 'all' as const,
      }

      const response = createIndexingCooldownResponse(mockCooldownResult)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('86390')

      const json = await response.json()
      expect(json.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      expect(json.error).toBe('Too Many Requests')
      expect(json.remainingSeconds).toBe(86390)
      expect(json.remainingFormatted).toBe('23 jam 59 menit 50 detik')
      expect(json.nextAvailableAt).toBe('2026-10-29T11:59:50.000Z')
      expect(json.message).toContain('23 jam 59 menit 50 detik')
      expect(json.cooldown.url).toBe(
        'https://www.segiatech.com/artikel/interactive-3d-aquarium'
      )
    })
  })

  describe('5. Database Persistence Layer (web/src/lib/db/indexing.ts)', () => {
    it('creates an indexing submission and persists all fields', async () => {
      const record = await createIndexingSubmission({
        url: 'https://www.segiatech.com/artikel/test',
        provider: 'indexnow',
        status: 'accepted',
        entityType: 'article',
        entityId: 101,
        httpStatus: 202,
        responsePayload: JSON.stringify({ ok: true }),
        trigger: 'manual',
        actor: 'admin',
      })

      expect(record.id).toBeDefined()
      expect(record.url).toBe('https://www.segiatech.com/artikel/test')
      expect(record.provider).toBe('indexnow')
      expect(record.status).toBe('accepted')
      expect(record.httpStatus).toBe(202)
      expect(mockState.createdRecords).toHaveLength(1)
    })

    it('retrieves the latest submission for URL', async () => {
      mockState.firstResult = {
        id: 1,
        url: 'https://www.segiatech.com/artikel/test',
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 200,
        submittedAt: '2026-10-28T12:00:00Z',
      }

      const latest = await getLatestIndexingSubmission('https://www.segiatech.com/artikel/test', 'indexnow')
      expect(latest).not.toBeNull()
      expect(latest?.status).toBe('accepted')
    })

    it('retrieves dual provider submissions via getLatestSubmissionsForUrl', async () => {
      mockState.firstResult = {
        id: 2,
        url: 'https://www.segiatech.com/artikel/dual',
        provider: 'google',
        status: 'success',
        submittedAt: '2026-10-28T12:00:00Z',
      }

      const dual = await getLatestSubmissionsForUrl('https://www.segiatech.com/artikel/dual')
      expect(dual).toHaveProperty('indexnow')
      expect(dual).toHaveProperty('google')
    })

    it('retrieves paginated indexing history', async () => {
      mockState.createdRecords = [
        { id: 1, url: 'https://www.segiatech.com/a', provider: 'indexnow', status: 'accepted', submittedAt: '2026-10-28T10:00:00Z' },
        { id: 2, url: 'https://www.segiatech.com/b', provider: 'google', status: 'success', submittedAt: '2026-10-28T11:00:00Z' },
      ]

      const history = await getIndexingHistory({ limit: 10, offset: 0 })
      expect(history.meta.total).toBe(2)
      expect(history.data).toHaveLength(2)
    })
  })

  describe('6. API Route Handlers', () => {
    describe('POST /api/indexing/retrigger', () => {
      it('rejects unauthorized user roles with HTTP 403', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')
        mockState.authResult = {
          user: { id: 'u1', name: 'Author', role: 'AUTHOR', authenticated: true, source: 'session_token' },
          error: null,
        }

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://www.segiatech.com/artikel/test' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(403)
      })

      it('rejects unauthenticated requests with HTTP 401', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')
        mockState.authResult = {
          user: null,
          error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        }

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://www.segiatech.com/artikel/test' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(401)
      })

      it('rejects unpublished drafts with HTTP 422', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')
        mockState.articles['draft-post'] = {
          id: 50,
          title: 'Draft Post',
          slug: 'draft-post',
          status: 'draft',
        }

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'article', idOrSlug: 'draft-post' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(422)
        const body = await res.json()
        expect(body.code).toBe('CONTENT_NOT_PUBLISHED')
      })

      it('rejects future scheduled articles with HTTP 422', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'https://www.segiatech.com/artikel/future-post',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() + 86400000 * 5).toISOString(),
          }),
        })

        const res = await POST(req)
        expect(res.status).toBe(422)
        const body = await res.json()
        expect(body.code).toBe('CANNOT_INDEX_FUTURE_SCHEDULE')
      })

      it('returns HTTP 429 when URL is under active 24-hour cooldown', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')
        const testUrl = 'https://www.segiatech.com/artikel/active-cooldown'

        // Mock DB returns recent submission (10s ago)
        mockState.firstResult = {
          id: 1,
          url: testUrl,
          provider: 'indexnow',
          status: 'accepted',
          submittedAt: new Date(Date.now() - 10000).toISOString(),
        }

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: testUrl, provider: 'indexnow' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(429)
        expect(res.headers.get('Retry-After')).toBeDefined()
        const body = await res.json()
        expect(body.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      })

      it('successfully retriggers indexing for published content and records submission', async () => {
        const { POST } = await import('../src/app/api/indexing/retrigger/route')
        mockState.articles['published-article'] = {
          id: 88,
          title: 'Published Article',
          slug: 'published-article',
          status: 'published',
        }
        mockState.firstResult = null // no cooldown

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'article', idOrSlug: 'published-article', provider: 'indexnow' }),
        })

        const res = await POST(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.url).toBe('https://www.segiatech.com/artikel/published-article')
        expect(body.cooldown.durationSeconds).toBe(86400)
        expect(mockState.createdRecords.some((r) => r.url.includes('published-article'))).toBe(true)
      })
    })

    describe('GET /api/indexing/status', () => {
      it('returns status and cooldown details for a published article', async () => {
        const { GET } = await import('../src/app/api/indexing/status/route')
        mockState.articles['my-post'] = {
          id: 99,
          slug: 'my-post',
          status: 'published',
        }
        mockState.firstResult = null // not in cooldown

        const req = new NextRequest('http://localhost:3000/api/indexing/status?type=article&idOrSlug=my-post')
        const res = await GET(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.url).toBe('https://www.segiatech.com/artikel/my-post')
        expect(body.canRetrigger).toBe(true)
        expect(body.cooldown.inCooldown).toBe(false)
      })

      it('indicates blocked retrigger when article is draft', async () => {
        const { GET } = await import('../src/app/api/indexing/status/route')
        mockState.articles['draft-status'] = {
          id: 100,
          slug: 'draft-status',
          status: 'draft',
        }

        const req = new NextRequest('http://localhost:3000/api/indexing/status?type=article&idOrSlug=draft-status')
        const res = await GET(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.canRetrigger).toBe(false)
        expect(body.retriggerBlockedReason).toContain('published')
      })
    })

    describe('GET /api/indexing/history', () => {
      it('returns paginated indexing history', async () => {
        const { GET } = await import('../src/app/api/indexing/history/route')
        mockState.createdRecords = [
          {
            id: 1,
            url: 'https://www.segiatech.com/artikel/sample',
            provider: 'indexnow',
            status: 'accepted',
            httpStatus: 202,
            responsePayload: '{"success":true}',
            trigger: 'manual',
            actor: 'Admin',
            submittedAt: '2026-10-28T12:00:00Z',
          },
        ]

        const req = new NextRequest('http://localhost:3000/api/indexing/history?limit=10&offset=0')
        const res = await GET(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.data).toHaveLength(1)
        expect(body.pagination.total).toBe(1)
        expect(body.data[0].provider).toBe('indexnow')
      })
    })
  })
})
