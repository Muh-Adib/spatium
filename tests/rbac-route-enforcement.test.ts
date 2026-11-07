/**
 * Route enforcement ⇄ capability matrix.
 *
 * For every mutation (and restricted read) route, each Studio role is sent
 * through the real handler with a mocked session. A role must get 403 exactly
 * when the matrix (`src/lib/auth/capability-matrix.ts`) denies the capability;
 * allowed roles must pass the auth gate (they then fail validation on purpose,
 * so nothing is written). The UI hides actions with the same `can()`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { Role } from '@/lib/auth/types'
import { ALL_ROLES, CAPABILITIES, can, type Capability } from '@/lib/auth/capability-matrix'

const session = vi.hoisted(() => ({ role: null as string | null }))

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => (session.role ? { id: 'usr_rbac_test', email: 'rbac-test@example.invalid', name: 'RBAC test' } : null)),
}))
vi.mock('@/lib/auth/secret', () => ({
  getValidatedAuthSecret: () => 'rbac-route-enforcement-test-secret-value',
  validateBearerToken: () => false,
}))
vi.mock('@/lib/auth/credentials', () => ({
  resolveCurrentRole: vi.fn(async () => session.role),
}))

type Handler = (request: NextRequest, ctx?: { params: Promise<{ id: string }> }) => Promise<Response>
type Case = {
  capability: Capability
  name: string
  load: () => Promise<Handler>
  method: string
  path: string
  body?: unknown
  /** Raw body (e.g. multipart) instead of JSON. */
  form?: FormData
  headers?: Record<string, string>
  params?: { id: string }
}

const ORIGIN = 'http://localhost:3002'

