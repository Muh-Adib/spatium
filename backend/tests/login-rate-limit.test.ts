import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { loginRateLimit } from '../src/proxy'
describe('Credentials endpoint throttling', () => {
  it('limits repeated attempts and expires the window', () => {
    const request = new NextRequest('http://localhost/api/auth/callback/credentials', { method: 'POST', headers: { 'x-real-ip': 'test-rate-limit-fixture' } })
    for (let attempt = 0; attempt < 20; attempt++) expect(loginRateLimit(request, 1_000)).toBeNull()
    expect(loginRateLimit(request, 1_000)).toBe(900)
    expect(loginRateLimit(request, 901_001)).toBeNull()
  })
  it('does not throttle session reads or unrelated endpoints', () => {
    const request = new NextRequest('http://localhost/api/auth/session')
    expect(loginRateLimit(request, 1_000)).toBeNull()
  })
})
