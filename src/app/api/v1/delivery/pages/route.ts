import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getPages } from '@/lib/content/queries'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const searchParams = request.nextUrl.searchParams
  const statusParam = searchParams.get('status')
  const status =
    statusParam === 'draft' || statusParam === 'published' || statusParam === 'all'
      ? statusParam
      : 'published'

  try {
    let pages = await getPages()
    if (status !== 'all') {
      pages = pages.filter((p) => (p.status || 'published') === status)
    }
    return jsonResponse({ pages })
  } catch (err) {
    console.error('[delivery:pages] Error:', err)
    return jsonResponse({ error: 'Failed to retrieve pages' }, 500)
  }
}
