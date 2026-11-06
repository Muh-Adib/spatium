import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/** Fail the probe instead of hanging when the database stops answering. */
const DB_TIMEOUT_MS = 3000

/**
 * The driver query cannot be cancelled, so a timed-out probe keeps its pooled connection
 * until the database answers. Reuse that in-flight query instead of starting another one,
 * so a hung database holds at most one connection for health checks.
 */
let inFlight: Promise<unknown> | null = null

async function probeDatabase(): Promise<boolean> {
  if (!inFlight) {
    // Promise.resolve runs a lazy query builder exactly once and gives a real, shareable promise.
    const query: Promise<unknown> = Promise.resolve(prisma.orm.public.Site.first())
    inFlight = query
    query.then(
      () => { if (inFlight === query) inFlight = null },
      () => { if (inFlight === query) inFlight = null },
    )
  }
  const pending = inFlight

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`database probe timed out after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS)
  })
  try {
    await Promise.race([pending, timeout])
    return true
  } catch (error) {
    console.error('[health] database probe failed:', error instanceof Error ? error.message : error)
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Liveness + readiness probe for Docker/Coolify (docker-compose.yml, Dockerfile HEALTHCHECK).
 * Returns 200 only when the process is up and the database answers; 503 otherwise,
 * so the container is marked unhealthy while the database is down.
 */
export async function GET() {
  const startedAt = Date.now()
  const dbOk = await probeDatabase()

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
