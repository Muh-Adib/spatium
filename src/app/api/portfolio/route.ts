import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { forbidUnless, requireCan } from '@/lib/auth/capabilities'
import { portfolioMutationSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { errorResponse, PublicError } from '@/lib/http/errors'
import {
  actorOf,
  catalogGateResponse,
  coverAltFrom,
  jsonColumn,
  mergeSeoData,
  normalizeCatalogSlug,
  parseJsonArray,
  recordCatalogHistory,
  redirectRenamedSlug,
  stripUndefined,
} from '@/lib/db/catalogMutations'

const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024

/**
 * Studio list of every portfolio row (all statuses). The proxy only lets signed-in
 * Studio sessions reach this route; public pages read published rows via lib code.
 */
export async function GET(request: NextRequest) {
  try {
    const limitParam = new URL(request.url).searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : NaN

    let query = prisma.orm.public.Portfolio.orderBy((p) => p.year.desc())
    if (Number.isFinite(limit) && limit > 0) query = query.limit(Math.min(limit, 500))
    const rows = await query.all()

    return NextResponse.json({ success: true, data: rows, total: rows.length })
  } catch (error) {
    return errorResponse('API portfolio GET', error, 'Gagal mengambil data portofolio.')
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran payload melebihi batas 2MB.' }, { status: 413 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch (err) {
    console.warn('[API portfolio] invalid JSON body:', err)
    rawBody = null
  }
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }

  const isUpdate = 'id' in rawBody && Boolean((rawBody as { id?: unknown }).id)
  const auth = await requireCan(request, isUpdate ? 'portfolio:update' : 'portfolio:create')
  if (auth.error) return auth.error

  const validation = validateCatalogBody(portfolioMutationSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  const slug = normalizeCatalogSlug(data.slug)
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug portofolio tidak valid.' }, { status: 400 })
  }

  if (data.blocks !== undefined && data.blocks !== null && parseJsonArray(data.blocks) === undefined) {
    return NextResponse.json({ success: false, error: 'Blok harus berupa daftar (array).' }, { status: 400 })
  }

  try {
    const existing = data.id ? await prisma.orm.public.Portfolio.where({ id: data.id }).first() : null
    if (data.id && !existing) throw new PublicError('Portofolio tidak ditemukan.', 404)

    const clash = await prisma.orm.public.Portfolio.where({ slug }).first()
    if (clash && clash.id !== existing?.id) {
      throw new PublicError(`Slug "${slug}" sudah dipakai portofolio lain.`, 409)
    }

    // Only fields present in the request are written, so partial updates keep the rest.
    // Unknown year / category stay empty — never invented (AGENTS.md §3.3).
    const yearValue = data.year === undefined ? undefined : data.year === null || data.year === '' ? null : Number(data.year)
    const values = stripUndefined({
      title: data.title,
      slug,
      client: data.client === undefined ? undefined : data.client || null,
      year: yearValue,
      category: data.category === undefined ? undefined : data.category || null,
      summary: data.summary === undefined ? undefined : data.summary || null,
      challenge: data.challenge === undefined ? undefined : data.challenge || null,
      approach: data.approach === undefined ? undefined : data.approach || null,
      solution: data.solution === undefined ? undefined : data.solution || null,
      process: data.process === undefined ? undefined : data.process || null,
      result: data.result === undefined ? undefined : data.result || null,
      heroImage: data.heroImage === undefined ? undefined : data.heroImage || null,
      liveUrl: data.liveUrl === undefined ? undefined : data.liveUrl || null,
      featured: data.featured,
      metrics: data.metrics === undefined ? undefined : jsonColumn(data.metrics),
      technologies: data.technologies === undefined ? undefined : jsonColumn(data.technologies),
      blocks: data.blocks === undefined ? undefined : jsonColumn(data.blocks),
      metaTitle: data.metaTitle === undefined ? undefined : data.metaTitle || null,
      metaDescription: data.metaDescription === undefined ? undefined : data.metaDescription || null,
      focusKeyphrase: data.focusKeyphrase === undefined ? undefined : data.focusKeyphrase || null,
      relatedKeyphrases: data.relatedKeyphrases === undefined ? undefined : jsonColumn(data.relatedKeyphrases),
      seoData: data.seoData === undefined ? undefined : mergeSeoData(existing?.seoData, data.seoData),
      // New items start as DRAFT; publishing must pass the gate below (AGENTS.md §3.5).
      status: data.status ?? existing?.status ?? 'draft',
    })

    // Going live or leaving the live state is a publishing decision.
    if (values.status !== existing?.status && (values.status === 'published' || existing?.status === 'published')) {
      const denied = forbidUnless(auth.user.role, 'portfolio:publish')
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
      })
      if (gate) return gate
    }

    const actor = actorOf(auth.user)
    const saved = await prisma.transaction(async (tx) => {
      if (existing) {
        await tx.orm.public.Portfolio.where({ id: existing.id }).update(values)
        const row = await tx.orm.public.Portfolio.where({ id: existing.id }).first()
        if (!row) throw new PublicError('Portofolio tidak ditemukan.', 404)
        await redirectRenamedSlug(tx, '/portfolio', existing, row.slug)
        await recordCatalogHistory(tx, 'portfolio', row.id, actor, 'update', existing, {
          fields: Object.keys(values),
          from: existing.status,
          to: row.status,
        })
        return row
      }
      const row = await tx.orm.public.Portfolio.create({ ...values, documentId: `port-${slug}` })
      await recordCatalogHistory(tx, 'portfolio', row.id, actor, 'create', row)
      return row
    })

    await revalidateCatalog('portfolio', saved.slug)
    if (existing && existing.slug !== saved.slug) await revalidateCatalog('portfolio', existing.slug)

    return NextResponse.json({
      success: true,
      message: 'Portofolio berhasil disimpan.',
      id: saved.id,
      slug: saved.slug,
      status: saved.status,
    })
  } catch (error) {
    return errorResponse('API portfolio POST', error, 'Gagal menyimpan portofolio.')
  }
}

export async function DELETE(request: NextRequest) {
  // Follows the capability map: only SUPER_ADMIN / CONTENT_ADMIN may delete.
  const auth = await requireCan(request, 'portfolio:delete')
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const idParam = searchParams.get('id')
  const slugParam = searchParams.get('slug')
  const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  if (!id && !slugParam) {
    return NextResponse.json({ success: false, error: 'ID atau slug portofolio wajib disertakan.' }, { status: 400 })
  }

  try {
    const actor = actorOf(auth.user)
    const removed = await prisma.transaction(async (tx) => {
      const where = id ? { id } : { slug: slugParam ?? '' }
      const current = await tx.orm.public.Portfolio.where(where).forUpdate().first()
      if (!current) throw new PublicError('Portofolio tidak ditemukan.', 404)
      await recordCatalogHistory(tx, 'portfolio', current.id, actor, 'delete', current)
      await tx.orm.public.Portfolio.where({ id: current.id }).delete()
      return current
    })

    await revalidateCatalog('portfolio', removed.slug)

    return NextResponse.json({ success: true, message: 'Portofolio berhasil dihapus.' })
  } catch (error) {
    return errorResponse('API portfolio DELETE', error, 'Gagal menghapus portofolio.')
  }
}
