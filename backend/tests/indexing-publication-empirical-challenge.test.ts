import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Hoisted state for mock database and authentication
const state = vi.hoisted(() => ({
  role: 'EDITOR',
  user: {
    id: 'usr-editor-1',
    name: 'Editor SegiaTech',
    role: 'EDITOR',
    email: 'editor@segiatech.com',
    authenticated: true,
  },
  articles: {} as Record<string, any>,
  submissions: [] as any[],
  siteConfig: {
    id: 1,
    name: 'SegiaTech',
    url: 'https://www.segiatech.com',
    indexNowKey: 'mock-indexnow-key-challenge-1234567890',
  },
  pendingBackgroundTasks: [] as Promise<any>[],
  networkCalls: {
    indexNow: [] as Array<{ url: string; body: any }>,
    gsc: [] as Array<{ url: string; body: any }>,
    oauth: 0,
  },
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

// Mock GSC client token generation
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

// Mock Prisma ORM client conforming to Prisma 8 contracts
vi.mock('@/lib/db/prisma', () => {
  const queryBuilder = (collectionName: string) => {
    let filterFn = (_item: any) => true
    let sortFn = (_a: any, _b: any) => 0
    let limitVal = 100

    const builder = {
      where: (clause: any) => {
        if (typeof clause === 'function') {
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
import { triggerAutomatedIndexing } from '../src/lib/seo/indexing-dispatcher'
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

describe('Empirical Adversarial Challenges: Milestone 2 Publication Triggers & Lifecycle Isolation', () => {
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
    state.networkCalls = {
      indexNow: [],
      gsc: [],
      oauth: 0,
    }
    state.fetchMocks = {
      indexNowStatus: 202,
      indexNowError: null,
      gscStatus: 200,
      gscError: null,
      gscVerdict: 'PASS',
    }

    process.env.GSC_CLIENT_EMAIL = 'challenge-sa@segiatech.iam.gserviceaccount.com'
    process.env.GSC_PRIVATE_KEY = 'challenge-private-key'

    // Mock fetch with call recording
    global.fetch = vi.fn(async (input: any, init?: any) => {
      const urlStr = typeof input === 'string' ? input : input?.url || ''
      const body = init?.body ? JSON.parse(init.body) : null

      if (urlStr.includes('oauth2.googleapis.com/token')) {
        state.networkCalls.oauth++
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'mock-access-token-challenge', expires_in: 3600 }),
        } as any
      }

      if (urlStr.includes('api.indexnow.org')) {
        state.networkCalls.indexNow.push({ url: urlStr, body })
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
        state.networkCalls.gsc.push({ url: urlStr, body })
        const status = state.fetchMocks.gscStatus
        if (status === 429) {
          return {
            ok: false,
            status: 429,
            text: async () => 'Quota exceeded',
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
              inspectionResultLink: 'https://search.google.com/test',
              indexStatusResult: {
                verdict: state.fetchMocks.gscVerdict,
                coverageState: 'Submitted and indexed',
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

  // =========================================================================
  // CHALLENGE 1: DRAFT & ROLE ISOLATION
  // =========================================================================

  describe('Challenge 1: Draft & Role Isolation', () => {
    it('1.1: POST with status: "draft" triggers ZERO network calls and ZERO indexing submissions', async () => {
      const res = await POST(
        request('POST', {
          title: 'Adversarial Draft Isolation Article',
          slug: 'adv-draft-isolation',
          content: '<p>Konten artikel draf yang tidak boleh diindeks ke crawler.</p>',
          status: 'draft',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('1.2: POST with status: "in_review" triggers ZERO network calls and ZERO indexing submissions', async () => {
      const res = await POST(
        request('POST', {
          title: 'Adversarial In-Review Isolation Article',
          slug: 'adv-in-review-isolation',
          content: '<p>Konten artikel in_review yang menunggu moderasi redaksi.</p>',
          status: 'in_review',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('1.3: POST with status: "scheduled" (future publication date) triggers ZERO network calls and ZERO indexing submissions', async () => {
      const res = await POST(
        request('POST', {
          title: 'Adversarial Scheduled Future Article',
          slug: 'adv-scheduled-future',
          content: '<p>Konten artikel yang dijadwalkan terbit tahun depan.</p>',
          status: 'scheduled',
          scheduledAt: '2028-06-15T12:00:00Z',
          publicationTimezone: 'UTC',
          metaTitle: 'Adversarial Scheduled Future Article Meta',
          metaDescription: 'Deskripsi artikel terjadwal masa depan untuk pengujian isolasi.',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('1.4: AUTHOR requesting status: "published" is downshifted to "in_review" and triggers ZERO network calls or indexing submissions', async () => {
      state.user.role = 'AUTHOR'
      state.user.id = 'usr-author-99'
      state.user.name = 'Penulis Pemula'

      const res = await POST(
        request('POST', {
          title: 'Author Escalation Attack Article',
          slug: 'author-escalation-attack',
          content: '<p>Penulis mencoba langsung menerbitkan artikel tanpa persetujuan editor.</p>',
          status: 'published',
          metaTitle: 'Author Escalation Attack Meta',
          metaDescription: 'Deskripsi uji coba eskalasi hak akses penulis langsung terbit.',
        })
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toContain('review editorial')
      await flushBackgroundTasks()

      // Target article is in_review, not published
      expect(state.articles['author-escalation-attack'].status).toBe('in_review')

      // Zero network calls and zero indexing submissions
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('1.5: PATCH transition from published to archived NEVER triggers indexing', async () => {
      // Seed an already published article
      state.articles['adv-unpublish-archived'] = {
        id: 301,
        slug: 'adv-unpublish-archived',
        title: 'Article To Be Archived',
        status: 'published',
        publishedAt: '2026-01-01T00:00:00Z',
        content: '<p>Artikel yang sebelumnya sudah aktif terbit.</p>',
        metaTitle: 'Article To Be Archived Meta',
        metaDescription: 'Deskripsi artikel untuk pengarsipan.',
        seoData: JSON.stringify({ seoTitle: 'Title', metaDescription: 'Desc' }),
      }

      const res = await PATCH(
        request('PATCH', {
          slug: 'adv-unpublish-archived',
          status: 'archived',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.articles['adv-unpublish-archived'].status).toBe('archived')
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('1.6: PATCH transition from published to draft NEVER triggers indexing', async () => {
      state.articles['adv-unpublish-draft'] = {
        id: 302,
        slug: 'adv-unpublish-draft',
        title: 'Article To Be Reverted To Draft',
        status: 'published',
        publishedAt: '2026-01-01T00:00:00Z',
        content: '<p>Artikel yang ditarik kembali menjadi draft oleh redaktur.</p>',
        metaTitle: 'Article Reverted To Draft Meta',
        metaDescription: 'Deskripsi penarikan artikel menjadi draf kembali.',
        seoData: JSON.stringify({ seoTitle: 'Title', metaDescription: 'Desc' }),
      }

      const res = await PATCH(
        request('PATCH', {
          slug: 'adv-unpublish-draft',
          status: 'draft',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.articles['adv-unpublish-draft'].status).toBe('draft')
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })
  })

  // =========================================================================
  // CHALLENGE 2: RAPID EDITS & 24H COOLDOWN SUPPRESSION
  // =========================================================================

  describe('Challenge 2: Rapid Edits & 24h Cooldown Suppression', () => {
    it('2.1: Multiple rapid PATCH updates on an already-published article within 24h suppress all crawler requests', async () => {
      const slug = 'adv-rapid-edits-article'
      const articleUrl = `https://www.segiatech.com/artikel/${slug}`

      state.articles[slug] = {
        id: 401,
        slug,
        title: 'Rapid Edits Article',
        status: 'published',
        publishedAt: '2026-05-10T00:00:00Z',
        content: '<p>Versi original artikel saat dipublikasikan.</p>',
        metaTitle: 'Rapid Edits Article Meta',
        metaDescription: 'Deskripsi pengujian rapid edits dan cooldown 24 jam.',
        seo: { metaTitle: 'Rapid Edits Article Meta', metaDescription: 'Deskripsi' },
        seoData: JSON.stringify({ seoTitle: 'Rapid Edits Article Meta', metaDescription: 'Deskripsi' }),
      }

      // Seed initial publication submission from 10 minutes ago
      const tenMinutesAgo = new Date(Date.now() - 600_000).toISOString()
      state.submissions.push(
        {
          id: 1,
          url: articleUrl,
          provider: 'indexnow',
          status: 'accepted',
          httpStatus: 202,
          trigger: 'publication',
          submittedAt: tenMinutesAgo,
        },
        {
          id: 2,
          url: articleUrl,
          provider: 'google',
          status: 'success',
          httpStatus: 200,
          trigger: 'publication',
          submittedAt: tenMinutesAgo,
        }
      )

      const initialSubmissionsCount = state.submissions.length

      // Rapid Edit 1: 5 minutes later (typo fix)
      const res1 = await PATCH(
        request('PATCH', {
          slug,
          content: '<p>Revisi pertama: memperbaiki typo kata pembuka.</p>',
        })
      )
      expect(res1.status).toBe(200)
      await flushBackgroundTasks()

      // Rapid Edit 2: 15 minutes later (adding image alt)
      const res2 = await PATCH(
        request('PATCH', {
          slug,
          coverAlt: 'Alt text baru untuk cover artikel',
        })
      )
      expect(res2.status).toBe(200)
      await flushBackgroundTasks()

      // Rapid Edit 3: 2 hours later (updating title)
      const res3 = await PATCH(
        request('PATCH', {
          slug,
          title: 'Rapid Edits Article - Judul Disesuaikan',
        })
      )
      expect(res3.status).toBe(200)
      await flushBackgroundTasks()

      // Rapid Edit 4: 23 hours later (final touch before 24h)
      const res4 = await PATCH(
        request('PATCH', {
          slug,
          metaDescription: 'Deskripsi meta diperbarui sedikit sebelum batas 24 jam.',
        })
      )
      expect(res4.status).toBe(200)
      await flushBackgroundTasks()

      // Empirical Verification:
      // ZERO outbound network calls were made across all 4 rapid edits
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)

      // Submissions table size did not grow (crawler spam prevented)
      expect(state.submissions.length).toBe(initialSubmissionsCount)

      // Content in database was nevertheless updated properly
      expect(state.articles[slug].title).toBe('Rapid Edits Article - Judul Disesuaikan')
      expect(state.articles[slug].content).toContain('Revisi pertama')
    })

    it('2.2: Updating after 24 hours (86,400s) elapses triggers legitimate re-indexing', async () => {
      const slug = 'adv-cooldown-expired-article'
      const articleUrl = `https://www.segiatech.com/artikel/${slug}`

      state.articles[slug] = {
        id: 402,
        slug,
        title: 'Cooldown Expired Article',
        status: 'published',
        publishedAt: '2026-05-01T00:00:00Z',
        content: '<p>Konten artikel sebelum pembaruan besar.</p>',
        metaTitle: 'Cooldown Expired Article Meta',
        metaDescription: 'Deskripsi sebelum pembaruan.',
        seo: { metaTitle: 'Meta', metaDescription: 'Desc' },
        seoData: JSON.stringify({ seoTitle: 'Meta', metaDescription: 'Desc' }),
      }

      // Seed previous submission from 25 hours ago (cooldown expired)
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 3600_000).toISOString()
      state.submissions.push(
        {
          id: 10,
          url: articleUrl,
          provider: 'indexnow',
          status: 'accepted',
          httpStatus: 202,
          trigger: 'publication',
          submittedAt: twentyFiveHoursAgo,
        },
        {
          id: 11,
          url: articleUrl,
          provider: 'google',
          status: 'success',
          httpStatus: 200,
          trigger: 'publication',
          submittedAt: twentyFiveHoursAgo,
        }
      )

      const res = await PATCH(
        request('PATCH', {
          slug,
          content: '<p>Konten artikel diperbarui total setelah 25 jam.</p>',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      // Exactly 1 network call per provider made
      expect(state.networkCalls.indexNow.length).toBe(1)
      expect(state.networkCalls.gsc.length).toBe(1)

      // 2 new submissions appended to PostgreSQL
      expect(state.submissions.length).toBe(4)
      const newSubs = state.submissions.filter((s) => s.id !== 10 && s.id !== 11)
      const latestIndexNow = newSubs.find((s) => s.provider === 'indexnow')
      const latestGoogle = newSubs.find((s) => s.provider === 'google')

      expect(latestIndexNow).toBeDefined()
      expect(latestIndexNow?.status).toBe('accepted')
      expect(latestGoogle).toBeDefined()
      expect(latestGoogle?.status).toBe('success')
    })
  })

  // =========================================================================
  // CHALLENGE 3: ROBOTS DIRECTIVES
  // =========================================================================

  describe('Challenge 3: Robots Directives Protection', () => {
    it('3.1: Submitting article with robots: "noindex, nofollow" strictly aborts indexing', async () => {
      const res = await POST(
        request('POST', {
          title: 'Article With Noindex Root Directive',
          slug: 'article-noindex-root',
          content: '<p>Artikel rahasia/internal yang diberi direktif noindex.</p>',
          status: 'published',
          robots: 'noindex, nofollow',
          metaTitle: 'Article With Noindex Root Meta',
          metaDescription: 'Deskripsi artikel rahasia dengan direktif noindex nofollow.',
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      // Article is saved to DB
      expect(state.articles['article-noindex-root']).toBeDefined()
      expect(state.articles['article-noindex-root'].status).toBe('published')

      // BUT indexing dispatcher MUST abort before making network calls or writing submissions
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('3.2: Submitting article with seoData.robots.index === false strictly aborts indexing', async () => {
      const res = await POST(
        request('POST', {
          title: 'Article With Structured Noindex Directive',
          slug: 'article-noindex-structured',
          content: '<p>Artikel yang di-set index: false di dalam seoData robots object.</p>',
          status: 'published',
          metaTitle: 'Structured Noindex Meta',
          metaDescription: 'Deskripsi pengujian noindex terstruktur.',
          seoData: {
            robots: {
              index: false,
              follow: true,
            },
          },
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.articles['article-noindex-structured']).toBeDefined()
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
      expect(state.submissions.length).toBe(0)
    })

    it('3.3: Direct invocation of triggerAutomatedIndexing with robots: "noindex" aborts immediately', async () => {
      const results1 = await triggerAutomatedIndexing({
        url: 'https://www.segiatech.com/artikel/noindex-test-1',
        robots: 'noindex, nofollow',
      })
      expect(results1).toEqual([])

      const results2 = await triggerAutomatedIndexing({
        url: 'https://www.segiatech.com/artikel/noindex-test-2',
        robots: 'NOINDEX',
      })
      expect(results2).toEqual([])

      // Zero network calls were made
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
    })

    it('3.4: Submitting article with robots: "index, follow" proceeds normally with indexing', async () => {
      const res = await POST(
        request('POST', {
          title: 'Article With Index Allowed Directive',
          slug: 'article-index-allowed',
          content: '<p>Artikel normal yang diizinkan untuk diindeks oleh crawler.</p>',
          status: 'published',
          metaTitle: 'Article Index Allowed Meta',
          metaDescription: 'Deskripsi artikel normal yang diizinkan untuk diindeks.',
          seoData: {
            robots: {
              index: true,
              follow: true,
            },
          },
        })
      )

      expect(res.status).toBe(200)
      await flushBackgroundTasks()

      expect(state.networkCalls.indexNow.length).toBe(1)
      expect(state.networkCalls.gsc.length).toBe(1)
      expect(state.submissions.length).toBe(2)
    })

    it('3.5: Scheduled article with noindex in seoData is evaluated during automated scheduler release', async () => {
      // Seed a scheduled article with noindex in seoData
      state.articles['adv-scheduled-noindex'] = {
        id: 305,
        slug: 'adv-scheduled-noindex',
        title: 'Scheduled Article With Noindex',
        status: 'scheduled',
        scheduledAt: '2026-05-01T10:00:00Z',
        content: '<p>Konten artikel terjadwal dengan noindex.</p>',
        metaTitle: 'Scheduled Noindex Meta',
        metaDescription: 'Deskripsi scheduled noindex.',
        seoData: JSON.stringify({
          seoTitle: 'Scheduled Noindex Meta',
          metaDescription: 'Deskripsi',
          robots: { index: false, follow: false },
        }),
      }

      const publishedSlugs = await publishDueArticles(new Date('2026-05-01T10:05:00Z'))
      expect(publishedSlugs).toContain('adv-scheduled-noindex')

      await flushBackgroundTasks()

      const hasOutgoingPings = state.networkCalls.indexNow.some(
        (c) => c.body?.urlList?.some((u: string) => u.includes('adv-scheduled-noindex'))
      ) || state.networkCalls.gsc.some(
        (c) => c.body?.inspectionUrl?.includes('adv-scheduled-noindex')
      )

      console.log('[Adversarial Investigation] Scheduled noindex article outgoing pings made:', hasOutgoingPings)
    })
  })

  // =========================================================================
  // CHALLENGE 4: CONCURRENT & BURST STRESS HARNESS
  // =========================================================================

  describe('Challenge 4: Burst & Stress Invariants', () => {
    it('4.1: Burst of 5 concurrent PATCH requests on published article does not cause race condition spam', async () => {
      const slug = 'adv-burst-patch-article'
      const articleUrl = `https://www.segiatech.com/artikel/${slug}`

      state.articles[slug] = {
        id: 501,
        slug,
        title: 'Burst Patch Article',
        status: 'published',
        publishedAt: '2026-05-10T00:00:00Z',
        content: '<p>Artikel sebelum burst concurrent patch.</p>',
        metaTitle: 'Burst Patch Meta',
        metaDescription: 'Deskripsi burst patch.',
        seo: { metaTitle: 'Meta', metaDescription: 'Desc' },
        seoData: JSON.stringify({ seoTitle: 'Meta', metaDescription: 'Desc' }),
      }

      // Seed previous submission from 1 hour ago
      const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
      state.submissions.push(
        {
          id: 50,
          url: articleUrl,
          provider: 'indexnow',
          status: 'accepted',
          httpStatus: 202,
          trigger: 'publication',
          submittedAt: oneHourAgo,
        },
        {
          id: 51,
          url: articleUrl,
          provider: 'google',
          status: 'success',
          httpStatus: 200,
          trigger: 'publication',
          submittedAt: oneHourAgo,
        }
      )

      // Fire 5 concurrent PATCH requests
      const patches = Array.from({ length: 5 }, (_, i) =>
        PATCH(
          request('PATCH', {
            slug,
            content: `<p>Concurrent burst update payload #${i + 1}</p>`,
          })
        )
      )

      const responses = await Promise.all(patches)
      for (const res of responses) {
        expect(res.status).toBe(200)
      }

      await flushBackgroundTasks()

      // Zero new network calls made across all 5 concurrent updates
      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)

      // No duplicate submissions inserted
      expect(state.submissions.length).toBe(2)
    })

    it('4.2: triggerAutomatedIndexing handles invalid/malformed protocols safely without crashing', async () => {
      const invalidProtocolResult = await triggerAutomatedIndexing({
        url: 'javascript:alert(1)',
      })

      // Must safely return [] without throwing exception
      expect(invalidProtocolResult).toEqual([])

      const emptyUrlResult = await triggerAutomatedIndexing({
        url: '',
      })
      expect(emptyUrlResult).toEqual([])

      expect(state.networkCalls.indexNow.length).toBe(0)
      expect(state.networkCalls.gsc.length).toBe(0)
    })
  })
})

