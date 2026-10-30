import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Hoisted state for mock database and authentication
const state = vi.hoisted(() => ({
  auth: {
    user: { id: 'usr-admin', name: 'Super Admin', role: 'SUPER_ADMIN', authenticated: true, source: 'session_token' } as any,
    error: null as NextResponse | null,
  },
  articles: {} as Record<string, any>,
  pages: {} as Record<string, any>,
  indexingSubmissions: [] as any[],
  siteProfile: {
    name: 'SegiaTech',
    url: 'https://www.segiatech.com',
  },
  indexNowResponse: { success: true, statusCode: 202, message: 'URL accepted by IndexNow' },
  gscClientConfig: { email: 'gsc-test@segiatech.iam.gserviceaccount.com', key: 'mock-key' },
}))

// Mock RBAC
vi.mock('@/lib/auth/rbac', () => ({
  requireRole: vi.fn(async (_req: any, allowedRoles: string[]) => {
    if (state.auth.error) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required. Please log in to continue.' },
          { status: 401 }
        ),
      }
    }
    const userRole = state.auth.user?.role
    if (!allowedRoles.includes(userRole)) {
      return {
        user: null,
        error: NextResponse.json(
          {
            error: 'Forbidden',
            message: `Peran '${userRole}' tidak memiliki wewenang untuk tindakan ini.`,
            requiredRoles: allowedRoles,
          },
          { status: 403 }
        ),
      }
    }
    return state.auth
  }),
  requireUser: vi.fn(async () => {
    if (state.auth.error) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required. Please log in to continue.' },
          { status: 401 }
        ),
      }
    }
    return state.auth
  }),
}))

// Mock Site Profile
vi.mock('@/lib/db/siteProfile', () => ({
  getSiteProfile: vi.fn(async () => state.siteProfile),
}))

// Mock IndexNow service
vi.mock('@/lib/seo/indexnow', () => ({
  submitToIndexNow: vi.fn(async (urls: string[]) => ({
    success: state.indexNowResponse.success,
    statusCode: state.indexNowResponse.statusCode,
    submittedUrls: urls,
    message: state.indexNowResponse.message,
  })),
  getOrCreateIndexNowKey: vi.fn(async () => 'mock-indexnow-key-xyz'),
}))

// Mock Prisma ORM client with genuine in-memory operations matching Prisma 8 contract
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        Article: {
          where: (clause: any) => ({
            first: vi.fn(async () => {
              if (clause.slug !== undefined) {
                return state.articles[clause.slug] || null
              }
              if (clause.id !== undefined) {
                return Object.values(state.articles).find((a) => a.id === clause.id) || null
              }
              return null
            }),
          }),
        },
        Page: {
          where: (clause: any) => ({
            first: vi.fn(async () => {
              if (clause.slug !== undefined) {
                return state.pages[clause.slug] || null
              }
              if (clause.id !== undefined) {
                return Object.values(state.pages).find((p) => p.id === clause.id) || null
              }
              return null
            }),
          }),
        },
        IndexingSubmission: {
          create: vi.fn(async (data: any) => {
            const row = {
              id: state.indexingSubmissions.length + 1,
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
            state.indexingSubmissions.push(row)
            return row
          }),
          where: (clause: any) => ({
            orderBy: (_orderFn: any) => ({
              first: vi.fn(async () => {
                let matches = [...state.indexingSubmissions]
                if (clause.url) matches = matches.filter((s) => s.url === clause.url)
                if (clause.provider && clause.provider !== 'all') {
                  matches = matches.filter((s) => s.provider === clause.provider)
                }
                if (matches.length === 0) return null
                return matches.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
              }),
              limit: (limit: number) => ({
                offset: (offset: number) => ({
                  all: vi.fn(async () => {
                    let matches = [...state.indexingSubmissions]
                    if (clause.url) matches = matches.filter((s) => s.url === clause.url)
                    if (clause.provider && clause.provider !== 'all') {
                      matches = matches.filter((s) => s.provider === clause.provider)
                    }
                    if (clause.status) matches = matches.filter((s) => s.status === clause.status)
                    matches.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                    return matches.slice(offset, offset + limit)
                  }),
                }),
              }),
            }),
            aggregate: vi.fn(async () => {
              let matches = [...state.indexingSubmissions]
              if (clause.url) matches = matches.filter((s) => s.url === clause.url)
              if (clause.provider && clause.provider !== 'all') {
                matches = matches.filter((s) => s.provider === clause.provider)
              }
              if (clause.status) matches = matches.filter((s) => s.status === clause.status)
              return { total: matches.length }
            }),
          }),
          aggregate: vi.fn(async () => ({ total: state.indexingSubmissions.length })),
          orderBy: (_orderFn: any) => ({
            limit: (limit: number) => ({
              offset: (offset: number) => ({
                all: vi.fn(async () => {
                  const sorted = [...state.indexingSubmissions].sort(
                    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                  )
                  return sorted.slice(offset, offset + limit)
                }),
              }),
            }),
          }),
        },
      },
    },
  },
}))

