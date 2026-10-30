import { NextRequest } from 'next/server'
import { authenticateDeliveryRequest } from '@/lib/delivery/auth'
import { jsonResponse, handleOptions } from '@/lib/delivery/cors'
import { getRedirect } from '@/lib/db/redirects'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  const auth = await authenticateDeliveryRequest(request)
  if ('response' in auth) return auth.response

  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return jsonResponse({ error: 'Query parameter "path" is required' }, 400)
  }

  try {
    const redirect = await getRedirect(path)
    return jsonResponse({
      redirect: redirect
        ? {
            sourcePath: redirect.sourcePath,
            destinationPath: redirect.destinationPath,
            statusCode: redirect.statusCode,
          }
        : null,
    })
  } catch (err) {
    console.error(`[delivery:redirects:${path}] Error:`, err)
    return jsonResponse({ error: 'Failed to lookup redirect' }, 500)
  }
}
