import 'server-only'
import { z } from 'zod'
import { or } from '@prisma/orm-postgres/orm-client'
import { prisma } from '@/lib/db/prisma'
import {
  ArticleWriteError,
  createArticle,
  getAllCategoriesWithCounts,
  getArticleBySlug,
  getArticles,
  normalizeCategorySlug,
  updateArticle,
} from '@/lib/db/articles'
import { mergeEditorialSeo } from '@/lib/articles/editorialSeo'
import { blocksToContent, contentToBlocks } from '@/lib/articles/blockEditor'
import { extractContentImages } from '@/lib/publishing/validation'
import { checkPublicationGate } from '@/lib/seo/validation'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import { slugify } from '@/lib/pages/page-schema'
import type { Article } from '@/lib/content/types'
import {
  DRAFT_ONLY_HINT,
  EDITABLE_STATUSES,
  DraftError,
  defineTool,
  expectedUpdatedAtField,
  fail,
  fromDraftError,
  imageUrlField,
  mediaIdField,
  ok,
  readOnly,
  resolveImage,
  siteUrl,
  write,
  type McpTool,
  type ToolResult,
} from '../tool-kit'

/**
 * MCP tools for journal articles. Writes reuse the Studio repository
 * (`createArticle` / `updateArticle` in src/lib/db/articles.ts), which runs
 * each mutation in a transaction with ContentRevision + SeoAuditLog rows.
 * Status is always `draft` on create; updates are guarded inside the
 * transaction (status draft/in_review + expectedUpdatedAt).
 */

const ARTICLE_STATUSES = ['draft', 'in_review', 'approved', 'scheduled', 'published', 'archived'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_CONTENT = 200_000

export function articleUrls(article: { slug: string; status?: string }) {
  return {
    editUrl: `${siteUrl()}/admin/buat-artikel?slug=${encodeURIComponent(article.slug)}`,
    publicUrl: article.status === 'published' ? `${siteUrl()}/journal/${article.slug}` : null,
  }
}

function coverAltOf(article: Article): string {
  const og = article.seoData?.openGraph
  return og && typeof og === 'object' && typeof og.imageAlt === 'string' ? og.imageAlt : ''
}

/** The publication gate Studio applies before publishing/scheduling an article. */
export function articleGate(article: Article) {
  const gate = checkPublicationGate({
    locale: article.locale ?? 'id',
    title: article.title,
    slug: article.slug,
    metaDescription: article.seo?.metaDescription ?? '',
    seoTitle: article.seo?.metaTitle ?? '',
    existingSlugs: [],
    images: extractContentImages(article.content ?? ''),
    heroVisual: article.coverUrl ? { url: article.coverUrl, altText: coverAltOf(article), decorative: false } : null,
  })
  const describe = (v: { field: string; message: string }) => ({ field: v.field, message: v.message })
  return {
    ready: gate.canPublish,
    issues: gate.violations.map(describe),
    warnings: gate.warnings.map(describe),
    note: 'Only a human editor can publish or schedule, from the Studio (editUrl).',
  }
}

function articleView(article: Article, options: { includeContent: boolean }) {
  const status = article.status ?? 'draft'
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    status,
    editable: EDITABLE_STATUSES.includes(status),
    excerpt: article.excerpt,
    locale: article.locale ?? 'id',
    category: article.category ? { name: article.category.name, slug: article.category.slug } : null,
    author: article.author ? { name: article.author.name, slug: article.author.slug } : null,
    tags: (article.tags ?? []).map((t) => t.name),
    coverUrl: article.coverUrl ?? null,
    coverAlt: coverAltOf(article) || null,
    metaTitle: article.seo?.metaTitle ?? null,
    metaDescription: article.seo?.metaDescription ?? null,
    focusKeyphrase: article.focusKeyphrase ?? null,
    readingTime: article.readingTime ?? null,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt ?? null,
    ...articleUrls({ slug: article.slug, status }),
    ...(options.includeContent ? { content: article.content } : { contentLength: (article.content ?? '').length }),
    publication: articleGate(article),
  }
}

