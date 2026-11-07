import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { forbidUnless, requireCan } from '@/lib/auth/capabilities'
import { serviceMutationSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
import { errorResponse, PublicError } from '@/lib/http/errors'
import {
  actorOf,
  catalogBlocksColumn,
  catalogGateResponse,
  coverAltFrom,
  jsonColumn,
  mergeSeoData,
  normalizeCatalogSlug,
  parseJsonArray,
  recordCatalogHistory,
  redirectRenamedSlug,
  stripUndefined,
  toIntOrDefault,
} from '@/lib/db/catalogMutations'

const MAX_PAYLOAD_BYTES = 1024 * 1024

/** Slugs of the given category ids (current and previous parent), for revalidation. */
async function categorySlugsOf(ids: readonly (number | null | undefined)[]): Promise<string[]> {
  const wanted = [...new Set(ids.filter((id): id is number => typeof id === 'number'))]
  if (wanted.length === 0) return []
  const rows = await prisma.orm.public.ServiceCategory.where((c) => c.id.in(wanted)).all()
  return rows.map((r) => r.slug)
}

/**
 * Studio list of every service (all statuses), each with the ids of its linked
 * portfolios so the editor can show and keep the current selection.
 */
export async function GET(request: NextRequest) {
  try {
    const categoryParam = new URL(request.url).searchParams.get('categoryId')
    const categoryId = categoryParam && /^\d+$/.test(categoryParam) ? Number(categoryParam) : null

    const base = categoryId ? prisma.orm.public.Service.where({ categoryId }) : prisma.orm.public.Service
    const [rows, links] = await Promise.all([
      base.orderBy((s) => s.order.asc()).all(),
      prisma.orm.public.ServicePortfolio.orderBy((r) => r.displayOrder.asc()).all(),
    ])

    const linkedByService = new Map<number, number[]>()
    for (const link of links) {
      const list = linkedByService.get(link.serviceId) ?? []
      list.push(link.portfolioId)
      linkedByService.set(link.serviceId, list)
    }

    const data = rows.map((row) => ({ ...row, portfolioIds: linkedByService.get(row.id) ?? [] }))
    return NextResponse.json({ success: true, data, total: data.length })
  } catch (error) {
    return errorResponse('API services GET', error, 'Gagal mengambil data layanan.')
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran payload melebihi batas 1MB.' }, { status: 413 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch (err) {
    console.warn('[API services] invalid JSON body:', err)
    rawBody = null
  }
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }

  const isUpdate = 'id' in rawBody && Boolean((rawBody as { id?: unknown }).id)
  const auth = await requireCan(request, isUpdate ? 'service:update' : 'service:create')
  if (auth.error) return auth.error

  const validation = validateCatalogBody(serviceMutationSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  const slug = normalizeCatalogSlug(data.slug)
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug layanan tidak valid.' }, { status: 400 })
  }

  // Target-aware validation; creating without blocks stores the service preset.
  const blocksColumn = catalogBlocksColumn('service', data.blocks, data.id ? 'update' : 'create')
  if (!blocksColumn.ok) return blocksColumn.response
  const blocksJson = blocksColumn.value

  try {
    const existing = data.id ? await prisma.orm.public.Service.where({ id: data.id }).first() : null
    if (data.id && !existing) throw new PublicError('Layanan tidak ditemukan.', 404)

    const clash = await prisma.orm.public.Service.where({ slug }).first()
    if (clash && clash.id !== existing?.id) {
      throw new PublicError(`Slug "${slug}" sudah dipakai layanan lain.`, 409)
    }
    if (data.categoryId) {
      const category = await prisma.orm.public.ServiceCategory.where({ id: data.categoryId }).first()
      if (!category) throw new PublicError('Kategori induk yang dipilih tidak ditemukan. Pilih kategori lain.', 400)
    }

    const text = (v: string | null | undefined) => (v === undefined ? undefined : v || null)
    const values = stripUndefined({
      name: data.name,
      slug,
      categoryId: data.categoryId === undefined ? undefined : data.categoryId ?? null,
      indexNumber: text(data.indexNumber),
      categoryBadge: text(data.categoryBadge),
      highlightWord: text(data.highlightWord),
      shortDescription: text(data.shortDescription),
      longDescription: text(data.longDescription),
      description:
        data.description === undefined && data.longDescription === undefined
          ? undefined
          : data.description || data.longDescription || null,
      whatsappPrompt: text(data.whatsappPrompt),
      icon: text(data.icon),
      heroImage: text(data.heroImage),
      primaryMedia: data.primaryMedia === undefined ? undefined : jsonColumn(data.primaryMedia),
      metrics: data.metrics === undefined ? undefined : jsonColumn(data.metrics),
      features: data.features === undefined ? undefined : jsonColumn(data.features),
      deliverables: data.deliverables === undefined ? undefined : jsonColumn(data.deliverables),
      technologies: data.technologies === undefined ? undefined : jsonColumn(data.technologies),
      faq: data.faq === undefined ? undefined : jsonColumn(data.faq),
      blocks: blocksJson,
      order: data.order === undefined ? undefined : toIntOrDefault(data.order, 0),
      featured: data.featured,
      metaTitle: text(data.metaTitle),
      metaDescription: text(data.metaDescription),
      focusKeyphrase: text(data.focusKeyphrase),
      relatedKeyphrases: data.relatedKeyphrases === undefined ? undefined : jsonColumn(data.relatedKeyphrases),
      seoData: data.seoData === undefined ? undefined : mergeSeoData(existing?.seoData, data.seoData),
      // New services start as DRAFT; publishing goes through the gate (AGENTS.md §3.5).
      status: data.status ?? existing?.status ?? 'draft',
    })

    // Going live or leaving the live state is a publishing decision.
    if (values.status !== existing?.status && (values.status === 'published' || existing?.status === 'published')) {
      const denied = forbidUnless(auth.user.role, 'service:publish')
      if (denied) return denied
    }

    if (values.status === 'published') {
      const merged = { ...existing, ...values }
      const gate = catalogGateResponse({
        title: merged.name,
        slug: merged.slug,
        metaTitle: merged.metaTitle ?? undefined,
        metaDescription: merged.metaDescription ?? undefined,
        heroImage: merged.heroImage ?? undefined,
        heroImageAlt: coverAltFrom(merged.seoData),
        blocks: parseJsonArray(merged.blocks),
        target: 'service',
      })
      if (gate) return gate
    }

    const actor = actorOf(auth.user)
    const saved = await prisma.transaction(async (tx) => {
      let row
      if (existing) {
        await tx.orm.public.Service.where({ id: existing.id }).update(values)
        row = await tx.orm.public.Service.where({ id: existing.id }).first()
        if (!row) throw new PublicError('Layanan tidak ditemukan.', 404)
        await redirectRenamedSlug(tx, '/services', existing, row.slug)
      } else {
        row = await tx.orm.public.Service.create({ ...values, documentId: `svc-${slug}` })
      }

      // Portfolio links are replaced only when the editor sent a selection.
      if (data.portfolioIds) {
        const ids = [...new Set(data.portfolioIds)]
        if (ids.length > 0) {
          const found = await tx.orm.public.Portfolio.where((p) => p.id.in(ids)).all()
          if (found.length !== ids.length) throw new PublicError('Ada portofolio terkait yang tidak ditemukan.', 400)
        }
        await tx.orm.public.ServicePortfolio.where({ serviceId: row.id }).deleteAll()
        let displayOrder = 1
        for (const portfolioId of ids) {
          await tx.orm.public.ServicePortfolio.create({ serviceId: row.id, portfolioId, displayOrder: displayOrder++ })
        }
      }

      if (existing) {
        await recordCatalogHistory(tx, 'service', row.id, actor, 'update', existing, {
          fields: Object.keys(values),
          from: existing.status,
          to: row.status,
          portfolioIds: data.portfolioIds,
        })
      } else {
        await recordCatalogHistory(tx, 'service', row.id, actor, 'create', row, { portfolioIds: data.portfolioIds })
      }
      return row
    })

    const parentSlugs = await categorySlugsOf([saved.categoryId, existing?.categoryId])
    await revalidateCatalog('service', saved.slug, parentSlugs)
    if (existing && existing.slug !== saved.slug) await revalidateCatalog('service', existing.slug, parentSlugs)

    return NextResponse.json({
      success: true,
      message: 'Layanan berhasil disimpan.',
      id: saved.id,
      slug: saved.slug,
      status: saved.status,
    })
  } catch (error) {
    return errorResponse('API services POST', error, 'Gagal menyimpan layanan.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'service:delete')
  if (auth.error) return auth.error

  const idParam = new URL(request.url).searchParams.get('id')
  if (!idParam || !/^\d+$/.test(idParam)) {
    return NextResponse.json({ success: false, error: 'ID layanan wajib disertakan.' }, { status: 400 })
  }
  const id = Number(idParam)

  try {
    const actor = actorOf(auth.user)
    const removed = await prisma.transaction(async (tx) => {
      const current = await tx.orm.public.Service.where({ id }).forUpdate().first()
      if (!current) throw new PublicError('Layanan tidak ditemukan.', 404)
      await recordCatalogHistory(tx, 'service', id, actor, 'delete', current)
      await tx.orm.public.Service.where({ id }).delete()
      return current
    })

    await revalidateCatalog('service', removed.slug, await categorySlugsOf([removed.categoryId]))

    return NextResponse.json({ success: true, message: 'Layanan berhasil dihapus.' })
  } catch (error) {
    return errorResponse('API services DELETE', error, 'Gagal menghapus layanan.')
  }
}
