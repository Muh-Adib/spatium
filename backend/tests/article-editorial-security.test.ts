import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({
  role: 'AUTHOR',
  existing: { slug: 'existing', title: 'Existing', status: 'published', publishedAt: '2020-01-02T03:04:05Z', content: '<p>Existing</p>', author: { name: 'Other Author' }, seo: { metaTitle: 'Existing SEO title', metaDescription: 'Existing SEO description.' }, seoData: { schema: { '@type': 'Article' }, openGraph: { imageAlt: 'Original article illustration', title: 'Original social title' } } },
  update: vi.fn(), create: vi.fn(),
}))
vi.mock('@/lib/auth/rbac', async (original) => ({
  ...await original<object>(),
  requireUser: async () => ({ error: null, user: { id: 'author-1', name: 'Current Author', role: state.role, authenticated: true } }),
}))
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: {
  Category: { upsert: async () => ({ id: 1 }) }, Author: { upsert: async () => ({ id: 1 }) },
} } } }))
vi.mock('@/lib/db/articles', () => ({
  getArticleBySlug: async () => state.existing,
  updateArticle: state.update, createArticle: state.create,
  getArticles: vi.fn(), deleteArticle: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { POST, PATCH } from '../src/app/api/articles/route'
const request = (method: string, body: object) => new NextRequest('http://localhost/api/articles', { method, body: JSON.stringify(body) })
beforeEach(() => { state.role = 'AUTHOR'; state.update.mockClear(); state.create.mockClear() })
describe('Article editorial security', () => {
  it('rejects creation over an existing slug rather than bypassing ownership', async () => {
    const response = await POST(request('POST', { title: 'Overwrite', slug: 'existing', content: '<p>Overwrite</p>', status: 'draft' }))
    expect(response.status).toBe(409)
    expect(state.update).not.toHaveBeenCalled()
  })
  it('rejects content edits by a media manager', async () => {
    state.role = 'MEDIA_MANAGER'
    const response = await PATCH(request('PATCH', { slug: 'existing', content: '<p>Changed</p>' }))
    expect(response.status).toBe(403)
    expect(state.update).not.toHaveBeenCalled()
  })
  it('retains historical publication date when an editor saves a published article', async () => {
    state.role = 'EDITOR'
    const response = await PATCH(request('PATCH', { slug: 'existing', status: 'published', content: '<p>Changed</p>' }))
    expect(response.status).toBe(200)
    expect(state.update).toHaveBeenCalledWith('existing', expect.not.objectContaining({ publishedAt: expect.anything() }))
  })
  it('rejects an image without alt text in a status-less edit to published content', async () => {
    state.role = 'EDITOR'
    const response = await PATCH(request('PATCH', { slug: 'existing', content: '<p>Changed</p><img src="/image.jpg">' }))
    expect(response.status).toBe(422)
    expect(state.update).not.toHaveBeenCalled()
  })
  it('does not mask an explicit blank SEO title with the article title', async () => {
    state.role = 'SEO_MANAGER'
    const response = await PATCH(request('PATCH', { slug: 'existing', metaTitle: '' }))
    expect(response.status).toBe(422)
    expect(state.update).not.toHaveBeenCalled()
  })
  it('rejects removal of the meta description without a status transition', async () => {
    state.role = 'SEO_MANAGER'
    const response = await PATCH(request('PATCH', { slug: 'existing', metaDescription: '' }))
    expect(response.status).toBe(422)
    expect(state.update).not.toHaveBeenCalled()
  })
  it('retains imported schema and social fields when changing only cover alt text', async () => {
    state.role = 'EDITOR'
    const response = await PATCH(request('PATCH', { slug: 'existing', coverAlt: 'Updated article illustration' }))
    expect(response.status).toBe(200)
    expect(state.update).toHaveBeenCalledWith('existing', expect.objectContaining({ seoData: expect.objectContaining({ schema: { '@type': 'Article' }, openGraph: { imageAlt: 'Updated article illustration', title: 'Original social title' } }) }))
  })

})
