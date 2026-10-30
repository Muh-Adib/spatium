import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireUser } from '@/lib/auth/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    let job = null

    if (jobId) {
      job = await prisma.orm.public.ImportJob.where({ id: jobId }).first()
    } else {
      const rows = await prisma.orm.public.ImportJob.orderBy((j: any) => j.createdAt.desc()).limit(1).all()
      job = rows[0] || null
    }

    // Get live counts from DB for verification
    const [artCount, pageCount, redirCount] = await Promise.all([
      prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Page.aggregate((p: any) => ({ count: p.count() })),
      prisma.orm.public.Redirect.aggregate((r: any) => ({ count: r.count() })),
    ])

    let parsedReport: any = {}
    if (job?.report) {
      try {
        parsedReport = JSON.parse(job.report)
      } catch {
        parsedReport = { raw: job.report }
      }
    }

    return NextResponse.json({
      success: true,
      job: job
        ? {
            id: job.id,
            source: job.source,
            sourceUrl: job.sourceUrl,
            status: job.status,
            totalPosts: job.totalPosts,
            imported: job.imported,
            skipped: job.skipped,
            errors: job.errors,
            startedAt: job.startedAt,
            finishedAt: job.finishedAt,
            currentStep: parsedReport.currentStep || null,
            recentLogs: parsedReport.recentLogs || [],
            importedPages: parsedReport.importedPages || 0,
            conflicts: parsedReport.conflicts || 0,
            coverage: parsedReport.coverage || 'unknown',
            details: parsedReport.errors || [],
          }
        : null,
      stats: {
        articlesCount: artCount?.count || 0,
        pagesCount: pageCount?.count || 0,
        redirectsCount: redirCount?.count || 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memeriksa status migrasi.' },
      { status: 500 }
    )
  }
}
