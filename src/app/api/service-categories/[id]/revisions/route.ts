import type { NextRequest } from 'next/server'
import { catalogRevisionsResponse } from '@/lib/db/catalogRevisions'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/service-categories/:id/revisions — newest-first history for the editor's Riwayat tab. */
export async function GET(request: NextRequest, ctx: Ctx) {
  return catalogRevisionsResponse(request, 'service_category', (await ctx.params).id)
}
