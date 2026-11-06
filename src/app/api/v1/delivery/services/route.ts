import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getServices } from '@/lib/db/services'
import { getServiceCategories } from '@/lib/db/serviceCategories'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get('limit') || searchParams.get('pageSize')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  try {
    const [services, categories] = await Promise.all([
      getServices(limit, { publishedOnly: true }),
      getServiceCategories({ publishedOnly: true }),
    ])
    return jsonResponse({ services, categories })
  } catch (err) {
    console.error('[delivery:services] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve services' }, 500)
  }
}
