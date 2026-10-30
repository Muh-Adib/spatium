import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { getUserAiMemories, saveUserAiMemory, deleteUserAiMemory } from '@/lib/ai/sessions'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const memories = await getUserAiMemories(auth.user.id)
  return NextResponse.json({
    success: true,
    memories,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    if (!body.key || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Key dan content memori wajib diisi' },
        { status: 400 }
      )
    }

    const memory = await saveUserAiMemory(
      auth.user.id,
      body.key,
      body.content,
      body.enabled !== undefined ? body.enabled : true
    )

    return NextResponse.json({
      success: true,
      memory,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyimpan memori pengguna' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const idOrKey = searchParams.get('id') || searchParams.get('key')

  if (!idOrKey) {
    return NextResponse.json(
      { success: false, error: 'Parameter id atau key wajib diberikan' },
      { status: 400 }
    )
  }

  const ok = await deleteUserAiMemory(auth.user.id, idOrKey)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus memori atau tidak ditemukan' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Memori pengguna berhasil dihapus',
  })
}
