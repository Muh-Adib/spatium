import { NextRequest, NextResponse } from 'next/server'
import { recordRumVital } from '@/lib/seo/pagespeed'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: pagePath = '/', metricName, value, rating } = body

    if (!metricName || typeof value !== 'number') {
      return NextResponse.json({ success: false, error: 'metricName and value required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || undefined
    await recordRumVital({
      path: pagePath,
      metricName,
      value,
      rating,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
