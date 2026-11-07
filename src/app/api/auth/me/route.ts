import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { capabilitiesFor } from '@/lib/auth/capabilities'

export const dynamic = 'force-dynamic'

/**
 * Current Studio user's role and capabilities. The role is re-read from the
 * database (requireUser → resolveCurrentRole), so the UI reflects a promotion
 * or demotion without signing in again. Hiding actions is a convenience; every
 * mutation route still enforces the same capability on the server.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  return NextResponse.json(
    { role: auth.user.role, capabilities: capabilitiesFor(auth.user.role) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
