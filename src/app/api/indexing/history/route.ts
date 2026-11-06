import { NextRequest, NextResponse } from 'next/server'
import { requireRole, type Role } from '@/lib/auth/rbac'
import { SEO_TOOL_ROLES } from '@/lib/seo/access'
import { indexingHistoryQuerySchema } from '@/lib/validation/api-schemas'
import { getIndexingHistory } from '@/lib/db/indexing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ROLES: Role[] = SEO_TOOL_ROLES

function safeJsonParse(payload: string | null | undefined) {
  if (!payload) return null
  try {
    return JSON.parse(payload)
  } catch {
    return payload
  }
}

export async function GET(request: NextRequest) {
  // 1. Auth & RBAC Gate
  const auth = await requireRole(request, ALLOWED_ROLES)
  if (auth.error) {
    return auth.error
  }

  // 2. Parse & Validate Query Parameters
  const queryObj = Object.fromEntries(request.nextUrl.searchParams.entries())
  const validation = indexingHistoryQuerySchema.safeParse(queryObj)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: 'Parameter query history tidak valid.',
        issues: validation.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
      { status: 400 }
    )
  }

  const { limit, offset, provider, status, search } = validation.data

  // 3. Query Database Persistence Layer
  const result = await getIndexingHistory({
    limit,
    offset,
    provider: provider === 'all' ? undefined : provider,
    status,
    search,
  })

  const total = result.meta.total

  return NextResponse.json({
    data: result.data.map((r) => ({
      id: r.id,
      url: r.url,
      entityType: r.entityType,
      entityId: r.entityId,
      provider: r.provider,
      status: r.status,
      httpStatus: r.httpStatus,
      responsePayload: safeJsonParse(r.responsePayload),
      trigger: r.trigger,
      actor: r.actor,
      submittedAt: r.submittedAt,
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + result.data.length < total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
