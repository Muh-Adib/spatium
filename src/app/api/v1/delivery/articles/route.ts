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
  const statusParam = searchParams.get('status')
  const status = (statusParam === 'draft' || statusParam === 'published' || statusParam === 'all')
    ? statusParam
    : 'published'

  try {
    let result = await getArticles({
      page,
      pageSize,
      category,
      search,
      locale,
      status: status as any,
    })

    if (!result?.data || result.data.length === 0) {
      try {
        const seedArticles = require('@/data/seed/seed_articles.json')
        const total = seedArticles.length
        const pageCount = Math.ceil(total / pageSize)
        const data = seedArticles.slice((page - 1) * pageSize, page * pageSize)
        result = {
          data,
          meta: {
            pagination: {
              page,
              pageSize,
              pageCount,
              total,
            }
          }
        } as any
      } catch {}
    }

    return jsonResponse(result)
  } catch (err) {
    console.error('[delivery:articles] Error:', err)
    try {
      const seedArticles = require('@/data/seed/seed_articles.json')
      const total = seedArticles.length
      const pageCount = Math.ceil(total / pageSize)
      const data = seedArticles.slice((page - 1) * pageSize, page * pageSize)
      return jsonResponse({
        data,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount,
            total,
          }
        }
      })
    } catch {
      return jsonResponse({ error: 'Failed to retrieve articles' }, 500)
    }
  }
}
