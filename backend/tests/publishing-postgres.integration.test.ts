import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/security/ssrf', () => ({ safeFetch: vi.fn() }))
const enabled = !!process.env.TEST_DATABASE_URL
let db: typeof import('../prisma/db').db
beforeAll(async () => {
  if (!enabled) return
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  db = (await import('../prisma/db')).db
})
afterAll(async () => { if (db) await db.close() })
describe.skipIf(!enabled)('PostgreSQL publication and WordPress integration', () => {
  it('keeps editable tags and their relations consistent through saves and clearing', async () => {
    const { createArticle, updateArticle, getArticleBySlug } = await import('../src/lib/db/articles')
    const article = await createArticle({ title: 'Tag fixture', slug: 'tag-edit-fixture', actor: 'integration', tags: ['Motion Design', 'Motion Design', 'Animasi 3D'] })
    expect((await getArticleBySlug(article.slug))?.tags?.map((tag) => tag.name).sort()).toEqual(['Animasi 3D', 'Motion Design'])
    await updateArticle(article.slug, { title: 'Edited title', actor: 'integration' })
    expect(await db.orm.public.ArticleTag.where({ articleId: article.id }).all()).toHaveLength(2)
    await updateArticle(article.slug, { tags: ['Motion Design', 'Strategi Brand'], actor: 'integration' })
    expect((await getArticleBySlug(article.slug))?.tags?.map((tag) => tag.name).sort()).toEqual(['Motion Design', 'Strategi Brand'])
    const revisions = await db.orm.public.ContentRevision.where({ entityId: String(article.id), action: 'before_update' }).all()
    expect(revisions.some((revision) => JSON.parse(revision.snapshot).articleTags.some((link: { tag: { name: string } }) => link.tag.name === 'Animasi 3D'))).toBe(true)
    await updateArticle(article.slug, { tags: [], actor: 'integration' })
    expect((await getArticleBySlug(article.slug))?.tags).toEqual([])
    expect((await db.orm.public.Article.where({ id: article.id }).first())?.tags).toBe('[]')
  })
  it('publishes a due article once across competing workers and leaves future posts private', async () => {
    const now = new Date('2026-06-01T00:00:00Z')
    const fields = { title: 'Scheduled fixture', content: '<p>Verified content.</p>', metaTitle: 'Scheduled fixture', metaDescription: 'A verified scheduling integration fixture.', status: 'scheduled', scheduledBy: 'integration' }
    const due = await db.orm.public.Article.create({ ...fields, slug: 'due-fixture', scheduledAt: '2026-05-01T00:00:00.000Z' })
    const broken = await db.orm.public.Article.create({ ...fields, slug: 'broken-seo-fixture', seoData: '{invalid', scheduledAt: '2026-05-01T00:00:00.000Z' })
    const future = await db.orm.public.Article.create({ ...fields, slug: 'future-fixture', scheduledAt: '2026-07-01T00:00:00.000Z' })
    const { publishDueArticles } = await import('../src/lib/publishing/scheduler')
    await Promise.all([publishDueArticles(now), publishDueArticles(now)])
    expect((await db.orm.public.Article.where({ id: broken.id }).first())?.scheduleError).toContain('Metadata SEO rusak')
    expect((await db.orm.public.Article.where({ id: due.id }).first())?.status).toBe('published')
    expect((await db.orm.public.Article.where({ id: future.id }).first())?.status).toBe('scheduled')
    const { getArticle } = await import('../src/lib/content/queries')
    expect(await getArticle('future-fixture')).toBeNull()
    const logs = await db.orm.public.SeoAuditLog.where({ entityId: String(due.id), action: 'scheduled_publish' }).all()
    expect(logs).toHaveLength(1)
  })
  it('rejects a due article failing the publication gate and records the reason', async () => {
    const bad = await db.orm.public.Article.create({ title: 'Missing SEO', slug: 'invalid-schedule-fixture', status: 'scheduled', scheduledAt: '2026-01-01T00:00:00.000Z' })
    const { publishDueArticles } = await import('../src/lib/publishing/scheduler')
    await publishDueArticles(new Date('2026-02-01T00:00:00Z'))
    const result = await db.orm.public.Article.where({ id: bad.id }).first()
    expect(result?.status).toBe('draft')
    expect(result?.scheduleError).toBeTruthy()
  })
  it('preserves original WP data and dates, avoids duplicate imports, detects local conflicts', async () => {
    const { safeFetch } = await import('../src/lib/security/ssrf')
    const raw = { id: 71, slug: 'wordpress-fixture', status: 'publish', date_gmt: '2020-01-01T03:00:00', modified_gmt: '2021-02-01T04:00:00', link: 'https://fixture.example/wordpress-fixture/', title: { rendered: 'WordPress original' }, content: { raw: '<!-- wp:paragraph --><p>Original</p>', rendered: '<p>Original</p>' }, excerpt: { rendered: 'Original excerpt' }, categories: [10], tags: [20], meta: { _yoast_wpseo_focuskw: 'original' }, yoast_head_json: { title: 'SEO original', description: 'Original SEO description', canonical: 'https://fixture.example/wordpress-fixture/', schema: { '@graph': [{ '@type': 'Article' }] }, twitter_title: 'Twitter original', robots: { index: 'noindex', follow: 'follow' } } }
    vi.mocked(safeFetch).mockImplementation(async (url) => {
      const kind = new URL(String(url)).pathname.split('/').at(-1)
      const data = kind === 'posts' ? [raw] : kind === 'categories' ? [{ id: 10, slug: 'original-category', name: 'Original category' }] : kind === 'tags' ? [{ id: 20, slug: 'original-tag', name: 'Original tag' }] : []
      return new Response(JSON.stringify(data), { headers: { 'x-wp-total': String(data.length) } })
    })
    const { importFromWordPressRest } = await import('../src/lib/import/wp-rest')
    for (const id of ['wp-first', 'wp-second']) {
      await db.orm.public.ImportJob.create({ id, source: 'wp_rest' })
      expect((await importFromWordPressRest({ jobId: id, siteUrl: 'https://fixture.example' })).success).toBe(true)
    }
    const articles = await db.orm.public.Article.where({ wpPostId: 71 }).all()
    expect(articles).toHaveLength(1)
    expect(articles[0].publishedAt).toBe('2020-01-01T03:00:00.000Z')
    expect(new Date(articles[0].createdAt).toISOString()).toBe('2020-01-01T03:00:00.000Z')
    expect(new Date(articles[0].updatedAt).toISOString()).toBe('2021-02-01T04:00:00.000Z')
    const source = await db.orm.public.WordPressSnapshot.where({ sourceUrl: 'https://fixture.example', entityType: 'posts', wpId: 71 }).first()
    expect(JSON.parse(source!.payload)).toEqual(raw)
    expect(await db.orm.public.ArticleTag.where({ articleId: articles[0].id }).all()).toHaveLength(1)
    await db.orm.public.Article.where({ id: articles[0].id }).update({ content: '<p>Local editorial changes</p>' })
    raw.content.rendered = '<p>New remote changes</p>'
    await db.orm.public.ImportJob.create({ id: 'wp-conflict', source: 'wp_rest' })
    const result = await importFromWordPressRest({ jobId: 'wp-conflict', siteUrl: 'https://fixture.example' })
    expect(result.conflicts).toBe(1)
    expect((await db.orm.public.Article.where({ id: articles[0].id }).first())?.content).toContain('Local editorial changes')
  })
})

