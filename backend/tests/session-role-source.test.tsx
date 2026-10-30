import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ status: 'authenticated', role: 'EDITOR' }))
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ status: state.status, data: { user: { name: 'Account Editor', email: 'editor@fixture.invalid', role: state.role } } }),
  signOut: vi.fn(),
}))
import { AuthProvider, useAuth } from '../src/lib/auth/AuthContext'
function Probe() {
  const auth = useAuth()
  return <span>{JSON.stringify({ role: auth.role, permissions: auth.permissions, authenticated: auth.isAuthenticated, hasRoleSetter: 'setRole' in auth, headers: auth.getAuthHeaders() })}</span>
}
const render = () => renderToStaticMarkup(<AuthProvider><Probe /></AuthProvider>)
beforeEach(() => { state.status = 'authenticated'; state.role = 'EDITOR' })
describe('Account roles, without local personas', () => {
  it('uses the session role and exposes no role-switch operation or identity headers', () => {
    const html = render()
    expect(html).toContain('&quot;role&quot;:&quot;EDITOR&quot;')
    expect(html).toContain('&quot;hasRoleSetter&quot;:false')
    expect(html).toContain('&quot;headers&quot;:{}')
    expect(html).toContain('&quot;authenticated&quot;:true')
  })
  it.each(['loading', 'unauthenticated'])('denies every permission while %s', (status) => {
    state.status = status
    const html = render()
    expect(html).not.toContain(':true')
    expect(html).toContain('&quot;canPublish&quot;:false')
    expect(html).not.toContain('SUPER_ADMIN')
  })
  it('fails closed on an unknown role in the session', () => {
    state.role = 'UNKNOWN'
    expect(render()).not.toContain(':true')
  })
  it('does not silently grant admin permissions outside its provider', () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow('AuthProvider')
  })
})
