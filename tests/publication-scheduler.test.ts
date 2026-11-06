import { describe, it, expect, afterAll } from 'vitest'
import { db as prisma } from '../prisma/db'
import { publishDueArticles } from '../src/lib/publishing/scheduler'

const stamp = Date.now()
const READY = `sched-ready-${stamp}`
const BROKEN = `sched-broken-${stamp}`
const past = new Date(Date.now() - 60_000).toISOString()

describe('Publication scheduler (live PostgreSQL)', () => {
  afterAll(async () => {
    for (const slug of [READY, BROKEN]) {
      const row = await prisma.orm.public.Article.where({ slug }).first()
      if (!row) continue
      await prisma.orm.public.ContentRevision.where({ entityType: 'article', entityId: String(row.id) }).deleteAll()
      await prisma.orm.public.SeoAuditLog.where({ entityType: 'article', entityId: String(row.id) }).deleteAll()
      await prisma.orm.public.Article.where({ id: row.id }).delete()
    }
  })

  it('publishes due articles that pass the gate and returns failing ones to draft with a reason', async () => {
    await prisma.orm.public.Article.create({
      slug: READY,
      title: 'Artikel terjadwal yang siap terbit',
      content: '<p>Isi artikel uji untuk penjadwal publikasi SPATIUM.</p>',
      status: 'scheduled',
      scheduledAt: past,
      metaTitle: 'Artikel terjadwal siap terbit',
      metaDescription: 'Deskripsi meta artikel uji yang cukup panjang untuk lolos gerbang publikasi penjadwal.',
    })
    await prisma.orm.public.Article.create({
      slug: BROKEN,
      title: 'Artikel terjadwal tanpa meta',
      content: '<p>Isi.</p>',
      status: 'scheduled',
      scheduledAt: past,
    })

    const published = await publishDueArticles()
    expect(published).toContain(READY)
    expect(published).not.toContain(BROKEN)

    const ready = await prisma.orm.public.Article.where({ slug: READY }).first()
    expect(ready?.status).toBe('published')
    expect(ready?.scheduledAt).toBeNull()

    const broken = await prisma.orm.public.Article.where({ slug: BROKEN }).first()
    expect(broken?.status).toBe('draft')
    expect(broken?.scheduleError).toBeTruthy()
  })
})
