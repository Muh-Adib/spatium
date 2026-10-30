import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateIndexNowKey, submitToIndexNow } from '@/lib/seo/indexnow'
import { siteConfig } from '@/config/site'
import { requireUser, requireRole } from '@/lib/auth/rbac'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const key = await getOrCreateIndexNowKey()
    return NextResponse.json({
      data: {
        key,
        keyUrl: `${siteConfig.url}/${key}.txt`,
        endpoint: 'https://api.indexnow.org/indexnow',
        participatingEngines: ['Bing', 'Yandex', 'Seznam', 'Naver'],
      },
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memuat status IndexNow.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'])
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { urls } = body

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { data: null, errors: ['urls array wajib diisi.'] },
        { status: 400 }
      )
    }

    const result = await submitToIndexNow(urls)
    return NextResponse.json({
      data: result,
      message: result.message,
      errors: result.error ? [result.error] : [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal mengirim URL ke IndexNow.'] },
      { status: 500 }
    )
  }
}
