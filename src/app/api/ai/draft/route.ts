import { NextRequest, NextResponse } from 'next/server'
import { generateArticleDraft } from '@/lib/ai/draft'
import { requireUser, ROLE_PERMISSIONS } from '@/lib/auth/rbac'

export async function POST(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error
  if (!ROLE_PERMISSIONS[auth.user.role].canCreateArticle) return NextResponse.json({ error: 'Tidak berwenang membuat artikel.' }, { status: 403 })

  try {
    const body = await req.json()
    const { topic, targetKeyword, audience, categoryId, aiConfig } = body

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const result = await generateArticleDraft({
      topic,
      actor: { id: auth.user.id, name: auth.user.name, email: auth.user.email },
      targetKeyword,
      audience,
      categoryId: categoryId ? Number(categoryId) : undefined,
      aiConfig,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const isKeyError = Boolean(error.message?.toLowerCase().includes('api key'))
    return NextResponse.json(
      {
        error: error.message || 'Internal Server Error',
        needsKey: isKeyError,
      },
      { status: isKeyError ? 400 : 500 }
    )
  }
}