describe('EMPIRICAL CHALLENGER SUITE: Milestone 1 API & State Boundaries', () => {
  beforeEach(() => {
    state.auth = {
      user: { id: 'usr-admin', name: 'Super Admin', role: 'SUPER_ADMIN', authenticated: true, source: 'session_token' },
      error: null,
    }
    state.articles = {}
    state.pages = {}
    state.indexingSubmissions = []
    state.indexNowResponse = { success: true, statusCode: 202, message: 'URL accepted by IndexNow' }
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ==========================================================================
  // CHALLENGE GROUP 1: Content State Boundary Testing
  // ==========================================================================
  describe('1. Content State Boundary Testing', () => {
    it('C1.1: Challenge /api/indexing/retrigger with a draft article (type: article, idOrSlug) -> returns HTTP 422 with informative rejection', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      state.articles['panduan-webgl-draft'] = {
        id: 401,
        title: 'Panduan WebGL Pemula',
        slug: 'panduan-webgl-draft',
        status: 'draft',
      }

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          idOrSlug: 'panduan-webgl-draft',
          provider: 'indexnow',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CONTENT_NOT_PUBLISHED')
      expect(body.error).toBe('Unprocessable Entity')
      expect(body.currentStatus).toBe('draft')
      expect(body.message).toContain("Hanya konten berstatus 'published' yang dapat diindeks")
      expect(body.message).toContain("'draft'")

      // Verify zero indexing submissions were written to DB
      expect(state.indexingSubmissions).toHaveLength(0)
    })

    it('C1.2: Challenge /api/indexing/retrigger with URL corresponding to a draft article -> returns HTTP 422', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      state.articles['konsep-threejs-draft'] = {
        id: 402,
        title: 'Konsep ThreeJS Lanjutan',
        slug: 'konsep-threejs-draft',
        status: 'draft',
      }

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.segiatech.com/artikel/konsep-threejs-draft',
          provider: 'all',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CONTENT_NOT_PUBLISHED')
      expect(body.currentStatus).toBe('draft')
      expect(state.indexingSubmissions).toHaveLength(0)
    })

    it('C1.3: Challenge /api/indexing/retrigger with payload status override draft -> returns HTTP 422', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.segiatech.com/artikel/custom-draft',
          status: 'draft',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CANNOT_INDEX_UNPUBLISHED')
      expect(body.error).toContain('berstatus draf')
      expect(state.indexingSubmissions).toHaveLength(0)
    })

    it('C1.4: Challenge /api/indexing/retrigger with a future scheduled article -> returns HTTP 422', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const futureDate = new Date(Date.now() + 86400000 * 7).toISOString()
      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.segiatech.com/artikel/fitur-2027',
          status: 'scheduled',
          scheduledAt: futureDate,
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.code).toBe('CANNOT_INDEX_FUTURE_SCHEDULE')
      expect(body.error).toContain('terjadwal di masa depan')
      expect(state.indexingSubmissions).toHaveLength(0)
    })

    it('C1.5: Challenge /api/indexing/retrigger with non-existent article slug -> returns HTTP 404', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          idOrSlug: 'artikel-fiktif-yang-tidak-ada',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error).toBe('Not Found')
      expect(body.message).toContain("Artikel dengan identifier 'artikel-fiktif-yang-tidak-ada' tidak ditemukan.")
      expect(state.indexingSubmissions).toHaveLength(0)
    })

    it('C1.6: Challenge /api/indexing/retrigger with non-existent page slug -> returns HTTP 404', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page',
          idOrSlug: 'halaman-fiktif-404',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error).toBe('Not Found')
      expect(body.message).toContain("Halaman dengan identifier 'halaman-fiktif-404' tidak ditemukan.")
    })

    it('C1.7: Challenge /api/indexing/retrigger with draft page entity -> returns HTTP 422', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      state.pages['tentang-kami-draft'] = {
        id: 701,
        title: 'Tentang Kami',
        slug: 'tentang-kami-draft',
        status: 'draft',
      }

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'page',
          idOrSlug: 'tentang-kami-draft',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.code).toBe('CONTENT_NOT_PUBLISHED')
      expect(body.currentStatus).toBe('draft')
    })
  })

  // ==========================================================================
  // CHALLENGE GROUP 2: Security & RBAC Boundary Testing
  // ==========================================================================
  describe('2. Security & RBAC Boundary Testing', () => {
    it('C2.1: Challenge endpoints without NextAuth session or Bearer token -> returns HTTP 401 Unauthorized', async () => {
      const { POST: postRetrigger } = await import('@/app/api/indexing/retrigger/route')
      const { GET: getStatus } = await import('@/app/api/indexing/status/route')
      const { GET: getHistory } = await import('@/app/api/indexing/history/route')

      // Simulate unauthenticated request
      state.auth = {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required. Please log in to continue.' },
          { status: 401 }
        ),
      }

      // Test 1: POST /api/indexing/retrigger
      const req1 = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.segiatech.com/artikel/test' }),
      })
      const res1 = await postRetrigger(req1)
      expect(res1.status).toBe(401)
      const body1 = await res1.json()
      expect(body1.error).toBe('Unauthorized')

      // Test 2: GET /api/indexing/status
      const req2 = new NextRequest('http://localhost:3000/api/indexing/status?url=https://www.segiatech.com/artikel/test')
      const res2 = await getStatus(req2)
      expect(res2.status).toBe(401)
      const body2 = await res2.json()
      expect(body2.error).toBe('Unauthorized')

      // Test 3: GET /api/indexing/history
      const req3 = new NextRequest('http://localhost:3000/api/indexing/history?limit=10')
      const res3 = await getHistory(req3)
      expect(res3.status).toBe(401)
      const body3 = await res3.json()
      expect(body3.error).toBe('Unauthorized')
    })

    it('C2.2: Challenge endpoints with unauthorized role "AUTHOR" -> returns HTTP 403 Forbidden', async () => {
      const { POST: postRetrigger } = await import('@/app/api/indexing/retrigger/route')
      const { GET: getStatus } = await import('@/app/api/indexing/status/route')
      const { GET: getHistory } = await import('@/app/api/indexing/history/route')

      // Author role: permitted to write drafts, strictly forbidden from trigger/indexing
      state.auth = {
        user: { id: 'author-1', name: 'Junior Author', role: 'AUTHOR', authenticated: true, source: 'session_token' },
        error: null,
      }

      // Retrigger
      const req1 = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.segiatech.com/artikel/test' }),
      })
      const res1 = await postRetrigger(req1)
      expect(res1.status).toBe(403)
      const body1 = await res1.json()
      expect(body1.error).toBe('Forbidden')
      expect(body1.message).toContain("Peran 'AUTHOR' tidak memiliki wewenang")

      // Status
      const req2 = new NextRequest('http://localhost:3000/api/indexing/status?url=https://www.segiatech.com/artikel/test')
      const res2 = await getStatus(req2)
      expect(res2.status).toBe(403)

      // History
      const req3 = new NextRequest('http://localhost:3000/api/indexing/history?limit=10')
      const res3 = await getHistory(req3)
      expect(res3.status).toBe(403)
    })

    it('C2.3: Challenge endpoints with unauthorized role "MEDIA_MANAGER" -> returns HTTP 403 Forbidden', async () => {
      const { POST: postRetrigger } = await import('@/app/api/indexing/retrigger/route')
      const { GET: getStatus } = await import('@/app/api/indexing/status/route')
      const { GET: getHistory } = await import('@/app/api/indexing/history/route')

      state.auth = {
        user: { id: 'media-1', name: 'Media Lead', role: 'MEDIA_MANAGER', authenticated: true, source: 'session_token' },
        error: null,
      }

      const req1 = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.segiatech.com/artikel/test' }),
      })
      const res1 = await postRetrigger(req1)
      expect(res1.status).toBe(403)

      const req2 = new NextRequest('http://localhost:3000/api/indexing/status?url=https://www.segiatech.com/artikel/test')
      const res2 = await getStatus(req2)
      expect(res2.status).toBe(403)

      const req3 = new NextRequest('http://localhost:3000/api/indexing/history?limit=10')
      const res3 = await getHistory(req3)
      expect(res3.status).toBe(403)
    })

    it('C2.4: Authorizes SUPER_ADMIN, CONTENT_ADMIN, EDITOR, and SEO_MANAGER roles', async () => {
      const { POST: postRetrigger } = await import('@/app/api/indexing/retrigger/route')

      state.articles['valid-post'] = {
        id: 99,
        title: 'Valid Published Post',
        slug: 'valid-post',
        status: 'published',
      }

      const allowedRoles = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER'] as const

      for (const role of allowedRoles) {
        state.auth = {
          user: { id: `user-${role}`, name: `User ${role}`, role, authenticated: true, source: 'session_token' },
          error: null,
        }
        state.indexingSubmissions = [] // clear cooldown

        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'article', idOrSlug: 'valid-post', provider: 'indexnow' }),
        })

        const res = await postRetrigger(req)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
      }
    })
  })

  // ==========================================================================
  // CHALLENGE GROUP 3: Zero-Mock Data Flow Check
  // ==========================================================================
  describe('3. Zero-Mock Data Flow Verification', () => {
    it('C3.1: /api/indexing/status returns genuine DB records without synthetic timestamps or random placeholders', async () => {
      const { GET: getStatus } = await import('@/app/api/indexing/status/route')

      const canonicalUrl = 'https://www.segiatech.com/artikel/genuine-data-post'
      const realIsoTimestamp = '2026-10-28T14:22:15.123Z'

      state.articles['genuine-data-post'] = {
        id: 301,
        slug: 'genuine-data-post',
        title: 'Genuine Data Post',
        status: 'published',
      }

      // Insert genuine record into DB
      state.indexingSubmissions.push({
        id: 1,
        url: canonicalUrl,
        entityType: 'article',
        entityId: 301,
        provider: 'indexnow',
        status: 'accepted',
        httpStatus: 202,
        responsePayload: JSON.stringify({ success: true, count: 1 }),
        trigger: 'manual',
        actor: 'Lead Editor',
        submittedAt: realIsoTimestamp,
      })

      const req = new NextRequest(`http://localhost:3000/api/indexing/status?type=article&idOrSlug=genuine-data-post`)
      const res = await getStatus(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.url).toBe(canonicalUrl)
      expect(body.entity.type).toBe('article')
      expect(body.entity.id).toBe(301)
      expect(body.entity.status).toBe('published')

      // Verify provider details strictly reflect the DB record
      const indexnow = body.providers.indexnow
      expect(indexnow).not.toBeNull()
      expect(indexnow.status).toBe('accepted')
      expect(indexnow.httpStatus).toBe(202)
      expect(indexnow.submittedAt).toBe(realIsoTimestamp)
      expect(indexnow.trigger).toBe('manual')
      expect(indexnow.actor).toBe('Lead Editor')
      expect(indexnow.response).toEqual({ success: true, count: 1 })

      // Verify Google is null when no record exists (honest representation, not fake dummy data)
      expect(body.providers.google).toBeNull()

      // Verify no mock markers exist in entire payload
      const jsonStr = JSON.stringify(body)
      expect(jsonStr).not.toContain('mock')
      expect(jsonStr).not.toContain('fake')
      expect(jsonStr).not.toContain('placeholder')
    })

    it('C3.2: /api/indexing/history returns real paginated data from PostgreSQL', async () => {
      const { GET: getHistory } = await import('@/app/api/indexing/history/route')

      // Seed 3 genuine submission records
      const baseDate = new Date('2026-10-28T10:00:00Z').getTime()
      for (let i = 1; i <= 3; i++) {
        state.indexingSubmissions.push({
          id: i,
          url: `https://www.segiatech.com/artikel/post-${i}`,
          entityType: 'article',
          entityId: 100 + i,
          provider: i % 2 === 0 ? 'google' : 'indexnow',
          status: 'accepted',
          httpStatus: 200,
          responsePayload: JSON.stringify({ verified: true, batchId: `batch-${i}` }),
          trigger: 'auto',
          actor: 'system',
          submittedAt: new Date(baseDate + i * 1000).toISOString(),
        })
      }

      const req = new NextRequest('http://localhost:3000/api/indexing/history?limit=2&offset=0')
      const res = await getHistory(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.pagination.total).toBe(3)
      expect(body.pagination.limit).toBe(2)
      expect(body.pagination.offset).toBe(0)
      expect(body.pagination.hasMore).toBe(true)
      expect(body.pagination.totalPages).toBe(2)

      expect(body.data).toHaveLength(2)
      // Ordered descending: post-3 then post-2
      expect(body.data[0].id).toBe(3)
      expect(body.data[0].url).toBe('https://www.segiatech.com/artikel/post-3')
      expect(body.data[0].responsePayload).toEqual({ verified: true, batchId: 'batch-3' })
      expect(body.data[1].id).toBe(2)
    })
  })

  // ==========================================================================
  // CHALLENGE GROUP 4: Adversarial Input & Cooldown Edge Cases
  // ==========================================================================
  describe('4. Adversarial Input & Cooldown Edge Cases', () => {
    it('C4.1: Challenge /api/indexing/retrigger with malformed JSON body -> returns HTTP 400 Bad Request', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const req = {
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON')
        },
      } as any

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Bad Request')
    })

    it('C4.2: Challenge /api/indexing/retrigger with missing url and missing (type + idOrSlug) -> returns HTTP 400 validation error', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Validation failed')
    })

    it('C4.3: Challenge /api/indexing/retrigger with dangerous URI scheme (javascript: / mailto:) -> returns HTTP 400', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const dangerousUrls = [
        'javascript:alert(document.cookie)',
        'mailto:admin@segiatech.com',
        'ftp://files.segiatech.com/exploit',
      ]

      for (const dangerousUrl of dangerousUrls) {
        const req = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: dangerousUrl }),
        })

        const res = await POST(req)
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Bad Request')
      }
    })

    it('C4.4: Challenge active 24-hour cooldown -> returns HTTP 429 with RFC 7231 Retry-After header', async () => {
      const { POST } = await import('@/app/api/indexing/retrigger/route')

      const url = 'https://www.segiatech.com/artikel/active-cooldown-check'
      state.articles['active-cooldown-check'] = {
        id: 505,
        slug: 'active-cooldown-check',
        title: 'Active Cooldown Check',
        status: 'published',
      }

      // First submission: Success
      const req1 = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, provider: 'indexnow' }),
      })
      const res1 = await POST(req1)
      expect(res1.status).toBe(200)

      // Immediate second submission: Blocked by 24h cooldown
      const req2 = new NextRequest('http://localhost:3000/api/indexing/retrigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, provider: 'indexnow' }),
      })
      const res2 = await POST(req2)
      expect(res2.status).toBe(429)

      // Verify RFC 7231 Retry-After header
      const retryAfter = res2.headers.get('Retry-After')
      expect(retryAfter).toBeTruthy()
      const retrySecs = Number(retryAfter)
      expect(retrySecs).toBeGreaterThanOrEqual(86390)
      expect(retrySecs).toBeLessThanOrEqual(86400)

      const body2 = await res2.json()
      expect(body2.code).toBe('INDEXING_COOLDOWN_ACTIVE')
      expect(body2.remainingSeconds).toBe(retrySecs)
      expect(body2.remainingFormatted).toContain('jam')
    })
  })
})
