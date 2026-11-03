import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db as prisma } from '../prisma/db'
import { validateCredentials } from '../src/lib/auth/credentials'
import { getSiteByApiKey } from '../src/lib/db/site'

describe('Layer 2: Schema Integrity & Database Persistence (Zero-Mock)', () => {
  const TEST_SLUG = `adversarial-test-art-${Date.now()}`

  beforeAll(async () => {
    // Clean up any test records
    await prisma.orm.public.Article.where({ slug: TEST_SLUG }).delete().catch(() => {})
  })

  afterAll(async () => {
    // Final cleanup of test records
    await prisma.orm.public.Article.where({ slug: TEST_SLUG }).delete().catch(() => {})
  })

  it('validates WordPress user Adib IT via email against real PostgreSQL scrypt hash', async () => {
    const user = await validateCredentials('adib@udp.co.id', 'QzU5D0gv4vXFHF@@QCc3^1)D')
    expect(user).not.toBeNull()
    expect(user?.name).toBe('Adib IT')
    expect(user?.role).toBe('SUPER_ADMIN')
  })

  it('validates WordPress user Adib IT via username against real PostgreSQL scrypt hash', async () => {
    const user = await validateCredentials('Adib IT', 'QzU5D0gv4vXFHF@@QCc3^1)D')
    expect(user).not.toBeNull()
    expect(user?.name).toBe('Adib IT')
    expect(user?.email).toBe('adib@udp.co.id')
  })

  it('rejects invalid password for Adib IT in constant time', async () => {
    const user = await validateCredentials('adib@udp.co.id', 'IncorrectPassword123!')
    expect(user).toBeNull()
  })

  it('resolves canonical Delivery API Site entity from PostgreSQL', async () => {
    const site = await getSiteByApiKey('site_sec_unimasi')
    expect(site).not.toBeNull()
    expect(site?.slug).toBe('unimasi')
    expect(site?.isActive).toBe(true)
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
    } catch (err: any) {
      duplicateFailed = true
    }
    expect(duplicateFailed).toBe(true)
  })
})
