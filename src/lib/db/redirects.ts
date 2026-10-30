import 'server-only'
import { prisma } from './prisma'
import type { Redirect } from '../content/types'

function normalizePath(p: string): string {
  if (!p) return '/'
  let clean = p.trim().toLowerCase()
  if (!clean.startsWith('/')) clean = '/' + clean
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1)
  }
  return clean
}

export async function getRedirect(rawPath: string): Promise<Redirect | null> {
  const normalized = normalizePath(rawPath)
  const trailing = normalized === '/' ? '/' : normalized + '/'

  try {
    const rows = await prisma.orm.public.Redirect.where({ active: true }).all()

    const match = rows.find((r: any) => {
      // Prevent self-redirect loop: never redirect if already on destination
      if (r.destinationPath === rawPath) return false
      if (rawPath === normalizePath(r.destinationPath)) return false

      return (
        r.sourcePath === rawPath ||
        r.sourcePath === trailing ||
        (normalizePath(r.sourcePath) === normalized && r.destinationPath !== normalized)
      )
    })

    if (!match) return null

    // Increment hit count asynchronously
    prisma.orm.public.Redirect
      .where({ id: match.id })
      .update({ hitCount: (match.hitCount || 0) + 1 })
      .catch(() => {})

    return {
      id: match.id,
      documentId: `red-${match.id}`,
      sourcePath: match.sourcePath,
      destinationPath: match.destinationPath,
      statusCode: match.statusCode,
      active: Boolean(match.active),
      reason: match.reason || undefined,
    }
  } catch (err) {
    return null
  }
}

export async function getAllRedirects(): Promise<Redirect[]> {
  try {
    const rows = await prisma.orm.public.Redirect.all()
    return rows.map((r: any) => ({
      id: r.id,
      documentId: `red-${r.id}`,
      sourcePath: r.sourcePath,
      destinationPath: r.destinationPath,
      statusCode: r.statusCode,
      active: Boolean(r.active),
      reason: r.reason || undefined,
    }))
  } catch {
    return []
  }
}

export async function createRedirect(data: {
  sourcePath: string
  destinationPath: string
  statusCode?: number
  reason?: string
}) {
  try {
    return await prisma.orm.public.Redirect.upsert({
        conflictOn: { sourcePath: data.sourcePath },
        update: {
          destinationPath: data.destinationPath,
          statusCode: data.statusCode || 301,
          reason: data.reason || 'Manual redirect',
        },
        create: {
          sourcePath: data.sourcePath,
          destinationPath: data.destinationPath,
          statusCode: data.statusCode || 301,
          reason: data.reason || 'Manual redirect',
          active: true,
        },
      }
    )
  } catch (err) {
    console.error('Failed to create redirect:', err)
    throw err
  }
}
