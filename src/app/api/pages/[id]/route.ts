import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { can, requireCan } from '@/lib/auth/capabilities'
import { deletePage, getPageById, publicationIssues, updatePage } from '@/lib/pages/repository'
import { pagePatchSchema } from '@/lib/pages/page-schema'
import { pathsToRevalidate } from '@/lib/pages/http'
import { pageErrorResponse, parsePageId, readJsonBody, revalidatePublicPaths } from '@/lib/pages/route-helpers'

type Ctx = { params: Promise<{ id: string }> }

const notFound = () => NextResponse.json({ error: 'Halaman tidak ditemukan.', code: 'not_found' }, { status: 404 })

/** GET /api/pages/:id — full page plus its current publication-gate result. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const id = parsePageId((await ctx.params).id)
  if (!id.ok) return id.response

  try {
    const page = await getPageById(id.id)
    if (!page) return notFound()
    return NextResponse.json({ page, gate: publicationIssues(page) })
  } catch (err) {
    return pageErrorResponse(err, 'get')
  }
}

/**
 * PATCH /api/pages/:id — partial update. Body: PagePatch (send
 * `expectedUpdatedAt` to get 409 instead of overwriting someone else's edit).
 * Editing a published page is a publishing decision, so it needs a publisher role.
 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireCan(request, 'page:update')
  if (auth.error) return auth.error
  const id = parsePageId((await ctx.params).id)
  if (!id.ok) return id.response

  const json = await readJsonBody(request)
  if (!json.ok) return json.response
  const parsed = pagePatchSchema.safeParse(json.body)
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
    const before = await getPageById(id.id)
    if (!before) return notFound()
    if (before.status === 'published' && !can(auth.user.role, 'page:publish')) {
      return NextResponse.json(
        { error: 'Halaman ini sudah terbit. Hanya peran yang boleh menerbitkan halaman yang dapat mengubahnya.', code: 'forbidden' },
        { status: 403 },
      )
    }
    const page = await updatePage(id.id, parsed.data, auth.user.email ?? auth.user.name)
    revalidatePublicPaths(pathsToRevalidate(before, page))
    return NextResponse.json({ page, gate: publicationIssues(page) })
  } catch (err) {
    return pageErrorResponse(err, 'update')
  }
}

/** DELETE /api/pages/:id — permanent; revision snapshots stay in history. */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await requireCan(request, 'page:delete')
  if (auth.error) return auth.error
  const id = parsePageId((await ctx.params).id)
  if (!id.ok) return id.response

  try {
    const before = await getPageById(id.id)
    if (!before) return notFound()
    await deletePage(id.id, auth.user.email ?? auth.user.name)
    revalidatePublicPaths(pathsToRevalidate(before, null))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return pageErrorResponse(err, 'delete')
  }
}
