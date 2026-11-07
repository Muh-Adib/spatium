/**
 * SPATIUM database seeder — `pnpm run db:seed`
 *
 * Seeds the initial, verified Spatium content from `src/data/seed/*.json`.
 * Idempotent: every entity is upserted by its natural key (slug / sourcePath /
 * email). Nothing is ever deleted, and rows not present in the seed are left
 * untouched. Column conventions are documented in src/lib/content/spatium.ts.
 */
import fs from 'fs'
import { randomBytes } from 'node:crypto'
import path from 'path'
import { z } from 'zod'
import { prisma } from '../src/lib/db/prisma'

const SEED_DIR = path.resolve(process.cwd(), 'src/data/seed')

function readSeed<T>(filename: string, schema: z.ZodType<T>): T[] {
  const file = path.join(SEED_DIR, filename)
  if (!fs.existsSync(file)) {
    console.warn(`⚠ ${filename} not found — skipped.`)
    return []
  }
  const parsed = z.array(schema).safeParse(JSON.parse(fs.readFileSync(file, 'utf-8')))
  if (!parsed.success) {
    throw new Error(`${filename} failed validation: ${parsed.error.message}`)
  }
  return parsed.data
}

const seoSchema = z.object({ metaTitle: z.string(), metaDescription: z.string() })
const labelled = z.object({ label: z.string(), value: z.string(), detail: z.string().optional() })

const portfolioSchema = z.object({
  documentId: z.string(),
  slug: z.string(),
  title: z.string(),
  client: z.string().nullable(),
  year: z.number().int().nullable(),
  category: z.string(),
  summary: z.string(),
  challenge: z.string(),
  approach: z.string(),
  result: z.string(),
  heroImage: z.string().nullable(),
  /** Alt text for heroImage — required by the publication gate when a hero is set. */
  heroAlt: z.string().optional(),
  liveUrl: z.string().nullable(),
  featured: z.boolean(),
  status: z.string(),
  technologies: z.array(z.string()),
  metrics: z.array(labelled),
  seo: seoSchema,
})

const categorySchema = z.object({
  slug: z.string(),
  title: z.string(),
  tag: z.string(),
  shortDescription: z.string(),
  heroImage: z.string().nullable(),
  themePreset: z.string(),
  order: z.number().int(),
  status: z.string(),
  showInNav: z.boolean(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  keyOutcomes: z.array(labelled),
  blocks: z.array(z.object({ type: z.string(), id: z.string() }).passthrough()),
})

const serviceSchema = z.object({
  documentId: z.string(),
  slug: z.string(),
  name: z.string(),
  categorySlug: z.string(),
  indexNumber: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  order: z.number().int(),
  status: z.string(),
  seo: seoSchema,
})

const articleSchema = z.object({
  documentId: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  status: z.string(),
  publishedAt: z.string(),
  readingTime: z.number().int(),
  category: z.object({ name: z.string(), slug: z.string() }),
  author: z.object({ name: z.string(), slug: z.string() }),
  tags: z.array(z.string()),
  focusKeyphrase: z.string().optional(),
  // Illustrative still from the product deck (public/images/spatium/web).
  coverUrl: z.string().startsWith('/').optional(),
  ogImage: z.string().startsWith('/').optional(),
  seo: seoSchema,
})

const redirectSchema = z.object({
  sourcePath: z.string().startsWith('/'),
  destinationPath: z.string().startsWith('/'),
  statusCode: z.number().int(),
  reason: z.string(),
})

const partnerSchema = z.object({ name: z.string(), logoUrl: z.string(), altText: z.string() })
const pageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  metaTitle: z.string(),
  metaDescription: z.string(),
})

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  passwordHash: z.string(),
})

const tagSlug = (name: string) =>
  name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

