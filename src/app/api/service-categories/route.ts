import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServiceCategories, mapCategoryRow } from '@/lib/db/serviceCategories'
import { forbidUnless, requireCan } from '@/lib/auth/capabilities'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { serviceCategoryMutationSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
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

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

/** Studio list of every department (all statuses). */
export async function GET() {
  try {
    const list = await getServiceCategories()
    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    return errorResponse('API service-categories GET', error, 'Gagal mengambil data departemen.')
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
    console.warn('[API service-categories] invalid JSON body:', err)
    rawBody = null
  }
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }

  const isUpdate = 'id' in rawBody && Boolean((rawBody as { id?: unknown }).id)
  const auth = await requireCan(request, isUpdate ? 'service-category:update' : 'service-category:create')
  if (auth.error) return auth.error

  const validation = validateCatalogBody(serviceCategoryMutationSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  const slug = normalizeCatalogSlug(data.slug)
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug departemen tidak valid.' }, { status: 400 })
  }

  // Target-aware validation; creating without blocks stores the category preset.
  const blocksColumn = catalogBlocksColumn('service-category', data.blocks, data.id ? 'update' : 'create')
  if (!blocksColumn.ok) return blocksColumn.response
  const blocksJson = blocksColumn.value

  try {
    const existing = data.id ? await prisma.orm.public.ServiceCategory.where({ id: data.id }).first() : null
    if (data.id && !existing) throw new PublicError('Departemen tidak ditemukan.', 404)

    const clash = await prisma.orm.public.ServiceCategory.where({ slug }).first()
    if (clash && clash.id !== existing?.id) {
      throw new PublicError(`Slug "${slug}" sudah dipakai departemen lain.`, 409)
    }

    const text = (v: string | null | undefined) => (v === undefined ? undefined : v || null)
    const values = stripUndefined({
      slug,
      title: data.title,
      tag: text(data.tag),
      shortDescription: text(data.shortDescription),
      heroImage: text(data.heroImage),
      themePreset: data.themePreset === undefined ? undefined : data.themePreset || 'charcoal',
      keyOutcomes: data.keyOutcomes === undefined ? undefined : jsonColumn(data.keyOutcomes),
      blocks: blocksJson,
      order: data.order === undefined ? undefined : toIntOrDefault(data.order, 0),
      showInNav: data.showInNav,
      metaTitle: text(data.metaTitle),
      metaDescription: text(data.metaDescription),
      focusKeyphrase: text(data.focusKeyphrase),
      relatedKeyphrases: data.relatedKeyphrases === undefined ? undefined : jsonColumn(data.relatedKeyphrases),
      seoData: data.seoData === undefined ? undefined : mergeSeoData(existing?.seoData, data.seoData),
      // New departments start as DRAFT; publishing goes through the gate (AGENTS.md §3.5).
      status: data.status ?? existing?.status ?? 'draft',
    })

    // Going live or leaving the live state is a publishing decision.
    if (values.status !== existing?.status && (values.status === 'published' || existing?.status === 'published')) {
      const denied = forbidUnless(auth.user.role, 'service-category:publish')
      if (denied) return denied
    }

    if (values.status === 'published') {
      const merged = { ...existing, ...values }
      const gate = catalogGateResponse({
        title: merged.title,
        slug: merged.slug,
        metaTitle: merged.metaTitle ?? undefined,
        metaDescription: merged.metaDescription ?? undefined,
        heroImage: merged.heroImage ?? undefined,
        heroImageAlt: coverAltFrom(merged.seoData),
        blocks: parseJsonArray(merged.blocks),
        target: 'service-category',
      })
      if (gate) return gate
    }

    const actor = actorOf(auth.user)
    const saved = await prisma.transaction(async (tx) => {
      if (existing) {
        await tx.orm.public.ServiceCategory.where({ id: existing.id }).update(values)
        const row = await tx.orm.public.ServiceCategory.where({ id: existing.id }).first()
        if (!row) throw new PublicError('Departemen tidak ditemukan.', 404)
        await redirectRenamedSlug(tx, '/services', existing, row.slug)
        await recordCatalogHistory(tx, 'service_category', row.id, actor, 'update', existing, {
          fields: Object.keys(values),
          from: existing.status,
          to: row.status,
        })
        return row
      }
      const row = await tx.orm.public.ServiceCategory.create(values)
      await recordCatalogHistory(tx, 'service_category', row.id, actor, 'create', row)
      return row
    })

    const childSlugs = (await prisma.orm.public.Service.where({ categoryId: saved.id }).all()).map((s) => s.slug)
    await revalidateCatalog('category', saved.slug, childSlugs)
    if (existing && existing.slug !== saved.slug) await revalidateCatalog('category', existing.slug)

    return NextResponse.json({ success: true, data: mapCategoryRow(saved) })
  } catch (error) {
    return errorResponse('API service-categories POST', error, 'Gagal menyimpan departemen.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'service-category:delete')
  if (auth.error) return auth.error

  const idParam = new URL(request.url).searchParams.get('id')
  if (!idParam || !/^\d+$/.test(idParam)) {
    return NextResponse.json({ success: false, error: 'ID departemen wajib disertakan.' }, { status: 400 })
  }
  const id = Number(idParam)

  try {
    const actor = actorOf(auth.user)
    const { removed, childSlugs } = await prisma.transaction(async (tx) => {
      const current = await tx.orm.public.ServiceCategory.where({ id }).forUpdate().first()
      if (!current) throw new PublicError('Departemen tidak ditemukan.', 404)
      // Services keep existing but lose their department (the UI warns about this).
      const children = await tx.orm.public.Service.where({ categoryId: id }).all()
      if (children.length > 0) {
        await tx.orm.public.Service.where({ categoryId: id }).updateAll({ categoryId: null })
      }
      await recordCatalogHistory(tx, 'service_category', id, actor, 'delete', current, {
        detachedServiceIds: children.map((c) => c.id),
      })
      await tx.orm.public.ServiceCategory.where({ id }).delete()
      return { removed: current, childSlugs: children.map((c) => c.slug) }
    })

    await revalidateCatalog('category', removed.slug, childSlugs)

    return NextResponse.json({ success: true, message: 'Departemen berhasil dihapus.' })
  } catch (error) {
    return errorResponse('API service-categories DELETE', error, 'Gagal menghapus departemen.')
  }
}
