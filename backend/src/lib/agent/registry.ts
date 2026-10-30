import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { parseBlocks } from '../blocks/schema'
import { findLinkTargets } from '../graph/search'
import { syncContentNode } from '../graph/nodes'
import { getActiveVoiceProfile, checkVoiceMatch } from '../voice/checker'
import {
  migrationTrafficDiff,
  redirectChainAudit,
  findStrikingDistance,
  findCannibalization,
  findLowCtr,
  detectContentDecay,
  findContentGaps,
} from '../seo/post-migration'
import { submitToIndexNow } from '../seo/indexnow'
import { handleInspectArticleSeo, handleUpdateArticleContent, handleSuggestInternalLinks } from '../ai/tools'
import { blockOntology, composeAndValidateBlocks } from '../blocks/ontology'

// ─── Types and Interfaces ───────────────────────────────────────────────────

export type ToolScope = 'read' | 'draft' | 'admin'
export type ToolCategory = 'content' | 'seo' | 'graph' | 'landing' | 'tone' | 'system'

export interface AgentTool<TInput = any, TOutput = any> {
  name: string
  label: string
  description: string
  category: ToolCategory
  scope: ToolScope
  mutates: boolean
  idempotent: boolean
  costHint?: 'free' | 'low' | 'moderate' | 'high'
  parameters: z.ZodObject<any>
  outputSchema?: z.ZodType<TOutput>
  handler: (input: TInput, context?: { actor?: string; actorRole?: string }) => Promise<TOutput>
}

// ─── Tool Registry Container ────────────────────────────────────────────────

class ToolRegistry {
  private tools = new Map<string, AgentTool>()

  public register(tool: AgentTool) {
    // Enforcement: No tool with scope 'publish' allowed for agents (ADR-0011 §4 & §17)
    if ((tool.scope as string) === 'publish') {
      throw new Error(`[Registry] Registration rejected: Agents are prohibited from holding 'publish' scope. Tool: ${tool.name}`)
    }
    this.tools.set(tool.name, tool)
  }

  public get(name: string): AgentTool | undefined {
    return this.tools.get(name)
  }

  public list(filter?: { scope?: ToolScope; category?: ToolCategory }): AgentTool[] {
    let list = Array.from(this.tools.values())
    if (filter?.scope) {
      list = list.filter((t) => t.scope === filter.scope)
    }
    if (filter?.category) {
      list = list.filter((t) => t.category === filter.category)
    }
    return list
  }

