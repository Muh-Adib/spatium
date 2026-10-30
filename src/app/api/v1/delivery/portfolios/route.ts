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
  const limitParam = searchParams.get('limit') || searchParams.get('pageSize')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  try {
    let portfolios = await getPortfolios(limit)
    if (!portfolios || portfolios.length === 0) {
      try {
        const seedPortfolio = require('@/data/seed/seed_portfolio.json')
        portfolios = limit ? seedPortfolio.slice(0, limit) : seedPortfolio
      } catch {}
    }
    return jsonResponse({ portfolios })
  } catch (err) {
    console.error('[delivery:portfolios] Error:', err)
    try {
      const seedPortfolio = require('@/data/seed/seed_portfolio.json')
      return jsonResponse({ portfolios: limit ? seedPortfolio.slice(0, limit) : seedPortfolio })
    } catch {
      return jsonResponse({ error: 'Failed to retrieve portfolios' }, 500)
    }
  }
}
