import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth/rbac'

/**
 * Editorial calendar feed.
 *
 * GET /api/schedule?from=ISO&to=ISO
 * Returns every content item that has a schedule (or a schedule error),
 * across all schedulable entity types, in a single flat list.
 */

const ENTITIES = [
  { type: 'article', model: 'Article', label: 'Artikel' },
  { type: 'page', model: 'Page', label: 'Halaman' },
  { type: 'service', model: 'Service', label: 'Layanan' },
  { type: 'serviceCategory', model: 'ServiceCategory', label: 'Kategori Layanan' },
  { type: 'portfolio', model: 'Portfolio', label: 'Portofolio' },
] as const

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const items: Array<Record<string, unknown>> = []
  const ormPublic = prisma.orm.public as unknown as Record<string, { all: () => Promise<Array<Record<string, unknown>>> }>

  for (const entity of ENTITIES) {
    const repo = ormPublic[entity.model]
    if (!repo) continue
    let rows: Array<Record<string, unknown>>
    try {
      rows = await repo.all()
    } catch {
      continue
    }
    for (const row of rows) {
      const scheduledAt: string | null = (row.scheduledAt as string | null) ?? null
      const hasError = Boolean(row.scheduleError)
      if (!scheduledAt && !hasError) continue
      if (scheduledAt && from && scheduledAt < from) continue
      if (scheduledAt && to && scheduledAt > to) continue
      items.push({
        id: row.id,
        type: entity.type,
        typeLabel: entity.label,
        title: row.title || row.name || row.slug,
        slug: row.slug,
        status: row.status,
        scheduledAt,
        scheduledBy: row.scheduledBy ?? null,
        scheduleError: row.scheduleError ?? null,
        publicationTimezone: row.publicationTimezone ?? 'Asia/Jakarta',
        previewUrl: `/admin/preview/${entity.type}/${row.id}`,
      })
    }
  }

  items.sort((a, b) => String(a.scheduledAt ?? '').localeCompare(String(b.scheduledAt ?? '')))

  return NextResponse.json({
    data: items,
    total: items.length,
    range: { from: from ?? null, to: to ?? null },
    generatedAt: new Date().toISOString(),
  })
}
