import { describe, it, expect, beforeEach } from 'vitest'
import {
  acquireOrRefreshLock,
  getArticleLock,
  releaseArticleLock,
  LOCK_TTL_MS,
} from '../src/lib/articles/locks'

describe('Layer 4: Multi-User Concurrency & Editorial Lock', () => {
  const TEST_SLUG = 'test-concurrent-article'

  beforeEach(() => {
    // Release any previous lock
    releaseArticleLock(TEST_SLUG)
  })

  it('allows an editor to acquire an active lock', () => {
    const userA = { id: 'usr_editor_a', name: 'Editor A', email: 'editorA@unimasi.com' }
    const result = acquireOrRefreshLock(TEST_SLUG, userA)

    expect(result.success).toBe(true)
    expect(result.isLockedByOther).toBe(false)
    expect(result.lock.userName).toBe('Editor A')

    const status = getArticleLock(TEST_SLUG, userA.id)
    expect(status.isLocked).toBe(false) // Not locked for userA
    expect(status.lockedByMe).toBe(true)
  })

  it('blocks second editor from acquiring active lock held by first editor', () => {
    const userA = { id: 'usr_editor_a', name: 'Editor A', email: 'editorA@unimasi.com' }
    const userB = { id: 'usr_editor_b', name: 'Editor B', email: 'editorB@unimasi.com' }

    // User A acquires lock
    acquireOrRefreshLock(TEST_SLUG, userA)

    // User B tries to acquire lock
    const resultB = acquireOrRefreshLock(TEST_SLUG, userB)
    expect(resultB.success).toBe(false)
    expect(resultB.isLockedByOther).toBe(true)
    expect(resultB.lock.userName).toBe('Editor A')

    // Check status from User B's perspective
    const statusB = getArticleLock(TEST_SLUG, userB.id)
    expect(statusB.isLocked).toBe(true)
    expect(statusB.lockedByMe).toBe(false)
    expect(statusB.lockInfo?.userName).toBe('Editor A')
  })

  it('allows owner to release lock so another editor can acquire it', () => {
    const userA = { id: 'usr_editor_a', name: 'Editor A', email: 'editorA@unimasi.com' }
    const userB = { id: 'usr_editor_b', name: 'Editor B', email: 'editorB@unimasi.com' }

    acquireOrRefreshLock(TEST_SLUG, userA)

    // User A releases
    const released = releaseArticleLock(TEST_SLUG, userA.id)
    expect(released).toBe(true)

    // Now User B acquires cleanly
    const resultB = acquireOrRefreshLock(TEST_SLUG, userB)
    expect(resultB.success).toBe(true)
    expect(resultB.isLockedByOther).toBe(false)
    expect(resultB.lock.userName).toBe('Editor B')
  })

  it('prevents non-owners from hijacking or releasing another user lock', () => {
    const userA = { id: 'usr_editor_a', name: 'Editor A', email: 'editorA@unimasi.com' }
    const intruder = { id: 'usr_intruder', name: 'Intruder', email: 'intruder@unimasi.com' }

    acquireOrRefreshLock(TEST_SLUG, userA)

    // Intruder tries to release User A's lock
    const released = releaseArticleLock(TEST_SLUG, intruder.id)
    expect(released).toBe(false)

    // Verify User A still holds the lock
    const status = getArticleLock(TEST_SLUG, userA.id)
    expect(status.lockedByMe).toBe(true)
  })
})
