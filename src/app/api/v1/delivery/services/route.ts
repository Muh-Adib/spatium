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
    let [services, categories] = await Promise.all([
      getServices(limit),
      getServiceCategories(),
    ])

    if (!services || services.length === 0) {
      try {
        const seedServices = require('@/data/seed/seed_services.json')
        services = limit ? seedServices.slice(0, limit) : seedServices
      } catch {}
    }

    return jsonResponse({ services, categories })
  } catch (err) {
    console.error('[delivery:services] Error:', err)
    try {
      const seedServices = require('@/data/seed/seed_services.json')
      return jsonResponse({ services: limit ? seedServices.slice(0, limit) : seedServices, categories: [] })
    } catch {
      return jsonResponse({ error: 'Failed to retrieve services' }, 500)
    }
  }
}
