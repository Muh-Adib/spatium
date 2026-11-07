import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { requireCan } from '@/lib/auth/capabilities'

/**
 * The proxy lists this route as public (webhook), so it skips the same-origin
 * mutation check; the session path enforces it here instead.
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('host') || request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '')
  try {
    return new URL(origin).origin === `${protocol}://${host}`
  } catch (err) {
    console.warn('[Revalidate API] Malformed Origin header', err)
    return false
  }
}

/**
 * Timing-safe string comparison to prevent timing side-channel attacks.
 */
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf-8')
    const bufB = Buffer.from(b, 'utf-8')
    if (bufA.length !== bufB.length) {
      return false
    }
    return crypto.timingSafeEqual(bufA, bufB)
  } catch (err) {
    console.warn('[Revalidate API] Secret comparison failed', err)
    return false
  }
}

export interface GenericRevalidatePayload {
  tag?: string | string[]
  tags?: string[]
  path?: string | string[]
  entity?: 'article' | 'service' | 'portfolio' | 'page' | 'setting' | 'redirect' | string
  slug?: string
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const incomingSecret =
    request.headers.get('x-revalidate-secret') ||
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    searchParams.get('secret') ||
    ''

  if (incomingSecret) {
    // 1a. Webhook: pre-shared secret compared with timingSafeEqual
    const expectedSecret = process.env.REVALIDATE_SECRET || process.env.WEBHOOK_SECRET
    if (!expectedSecret) {
      console.error('[Revalidate API] REVALIDATE_SECRET is not configured on the server.')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Revalidation endpoint is not configured.' },
        { status: 401 }
      )
    }
    if (!secureCompare(incomingSecret, expectedSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Kunci rahasia revalidasi tidak valid atau tidak disertakan.' },
        { status: 401 }
      )
    }
  } else {
    // 1b. Studio "flush cache": signed-in admin, same-origin request only
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Origin permintaan tidak diizinkan.' }, { status: 403 })
    }
    const auth = await requireCan(request, 'system:manage')
    if (auth.error) return auth.error
  }

  // 2. Process generic revalidation payload
  try {
    const body: GenericRevalidatePayload = await request.json().catch(() => ({}))
    const revalidatedTags: string[] = []
    const revalidatedPaths: string[] = []

    // A. Revalidate explicit tags
    const directTags = body.tags || (body.tag ? (Array.isArray(body.tag) ? body.tag : [body.tag]) : [])
    for (const tag of directTags) {
      if (typeof tag === 'string' && tag.trim()) {
        try {
          revalidateTag(tag.trim(), { expire: 0 })
          revalidatedTags.push(tag.trim())
        } catch (err) { console.warn("[API observable error]:", err) }
      }
    }

    // B. Revalidate explicit paths
    const directPaths = body.path ? (Array.isArray(body.path) ? body.path : [body.path]) : []
    for (const p of directPaths) {
      if (typeof p === 'string' && p.trim()) {
        try {
          revalidatePath(p.trim())
          revalidatedPaths.push(p.trim())
        } catch (err) { console.warn("[API observable error]:", err) }
      }
    }

    // C. Revalidate by entity & slug
    if (body.entity) {
      const slug = body.slug ? String(body.slug).trim() : ''
      const safeTag = (t: string) => {
        try { revalidateTag(t, { expire: 0 }) } catch (err) { console.warn('[revalidate/cache error]:', err) }
        revalidatedTags.push(t)
      }
      const safePath = (p: string) => {
        try { revalidatePath(p) } catch (err) { console.warn('[revalidate/cache error]:', err) }
        revalidatedPaths.push(p)
      }

      switch (body.entity) {
        case 'article':
          safeTag('articles')
          if (slug) {
            safeTag(`article-${slug}`)
            safePath(`/journal/${slug}`)
          }
          break
        case 'service':
          safeTag('services')
          if (slug) {
            safeTag(`service-${slug}`)
            safePath(`/services/${slug}`)
          }
          break
        case 'portfolio':
          safeTag('portfolio')
          if (slug) {
            safeTag(`portfolio-${slug}`)
            safePath(`/portfolio/${slug}`)
          }
          break
        case 'page':
          safeTag('pages')
          if (slug) {
            safePath(`/${slug}`)
          }
          break
        case 'setting':
          safeTag('site-settings')
          break
        case 'redirect':
          safeTag('redirects')
          break
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      revalidatedTags,
      revalidatedPaths,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Revalidate API] Revalidation failed', err)
    return NextResponse.json(
      { error: 'Gagal memproses revalidasi cache' },
      { status: 500 }
    )
  }
}
