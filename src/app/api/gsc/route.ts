import { NextRequest, NextResponse } from 'next/server'
import {
  getGscOverview,
  getGscTopQueries,
  getGscPages,
  getGscDevices,
  getGscCountries,
} from '@/lib/gsc/queries'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { syncGscDaily } from '@/lib/gsc/sync'
import { requireUser } from '@/lib/auth/rbac'
import { requireCan } from '@/lib/auth/capabilities'
import { publicMessage } from '@/lib/http/errors'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'
    const siteUrl = (await getSiteProfile()).url

    if (type === 'queries') {
      const queries = await getGscTopQueries(50, siteUrl)
      return NextResponse.json({ success: true, queries })
    }

    if (type === 'pages') {
      const pages = await getGscPages(50, siteUrl)
      return NextResponse.json({ success: true, pages })
    }

    if (type === 'devices') {
      const devices = await getGscDevices(siteUrl)
      return NextResponse.json({ success: true, devices })
    }

    if (type === 'countries') {
      const countries = await getGscCountries(50, siteUrl)
      return NextResponse.json({ success: true, countries })
    }

    if (type === 'overview') {
      const overview = await getGscOverview(siteUrl)
      return NextResponse.json({ success: true, overview })
    }

    // Default 'all': fetch overview, queries, pages, devices, countries concurrently
    const [overview, queries, pages, devices, countries] = await Promise.all([
      getGscOverview(siteUrl),
      getGscTopQueries(50, siteUrl),
      getGscPages(50, siteUrl),
      getGscDevices(siteUrl),
      getGscCountries(50, siteUrl),
    ])

    return NextResponse.json({
      success: true,
      siteUrl,
      overview,
      queries,
      pages,
      devices,
      countries,
    })
  } catch (error) {
    console.error('[gsc] Failed to load Search Console data', error)
    return NextResponse.json({ error: publicMessage(error, 'Data Search Console tidak dapat dimuat.') }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCan(req, 'seo:manage')
  if (auth.error) return auth.error

  try {
    const body = await req.json().catch(() => ({}))
    const siteUrl = (await getSiteProfile()).url
    if (body.siteUrl && body.siteUrl !== siteUrl) return NextResponse.json({ error: 'Properti GSC harus sesuai situs yang dikonfigurasi.' }, { status: 400 })
    const daysBack = Number(body.daysBack) || 28
    if (!Number.isInteger(daysBack) || daysBack < 1 || daysBack > 90) return NextResponse.json({ error: 'Periode sinkronisasi harus 1–90 hari.' }, { status: 400 })

    const syncResult = await syncGscDaily(siteUrl, daysBack)
    return NextResponse.json({ success: true, result: syncResult })
  } catch (error) {
    console.error('[gsc] Sync request failed', error)
    return NextResponse.json({ error: publicMessage(error, 'Gagal menjalankan sinkronisasi GSC') }, { status: 500 })
  }
}
