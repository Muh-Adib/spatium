import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSolutions } from '@/lib/db/solutions'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { solutionMutationSchema, validateCatalogBody } from '@/lib/validation/api-schemas'
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
  stripUndefined,
  toIntOrDefault,
} from '@/lib/db/catalogMutations'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

/**
 * Studio list of every solution (all statuses) with linked portfolio ids.
 * Solutions currently have no public route (ROADMAP 0.5); data is kept for the Studio.
 */
export async function GET() {
  try {
    const [list, links] = await Promise.all([
      getSolutions(),
      prisma.orm.public.SolutionPortfolio.orderBy((r) => r.displayOrder.asc()).all(),
    ])
    const linked = new Map<number, number[]>()
    for (const link of links) {
      const ids = linked.get(link.solutionId) ?? []
      ids.push(link.portfolioId)
      linked.set(link.solutionId, ids)
    }
    const data = list.map((sol) => ({ ...sol, portfolioIds: linked.get(sol.id) ?? [] }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorResponse('API solutions GET', error, 'Gagal mengambil data solusi.')
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
    console.warn('[API solutions] invalid JSON body:', err)
    rawBody = null
  }
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }

  const isUpdate = 'id' in rawBody && Boolean((rawBody as { id?: unknown }).id)
  const auth = await requireCan(request, isUpdate ? 'solution:update' : 'solution:create')
  if (auth.error) return auth.error

  const validation = validateCatalogBody(solutionMutationSchema, rawBody)
  if (!validation.success) return validation.response
  const data = validation.data

  const slug = normalizeCatalogSlug(data.slug)
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Slug solusi tidak valid.' }, { status: 400 })
  }

  let blocksJson: string | undefined
  if (data.blocks !== undefined) {
    const parsed = parseBlocks(data.blocks)
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: 'Validasi blok katalog gagal.', issues: parsed.issues },
        { status: 422 },
      )
    }
    blocksJson = JSON.stringify(parsed.blocks)
  }

  try {
    const existing = data.id ? await prisma.orm.public.Solution.where({ id: data.id }).first() : null
    if (data.id && !existing) throw new PublicError('Solusi tidak ditemukan.', 404)

    const clash = await prisma.orm.public.Solution.where({ slug }).first()
    if (clash && clash.id !== existing?.id) {
      throw new PublicError(`Slug "${slug}" sudah dipakai solusi lain.`, 409)
    }

    const text = (v: string | null | undefined) => (v === undefined ? undefined : v || null)
    const values = stripUndefined({
      slug,
      title: data.title,
      category: text(data.category),
      shortDescription: text(data.shortDescription),
      description: text(data.description),
      heroImage: text(data.heroImage),
      blocks: blocksJson,
      keyBenefits: data.keyBenefits === undefined ? undefined : jsonColumn(data.keyBenefits),
      technologies: data.technologies === undefined ? undefined : jsonColumn(data.technologies),
      order: data.order === undefined ? undefined : toIntOrDefault(data.order, 0),
      featured: data.featured,
      metaTitle: text(data.metaTitle),
      metaDescription: text(data.metaDescription),
      focusKeyphrase: text(data.focusKeyphrase),
      relatedKeyphrases: data.relatedKeyphrases === undefined ? undefined : jsonColumn(data.relatedKeyphrases),
      seoData: data.seoData === undefined ? undefined : mergeSeoData(existing?.seoData, data.seoData),
      // New solutions start as DRAFT; publishing goes through the gate (AGENTS.md §3.5).
      status: data.status ?? existing?.status ?? 'draft',
    })

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
      let row
      if (existing) {
        await tx.orm.public.Solution.where({ id: existing.id }).update(values)
        row = await tx.orm.public.Solution.where({ id: existing.id }).first()
        if (!row) throw new PublicError('Solusi tidak ditemukan.', 404)
      } else {
        row = await tx.orm.public.Solution.create(values)
      }

      // Portfolio links are replaced only when the editor sent a selection.
      if (data.portfolioIds) {
        const ids = [...new Set(data.portfolioIds)]
        if (ids.length > 0) {
          const found = await tx.orm.public.Portfolio.where((p) => p.id.in(ids)).all()
          if (found.length !== ids.length) throw new PublicError('Ada portofolio terkait yang tidak ditemukan.', 400)
        }
        await tx.orm.public.SolutionPortfolio.where({ solutionId: row.id }).deleteAll()
        let displayOrder = 1
        for (const portfolioId of ids) {
          await tx.orm.public.SolutionPortfolio.create({ solutionId: row.id, portfolioId, displayOrder: displayOrder++ })
        }
      }

      if (existing) {
        await recordCatalogHistory(tx, 'solution', row.id, actor, 'update', existing, {
          fields: Object.keys(values),
          from: existing.status,
          to: row.status,
          portfolioIds: data.portfolioIds,
        })
      } else {
        await recordCatalogHistory(tx, 'solution', row.id, actor, 'create', row, { portfolioIds: data.portfolioIds })
      }
      return row
    })

    await revalidateCatalog('solution', saved.slug)

    return NextResponse.json({
      success: true,
      message: 'Solusi berhasil disimpan.',
      id: saved.id,
      slug: saved.slug,
      status: saved.status,
    })
  } catch (error) {
    return errorResponse('API solutions POST', error, 'Gagal menyimpan solusi.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'solution:delete')
  if (auth.error) return auth.error

  const idParam = new URL(request.url).searchParams.get('id')
  if (!idParam || !/^\d+$/.test(idParam)) {
    return NextResponse.json({ success: false, error: 'ID solusi wajib disertakan.' }, { status: 400 })
  }
  const id = Number(idParam)

  try {
    const actor = actorOf(auth.user)
    const removed = await prisma.transaction(async (tx) => {
      const current = await tx.orm.public.Solution.where({ id }).forUpdate().first()
      if (!current) throw new PublicError('Solusi tidak ditemukan.', 404)
      await recordCatalogHistory(tx, 'solution', id, actor, 'delete', current)
      await tx.orm.public.Solution.where({ id }).delete()
      return current
    })

    await revalidateCatalog('solution', removed.slug)

    return NextResponse.json({ success: true, message: 'Solusi berhasil dihapus.' })
  } catch (error) {
    return errorResponse('API solutions DELETE', error, 'Gagal menghapus solusi.')
  }
}
