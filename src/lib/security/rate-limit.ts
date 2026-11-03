/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single Next.js instance. For multi-replica deployments swap
 * the store for Redis/Upstash — the call signature stays the same.
 *
 * ponytail: in-process Map, per-instance only. Upgrade to Redis when running
 * more than one replica.
 */

interface Bucket {
  hits: number[]
}

const store = new Map<string, Bucket>()

export interface RateLimitOptions {
  /** Bucket key, e.g. `ai:${userId}` or `login:${ip}`. */
  key: string
  /** Max requests allowed inside the window. */
  limit: number
  /** Window size in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    store.set(key, bucket)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    }
  }

  bucket.hits.push(now)
  store.set(key, bucket)

  // Opportunistic cleanup to keep the map bounded.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (b.hits.every((t) => now - t >= windowMs)) store.delete(k)
    }
  }

  return { allowed: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 }
}

/** Best-effort client identifier from proxy headers. */
export function clientKey(request: Request, prefix: string): string {
  const h = request.headers
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  return `${prefix}:${ip}`
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
