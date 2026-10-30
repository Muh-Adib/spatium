import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getPage } from '@/lib/content/queries'

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
    const page = await getPage(slug)
    if (!page) {
      return jsonResponse({ error: 'Page not found', slug }, 404)
    }

    const isPreview = request.nextUrl.searchParams.get('preview') === 'true'
    if (page.status && page.status !== 'published' && !isPreview) {
      return jsonResponse({ error: 'Page not found', slug }, 404)
    }

    return jsonResponse({ page })
  } catch (err) {
    console.error(`[delivery:pages:${slug}] Error:`, err)
    return jsonResponse({ error: 'Failed to retrieve page' }, 500)
  }
}
