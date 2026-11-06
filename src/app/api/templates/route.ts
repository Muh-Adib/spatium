/**
 * Legacy block-template library (ROADMAP 0.6): no Studio UI calls this
 * endpoint any more (docs/EDITORS.md). Kept until the owner decides to remove
 * or reconnect it; responses never expose raw database errors.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'
import { revalidateCatalog } from '@/lib/cache/revalidate'
import { errorResponse } from '@/lib/http/errors'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

const REQUIRED_FIELDS_MESSAGE = 'Nama, targetType, dan blocks wajib diisi.'

const templateCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  targetType: z.string().trim().min(1).max(50),
  description: z.string().max(1000).nullish(),
  blocks: z.unknown().refine((v) => v !== undefined && v !== null && v !== ''),
})

function parseStoredBlocks(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (err) {
    console.warn('[templates] Stored blocks are not valid JSON', err)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')

    let query = prisma.orm.public.PageTemplate.orderBy((p) => p.id.desc())
    if (targetType) {
      query = query.where({ targetType })
    }

    const rows = await query.all()
    const data = rows.map((r) => ({
      ...r,
      blocks: parseStoredBlocks(r.blocks),
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return errorResponse('templates', err, 'Template tidak dapat dimuat.')
  }
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Ukuran payload melebihi batas 1MB.' },
      { status: 413 }
    )
  }

  const auth = await requireCan(request, 'template:create')
  if (auth.error) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
  }
  const parsed = templateCreateSchema.safeParse(body)
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).filter(Boolean)
    return NextResponse.json(
      { success: false, error: REQUIRED_FIELDS_MESSAGE, fields },
      { status: 400 }
    )
  }
  const { name, targetType, description, blocks } = parsed.data

  try {
    // Validate blocks with K-2 Block Schema
    const parsedBlocks = parseBlocks(blocks)
    if (!parsedBlocks.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validasi blok template gagal.',
          issues: parsedBlocks.issues,
        },
        { status: 422 }
      )
    }

    const inserted = await prisma.orm.public.PageTemplate.create({
      name,
      targetType,
      description: description || null,
      blocks: typeof blocks === 'string' ? blocks : JSON.stringify(blocks),
    })

    await revalidateCatalog('template')

    return NextResponse.json({ success: true, data: inserted })
  } catch (err) {
    return errorResponse('templates', err, 'Template gagal disimpan.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'template:delete')
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'ID wajib disertakan.' }, { status: 400 })
  }

  try {
    await prisma.orm.public.PageTemplate.where({ id }).delete()
    await revalidateCatalog('template')

    return NextResponse.json({ success: true, message: 'Template berhasil dihapus.' })
  } catch (err) {
    return errorResponse('templates', err, 'Template gagal dihapus.')
  }
}
