import { describe, it, expect, afterAll } from 'vitest'
import { db as prisma } from '../prisma/db'
import {
  createPage,
  updatePage,
  setPageStatus,
  deletePage,
  getPublishedPage,
  listPageRevisions,
  PageError,
} from '../src/lib/pages/repository'
import { createBlock } from '../src/lib/blocks/catalog'

const SLUG = `test-page-${Date.now()}`
const RENAMED = `${SLUG}-baru`
const ACTOR = 'test:vitest'
let pageId = 0

describe('Dynamic pages repository (live PostgreSQL)', () => {
  afterAll(async () => {
    if (pageId) await prisma.orm.public.Page.where({ id: pageId }).delete()
    await prisma.orm.public.Redirect.where({ sourcePath: `/${SLUG}` }).delete()
    await prisma.orm.public.ContentRevision.where({ entityType: 'page', entityId: String(pageId) }).deleteAll()
    await prisma.orm.public.SeoAuditLog.where({ entityType: 'page', entityId: String(pageId) }).deleteAll()
  })

  it('creates a page as draft with validated blocks', async () => {
    const hero = createBlock('hero-cinema')
    const page = await createPage({ title: 'Halaman uji', slug: SLUG, blocks: [hero] }, ACTOR)
    pageId = page.id
    expect(page.status).toBe('draft')
    expect(page.blocks).toHaveLength(1)
    expect(await getPublishedPage(SLUG)).toBeNull()
  })

  it('rejects reserved slugs, duplicate slugs and invalid blocks', async () => {
    await expect(createPage({ title: 'X', slug: 'portfolio', blocks: [] }, ACTOR)).rejects.toMatchObject({ code: 'invalid' })
    await expect(createPage({ title: 'X', slug: SLUG, blocks: [] }, ACTOR)).rejects.toMatchObject({ code: 'slug_taken' })
    await expect(
      createPage({ title: 'X', slug: `${SLUG}-x`, blocks: [{ type: 'splat-viewer', splatId: 'bad id!' }] }, ACTOR),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('detects concurrent edits via expectedUpdatedAt', async () => {
    await expect(updatePage(pageId, { title: 'A', expectedUpdatedAt: '1999-01-01T00:00:00.000Z' }, ACTOR)).rejects.toBeInstanceOf(PageError)
  })

  it('blocks publishing until meta fields pass the gate, then publishes', async () => {
    await expect(setPageStatus(pageId, 'published', ACTOR)).rejects.toMatchObject({ code: 'gate' })
    await updatePage(
      pageId,
      { metaTitle: 'Halaman uji SPATIUM', metaDescription: 'Deskripsi halaman uji untuk memastikan gerbang publikasi bekerja.' },
      ACTOR,
    )
    const published = await setPageStatus(pageId, 'published', ACTOR)
    expect(published.status).toBe('published')
    expect(published.publishedAt).toBeTruthy()
    expect((await getPublishedPage(SLUG))?.id).toBe(pageId)
  })

  it('keeps the old URL working when a published page is renamed', async () => {
    const renamed = await updatePage(pageId, { slug: RENAMED }, ACTOR)
    expect(renamed.slug).toBe(RENAMED)
    const redirect = await prisma.orm.public.Redirect.where({ sourcePath: `/${SLUG}` }).first()
    expect(redirect?.destinationPath).toBe(`/${RENAMED}`)
  })

  it('records history for every mutation', async () => {
    const revisions = await listPageRevisions(pageId)
    expect(revisions.map((r) => r.action)).toEqual(expect.arrayContaining(['create', 'update', 'status:published']))
  })

  it('deletes a page', async () => {
    await deletePage(pageId, ACTOR)
    expect(await prisma.orm.public.Page.where({ id: pageId }).first()).toBeNull()
  })
})
