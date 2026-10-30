import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getArticles } from '@/lib/db/articles'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10', 10), 100)
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined
  const locale = (searchParams.get('locale') as 'id' | 'en') || undefined
  const statusParam = searchParams.get('status')
  const status = (statusParam === 'draft' || statusParam === 'published' || statusParam === 'all')
    ? statusParam
    : 'published'

  try {
    const result = await getArticles({
      page,
      pageSize,
      category,
      search,
      locale,
      status: status as any,
    })

    return jsonResponse(result)
  } catch (err) {
    console.error('[delivery:articles] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve articles' }, 500)
  }
}
