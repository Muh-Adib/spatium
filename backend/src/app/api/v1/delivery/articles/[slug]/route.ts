import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getArticleBySlug } from '@/lib/db/articles'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const { slug } = await context.params
  if (!slug) {
    return jsonResponse({ error: 'Slug parameter is required' }, 400)
  }

  try {
    const article = await getArticleBySlug(slug)
    if (!article) {
      return jsonResponse({ error: 'Article not found', slug }, 404)
    }

    return jsonResponse({ article })
  } catch (err) {
    console.error(`[delivery:articles:${slug}] Error:`, err)
    return jsonResponse({ error: 'Failed to retrieve article' }, 500)
  }
}
