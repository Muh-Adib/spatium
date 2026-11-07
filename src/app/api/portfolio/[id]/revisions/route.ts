import type { NextRequest } from 'next/server'
import { catalogRevisionsResponse } from '@/lib/db/catalogRevisions'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/portfolio/:id/revisions — newest-first history for the editor's Riwayat tab. */
export async function GET(request: NextRequest, ctx: Ctx) {
  return catalogRevisionsResponse(request, 'portfolio', (await ctx.params).id)
}
