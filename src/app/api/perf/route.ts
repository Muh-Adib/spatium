import { NextRequest, NextResponse } from 'next/server'
import { runPageSpeedAudit, getPageSpeedHistory, getRumAggregates } from '@/lib/seo/pagespeed'
import { requireUser } from '@/lib/auth/rbac'

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
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memuat riwayat performa.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const url = body.url
    const device = body.device || 'mobile'

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
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal menjalankan audit PageSpeed.'] },
      { status: 500 }
    )
  }
}
