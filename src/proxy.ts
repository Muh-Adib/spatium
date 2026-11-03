import { ALLOWED_EMBED_DOMAINS } from '@/lib/media/embedValidator'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getValidatedAuthSecret, validateBearerToken } from '@/lib/auth/secret'

export interface PublicApiRule {
  path: string
  methods: string[]
  reason: string
  exact?: boolean
}

/**
 * Explicit whitelist of publicly accessible API routes (P0.2)
 * All other /api/** routes require an active authenticated session.
 */
export const PUBLIC_API_RULES: PublicApiRule[] = [
  {
    path: '/api/auth',
    methods: ['GET', 'POST'],
    reason: 'NextAuth authentication lifecycle (signin, callback, csrf, session)',
    exact: false,
  },
  {
    path: '/api/health',
    methods: ['GET'],
    reason: 'Container liveness/readiness probe for Docker & Coolify healthchecks',
    exact: true,
  },
  {
    path: '/api/vitals',
    methods: ['POST'],
    reason: 'Public Core Web Vitals RUM metrics collection from end-user browsers',
    exact: true,
  },
  {
    path: '/api/indexnow/key',
    methods: ['GET'],
    reason: 'Search engine crawler validation key for IndexNow protocol',
    exact: true,
  },
  {
    path: '/api/revalidate',
    methods: ['POST'],
    reason: 'On-demand ISR webhook revalidation, protected internally via secret token',
    exact: true,
  },
  {
    path: '/api/navigation',
    methods: ['GET'],
    reason: 'Public site header and menu navigation data lookup',
    exact: true,
  },
  {
    path: '/api/theme/tokens',
    methods: ['GET'],
    reason: 'Active theme tokens and presets lookup',
    exact: true,
  },
  {
    path: '/api/locations',
    methods: ['GET'],
    reason: 'Public locations lookup for city landing pages and search',
    exact: true,
  },
  {
    path: '/api/v1/delivery',
    methods: ['GET', 'OPTIONS'],
    reason: 'Public Delivery API for satellite frontends, authenticated via x-site-key',
    exact: false,
  },
  {
    path: '/api/openapi.json',
    methods: ['GET', 'OPTIONS'],
    reason: 'OpenAPI 3.1 specification for satellite SDK and API discovery',
    exact: true,
  },
  {
    path: '/api/blocks/manifest',
    methods: ['GET', 'OPTIONS'],
    reason: 'Public Block Manifest for CMS & AI Agent page builder discovery',
    exact: true,
  },
]

export function isPublicApi(pathname: string, method: string): boolean {
  const normMethod = method.toUpperCase()
  return PUBLIC_API_RULES.some((rule) => {
    const allowsMethod =
      rule.methods.includes(normMethod) ||
      (normMethod === 'HEAD' && rule.methods.includes('GET'))
    if (!allowsMethod) {
      return false
    }
    if (rule.exact) {
      return pathname === rule.path
    }
    return pathname === rule.path || pathname.startsWith(rule.path + '/')
  })
}

async function routeProxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // 1. Guard /api/** routes
  if (pathname.startsWith('/api')) {
    if (isPublicApi(pathname, method)) {
      return NextResponse.next()
    }

    // Check for valid Bearer token (MCP / API client automation)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7).trim()
      if (validateBearerToken(bearerToken)) {
        return NextResponse.next()
      }
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const origin = request.headers.get('origin')
      if (origin) {
        const host = request.headers.get('host') || request.nextUrl.host
        const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '')
        let allowed = false
        try { allowed = new URL(origin).origin === `${protocol}://${host}` } catch { /* reject malformed origins */ }
        if (!allowed) return NextResponse.json({ error: 'Origin permintaan tidak diizinkan.' }, { status: 403 })
      }
    }

    // Check for valid NextAuth JWT session
    let token = null
    try {
      token = await getToken({
        req: request,
        secret: getValidatedAuthSecret(),
      secureCookie: request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
      })
    } catch {
      token = null
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication session required to access this endpoint.',
          path: pathname,
        },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // 2. Guard /admin/** routes
  if (pathname.startsWith('/admin')) {
    // Login page is public
    if (pathname === '/admin/login' || pathname === '/admin/login/') {
      return NextResponse.next()
    }

    let token = null
    try {
      token = await getToken({
        req: request,
        secret: getValidatedAuthSecret(),
      secureCookie: request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
      })
    } catch {
      token = null
    }

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

const loginAttempts = new Map<string, { count: number; expiresAt: number }>()
export function loginRateLimit(request: NextRequest, now = Date.now()): number | null {
  if (request.method !== 'POST' || request.nextUrl.pathname !== '/api/auth/callback/credentials') return null
  // Deployment reverse proxy (Coolify/Traefik) sets X-Real-IP; do not trust a client-provided X-Forwarded-For chain.
  const key = request.headers.get('x-real-ip') || 'direct-connection'
  const current = loginAttempts.get(key)
  if (!current || current.expiresAt <= now) {
    if (loginAttempts.size >= 10_000) {
      for (const [ip, entry] of loginAttempts) if (entry.expiresAt <= now) loginAttempts.delete(ip)
      if (loginAttempts.size >= 10_000) loginAttempts.delete(loginAttempts.keys().next().value!)
    }
    loginAttempts.set(key, { count: 1, expiresAt: now + 15 * 60_000 })
    return null
  }
  current.count++
  return current.count > 20 ? Math.ceil((current.expiresAt - now) / 1000) : null
}

export async function proxy(request: NextRequest) {
  const retryAfter = loginRateLimit(request)
  const response = retryAfter ? NextResponse.json({ error: 'Terlalu banyak percobaan login. Coba kembali nanti.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } }) : await routeProxy(request)
  const developmentEval = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"
  const frames = ALLOWED_EMBED_DOMAINS.map((domain) => `https://${domain}`).join(' ')
  const isDocs = request.nextUrl.pathname.startsWith('/docs')
  const docsScriptSrc = isDocs ? ' https://cdn.jsdelivr.net https://unpkg.com' : ''
  const docsStyleSrc = isDocs ? ' https://cdn.jsdelivr.net https://unpkg.com' : ''
  response.headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentEval}${docsScriptSrc} https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'${docsStyleSrc} https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' https:; connect-src 'self' https://www.google-analytics.com https://analytics.google.com; frame-src 'self' ${frames} https://www.googletagmanager.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'`)
  if (process.env.NEXT_PUBLIC_EMPTY_CONTENT_PREVIEW === 'true') response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
  if (request.nextUrl.protocol === 'https:') response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  if (request.nextUrl.pathname.startsWith('/uploads/')) response.headers.set('Content-Disposition', 'inline')
  return response
}

export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
