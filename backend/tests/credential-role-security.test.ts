import { beforeEach, describe, it, expect, vi } from 'vitest'
const state = vi.hoisted(() => ({ role: 'media_manager' }))
vi.mock('@/lib/db/prisma', () => ({ prisma: { orm: { public: { User: { where: () => ({ first: async () => ({ id: 'test-user', name: 'Test', email: 'test@example.test', role: state.role, passwordHash: 'mock-hash' }) }) } } } } }))
vi.mock('../src/lib/auth/crypto', () => ({ verifyPasswordScrypt: async () => true }))
import { validateCredentials } from '../src/lib/auth/credentials'
beforeEach(() => { state.role = 'media_manager' })
describe('Credential role boundaries', () => {
  it('retains media manager permissions instead of granting editor access', async () => {
    expect((await validateCredentials('test@example.test', 'test'))?.role).toBe('MEDIA_MANAGER')
  })
  it('refuses unknown persisted roles', async () => {
    state.role = 'unknown'
    expect(await validateCredentials('test@example.test', 'test')).toBeNull()
  })
})
