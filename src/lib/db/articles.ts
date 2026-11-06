import 'server-only'
import { parseRobots } from '@/lib/seo/robots'
import { articleCanonical } from '@/lib/seo/canonical'
import { siteConfig } from '@/config/site'
import { getSiteProfile } from './siteProfile'
import { or } from '@prisma/orm-postgres/orm-client'
import { prisma } from './prisma'
import type { Article, Category, Author, SEOComponent } from '../content/types'

export interface ArticleQueryOptions {
  page?: number
  pageSize?: number
  category?: string
  authorIds?: number[]
  search?: string
  status?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'archived' | 'all'
  locale?: 'id' | 'en'
}

export interface PaginatedArticles {
  data: Article[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

function extractCleanImageUrl(raw: any): string | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        const url = parsed.url || parsed.src || parsed.imageUrl
        if (typeof url === 'string' && url.trim().length > 0) return url.trim()
      } catch (err) { console.warn("[observable error]:", err) }
    }
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof raw === 'object' && raw !== null) {
    const url = raw.url || raw.src || raw.imageUrl
    if (typeof url === 'string' && url.trim().length > 0) return url.trim()
  }
  return undefined
}

function mapToArticle(row: any, siteUrl = siteConfig.url): Article {
  let parsedSeoData: any = null
  if (row.seoData) {
    try {
      parsedSeoData = JSON.parse(row.seoData)
    } catch (err) { console.warn("[observable error]:", err) }
  }

  const cleanCover = extractCleanImageUrl(row.coverUrl) || extractCleanImageUrl(row.featuredImage)

  const seo: SEOComponent = {
    id: row.id,
    metaTitle: parsedSeoData?.seoTitle || row.metaTitle || row.title,
    metaDescription: parsedSeoData?.metaDescription || row.metaDescription || row.excerpt,
    canonicalUrl: articleCanonical({ slug: row.slug, wpSourceUrl: row.wpSourceUrl, canonicalUrl: parsedSeoData?.canonicalUrl || row.canonicalUrl }, siteUrl),
    robotsIndex: parsedSeoData?.robots?.index !== undefined ? parsedSeoData.robots.index : (row.robots?.includes('noindex') ? false : true),
    robotsFollow: parsedSeoData?.robots?.follow !== undefined ? parsedSeoData.robots.follow : (row.robots?.includes('nofollow') ? false : true),
    ogTitle: parsedSeoData?.openGraph?.title || row.metaTitle || row.title,
    ogDescription: parsedSeoData?.openGraph?.description || row.metaDescription || row.excerpt,
    focusTopic: row.focusKeyphrase || parsedSeoData?.focusKeyphrase || undefined,
    secondaryTopics: row.relatedKeyphrases || undefined,
    openGraph: parsedSeoData?.openGraph || (row.ogImage ? { image: row.ogImage } : undefined),
    twitter: parsedSeoData?.twitter,
    robots: parseRobots(parsedSeoData?.robots || row.robots),
    schema: parsedSeoData?.schema,
    breadcrumbTitle: parsedSeoData?.breadcrumbTitle,
  }

  let relatedKws: string[] = []
  if (row.relatedKeyphrases) {
    try {
      relatedKws = JSON.parse(row.relatedKeyphrases)
    } catch (err) { console.warn("[observable error]:", err) }
  }

  const category: Category | undefined = row.category
    ? {
        id: row.category.id || row.categoryId || 1,
        documentId: `cat-${row.category.slug}`,
        name: row.category.name,
        slug: row.category.slug,
      }
    : undefined

  const author: Author | undefined = row.author
    ? {
        id: row.author.id || row.authorId || 1,
        documentId: `auth-${row.author.slug}`,
        name: row.author.name,
        slug: row.author.slug,
        email: row.author.email || undefined,
        avatar: row.author.avatar ? ({ url: row.author.avatar } as unknown as import('../content/types').MediaImage) : undefined,
      }
    : undefined

  return {
    id: row.id,
    documentId: row.documentId || `art-${row.slug}`,
    wpSourceUrl: row.wpSourceUrl || undefined,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || '',
    content: row.content || '',
    featuredImage: cleanCover
      ? {
          id: row.id,
          documentId: `media-${row.slug}`,
          name: row.title,
          alternativeText: parsedSeoData?.openGraph?.imageAlt || '',
          caption: null,
          width: 1200,
          height: 630,
          formats: {},
          url: cleanCover,
          mime: 'image/jpeg',
          size: 0,
        }
      : undefined,
    coverUrl: cleanCover,
    readingTime: row.readingTime || 4,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category,
    author,
    tags: (row.articleTags || []).map((relation: any) => relation.tag),
    seo,
    seoData: parsedSeoData || undefined,
    locale: (row.locale as 'id' | 'en') || 'id',
    translationGroupId: row.translationGroupId || undefined,
    focusKeyphrase: row.focusKeyphrase || parsedSeoData?.focusKeyphrase || row.primaryKeyword || undefined,
    relatedKeyphrases: relatedKws.length > 0 ? relatedKws : (Array.isArray(parsedSeoData?.relatedKeyphrases) ? parsedSeoData.relatedKeyphrases : []),
    isCornerstone: Boolean(row.isCornerstone ?? parsedSeoData?.isCornerstone),
    status: row.status,
    scheduledAt: row.scheduledAt || undefined,
    publicationTimezone: row.publicationTimezone || undefined,
    scheduleError: row.scheduleError || undefined,
    primaryKeyword: row.primaryKeyword,
    targetLocation: row.targetLocation,
    targetCity: row.targetCity,
    faqs: row.faqs,
    tagsParagraph: row.tagsParagraph,
    imageMetadata: row.imageMetadata,
  }
}

