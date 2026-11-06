import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/rbac'
import { getPageById, setPageStatus } from '@/lib/pages/repository'
import { PAGE_ROLES, pageStatusBodySchema, pathsToRevalidate, rolesForTransition } from '@/lib/pages/http'
import { pageErrorResponse, parsePageId, readJsonBody, revalidatePublicPaths } from '@/lib/pages/route-helpers'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/pages/:id/status — body `{ status }`. Publishing runs the
 * publication gate (422 with `issues` / `blockIssues` when it fails).
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, [...PAGE_ROLES.edit])
  if (auth.error) return auth.error
  const id = parsePageId((await ctx.params).id)
  if (!id.ok) return id.response

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = pageStatusBodySchema.safeParse(json.body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Status tidak valid. Gunakan draft, in_review, published, atau archived.', code: 'invalid' },
      { status: 422 },
    )
  }

  try {
    const before = await getPageById(id.id)
    if (!before) return NextResponse.json({ error: 'Halaman tidak ditemukan.', code: 'not_found' }, { status: 404 })
    if (!rolesForTransition(before.status, parsed.data.status).includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Peran Anda tidak dapat menerbitkan, menarik, atau mengarsipkan halaman.', code: 'forbidden' },
        { status: 403 },
      )
    }
    const page = await setPageStatus(id.id, parsed.data.status, auth.user.email ?? auth.user.name)
    revalidatePublicPaths(pathsToRevalidate(before, page))
    return NextResponse.json({ page })
  } catch (err) {
    return pageErrorResponse(err, 'status')
  }
}
