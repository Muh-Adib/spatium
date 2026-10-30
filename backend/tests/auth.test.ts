import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: { User: { where: () => ({ first: async () => null }) } } } } }))
import { validateCredentials, getValidatedAuthSecret } from '../src/lib/auth/credentials'
import { hashPasswordScrypt } from '../src/lib/auth/crypto'

describe('Authentication Hardening (P0.1)', () => {
  const originalEnv = { ...process.env }
  let validBootstrapHash = ''

  beforeEach(async () => {
    validBootstrapHash = await hashPasswordScrypt('SuperSecurePass2026!#')
    process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@segiatech.com'
    process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH = validBootstrapHash
    delete process.env.REQUIRE_STRONG_AUTH_SECRET
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('rejects random emails that are not configured in system', async () => {
    const result = await validateCredentials('attacker@hacker.io', 'anypassword')
    expect(result).toBeNull()
  })

  it('rejects empty or missing password', async () => {
    const res1 = await validateCredentials('admin@segiatech.com', '')
    expect(res1).toBeNull()

    const res2 = await validateCredentials('admin@segiatech.com', undefined)
    expect(res2).toBeNull()
  })

  it('rejects incorrect password for bootstrap admin', async () => {
    const result = await validateCredentials('admin@segiatech.com', 'wrongpassword123')
    expect(result).toBeNull()
  })

  it('authenticates valid bootstrap admin credentials via scrypt', async () => {
    const result = await validateCredentials('admin@segiatech.com', 'SuperSecurePass2026!#')
    expect(result).not.toBeNull()
    expect(result?.email).toBe('admin@segiatech.com')
    expect(result?.role).toBe('SUPER_ADMIN')
    expect(result?.id).toBe('bootstrap-super-admin')
  })

  it('throws fatal error in production when AUTH_SECRET is missing or less than 32 characters', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET

    expect(() => getValidatedAuthSecret()).toThrowError(/FATAL: AUTH_SECRET must be set and at least 32 characters long/)

    process.env.AUTH_SECRET = 'short-secret'
    expect(() => getValidatedAuthSecret()).toThrowError(/FATAL: AUTH_SECRET must be set and at least 32 characters long/)

    process.env.AUTH_SECRET = 'a'.repeat(32)
    expect(getValidatedAuthSecret()).toBe('a'.repeat(32))
  })

  it('allows placeholder secret during build phase without production credentials', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    process.env.NEXT_PHASE = 'phase-production-build'
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET

    const secret = getValidatedAuthSecret()
    expect(secret).toBe('build-phase-placeholder-secret-at-least-32-chars-long')
    expect(secret.length).toBeGreaterThanOrEqual(32)
  })

  it('rejects placeholder secret at runtime even if npm_lifecycle_event is build', () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.NEXT_PHASE
    process.env.npm_lifecycle_event = 'build'
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET

    expect(() => getValidatedAuthSecret()).toThrowError(/FATAL: AUTH_SECRET must be set and at least 32 characters long/)
  })
})
