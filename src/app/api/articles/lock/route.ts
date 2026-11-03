import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/rbac'
import {
  getArticleLock,
  acquireOrRefreshLock,
  releaseArticleLock,
} from '@/lib/articles/locks'

export const dynamic = 'force-dynamic'

/**
 * GET /api/articles/lock?slug=...
 * Check if an article is currently being edited by another user.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug artikel tidak disertakan.' }, { status: 400 })
  }

  const status = getArticleLock(slug, auth.user.id)
  return NextResponse.json(status)
}

/**
 * POST /api/articles/lock
 * Acquire or refresh heartbeat lock for the authenticated editor.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const { slug } = body

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug artikel tidak valid.' }, { status: 400 })
    }

    const result = acquireOrRefreshLock(slug, {
      id: auth.user.id,
      name: auth.user.name || 'Editor',
      email: auth.user.email || '',
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Artikel sedang diedit oleh editor lain.',
          isLockedByOther: true,
          lockedBy: {
            name: result.lock.userName,
            email: result.lock.userEmail,
            expiresAt: result.lock.expiresAt,
          },
        },
        { status: 423 } // Locked
      )
    }

    return NextResponse.json({
      success: true,
      acquired: true,
      expiresAt: result.lock.expiresAt,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Gagal memperbarui lock editor.', details: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/articles/lock?slug=...
 * Release lock when editor closes the tab or saves.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Slug artikel tidak disertakan.' }, { status: 400 })
  }

  const released = releaseArticleLock(slug, auth.user.id)
  return NextResponse.json({ success: true, released })
}
