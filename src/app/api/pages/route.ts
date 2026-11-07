import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { requireCan } from '@/lib/auth/capabilities'
import { createPage, listPages } from '@/lib/pages/repository'
import { pageInputSchema } from '@/lib/pages/page-schema'
import { matchesPageQuery, pageListQuerySchema } from '@/lib/pages/http'
import { pageErrorResponse, readJsonBody } from '@/lib/pages/route-helpers'

/** GET /api/pages?status=&q= — page summaries for the Studio list (newest first). */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const query = pageListQuerySchema.safeParse({
    status: request.nextUrl.searchParams.get('status') || undefined,
    q: request.nextUrl.searchParams.get('q') || undefined,
  })
  if (!query.success) {
    return NextResponse.json({ error: 'Parameter filter tidak valid.', issues: query.error.issues.map((i) => i.message) }, { status: 400 })
  }

  try {
    const pages = await listPages({ status: query.data.status })
    return NextResponse.json({ pages: pages.filter((p) => matchesPageQuery(p, query.data.q)) })
  } catch (err) {
    return pageErrorResponse(err, 'list')
  }
}

/** POST /api/pages — create a draft page. Body: PageInput. */
export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'page:create')
  if (auth.error) return auth.error

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = pageInputSchema.safeParse(json.body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Data halaman tidak valid.',
        code: 'invalid',
        issues: parsed.error.issues.map((i) => (i.path.length ? `${i.path.map(String).join('.')}: ${i.message}` : i.message)),
      },
      { status: 422 },
    )
  }

  try {
    const page = await createPage(parsed.data, auth.user.email ?? auth.user.name)
    return NextResponse.json({ page }, { status: 201 })
  } catch (err) {
    return pageErrorResponse(err, 'create')
  }
}
