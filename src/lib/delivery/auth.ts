import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getSiteByApiKey, type SiteEntity } from '@/lib/db/site'
import { validateBearerToken } from '@/lib/auth/secret'
import { corsHeaders } from './cors'

const PLACEHOLDER_KEYS = new Set(['segia-default-key', 'site_sec_default', 'default', 'changeme', 'test'])
function isPlaceholderKey(key: string): boolean {
  const k = key.trim().toLowerCase()
  return PLACEHOLDER_KEYS.has(k) || k.length < 16
}
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a); const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

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

  if (process.env.NODE_ENV === 'production' && isPlaceholderKey(siteKey)) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Placeholder or weak site key rejected in production.' },
        { status: 401, headers: { ...corsHeaders(), 'Cache-Control': 'no-store' } }
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

  if (!timingSafeEqualStr(String((site as { apiKey?: string }).apiKey ?? ''), siteKey)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Invalid x-site-key.' },
        { status: 403, headers: { ...corsHeaders(), 'Cache-Control': 'no-store' } }
      ),
    }
  }

  return { site }
}

