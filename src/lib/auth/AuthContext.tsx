'use client'

import React, { createContext, useContext } from 'react'
import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { Role, ROLE_PERMISSIONS, RolePermissions } from '@/lib/auth/types'

interface AuthContextValue {
  userId: string
  role: Role
  actorName: string
  email: string
  permissions: RolePermissions
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

  const sessionRole = session?.user?.role as Role | undefined
  const hasValidatedRole = status === 'authenticated' && !!sessionRole && Object.hasOwn(ROLE_PERMISSIONS, sessionRole)
  const role: Role = hasValidatedRole ? sessionRole! : 'AUTHOR'
  const actorName = hasValidatedRole ? session?.user?.name || '' : ''
  const email = hasValidatedRole ? session?.user?.email || '' : ''
  const userId = hasValidatedRole ? String(session?.user?.id || 'usr_default_admin') : ''

  const logout = async () => {
    try {
      localStorage.removeItem('unimasi_user_role')
      localStorage.removeItem('unimasi_actor_name')
      await nextAuthSignOut({ callbackUrl: '/admin/login' })
    } catch {
      window.location.href = '/admin/login'
    }
  }

  const permissions = hasValidatedRole ? ROLE_PERMISSIONS[role] : DENIED_PERMISSIONS
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
