import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPageSpeedAudit, getPageSpeedHistory, getRumAggregates } from '@/lib/seo/pagespeed'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { SEO_TOOL_ROLES } from '@/lib/seo/access'
import { resolveSameSiteUrl } from '@/lib/seo/site-url'
import { publicMessage } from '@/lib/http/errors'

const perfRunSchema = z.object({
  url: z.string().trim().max(2000).optional(),
  device: z.enum(['mobile', 'desktop']).default('mobile'),
})

// PageSpeed runs spend the site's Google API quota, so only URLs on the
// configured site are accepted (resolveSameSiteUrl).

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const history = await getPageSpeedHistory(10)
    const rum = await getRumAggregates()
    return NextResponse.json({
      data: {
        history,
        rumAggregates: rum,
      },
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[perf] Failed to load performance history', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal memuat riwayat performa.')] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, SEO_TOOL_ROLES)
  if (auth.error) return auth.error

  const raw = await request.json().catch(() => ({}))
  const parsed = perfRunSchema.safeParse(raw ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, errors: parsed.error.issues.map((i) => i.message), warnings: [] },
      { status: 400 }
    )
  }

  try {
    const { device } = parsed.data
    const siteUrl = (await getSiteProfile()).url
    const url = resolveSameSiteUrl(parsed.data.url, siteUrl)
    if (!url) {
      return NextResponse.json(
        {
          data: null,
          errors: [`Audit PageSpeed hanya untuk URL di ${new URL(siteUrl).hostname}.`],
          warnings: [],
        },
        { status: 400 }
      )
    }

    const result = await runPageSpeedAudit(url, device)
    if (!result.connected) {
      return NextResponse.json({
        data: null,
        connected: false,
        reason: result.reason,
        howToConnect: result.howToConnect,
        message: result.reason,
        errors: [result.reason],
        warnings: [],
      })
    }

    return NextResponse.json({
      data: result.data,
      connected: true,
      message: `Audit PageSpeed (${device}) berhasil dicatat. Performance: ${result.data.performanceScore}, SEO: ${result.data.seoScore}.`,
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[perf] PageSpeed run failed', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal menjalankan audit PageSpeed.')] },
      { status: 500 }
    )
  }
}
