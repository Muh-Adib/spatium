import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let currentRole = 'AUTHOR'

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => ({
    id: 'usr_test_123',
    name: 'Test User',
    email: 'test@segiatech.com',
    role: currentRole,
  })),
}))

describe('L2-T3 Catalog Write Validation & Capability Guard', () => {
  beforeEach(() => {
    currentRole = 'AUTHOR'
  })

  it('rejects AUTHOR with 403 on POST /api/service-categories', async () => {
    const { POST } = await import('../src/app/api/service-categories/route')
    const req = new NextRequest('http://localhost:3000/api/service-categories', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Dept', slug: 'test-dept' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('rejects AUTHOR with 403 on POST /api/solutions', async () => {
    const { POST } = await import('../src/app/api/solutions/route')
    const req = new NextRequest('http://localhost:3000/api/solutions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Sol', slug: 'test-sol' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects AUTHOR with 403 on POST /api/templates', async () => {
    const { POST } = await import('../src/app/api/templates/route')
    const req = new NextRequest('http://localhost:3000/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Template', targetType: 'service', blocks: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects EDITOR with 422 and issues when invalid blocks are provided to /api/services', async () => {
    currentRole = 'EDITOR'
    const { POST } = await import('../src/app/api/services/route')
    const req = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Valid Service Name',
        slug: 'valid-service-name',
        blocks: [
          {
            type: 'invalid-unknown-block-type',
            someField: 'garbage',
          },
        ],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Validasi blok katalog gagal')
    expect(Array.isArray(json.issues)).toBe(true)
    expect(json.issues.length).toBeGreaterThan(0)
  })

  it('rejects EDITOR with 422 when invalid blocks are provided to /api/service-categories', async () => {
    currentRole = 'EDITOR'
    const { POST } = await import('../src/app/api/service-categories/route')
    const req = new NextRequest('http://localhost:3000/api/service-categories', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Valid Category Title',
        slug: 'valid-category-slug',
        blocks: 'not-an-array-of-blocks',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.issues).toBeDefined()
  })

  it('rejects EDITOR with 422 when invalid blocks are provided to /api/solutions', async () => {
    currentRole = 'EDITOR'
    const { POST } = await import('../src/app/api/solutions/route')
    const req = new NextRequest('http://localhost:3000/api/solutions', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Valid Solution Title',
        slug: 'valid-solution-slug',
        blocks: [
          {
            type: 'hero-service',
            // Missing title or name
          },
        ],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.issues).toBeDefined()
  })

  it('rejects oversized payload with 413 on /api/services', async () => {
    currentRole = 'EDITOR'
    const { POST } = await import('../src/app/api/services/route')
    const req = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      headers: {
        'content-length': String(2 * 1024 * 1024), // 2MB
      },
      body: JSON.stringify({
        name: 'Large Service',
        slug: 'large-service',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(413)
    const json = await res.json()
    expect(json.error).toContain('Ukuran payload melebihi batas')
  })
})
