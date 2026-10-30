import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import { getUserAiSessions, createAiSession } from '@/lib/ai/sessions'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const sessions = await getUserAiSessions(auth.user.id)
  return NextResponse.json({
    success: true,
    sessions,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const newSession = await createAiSession(auth.user.id, {
      title: body.title,
      model: body.model,
      systemPrompt: body.systemPrompt,
    })

    return NextResponse.json({
      success: true,
      session: newSession,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal membuat sesi obrolan baru' },
      { status: 500 }
    )
  }
}