  public async execute(
    name: string,
    rawInput: any,
    context?: { actor?: string; actorRole?: string; tokenScope?: ToolScope }
  ): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool "${name}" tidak ditemukan di registri.`)
    }

    // Role / Scope Enforcement: Read-only tokens cannot execute mutating tools
    if (context?.tokenScope === 'read' && tool.mutates) {
      throw new Error(`Akses ditolak: Token 'read' tidak diizinkan mengeksekusi tool mutasi "${name}".`)
    }

    // Parse and validate input schema with Zod
    const parsedInput = tool.parameters.parse(rawInput || {})
    
    // Execute handler
    const result = await tool.handler(parsedInput, context)

    // If tool mutates, record audit log
    if (tool.mutates) {
      try {
        await prisma.orm.public.SeoAuditLog.create({
          entityType: 'agent_tool',
          entityId: tool.name,
          action: `EXECUTE_${tool.name.toUpperCase()}`,
          actor: context?.actor || 'ai_agent',
          diff: JSON.stringify({ input: parsedInput, output: typeof result === 'object' ? Object.keys(result) : result }),
        })
      } catch (err) {
        console.warn(`[Registry] Failed to log tool mutation:`, err)
      }
    }

    return result
  }

  /**
   * Export declarations compatible with Gemini Function Declarations
   */
  public toGeminiFunctionDeclarations(): Array<{ name: string; description: string; parameters: any }> {
    return this.list().map((tool) => {
      // Basic translation of Zod shape to JSON Schema
      const shape = tool.parameters.shape
      const properties: Record<string, any> = {}
      const required: string[] = []

      for (const [key, prop] of Object.entries(shape) as [string, any][]) {
        properties[key] = {
          type: prop._def.typeName === 'ZodNumber' ? 'number' : prop._def.typeName === 'ZodBoolean' ? 'boolean' : 'string',
          description: prop.description || key,
        }
        if (!prop.isOptional()) {
          required.push(key)
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        },
      }
    })
  }
}

export const toolRegistry = new ToolRegistry()

// ─── Register Core Tools ────────────────────────────────────────────────────

// 1. Post-Migration SEO: migration_traffic_diff
toolRegistry.register({
  name: 'migration_traffic_diff',
  label: 'Analisis Trafik Migrasi WordPress',
  description: 'Gunakan untuk membandingkan metrik trafik organik (klik & impresi) sebelum vs sesudah migrasi URL WordPress ke Next.js. Jangan gunakan untuk pencarian konten umum.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    minImpressions: z.number().optional().describe('Batas minimal impresi legacy untuk dianalisis (default 0)'),
  }),
  handler: async (input) => migrationTrafficDiff(input),
})

// 2. Post-Migration SEO: redirect_chain_audit
toolRegistry.register({
  name: 'redirect_chain_audit',
  label: 'Audit Rantai & Siklus Pengalihan 301',
  description: 'Gunakan untuk mendeteksi rantai pengalihan multi-hop (A → B → C), redirect loop, dan self-redirect di tabel redirects. Jangan gunakan bila tidak memeriksa 301.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({}),
  handler: async () => redirectChainAudit(),
})

// 3. Post-Migration SEO: find_striking_distance
toolRegistry.register({
  name: 'find_striking_distance',
  label: 'Peluang Ranking Striking Distance (Posisi 8-20)',
  description: 'Gunakan untuk menemukan kueri pencarian organik dengan posisi rata-rata 8-20 dan impresi tinggi yang siap didorong ke Top 3 Google.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    minImpressions: z.number().optional().describe('Batas minimal impresi pencarian (default 150)'),
    locale: z.string().optional().describe('Kode bahasa (default "id")'),
  }),
  handler: async (input) => findStrikingDistance(input),
})

// 4. Post-Migration SEO: find_cannibalization
toolRegistry.register({
  name: 'find_cannibalization',
  label: 'Deteksi Kanibalisasi Kueri Organik',
  description: 'Gunakan untuk mendeteksi apakah terdapat 2 atau lebih URL halaman yang memperebutkan kueri pencarian Google yang sama.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({}),
  handler: async () => findCannibalization(),
})

// 5. Post-Migration SEO: find_low_ctr
toolRegistry.register({
  name: 'find_low_ctr',
  label: 'Deteksi Kueri Peringkat Tinggi dengan CTR Rendah',
  description: 'Gunakan untuk menemukan kueri di posisi teratas Google (posisi <= 5) namun rasio klik (CTR) di bawah 5%, mengindikasikan judul atau meta deskripsi perlu dioptimalkan.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    minImpressions: z.number().optional().describe('Batas minimal impresi pencarian (default 100)'),
  }),
  handler: async (input) => findLowCtr(input),
})

// 6. Post-Migration SEO: detect_content_decay
toolRegistry.register({
  name: 'detect_content_decay',
  label: 'Deteksi Peluruhan Trafik Konten',
  description: 'Gunakan untuk menemukan halaman-halaman yang mengalami penurunan klik atau impresi > 20% antar rentang waktu.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    daysThreshold: z.number().optional().describe('Ambang hari perbandingan (default 30)'),
  }),
  handler: async (input) => detectContentDecay(input),
})

// 7. Post-Migration SEO: find_content_gaps
toolRegistry.register({
  name: 'find_content_gaps',
  label: 'Analisis Kesenjangan Konten (Content Gaps)',
  description: 'Gunakan untuk mendeteksi kueri pencarian bertrafik organik tinggi yang belum memiliki artikel atau layanan khusus di website.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    minImpressions: z.number().optional().describe('Minimal impresi kueri yang dianalisis (default 80)'),
  }),
  handler: async (input) => findContentGaps(input),
})

// 8. Database / Content: db_articles_query & alias sqlite_articles_query
const articlesQueryHandler = async (input: any) => {
  const limit = input.limit || 5
  if (input.action === 'count') {
    const [allCount, draftCount, pubCount] = await Promise.all([
      prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Article.where({ status: 'draft' }).aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Article.where({ status: 'published' }).aggregate((a: any) => ({ count: a.count() })),
    ])
    return { total: allCount?.count || 0, draft: draftCount?.count || 0, published: pubCount?.count || 0 }
  }
  if (input.keyword) {
    const all = await prisma.orm.public.Article.include('category').all()
    return all
      .filter((a: any) =>
        (a.title && a.title.toLowerCase().includes(input.keyword!.toLowerCase())) ||
        (a.slug && a.slug.toLowerCase().includes(input.keyword!.toLowerCase())) ||
        (a.primaryKeyword && a.primaryKeyword.toLowerCase().includes(input.keyword!.toLowerCase()))
      )
      .slice(0, limit)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        category: a.category?.name || 'Umum',
        excerpt: a.excerpt ? a.excerpt.slice(0, 100) + '...' : '',
      }))
  }
  if (input.status && input.status !== 'all') {
    const rows = await prisma.orm.public.Article.where({ status: input.status }).include('category').all()
    return rows.slice(0, limit).map((a: any) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      category: a.category?.name || 'Umum',
      excerpt: a.excerpt ? a.excerpt.slice(0, 100) + '...' : '',
    }))
  }
  const rows = await prisma.orm.public.Article.include('category').all()
  return rows.slice(0, limit).map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    category: a.category?.name || 'Umum',
    excerpt: a.excerpt ? a.excerpt.slice(0, 100) + '...' : '',
  }))
}

const articlesQueryToolConfig = {
  label: 'Kueri Basis Data Artikel (Prisma 8 ORM)',
  description: 'Gunakan untuk mencari, menyaring, atau menghitung artikel di basis data PostgreSQL via Prisma 8. Jangan gunakan untuk portofolio atau layanan.',
  category: 'content' as const,
  scope: 'read' as const,
  mutates: false,
  idempotent: true,
  costHint: 'free' as const,
  parameters: z.object({
    action: z.enum(['count', 'list', 'search']).describe('Aksi kueri'),
    keyword: z.string().optional().describe('Kata kunci pencarian'),
    status: z.enum(['all', 'published', 'draft']).optional().describe('Filter status publikasi'),
    limit: z.number().optional().describe('Batas jumlah hasil (default 5)'),
  }),
  handler: articlesQueryHandler,
}

toolRegistry.register({ name: 'db_articles_query', ...articlesQueryToolConfig })
toolRegistry.register({ name: 'sqlite_articles_query', ...articlesQueryToolConfig })

// 9. Database / Content: db_portfolio_query & alias sqlite_portfolio_query
const portfolioQueryHandler = async (input: any) => {
  const limit = input.limit || 5
  if (input.action === 'count') {
    const res = await prisma.orm.public.Portfolio.aggregate((a: any) => ({ count: a.count() }))
    return { total: res?.count || 0 }
  }
  if (input.keyword) {
    const all = await prisma.orm.public.Portfolio.all()
    return all
      .filter((p: any) =>
        (p.title && p.title.toLowerCase().includes(input.keyword!.toLowerCase())) ||
        (p.client && p.client.toLowerCase().includes(input.keyword!.toLowerCase()))
      )
      .slice(0, limit)
      .map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, client: p.client, year: p.year }))
  }
  const rows = await prisma.orm.public.Portfolio.all()
  return rows.slice(0, limit).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, client: p.client, year: p.year }))
}

const portfolioQueryToolConfig = {
  label: 'Kueri Portofolio Klien (Prisma 8 ORM)',
  description: 'Gunakan untuk mencari atau menghitung data portofolio dan studi kasus creative engineering di basis data PostgreSQL via Prisma 8.',
  category: 'content' as const,
  scope: 'read' as const,
  mutates: false,
  idempotent: true,
  costHint: 'free' as const,
  parameters: z.object({
    action: z.enum(['count', 'list', 'search']).describe('Aksi kueri'),
    keyword: z.string().optional().describe('Kata kunci pencarian portofolio'),
    limit: z.number().optional().describe('Batas jumlah hasil (default 5)'),
  }),
  handler: portfolioQueryHandler,
}

toolRegistry.register({ name: 'db_portfolio_query', ...portfolioQueryToolConfig })
toolRegistry.register({ name: 'sqlite_portfolio_query', ...portfolioQueryToolConfig })

// 10. Database / Content: db_services_query & alias sqlite_services_query
const servicesQueryHandler = async (input: any) => {
  const limit = input.limit || 5
  if (input.action === 'count') {
    const res = await prisma.orm.public.Service.aggregate((a: any) => ({ count: a.count() }))
    return { total: res?.count || 0 }
  }
  if (input.keyword) {
    const all = await prisma.orm.public.Service.all()
    return all
      .filter((s: any) => s.name && s.name.toLowerCase().includes(input.keyword!.toLowerCase()))
      .slice(0, limit)
      .map((s: any) => ({ id: s.id, name: s.name, slug: s.slug, categoryId: s.categoryId }))
  }
  const rows = await prisma.orm.public.Service.all()
  return rows.slice(0, limit).map((s: any) => ({ id: s.id, name: s.name, slug: s.slug, categoryId: s.categoryId }))
}

const servicesQueryToolConfig = {
  label: 'Kueri Katalog Layanan Digital (Prisma 8 ORM)',
  description: 'Gunakan untuk mencari atau menghitung katalog layanan digital enterprise di basis data PostgreSQL via Prisma 8.',
  category: 'content' as const,
  scope: 'read' as const,
  mutates: false,
  idempotent: true,
  costHint: 'free' as const,
  parameters: z.object({
    action: z.enum(['count', 'list', 'search']).describe('Aksi kueri'),
    keyword: z.string().optional().describe('Kata kunci layanan'),
    limit: z.number().optional().describe('Batas jumlah hasil (default 5)'),
  }),
  handler: servicesQueryHandler,
}

toolRegistry.register({ name: 'db_services_query', ...servicesQueryToolConfig })
toolRegistry.register({ name: 'sqlite_services_query', ...servicesQueryToolConfig })

// 11. Draft Content: create_article_draft (Rule 8: mutates: true, scope: 'draft', never publish)
toolRegistry.register({
  name: 'create_article_draft',
  label: 'Buat Draf Artikel Terproteksi (Rule 8)',
  description: 'Gunakan untuk membuat draf artikel baru yang otomatis tersimpan aman di PostgreSQL via Prisma 8 sebagai status "draft". Agen dilarang menerbitkan langsung ke status published.',
  category: 'content',
  scope: 'draft',
  mutates: true,
  idempotent: false,
  costHint: 'moderate',
  parameters: z.object({
    title: z.string().describe('Judul artikel'),
    topic: z.string().describe('Topik bahasan'),
    content: z.string().describe('Isi artikel (Markdown)'),
    excerpt: z.string().optional().describe('Ringkasan artikel'),
    focusKeyphrase: z.string().optional().describe('Fokus kata kunci SEO'),
  }),
  handler: async (input, context) => {
    const cleanSlug = input.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .slice(0, 80)

    const created = await prisma.orm.public.Article.create({
      title: input.title,
      slug: cleanSlug,
      content: input.content,
      excerpt: input.excerpt || input.title,
      status: 'draft', // MANDATORY: Agents only write draft (ADR-0011 §4)
      focusKeyphrase: input.focusKeyphrase || undefined,
    })

    return {
      success: true,
      id: created.id,
      slug: created.slug,
      status: created.status,
      message: `Draf artikel "${created.title}" berhasil disimpan ke database dengan status DRAFT.`,
    }
  },
})

// 12. SEO: redirect_301_inspector
toolRegistry.register({
  name: 'redirect_301_inspector',
  label: 'Inspeksi Aturan Pengalihan 301',
  description: 'Gunakan untuk memeriksa keberadaan atau rincian aturan 301 redirect untuk path URL tertentu.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    path: z.string().optional().describe('Path URL yang ingin diperiksa pengalihannya'),
    limit: z.number().optional().describe('Batas jumlah aturan pengalihan (default 10)'),
  }),
  handler: async (input) => {
    if (input.path) {
      const match = await prisma.orm.public.Redirect.where({ sourcePath: input.path }).first()
      return { found: Boolean(match), redirect: match || null }
    }
    const list = await prisma.orm.public.Redirect.limit(input.limit || 10).all()
    return { count: list.length, redirects: list }
  },
})

// 13. System: system_status
toolRegistry.register({
  name: 'system_status',
  label: 'Status Sistem & Diagnostik Database',
  description: 'Gunakan untuk mendapatkan status kesehatan sistem platform SegiaTech, latensi database PostgreSQL via Prisma 8, dan jumlah record aktif.',
  category: 'system',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({}),
  handler: async () => {
    const t0 = Date.now()
    const [artCount, portCount, servCount, redirCount] = await Promise.all([
      prisma.orm.public.Article.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Portfolio.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Service.aggregate((a: any) => ({ count: a.count() })),
      prisma.orm.public.Redirect.aggregate((a: any) => ({ count: a.count() })),
    ])
    const latencyMs = Date.now() - t0

    return {
      status: 'healthy',
      engine: 'Next.js 16 + PostgreSQL (Prisma 8 ORM)',
      dbLatencyMs: latencyMs,
      counts: {
        articles: artCount?.count || 0,
        portfolios: portCount?.count || 0,
        services: servCount?.count || 0,
        redirects: redirCount?.count || 0,
      },
    }
  },
})

// 14. SEO: submit_indexnow
toolRegistry.register({
  name: 'submit_indexnow',
  label: 'Kirim URL ke IndexNow',
  description: 'Gunakan untuk mengirimkan daftar URL halaman yang diperbarui ke jaringan IndexNow (Bing/Yandex).',
  category: 'seo',
  scope: 'admin',
  mutates: true,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    urls: z.array(z.string()).describe('Daftar URL yang ingin dikirimkan'),
  }),
  handler: async (input) => submitToIndexNow(input.urls),
})

// 15. Blocks: list_block_types (L10-T3)
toolRegistry.register({
  name: 'list_block_types',
  label: 'Katalog Tipe Blok Presentasi Visual',
  description: 'Gunakan untuk melihat seluruh jenis blok presentasi visual yang valid dan didukung oleh sistem (misalnya: hero-service, feature-bento-grid, faq-accordion, client-stats-impact, dsb).',
  category: 'landing',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({}),
  handler: async () => {
    return {
      schemaVersion: 1,
      totalTypes: 25,
      supportedTypes: [
        'hero-department',
        'hero-service',
        'feature-bento-grid',
        'tech-stack-chips',
        'executive-quote-card',
        'engineering-pillars',
        'workflow-phases',
        'comparison-matrix',
        'architecture-blueprint',
        'client-stats-impact',
        'deliverables-checklist',
        'interactive-tech-matrix',
        'department-service-list',
        'visual-showcase-gallery',
        'media-showcase',
        'portfolio-proof-grid',
        'faq-accordion',
        'studio-cta',
        'paragraph',
        'heading2',
        'hero-case-study',
        'case-study-chapter',
        'blocks.hero',
        'blocks.feature-grid',
        'blocks.rich-text',
      ],
    }
  },
})

// 16. Blocks: validate_page_blocks (L10-T3)
toolRegistry.register({
  name: 'validate_page_blocks',
  label: 'Validasi Skema Blok Halaman JSON',
  description: 'Gunakan untuk memvalidasi array blok JSON halaman terhadap skema resmi SegiaTech Zod v1 sebelum disimpan ke database.',
  category: 'landing',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    blocks: z.array(z.record(z.string(), z.any())).describe('Array blok JSON yang ingin divalidasi'),
  }),
  handler: async (input) => {
    const result = parseBlocks(input.blocks)
    return {
      valid: result.ok,
      blockCount: result.blocks.length,
      issues: result.issues || [],
      message: result.ok
        ? `Validasi berhasil: Seluruh ${result.blocks.length} blok memenuhi spesifikasi skema v1.`
        : `Validasi gagal dengan ${result.issues?.length || 0} masalah skema.`,
    }
  },
})

// 17. Database: sqlite_solutions_query (L10-T3)
toolRegistry.register({
  name: 'sqlite_solutions_query',
  label: 'Kueri Solusi Industri Enterprise',
  description: 'Gunakan untuk mencari atau menghitung katalog solusi industri enterprise (17 solusi) di SQLite database.',
  category: 'content',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    action: z.enum(['count', 'list', 'search']).describe('Aksi kueri'),
    keyword: z.string().optional().describe('Kata kunci solusi'),
    limit: z.number().optional().describe('Batas jumlah hasil (default 5)'),
  }),
  handler: async (input) => {
    const limit = input.limit || 5
    if (input.action === 'count') {
      const res = await prisma.orm.public.Solution.aggregate((a: any) => ({ count: a.count() }))
      return { total: res?.count || 0 }
    }
    if (input.keyword) {
      const all = await prisma.orm.public.Solution.all()
      return all
        .filter((s: any) =>
          (s.title && s.title.toLowerCase().includes(input.keyword!.toLowerCase())) ||
          (s.slug && s.slug.toLowerCase().includes(input.keyword!.toLowerCase()))
        )
        .slice(0, limit)
        .map((s: any) => ({ id: s.id, title: s.title, slug: s.slug, category: s.category }))
    }
    const rows = await prisma.orm.public.Solution.limit(limit).all()
    return rows.map((s: any) => ({ id: s.id, title: s.title, slug: s.slug, category: s.category }))
  },
})

// 18. Database: sqlite_service_categories_query (L10-T3)
toolRegistry.register({
  name: 'sqlite_service_categories_query',
  label: 'Kueri Kategori Departemen Layanan',
  description: 'Gunakan untuk mencari atau melihat 4 departemen kategori layanan utama di database.',
  category: 'content',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({}),
  handler: async () => {
    const rows = await prisma.orm.public.ServiceCategory.all()
    return {
      count: rows.length,
      categories: rows.map((c: any) => ({ id: c.id, title: c.title, slug: c.slug, tag: c.tag })),
    }
  },
})

// 19. Graph: find_link_targets (ADR-0010 / Sprint S4)
toolRegistry.register({
  name: 'find_link_targets',
  label: 'Temukan Target Link Internal (Content Graph)',
  description: 'Gunakan untuk menemukan target tautan internal paling relevan berdasarkan kluster, kata kunci, atau lokasi kota untuk disisipkan sebagai link card atau tautan kontekstual.',
  category: 'graph',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    sourceNodeId: z.number().optional().describe('ID node sumber saat ini agar terhindar dari self-linking'),
    keyword: z.string().optional().describe('Kata kunci relevan atau topik target'),
    location: z.string().optional().describe('Lokasi kota spesifik jika ada target regional'),
    limit: z.number().optional().describe('Jumlah target tautan yang ingin diambil (default 5)'),
  }),
  handler: async (input) => {
    const targets = await findLinkTargets({
      sourceNodeId: input.sourceNodeId,
      text: input.keyword,
      location: input.location,
      limit: input.limit || 5,
    })
    return {
      count: targets.length,
      targets: targets.map((t) => ({
        id: t.nodeId,
        type: t.type,
        title: t.title,
        url: t.url,
        score: t.score,
        reason: t.reason,
      })),
    }
  },
})

// 20. Graph: sync_content_node (ADR-0010 / Sprint S4)
toolRegistry.register({
  name: 'sync_content_node',
  label: 'Sinkronisasi Node Konten ke Graph',
  description: 'Gunakan untuk memperbarui atau menyinkronkan entitas artikel, layanan, portofolio, atau landing page ke indeks content_nodes.',
  category: 'graph',
  scope: 'draft',
  mutates: true,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    type: z.enum(['article', 'landing', 'service', 'solution', 'portfolio', 'page']).describe('Tipe entitas'),
    idOrSlug: z.union([z.string(), z.number()]).describe('ID atau slug entitas yang ingin disinkronkan'),
  }),
  handler: async (input) => {
    const node = await syncContentNode(input.type, input.idOrSlug)
    if (!node) {
      return { success: false, message: `Entitas ${input.type} dengan referensi ${input.idOrSlug} tidak ditemukan.` }
    }
    return { success: true, node }
  },
})

// 23. Tone: get_voice_profile (ADR-0012 / Sprint S6)
toolRegistry.register({
  name: 'get_voice_profile',
  label: 'Dapatkan Profil Brand Voice Editorial',
  description: 'Gunakan untuk melihat pedoman gaya tone suara aktif, stylometri target, frasa terlarang, dan istilah wajib SegiaTech.',
  category: 'tone',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({}),
  handler: async () => {
    const profile = await getActiveVoiceProfile()
    if (!profile) {
      return { found: false, message: 'Tidak ada profil brand voice yang aktif di database.' }
    }
    return {
      found: true,
      name: profile.name,
      guide: profile.guide,
      stylometry: profile.stylometry,
      lexicon: profile.lexicon,
    }
  },
})

// 24. Tone: check_voice_match (ADR-0012 / Sprint S6)
toolRegistry.register({
  name: 'check_voice_match',
  label: 'Evaluasi Kecocokan Tone Brand Konten',
  description: 'Gunakan untuk memeriksa kecocokan draf tulisan terhadap stylometri editorial SegiaTech, mendeteksi pelanggaran email mentah, dan klaim terlarang.',
  category: 'tone',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    content: z.string().describe('Teks markdown atau konten draf yang ingin dievaluasi kecocokan suaranya'),
  }),
  handler: async (input) => {
    return checkVoiceMatch(input.content)
  },
})

// 25. SEO / Editorial: inspect_article_seo (M1 Feature 2)
toolRegistry.register({
  name: 'inspect_article_seo',
  label: 'Inspeksi Real-Time SEO & Keterbacaan Artikel',
  description: 'Gunakan untuk menganalisis skor SEO on-page (0-100), skor keterbacaan (readability 0-100), indikator masalah/peringatan (Yoast-parity), serta kepatuhan gerbang publikasi (publication gate) untuk artikel atau draf aktif.',
  category: 'seo',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    slug: z.string().optional().describe('Slug artikel di basis data untuk memuat data dasar awal jika ada'),
    title: z.string().optional().describe('Judul artikel baru atau yang sedang diedit di editor'),
    content: z.string().optional().describe('Isi teks/markdown artikel yang ingin diperiksa skor SEO & keterbacaannya'),
    focusKeyphrase: z.string().optional().describe('Kata kunci utama (focus keyphrase) target SEO'),
    metaTitle: z.string().optional().describe('Judul SEO (meta title / seoTitle, target 40-65 karakter)'),
    metaDescription: z.string().optional().describe('Deskripsi meta (meta description, target 120-160 karakter)'),
    coverAlt: z.string().optional().describe('Teks alternatif (alt text) untuk cover/hero image artikel'),
  }),
  handler: async (input) => handleInspectArticleSeo(input),
})

// 26. Content / Editorial: update_article_content (M1 Feature 2)
toolRegistry.register({
  name: 'update_article_content',
  label: 'Pembaruan Konten & SEO Artikel (Prisma 8 ORM)',
  description: 'Gunakan untuk memperbarui teks artikel, judul, meta title, meta description, focus keyphrase, alt text cover, kategori, atau tags secara langsung di basis data PostgreSQL dan menghasilkan perubahan terstruktur untuk kanvas editor. Dilarang menerbitkan langsung ke published (Rule 8).',
  category: 'content',
  scope: 'draft',
  mutates: true,
  idempotent: false,
  costHint: 'moderate',
  parameters: z.object({
    slug: z.string().min(1, 'Slug artikel wajib diisi').describe('Slug artikel target yang akan diperbarui di basis data'),
    title: z.string().optional().describe('Judul baru artikel'),
    excerpt: z.string().optional().describe('Ringkasan / excerpt artikel'),
    content: z.string().optional().describe('Isi konten lengkap yang telah dioptimasi dalam format Markdown atau HTML'),
    focusKeyphrase: z.string().optional().describe('Kata kunci fokus target SEO (focus keyphrase)'),
    metaTitle: z.string().optional().describe('Judul SEO baru (seoTitle, target 40-65 karakter)'),
    metaDescription: z.string().optional().describe('Meta description baru (target 120-160 karakter)'),
    coverAlt: z.string().optional().describe('Teks alternatif (alt text) untuk cover/hero visual'),
    tags: z.array(z.string()).optional().describe('Daftar tag artikel'),
    category: z.string().optional().describe('Nama kategori artikel (misalnya: "Website Development", "Artificial Intelligence")'),
    status: z.enum(['draft', 'in_review']).optional().describe('Status editorial artikel (agen dilarang mengubah ke published)'),
  }),
  handler: async (input, context) => handleUpdateArticleContent(input, context),
})

// 27. Graph / Linking: suggest_internal_links (M1 Feature 2)
toolRegistry.register({
  name: 'suggest_internal_links',
  label: 'Rekomendasi Link Internal Otomatis (Content Graph & Database)',
  description: 'Gunakan untuk menemukan rekomendasi URL tautan internal yang relevan dari katalog layanan, portofolio studi kasus, dan artikel terbitan berdasarkan topik atau teks artikel, lengkap dengan variasi anchor text yang dioptimasi untuk SEO.',
  category: 'graph',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    topic: z.string().optional().describe('Topik, kata kunci, atau teks konteks artikel untuk mencari target tautan internal yang relevan'),
    limit: z.number().optional().default(5).describe('Batas jumlah rekomendasi link internal yang dikembalikan (default 5, maksimal 20)'),
    excludeSlug: z.string().optional().describe('Slug artikel saat ini agar terhindar dari self-linking (tautan ke diri sendiri)'),
  }),
  handler: async (input) => handleSuggestInternalLinks(input),
})

// 28. Studio / Dynamic Blocks: get_block_catalog (ADR-0012)
toolRegistry.register({
  name: 'get_block_catalog',
  label: 'Katalog Blok Dinamis Studio (Ontology & Sequence)',
  description: 'Gunakan untuk menginspeksi jenis-jenis blok yang tersedia di Segia Studio Canvas (editorial & visual), kegunaan, urutan narasi ideal (#10 Hook -> #80 CTA), serta parameter input dan efek visualnya.',
  category: 'content',
  scope: 'read',
  mutates: false,
  idempotent: true,
  costHint: 'free',
  parameters: z.object({
    pageKind: z.enum(['article', 'service', 'solution', 'landing', 'portfolio', 'all']).optional().describe('Filter tipe halaman target (default "all")'),
    category: z.enum(['hero', 'editorial', 'feature', 'architecture', 'data', 'social-proof', 'interactive', 'conversion']).optional().describe('Filter kategori blok'),
  }),
  handler: async (input) => {
    const list = blockOntology.list({
      category: input.category as any,
      pageKind: input.pageKind as any,
    })
    const sequence = blockOntology.getRecommendedSequence((input.pageKind || 'article') as any)
    return {
      totalBlocks: list.length,
      recommendedSequence: sequence,
      blocks: list.map((b) => ({
        type: b.type,
        label: b.label,
        category: b.category,
        purpose: b.purpose,
        hierarchyIndex: b.idealHierarchyIndex,
        inputs: b.inputs,
        examplePayload: b.examplePayload,
      })),
    }
  },
})

// 29. Studio / Dynamic Blocks: compose_page_blocks (ADR-0012)
toolRegistry.register({
  name: 'compose_page_blocks',
  label: 'Validasi & Komposisi Blok Kanvas Halaman',
  description: 'Gunakan untuk memvalidasi dan memformat susunan blok-blok JSON pada editor Studio sesuai kontrak Discriminated Union Zod Schema (K-2), memastikan kepatuhan atribut dan penomoran ID otomatis.',
  category: 'content',
  scope: 'draft',
  mutates: false,
  idempotent: true,
  costHint: 'low',
  parameters: z.object({
    blocks: z.array(z.record(z.string(), z.any())).min(1, 'Minimal satu blok harus disertakan').describe('Array objek blok yang akan divalidasi dan diformat'),
    targetPageKind: z.enum(['article', 'service', 'solution', 'landing', 'portfolio', 'all']).optional().describe('Tipe halaman target'),
  }),
  handler: async (input) => composeAndValidateBlocks(input as any),
})

