import 'server-only'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { requireUser, type AuthenticatedUser } from './rbac'
import { can, type Capability } from './capability-matrix'

/**
 * Capability check for Server Components (pages), which receive no request
 * object: the incoming headers (session cookie, forwarded protocol) are
 * wrapped in a NextRequest and checked by the same `requireUser` as the API
 * routes, so the role is re-read from the database. Returns the user, or null
 * when signed out or not allowed.
 */
export async function userWithCapability(capability: Capability): Promise<AuthenticatedUser | null> {
  const incoming = await headers()
  const host = incoming.get('x-forwarded-host') ?? incoming.get('host') ?? 'localhost'
  const proto = incoming.get('x-forwarded-proto') ?? 'http'
  const request = new NextRequest(`${proto}://${host}/admin`, { headers: new Headers(incoming) })
  const auth = await requireUser(request)
  if (auth.error) return null
  return can(auth.user.role, capability) ? auth.user : null
}
