/**
 * Active Editorial Lock & Heartbeat Presence Manager
 * Prevents concurrent editing collisions and data loss across multiple editors.
 */

export interface ActiveEditorLock {
  slug: string
  userId: string
  userName: string
  userEmail: string
  lockedAt: number
  expiresAt: number
}

// Global in-memory locks map (persisted across requests in active Node process)
const globalLocks = globalThis as unknown as {
  _editorialLocks?: Map<string, ActiveEditorLock>
}

if (!globalLocks._editorialLocks) {
  globalLocks._editorialLocks = new Map<string, ActiveEditorLock>()
}

const locks = globalLocks._editorialLocks

// Lock validity window (45 seconds without heartbeat = automatically released)
export const LOCK_TTL_MS = 45_000

export function getArticleLock(slug: string, currentUserId?: string): {
  isLocked: boolean
  lockedByMe: boolean
  lockInfo: ActiveEditorLock | null
} {
  const normalizedSlug = slug.toLowerCase().trim()
  const now = Date.now()
  const existing = locks.get(normalizedSlug)

  if (!existing) {
    return { isLocked: false, lockedByMe: false, lockInfo: null }
  }

  // Check if expired
  if (existing.expiresAt <= now) {
    locks.delete(normalizedSlug)
    return { isLocked: false, lockedByMe: false, lockInfo: null }
  }

  const lockedByMe = Boolean(currentUserId && existing.userId === currentUserId)
  return {
    isLocked: !lockedByMe,
    lockedByMe,
    lockInfo: existing,
  }
}

export function acquireOrRefreshLock(
  slug: string,
  user: { id: string; name: string; email: string }
): { success: boolean; isLockedByOther: boolean; lock: ActiveEditorLock } {
  const normalizedSlug = slug.toLowerCase().trim()
  const now = Date.now()
  const existing = locks.get(normalizedSlug)

  // If locked by another user and not expired
  if (existing && existing.expiresAt > now && existing.userId !== user.id) {
    return {
      success: false,
      isLockedByOther: true,
      lock: existing,
    }
  }

  const updatedLock: ActiveEditorLock = {
    slug: normalizedSlug,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    lockedAt: existing && existing.userId === user.id ? existing.lockedAt : now,
    expiresAt: now + LOCK_TTL_MS,
  }

  locks.set(normalizedSlug, updatedLock)

  // Housekeeping: clean expired locks if map grows large
  if (locks.size > 500) {
    for (const [k, v] of locks.entries()) {
      if (v.expiresAt <= now) locks.delete(k)
    }
  }

  return {
    success: true,
    isLockedByOther: false,
    lock: updatedLock,
  }
}

export function releaseArticleLock(slug: string, userId?: string): boolean {
  const normalizedSlug = slug.toLowerCase().trim()
  const existing = locks.get(normalizedSlug)

  if (!existing) return true

  // Only allow owner or admin to release
  if (userId && existing.userId !== userId) {
    return false
  }

  locks.delete(normalizedSlug)
  return true
}
