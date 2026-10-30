import { describe, it, expect } from 'vitest'
import { normalizeSchedule } from '../src/lib/publishing/validation'
import { validateStatusTransition } from '../src/lib/auth/types'
import { contentHash, localContentHash, wordpressDate, normalizeWordPressSource } from '../src/lib/import/wp-client'
const now = new Date('2026-01-01T00:00:00Z')
describe('Durable publishing schedule inputs', () => {
  it('converts an explicit timezone offset to UTC', () => {
    expect(normalizeSchedule('2026-02-01T09:30:00+07:00', 'Asia/Jakarta', now).scheduledAt).toBe('2026-02-01T02:30:00.000Z')
  })
  it('rejects past, ambiguous, and invalid-zone schedules', () => {
    expect(() => normalizeSchedule('2025-01-01T00:00:00Z', 'UTC', now)).toThrow()
    expect(() => normalizeSchedule('2026-02-01T09:30:00', 'Asia/Jakarta', now)).toThrow()
    expect(() => normalizeSchedule('2026-02-01T09:30:00Z', 'Not/AZone', now)).toThrow()
  })
  it('requires publish permission to schedule or cancel a schedule', () => {
    expect(validateStatusTransition('draft', 'scheduled', 'AUTHOR').allowed).toBe(false)
    expect(validateStatusTransition('draft', 'scheduled', 'EDITOR').allowed).toBe(true)
    expect(validateStatusTransition('scheduled', 'draft', 'AUTHOR').allowed).toBe(false)
  })
})
describe('WordPress source identity and timestamps', () => {
  it('preserves source GMT independently of the import host timezone', () => {
    expect(wordpressDate('2020-05-01T08:00:00', '2020-05-01T15:00:00')).toBe('2020-05-01T08:00:00.000Z')
  })
  it('does not pretend missing source UTC is an import timestamp', () => {
    expect(wordpressDate(undefined, '2020-05-01T15:00:00')).toBe('2020-05-01T15:00:00')
    expect(wordpressDate()).toBeNull()
  })
  it('hashes payloads deterministically without dropping nested metadata', () => {
    expect(contentHash({ b: [1], a: { c: 2 } })).toBe(contentHash({ a: { c: 2 }, b: [1] }))
    expect(contentHash({ meta: { _yoast_title: 'A' } })).not.toBe(contentHash({ meta: { _yoast_title: 'B' } }))
  })
  it('rejects credentials embedded in a source URL', () => {
    expect(() => normalizeWordPressSource('https://user:secret@example.com')).toThrow()
    expect(normalizeWordPressSource('https://example.com/blog/')).toBe('https://example.com/blog')
  })
})

describe('WordPress local edit conflict coverage', () => {
  it('detects taxonomy, author and original date edits without relying on body edits', () => {
    const original = { slug: 'source', title: 'Source', tags: '[1]', categoryId: 2, authorId: 3, publishedAt: '2020-01-01T00:00:00Z' }
    for (const change of [{ tags: '[2]' }, { categoryId: 4 }, { authorId: 5 }, { publishedAt: '2021-01-01T00:00:00Z' }]) {
      expect(localContentHash({ ...original, ...change })).not.toBe(localContentHash(original))
    }
    expect(localContentHash(original)).toMatch(/^v2:/)
  })
})
