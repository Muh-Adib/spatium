'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { Role, ROLE_PERMISSIONS, RolePermissions } from '@/lib/auth/types'
import { can as roleCan, type Capability } from '@/lib/auth/capability-matrix'

interface AuthContextValue {
  userId: string
  role: Role
  actorName: string
  email: string
  permissions: RolePermissions
  /** Whether the current user holds `capability` (same matrix the API enforces). */
  can: (capability: Capability) => boolean
  getAuthHeaders: () => Record<string, string>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const DENIED_PERMISSIONS = Object.fromEntries(
  Object.keys(ROLE_PERMISSIONS.AUTHOR).map((permission) => [permission, false]),
) as unknown as RolePermissions

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthConsumer({ children }: { children: React.ReactNode }) {
  const { data: sessionData, status } = useSession()
  const session = sessionData as unknown as {
    user?: { role?: Role; id?: string; name?: string | null; email?: string | null }
  } | null

  const sessionRole = session?.user?.role
  const sessionUserId = session?.user?.id
  const isRole = (value: unknown): value is Role => typeof value === 'string' && Object.hasOwn(ROLE_PERMISSIONS, value)

  // The JWT role is only a hint: the server re-reads the role from the database
  // on every API call. Fetch that fresh role once per session so the UI shows
  // the same actions the API will accept (e.g. after a demotion).
  const [freshRole, setFreshRole] = useState<{ userId: string; role: Role } | null>(null)
  useEffect(() => {
    if (status !== 'authenticated' || !sessionUserId) return
    const controller = new AbortController()
    fetch('/api/auth/me', { signal: controller.signal, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          console.warn(`[AuthContext] /api/auth/me returned ${res.status}`)
          return
        }
        const body: unknown = await res.json()
        const role = body && typeof body === 'object' && 'role' in body ? body.role : undefined
        if (isRole(role)) setFreshRole({ userId: String(sessionUserId), role })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.warn('[AuthContext] Could not refresh the current role:', err)
      })
    return () => controller.abort()
  }, [status, sessionUserId])

  const resolvedRole = freshRole && freshRole.userId === String(sessionUserId) ? freshRole.role : sessionRole
  const hasValidatedRole = status === 'authenticated' && isRole(resolvedRole)
  const role: Role = hasValidatedRole && isRole(resolvedRole) ? resolvedRole : 'AUTHOR'
  const actorName = hasValidatedRole ? session?.user?.name || '' : ''
  const email = hasValidatedRole ? session?.user?.email || '' : ''
  const userId = hasValidatedRole ? String(session?.user?.id || 'usr_default_admin') : ''

  const logout = async () => {
    try {
      localStorage.removeItem('spatium_user_role')
      localStorage.removeItem('spatium_actor_name')
      await nextAuthSignOut({ callbackUrl: '/pawon' })
    } catch {
      window.location.href = '/pawon'
    }
  }

  const permissions = hasValidatedRole ? ROLE_PERMISSIONS[role] : DENIED_PERMISSIONS
  const can = useCallback((capability: Capability) => hasValidatedRole && roleCan(role, capability), [hasValidatedRole, role])
  // Session cookies identify the actor; client-provided persona headers are not credentials.
  const getAuthHeaders = (): Record<string, string> => ({})

  return (
    <AuthContext.Provider
      value={{
        userId,
        role,
        actorName,
        email,
        permissions,
        can,
        getAuthHeaders,
        logout,
        isAuthenticated: hasValidatedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthConsumer>{children}</AuthConsumer>
    </SessionProvider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requires AuthProvider')

  return context
}
