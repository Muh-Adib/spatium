import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock next-auth getToken to return an AUTHOR role user
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => ({
    id: 'usr_author_123',
    name: 'Penulis Konten',
    email: 'penulis@segiatech.com',
    role: 'AUTHOR',
  })),
}))

describe('Role Enforcement Matrix on Non-Article Mutations (P0-R.2)', () => {
  it('rejects AUTHOR with 403 on POST /api/services', async () => {
    const { POST } = await import('../src/app/api/services/route')
    const req = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      body: JSON.stringify({ name: 'Service Test', slug: 'service-test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Forbidden')
  })

  it('rejects AUTHOR with 403 on POST /api/portfolio', async () => {
    const { POST } = await import('../src/app/api/portfolio/route')
    const req = new NextRequest('http://localhost:3000/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ title: 'Portfolio Test', slug: 'portfolio-test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Forbidden')
  })

  it('rejects AUTHOR with 403 on POST /api/cta', async () => {
    const { POST } = await import('../src/app/api/cta/route')
    const req = new NextRequest('http://localhost:3000/api/cta', {
      method: 'POST',
      body: JSON.stringify({ name: 'CTA Test', slug: 'cta-test', content: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Forbidden')
  })

  it('rejects AUTHOR with 403 on POST /api/import/wp-single', async () => {
    const { POST } = await import('../src/app/api/import/wp-single/route')
    const req = new NextRequest('http://localhost:3000/api/import/wp-single', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://segiatech.com/post' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/import/wp-json', async () => {
    const { POST } = await import('../src/app/api/import/wp-json/route')
    const req = new NextRequest('http://localhost:3000/api/import/wp-json', {
      method: 'POST',
      body: JSON.stringify({ siteUrl: 'https://segiatech.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/system/status', async () => {
    const { POST } = await import('../src/app/api/system/status/route')
    const req = new NextRequest('http://localhost:3000/api/system/status', {
      method: 'POST',
      body: JSON.stringify({ action: 'sync' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/keywords', async () => {
    const { POST } = await import('../src/app/api/keywords/route')
    const req = new NextRequest('http://localhost:3000/api/keywords', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/indexnow', async () => {
    const { POST } = await import('../src/app/api/indexnow/route')
    const req = new NextRequest('http://localhost:3000/api/indexnow', {
      method: 'POST',
      body: JSON.stringify({ urls: ['https://segiatech.com/test'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/ai/test-key', async () => {
    const { POST } = await import('../src/app/api/ai/test-key/route')
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', apiKey: 'fake-key' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/ai/tools', async () => {
    const { POST } = await import('../src/app/api/ai/tools/route')
    const req = new NextRequest('http://localhost:3000/api/ai/tools', {
      method: 'POST',
      body: JSON.stringify({ toolId: 'search_articles' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on PATCH /api/articles when article is already published', async () => {
    const { PATCH } = await import('../src/app/api/articles/route')
    const req = new NextRequest('http://localhost:3000/api/articles', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: 'ai-apps-production-terpercaya-jakarta',
        title: 'Tampered Title',
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toMatch(/tidak diizinkan mengubah artikel yang sudah terbit/i)
  })

  it('rejects AUTHOR with 403 on PATCH /api/articles when article belongs to another author', async () => {
    const { PATCH } = await import('../src/app/api/articles/route')
    const req = new NextRequest('http://localhost:3000/api/articles', {
      method: 'PATCH',
      body: JSON.stringify({
        slug: 'ai-apps-production-terpercaya-jakarta',
        status: 'draft',
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })
})
