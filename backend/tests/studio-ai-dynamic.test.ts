import { describe, it, expect, vi } from 'vitest'
import { buildSystemPrompt } from '../src/lib/agent/llm'
import { handleAiAssistantChat } from '../src/lib/ai/chat'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        Article: {
          aggregate: vi.fn(async () => ({ count: 878 })),
          where: vi.fn(() => ({
            aggregate: vi.fn(async () => ({ count: 10 })),
            include: vi.fn(() => ({
              include: vi.fn(() => ({
                first: vi.fn(async () => null),
              })),
              first: vi.fn(async () => null),
            })),
            first: vi.fn(async () => null),
          })),
        },
        SiteSettings: {
          first: vi.fn(async () => ({
            siteName: 'SegiaTech',
            siteDescription: 'Creative Technology House',
            siteUrl: 'https://www.segiatech.com',
          })),
        },
        SiteConfig: {
          where: vi.fn(() => ({
            first: vi.fn(async () => null),
          })),
        },
      },
    },
  },
}))

describe('Studio AI Dynamic Context & Location Resolution', () => {
  it('buildSystemPrompt injects active location, slug, and publication gate status', async () => {
    const prompt = await buildSystemPrompt({
      currentTab: 'buat-artikel',
      pathname: '/admin/buat-artikel',
      role: 'SUPER_ADMIN',
      actorName: 'Chief Technology Officer',
      locationName: 'Studio Editor Artikel (website-development)',
      selectedSlug: 'website-development',
      pageTitle: 'Pengembangan Website Enterprise Modern',
      focusKeyphrase: 'jasa web enterprise',
      violations: '0 Pelanggaran (Lolos Gerbang Publikasi)',
    })

    expect(prompt).toContain('Studio Editor Artikel (website-development)')
    expect(prompt).toContain('/artikel/website-development')
    expect(prompt).toContain('Pengembangan Website Enterprise Modern')
    expect(prompt).toContain('jasa web enterprise')
    expect(prompt).toContain('0 Pelanggaran (Lolos Gerbang Publikasi)')
    expect(prompt).toContain('SUPER_ADMIN')
  })

  it('handleAiAssistantChat handles dynamic contextual responses with active location', async () => {
    const response = await handleAiAssistantChat(
      [{ role: 'user', content: 'Halo, cek status halaman ini' }],
      {
        currentTab: 'buat-artikel',
        pathname: '/admin/buat-artikel',
        role: 'SUPER_ADMIN',
        actorName: 'Admin SegiaTech',
        locationName: 'Studio Editor Artikel (/admin/buat-artikel)',
        pageTitle: 'Solusi Digital Enterprise',
        selectedSlug: 'solusi-digital',
      }
    )

    expect(response.reply).toBeDefined()
    expect(typeof response.reply).toBe('string')
  })

  it('buildSystemPrompt injects full active article context, SEO scores, and content', async () => {
    const prompt = await buildSystemPrompt({
      currentTab: 'buat-artikel',
      pathname: '/admin/buat-artikel',
      role: 'EDITOR',
      actorName: 'Penulis Konten',
      locationName: 'Studio Editor Artikel (arsitektur-nextjs-16)',
      article: {
        title: 'Arsitektur Next.js 16 Enterprise',
        slug: 'arsitektur-nextjs-16',
        category: 'Website Development',
        status: 'draft',
        locale: 'id',
        focusKeyphrase: 'arsitektur nextjs 16',
        seoTitle: 'Arsitektur Next.js 16 Enterprise — SegiaTech',
        metaDescription: 'Panduan teknis arsitektur Next.js 16 App Router dan Turbopack untuk enterprise.',
        coverUrl: '/images/articles/nextjs.jpg',
        coverAlt: 'Arsitektur Next.js 16 SegiaTech',
        content: '<p>Next.js 16 menghadirkan performa Turbopack dan App Router yang revolusioner.</p>',
        wordCount: 350,
        readingTimeMinutes: 2,
        internalLinksCount: 1,
        seoScore: 72,
        readabilityScore: 65,
        seoIndicators: [{ id: 'kw-title', label: 'Kata Kunci di Judul', status: 'good', message: 'Tepat' }],
        readabilityIndicators: [{ id: 'trans', label: 'Kata Transisi', status: 'problem', message: 'Hanya 15%', fixHint: 'Tingkatkan transisi' }],
      },
    })

    expect(prompt).toContain('Arsitektur Next.js 16 Enterprise')
    expect(prompt).toContain('Skor SEO Saat Ini: 72/100')
    expect(prompt).toContain('Skor Keterbacaan (Readability) Saat Ini: 65/100')
    expect(prompt).toContain('Next.js 16 menghadirkan performa Turbopack')
    expect(prompt).toContain('json:article-changes')
  })

  it('handleAiAssistantChat resolves article context and returns proposedChanges for optimization requests', async () => {
    const response = await handleAiAssistantChat(
      [{ role: 'user', content: 'tolong perbaiki penulisan artikel ini untuk membuat skor seo 100 dan keterbacaan 100 perbaiki masalahnya' }],
      {
        currentTab: 'buat-artikel',
        pathname: '/admin/buat-artikel',
        role: 'EDITOR',
        actorName: 'Penulis Konten',
        article: {
          title: 'Optimasi Web Vitals SegiaTech',
          slug: 'optimasi-web-vitals',
          category: 'Website Development',
          status: 'draft',
          locale: 'id',
          focusKeyphrase: 'optimasi web vitals',
          metaDescription: 'Deskripsi pendek.',
          content: '<p>Web vitals penting untuk performa situs web modern.</p>',
          wordCount: 150,
          internalLinksCount: 0,
          seoScore: 55,
          readabilityScore: 60,
          seoIndicators: [{ id: 'internal', label: 'Tautan Internal', status: 'problem', message: '0 tautan internal' }],
          readabilityIndicators: [{ id: 'trans', label: 'Transisi', status: 'problem', message: 'Kurang kata transisi' }],
        },
      }
    )

    expect(response.reply).toBeDefined()
    expect(response.reply).toContain('Optimasi Web Vitals SegiaTech')
    expect(response.reply).toContain('Skor SEO')
    expect(response.proposedChanges).toBeDefined()
    expect(response.proposedChanges.title).toBeDefined()
    expect(response.proposedChanges.metaDescription).toBeDefined()
  })
})