export async function getArticles(options: ArticleQueryOptions = {}): Promise<PaginatedArticles> {
  const page = Math.max(1, options.page || 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 12))
  const offset = (page - 1) * pageSize

  try {
    const where: any = {}

    if (options.status && options.status !== 'all') {
      where.status = options.status
    } else if (!options.status) {
      where.status = 'published'
    }

    if (options.locale) {
      where.locale = options.locale
    }

    if (options.category) {
      const catInput = options.category.trim()
      const catSlug = catInput.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
      const category = await prisma.orm.public.Category.where((c) =>
        or(c.slug.eq(catInput), c.name.eq(catInput), c.slug.eq(catSlug))
      ).first()
      where.categoryId = category?.id ?? -1
    }
    let query = prisma.orm.public.Article.where(where)
    if (options.authorIds !== undefined) query = query.where((a) => a.authorId.in(options.authorIds!.length ? options.authorIds! : [-1]))
    if (options.search) {
      const term = `%${options.search.replace(/[\\%_]/g, '\\$&')}%`
      query = query.where((a) => or(a.title.ilike(term), a.excerpt.ilike(term), a.content.ilike(term)))
    }

    const agg = await query.aggregate((a: any) => ({ total: a.count() }))
    const total = Number(agg.total || 0)
    const pageCount = Math.ceil(total / pageSize)

    const rows = await query
      .include('category')
      .include('author')
      .orderBy((a) => a.publishedAt.desc())
      .limit(pageSize)
      .offset(offset)
      .all()

    const siteUrl = (await getSiteProfile()).url
    const links = rows.length ? await prisma.orm.public.ArticleTag.where((link) => link.articleId.in(rows.map((row) => row.id))).include('tag').all() : []
    const mapped = rows.map((row) => mapToArticle({ ...row, articleTags: links.filter((link) => link.articleId === row.id) }, siteUrl))

    return {
      data: mapped,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total,
        },
      },
    }
  } catch (err) {
    console.error('Failed to get articles:', err)
    throw err
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const row = await prisma.orm.public.Article
      .where({ slug })
      .include('category')
      .include('author')
      .first()

    if (!row) return null
    const articleTags = await prisma.orm.public.ArticleTag.where({ articleId: row.id }).include('tag').all()
    return mapToArticle({ ...row, articleTags }, (await getSiteProfile()).url)
  } catch (err) {
    console.error('Failed to get article by slug:', err)
    throw err
  }
}

