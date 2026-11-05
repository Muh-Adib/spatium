import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getClientLogos } from '@/lib/db/clientLogos'

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
    const dbLogos = await getClientLogos()
    const list = limit ? dbLogos.slice(0, limit) : dbLogos
    return jsonResponse({
      data: list,
      meta: {
        total: dbLogos.length,
        count: list.length,
      }
    })
  } catch (err) {
    console.error('[delivery:partners] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve partners' }, 500)
  }
}
