import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getValidatedAuthSecret, validateBearerToken } from './secret'
import { resolveCurrentRole } from './credentials'

export * from './types'
import type { Role } from './types'

export interface AuthenticatedUser {
  id: string
  name: string
  email?: string
  role: Role
  authenticated: boolean
  source: 'session_token' | 'bearer_token'
}

export type AuthResult =
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: NextResponse }

/**
 * Validates session user on server side.
 * Never trusts client headers (x-user-role / x-actor-name) for identity or role.
 */
export async function requireUser(request: NextRequest): Promise<AuthResult> {
  // 1. Check Bearer Token if present (e.g. CLI or internal automation)
  const authHeader = request.headers.get('authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    if (validateBearerToken(token)) {
      return {
        user: {
          id: 'usr_api_token',
          name: 'API Automation Token',
          role: 'SUPER_ADMIN',
          authenticated: true,
          source: 'bearer_token',
        },
        error: null,
      }
    }
  }

  // 2. Read NextAuth session JWT
  try {
    const token = await getToken({
      req: request,
      secret: getValidatedAuthSecret(),
      secureCookie: request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
    })

    if (token && token.id) {
      // The JWT role is only a hint: the account's current DB role decides, so a
      // demoted or deleted user loses access on their next request.
      const role = await resolveCurrentRole(String(token.id), token.email ? String(token.email) : undefined)
      if (!role) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Unauthorized', message: 'Akun tidak lagi aktif. Silakan masuk kembali.' },
            { status: 401 }
          ),
        }
      }
      return {
        user: {
          id: String(token.id),
          name: String(token.name || token.email || 'Studio User'),
          email: token.email ? String(token.email) : undefined,
          role,
          authenticated: true,
          source: 'session_token',
        },
        error: null,
      }
    }
  } catch (err) {
    console.warn('[requireUser] Error parsing session token:', err)
  }

  return {
    user: null,
    error: NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required. Please log in to continue.',
      },
      { status: 401 }
    ),
  }
}

/**
 * Validates that the authenticated user possesses one of the allowed roles.
 */
export async function requireRole(request: NextRequest, allowedRoles: Role[]): Promise<AuthResult> {
  const auth = await requireUser(request)
  if (auth.error) {
    return auth
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        {
          error: 'Akses ditolak.',
          code: 'forbidden',
          message: `Peran '${auth.user.role}' tidak memiliki wewenang untuk tindakan ini.`,
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
    }
  }

  return auth
}

/**
 * Backward compatibility adapter delegating to requireUser.
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const res = await requireUser(request)
  return res.user
}
