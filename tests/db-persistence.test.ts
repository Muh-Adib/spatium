import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db as prisma } from '../prisma/db'
import { validateCredentials } from '../src/lib/auth/credentials'
import { getSiteByApiKey } from '../src/lib/db/site'
import { hashPasswordScrypt } from '../src/lib/auth/crypto'
import { randomBytes } from 'node:crypto'

describe('Layer 2: Schema Integrity & Database Persistence (Zero-Mock)', () => {
  const TEST_SLUG = `adversarial-test-art-${Date.now()}`

  beforeAll(async () => {
    await prisma.orm.public.Article.where({ slug: TEST_SLUG }).delete()
  })

  afterAll(async () => {
    await prisma.orm.public.Article.where({ slug: TEST_SLUG }).delete()
    await prisma.orm.public.User.where({ email: TEST_EMAIL }).delete()
  })

  // Credentials are verified against a throw-away user with a random password,
  // never against real accounts or passwords committed to the repository.
  const TEST_EMAIL = `persistence-test-${Date.now()}@spatium.test`
  const TEST_PASSWORD = randomBytes(18).toString('base64url')

  it('validates a user against a real PostgreSQL scrypt hash', async () => {
    await prisma.orm.public.User.create({
      id: `usr_test_${Date.now()}`,
      name: 'Persistence Test',
      email: TEST_EMAIL,
      role: 'editor',
      passwordHash: await hashPasswordScrypt(TEST_PASSWORD),
    })
    const user = await validateCredentials(TEST_EMAIL, TEST_PASSWORD)
    expect(user?.email).toBe(TEST_EMAIL)
    expect(user?.role).toBe('EDITOR')
  })

  it('rejects a wrong password', async () => {
    expect(await validateCredentials(TEST_EMAIL, `${TEST_PASSWORD}x`)).toBeNull()
  })

  it('refuses users with an unknown role instead of escalating them', async () => {
    await prisma.orm.public.User.where({ email: TEST_EMAIL }).update({ role: 'mystery' })
    expect(await validateCredentials(TEST_EMAIL, TEST_PASSWORD)).toBeNull()
  })

  it('resolves a Delivery API Site entity from PostgreSQL by API key', async () => {
    // Self-contained: does not depend on seed data, so it passes on an empty CI database.
    const slug = `persistence-site-${Date.now()}`
    const apiKey = `site_test_${randomBytes(18).toString('base64url')}`
    await prisma.orm.public.Site.create({ slug, name: 'Persistence Test Site', apiKey, isActive: true })
    try {
      const site = await getSiteByApiKey(apiKey)
      expect(site?.slug).toBe(slug)
      expect(site?.isActive).toBe(true)
    } finally {
      await prisma.orm.public.Site.where({ slug }).delete()
    }
  })

  it('rejects well-known placeholder site keys that have no matching Site row', async () => {
    for (const key of ['site_sec_spatium', 'site_sec_default']) {
      const row = await prisma.orm.public.Site.where({ apiKey: key }).first()
      if (row) continue // legacy local seed; ROADMAP 1.9 covers rotating it
      if (process.env.SITE_API_KEY?.trim() === key) continue
      expect(await getSiteByApiKey(key)).toBeNull()
    }
  })

  it('inserts and persists a test article directly in PostgreSQL', async () => {
    const created = await prisma.orm.public.Article.create({
      slug: TEST_SLUG,
      title: 'Adversarial Test Article for PostgreSQL Verification',
      content: '<p>Konten pengujian persistensi database nyata.</p>',
      status: 'draft',
      metaTitle: 'Adversarial Test Article',
      metaDescription: 'Deskripsi uji coba langsung ke PostgreSQL.',
    })

    expect(created.id).toBeDefined()

    // Read back directly to prove persistence (Anti-False-Pass)
    const readBack = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
    expect(readBack).not.toBeNull()
    expect(readBack?.title).toBe('Adversarial Test Article for PostgreSQL Verification')
    expect(readBack?.status).toBe('draft')
  })

  it('strictly enforces UNIQUE constraint on article slug in PostgreSQL', async () => {
    let duplicateFailed = false
    try {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG, // Same slug as above
        title: 'Duplicate Slug Attempt',
        content: '<p>Should fail</p>',
      })
    } catch {
      duplicateFailed = true
    }
    expect(duplicateFailed).toBe(true)
  })
})
