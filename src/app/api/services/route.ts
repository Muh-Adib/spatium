import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { forbidUnless, requireCan } from '@/lib/auth/capabilities'
import { serviceMutationSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
import { errorResponse, PublicError } from '@/lib/http/errors'
import {
  actorOf,
  assertCatalogFresh,
  catalogNotFound,
  catalogSlugTaken,
  payloadTooLargeResponse,
  readCatalogBody,
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
    return errorResponse('API services GET', error, 'Daftar layanan gagal dimuat. Coba lagi sebentar lagi.')
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_PAYLOAD_BYTES) return payloadTooLargeResponse(1)

  const read = await readCatalogBody(request, 'API services')
  if (!read.ok) return read.response
  const rawBody = read.body

  const isUpdate = Boolean(rawBody.id)
  const auth = await requireCan(request, isUpdate ? 'service:update' : 'service:create')
  if (auth.error) return auth.error

  const validation = validateCatalogBody(serviceMutationSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  const slug = normalizeCatalogSlug(data.slug)
  if (!slug) {
    return NextResponse.json(
      { success: false, code: 'invalid', error: 'Slug layanan tidak valid. Gunakan huruf kecil, angka, dan tanda hubung, mis. pemindaian-gedung.', issues: [{ field: 'slug', message: 'Gunakan huruf kecil, angka, dan tanda hubung, mis. pemindaian-gedung.' }] },
      { status: 400 },
    )
  }

  // Target-aware validation; creating without blocks stores the service preset.
  const blocksColumn = catalogBlocksColumn('service', data.blocks, data.id ? 'update' : 'create')
  if (!blocksColumn.ok) return blocksColumn.response
  const blocksJson = blocksColumn.value

  try {
    const existing = data.id ? await prisma.orm.public.Service.where({ id: data.id }).first() : null
    if (data.id && !existing) throw catalogNotFound('service')

    const clash = await prisma.orm.public.Service.where({ slug }).first()
    if (clash && clash.id !== existing?.id) {
      throw catalogSlugTaken('service', slug)
    }
    if (data.categoryId) {
      const category = await prisma.orm.public.ServiceCategory.where({ id: data.categoryId }).first()
      if (!category) throw new PublicError('Kategori induk yang dipilih sudah tidak ada. Pilih kategori induk lain.', 400, { code: 'invalid' })
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
      let before = existing
      if (existing) {
        // Lock the row, then refuse a stale save (optimistic concurrency).
        before = assertCatalogFresh('service', await tx.orm.public.Service.where({ id: existing.id }).forUpdate().first(), data.expectedUpdatedAt)
        await tx.orm.public.Service.where({ id: existing.id }).update(values)
        row = await tx.orm.public.Service.where({ id: existing.id }).first()
        if (!row) throw catalogNotFound('service')
        await redirectRenamedSlug(tx, '/services', before, row.slug)
      } else {
        row = await tx.orm.public.Service.create({ ...values, documentId: `svc-${slug}` })
      }

      // Portfolio links are replaced only when the editor sent a selection.
      if (data.portfolioIds) {
        const ids = [...new Set(data.portfolioIds)]
        if (ids.length > 0) {
          const found = await tx.orm.public.Portfolio.where((p) => p.id.in(ids)).all()
          if (found.length !== ids.length) throw new PublicError('Ada portofolio terkait yang sudah tidak ada. Perbarui pilihan Portofolio terkait lalu simpan lagi.', 400, { code: 'invalid' })
        }
        await tx.orm.public.ServicePortfolio.where({ serviceId: row.id }).deleteAll()
        let displayOrder = 1
        for (const portfolioId of ids) {
          await tx.orm.public.ServicePortfolio.create({ serviceId: row.id, portfolioId, displayOrder: displayOrder++ })
        }
      }

      if (before) {
        await recordCatalogHistory(tx, 'service', row.id, actor, 'update', before, {
          fields: Object.keys(values),
          from: before.status,
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
      message: 'Perubahan disimpan.',
      id: saved.id,
      slug: saved.slug,
      status: saved.status,
      updatedAt: saved.updatedAt,
    })
  } catch (error) {
    return errorResponse('API services POST', error, 'Layanan belum tersimpan karena galat server. Coba simpan lagi sebentar lagi.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'service:delete')
  if (auth.error) return auth.error

  const idParam = new URL(request.url).searchParams.get('id')
  if (!idParam || !/^\d+$/.test(idParam)) {
    return NextResponse.json({ success: false, code: 'invalid', error: 'ID layanan tidak valid. Muat ulang daftar lalu coba lagi.' }, { status: 400 })
  }
  const id = Number(idParam)

  try {
    const actor = actorOf(auth.user)
    const removed = await prisma.transaction(async (tx) => {
      const current = await tx.orm.public.Service.where({ id }).forUpdate().first()
      if (!current) throw catalogNotFound('service')
      await recordCatalogHistory(tx, 'service', id, actor, 'delete', current)
      await tx.orm.public.Service.where({ id }).delete()
      return current
    })

    await revalidateCatalog('service', removed.slug, await categorySlugsOf([removed.categoryId]))

    return NextResponse.json({ success: true, message: 'Layanan dihapus.' })
  } catch (error) {
    return errorResponse('API services DELETE', error, 'Layanan belum terhapus karena galat server. Coba lagi sebentar lagi.')
  }
}
