import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getPortfolioBySlug } from '@/lib/db/portfolio'

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
    const portfolio = await getPortfolioBySlug(slug)
    if (!portfolio) {
      return jsonResponse({ error: 'Portfolio not found', slug }, 404)
    }

    return jsonResponse({ portfolio })
  } catch (err) {
    console.error(`[delivery:portfolios:${slug}] Error:`, err)
    return jsonResponse({ error: 'Failed to retrieve portfolio' }, 500)
  }
}