/** Converts MCP input to the HTML the article editor stores, sanitized like the Studio editor. */
export function toArticleHtml(content: string, format: 'html' | 'markdown'): string {
  let raw: string
  if (format === 'markdown') raw = blocksToContent(contentToBlocks(content))
  else if (content.trimStart().startsWith('<')) raw = content
  else raw = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`
  return sanitizeHtmlContent(raw).trim()
}

function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

async function findCategory(input: string): Promise<{ id: number; name: string } | null> {
  const value = input.trim()
  const slug = normalizeCategorySlug(value)
  return prisma.orm.public.Category.where((c) => or(c.slug.eq(value), c.slug.eq(slug), c.name.eq(value))).first()
}

async function findAuthor(input: string): Promise<{ id: number; name: string } | null> {
  const value = input.trim()
  return prisma.orm.public.Author.where((a) => or(a.slug.eq(value), a.name.eq(value))).first()
}

async function listAuthors() {
  const rows = await prisma.orm.public.Author.orderBy((a) => a.name.asc()).all()
  // Names and slugs only: author e-mails are never exposed to MCP clients.
  return rows.map((a) => ({ name: a.name, slug: a.slug }))
}

async function loadById(id: number): Promise<Article | null> {
  const row = await prisma.orm.public.Article.where({ id }).first()
  return row ? getArticleBySlug(row.slug) : null
}

type Relations = { ok: true; categoryId?: number; categoryName?: string; authorId?: number } | { ok: false; result: ToolResult }

async function resolveRelations(args: { category?: string; author?: string }): Promise<Relations> {
  const out: { categoryId?: number; categoryName?: string; authorId?: number } = {}
  if (args.category !== undefined) {
    const category = await findCategory(args.category)
    if (!category) {
      const available = (await getAllCategoriesWithCounts()).map((c) => ({ name: c.name, slug: c.slug }))
      return {
        ok: false,
        result: fail(`Unknown article category "${args.category}". Nothing was saved.`, {
          available,
          hint: 'Use an existing category name or slug (list_article_taxonomy), or omit category. New categories are created by a human in the Studio.',
        }),
      }
    }
    out.categoryId = category.id
    out.categoryName = category.name
  }
  if (args.author !== undefined) {
    const author = await findAuthor(args.author)
    if (!author) {
      return {
        ok: false,
        result: fail(`Unknown author "${args.author}". Nothing was saved.`, {
          available: await listAuthors(),
          hint: 'Use an existing author name or slug (list_article_taxonomy), or omit author.',
        }),
      }
    }
    out.authorId = author.id
  }
  return { ok: true, ...out }
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

const articleId = z.number().int().positive().describe('Article id (from list_articles, get_article or create_article_draft).')
const contentFormat = z
  .enum(['html', 'markdown'])
  .default('html')
  .describe('Format of content. HTML is stored as-is after sanitizing; markdown is converted by the article editor parser.')

const articleFields = {
  excerpt: z.string().trim().max(1000).optional().describe('Short summary shown on journal cards (1–2 sentences).'),
  category: z.string().trim().min(1).max(100).optional().describe('Existing category name or slug (see list_article_taxonomy).'),
  author: z.string().trim().min(1).max(100).optional().describe('Existing author name or slug (see list_article_taxonomy). Omit when unknown.'),
  tags: z.array(z.string().trim().min(1).max(100).regex(/[\p{L}\p{N}]/u, 'A tag needs a letter or digit.')).max(50).optional(),
  coverUrl: imageUrlField.optional().describe('Cover image: site path (e.g. from the Media library) or https URL. Never invent image URLs.'),
  coverMediaId: mediaIdField.optional(),
  coverAlt: z.string().trim().max(2000).optional().describe('Alt text for the cover image. Required before publishing when a cover is set.'),
  metaTitle: z.string().trim().max(300).optional().describe('SEO title (≤ 60 characters recommended).'),
  metaDescription: z.string().trim().max(500).optional().describe('SEO description (120–160 characters recommended).'),
  focusKeyphrase: z.string().trim().max(200).optional(),
  locale: z.enum(['id', 'en']).optional().describe('Article language. Default "id".'),
}

const createInput = z.strictObject({
  title: z.string().trim().min(1).max(300).describe('Article title (H1).'),
  slug: z.string().optional().describe('URL slug at /journal/<slug>: lowercase letters, digits, hyphens. Omit to derive from the title. Fixed after creation.'),
  content: z.string().min(1).max(MAX_CONTENT).describe('Article body. Use H2/H3 headings in order; every <img> needs alt text.'),
  contentFormat,
  ...articleFields,
})

const updateInput = z.strictObject({
  id: articleId,
  expectedUpdatedAt: expectedUpdatedAtField,
  title: z.string().trim().min(1).max(300).optional(),
  content: z.string().min(1).max(MAX_CONTENT).optional().describe('Replaces the whole body when provided.'),
  contentFormat,
  ...articleFields,
  coverUrl: imageUrlField.nullable().optional().describe('New cover image (site path or https URL); null removes the cover.'),
})

// ─── Tools ────────────────────────────────────────────────────────────────────

async function createDraft(args: z.output<typeof createInput>, actor: string): Promise<ToolResult> {
  const slug = slugify(args.slug ?? args.title)
  if (slug.length < 2 || !SLUG_PATTERN.test(slug)) return fail('Could not derive a valid slug. Pass slug explicitly (e.g. "panduan-scan-3d").')
  if (await getArticleBySlug(slug)) {
    return fail(`Slug "${slug}" is already used by another article. Nothing was saved.`, { code: 'slug_taken', hint: 'Choose a different slug and retry.' })
  }
  const html = toArticleHtml(args.content, args.contentFormat)
  if (!html) return fail('The content is empty after sanitizing. Nothing was saved.', { hint: 'Send semantic HTML (p, h2, h3, ul, img…) or markdown.' })
  const relations = await resolveRelations(args)
  if (!relations.ok) return relations.result
  const cover = await resolveImage({ url: args.coverUrl, mediaId: args.coverMediaId, alt: args.coverAlt })
  if (!cover.ok) return cover.result

  const seoData = mergeEditorialSeo(undefined, undefined, {
    metaTitle: args.metaTitle,
    metaDescription: args.metaDescription,
    coverAlt: cover.url ? (cover.alt ?? '') : undefined,
  })
  await createArticle({
    actor,
    title: args.title,
    slug,
    excerpt: args.excerpt ?? '',
    content: html,
    status: 'draft',
    tags: args.tags,
    categoryId: relations.categoryId,
    authorId: relations.authorId,
    coverUrl: cover.url ?? undefined,
    readingTime: readingMinutes(html),
    metaTitle: args.metaTitle,
    metaDescription: args.metaDescription,
    locale: args.locale ?? 'id',
    focusKeyphrase: args.focusKeyphrase,
    seoData,
    primaryCategory: relations.categoryName,
  })
  const saved = await getArticleBySlug(slug)
  if (!saved) return fail('The draft was saved but could not be read back. Call list_articles.')
  return ok({ created: true, article: articleView(saved, { includeContent: false }) })
}

async function updateDraft(args: z.output<typeof updateInput>, actor: string): Promise<ToolResult> {
  const current = await loadById(args.id)
  if (!current) return fail(`Article ${args.id} not found.`, { hint: 'Call list_articles to find a valid id.' })
  const status = current.status ?? 'draft'
  if (!EDITABLE_STATUSES.includes(status)) {
    return fail(`Article ${args.id} is ${status}; MCP clients can only edit draft or in_review articles.`, {
      code: 'forbidden',
      status,
      editUrl: articleUrls(current).editUrl,
      hint: `${DRAFT_ONLY_HINT} Ask a human editor to move it back to draft, or create a new draft with create_article_draft.`,
    })
  }
  if (args.expectedUpdatedAt !== current.updatedAt) {
    return fail('The article changed since you last read it. Nothing was saved.', {
      code: 'conflict',
      currentUpdatedAt: current.updatedAt,
      hint: 'Call get_article, re-apply your change, and pass the new updatedAt.',
    })
  }

  const data: NonNullable<Parameters<typeof updateArticle>[1]> = { actor }
  if (args.title !== undefined) data.title = args.title
  if (args.excerpt !== undefined) data.excerpt = args.excerpt
  if (args.content !== undefined) {
    const html = toArticleHtml(args.content, args.contentFormat)
    if (!html) return fail('The content is empty after sanitizing. Nothing was saved.')
    data.content = html
    data.readingTime = readingMinutes(html)
  }
  if (args.tags !== undefined) data.tags = args.tags
  if (args.focusKeyphrase !== undefined) data.focusKeyphrase = args.focusKeyphrase
  if (args.locale !== undefined) data.locale = args.locale
  if (args.metaTitle !== undefined) data.metaTitle = args.metaTitle
  if (args.metaDescription !== undefined) data.metaDescription = args.metaDescription

  const relations = await resolveRelations(args)
  if (!relations.ok) return relations.result
  if (relations.categoryId !== undefined) {
    data.categoryId = relations.categoryId
    if (relations.categoryName) data.primaryCategory = relations.categoryName
  }
  if (relations.authorId !== undefined) data.authorId = relations.authorId

  let coverAlt = args.coverAlt
  if (args.coverUrl !== undefined || args.coverMediaId !== undefined) {
    const cover = await resolveImage({ url: args.coverUrl, mediaId: args.coverMediaId, alt: args.coverAlt })
    if (!cover.ok) return cover.result
    // An empty string clears the cover (the repository stores strings only).
    data.coverUrl = cover.url ?? ''
    data.featuredImage = cover.url ?? ''
    coverAlt = cover.url ? (cover.alt ?? '') : ''
  }
  if (args.metaTitle !== undefined || args.metaDescription !== undefined || coverAlt !== undefined) {
    data.seoData = mergeEditorialSeo(current.seoData, undefined, { metaTitle: args.metaTitle, metaDescription: args.metaDescription, coverAlt })
  }
  if (Object.keys(data).length === 1) return fail('Nothing to update: pass at least one field to change.')

  try {
    await updateArticle(current.slug, data, { expectedUpdatedAt: current.updatedAt, editableStatuses: EDITABLE_STATUSES })
  } catch (err) {
    if (err instanceof ArticleWriteError) return fromDraftError(new DraftError(err.code, err.message), 'article')
    throw err
  }
  const saved = await getArticleBySlug(current.slug)
  if (!saved) return fail('The draft was saved but could not be read back. Call list_articles.')
  return ok({ updated: true, article: articleView(saved, { includeContent: false }) })
}

export const ARTICLE_TOOLS: readonly McpTool[] = [
  defineTool({
    name: 'list_articles',
    title: 'List articles',
    scope: 'articles:read',
    description:
      'Lists journal articles (all statuses by default): id, slug, title, status, updatedAt, editUrl and publicUrl. Filter by status, category or a search term.',
    input: z.strictObject({
      status: z.enum(ARTICLE_STATUSES).optional().describe('Only articles with this status.'),
      category: z.string().trim().min(1).max(100).optional().describe('Category name or slug.'),
      search: z.string().trim().min(1).max(200).optional().describe('Matches title, excerpt or body.'),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }),
    annotations: readOnly,
    run: async ({ status, category, search, page, pageSize }) => {
      const result = await getArticles({ status: status ?? 'all', category, search, page, pageSize })
      const articles = result.data.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        status: a.status ?? 'draft',
        category: a.category?.name ?? null,
        updatedAt: a.updatedAt,
        publishedAt: a.publishedAt ?? null,
        ...articleUrls({ slug: a.slug, status: a.status }),
      }))
      return ok({ total: result.meta.pagination.total, page, pageCount: result.meta.pagination.pageCount, articles })
    },
  }),

  defineTool({
    name: 'get_article',
    title: 'Get article',
    scope: 'articles:read',
    description:
      'Returns one article by id or slug with its HTML content, updatedAt (pass it back as expectedUpdatedAt when editing), editable, ' +
      'and publication: the gate issues a human must still fix before publishing.',
    input: z.strictObject({ id: articleId.optional(), slug: z.string().optional().describe('Article slug, used when id is omitted.') }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const article = id !== undefined ? await loadById(id) : await getArticleBySlug(slugify(slug ?? ''))
      if (!article) return fail('Article not found.', { hint: 'Call list_articles to see existing articles.' })
      return ok(articleView(article, { includeContent: true }))
    },
  }),

  defineTool({
    name: 'list_article_taxonomy',
    title: 'List article categories and authors',
    scope: 'articles:read',
    description: 'Lists existing article categories (with article counts) and authors. Articles can only reference these; new ones are created by a human.',
    input: z.strictObject({}),
    annotations: readOnly,
    run: async () => {
      const categories = (await getAllCategoriesWithCounts()).map((c) => ({ name: c.name, slug: c.slug, articleCount: c.articleCount }))
      return ok({ categories, authors: await listAuthors() })
    },
  }),

  defineTool({
    name: 'create_article_draft',
    title: 'Create article draft',
    scope: 'articles:draft',
    description:
      'Creates a new DRAFT journal article at /journal/<slug>. content is HTML (sanitized exactly like the Studio editor) or markdown. ' +
      'category/author must already exist. Returns the article (updatedAt for further edits), editUrl and the publication checklist. Never publishes.',
    input: createInput,
    annotations: write,
    run: async (args, ctx) => createDraft(args, ctx.actor),
  }),

  defineTool({
    name: 'update_article_draft',
    title: 'Update article draft',
    scope: 'articles:draft',
    description:
      'Patches a draft (or in_review) article: title, content, excerpt, category, author, tags, cover, SEO fields. Requires expectedUpdatedAt from get_article. ' +
      'The slug cannot change through MCP. Refused for approved, scheduled, published or archived articles.',
    input: updateInput,
    annotations: write,
    run: async (args, ctx) => updateDraft(args, ctx.actor),
  }),
]
