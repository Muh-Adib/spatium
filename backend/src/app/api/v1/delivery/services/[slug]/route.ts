import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getServiceWithDetails } from '@/lib/db/services'

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
    const service = await getServiceWithDetails(slug)
    if (!service) {
      return jsonResponse({ error: 'Service not found', slug }, 404)
    }

    return jsonResponse({ service })
  } catch (err) {
    console.error(`[delivery:services:${slug}] Error:`, err)
    return jsonResponse({ error: 'Failed to retrieve service' }, 500)
  }
}
