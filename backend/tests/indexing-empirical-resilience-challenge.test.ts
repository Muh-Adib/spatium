import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Hoisted state for mock database and authentication
const state = vi.hoisted(() => ({
  role: 'EDITOR',
  user: { id: 'usr-editor-1', name: 'Editor SegiaTech', role: 'EDITOR', email: 'editor@segiatech.com', authenticated: true },
  articles: {} as Record<string, any>,
  submissions: [] as any[],
  siteConfig: {
    id: 1,
    name: 'SegiaTech',
    url: 'https://www.segiatech.com',
    indexNowKey: 'mock-indexnow-key-challenge-12345678',
  },
  pendingBackgroundTasks: [] as Promise<any>[],
  dbFailures: {
    indexingSubmissionCreate: false,
  },
  fetchMocks: {
    indexNowStatus: 202,
    indexNowDelayMs: 0,
    indexNowTimeout: false,
    gscStatus: 200,
    gscDelayMs: 0,
    gscVerdict: 'PASS',
  },
  timing: {
    txStartedAt: 0,
    txEndedAt: 0,
    indexingStartedAt: [] as number[],
    indexingEndedAt: [] as number[],
  },
}))

// Mock next/server after() to capture background tasks deterministically
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: vi.fn((fn: () => any) => {
      const p = Promise.resolve().then(fn)
      state.pendingBackgroundTasks.push(p)
      return p
    }),
  }
})

// Mock GSC access token generation
vi.mock('@/lib/gsc/client', () => ({
  getGoogleAccessToken: vi.fn(async () => 'mock-google-access-token-challenge'),
}))

// Mock RBAC
vi.mock('@/lib/auth/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/rbac')>()
  return {
    ...actual,
    requireUser: vi.fn(async () => ({
      error: null,
      user: state.user,
    })),
    requireRole: vi.fn(async (_req: any, allowedRoles: string[]) => {
      if (!allowedRoles.includes(state.user.role)) {
        return {
          error: {
            status: 403,
            json: async () => ({ error: 'Forbidden' }),
          },
          user: null,
        }
      }
      return {
        error: null,
        user: state.user,
      }
    }),
  }
})

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Site Profile
vi.mock('@/lib/db/siteProfile', () => ({
  getSiteProfile: vi.fn(async () => state.siteConfig),
}))

