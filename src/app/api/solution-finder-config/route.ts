import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSolutionFinderConfig } from '@/lib/db/solutions'
import { requireCan } from '@/lib/auth/capabilities'
import { revalidateCatalog } from '@/lib/cache/revalidate'

const MAX_PAYLOAD_BYTES = 1024 * 1024 // 1MB

export async function GET() {
  try {
    const config = await getSolutionFinderConfig()
    return NextResponse.json({ success: true, data: config })
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

  const auth = await requireCan(request, 'solution:manage')
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const { businessGoals, industries, questions, recommendationMatrix } = body

    const payload: any = {
      businessGoals: typeof businessGoals === 'string' ? businessGoals : JSON.stringify(businessGoals || []),
      industries: typeof industries === 'string' ? industries : JSON.stringify(industries || []),
      questions: typeof questions === 'string' ? questions : JSON.stringify(questions || []),
      recommendationMatrix: typeof recommendationMatrix === 'string' ? recommendationMatrix : JSON.stringify(recommendationMatrix || []),
    }

    const existing = await prisma.orm.public.SolutionFinderConfig.where({ configKey: 'default' }).first()

    if (existing) {
      await prisma.orm.public.SolutionFinderConfig.where({ configKey: 'default' }).update(payload)
    } else {
      await prisma.orm.public.SolutionFinderConfig.create({
          configKey: 'default',
          ...payload,
        })
    }

    await revalidateCatalog('config')

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi Solution Finder berhasil diperbarui.',
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
