import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateIndexNowKey } from '@/lib/seo/indexnow'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedKey = searchParams.get('key')
  const validKey = await getOrCreateIndexNowKey()

  if (!requestedKey || requestedKey === validKey) {
    return new NextResponse(validKey, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  return new NextResponse('Invalid Key', { status: 404 })
}