// Mock Prisma ORM client with instrumentation for transaction timing
vi.mock('@/lib/db/prisma', () => {
  const queryBuilder = (collectionName: string) => {
    let filterFn = (_item: any) => true
    let sortFn = (_a: any, _b: any) => 0
    let limitVal = 100

    const builder = {
      where: (clause: any) => {
        if (typeof clause === 'function') {
          const prev = filterFn
          filterFn = (item: any) =>
            prev(item) &&
            clause({
              scheduledAt: {
                lte: (dateStr: string) => item.scheduledAt && item.scheduledAt <= dateStr,
              },
            })
        } else if (typeof clause === 'object' && clause !== null) {
          const prev = filterFn
          filterFn = (item: any) => {
            if (!prev(item)) return false
            for (const [k, v] of Object.entries(clause)) {
              if (item[k] !== v) return false
            }
            return true
          }
        }
        return builder
      },
      orderBy: (_orderFn?: any) => {
        sortFn = (a: any, b: any) => {
          const dateA = new Date(a.submittedAt || a.scheduledAt || 0).getTime()
          const dateB = new Date(b.submittedAt || b.scheduledAt || 0).getTime()
          return dateB - dateA
        }
        return builder
      },
      limit: (n: number) => {
        limitVal = n
        return builder
      },
      forUpdate: () => builder,
      first: async () => {
        const items =
          collectionName === 'Article'
            ? Object.values(state.articles)
            : collectionName === 'IndexingSubmission'
            ? state.submissions
            : collectionName === 'SiteConfig'
            ? [state.siteConfig]
            : []
        return items.filter(filterFn).sort(sortFn)[0] || null
      },
      all: async () => {
        const items =
          collectionName === 'Article'
            ? Object.values(state.articles)
            : collectionName === 'IndexingSubmission'
            ? state.submissions
            : []
        return items.filter(filterFn).sort(sortFn).slice(0, limitVal)
      },
      update: async (data: any) => {
        const items = collectionName === 'Article' ? Object.values(state.articles) : []
        const matched = items.filter(filterFn)
        for (const item of matched) {
          Object.assign(item, data)
        }
        return matched[0] || null
      },
    }
    return builder
  }

  const mockPrisma = {
    orm: {
      public: {
        SiteConfig: {
          where: (_clause: any) => ({
            first: async () => state.siteConfig,
            update: async (data: any) => Object.assign(state.siteConfig, data),
          }),
          create: async (data: any) => {
            Object.assign(state.siteConfig, data)
            return state.siteConfig
          },
        },
        Category: {
          upsert: async () => ({ id: 1, name: 'Teknologi', slug: 'teknologi' }),
        },
        Author: {
          upsert: async () => ({ id: 1, name: 'Editor SegiaTech', slug: 'editor-segiatech' }),
          create: async (data: any) => ({ id: 2, ...data }),
        },
        Article: {
          where: (clause: any) => queryBuilder('Article').where(clause),
        },
        IndexingSubmission: {
          create: async (data: any) => {
            if (state.dbFailures.indexingSubmissionCreate) {
              throw new Error('Database connection reset during indexing_submissions INSERT')
            }
            const record = {
              id: state.submissions.length + 1,
              ...data,
              submittedAt: data.submittedAt || new Date().toISOString(),
            }
            state.submissions.push(record)
            return record
          },
          where: (clause: any) => queryBuilder('IndexingSubmission').where(clause),
        },
        ContentRevision: {
          create: async () => ({ id: 1 }),
        },
        SeoAuditLog: {
          create: async () => ({ id: 1 }),
        },
      },
    },
    transaction: async (callback: any) => {
      state.timing.txStartedAt = Date.now()
      const res = await callback(mockPrisma)
      state.timing.txEndedAt = Date.now()
      return res
    },
  }

  return { prisma: mockPrisma }
})

// Mock Articles query layer
vi.mock('@/lib/db/articles', () => ({
  getArticleBySlug: async (slug: string) => state.articles[slug] || null,
  createArticle: async (data: any) => {
    const article = {
      id: Object.keys(state.articles).length + 1,
      ...data,
      seo: {
        metaTitle: data.metaTitle || data.title,
        metaDescription: data.metaDescription || data.excerpt,
      },
      seoData:
        data.seoData ||
        JSON.stringify({
          seoTitle: data.metaTitle || data.title,
          metaDescription: data.metaDescription || data.excerpt,
        }),
    }
    state.articles[data.slug] = article
    return article
  },
  updateArticle: async (lookupSlug: string, data: any) => {
    const existing = state.articles[lookupSlug]
    if (!existing) throw new Error('Not found')
    const updated = {
      ...existing,
      ...data,
      slug: data.slug || existing.slug,
      seo: {
        metaTitle: data.metaTitle || existing.seo?.metaTitle || existing.metaTitle || existing.title,
        metaDescription: data.metaDescription || existing.seo?.metaDescription || existing.metaDescription,
      },
      seoData: data.seoData || existing.seoData,
    }
    if (data.slug && data.slug !== lookupSlug) {
      delete state.articles[lookupSlug]
      state.articles[data.slug] = updated
    } else {
      state.articles[lookupSlug] = updated
    }
    return updated
  },
  getArticles: vi.fn(),
  deleteArticle: vi.fn(),
}))

import { POST, PATCH } from '../src/app/api/articles/route'
import { publishDueArticles } from '../src/lib/publishing/scheduler'
import { triggerAutomatedIndexing } from '../src/lib/seo/indexing-dispatcher'
import { getOrCreateIndexNowKey } from '../src/lib/seo/indexnow'

