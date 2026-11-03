import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * Liveness + readiness probe for Docker/Coolify.
 * Returns 200 only when the process is up and the database answers.
 */
export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  try {
    await prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() }))
    dbOk = true
  } catch {
    dbOk = false
  }

  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      latencyMs: Date.now() - startedAt,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
