import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { getAiSessionById, updateAiSession, deleteAiSession } from '@/lib/ai/sessions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { id: sessionId } = await params
  const session = await getAiSessionById(sessionId, auth.user.id)

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Sesi obrolan tidak ditemukan atau bukan milik Anda' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    session,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { id: sessionId } = await params
  const body = await request.json().catch(() => ({}))

  const ok = await updateAiSession(sessionId, auth.user.id, {
    title: body.title,
    model: body.model,
    pinned: body.pinned,
    summary: body.summary,
  })

  if (!ok) {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui sesi' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Sesi berhasil diperbarui',
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { id: sessionId } = await params
  const ok = await deleteAiSession(sessionId, auth.user.id)

  if (!ok) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus sesi' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Sesi obrolan berhasil dihapus dari server',
  })
}
