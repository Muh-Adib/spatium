import { describe, expect, it } from 'vitest'
import {
  MEDIA_MANAGE_ROLES,
  MEDIA_UPLOAD_ROLES,
  mediaActionBodySchema,
  mediaPatchBodySchema,
  zodIssueMessages,
} from '@/lib/media/media-schema'
import type { Role } from '@/lib/auth/types'

describe('media role policy', () => {
  const manage = new Set<Role>(MEDIA_MANAGE_ROLES)
  const upload = new Set<Role>(MEDIA_UPLOAD_ROLES)

  it('lets media managers and editors manage the library', () => {
    for (const r of ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'MEDIA_MANAGER'] as const) expect(manage.has(r)).toBe(true)
  })

  it('keeps authors, reviewers and SEO managers out of library management', () => {
    for (const r of ['AUTHOR', 'REVIEWER', 'SEO_MANAGER'] as const) expect(manage.has(r)).toBe(false)
  })

  it('lets authors upload article images but not reviewers or SEO managers', () => {
    expect(upload.has('AUTHOR')).toBe(true)
    expect(upload.has('REVIEWER')).toBe(false)
    expect(upload.has('SEO_MANAGER')).toBe(false)
    for (const r of MEDIA_MANAGE_ROLES) expect(upload.has(r)).toBe(true)
  })
})

describe('mediaPatchBodySchema', () => {
  it('accepts a partial metadata update', () => {
    const parsed = mediaPatchBodySchema.parse({ id: 4, altText: { id: 'Pemindaian ruang' }, decorative: false })
    expect(parsed).toEqual({ id: 4, altText: { id: 'Pemindaian ruang' }, decorative: false })
  })

  it('rejects a missing or invalid id with a readable message', () => {
    const res = mediaPatchBodySchema.safeParse({ id: 'abc', title: 'x' })
    expect(res.success).toBe(false)
    if (!res.success) expect(zodIssueMessages(res.error)).toEqual(['id: ID media tidak valid.'])
  })

  it('rejects wrongly typed fields instead of writing them', () => {
    expect(mediaPatchBodySchema.safeParse({ id: 1, decorative: 'yes' }).success).toBe(false)
    expect(mediaPatchBodySchema.safeParse({ id: 1, focalPoint: { x: 150, y: 10 } }).success).toBe(false)
  })

  it('drops unknown keys (e.g. url, uploadedBy) so they cannot be overwritten', () => {
    const parsed = mediaPatchBodySchema.parse({ id: 1, url: '/etc/passwd', uploadedBy: 'x', title: 'Judul' })
    expect(parsed).toEqual({ id: 1, title: 'Judul' })
  })
})

describe('mediaActionBodySchema', () => {
  it('accepts rename with a plain file name', () => {
    expect(mediaActionBodySchema.safeParse({ action: 'rename', id: 2, newFileName: 'scan-gudang' }).success).toBe(true)
  })

  it('rejects path segments in a rename', () => {
    for (const newFileName of ['../x.webp', 'a/b.webp', 'a\\b.webp']) {
      expect(mediaActionBodySchema.safeParse({ action: 'rename', id: 2, newFileName }).success).toBe(false)
    }
  })

  it('validates every bulk_update item', () => {
    expect(mediaActionBodySchema.safeParse({ action: 'bulk_update', items: [{ id: 1, caption: 'ok' }] }).success).toBe(true)
    expect(mediaActionBodySchema.safeParse({ action: 'bulk_update', items: [{ caption: 'no id' }] }).success).toBe(false)
    expect(mediaActionBodySchema.safeParse({ action: 'bulk_update', items: [] }).success).toBe(false)
  })

  it('rejects unknown actions', () => {
    expect(mediaActionBodySchema.safeParse({ action: 'delete_all' }).success).toBe(false)
  })
})
