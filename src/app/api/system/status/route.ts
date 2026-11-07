import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth/rbac'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const startTime = Date.now()
  let isOnline = false
  let latency = 0
  let articleCount = 0
  let portfolioCount = 0
  let serviceCount = 0
  let serviceCategoryCount = 0
  let pageCount = 0
  let redirectCount = 0

  try {
    const [artRes, portRes, svcRes, catRes, pageRes, redRes] = await Promise.all([
      prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Portfolio.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Service.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.ServiceCategory.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Page.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Redirect.aggregate((a: any) => ({ count: a.count() })),
    ])

    articleCount = Number(artRes?.count || 0)
    portfolioCount = Number(portRes?.count || 0)
    serviceCount = Number(svcRes?.count || 0)
    serviceCategoryCount = Number(catRes?.count || 0)
    pageCount = Number(pageRes?.count || 0)
    redirectCount = Number(redRes?.count || 0)

    latency = Date.now() - startTime
    isOnline = true
  } catch (err) {
    console.error('[metric:database_health_failure] Content count queries failed', err)
    return NextResponse.json({
      online: false, latency: null, counts: null, contentTypes: [],
      engine: 'Prisma v8 ORM (@prisma/orm-postgres)', database: 'PostgreSQL',
      architecture: 'Next.js App Router', fallbackActive: false,
      checkedAt: new Date().toISOString(),
      message: 'Pemeriksaan database gagal. Jumlah konten belum dapat diverifikasi.',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({
    online: isOnline,
    latency: `${latency}ms`,
    engine: 'Prisma v8 ORM (@prisma/orm-postgres)',
    database: 'PostgreSQL',
    checkedAt: new Date().toISOString(),
    architecture: 'Full-Stack Next.js 16 (App Router + Turbopack)',
    counts: {
      articles: articleCount,
      portfolios: portfolioCount,
      services: serviceCount,
      serviceCategories: serviceCategoryCount,
      pages: pageCount,
      redirects: redirectCount,
    },
    contentTypes: [
      { name: 'Articles', count: articleCount, status: 'Active (PostgreSQL)' },
      { name: 'Portfolios', count: portfolioCount, status: 'Active (PostgreSQL)' },
      { name: 'Services', count: serviceCount, status: 'Active (PostgreSQL)' },
      { name: 'ServiceCategories', count: serviceCategoryCount, status: 'Active (PostgreSQL)' },
      { name: 'Pages', count: pageCount, status: 'Active (PostgreSQL)' },
      { name: 'Redirects', count: redirectCount, status: 'Active (PostgreSQL)' },
    ],
    fallbackActive: false,
    message: isOnline
      ? 'Database PostgreSQL terhubung via Prisma v8 ORM.'
      : 'Koneksi database PostgreSQL sedang mengalami kendala.',
  }, { headers: { 'Cache-Control': 'no-store' } })
}

import { requireCan } from '@/lib/auth/capabilities'

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'system:manage')
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || 'sync'

    const [artRes, portRes, redRes] = await Promise.all([
      prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Portfolio.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Redirect.aggregate((a: any) => ({ count: a.count() })),
    ])

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      message: 'Koneksi database dan jumlah artikel, portofolio, serta redirect berhasil diperiksa.',
      syncedItems: {
        articles: artRes?.count || 0,
        portfolios: portRes?.count || 0,
        redirects: redRes?.count || 0,
      },
    })
  } catch (err) {
    console.error('[metric:database_health_failure] Database verification failed', err)
    return NextResponse.json(
      { error: 'Gagal melakukan verifikasi database' },
      { status: 500 }
    )
  }
}
