/**
 * Per-key token bucket for `/api/mcp`.
 *
 * In-memory and per server process: good enough for a single Node instance
 * (the current deployment). With several replicas each one enforces its own
 * bucket, so the effective limit multiplies by the replica count; move this to
 * Redis/Postgres if the app is ever scaled out.
 *
 * Defaults: burst of 60 JSON-RPC messages, refilling 1 per second (60/min).
 */
export type RateLimitDecision = { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number }

export class TokenBucketLimiter {
  private readonly buckets = new Map<string, { tokens: number; updatedAt: number }>()

  constructor(
    private readonly capacity = 60,
    private readonly refillPerSecond = 1,
    private readonly maxKeys = 10_000,
  ) {}

  take(key: string, cost = 1, now = Date.now()): RateLimitDecision {
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now }
    const elapsed = Math.max(0, now - bucket.updatedAt) / 1000
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerSecond)
    bucket.updatedAt = now
    if (!this.buckets.has(key)) this.evictIfFull()
    this.buckets.set(key, bucket)
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost
      return { allowed: true, remaining: Math.floor(bucket.tokens) }
    }
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((cost - bucket.tokens) / this.refillPerSecond)) }
  }

  reset(key?: string): void {
    if (key) this.buckets.delete(key)
    else this.buckets.clear()
  }

  private evictIfFull(): void {
    if (this.buckets.size < this.maxKeys) return
    const oldest = this.buckets.keys().next()
    if (!oldest.done) this.buckets.delete(oldest.value)
  }
}

export const mcpRateLimiter = new TokenBucketLimiter()
