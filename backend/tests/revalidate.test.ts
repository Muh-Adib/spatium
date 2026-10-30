import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../src/app/api/revalidate/route'
import { revalidateCatalog } from '../src/lib/cache/revalidate'

const revalidatePathMock = vi.fn()
vi.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
  revalidateTag: vi.fn(),
}))

describe('P0.9 Revalidation Security & Timing-Safe Endpoint', () => {
  const TEST_SECRET = 'test-super-secret-revalidate-token-12345'

  beforeEach(() => {
    process.env.REVALIDATE_SECRET = TEST_SECRET
    revalidatePathMock.mockClear()
  })

  it('returns 401 when request is sent without secret', async () => {
    const req = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ tag: 'articles' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when wrong secret is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'x-revalidate-secret': 'wrong-secret-token',
      },
      body: JSON.stringify({ tag: 'articles' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 200 and revalidates when valid secret is provided via header', async () => {
    const req = new NextRequest('http://localhost:3000/api/revalidate', {
      method: 'POST',
      headers: {
        'x-revalidate-secret': TEST_SECRET,
      },
      body: JSON.stringify({
        tag: 'articles',
        path: '/artikel',
        entity: 'article',
        slug: 'test-article',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.revalidatedTags).toContain('articles')
    expect(json.revalidatedTags).toContain('article-test-article')
  })
})

describe('L2-T6 Unified revalidateCatalog Contract (K-6)', () => {
  beforeEach(() => {
    revalidatePathMock.mockClear()
  })

  it('calls revalidatePath with the correct paths when a category is modified', async () => {
    await revalidateCatalog('category', 'software-product', ['website-development'])

    expect(revalidatePathMock).toHaveBeenCalledWith('/layanan')
    expect(revalidatePathMock).toHaveBeenCalledWith('/layanan/software-product')
    expect(revalidatePathMock).toHaveBeenCalledWith('/layanan/website-development')
    expect(revalidatePathMock).toHaveBeenCalledWith('/')
    expect(revalidatePathMock).toHaveBeenCalledWith('/sitemap.xml')
  })

  it('calls revalidatePath with the correct paths when a service is modified', async () => {
    await revalidateCatalog('service', 'custom-web-application')

    expect(revalidatePathMock).toHaveBeenCalledWith('/layanan')
    expect(revalidatePathMock).toHaveBeenCalledWith('/layanan/custom-web-application')
    expect(revalidatePathMock).toHaveBeenCalledWith('/')
    expect(revalidatePathMock).toHaveBeenCalledWith('/sitemap.xml')
  })

  it('calls revalidatePath with the correct paths when a solution is modified', async () => {
    await revalidateCatalog('solution', 'ecommerce-platform')

    expect(revalidatePathMock).toHaveBeenCalledWith('/solusi')
    expect(revalidatePathMock).toHaveBeenCalledWith('/solusi/ecommerce-platform')
    expect(revalidatePathMock).toHaveBeenCalledWith('/')
    expect(revalidatePathMock).toHaveBeenCalledWith('/sitemap.xml')
  })
})
