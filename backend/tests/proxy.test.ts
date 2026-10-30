import { describe, it, expect } from 'vitest'
import { isPublicApi, proxy } from '../src/proxy'
import { NextRequest } from 'next/server'

describe('Proxy Auth Gate & PUBLIC_API Rules (P0.2)', () => {
  it('correctly identifies whitelisted public endpoints', () => {
    expect(isPublicApi('/api/auth/signin', 'POST')).toBe(true)
    expect(isPublicApi('/api/auth/session', 'GET')).toBe(true)
    expect(isPublicApi('/api/auth/csrf', 'GET')).toBe(true)
    expect(isPublicApi('/api/vitals', 'POST')).toBe(true)
    expect(isPublicApi('/api/indexnow/key', 'GET')).toBe(true)
    expect(isPublicApi('/api/revalidate', 'POST')).toBe(true)
    expect(isPublicApi('/api/navigation', 'GET')).toBe(true)
    expect(isPublicApi('/api/theme/tokens', 'GET')).toBe(true)
    expect(isPublicApi('/api/locations', 'GET')).toBe(true)
  })

  it('rejects unallowed methods on public endpoints', () => {
    expect(isPublicApi('/api/vitals', 'GET')).toBe(false)
    expect(isPublicApi('/api/indexnow/key', 'POST')).toBe(false)
    expect(isPublicApi('/api/revalidate', 'GET')).toBe(false)
  })

  it('rejects protected endpoints that are not in PUBLIC_API whitelist', () => {
    expect(isPublicApi('/api/articles', 'GET')).toBe(false)
    expect(isPublicApi('/api/articles', 'POST')).toBe(false)
    expect(isPublicApi('/api/import/reset', 'POST')).toBe(false)
    expect(isPublicApi('/api/settings', 'POST')).toBe(false)
    expect(isPublicApi('/api/upload', 'POST')).toBe(false)
    expect(isPublicApi('/api/mcp', 'POST')).toBe(false)
    expect(isPublicApi('/api/gsc', 'GET')).toBe(false)
  })

  it('returns 401 for protected API routes when request lacks session cookie', async () => {
    const protectedRoutes = [
      '/api/import/reset',
      '/api/settings',
      '/api/upload',
      '/api/media',
      '/api/articles',
      '/api/mcp',
      '/api/ai/draft',
    ]

    for (const path of protectedRoutes) {
      const req = new NextRequest(`http://localhost:3000${path}`, {
        method: 'POST',
      })
      const res = await proxy(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    }
  })

  it('redirects /admin to /admin/login when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/admin', {
      method: 'GET',
    })
    const res = await proxy(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/admin/login')
  })

  it('allows access to /admin/login without session', async () => {
    const req = new NextRequest('http://localhost:3000/admin/login', {
      method: 'GET',
    })
    const res = await proxy(req)
    expect(res.status).toBe(200)
  })

  it('allows API requests with a valid 32+ char Bearer token (MCP/Automation)', async () => {
    const validSecret = 'x'.repeat(32)
    process.env.API_BEARER_TOKEN = validSecret

    const req = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${validSecret}`,
      },
    })
    const res = await proxy(req)
    expect(res.status).toBe(200)
  })

  it('rejects API requests with invalid or short Bearer tokens', async () => {
    process.env.API_BEARER_TOKEN = 'x'.repeat(32)

    // Wrong token
    const reqWrong = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret-token-attempt-xyz-12345',
      },
    })
    const resWrong = await proxy(reqWrong)
    expect(resWrong.status).toBe(401)

    // Token configured is too short (< 32 chars)
    process.env.API_BEARER_TOKEN = 'short'
    const reqShort = new NextRequest('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        authorization: 'Bearer short',
      },
    })
    const resShort = await proxy(reqShort)
    expect(resShort.status).toBe(401)
  })
})

describe('Proxy security headers and mutation boundaries', () => {
  it('adds media framing policy and forbids object embedding', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/'))
    expect(response.headers.get('content-security-policy')).toContain('https://www.youtube.com')
    expect(response.headers.get('content-security-policy')).toContain("object-src 'none'")
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })
  it('rejects cross-origin protected API mutations', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/api/articles', { method: 'POST', headers: { origin: 'https://attacker.example' } }))
    expect(response.status).toBe(403)
  })
  it('does not trust a caller supplied forwarded host for origin checks', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/api/articles', { method: 'POST', headers: { host: 'localhost:3000', origin: 'http://attacker.example', 'x-forwarded-host': 'attacker.example' } }))
    expect(response.status).toBe(403)
  })

})
