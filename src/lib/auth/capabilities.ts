/**
 * Capability-based authorization (server side).
 *
 * The role matrix itself lives in `./capability-matrix` (pure, also used by
 * the Studio UI). API routes call `requireCan(request, '<capability>')` instead
 * of listing roles; the role is re-read from the database on every request.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { requireRole, type AuthResult } from './rbac'
import { can, rolesFor, type Capability } from './capability-matrix'
import type { Role } from './types'

export * from './capability-matrix'

export async function requireCan(request: NextRequest, capability: Capability): Promise<AuthResult> {
  return requireRole(request, [...rolesFor(capability)])
}

/**
 * Second check inside a handler that already authenticated the user, for an
 * action that needs more than the route's base capability (e.g. publishing
 * through the save endpoint). Returns a 403 response, or null when allowed.
 */
export function forbidUnless(role: Role, capability: Capability): NextResponse | null {
  if (can(role, capability)) return null
  return NextResponse.json(
    {
      error: 'Akses ditolak.',
      code: 'forbidden',
      message: `Peran '${role}' tidak memiliki wewenang untuk tindakan ini.`,
      requiredRoles: rolesFor(capability),
    },
    { status: 403 },
  )
}
