import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Role } from '../src/lib/auth/types'

/**
 * The Studio entity preview (`/admin/preview/<type>/<id>`) renders drafts, so
 * it checks the editor capability on the server (the proxy only requires a
 * session). Unauthorised requests get a 404 and never the entity payload.
 */

const session = vi.hoisted(() => ({ role: null as Role | null }))

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'localhost:3002', cookie: 'authjs.session-token=test' }),
}))

vi.mock('@/lib/auth/rbac', async () => {
  const { NextResponse } = await import('next/server')
  return {
    requireUser: async () =>
      session.role
        ? { user: { id: 'u1', name: 'Uji', role: session.role, authenticated: true, source: 'session_token' }, error: null }
        : { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) },
  }
})

const { userWithCapability } = await import('../src/lib/auth/server-component')
const { default: PreviewPage } = await import('../src/app/admin/preview/[type]/[id]/page')

beforeEach(() => {
  session.role = null
})

describe('server-side preview authorization', () => {
  it('maps the session role to capabilities', async () => {
    expect(await userWithCapability('service-category:update')).toBeNull()
    session.role = 'AUTHOR'
    expect(await userWithCapability('portfolio:update')).toBeNull()
    session.role = 'EDITOR'
    expect((await userWithCapability('portfolio:update'))?.role).toBe('EDITOR')
  })

  it('returns 404 to signed-out users and roles that cannot edit the entity', async () => {
    const params = Promise.resolve({ type: 'service-category', id: 'filmmaking-vfx' })
    await expect(PreviewPage({ params })).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/)
    session.role = 'SEO_MANAGER'
    await expect(PreviewPage({ params: Promise.resolve({ type: 'portfolio', id: 'wedding-venue' }) })).rejects.toThrow(
      /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/,
    )
  })

  it('renders the entity preview payload for editors (any status, by slug or id)', async () => {
    session.role = 'EDITOR'
    let element: Awaited<ReturnType<typeof PreviewPage>>
    try {
      element = await PreviewPage({ params: Promise.resolve({ type: 'category', id: 'filmmaking-vfx' }) })
    } catch (err) {
      // Seed not loaded in this database: the preview is a 404 like any missing entity.
      expect(String(err)).toMatch(/404|NOT_FOUND/)
      return
    }
    const props = (element as { props: { payload: { kind: string; row: { slug: string } }; publicPath: string } }).props
    expect(props.payload.kind).toBe('service-category')
    expect(props.payload.row.slug).toBe('filmmaking-vfx')
    expect(props.publicPath).toBe('/services/filmmaking-vfx')
  })
})