const createRequest = (method: string, body: object) =>
  new NextRequest('http://localhost:3000/api/articles', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

async function flushBackgroundTasks() {
  while (state.pendingBackgroundTasks.length > 0) {
    const currentBatch = [...state.pendingBackgroundTasks]
    state.pendingBackgroundTasks.length = 0
    await Promise.all(currentBatch)
  }
  await new Promise((r) => setTimeout(r, 60))
}

describe('Empirical Adversarial Challenge: Milestone 2 Error Resilience & Concurrency', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    state.role = 'EDITOR'
    state.user = {
      id: 'usr-editor-1',
      name: 'Editor SegiaTech',
      role: 'EDITOR',
      email: 'editor@segiatech.com',
      authenticated: true,
    }
    state.articles = {}
    state.submissions = []
    state.pendingBackgroundTasks = []
    state.dbFailures = {
      indexingSubmissionCreate: false,
    }
    state.fetchMocks = {
      indexNowStatus: 202,
      indexNowDelayMs: 0,
      indexNowTimeout: false,
      gscStatus: 200,
      gscDelayMs: 0,
      gscVerdict: 'PASS',
    }
    state.timing = {
      txStartedAt: 0,
      txEndedAt: 0,
      indexingStartedAt: [],
      indexingEndedAt: [],
    }

    process.env.GSC_CLIENT_EMAIL = 'mock-sa@segiatech.iam.gserviceaccount.com'
    process.env.GSC_PRIVATE_KEY = 'mock-private-key'

    global.fetch = vi.fn(async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || ''

      if (urlStr.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'mock-access-token-challenge', expires_in: 3600 }),
        } as any
      }

      if (urlStr.includes('api.indexnow.org')) {
        if (state.fetchMocks.indexNowDelayMs > 0) {
          await new Promise((r) => setTimeout(r, state.fetchMocks.indexNowDelayMs))
        }
        if (state.fetchMocks.indexNowTimeout) {
          const err = new Error('The operation was aborted due to timeout')
          err.name = 'TimeoutError'
          throw err
        }
        const status = state.fetchMocks.indexNowStatus
        const ok = status === 200 || status === 202
        return {
          ok,
          status,
          statusText: ok ? 'Accepted' : status === 504 ? 'Gateway Timeout' : 'Error',
          text: async () => (ok ? 'OK' : `IndexNow error (${status})`),
          json: async () => ({ status }),
        } as any
      }

      if (urlStr.includes('searchconsole.googleapis.com')) {
        if (state.fetchMocks.gscDelayMs > 0) {
          await new Promise((r) => setTimeout(r, state.fetchMocks.gscDelayMs))
        }
        const status = state.fetchMocks.gscStatus
        const ok = status === 200
        if (!ok) {
          return {
            ok: false,
            status,
            statusText: status === 429 ? 'Too Many Requests' : 'Internal Server Error',
            text: async () =>
              JSON.stringify({
                error: {
                  code: status,
                  message: status === 429 ? 'Quota exceeded for QuotaGroup: URL Inspection' : 'Server error',
                },
              }),
            json: async () => ({
              error: {
                code: status,
                message: status === 429 ? 'Quota exceeded for QuotaGroup: URL Inspection' : 'Server error',
              },
            }),
          } as any
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ inspectionResult: { indexStatusResult: { verdict: 'PASS' } } }),
          json: async () => ({
            inspectionResult: {
              indexStatusResult: {
                verdict: state.fetchMocks.gscVerdict,
                coverageState: 'Submitted and indexed',
                robotsTxtState: 'ALLOWED',
                indexingState: 'INDEXING_ALLOWED',
              },
            },
          }),
        } as any
      }

      return originalFetch(input, init)
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = { ...originalEnv }
  })

  describe('1. Challenge Non-Blocking & Response Status under External API Failures', () => {
    it('1.1: IndexNow HTTP 504 Gateway Timeout on POST /api/articles returns HTTP 200 immediately and records failed (504)', async () => {
      state.fetchMocks.indexNowStatus = 504

      const startTime = Date.now()
      const req = createRequest('POST', {
        title: 'Artikel Uji IndexNow 504 Gateway Timeout',
        slug: 'uji-indexnow-504-timeout',
        excerpt: 'Menguji ketahanan terhadap IndexNow HTTP 504 Gateway Timeout',
        content: '<p>Konten pengujian keandalan sistem terhadap kegagalan jaringan eksternal.</p>',
        status: 'published',
        locale: 'id',
      })

      const res = await POST(req)
      const durationMs = Date.now() - startTime

      // Must return HTTP 200 immediately without waiting for external API
      expect(res.status).toBe(200)
      expect(durationMs).toBeLessThan(100)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.message).toBe('Artikel berhasil diterbitkan ke database!')

      // Flush background indexing task
      await flushBackgroundTasks()

      // Verify indexing_submissions contains IndexNow failure with HTTP 504
      const indexNowSub = state.submissions.find(
        (s) => s.url.includes('uji-indexnow-504-timeout') && s.provider === 'indexnow'
      )
      expect(indexNowSub).toBeDefined()
      expect(indexNowSub.status).toBe('failed')
      expect(indexNowSub.httpStatus).toBe(504)
      expect(indexNowSub.trigger).toBe('publication')

      // Verify article in DB is successfully published
      const article = state.articles['uji-indexnow-504-timeout']
      expect(article).toBeDefined()
      expect(article.status).toBe('published')
    })

    it('1.2: IndexNow Hanging / TimeoutError on PATCH /api/articles returns HTTP 200 immediately and records failed (504)', async () => {
      state.user.role = 'SUPER_ADMIN'
      // Simulate existing draft article with complete SEO metadata
      state.articles['artikel-in-review-timeout-patch'] = {
        id: 101,
        title: 'Artikel Review Siap Terbit',
        slug: 'artikel-in-review-timeout-patch',
        excerpt: 'Draf review siap terbit',
        content: '<p>Konten draf review siap terbit.</p>',
        status: 'draft',
        metaTitle: 'Artikel Review Siap Terbit',
        metaDescription: 'Deskripsi meta review siap terbit.',
        seo: { metaTitle: 'Artikel Review Siap Terbit', metaDescription: 'Deskripsi meta review siap terbit.' },
        seoData: JSON.stringify({ seoTitle: 'Artikel Review Siap Terbit', metaDescription: 'Deskripsi meta review siap terbit.' }),
        locale: 'id',
      }

      // Simulate network hanging and aborting with TimeoutError
      state.fetchMocks.indexNowTimeout = true

      const startTime = Date.now()
      const req = createRequest('PATCH', {
        slug: 'artikel-in-review-timeout-patch',
        status: 'published',
      })

      const res = await PATCH(req)
      const durationMs = Date.now() - startTime

      // Must return HTTP 200 immediately
      expect(res.status).toBe(200)
      expect(durationMs).toBeLessThan(100)

      const body = await res.json()
      expect(body.success).toBe(true)

      // Flush background indexing task
      await flushBackgroundTasks()

      // Verify indexing_submissions records IndexNow failed with 504
      const indexNowSub = state.submissions.find(
        (s) => s.url.includes('artikel-in-review-timeout-patch') && s.provider === 'indexnow'
      )
      expect(indexNowSub).toBeDefined()
      expect(indexNowSub.status).toBe('failed')
      expect(indexNowSub.httpStatus).toBe(504)

      // Verify article in DB is published
      const article = state.articles['artikel-in-review-timeout-patch']
      expect(article.status).toBe('published')
    })

    it('1.3: Google Search Console HTTP 429 (Quota Exceeded) on POST /api/articles returns HTTP 200 and records rate_limited (429)', async () => {
      state.fetchMocks.gscStatus = 429

      const startTime = Date.now()
      const req = createRequest('POST', {
        title: 'Artikel Uji GSC Quota Exceeded 429',
        slug: 'uji-gsc-429-quota',
        excerpt: 'Menguji penanganan kuota GSC terlampaui HTTP 429',
        content: '<p>Konten artikel dengan pengujian kuota Google Search Console.</p>',
        status: 'published',
        locale: 'id',
      })

      const res = await POST(req)
      const durationMs = Date.now() - startTime

      // Must return HTTP 200 without delay
      expect(res.status).toBe(200)
      expect(durationMs).toBeLessThan(100)

      const body = await res.json()
      expect(body.success).toBe(true)

      // Flush background task
      await flushBackgroundTasks()

      // Verify indexing_submissions records GSC rate_limited with HTTP 429
      const gscSub = state.submissions.find(
        (s) => s.url.includes('uji-gsc-429-quota') && s.provider === 'google'
      )
      expect(gscSub).toBeDefined()
      expect(gscSub.status).toBe('rate_limited')
      expect(gscSub.httpStatus).toBe(429)
      expect(gscSub.responsePayload).toContain('Quota exceeded')

      // IndexNow should still succeed concurrently
      const indexNowSub = state.submissions.find(
        (s) => s.url.includes('uji-gsc-429-quota') && s.provider === 'indexnow'
      )
      expect(indexNowSub).toBeDefined()
      expect(indexNowSub.status).toBe('accepted')
      expect(indexNowSub.httpStatus).toBe(202)
    })

    it('1.4: Google Search Console HTTP 429 on PATCH /api/articles transition returns HTTP 200 and records rate_limited (429)', async () => {
      state.user.role = 'CONTENT_ADMIN'
      state.articles['artikel-in-review-ke-published'] = {
        id: 102,
        title: 'Artikel Review ke Publish',
        slug: 'artikel-in-review-ke-published',
        excerpt: 'Menunggu penerbitan editorial',
        content: '<p>Artikel disetujui editor.</p>',
        status: 'in_review',
        metaTitle: 'Artikel Review ke Publish',
        metaDescription: 'Deskripsi meta artikel review ke publish.',
        seo: { metaTitle: 'Artikel Review ke Publish', metaDescription: 'Deskripsi meta artikel review ke publish.' },
        seoData: JSON.stringify({ seoTitle: 'Artikel Review ke Publish', metaDescription: 'Deskripsi meta artikel review ke publish.' }),
        locale: 'id',
      }

      state.fetchMocks.gscStatus = 429

      const req = createRequest('PATCH', {
        slug: 'artikel-in-review-ke-published',
        status: 'published',
      })

      const res = await PATCH(req)
      expect(res.status).toBe(200)

      await flushBackgroundTasks()

      const gscSub = state.submissions.find(
        (s) => s.url.includes('artikel-in-review-ke-published') && s.provider === 'google'
      )
      expect(gscSub).toBeDefined()
      expect(gscSub.status).toBe('rate_limited')
      expect(gscSub.httpStatus).toBe(429)
    })

    it('1.5: Unconfigured GSC credentials on POST returns HTTP 200 and records status: unconfigured (httpStatus: null)', async () => {
      delete process.env.GSC_CLIENT_EMAIL
      delete process.env.GSC_PRIVATE_KEY

      const startTime = Date.now()
      const req = createRequest('POST', {
        title: 'Artikel Uji Kredensial GSC Kosong',
        slug: 'uji-gsc-unconfigured',
        excerpt: 'Menguji kondisi ketika kredensial GSC belum disiapkan di env',
        content: '<p>Konten artikel dengan pengujian kredensial kosong.</p>',
        status: 'published',
        locale: 'id',
      })

      const res = await POST(req)
      const durationMs = Date.now() - startTime

      expect(res.status).toBe(200)
      expect(durationMs).toBeLessThan(100)

      await flushBackgroundTasks()

      const gscSub = state.submissions.find(
        (s) => s.url.includes('uji-gsc-unconfigured') && s.provider === 'google'
      )
      expect(gscSub).toBeDefined()
      expect(gscSub.status).toBe('unconfigured')
      expect(gscSub.httpStatus).toBeNull()
      expect(gscSub.responsePayload).toContain('GSC_CLIENT_EMAIL atau GSC_PRIVATE_KEY belum dikonfigurasi')

      // IndexNow should continue operating normally
      const indexNowSub = state.submissions.find(
        (s) => s.url.includes('uji-gsc-unconfigured') && s.provider === 'indexnow'
      )
      expect(indexNowSub).toBeDefined()
      expect(indexNowSub.status).toBe('accepted')
      expect(indexNowSub.httpStatus).toBe(202)
    })

    it('1.6: Compound Failure: Simultaneous IndexNow 504 and GSC 429 returns HTTP 200 and records both failure states', async () => {
      state.fetchMocks.indexNowStatus = 504
      state.fetchMocks.gscStatus = 429

      const req = createRequest('POST', {
        title: 'Artikel Uji Kegagalan Ganda IndexNow & GSC',
        slug: 'uji-kegagalan-ganda',
        excerpt: 'Menguji kedua penyedia eksternal gagal bersamaan',
        content: '<p>Konten pengujian kegagalan simultan.</p>',
        status: 'published',
        locale: 'id',
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      await flushBackgroundTasks()

      const indexNowSub = state.submissions.find(
        (s) => s.url.includes('uji-kegagalan-ganda') && s.provider === 'indexnow'
      )
      expect(indexNowSub).toBeDefined()
      expect(indexNowSub.status).toBe('failed')
      expect(indexNowSub.httpStatus).toBe(504)

      const gscSub = state.submissions.find(
        (s) => s.url.includes('uji-kegagalan-ganda') && s.provider === 'google'
      )
      expect(gscSub).toBeDefined()
      expect(gscSub.status).toBe('rate_limited')
      expect(gscSub.httpStatus).toBe(429)

      // Article status must remain published in DB
      expect(state.articles['uji-kegagalan-ganda'].status).toBe('published')
    })
  })

  describe('2. Challenge Concurrency in Scheduler (publishDueArticles)', () => {
    it('2.1: Multiple scheduled articles release in batch; indexing occurs strictly OUTSIDE the transaction', async () => {
      const now = new Date('2026-10-28T12:00:00Z')
      const dueTime = new Date('2026-10-28T11:59:00Z').toISOString()

      // Seed 5 due scheduled articles
      for (let i = 1; i <= 5; i++) {
        state.articles[`batch-artikel-${i}`] = {
          id: 200 + i,
          title: `Batch Artikel Terjadwal #${i}`,
          slug: `batch-artikel-${i}`,
          content: `<p>Konten artikel batch ke-${i}</p>`,
          status: 'scheduled',
          scheduledAt: dueTime,
          scheduledBy: 'scheduler',
          metaTitle: `Meta Title #${i}`,
          metaDescription: `Meta description batch #${i}`,
          locale: 'id',
        }
      }

      // Add a simulated network delay to indexing calls to measure concurrency
      state.fetchMocks.indexNowDelayMs = 20
      state.fetchMocks.gscDelayMs = 20

      const publishedSlugs = await publishDueArticles(now)

      // Verify that all 5 articles were released by the scheduler
      expect(publishedSlugs).toHaveLength(5)
      expect(publishedSlugs).toEqual([
        'batch-artikel-1',
        'batch-artikel-2',
        'batch-artikel-3',
        'batch-artikel-4',
        'batch-artikel-5',
      ])

      // Verify all articles have status: 'published' in database
      for (let i = 1; i <= 5; i++) {
        expect(state.articles[`batch-artikel-${i}`].status).toBe('published')
        expect(state.articles[`batch-artikel-${i}`].scheduledAt).toBeNull()
      }

      // Verify timing: Database transaction MUST commit before background indexing completes
      expect(state.timing.txEndedAt).toBeGreaterThan(0)
      expect(state.timing.txStartedAt).toBeLessThanOrEqual(state.timing.txEndedAt)

      // Allow all asynchronous background tasks initiated by scheduler to complete
      await new Promise((r) => setTimeout(r, 150))

      // Verify indexing submissions: exactly 10 submissions (5 IndexNow + 5 Google)
      const batchSubmissions = state.submissions.filter((s) => s.url.includes('batch-artikel-'))
      expect(batchSubmissions).toHaveLength(10)

      const indexNowEntries = batchSubmissions.filter((s) => s.provider === 'indexnow')
      expect(indexNowEntries).toHaveLength(5)
      expect(indexNowEntries.every((s) => s.status === 'accepted' && s.httpStatus === 202)).toBe(true)

      const gscEntries = batchSubmissions.filter((s) => s.provider === 'google')
      expect(gscEntries).toHaveLength(5)
      expect(gscEntries.every((s) => s.status === 'success' && s.httpStatus === 200)).toBe(true)
    })

    it('2.2: Scheduler resilience: mixed passing and failing articles in batch release without crashing or unhandled rejections', async () => {
      const now = new Date('2026-10-28T12:00:00Z')
      const dueTime = new Date('2026-10-28T11:59:00Z').toISOString()

      // Article 1: Valid
      state.articles['artikel-valid-pass'] = {
        id: 301,
        title: 'Artikel Valid Siap Rilis',
        slug: 'artikel-valid-pass',
        content: '<p>Konten valid.</p>',
        status: 'scheduled',
        scheduledAt: dueTime,
        metaTitle: 'Artikel Valid Siap Rilis',
        metaDescription: 'Deskripsi meta valid.',
        locale: 'id',
      }

      // Article 2: Broken SEO data JSON (fails publication gate)
      state.articles['artikel-corrupted-seo'] = {
        id: 302,
        title: 'Artikel Metadata Rusak',
        slug: 'artikel-corrupted-seo',
        content: '<p>Konten rusak.</p>',
        status: 'scheduled',
        scheduledAt: dueTime,
        seoData: 'INVALID_JSON_CORRUPTED{{{',
        locale: 'id',
      }

      const publishedSlugs = await publishDueArticles(now)

      // Only the valid article passes
      expect(publishedSlugs).toEqual(['artikel-valid-pass'])

      // Corrupted article was rejected and reverted to draft with scheduleError
      expect(state.articles['artikel-corrupted-seo'].status).toBe('draft')
      expect(state.articles['artikel-corrupted-seo'].scheduleError).toContain('Metadata SEO rusak')

      await new Promise((r) => setTimeout(r, 80))

      // Only the valid article triggered indexing submissions
      const validSubs = state.submissions.filter((s) => s.url.includes('artikel-valid-pass'))
      expect(validSubs).toHaveLength(2)

      const invalidSubs = state.submissions.filter((s) => s.url.includes('artikel-corrupted-seo'))
      expect(invalidSubs).toHaveLength(0)
    })

    it('2.3: Scheduler concurrency with external failures does not throw unhandled promise rejection', async () => {
      const now = new Date('2026-10-28T12:00:00Z')
      const dueTime = new Date('2026-10-28T11:59:00Z').toISOString()

      state.articles['scheduler-fail-1'] = {
        id: 401,
        title: 'Artikel Scheduler IndexNow 504',
        slug: 'scheduler-fail-1',
        content: '<p>Konten uji scheduler kegagalan.</p>',
        status: 'scheduled',
        scheduledAt: dueTime,
        metaTitle: 'Title 1',
        metaDescription: 'Desc 1',
        locale: 'id',
      }

      state.articles['scheduler-fail-2'] = {
        id: 402,
        title: 'Artikel Scheduler GSC 429',
        slug: 'scheduler-fail-2',
        content: '<p>Konten uji scheduler kegagalan.</p>',
        status: 'scheduled',
        scheduledAt: dueTime,
        metaTitle: 'Title 2',
        metaDescription: 'Desc 2',
        locale: 'id',
      }

      // Both external APIs fail
      state.fetchMocks.indexNowStatus = 504
      state.fetchMocks.gscStatus = 429

      // Expect publishDueArticles to resolve cleanly without unhandled rejection
      let unhandledThrown = false
      const rejectionHandler = () => {
        unhandledThrown = true
      }
      process.on('unhandledRejection', rejectionHandler)

      const publishedSlugs = await publishDueArticles(now)
      expect(publishedSlugs).toHaveLength(2)

      await new Promise((r) => setTimeout(r, 100))

      process.removeListener('unhandledRejection', rejectionHandler)
      expect(unhandledThrown).toBe(false)

      // Both articles in DB are published
      expect(state.articles['scheduler-fail-1'].status).toBe('published')
      expect(state.articles['scheduler-fail-2'].status).toBe('published')

      // Failure audit records recorded
      const subs = state.submissions.filter(
        (s) => s.url.includes('scheduler-fail-1') || s.url.includes('scheduler-fail-2')
      )
      expect(subs).toHaveLength(4)
      expect(subs.filter((s) => s.provider === 'indexnow').every((s) => s.status === 'failed')).toBe(true)
      expect(subs.filter((s) => s.provider === 'google').every((s) => s.status === 'rate_limited')).toBe(true)
    })
  })

  describe('3. Adversarial Edge Cases & Boundary Conditions', () => {
    it('3.1: Robots "noindex" completely suppresses indexing submissions even under API errors', async () => {
      state.fetchMocks.indexNowStatus = 504
      state.fetchMocks.gscStatus = 429

      const req = createRequest('POST', {
        title: 'Artikel dengan Robots Noindex',
        slug: 'artikel-robots-noindex',
        excerpt: 'Artikel rahasia tidak boleh diindeks',
        content: '<p>Konten rahasia.</p>',
        status: 'published',
        robots: 'noindex, follow',
        locale: 'id',
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      await flushBackgroundTasks()

      // Zero submissions should be recorded
      const subs = state.submissions.filter((s) => s.url.includes('artikel-robots-noindex'))
      expect(subs).toHaveLength(0)
    })

    it('3.2: Unsupported protocol / invalid URL input is caught safely without unhandled exception', async () => {
      const results = await triggerAutomatedIndexing({
        url: 'ftp://insecure-unsupported-server.com/malicious',
        entityType: 'article',
      })

      // Should return empty array without throwing unhandled error
      expect(results).toEqual([])
    })

    it('3.3: Empty or whitespace URL input is caught safely without unhandled exception', async () => {
      const results = await triggerAutomatedIndexing({
        url: '   ',
        entityType: 'article',
      })

      // Should return empty array without throwing unhandled error
      expect(results).toEqual([])
    })
  })

  describe('4. High-Volume Concurrency & Fault Tolerance Stress Tests', () => {
    it('4.1: Database insertion failure during indexing persistence is caught gracefully without throwing unhandled exceptions', async () => {
      state.dbFailures.indexingSubmissionCreate = true

      // Expect triggerAutomatedIndexing to complete without throwing an unhandled exception
      const results = await triggerAutomatedIndexing({
        url: 'https://www.segiatech.com/artikel/uji-db-failure',
        entityType: 'article',
      })

      expect(results).toHaveLength(2)
      // Both external API calls still succeeded in memory
      expect(results.find((r) => r.provider === 'indexnow')?.status).toBe('accepted')
      expect(results.find((r) => r.provider === 'google')?.status).toBe('success')
    })

    it('4.2: High-volume concurrency: 20 scheduled articles released in batch by publishDueArticles under heavy latency', async () => {
      const now = new Date('2026-10-28T12:00:00Z')
      const dueTime = new Date('2026-10-28T11:59:00Z').toISOString()

      // Seed 20 due scheduled articles
      for (let i = 1; i <= 20; i++) {
        state.articles[`stress-artikel-${i}`] = {
          id: 500 + i,
          title: `Stress Artikel Terjadwal #${i}`,
          slug: `stress-artikel-${i}`,
          content: `<p>Konten artikel stress volume ke-${i}</p>`,
          status: 'scheduled',
          scheduledAt: dueTime,
          scheduledBy: 'scheduler',
          metaTitle: `Meta Title Stress #${i}`,
          metaDescription: `Meta description stress #${i}`,
          locale: 'id',
        }
      }

      state.fetchMocks.indexNowDelayMs = 15
      state.fetchMocks.gscDelayMs = 15

      const publishedSlugs = await publishDueArticles(now)

      expect(publishedSlugs).toHaveLength(20)

      // All 20 articles in DB are published
      for (let i = 1; i <= 20; i++) {
        expect(state.articles[`stress-artikel-${i}`].status).toBe('published')
      }

      // Wait for all 40 async submissions to settle
      await new Promise((r) => setTimeout(r, 200))

      const stressSubs = state.submissions.filter((s) => s.url.includes('stress-artikel-'))
      expect(stressSubs).toHaveLength(40)
    })

    it('4.3: Concurrent getOrCreateIndexNowKey calls with pre-existing key resolve consistently, and lazy generation persists', async () => {
      // 1. With pre-existing key (production normal state): 10 concurrent requests return identical key
      const keyPromises1 = Array.from({ length: 10 }, () => getOrCreateIndexNowKey())
      const keys1 = await Promise.all(keyPromises1)
      expect(keys1.every((k) => k === 'mock-indexnow-key-challenge-12345678')).toBe(true)

      // 2. Cold-start uninitialized key: lazy initialization creates and persists a valid 32-char hex key
      state.siteConfig.indexNowKey = ''
      const keyA = await getOrCreateIndexNowKey()
      expect(keyA).toMatch(/^[a-f0-9]{32}$/)

      // Subsequent concurrent reads retrieve the persisted key
      const keyPromises2 = Array.from({ length: 10 }, () => getOrCreateIndexNowKey())
      const keys2 = await Promise.all(keyPromises2)
      expect(keys2.every((k) => k === keyA)).toBe(true)
    })
  })
})

