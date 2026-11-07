import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { buildCatalogHistory } from '@/lib/catalog/history'
import { CATALOG_LABEL, type CatalogHistoryEntity } from './catalogMutations'

/** Newest revisions returned per request (each entry carries a full snapshot). */
export const CATALOG_HISTORY_LIMIT = 30

const CAPABILITY = {
  portfolio: 'portfolio:update',
  service: 'service:update',
  service_category: 'service-category:update',
} as const

const idSchema = z.coerce.number().int().positive()

async function currentRow(entity: CatalogHistoryEntity, id: number): Promise<Record<string, unknown> | null> {
  switch (entity) {
    case 'portfolio':
      return prisma.orm.public.Portfolio.where({ id }).first()
    case 'service':
      return prisma.orm.public.Service.where({ id }).first()
    case 'service_category':
      return prisma.orm.public.ServiceCategory.where({ id }).first()
  }
}

/**
 * `GET /api/<entity>/<id>/revisions` — read-only version history for the
 * editor's Riwayat tab (who changed what and when, plus the content each
 * change produced so the editor can restore it as unsaved changes).
 * Needs `<entity>:update`: only roles that can edit (and so restore) see it.
 */
export async function catalogRevisionsResponse(request: NextRequest, entity: CatalogHistoryEntity, rawId: string): Promise<NextResponse> {
  const auth = await requireCan(request, CAPABILITY[entity])
  if (auth.error) return auth.error

  const label = CATALOG_LABEL[entity]
  const id = idSchema.safeParse(rawId)
  if (!id.success) {
    return NextResponse.json({ success: false, code: 'invalid', error: `ID ${label.one} tidak valid. Muat ulang daftar lalu coba lagi.` }, { status: 400 })
  }

  try {
    const current = await currentRow(entity, id.data)
    if (!current) {
      return NextResponse.json(
        { success: false, code: 'not_found', error: `${label.title} ini tidak ditemukan. Mungkin sudah dihapus; kembali ke daftar lalu muat ulang.` },
        { status: 404 },
      )
    }
    const rows = await prisma.orm.public.ContentRevision.where({ entityType: entity, entityId: String(id.data) })
      .orderBy((r) => r.id.desc())
      .limit(CATALOG_HISTORY_LIMIT + 1)
      .all()
    const complete = rows.length <= CATALOG_HISTORY_LIMIT
    const revisions = buildCatalogHistory(rows.slice(0, CATALOG_HISTORY_LIMIT), current, complete)
    return NextResponse.json({ success: true, data: { revisions, truncated: !complete } })
  } catch (error) {
    console.error(`[API ${entity} revisions]`, error)
    return NextResponse.json(
      { success: false, error: `Riwayat ${label.one} gagal dimuat karena galat server. Coba lagi sebentar lagi.` },
      { status: 500 },
    )
  }
}
