import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getPortfolios } from '@/lib/db/portfolio'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  try {
    const portfolios = await getPortfolios(limit)
    return jsonResponse({ portfolios })
  } catch (err) {
    console.error('[delivery:portfolios] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve portfolios' }, 500)
  }
}
