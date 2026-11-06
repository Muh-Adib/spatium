import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { listPageRevisions } from '@/lib/pages/repository'
import { pageErrorResponse, parsePageId } from '@/lib/pages/route-helpers'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/pages/:id/revisions — newest-first history (who, what, when). */
export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const id = parsePageId((await ctx.params).id)
  if (!id.ok) return id.response

  try {
    return NextResponse.json({ revisions: await listPageRevisions(id.id, 30) })
  } catch (err) {
    return pageErrorResponse(err, 'revisions')
  }
}
