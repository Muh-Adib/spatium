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
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '10', 10), 100)
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined
  const locale = (searchParams.get('locale') as 'id' | 'en') || undefined
  // Public delivery only ever exposes published content (drafts stay in Studio).
  try {
    const result = await getArticles({
      page,
      pageSize,
      category,
      search,
      locale,
      status: 'published',
    })
    return jsonResponse(result)
  } catch (err) {
    console.error('[delivery:articles] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve articles' }, 500)
  }
}
