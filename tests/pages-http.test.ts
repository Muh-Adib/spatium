import { describe, it, expect } from 'vitest'
import {
  PAGE_ERROR_STATUS,
  PAGE_ROLES,
  canPublishPages,
  matchesPageQuery,
  pageErrorPayload,
  pageIdSchema,
  pageStatusBodySchema,
  pathsToRevalidate,
  rolesForTransition,
} from '../src/lib/pages/http'
import { computePageGate, gateIssueTarget } from '../src/lib/pages/gate'
import { parseRobots, startsWithHero } from '../src/lib/pages/render'
import { createBlock } from '../src/lib/blocks/catalog'

describe('pages API: error mapping', () => {
  it('maps every repository error code to the documented HTTP status', () => {
    expect(PAGE_ERROR_STATUS).toEqual({ not_found: 404, conflict: 409, slug_taken: 409, invalid: 422, gate: 422, forbidden: 403 })
  })

  it('builds { error, code, issues?, blockIssues? } without leaking internals', () => {
    const blockIssues = [{ index: 0, blockId: 'b1', type: 'splat-viewer', message: 'splatId: invalid' }]
    const { status, body } = pageErrorPayload({ code: 'gate', message: 'Belum memenuhi syarat.', details: { issues: ['Meta Title kosong'], blockIssues } })
    expect(status).toBe(422)
    expect(body).toEqual({ error: 'Belum memenuhi syarat.', code: 'gate', issues: ['Meta Title kosong'], blockIssues })
    expect(Object.keys(body)).not.toContain('stack')

    const plain = pageErrorPayload({ code: 'not_found', message: 'Halaman tidak ditemukan.', details: { issues: [] } })
    expect(plain).toEqual({ status: 404, body: { error: 'Halaman tidak ditemukan.', code: 'not_found' } })
  })
})

describe('pages API: role policy', () => {
  it('lets editors edit drafts but not publish, archive or unpublish', () => {
    expect(PAGE_ROLES.edit).toContain('EDITOR')
    expect(canPublishPages('EDITOR')).toBe(false)
    expect(canPublishPages('CONTENT_ADMIN')).toBe(true)
    expect(rolesForTransition('draft', 'in_review')).toContain('EDITOR')
    expect(rolesForTransition('in_review', 'draft')).toContain('EDITOR')
    expect(rolesForTransition('draft', 'published')).not.toContain('EDITOR')
    expect(rolesForTransition('published', 'draft')).not.toContain('EDITOR')
    expect(rolesForTransition('draft', 'archived')).not.toContain('EDITOR')
    expect(PAGE_ROLES.delete).toEqual(['SUPER_ADMIN', 'CONTENT_ADMIN'])
  })

  it('validates ids and status bodies at the boundary', () => {
    expect(pageIdSchema.safeParse('12').success).toBe(true)
    expect(pageIdSchema.safeParse('0').success).toBe(false)
    expect(pageIdSchema.safeParse('abc').success).toBe(false)
    expect(pageStatusBodySchema.safeParse({ status: 'published' }).success).toBe(true)
    expect(pageStatusBodySchema.safeParse({ status: 'live' }).success).toBe(false)
  })
})

describe('pages API: revalidation targets', () => {
  it('touches nothing public for drafts', () => {
    expect(pathsToRevalidate({ slug: 'a', status: 'draft' }, { slug: 'a', status: 'draft' })).toEqual([])
    expect(pathsToRevalidate(null, { slug: 'a', status: 'draft' })).toEqual([])
  })
  it('revalidates the page and sitemap on publish, unpublish and delete', () => {
    expect(pathsToRevalidate({ slug: 'a', status: 'draft' }, { slug: 'a', status: 'published' })).toEqual(['/a', '/sitemap.xml'])
    expect(pathsToRevalidate({ slug: 'a', status: 'published' }, { slug: 'a', status: 'draft' })).toEqual(['/a', '/sitemap.xml'])
    expect(pathsToRevalidate({ slug: 'a', status: 'published' }, null)).toEqual(['/a', '/sitemap.xml'])
  })
  it('revalidates both URLs when a published page is renamed', () => {
    expect(pathsToRevalidate({ slug: 'lama', status: 'published' }, { slug: 'baru', status: 'published' })).toEqual(['/lama', '/baru', '/sitemap.xml'])
  })
})

describe('pages: list filter, gate and rendering helpers', () => {
  it('filters by title or slug, case-insensitively', () => {
    const page = { title: 'Kampanye Wedding', slug: 'kampanye-wedding' }
    expect(matchesPageQuery(page, undefined)).toBe(true)
    expect(matchesPageQuery(page, 'WEDDING')).toBe(true)
    expect(matchesPageQuery(page, 'kampanye-w')).toBe(true)
    expect(matchesPageQuery(page, 'hotel')).toBe(false)
  })

  it('reports gate issues and points each to the field that fixes it', () => {
    const gate = computePageGate({ title: 'Halaman', slug: 'halaman-uji', metaTitle: null, metaDescription: null, ogImage: '/x.webp', ogImageAlt: null, blocks: [] })
    const targets = gate.issues.map(gateIssueTarget)
    expect(targets).toEqual(expect.arrayContaining(['metaTitle', 'metaDescription', 'ogImageAlt', 'blocks']))
  })

  it('passes the gate for a complete page', () => {
    const gate = computePageGate({
      title: 'Halaman uji',
      slug: 'halaman-uji',
      metaTitle: 'Halaman uji SPATIUM',
      metaDescription: 'Deskripsi halaman uji yang cukup panjang untuk gerbang.',
      ogImage: null,
      ogImageAlt: null,
      blocks: [createBlock('hero-cinema')],
    })
    expect(gate.issues).toEqual([])
    expect(gate.blockIssues).toEqual([])
  })

  it('parses robots and detects a leading hero', () => {
    expect(parseRobots('noindex, nofollow')).toEqual({ index: false, follow: false })
    expect(parseRobots('index, follow')).toEqual({ index: true, follow: true })
    expect(parseRobots(null)).toEqual({ index: true, follow: true })
    expect(startsWithHero([{ type: 'hero-cinema' }])).toBe(true)
    expect(startsWithHero([{ type: 'paragraph', content: 'x' }])).toBe(false)
    expect(startsWithHero([])).toBe(false)
  })
})