/** Bodies are deliberately invalid: allowed roles stop at validation, nothing is written. */
const CASES: Case[] = [
  // Articles (ROLE_PERMISSIONS is derived from the matrix)
  { capability: 'article:read', name: 'GET /api/articles', load: async () => (await import('@/app/api/articles/route')).GET, method: 'GET', path: '/api/articles?slug=__rbac-test-missing__' },
  { capability: 'article:create', name: 'POST /api/articles', load: async () => (await import('@/app/api/articles/route')).POST, method: 'POST', path: '/api/articles' },
  { capability: 'article:delete', name: 'DELETE /api/articles', load: async () => (await import('@/app/api/articles/route')).DELETE, method: 'DELETE', path: '/api/articles' },

  // Article categories
  { capability: 'article-category:create', name: 'POST /api/categories', load: async () => (await import('@/app/api/categories/route')).POST, method: 'POST', path: '/api/categories', body: {} },
  { capability: 'article-category:update', name: 'PATCH /api/categories', load: async () => (await import('@/app/api/categories/route')).PATCH, method: 'PATCH', path: '/api/categories', body: {} },
  { capability: 'article-category:delete', name: 'DELETE /api/categories', load: async () => (await import('@/app/api/categories/route')).DELETE, method: 'DELETE', path: '/api/categories' },

  // Pages
  { capability: 'page:create', name: 'POST /api/pages', load: async () => (await import('@/app/api/pages/route')).POST, method: 'POST', path: '/api/pages', body: {} },
  { capability: 'page:update', name: 'PATCH /api/pages/:id', load: async () => (await import('@/app/api/pages/[id]/route')).PATCH, method: 'PATCH', path: '/api/pages/x', params: { id: 'x' }, body: {} },
  { capability: 'page:update', name: 'POST /api/pages/:id/status', load: async () => (await import('@/app/api/pages/[id]/status/route')).POST, method: 'POST', path: '/api/pages/x/status', params: { id: 'x' }, body: {} },
  { capability: 'page:delete', name: 'DELETE /api/pages/:id', load: async () => (await import('@/app/api/pages/[id]/route')).DELETE, method: 'DELETE', path: '/api/pages/x', params: { id: 'x' } },

  // Catalog
  { capability: 'portfolio:create', name: 'POST /api/portfolio', load: async () => (await import('@/app/api/portfolio/route')).POST, method: 'POST', path: '/api/portfolio', body: {} },
  { capability: 'portfolio:update', name: 'POST /api/portfolio (update)', load: async () => (await import('@/app/api/portfolio/route')).POST, method: 'POST', path: '/api/portfolio', body: { id: 'not-a-number' } },
  { capability: 'portfolio:delete', name: 'DELETE /api/portfolio', load: async () => (await import('@/app/api/portfolio/route')).DELETE, method: 'DELETE', path: '/api/portfolio' },
  { capability: 'portfolio:create', name: 'POST /api/portfolio/upload-tour', load: async () => (await import('@/app/api/portfolio/upload-tour/route')).POST, method: 'POST', path: '/api/portfolio/upload-tour', form: new FormData() },
  { capability: 'service:create', name: 'POST /api/services', load: async () => (await import('@/app/api/services/route')).POST, method: 'POST', path: '/api/services', body: {} },
  { capability: 'service:update', name: 'POST /api/services (update)', load: async () => (await import('@/app/api/services/route')).POST, method: 'POST', path: '/api/services', body: { id: 'not-a-number' } },
  { capability: 'service:delete', name: 'DELETE /api/services', load: async () => (await import('@/app/api/services/route')).DELETE, method: 'DELETE', path: '/api/services' },
  { capability: 'service-category:create', name: 'POST /api/service-categories', load: async () => (await import('@/app/api/service-categories/route')).POST, method: 'POST', path: '/api/service-categories', body: {} },
  { capability: 'service-category:update', name: 'POST /api/service-categories (update)', load: async () => (await import('@/app/api/service-categories/route')).POST, method: 'POST', path: '/api/service-categories', body: { id: 'not-a-number' } },
  { capability: 'service-category:delete', name: 'DELETE /api/service-categories', load: async () => (await import('@/app/api/service-categories/route')).DELETE, method: 'DELETE', path: '/api/service-categories' },
  { capability: 'portfolio:update', name: 'GET /api/portfolio/:id/revisions', load: async () => (await import('@/app/api/portfolio/[id]/revisions/route')).GET, method: 'GET', path: '/api/portfolio/x/revisions', params: { id: 'x' } },
  { capability: 'service:update', name: 'GET /api/services/:id/revisions', load: async () => (await import('@/app/api/services/[id]/revisions/route')).GET, method: 'GET', path: '/api/services/x/revisions', params: { id: 'x' } },
  { capability: 'service-category:update', name: 'GET /api/service-categories/:id/revisions', load: async () => (await import('@/app/api/service-categories/[id]/revisions/route')).GET, method: 'GET', path: '/api/service-categories/x/revisions', params: { id: 'x' } },

  // Reusable content
  { capability: 'client:manage', name: 'POST /api/clients', load: async () => (await import('@/app/api/clients/route')).POST, method: 'POST', path: '/api/clients', body: {} },
  { capability: 'client:delete', name: 'DELETE /api/clients', load: async () => (await import('@/app/api/clients/route')).DELETE, method: 'DELETE', path: '/api/clients' },
  { capability: 'cta:manage', name: 'POST /api/cta', load: async () => (await import('@/app/api/cta/route')).POST, method: 'POST', path: '/api/cta', body: {} },
  { capability: 'cta:delete', name: 'DELETE /api/cta', load: async () => (await import('@/app/api/cta/route')).DELETE, method: 'DELETE', path: '/api/cta' },
  { capability: 'template:create', name: 'POST /api/templates', load: async () => (await import('@/app/api/templates/route')).POST, method: 'POST', path: '/api/templates', body: {} },
  { capability: 'template:delete', name: 'DELETE /api/templates', load: async () => (await import('@/app/api/templates/route')).DELETE, method: 'DELETE', path: '/api/templates' },

  // Media
  { capability: 'media:upload', name: 'POST /api/upload', load: async () => (await import('@/app/api/upload/route')).POST, method: 'POST', path: '/api/upload', form: new FormData() },
  { capability: 'media:manage', name: 'POST /api/media', load: async () => (await import('@/app/api/media/route')).POST, method: 'POST', path: '/api/media', body: { action: 'not-an-action' } },
  { capability: 'media:manage', name: 'PATCH /api/media', load: async () => (await import('@/app/api/media/route')).PATCH, method: 'PATCH', path: '/api/media', body: {} },
  { capability: 'media:delete', name: 'DELETE /api/media', load: async () => (await import('@/app/api/media/route')).DELETE, method: 'DELETE', path: '/api/media' },

  // SEO
  { capability: 'seo:manage', name: 'POST /api/audit', load: async () => (await import('@/app/api/audit/route')).POST, method: 'POST', path: '/api/audit', body: { type: 'not-a-type' } },
  { capability: 'seo:manage', name: 'POST /api/perf', load: async () => (await import('@/app/api/perf/route')).POST, method: 'POST', path: '/api/perf', body: { device: 'not-a-device' } },
  { capability: 'seo:manage', name: 'POST /api/indexnow', load: async () => (await import('@/app/api/indexnow/route')).POST, method: 'POST', path: '/api/indexnow', body: {} },
  { capability: 'seo:manage', name: 'POST /api/indexing/retrigger', load: async () => (await import('@/app/api/indexing/retrigger/route')).POST, method: 'POST', path: '/api/indexing/retrigger', body: {} },
  { capability: 'seo:manage', name: 'GET /api/indexing/status', load: async () => (await import('@/app/api/indexing/status/route')).GET, method: 'GET', path: '/api/indexing/status' },
  { capability: 'seo:manage', name: 'GET /api/indexing/history', load: async () => (await import('@/app/api/indexing/history/route')).GET, method: 'GET', path: '/api/indexing/history?page=0' },
  { capability: 'seo:manage', name: 'POST /api/keywords', load: async () => (await import('@/app/api/keywords/route')).POST, method: 'POST', path: '/api/keywords' },
  { capability: 'seo:manage', name: 'POST /api/gsc (sync)', load: async () => (await import('@/app/api/gsc/route')).POST, method: 'POST', path: '/api/gsc', body: { daysBack: 999 } },
  { capability: 'redirect:manage', name: 'POST /api/redirects', load: async () => (await import('@/app/api/redirects/route')).POST, method: 'POST', path: '/api/redirects', body: {} },
  { capability: 'redirect:delete', name: 'DELETE /api/redirects', load: async () => (await import('@/app/api/redirects/route')).DELETE, method: 'DELETE', path: '/api/redirects' },

  // Governance
  { capability: 'user:manage', name: 'GET /api/users', load: async () => (await import('@/app/api/users/route')).GET, method: 'GET', path: '/api/users' },
  { capability: 'user:manage', name: 'POST /api/users', load: async () => (await import('@/app/api/users/route')).POST, method: 'POST', path: '/api/users', body: {} },
  { capability: 'settings:manage', name: 'POST /api/settings', load: async () => (await import('@/app/api/settings/route')).POST, method: 'POST', path: '/api/settings', body: { notASettingsKey: true } },
  { capability: 'mcp:manage', name: 'POST /api/mcp-keys', load: async () => (await import('@/app/api/mcp-keys/route')).POST, method: 'POST', path: '/api/mcp-keys', body: {} },
  { capability: 'mcp:manage', name: 'DELETE /api/mcp-keys/:id', load: async () => (await import('@/app/api/mcp-keys/[id]/route')).DELETE, method: 'DELETE', path: '/api/mcp-keys/x', params: { id: 'x' } },
  { capability: 'theme:manage', name: 'POST /api/theme/tokens', load: async () => (await import('@/app/api/theme/tokens/route')).POST, method: 'POST', path: '/api/theme/tokens' },
  { capability: 'system:manage', name: 'POST /api/system/status', load: async () => (await import('@/app/api/system/status/route')).POST, method: 'POST', path: '/api/system/status', body: {} },
]

