import { describe, it, expect } from 'vitest'
import {
  catalogGateResponse,
  coverAltFrom,
  jsonColumn,
  mergeSeoData,
  normalizeCatalogSlug,
  parseJsonArray,
  stripUndefined,
  toIntOrDefault,
} from '../src/lib/db/catalogMutations'
import {
  portfolioMutationSchema,
  serviceMutationSchema,
  serviceCategoryMutationSchema,
  solutionMutationSchema,
  solutionFinderConfigSchema,
  validateCatalogBody,
} from '../src/lib/validation/api-schemas'

describe('catalog mutation helpers', () => {
  it('normalises slugs and rejects empty ones', () => {
    expect(normalizeCatalogSlug('  QA Portfolio -- Satu! ')).toBe('qa-portfolio-satu')
    expect(normalizeCatalogSlug('---')).toBe('')
  })

  it('serialises JSON columns without inventing values', () => {
    expect(jsonColumn(undefined)).toBeNull()
    expect(jsonColumn('')).toBeNull()
    expect(jsonColumn('[1]')).toBe('[1]')
    expect(jsonColumn([{ label: 'a', value: '1' }])).toBe('[{"label":"a","value":"1"}]')
  })

  it('merges seoData so a cover-alt save keeps other SEO keys', () => {
    const stored = JSON.stringify({ ogImage: '/a.webp', coverAlt: 'lama' })
    expect(JSON.parse(mergeSeoData(stored, { coverAlt: 'baru' }) ?? '{}')).toEqual({ ogImage: '/a.webp', coverAlt: 'baru' })
    expect(mergeSeoData(stored, null)).toBeNull()
    expect(mergeSeoData(null, { coverAlt: 'x' })).toBe('{"coverAlt":"x"}')
  })

  it('reads cover alt text from stored or incoming seoData', () => {
    expect(coverAltFrom('{"coverAlt":"  Ruang galeri  "}')).toBe('Ruang galeri')
    expect(coverAltFrom({ coverAlt: '' })).toBeUndefined()
    expect(coverAltFrom('not json')).toBeUndefined()
  })

  it('parses array columns and ignores malformed ones', () => {
    expect(parseJsonArray('[1,2]')).toEqual([1, 2])
    expect(parseJsonArray('{"a":1}')).toBeUndefined()
    expect(parseJsonArray(undefined)).toBeUndefined()
  })

  it('drops undefined keys so partial updates keep stored fields', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null })
    expect(toIntOrDefault('', 0)).toBe(0)
    expect(toIntOrDefault('7', 0)).toBe(7)
  })

  it('blocks publication without SEO meta and cover alt text', async () => {
    const blocked = catalogGateResponse({ title: 'QA Item', slug: 'qa-item', heroImage: '/x.webp' })
    expect(blocked?.status).toBe(422)
    const body = await blocked?.json()
    expect(body.success).toBe(false)
    expect(body.issues.length).toBeGreaterThan(0)

    expect(
      catalogGateResponse({
        title: 'QA Item',
        slug: 'qa-item',
        metaTitle: 'QA Item meta title',
        metaDescription: 'Deskripsi meta untuk item QA.',
        heroImage: '/x.webp',
        heroImageAlt: 'Ruang galeri hasil pemindaian',
      }),
    ).toBeNull()
  })
})

describe('catalog mutation schemas', () => {
  it('portfolio: no default status (route decides draft) and year must be 4 digits', () => {
    const ok = portfolioMutationSchema.parse({ title: 'QA', slug: 'qa' })
    expect(ok.status).toBeUndefined()
    expect(portfolioMutationSchema.safeParse({ title: 'QA', slug: 'qa', year: 'abc' }).success).toBe(false)
    expect(portfolioMutationSchema.safeParse({ title: 'QA', slug: 'qa', year: '' }).success).toBe(true)
    expect(portfolioMutationSchema.safeParse({ title: 'QA', slug: 'qa', status: 'live' }).success).toBe(false)
  })

  it('service: ids coerce from strings, portfolio links must be positive ids', () => {
    const parsed = serviceMutationSchema.parse({ id: '12', name: 'QA', slug: 'qa', portfolioIds: ['3', 4] })
    expect(parsed.id).toBe(12)
    expect(parsed.portfolioIds).toEqual([3, 4])
    expect(serviceMutationSchema.safeParse({ name: 'QA', slug: 'qa', portfolioIds: [-1] }).success).toBe(false)
    expect(serviceMutationSchema.safeParse({ name: 'QA', slug: 'qa', order: 'abc' }).success).toBe(false)
  })

  it('category and solution require a title and slug', () => {
    expect(serviceCategoryMutationSchema.safeParse({ slug: 'qa' }).success).toBe(false)
    expect(solutionMutationSchema.safeParse({ title: 'QA', slug: '' }).success).toBe(false)
  })

  it('finder config accepts arrays or JSON strings and strips unknown keys', () => {
    const parsed = solutionFinderConfigSchema.parse({ businessGoals: [{ id: 'a' }], id: 1, updatedAt: 'x' })
    expect(parsed).toEqual({ businessGoals: [{ id: 'a' }] })
    expect(solutionFinderConfigSchema.safeParse({ industries: { not: 'array' } }).success).toBe(false)
  })

  it('validateCatalogBody returns a readable first issue in the UI shape', async () => {
    const result = validateCatalogBody(serviceMutationSchema, { slug: 'qa' })
    expect(result.success).toBe(false)
    if (result.success) return
    const body = await result.response.json()
    expect(result.response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/^name: /)
    expect(Array.isArray(body.issues)).toBe(true)
  })
})
