import { NextRequest, NextResponse } from 'next/server'
import { getSiteByApiKey, type SiteEntity } from '@/lib/db/site'
import { validateBearerToken } from '@/lib/auth/secret'
import { corsHeaders } from './cors'

export async function authenticateDeliveryRequest(
  request: NextRequest
): Promise<{ site: SiteEntity } | { response: NextResponse }> {
  let siteKey = request.headers.get('x-site-key')
  if (!siteKey) {
    siteKey = request.nextUrl.searchParams.get('siteKey')
  }

  // Support Bearer token fallback for MCP / Admin server calls
  if (!siteKey) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim()
      if (validateBearerToken(token)) {
        return {
          site: {
            id: 1,
            slug: 'internal-admin',
            name: 'Internal System Admin',
            domain: null,
            apiKey: 'bearer-token',
            webhookUrl: null,
            webhookSecret: null,
            isActive: true,
          },
        }
      }
    }
  }


  if (!siteKey) {
    return {
      response: NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Missing x-site-key header. Please provide valid x-site-key to access Delivery API.',
        },
        {
          status: 401,
          headers: {
            ...corsHeaders(),
            'Cache-Control': 'no-store',
          },
        }
      ),
    }
  }

  const site = await getSiteByApiKey(siteKey)
  if (!site) {
    return {
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Invalid or inactive x-site-key.',
        },
        {
          status: 403,
          headers: {
            ...corsHeaders(),
            'Cache-Control': 'no-store',
          },
        }
      ),
    }
  }

  return { site }
}

