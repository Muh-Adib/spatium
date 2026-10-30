import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { compressAiSession } from '@/lib/ai/sessions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { id: sessionId } = await params
  const body = await request.json().catch(() => ({}))

  if (!body.apiKey || typeof body.apiKey !== 'string' || !body.apiKey.trim()) {
    return NextResponse.json(
      { success: false, error: 'API Key belum dikonfigurasi. Masukkan API Key di pengaturan AI.', needsKey: true },
      { status: 400 }
    )
  }

  const result = await compressAiSession(sessionId, auth.user.id, {
    apiKey: body.apiKey,
    provider: body.provider,
    model: body.model,
    keepLatestCount: body.keepLatestCount || 4,
  })

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || 'Gagal mengompresi sesi' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    summary: result.summary,
    originalMessagesCount: result.originalMessagesCount,
    remainingMessagesCount: result.remainingMessagesCount,
    tokenSavingsEstimatePercent: result.tokenSavingsEstimatePercent,
    message: `Sesi berhasil dikompresi. Menyimpan ${result.tokenSavingsEstimatePercent}% alokasi token.`,
  })
}
