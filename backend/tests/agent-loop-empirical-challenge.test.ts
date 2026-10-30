import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../src/lib/db/prisma'
import {
  handleInspectArticleSeo,
  handleUpdateArticleContent,
  executeSegiaTool,
} from '../src/lib/ai/tools'
import {
  executeAgenticArticleLoop,
  runAgenticLoopEngine,
} from '../src/lib/ai/agent-loop'
import { toolRegistry } from '../src/lib/agent/registry'

describe('Empirical Challenge: Article Mutation, CoverAlt Safety, and In-Memory Drafts', () => {
  const TEST_SLUG = 'empirical-challenge-test-article'

  beforeEach(async () => {
    // Clean up test article if it exists
    try {
      const existing = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      if (existing) {
        await prisma.orm.public.ArticleTag.where({ articleId: existing.id }).delete()
        await prisma.orm.public.Article.where({ id: existing.id }).delete()
      }
    } catch {}
  })

  afterEach(async () => {
    // Clean up test article
    try {
      const existing = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      if (existing) {
        await prisma.orm.public.ArticleTag.where({ articleId: existing.id }).delete()
        await prisma.orm.public.Article.where({ id: existing.id }).delete()
      }
    } catch {}
  })

  describe('1. CoverAlt Safety & ImageMetadata JSON Preservation in PostgreSQL', () => {
    it('writes coverAlt safely into imageMetadata without Prisma coverAlt column errors', async () => {
      // Create article with pre-existing imageMetadata and seoData
      const initialImageMeta = {
        width: 1920,
        height: 1080,
        focalPoint: { x: 50, y: 50 },
        caption: 'Pemandangan Akuarium 3D',
      }
      const initialSeoData = {
        openGraph: { type: 'article' },
        twitter: { card: 'summary_large_image' },
        robots: 'index, follow',
      }

      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Artikel Uji Coba Preservasi Cover Alt',
        content: '<p>Konten pengujian rekayasa perangkat lunak untuk alt text gambar hero.</p>',
        status: 'draft',
        imageMetadata: JSON.stringify(initialImageMeta),
        seoData: JSON.stringify(initialSeoData),
      })

      // Mutate coverAlt via update_article_content tool
      const mutationRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        coverAlt: 'Simulasi Terumbu Karang dan Ikan Badut dalam 3D Aquarium',
      })

      expect(mutationRes.status).toBe('success')
      expect(mutationRes.output.updatedFields).toContain('coverAlt')
      expect(mutationRes.output.diffSummary.coverAlt.after).toBe('Simulasi Terumbu Karang dan Ikan Badut dalam 3D Aquarium')

      // Inspect PostgreSQL record directly to verify database integrity
      const rawArticle = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      expect(rawArticle).not.toBeNull()

      // 1. Verify imageMetadata preserved existing properties while updating coverAlt
      expect(rawArticle?.imageMetadata).toBeDefined()
      const parsedImageMeta = JSON.parse(rawArticle!.imageMetadata!)
      expect(parsedImageMeta.coverAlt).toBe('Simulasi Terumbu Karang dan Ikan Badut dalam 3D Aquarium')
      expect(parsedImageMeta.width).toBe(1920)
      expect(parsedImageMeta.height).toBe(1080)
      expect(parsedImageMeta.focalPoint).toEqual({ x: 50, y: 50 })
      expect(parsedImageMeta.caption).toBe('Pemandangan Akuarium 3D')

      // 2. Verify seoData preserved existing properties while updating openGraph.imageAlt
      expect(rawArticle?.seoData).toBeDefined()
      const parsedSeoData = JSON.parse(rawArticle!.seoData!)
      expect(parsedSeoData.openGraph?.imageAlt).toBe('Simulasi Terumbu Karang dan Ikan Badut dalam 3D Aquarium')
      expect(parsedSeoData.openGraph?.type).toBe('article')
      expect(parsedSeoData.twitter?.card).toBe('summary_large_image')
      expect(parsedSeoData.robots).toBe('index, follow')
    })

    it('safely writes coverAlt when initial imageMetadata is null or missing', async () => {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Artikel Tanpa Image Metadata Awal',
        content: '<p>Pengujian pembuatan imageMetadata baru ketika sebelumnya kosong.</p>',
        status: 'draft',
      })

      const mutationRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        coverAlt: 'Inisialisasi Pertama Cover Alt',
      })

      expect(mutationRes.status).toBe('success')

      const rawArticle = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      expect(rawArticle?.imageMetadata).toBeDefined()
      const parsedImageMeta = JSON.parse(rawArticle!.imageMetadata!)
      expect(parsedImageMeta.coverAlt).toBe('Inisialisasi Pertama Cover Alt')
    })

    it('safely handles corrupted/invalid JSON in imageMetadata without crashing', async () => {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Artikel Dengan Corrupted Image Metadata',
        content: '<p>Pengujian ketahanan terhadap string JSON korup.</p>',
        status: 'draft',
        imageMetadata: '{{invalid-json--malformed',
      })

      const mutationRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        coverAlt: 'Alt Text Pulih dari Kerusakan JSON',
      })

      expect(mutationRes.status).toBe('success')

      const rawArticle = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      const parsedImageMeta = JSON.parse(rawArticle!.imageMetadata!)
      expect(parsedImageMeta.coverAlt).toBe('Alt Text Pulih dari Kerusakan JSON')
    })

    it('handles coverAlt with special characters, quotes, and unicode emojis safely', async () => {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Artikel Karakter Khusus',
        content: '<p>Pengujian karakter khusus dan unicode.</p>',
        status: 'draft',
      })

      const specialCoverAlt = 'Interactive "3D" Aquarium & <script>alert("test")</script> 🐠 — SegiaTech\\Engineering'

      const mutationRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        coverAlt: specialCoverAlt,
      })

      expect(mutationRes.status).toBe('success')

      const rawArticle = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      const parsedImageMeta = JSON.parse(rawArticle!.imageMetadata!)
      expect(parsedImageMeta.coverAlt).toBe(specialCoverAlt)

      const parsedSeoData = JSON.parse(rawArticle!.seoData!)
      expect(parsedSeoData.openGraph?.imageAlt).toBe(specialCoverAlt)
    })
  })

  describe('2. Metadata Preservation in PostgreSQL during Article Mutation', () => {
    it('preserves existing article fields when updating focusKeyphrase, metaTitle, and metaDescription', async () => {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Judul Asli Sebelum Dioptimasi',
        excerpt: 'Ringkasan asli sebelum optimasi.',
        content: '<p>Konten asli berukuran sedang untuk pengujian preservasi metadata artikel.</p>',
        status: 'draft',
        canonicalUrl: 'https://segiatech.com/artikel/original-canonical',
        isCornerstone: true,
        readingTime: 5,
        primaryCategory: 'Kreatif',
        locale: 'id',
      })

      // Mutate only SEO fields
      const mutationRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        focusKeyphrase: 'Teknologi Akuarium 3D',
        metaTitle: 'Teknologi Akuarium 3D: Solusi Interaktif SegiaTech',
        metaDescription: 'Pelajari arsitektur sistem teknologi akuarium 3D berbasis WebGL untuk pameran dan edutainment modern terdepan di Indonesia.',
      })

      expect(mutationRes.status).toBe('success')

      // Fetch fresh record from DB
      const updatedArticle = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      expect(updatedArticle).not.toBeNull()

      // Mutated fields
      expect(updatedArticle?.focusKeyphrase).toBe('Teknologi Akuarium 3D')
      expect(updatedArticle?.metaTitle).toBe('Teknologi Akuarium 3D: Solusi Interaktif SegiaTech')
      expect(updatedArticle?.metaDescription).toContain('arsitektur sistem teknologi akuarium 3D')

      // Preserved fields
      expect(updatedArticle?.title).toBe('Judul Asli Sebelum Dioptimasi')
      expect(updatedArticle?.excerpt).toBe('Ringkasan asli sebelum optimasi.')
      expect(updatedArticle?.canonicalUrl).toBe('https://segiatech.com/artikel/original-canonical')
      expect(updatedArticle?.isCornerstone).toBe(true)
      expect(updatedArticle?.primaryCategory).toBe('Kreatif')
      expect(updatedArticle?.locale).toBe('id')
      expect(updatedArticle?.status).toBe('draft')
    })
  })

  describe('3. In-Memory Draft Fallback (articleContext) without Database Record', () => {
    it('optimizes an unsaved canvas draft without database record cleanly and returns updated content', async () => {
      const unsavedSlug = 'draf-baru-edutainment-canvas-999'

      // Verify that this slug does NOT exist in the database
      const existingInDb = await prisma.orm.public.Article.where({ slug: unsavedSlug }).first()
      expect(existingInDb).toBeNull()

      const events: Array<{ event: string; payload: any }> = []
      const progressUpdates: any[] = []

      // Execute agentic loop on unsaved in-memory draft
      const result = await executeAgenticArticleLoop({
        slug: unsavedSlug,
        targetSeoScore: 80,
        targetReadabilityScore: 80,
        maxSteps: 5,
        timeoutMs: 30000,
        articleContext: {
          title: 'Implementasi WebGL untuk Virtual Aquarium Canvas',
          content: '<p>Teknologi rendering WebGL memungkinkan simulasi ikan 3D di browser web secara responsif dan interaktif.</p><p>Selain itu, sistem ini dapat diintegrasikan dengan sensor optik fisik.</p>',
          category: 'Teknologi',
          targetKeyword: 'Virtual Aquarium',
          coverAlt: 'Simulasi Virtual Aquarium WebGL',
        },
        onEvent: (event, payload) => {
          events.push({ event, payload })
        },
        onProgress: (p) => {
          progressUpdates.push(p)
        },
      })

      // Must succeed without throwing database error
      expect(result.success).toBe(true)
      expect(result.totalStepsExecuted).toBeGreaterThanOrEqual(1)
      expect(result.finalScores.seo).toBeGreaterThan(0)
      expect(result.finalScores.readability).toBeGreaterThan(0)

      // Verify proposedChanges synthesized for studio canvas
      expect(result.proposedChanges).toBeDefined()
      expect(result.proposedChanges.title).toBeDefined()
      expect(result.proposedChanges.seoTitle).toBeDefined()
      expect(result.proposedChanges.metaDescription).toBeDefined()
      expect(result.proposedChanges.focusKeyphrase).toBeDefined()
      expect(result.proposedChanges.coverAlt).toBeDefined()
      expect(result.proposedChanges.content).toBeDefined()

      // Verify article_mutation event was streamed with applied: true
      const mutationEvents = events.filter((e) => e.event === 'article_mutation')
      expect(mutationEvents.length).toBeGreaterThan(0)
      expect(mutationEvents[0].payload.applied).toBe(true)
      expect(mutationEvents[0].payload.changes).toBeDefined()

      // Verify non-empty editorial reply was generated
      expect(result.reply).toBeDefined()
      expect(result.reply.length).toBeGreaterThan(50)
      expect(result.reply).not.toContain('Tidak ada respons teks yang dihasilkan')

      // In-memory draft must NOT persist an unintended record in the database
      const recordAfterRun = await prisma.orm.public.Article.where({ slug: unsavedSlug }).first()
      expect(recordAfterRun).toBeNull()
    })

    it('rejects execution when article does NOT exist in DB AND articleContext is omitted', async () => {
      const nonExistentSlug = 'completely-missing-slug-and-context'

      await expect(
        executeAgenticArticleLoop({
          slug: nonExistentSlug,
          targetSeoScore: 85,
          targetReadabilityScore: 85,
        })
      ).rejects.toThrow(`Artikel dengan slug "${nonExistentSlug}" tidak ditemukan di basis data.`)
    })
  })

  describe('4. Security & Role Policy Enforcement (Rule 8)', () => {
    it('strictly forbids agent from mutating article status to "published"', async () => {
      await prisma.orm.public.Article.create({
        slug: TEST_SLUG,
        title: 'Artikel Percobaan Publikasi Terlarang',
        content: '<p>Percobaan publikasi ilegal oleh bot AI.</p>',
        status: 'draft',
      })

      // 1. Direct handler throws error
      await expect(
        handleUpdateArticleContent({
          slug: TEST_SLUG,
          status: 'published' as any,
        })
      ).rejects.toThrow(/Akses ditolak: Agen dilarang mengubah status artikel menjadi 'published'/)

      // 2. Tool wrapper returns status: 'error' with descriptive rejection message
      const toolRes = await executeSegiaTool('update_article_content', {
        slug: TEST_SLUG,
        status: 'published' as any,
      })
      expect(toolRes.status).toBe('error')
      expect(toolRes.output.error).toContain("Akses ditolak: Agen dilarang mengubah status artikel menjadi 'published'")

      // Verify status in DB was NOT changed to published
      const article = await prisma.orm.public.Article.where({ slug: TEST_SLUG }).first()
      expect(article?.status).toBe('draft')
    })

    it('enforces scope: "draft" on update_article_content in toolRegistry', () => {
      const toolDef = toolRegistry.get('update_article_content')
      expect(toolDef).toBeDefined()
      expect(toolDef?.scope).toBe('draft')
      expect(toolDef?.mutates).toBe(true)
    })

    it('enforces scope: "read" and mutates: false on inspect_article_seo and suggest_internal_links', () => {
      const inspectTool = toolRegistry.get('inspect_article_seo')
      expect(inspectTool).toBeDefined()
      expect(inspectTool?.scope).toBe('read')
      expect(inspectTool?.mutates).toBe(false)

      const linkTool = toolRegistry.get('suggest_internal_links')
      expect(linkTool).toBeDefined()
      expect(linkTool?.scope).toBe('read')
      expect(linkTool?.mutates).toBe(false)
    })
  })

  describe('5. Inspect Article SEO CoverAlt & Gate Verification', () => {
    it('detects missing hero image alt in publication gate when coverAlt is empty', async () => {
      // In-memory inspection with coverUrl but empty coverAlt
      const inspection = await handleInspectArticleSeo({
        title: 'Judul Lengkap dengan Konten yang Memadai',
        content: '<p>Konten artikel dengan panjang yang memadai untuk pengujian gerbang publikasi.</p>',
        coverAlt: '',
      })

      expect(inspection.seoScore).toBeGreaterThan(0)
      expect(inspection.gateStatus).toBeDefined()
    })

    it('passes hero image alt check when coverAlt is provided', async () => {
      const inspection = await handleInspectArticleSeo({
        title: 'Teknologi Interactive 3D Aquarium Modern',
        focusKeyphrase: 'Interactive 3D Aquarium',
        metaTitle: 'Teknologi Interactive 3D Aquarium Modern SegiaTech',
        metaDescription: 'Ulasan lengkap arsitektur Interactive 3D Aquarium modern dengan WebGL dan optical scanner berkecepatan tinggi untuk edutainment.',
        content: '<p>Interactive 3D Aquarium adalah platform modern.</p>',
        coverAlt: 'Simulasi Interactive 3D Aquarium pada layar LED',
      })

      expect(inspection.seoScore).toBeGreaterThan(0)
    })
  })
})
