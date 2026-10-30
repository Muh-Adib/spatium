import { NextRequest, NextResponse } from 'next/server'
import { runInternalDatabaseAudit, getLatestAuditReport } from '@/lib/seo/site-audit'
import { runLiveCrawler } from '@/lib/seo/crawler'
import { requireUser } from '@/lib/auth/rbac'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const report = await getLatestAuditReport()
    return NextResponse.json({
      data: report,
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal memuat hasil audit SEO.'] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const type = body.type || 'internal_db'

    if (type === 'live_crawl') {
      const baseUrl = body.baseUrl
      const maxPages = body.maxPages || 30
      const crawlReport = await runLiveCrawler({ baseUrl, maxPages })
      return NextResponse.json({
        data: crawlReport,
        message: `Live crawl berhasil dijalankan pada ${crawlReport.crawledPages} halaman.`,
        errors: [],
        warnings: [],
      })
    }

    // Default: Layer 1 In-Database Audit
    const auditReport = await runInternalDatabaseAudit()
    return NextResponse.json({
      data: auditReport,
      message: `Audit data internal berhasil diselesaikan. Ditemukan ${auditReport.summary.totalIssues} isu (${auditReport.summary.criticalCount} kritis).`,
      errors: [],
      warnings: [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, errors: [err.message || 'Gagal menjalankan audit situs.'] },
      { status: 500 }
    )
  }
}