async function seedPortfolios() {
  const rows = readSeed('seed_portfolio.json', portfolioSchema)
  for (const p of rows) {
    const data = {
      title: p.title,
      client: p.client,
      year: p.year,
      category: p.category,
      summary: p.summary,
      challenge: p.challenge,
      approach: p.approach,
      result: p.result,
      heroImage: p.heroImage,
      liveUrl: p.liveUrl,
      featured: p.featured,
      status: p.status,
      technologies: JSON.stringify(p.technologies),
      metrics: JSON.stringify(p.metrics),
      metaTitle: p.seo.metaTitle,
      metaDescription: p.seo.metaDescription,
      seoData: p.heroAlt ? JSON.stringify({ coverAlt: p.heroAlt }) : null,
    }
    await prisma.orm.public.Portfolio.upsert({
      conflictOn: { slug: p.slug },
      create: { documentId: p.documentId, slug: p.slug, ...data },
      update: data,
    })
  }
  console.log(`✓ Portfolios upserted: ${rows.length}`)
}

async function seedServiceCatalogue() {
  const categories = readSeed('seed_service_categories.json', categorySchema)
  const services = readSeed('seed_services.json', serviceSchema)

  await prisma.transaction(async (tx) => {
    const idBySlug = new Map<string, number>()
    for (const c of categories) {
      const data = {
        title: c.title,
        tag: c.tag,
        shortDescription: c.shortDescription,
        heroImage: c.heroImage,
        themePreset: c.themePreset,
        order: c.order,
        status: c.status,
        showInNav: c.showInNav,
        metaTitle: c.metaTitle,
        metaDescription: c.metaDescription,
        keyOutcomes: JSON.stringify(c.keyOutcomes),
        blocks: JSON.stringify(c.blocks),
        // The publication gate and Studio read cover alt from seoData.coverAlt.
        seoData: JSON.stringify({ coverAlt: c.keyOutcomes.find((o) => o.label === 'imageAlt')?.value ?? c.title }),
      }
      const row = await tx.orm.public.ServiceCategory.upsert({
        conflictOn: { slug: c.slug },
        create: { slug: c.slug, ...data },
        update: data,
      })
      idBySlug.set(c.slug, row.id)
    }

    for (const s of services) {
      const categoryId = idBySlug.get(s.categorySlug)
      if (categoryId === undefined) throw new Error(`Service ${s.slug}: unknown category ${s.categorySlug}`)
      const data = {
        name: s.name,
        categoryId,
        indexNumber: s.indexNumber,
        shortDescription: s.shortDescription,
        description: s.description,
        order: s.order,
        status: s.status,
        featured: false,
        metaTitle: s.seo.metaTitle,
        metaDescription: s.seo.metaDescription,
      }
      await tx.orm.public.Service.upsert({
        conflictOn: { slug: s.slug },
        create: { documentId: s.documentId, slug: s.slug, ...data },
        update: data,
      })
    }
  })
  console.log(`✓ Service categories upserted: ${categories.length}`)
  console.log(`✓ Services upserted: ${services.length}`)
}

async function seedArticles() {
  const rows = readSeed('seed_articles.json', articleSchema)
  for (const a of rows) {
    await prisma.transaction(async (tx) => {
      const db = tx.orm.public
      const category = await db.Category.upsert({
        conflictOn: { slug: a.category.slug },
        create: { name: a.category.name, slug: a.category.slug },
        update: { name: a.category.name },
      })
      const author = await db.Author.upsert({
        conflictOn: { slug: a.author.slug },
        create: {
          name: a.author.name,
          slug: a.author.slug,
          email: 'hello@spatium.id',
          bio: 'Tim editorial SPATIUM — Spatial Technology Studio.',
        },
        update: { name: a.author.name },
      })

      const data = {
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        status: a.status,
        publishedAt: a.publishedAt,
        readingTime: a.readingTime,
        metaTitle: a.seo.metaTitle,
        metaDescription: a.seo.metaDescription,
        focusKeyphrase: a.focusKeyphrase ?? null,
        coverUrl: a.coverUrl ?? null,
        ogImage: a.ogImage ?? null,
        robots: 'index, follow',
        categoryId: category.id,
        authorId: author.id,
      }
      const article = await db.Article.upsert({
        conflictOn: { slug: a.slug },
        create: { documentId: a.documentId, slug: a.slug, ...data },
        update: data,
      })

      const tagIds: number[] = []
      for (const name of a.tags) {
        const slug = tagSlug(name)
        const tag = await db.Tag.upsert({ conflictOn: { slug }, create: { name, slug }, update: {} })
        tagIds.push(tag.id)
        const link = await db.ArticleTag.where({ articleId: article.id, tagId: tag.id }).first()
        if (!link) await db.ArticleTag.create({ articleId: article.id, tagId: tag.id })
      }
      await db.Article.where({ id: article.id }).update({ tags: JSON.stringify(tagIds) })
    })
  }
  console.log(`✓ Articles upserted: ${rows.length}`)
}