it.skipIf(!process.env.TEST_DATABASE_URL || !process.env.TEST_WORDPRESS_FIXTURE_FILE)('imports a real isolated WordPress + Yoast exporter without exposing protected content', async () => {
  const fs = await import('node:fs')
  const fixture = JSON.parse(fs.readFileSync(process.env.TEST_WORDPRESS_FIXTURE_FILE!, 'utf8'))
  const { safeFetch } = await import('../src/lib/security/ssrf')
  const unauthenticated = await fetch(`${fixture.baseUrl}/wp-json/webshift/v1/export/posts`)
  expect([401, 403]).toContain(unauthenticated.status)
  vi.mocked(safeFetch).mockImplementation(async (url, options) => {
    const parsed = new URL(String(url))
    return fetch(fixture.baseUrl + parsed.pathname + parsed.search, { headers: options?.headers })
  })
  const { importFromWordPressRest } = await import('../src/lib/import/wp-rest')
  const jobId = 'real-wordpress-yoast'
  await db.orm.public.ImportJob.create({ id: jobId, source: 'wp_rest', sourceUrl: 'https://isolated-wordpress.example' })
  const result = await importFromWordPressRest({ jobId, siteUrl: 'https://isolated-wordpress.example', username: fixture.username, applicationPassword: fixture.applicationPassword, completeExport: true })
  expect(result.errors.map((e) => e.error)).toEqual([])
  expect(result.success).toBe(true)
  const snapshot = await db.orm.public.WordPressSnapshot.where({ sourceUrl: 'https://isolated-wordpress.example', entityType: 'posts', wpId: fixture.postId }).first()
  const raw = JSON.parse(snapshot!.payload)
  expect(raw.webshift_source.postmeta._yoast_wpseo_focuskw).toEqual(['original keyword'])
  expect(raw.webshift_source.postmeta._private_editorial_fixture).toBeTruthy()
  expect(raw.webshift_source.revisions.length).toBeGreaterThan(0)
  const article = await db.orm.public.Article.where({ id: snapshot!.targetId! }).first()
  expect(article?.metaTitle).toContain('Original private SEO title')
  expect(article?.focusKeyphrase).toBe('original keyword')
  expect(article?.content).toMatch(/<h2\b[^>]*>Original heading<\/h2>/)
  expect(article?.content).toContain('<table>')
  expect(article?.robots).toContain('noindex')
  expect(article?.publishedAt).toBe('2020-01-01T10:00:00.000Z')
  expect(JSON.parse(article!.seoData!).sourceYoast.schema).toBeTruthy()
  const { getArticle } = await import('../src/lib/content/queries')
  expect(await getArticle('protected-source-article')).toBeNull()
  expect(await getArticle('private-source-draft')).toBeNull()
})