/**
 * Capabilities without a route of their own: the article workflow ones are
 * enforced through ROLE_PERMISSIONS / validateStatusTransition (derived from
 * the matrix and covered in security-rbac.test.ts); publish capabilities are a
 * second check inside the save handlers (`forbidUnless`).
 */
const ENFORCED_ELSEWHERE: ReadonlySet<Capability> = new Set<Capability>([
  'article:update',
  'article:update-any',
  'article:submit',
  'article:review',
  'article:publish',
  'page:publish',
  'portfolio:publish',
  'service:publish',
  'service-category:publish',
  'template:update',
])

function buildRequest(c: Case): NextRequest {
  const headers = new Headers({ origin: ORIGIN, host: 'localhost:3002', ...c.headers })
  let body: BodyInit | undefined
  if (c.form) body = c.form
  else if (c.body !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(c.body)
  }
  return new NextRequest(`${ORIGIN}${c.path}`, { method: c.method, headers, body })
}

async function call(c: Case): Promise<number> {
  const handler = await c.load()
  const res = await handler(buildRequest(c), c.params ? { params: Promise.resolve(c.params) } : undefined)
  return res.status
}

beforeEach(() => {
  session.role = null
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('capability matrix ⇄ route enforcement', () => {
  it('every capability is either enforced by a tested route or listed as enforced elsewhere', () => {
    const tested = new Set(CASES.map((c) => c.capability))
    const untested = CAPABILITIES.filter((cap) => !tested.has(cap) && !ENFORCED_ELSEWHERE.has(cap))
    expect(untested).toEqual([])
  })

  it.each(CASES)('$name rejects anonymous requests with 401', async (c) => {
    expect(await call(c)).toBe(401)
  })

  describe.each(ALL_ROLES.map((role) => ({ role })))('$role', ({ role }: { role: Role }) => {
    it.each(CASES)(`$name (capability $capability)`, async (c) => {
      session.role = role
      const status = await call(c)
      if (can(role, c.capability)) {
        expect(status, `${role} holds ${c.capability} but ${c.name} answered ${status}`).not.toBe(403)
        expect(status).not.toBe(401)
      } else {
        expect(status, `${role} lacks ${c.capability} but ${c.name} answered ${status}`).toBe(403)
      }
    })
  })
})

describe('role matrix principles', () => {
  const holders = (cap: Capability) => ALL_ROLES.filter((r) => can(r, cap))

  it('only admins delete content', () => {
    for (const cap of ['article:delete', 'page:delete', 'portfolio:delete', 'service:delete', 'service-category:delete', 'article-category:delete', 'client:delete', 'cta:delete', 'template:delete'] as const) {
      expect(holders(cap)).toEqual(['SUPER_ADMIN', 'CONTENT_ADMIN'])
    }
  })

  it('publishers (admins and editors) publish every content type', () => {
    for (const cap of ['article:publish', 'page:publish', 'portfolio:publish', 'service:publish', 'service-category:publish'] as const) {
      expect(holders(cap)).toEqual(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
    }
  })

  it('whoever may publish may also edit, and whoever may delete may also edit', () => {
    const pairs: [Capability, Capability][] = [
      ['page:publish', 'page:update'], ['page:delete', 'page:update'],
      ['portfolio:publish', 'portfolio:update'], ['portfolio:delete', 'portfolio:update'],
      ['service:publish', 'service:update'], ['service:delete', 'service:update'],
      ['service-category:publish', 'service-category:update'], ['service-category:delete', 'service-category:update'],
      ['redirect:delete', 'redirect:manage'], ['media:delete', 'media:manage'], ['media:manage', 'media:upload'],
      ['client:delete', 'client:manage'], ['cta:delete', 'cta:manage'],
    ]
    for (const [stronger, weaker] of pairs) {
      for (const role of holders(stronger)) expect(can(role, weaker), `${role}: ${stronger} ⇒ ${weaker}`).toBe(true)
    }
  })

  it('domain owners may delete inside their domain', () => {
    expect(can('SEO_MANAGER', 'redirect:manage')).toBe(true)
    expect(can('SEO_MANAGER', 'redirect:delete')).toBe(true)
    expect(can('MEDIA_MANAGER', 'media:manage')).toBe(true)
    expect(can('MEDIA_MANAGER', 'media:delete')).toBe(true)
    expect(can('EDITOR', 'media:delete')).toBe(false)
    expect(can('EDITOR', 'redirect:delete')).toBe(false)
  })

  it('SEO tools, including Search Console sync, share one capability', () => {
    expect(holders('seo:manage')).toEqual(['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER'])
  })

  it('governance is admin-only', () => {
    for (const cap of ['user:manage', 'settings:manage', 'mcp:manage', 'system:manage', 'theme:manage'] as const) {
      expect(holders(cap)).toEqual(['SUPER_ADMIN', 'CONTENT_ADMIN'])
    }
  })

  it('authors upload images for their articles; reviewers and SEO managers do not', () => {
    expect(can('AUTHOR', 'media:upload')).toBe(true)
    expect(can('AUTHOR', 'media:manage')).toBe(false)
    expect(can('REVIEWER', 'media:upload')).toBe(false)
    expect(can('SEO_MANAGER', 'media:upload')).toBe(false)
  })

  it('media managers do not read editorial content', () => {
    expect(can('MEDIA_MANAGER', 'article:read')).toBe(false)
    expect(holders('article:read')).not.toContain('MEDIA_MANAGER')
  })
})
