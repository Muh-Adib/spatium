import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { parseBlocks } from '@/lib/blocks/schema'
import { revalidateCatalog } from '@/lib/cache/revalidate'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')

    let query = prisma.orm.public.PageTemplate.orderBy((p: any) => p.id.desc())
    if (targetType) {
      query = query.where({ targetType })
    }

    const rows = await query.all()
    const data = rows.map((r: any) => ({
      ...r,
      blocks: typeof r.blocks === 'string' ? JSON.parse(r.blocks) : r.blocks,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
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

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const { name, targetType, description, blocks } = body

    if (!name || !targetType || !blocks) {
      return NextResponse.json({ success: false, error: 'Nama, targetType, dan blocks wajib diisi.' }, { status: 400 })
    }

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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCan(request, 'template:delete')
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib disertakan.' }, { status: 400 })
    }

    await prisma.orm.public.PageTemplate.where({ id: Number(id) }).delete()
    await revalidateCatalog('template')

    return NextResponse.json({ success: true, message: 'Template berhasil dihapus.' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