async function seedRedirects() {
  const rows = readSeed('seed_redirects.json', redirectSchema)
  for (const r of rows) {
    await prisma.orm.public.Redirect.upsert({
      conflictOn: { sourcePath: r.sourcePath },
      create: { ...r, active: true },
      update: { destinationPath: r.destinationPath, statusCode: r.statusCode, reason: r.reason },
    })
  }
  console.log(`✓ Redirects upserted: ${rows.length}`)
}

async function seedPartnersAndPages() {
  const partners = readSeed('seed_partners.json', partnerSchema)
  for (const [i, p] of partners.entries()) {
    const existing = await prisma.orm.public.ClientLogo.where({ name: p.name }).first()
    if (!existing) {
      await prisma.orm.public.ClientLogo.create({ ...p, order: i + 1, isActive: true })
    }
  }
  console.log(`✓ Client logos processed: ${partners.length}`)

  const pages = readSeed('seed_pages.json', pageSchema)
  for (const p of pages) {
    const data = {
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
    }
    await prisma.orm.public.Page.upsert({
      conflictOn: { slug: p.slug },
      create: { slug: p.slug, documentId: `page-${p.slug}`, kind: 'standard', status: 'published', ...data },
      update: data,
    })
  }
  console.log(`✓ Pages upserted: ${pages.length}`)
}

async function seedSiteDefaults() {
  // Created once; afterwards SiteConfig is owned by Studio Admin.
  const existingConfig = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
  if (!existingConfig) {
    await prisma.orm.public.SiteConfig.create({
      id: 1,
      name: 'SPATIUM',
      tagline: 'Real Places. New Perspectives.',
      description:
        'SPATIUM adalah Spatial Technology Studio: digital twin untuk industri kreatif — laser scan, point cloud, 3D geometry, dan 3D Gaussian Splat.',
      url: 'https://spatium.id',
      email: 'hello@spatium.id',
      whatsapp: null,
      phone: null,
    })
    console.log('✓ Site config created.')
  } else {
    console.log('✓ Site config exists — left unchanged.')
  }

  const existingSite = await prisma.orm.public.Site.where({ slug: 'spatium' }).first()
  if (!existingSite) {
    await prisma.orm.public.Site.create({
      slug: 'spatium',
      name: 'SPATIUM',
      domain: 'spatium.id',
      // Never fall back to a well-known key: it would be accepted by the Delivery API in production.
      apiKey: process.env.SITE_API_KEY?.trim() || `site_${randomBytes(24).toString('base64url')}`,
      isActive: true,
      settings: JSON.stringify({}),
    })
    console.log(
      process.env.SITE_API_KEY?.trim()
        ? '✓ Delivery API site tenant created with SITE_API_KEY.'
        : '✓ Delivery API site tenant created with a random API key (set SITE_API_KEY to choose one).'
    )
  }
}

async function seedUsers() {
  // Legacy accounts carried over from the previous studio include several super admins.
  // Granting them access to SPATIUM is an owner decision, so this is opt-in.
  if (process.env.SEED_USERS !== 'true') {
    console.log('↷ Users skipped (set SEED_USERS=true to import seed_users.json).')
    return
  }
  // Create-only: existing accounts (and their passwords/roles) are never overwritten.
  const users = readSeed('seed_users.json', userSchema)
  let created = 0
  for (const u of users) {
    const existing = await prisma.orm.public.User.where({ email: u.email }).first()
    if (!existing) {
      await prisma.orm.public.User.create(u)
      created++
    }
  }
  console.log(`✓ Users: ${created} created, ${users.length - created} already present (unchanged).`)
}

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (expected in .env.local).')
  console.log('🌱 Seeding SPATIUM content…')
  await seedPortfolios()
  await seedServiceCatalogue()
  await seedArticles()
  await seedRedirects()
  await seedPartnersAndPages()
  await seedSiteDefaults()
  await seedUsers()
  console.log('🎉 Seeding completed.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
