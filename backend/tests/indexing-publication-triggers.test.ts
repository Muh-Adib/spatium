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
    indexNowKey: 'mock-indexnow-key-1234567890abcdef',
  },
  pendingBackgroundTasks: [] as Promise<any>[],
  fetchMocks: {
    indexNowStatus: 202,
    indexNowError: null as string | null,
    gscStatus: 200,
    gscError: null as string | null,
    gscVerdict: 'PASS',
  },
}))

// Mock next/server's after() to capture and resolve background tasks deterministically
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

// Mock GSC client token generation to avoid Node.js RSA-SHA256 signature failures on mock keys
vi.mock('@/lib/gsc/client', () => ({
  getGoogleAccessToken: vi.fn(async () => 'mock-google-access-token-12345'),
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

// Mock Prisma ORM client conforming to Prisma 8 contracts
vi.mock('@/lib/db/prisma', () => {
  const queryBuilder = (collectionName: string) => {
    let filterFn = (_item: any) => true
    let sortFn = (_a: any, _b: any) => 0
    let limitVal = 100

    const builder = {
      where: (clause: any) => {
        if (typeof clause === 'function') {
          // e.g. (a) => a.scheduledAt.lte(...)
          const prev = filterFn
          filterFn = (item: any) => prev(item) && clause({
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
      orderBy: (orderFn?: any) => {
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
        const items = collectionName === 'Article'
          ? Object.values(state.articles)
          : collectionName === 'IndexingSubmission'
          ? state.submissions
          : collectionName === 'SiteConfig'
          ? [state.siteConfig]
          : []
        return items.filter(filterFn).sort(sortFn)[0] || null
      },
      all: async () => {
        const items = collectionName === 'Article'
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
    transaction: async (callback: any) => callback(mockPrisma),
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
      seoData: data.seoData || JSON.stringify({
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

const request = (method: string, body: object) =>
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

describe('Milestone 2: Automated Indexing on Publication Triggers (M2-T1 to M2-T13)', () => {
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
    state.fetchMocks = {
      indexNowStatus: 202,
      indexNowError: null,
      gscStatus: 200,
      gscError: null,
      gscVerdict: 'PASS',
    }

    process.env.GSC_CLIENT_EMAIL = 'mock-sa@segiatech.iam.gserviceaccount.com'
    process.env.GSC_PRIVATE_KEY = 'mock-private-key'

    // Mock fetch for IndexNow and Google Search Console APIs
    global.fetch = vi.fn(async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || ''

      if (urlStr.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'mock-access-token-12345', expires_in: 3600 }),
        } as any
      }

      if (urlStr.includes('api.indexnow.org')) {
        if (state.fetchMocks.indexNowError === 'TimeoutError') {
          const timeoutErr = new Error('The operation was aborted due to timeout')
          timeoutErr.name = 'TimeoutError'
          throw timeoutErr
        }
        const status = state.fetchMocks.indexNowStatus
        return {
          ok: status === 200 || status === 202,
          status,
          text: async () => (status === 200 ? 'OK' : status === 202 ? 'Accepted' : 'Error'),
          json: async () => ({ status }),
        } as any
      }

      if (urlStr.includes('urlInspection/index:inspect')) {
        const status = state.fetchMocks.gscStatus
        if (status === 429) {
          return {
            ok: false,
            status: 429,
            text: async () => 'Quota exceeded for quota metric urlInspection',
            json: async () => ({ error: { code: 429, message: 'Quota exceeded' } }),
          } as any
        }
        if (status !== 200) {
          return {
            ok: false,
            status,
            text: async () => `Google API Error HTTP ${status}`,
            json: async () => ({ error: { code: status } }),
          } as any
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            inspectionResult: {
              inspectionResultLink: `https://search.google.com/search-console/inspect?resource_id=https://www.segiatech.com&id=${encodeURIComponent(urlStr)}`,
              indexStatusResult: {
                verdict: state.fetchMocks.gscVerdict,
                coverageState: 'Submitted and indexed',
                robotsTxtState: 'ALLOWED',
                indexingState: 'INDEXING_ALLOWED',
                lastCrawlTime: new Date().toISOString(),
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

  // M2-T1: Automated indexing on POST /api/articles with status: 'published' (Editor role)
  it('M2-T1: triggers automated indexing on POST /api/articles for newly published articles', async () => {
    const res = await POST(
      request('POST', {
        title: 'M2-T1 Artikel Publikasi Otomatis',
        slug: 'm2-t1-artikel-publikasi-otomatis',
        content: '<p>Konten artikel M2-T1 untuk verifikasi publikasi otomatis ke IndexNow dan GSC.</p>',
        status: 'published',
        metaTitle: 'M2-T1 Artikel Publikasi Otomatis SegiaTech',
        metaDescription: 'Deskripsi meta M2-T1 untuk pengujian publikasi otomatis.',
      })
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    await flushBackgroundTasks()

    // Verify article was saved
    expect(state.articles['m2-t1-artikel-publikasi-otomatis']).toBeDefined()
    expect(state.articles['m2-t1-artikel-publikasi-otomatis'].status).toBe('published')

    // Verify exactly 2 indexing submissions were persisted (IndexNow and Google)
    const articleUrl = 'https://www.segiatech.com/artikel/m2-t1-artikel-publikasi-otomatis'
    const indexNowSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'indexnow')
    const googleSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'google')

    expect(indexNowSub).toBeDefined()
    expect(indexNowSub.status).toBe('accepted')
    expect(indexNowSub.trigger).toBe('publication')

    expect(googleSub).toBeDefined()
    expect(googleSub.status).toBe('success')
    expect(googleSub.trigger).toBe('publication')
  })

  // M2-T2: Status transition draft -> published on PATCH /api/articles
  it('M2-T2: triggers automated indexing on status transition from draft to published', async () => {
    state.user.role = 'SUPER_ADMIN'
    state.articles['m2-t2-draft'] = {
      id: 201,
      slug: 'm2-t2-draft',
      title: 'M2-T2 Draft Article',
      status: 'draft',
      content: '<p>Konten draft artikel</p>',
      metaTitle: 'M2-T2 Draft Meta Title',
      metaDescription: 'M2-T2 Draft Meta Description',
      seo: { metaTitle: 'M2-T2 Draft Meta Title', metaDescription: 'M2-T2 Draft Meta Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T2 Draft Meta Title', metaDescription: 'M2-T2 Draft Meta Description' }),
    }

    const res = await PATCH(
      request('PATCH', {
        slug: 'm2-t2-draft',
        status: 'published',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t2-draft'].status).toBe('published')

    const articleUrl = 'https://www.segiatech.com/artikel/m2-t2-draft'
    const indexNowSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'indexnow')
    const googleSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'google')

    expect(indexNowSub).toBeDefined()
    expect(indexNowSub.status).toBe('accepted')
    expect(googleSub).toBeDefined()
    expect(googleSub.status).toBe('success')
  })

  // M2-T3: Status transition in_review -> published on PATCH /api/articles
  it('M2-T3: triggers automated indexing on status transition from in_review to published', async () => {
    state.user.role = 'CONTENT_ADMIN'
    state.articles['m2-t3-review'] = {
      id: 202,
      slug: 'm2-t3-review',
      title: 'M2-T3 Review Article',
      status: 'in_review',
      content: '<p>Konten dalam review</p>',
      metaTitle: 'M2-T3 Review Meta Title',
      metaDescription: 'M2-T3 Review Meta Description',
      seo: { metaTitle: 'M2-T3 Review Meta Title', metaDescription: 'M2-T3 Review Meta Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T3 Review Meta Title', metaDescription: 'M2-T3 Review Meta Description' }),
    }

    const res = await PATCH(
      request('PATCH', {
        slug: 'm2-t3-review',
        status: 'published',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t3-review'].status).toBe('published')

    const articleUrl = 'https://www.segiatech.com/artikel/m2-t3-review'
    const subs = state.submissions.filter((s) => s.url === articleUrl)
    expect(subs.length).toBe(2)
  })

  // M2-T4: Scheduled article release via publishDueArticles in scheduler.ts
  it('M2-T4: automatically dispatches indexing when scheduler releases due articles', async () => {
    state.articles['m2-t4-scheduled'] = {
      id: 204,
      slug: 'm2-t4-scheduled',
      title: 'M2-T4 Scheduled Article',
      status: 'scheduled',
      scheduledAt: '2026-05-01T08:00:00Z',
      content: '<p>Konten jadwal terbit</p>',
      metaTitle: 'M2-T4 Scheduled Meta Title',
      metaDescription: 'M2-T4 Scheduled Meta Description',
      seo: { metaTitle: 'M2-T4 Scheduled Meta Title', metaDescription: 'M2-T4 Scheduled Meta Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T4 Scheduled Meta Title', metaDescription: 'M2-T4 Scheduled Meta Description' }),
    }

    const publishedSlugs = await publishDueArticles(new Date('2026-05-01T08:05:00Z'))
    expect(publishedSlugs).toContain('m2-t4-scheduled')

    await flushBackgroundTasks()

    // In-memory article updated
    expect(state.articles['m2-t4-scheduled'].status).toBe('published')

    const articleUrl = 'https://www.segiatech.com/artikel/m2-t4-scheduled'
    const indexNowSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'indexnow')
    const googleSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'google')

    expect(indexNowSub).toBeDefined()
    expect(indexNowSub.actor).toBe('scheduler')
    expect(googleSub).toBeDefined()
    expect(googleSub.actor).toBe('scheduler')
  })

  // M2-T5: Updating already-published article within 24h cooldown suppresses crawler spam
  it('M2-T5: suppresses crawler re-submission when an already-published article is updated within 24h cooldown', async () => {
    const articleUrl = 'https://www.segiatech.com/artikel/m2-t5-cooldown-active'
    state.articles['m2-t5-cooldown-active'] = {
      id: 205,
      slug: 'm2-t5-cooldown-active',
      title: 'M2-T5 Active Cooldown Article',
      status: 'published',
      publishedAt: '2026-05-01T00:00:00Z',
      content: '<p>Konten terbit asli</p>',
      metaTitle: 'M2-T5 Active Cooldown Meta',
      metaDescription: 'M2-T5 Active Cooldown Description',
      seo: { metaTitle: 'M2-T5 Active Cooldown Meta', metaDescription: 'M2-T5 Active Cooldown Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T5 Active Cooldown Meta', metaDescription: 'M2-T5 Active Cooldown Description' }),
    }

    // Seed existing submission from 1 hour ago
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
    state.submissions.push(
      {
        id: 1,
        url: articleUrl,
        provider: 'indexnow',
        status: 'accepted',
        trigger: 'publication',
        submittedAt: oneHourAgo,
      },
      {
        id: 2,
        url: articleUrl,
        provider: 'google',
        status: 'success',
        trigger: 'publication',
        submittedAt: oneHourAgo,
      }
    )

    const initialSubmissionCount = state.submissions.length

    // Editorial update within 24 hours
    const res = await PATCH(
      request('PATCH', {
        slug: 'm2-t5-cooldown-active',
        content: '<p>Konten diperbaiki tiponya dalam 1 jam setelah publikasi.</p>',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    // Article content updated in DB
    expect(state.articles['m2-t5-cooldown-active'].content).toContain('diperbaiki tiponya')

    // But NO new crawler submissions were created due to cooldown
    expect(state.submissions.length).toBe(initialSubmissionCount)
  })

  // M2-T6: Updating already-published article after 24h cooldown triggers re-indexing
  it('M2-T6: triggers re-indexing when an already-published article is updated after 24h cooldown expires', async () => {
    const articleUrl = 'https://www.segiatech.com/artikel/m2-t6-cooldown-expired'
    state.articles['m2-t6-cooldown-expired'] = {
      id: 206,
      slug: 'm2-t6-cooldown-expired',
      title: 'M2-T6 Expired Cooldown Article',
      status: 'published',
      publishedAt: '2026-04-01T00:00:00Z',
      content: '<p>Konten terbit lama</p>',
      metaTitle: 'M2-T6 Expired Cooldown Meta',
      metaDescription: 'M2-T6 Expired Cooldown Description',
      seo: { metaTitle: 'M2-T6 Expired Cooldown Meta', metaDescription: 'M2-T6 Expired Cooldown Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T6 Expired Cooldown Meta', metaDescription: 'M2-T6 Expired Cooldown Description' }),
    }

    // Seed existing submission from 26 hours ago
    const twentySixHoursAgo = new Date(Date.now() - 26 * 3600_000).toISOString()
    state.submissions.push(
      {
        id: 10,
        url: articleUrl,
        provider: 'indexnow',
        status: 'accepted',
        trigger: 'publication',
        submittedAt: twentySixHoursAgo,
      },
      {
        id: 11,
        url: articleUrl,
        provider: 'google',
        status: 'success',
        trigger: 'publication',
        submittedAt: twentySixHoursAgo,
      }
    )

    const res = await PATCH(
      request('PATCH', {
        slug: 'm2-t6-cooldown-expired',
        content: '<p>Konten diperbarui secara substansial setelah 26 jam.</p>',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    // 2 new submissions created after cooldown expiry
    const newSubs = state.submissions.filter((s) => s.url === articleUrl && s.id !== 10 && s.id !== 11)
    expect(newSubs.length).toBe(2)
  })

  // M2-T7: Draft isolation on POST /api/articles
  it('M2-T7: strictly isolates drafts and in_review articles from triggering indexing on POST', async () => {
    const resDraft = await POST(
      request('POST', {
        title: 'M2-T7 Draft Isolasi',
        slug: 'm2-t7-draft-isolasi',
        content: '<p>Konten draf yang tidak boleh diindeks</p>',
        status: 'draft',
      })
    )

    expect(resDraft.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t7-draft-isolasi'].status).toBe('draft')
    expect(state.submissions.length).toBe(0)

    const resReview = await POST(
      request('POST', {
        title: 'M2-T7 In Review Isolasi',
        slug: 'm2-t7-in-review-isolasi',
        content: '<p>Konten review yang tidak boleh diindeks</p>',
        status: 'in_review',
      })
    )

    expect(resReview.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t7-in-review-isolasi'].status).toBe('in_review')
    expect(state.submissions.length).toBe(0)
  })

  // M2-T8: Author downshift on POST /api/articles prevents unauthorized indexing
  it('M2-T8: prevents indexing when unprivileged author submission is downshifted to in_review', async () => {
    state.user.role = 'AUTHOR'

    const res = await POST(
      request('POST', {
        title: 'M2-T8 Author Submits Published',
        slug: 'm2-t8-author-submits-published',
        content: '<p>Author mencoba langsung menerbitkan artikel</p>',
        status: 'published',
        metaTitle: 'M2-T8 Author Meta Title',
        metaDescription: 'M2-T8 Author Meta Description',
      })
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('review editorial')

    await flushBackgroundTasks()

    // Article was downshifted to in_review
    expect(state.articles['m2-t8-author-submits-published'].status).toBe('in_review')

    // ZERO indexing submissions
    expect(state.submissions.length).toBe(0)
  })

  // M2-T9: Future scheduled article on POST does not trigger indexing
  it('M2-T9: strictly prevents indexing when article is scheduled for future release', async () => {
    const res = await POST(
      request('POST', {
        title: 'M2-T9 Jadwal Masa Depan',
        slug: 'm2-t9-jadwal-masa-depan',
        content: '<p>Konten jadwal masa depan</p>',
        status: 'scheduled',
        scheduledAt: '2030-01-01T10:00:00Z',
        publicationTimezone: 'UTC',
        metaTitle: 'M2-T9 Jadwal Masa Depan Meta',
        metaDescription: 'M2-T9 Jadwal Masa Depan Description',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t9-jadwal-masa-depan'].status).toBe('scheduled')
    expect(state.submissions.length).toBe(0)
  })

  // M2-T10: Unpublishing (published -> archived or draft) does not trigger indexing
  it('M2-T10: does not trigger indexing when an article is unpublished or archived', async () => {
    state.articles['m2-t10-to-archive'] = {
      id: 210,
      slug: 'm2-t10-to-archive',
      title: 'M2-T10 To Archive',
      status: 'published',
      publishedAt: '2026-01-01T00:00:00Z',
      content: '<p>Artikel yang akan diarsipkan</p>',
      metaTitle: 'M2-T10 Archive Meta',
      metaDescription: 'M2-T10 Archive Description',
      seo: { metaTitle: 'M2-T10 Archive Meta', metaDescription: 'M2-T10 Archive Description' },
      seoData: JSON.stringify({ seoTitle: 'M2-T10 Archive Meta', metaDescription: 'M2-T10 Archive Description' }),
    }

    const res = await PATCH(
      request('PATCH', {
        slug: 'm2-t10-to-archive',
        status: 'archived',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t10-to-archive'].status).toBe('archived')
    expect(state.submissions.length).toBe(0)
  })

  // M2-T11: Resilience to IndexNow HTTP 504 Gateway Timeout
  it('M2-T11: gracefully handles IndexNow 504 timeout without failing publication', async () => {
    state.fetchMocks.indexNowError = 'TimeoutError'

    const res = await POST(
      request('POST', {
        title: 'M2-T11 Timeout Test Article',
        slug: 'm2-t11-timeout-test',
        content: '<p>Konten artikel untuk menguji timeout IndexNow</p>',
        status: 'published',
        metaTitle: 'M2-T11 Timeout Test Meta',
        metaDescription: 'M2-T11 Timeout Test Description',
      })
    )

    // HTTP 200 maintained despite downstream timeout
    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    // Article is safely stored
    expect(state.articles['m2-t11-timeout-test'].status).toBe('published')

    // IndexNow failure recorded in DB
    const articleUrl = 'https://www.segiatech.com/artikel/m2-t11-timeout-test'
    const indexNowSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'indexnow')
    expect(indexNowSub).toBeDefined()
    expect(indexNowSub.status).toBe('failed')
    expect(indexNowSub.httpStatus).toBe(504)
  })

  // M2-T12: Resilience to GSC HTTP 429 Quota Exceeded
  it('M2-T12: gracefully handles GSC 429 rate limit without failing publication', async () => {
    state.fetchMocks.gscStatus = 429

    const res = await POST(
      request('POST', {
        title: 'M2-T12 GSC Rate Limit Article',
        slug: 'm2-t12-gsc-rate-limit',
        content: '<p>Konten artikel untuk menguji rate limit GSC 429</p>',
        status: 'published',
        metaTitle: 'M2-T12 GSC Rate Limit Meta',
        metaDescription: 'M2-T12 GSC Rate Limit Description',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t12-gsc-rate-limit'].status).toBe('published')

    const articleUrl = 'https://www.segiatech.com/artikel/m2-t12-gsc-rate-limit'
    const gscSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'google')
    expect(gscSub).toBeDefined()
    expect(gscSub.status).toBe('rate_limited')
    expect(gscSub.httpStatus).toBe(429)
  })

  // M2-T13: Resilience when GSC credentials are unconfigured
  it('M2-T13: gracefully handles missing GSC credentials and marks status as unconfigured', async () => {
    delete process.env.GSC_CLIENT_EMAIL
    delete process.env.GSC_PRIVATE_KEY

    const res = await POST(
      request('POST', {
        title: 'M2-T13 GSC Unconfigured Article',
        slug: 'm2-t13-gsc-unconfigured',
        content: '<p>Konten artikel ketika kredensial GSC belum dikonfigurasi</p>',
        status: 'published',
        metaTitle: 'M2-T13 GSC Unconfigured Meta',
        metaDescription: 'M2-T13 GSC Unconfigured Description',
      })
    )

    expect(res.status).toBe(200)
    await flushBackgroundTasks()

    expect(state.articles['m2-t13-gsc-unconfigured'].status).toBe('published')

    const articleUrl = 'https://www.segiatech.com/artikel/m2-t13-gsc-unconfigured'
    const gscSub = state.submissions.find((s) => s.url === articleUrl && s.provider === 'google')
    expect(gscSub).toBeDefined()
    expect(gscSub.status).toBe('unconfigured')
  })
})