export async function getFeaturedArticles(limit = 4): Promise<Article[]> {
  const result = await getArticles({ pageSize: limit, status: 'published' })
  return result.data
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const rows = await prisma.orm.public.Category.orderBy((c: any) => c.name.asc()).all()
    return rows.map((c: any) => ({
      id: c.id,
      documentId: `cat-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
    }))
  } catch {
    return []
  }
}

export interface CategoryWithCount extends Category {
  articleCount: number
}

export async function getAllCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const rows = await prisma.orm.public.Category.orderBy((c: any) => c.name.asc()).all()
    const counts = await Promise.all(
      rows.map(async (c: any) => {
        const agg = await prisma.orm.public.Article.where({ categoryId: c.id }).aggregate((a: any) => ({ total: a.count() }))
        return {
          id: c.id,
          documentId: `cat-${c.slug}`,
          name: c.name,
          slug: c.slug,
          description: c.description || undefined,
          articleCount: Number(agg.total || 0),
        }
      })
    )
    return counts
  } catch (err) {
    console.error('Failed to get categories with counts:', err)
    return []
  }
}

export function normalizeCategorySlug(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createCategory(data: {
  name: string
  slug?: string
  description?: string
  actor?: string
}) {
  const name = data.name.trim()
  if (!name) throw new Error('Nama kategori wajib diisi.')
  const slug = data.slug?.trim() ? normalizeCategorySlug(data.slug) : normalizeCategorySlug(name)
  if (!slug) throw new Error('Nama atau slug kategori harus memuat huruf atau angka.')

  const existing = await prisma.orm.public.Category.where({ slug }).first()
  if (existing) {
    throw new Error(`Kategori dengan slug "${slug}" sudah ada (${existing.name}).`)
  }

  const category = await prisma.orm.public.Category.create({
    name,
    slug,
    description: data.description?.trim() || null,
  })

  await prisma.orm.public.ContentRevision.create({
    entityType: 'category',
    entityId: String(category.id),
    actor: data.actor || 'system',
    action: 'create',
    snapshot: JSON.stringify(category),
  })

  return category
}

export async function updateCategory(
  id: number,
  data: {
    name?: string
    slug?: string
    description?: string | null
    actor?: string
  }
) {
  return prisma.transaction(async (tx) => {
    const existing = await tx.orm.public.Category.where({ id }).first()
    if (!existing) throw new Error('Kategori tidak ditemukan.')

    const payload: Record<string, any> = {}
    let nameChanged = false

    if (data.name !== undefined) {
      const name = data.name.trim()
      if (!name) throw new Error('Nama kategori tidak boleh kosong.')
      payload.name = name
      if (name !== existing.name) nameChanged = true
    }

    if (data.slug !== undefined) {
      const slug = normalizeCategorySlug(data.slug)
      if (!slug) throw new Error('Slug kategori harus memuat huruf atau angka.')
      if (slug !== existing.slug) {
        const conflict = await tx.orm.public.Category.where({ slug }).first()
        if (conflict && conflict.id !== id) {
          throw new Error(`Slug "${slug}" sudah digunakan oleh kategori lain (${conflict.name}).`)
        }
        payload.slug = slug
      }
    }

    if (data.description !== undefined) {
      payload.description = data.description ? data.description.trim() : null
    }

    const updated = await tx.orm.public.Category.where({ id }).update(payload)

    // Keep primaryCategory in sync across all linked articles if name changed
    if (nameChanged && payload.name) {
      await tx.orm.public.Article.where({ categoryId: id }).updateAll({
        primaryCategory: payload.name,
      })
    }

    await tx.orm.public.ContentRevision.create({
      entityType: 'category',
      entityId: String(id),
      actor: data.actor || 'system',
      action: 'update',
      snapshot: JSON.stringify(updated),
    })

    return updated
  })
}

export async function deleteCategory(
  id: number,
  options: {
    reassignToId?: number
    actor?: string
  } = {}
) {
  return prisma.transaction(async (tx) => {
    const existing = await tx.orm.public.Category.where({ id }).first()
    if (!existing) throw new Error('Kategori tidak ditemukan.')

    // Count how many articles currently belong to this category
    const agg = await tx.orm.public.Article.where({ categoryId: id }).aggregate((a: any) => ({ total: a.count() }))
    const linkedCount = Number(agg.total || 0)

    let destinationCategory: { id: number; name: string } | null = null

    if (linkedCount > 0) {
      if (options.reassignToId) {
        if (options.reassignToId === id) {
          throw new Error('Kategori tujuan pengalihan tidak boleh sama dengan kategori yang akan dihapus.')
        }
        destinationCategory = await tx.orm.public.Category.where({ id: options.reassignToId }).first()
        if (!destinationCategory) {
          throw new Error('Kategori tujuan pengalihan tidak ditemukan.')
        }
      } else {
        // Find safe fallback category (e.g. category 'artikel' or first available other category)
        destinationCategory =
          (await tx.orm.public.Category.where({ slug: 'artikel' }).first()) ||
          (await tx.orm.public.Category.where((c) => c.id.neq(id)).first())
      }

      if (destinationCategory) {
        // Safely reassign ALL articles using updateAll so no article is deleted or orphaned
        await tx.orm.public.Article.where({ categoryId: id }).updateAll({
          categoryId: destinationCategory.id,
          primaryCategory: destinationCategory.name,
        })
      } else {
        // Fallback if no other category exists: set categoryId to null and primaryCategory to 'Umum'
        await tx.orm.public.Article.where({ categoryId: id }).updateAll({
          categoryId: null,
          primaryCategory: 'Umum',
        })
      }
    }

    await tx.orm.public.ContentRevision.create({
      entityType: 'category',
      entityId: String(id),
      actor: options.actor || 'system',
      action: 'before_delete',
      snapshot: JSON.stringify({
        ...existing,
        reassignedArticles: linkedCount,
        destinationCategoryId: destinationCategory?.id ?? null,
      }),
    })

    await tx.orm.public.Category.where({ id }).delete()

    return {
      deletedCategory: existing,
      reassignedCount: linkedCount,
      destinationCategory: destinationCategory
        ? { id: destinationCategory.id, name: destinationCategory.name }
        : null,
    }
  })
}

type TagModels = Pick<typeof prisma.orm.public, 'Tag' | 'ArticleTag'>
async function replaceArticleTags(models: TagModels, articleId: number, names: string[]) {
  const ids = new Set<number>()
  for (const name of [...new Set(names.map((name) => name.trim()).filter(Boolean))]) {
    const existing = await models.Tag.where({ name }).first()
    const slug = name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
    if (!slug) throw new Error('Nama tag harus memuat huruf atau angka.')
    const tag = existing || await models.Tag.upsert({ conflictOn: { slug }, create: { name, slug }, update: {} })
    ids.add(tag.id)
  }
  await models.ArticleTag.where({ articleId }).deleteAll()
  for (const tagId of ids) await models.ArticleTag.create({ articleId, tagId })
  return [...ids]
}

type RevisionModels = Pick<typeof prisma.orm.public, 'ContentRevision' | 'SeoAuditLog'>
async function recordRevision<T extends { id: number }>(models: RevisionModels, article: T, actor: string, action: string) {
  await models.ContentRevision.create({ entityType: 'article', entityId: String(article.id), actor, action, snapshot: JSON.stringify(article) })
  await models.SeoAuditLog.create({ entityType: 'article', entityId: String(article.id), actor, action })
}

export async function createArticle(data: {
  actor?: string
  publishedAt?: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  status?: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published'
  featuredImage?: string
  coverUrl?: string
  readingTime?: number
  tags?: string[]
  categoryId?: number
  authorId?: number
  metaTitle?: string
  metaDescription?: string
  locale?: 'id' | 'en'
  translationGroupId?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  seoData?: any
  isCornerstone?: boolean
  primaryCategory?: string
  scheduledAt?: string
  publicationTimezone?: string
  scheduledBy?: string
}) {
  const now = new Date().toISOString()
  return await prisma.transaction(async (tx) => {
  const article = await tx.orm.public.Article.create({
    documentId: `art-${data.slug}`,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || '',
    content: data.content || '',
    status: data.status || 'draft',
    featuredImage: data.featuredImage || null,
    coverUrl: data.coverUrl || data.featuredImage || null,
    readingTime: data.readingTime || 4,
    publishedAt: data.publishedAt || (data.status === 'published' ? now : null),
    categoryId: data.categoryId || null,
    authorId: data.authorId || null,
    metaTitle: data.metaTitle || data.title,
    metaDescription: data.metaDescription || data.excerpt,
    locale: data.locale || 'id',
    translationGroupId: data.translationGroupId || null,
    focusKeyphrase: data.focusKeyphrase || null,
    relatedKeyphrases: data.relatedKeyphrases ? JSON.stringify(data.relatedKeyphrases) : null,
    seoData: data.seoData ? JSON.stringify(data.seoData) : null,
    isCornerstone: data.isCornerstone ?? false,
    primaryCategory: data.primaryCategory || null,
    scheduledAt: data.scheduledAt || null,
    publicationTimezone: data.publicationTimezone || null,
    scheduledBy: data.scheduledBy || null,
  })
  if (data.tags !== undefined) {
    const ids = await replaceArticleTags(tx.orm.public, article.id, data.tags)
    await tx.orm.public.Article.where({ id: article.id }).update({ tags: JSON.stringify(ids) })
  }
  await recordRevision(tx.orm.public, { ...article, tagNames: data.tags || [] }, data.actor || 'system', 'create')
  return article
  })
}

export async function updateArticle(
  slug: string,
  data: Partial<{
    actor: string
    title: string
    slug: string
    excerpt: string
    content: string
    status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'archived'
    featuredImage: string
    coverUrl: string
    readingTime: number
    tags: string[]
    categoryId: number
    authorId: number
    metaTitle: string
    metaDescription: string
    publishedAt: string
    locale: 'id' | 'en'
    translationGroupId: string
    focusKeyphrase: string
    relatedKeyphrases: string[]
    seoData: any
    isCornerstone: boolean
    primaryCategory: string
    scheduledAt: string | null
    publicationTimezone: string
    scheduledBy: string
    scheduleError: string | null
  }>
) {
  const { actor, tags, ...fields } = data
  const payload: Record<string, any> = { ...fields }

  if (data.relatedKeyphrases) {
    payload.relatedKeyphrases = JSON.stringify(data.relatedKeyphrases)
  }
  if (data.seoData) {
    payload.seoData = JSON.stringify(data.seoData)
  }

  return prisma.transaction(async (tx) => {
    const previous = await tx.orm.public.Article.where({ slug }).forUpdate().first()
    if (!previous) throw new Error('Artikel tidak ditemukan.')
    const previousTags = await tx.orm.public.ArticleTag.where({ articleId: previous.id }).include('tag').all()
    await recordRevision(tx.orm.public, { ...previous, articleTags: previousTags }, actor || 'system', 'before_update')
    if (tags !== undefined) payload.tags = JSON.stringify(await replaceArticleTags(tx.orm.public, previous.id, tags))
    if (data.slug && data.slug !== slug) {
      for (const sourcePath of [`/${slug}`, `/artikel/${slug}`, `/journal/${slug}`]) {
        await tx.orm.public.Redirect.upsert({
          conflictOn: { sourcePath },
          create: { sourcePath, destinationPath: `/journal/${data.slug}`, statusCode: 301, active: true },
          update: { destinationPath: `/journal/${data.slug}`, statusCode: 301, active: true },
        })
      }
    }
    return tx.orm.public.Article.where({ id: previous.id }).update(payload)
  })
}

export async function deleteArticle(slug: string, actor = 'system') {
  return prisma.transaction(async (tx) => {
    const article = await tx.orm.public.Article.where({ slug }).forUpdate().first()
    if (!article) return null
    await recordRevision(tx.orm.public, article, actor, 'before_delete')
    return tx.orm.public.Article.where({ id: article.id }).delete()
  })
}
