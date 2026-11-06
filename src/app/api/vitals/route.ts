import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordRumVital } from '@/lib/seo/pagespeed'
import { checkRateLimit, clientKey, rateLimitResponse } from '@/lib/security/rate-limit'

/** Public RUM beacon: strict shape, bounded values, per-IP rate limit. */
const vitalSchema = z.object({
  path: z.string().trim().startsWith('/').max(500).default('/'),
  metricName: z.enum(['LCP', 'INP', 'CLS', 'FCP', 'TTFB']),
  value: z.number().finite().min(0).max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
})

export async function POST(request: NextRequest) {
  const rl = checkRateLimit({ key: clientKey(request, 'vitals'), limit: 60, windowMs: 60_000 })
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

  const raw = await request.json().catch(() => null)
  const parsed = vitalSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'metricName and value required' }, { status: 400 })
  }

  try {
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || undefined
    await recordRumVital({ ...parsed.data, userAgent })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[vitals] Failed to record RUM vital', err)
    return NextResponse.json({ success: false, error: 'Metrik tidak dapat disimpan.' }, { status: 500 })
  }
}
