import { or } from '@prisma/orm-postgres/orm-client'
import { NextRequest, NextResponse, after } from 'next/server'
import { normalizeIndexingUrl } from '@/lib/seo/indexing-rate-limit'
import { triggerAutomatedIndexing } from '@/lib/seo/indexing-dispatcher'
import { mergeEditorialSeo } from '@/lib/articles/editorialSeo'
import { normalizeSchedule, extractContentImages } from '@/lib/publishing/validation'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { dispatchRevalidationWebhook } from '@/lib/webhooks/dispatcher'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import {
  requireUser,
  authenticateRequest,
  ROLE_PERMISSIONS,
  validateStatusTransition,
  ArticleStatus,
  StatusHistoryEntry,
} from '@/lib/auth/rbac'
import {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} from '@/lib/db/articles'
import { checkPublicationGate } from '@/lib/seo/validation'
import { createArticleSchema, updateArticleSchema, validateBody } from '@/lib/validation/api-schemas'

function ownsArticle(article: { author?: { slug?: string; email?: string } }, user: { id: string; email?: string }) {
  return article.author?.slug === `user-${user.id}` || Boolean(user.email && article.author?.email?.toLowerCase() === user.email.toLowerCase())
}

// --- GET: List Articles with Search, Filter & Role Scoping ----------------
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  if (auth.user.role === 'MEDIA_MANAGER') return NextResponse.json({ error: 'Tidak berwenang membaca konten editorial.' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // If slug is provided, fetch single article for editorial editing or preview
    if (slug) {
      try {
        const article = await getArticleBySlug(slug)
        if (article) {
          if (auth.user.role === 'AUTHOR' && article.status !== 'published' && !ownsArticle(article, auth.user)) return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
          return NextResponse.json({ article, source: 'db' })
        }
        return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
      } catch (dbErr) {
        console.error('SQLite getArticleBySlug failed:', dbErr)
        return NextResponse.json({ error: 'Gagal mengambil artikel dari basis data' }, { status: 500 })
      }
    }

    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const author = searchParams.get('author')?.toLowerCase() || ''
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 15

    const ownAuthors = auth.user.role === 'AUTHOR' ? await prisma.orm.public.Author.where((a) => or(a.slug.eq(`user-${auth.user.id}`), a.email.eq(auth.user.email || ''))).all() : []

    // 1. Query persisted editorial content with server-side author scoping
    try {
      const dbResult = await getArticles({
        page,
        pageSize: limit,
        authorIds: auth.user.role === 'AUTHOR' ? ownAuthors.map((author) => author.id) : undefined,
        category: category || undefined,
        search: search || undefined,
        status: status ? (status as any) : undefined,
      })

      if (dbResult) {
        return NextResponse.json(
          {
            articles: dbResult.data,
            total: dbResult.meta.pagination.total,
            page: dbResult.meta.pagination.page,
            totalPages: dbResult.meta.pagination.pageCount,
            source: 'db',
          },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          }
        )
      }
    } catch (dbErr: any) {
      console.error('SQLite articles query failed:', dbErr)
      return NextResponse.json(
        { error: 'Gagal mengambil data artikel dari basis data', details: dbErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      articles: [],
      total: 0,
      page,
      totalPages: 0,
      source: 'db',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data artikel', details: String(error) },
      { status: 500 }
    )
  }
}

// --- POST: Create New Article (Role-Enforced) -----------------------------
export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  try {

    const permissions = ROLE_PERMISSIONS[user.role]
    if (!permissions?.canCreateArticle) {
      return NextResponse.json(
        { error: `Peran '${user.role}' tidak memiliki izin membuat artikel.` },
        { status: 403 }
      )
    }

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Body JSON wajib diisi.' }, { status: 400 })
    }

    const validation = validateBody(createArticleSchema, rawBody)
    if (!validation.success) {
      return validation.response
    }

    if (rawBody.publishedAt !== undefined && (typeof rawBody.publishedAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(rawBody.publishedAt) || !Number.isFinite(Date.parse(rawBody.publishedAt)))) return NextResponse.json({ error: 'Tanggal publikasi tidak valid.' }, { status: 400 })
    const body = validation.data
    const {
      title,
      slug,
      excerpt = '',
      content = '',
      category = 'Teknologi',
      author,
      tags,
      featuredImage,
      status: requestedStatus = 'draft',
      metaTitle,
      metaDescription,
      locale = 'id',
      focusKeyphrase,
    } = body
    const coverUrl = featuredImage || rawBody.coverUrl
    const coverAlt = body.coverAlt ?? body.seoData?.openGraph?.imageAlt ?? ''
    const translationGroupId = (rawBody as any).translationGroupId
    const relatedKeyphrases = (rawBody as any).relatedKeyphrases
    const seoData = mergeEditorialSeo(undefined, body.seoData, { metaTitle, metaDescription, coverAlt })
    const isCornerstone = (rawBody as any).isCornerstone
    const primaryCategory = (rawBody as any).primaryCategory

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Judul dan isi artikel wajib diisi' },
        { status: 400 }
      )
    }

    // Role-Aware status enforcement: Authors and unprivileged users CANNOT directly publish
    let targetStatus: ArticleStatus = requestedStatus as ArticleStatus
    if (targetStatus === 'approved' && !permissions.canApprove) return NextResponse.json({ error: 'Tidak berwenang menyetujui artikel.' }, { status: 403 })
    if (targetStatus === 'archived' && !permissions.canArchive) return NextResponse.json({ error: 'Tidak berwenang mengarsipkan artikel.' }, { status: 403 })
    if (!permissions.canPublish && targetStatus === 'scheduled') return NextResponse.json({ error: 'Tidak berwenang menjadwalkan artikel.' }, { status: 403 })
    const schedule = targetStatus === 'scheduled' ? normalizeSchedule(rawBody.scheduledAt, rawBody.publicationTimezone) : {}
    if (!permissions.canPublish && targetStatus === 'published') {
      targetStatus = 'in_review' // Automatically downshift to in_review for approval
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const timestamp = new Date().toISOString()
    const initialHistoryEntry: StatusHistoryEntry = {
      actor: user.name,
      role: user.role,
      timestamp,
      fromState: 'draft',
      toState: targetStatus,
      note: `Artikel dibuat oleh ${user.name} (${user.role})`,
    }

    const categoryName = typeof category === 'string' && category.trim() ? category.trim() : 'Artikel'
    const categorySlug = categoryName
      .normalize('NFKC')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'artikel'

    const formattedContent = content.startsWith('<')
      ? content
      : `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`

    const finalMetaTitle = metaTitle || `${title} — UNIMASI`
    const finalMetaDesc = metaDescription || excerpt || title

    // Enforce Publication Gate if publishing (Section 3.4)
    if (targetStatus === 'published' || targetStatus === 'scheduled') {
      const contentImages = extractContentImages(formattedContent)
      const gateResult = checkPublicationGate({
        locale,
        title,
        slug: cleanSlug,
        metaDescription: finalMetaDesc,
        seoTitle: finalMetaTitle,
        existingSlugs: [],
        images: contentImages,
        heroVisual: coverUrl ? { url: coverUrl, altText: coverAlt || '', decorative: false } : null,
      })

      if (!gateResult.canPublish) {
        return NextResponse.json(
          {
            error: 'Publikasi ditolak: Syarat Gerbang Publikasi SEO belum terpenuhi.',
            gateResult,
            violations: gateResult.violations,
          },
          { status: 422 }
        )
      }
    }

    const categoryRow = await prisma.orm.public.Category.upsert({
      conflictOn: { slug: categorySlug },
      create: { name: categoryName, slug: categorySlug },
      update: { name: categoryName },
    })
    const authorName = user.role === 'AUTHOR' ? user.name : (author || user.name)
    const authorSlug = user.role === 'AUTHOR' ? `user-${user.id}` : authorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const authorRow = await prisma.orm.public.Author.upsert({
      conflictOn: { slug: authorSlug },
      create: { name: authorName, slug: authorSlug, email: user.role === 'AUTHOR' ? user.email : null },
      update: { name: authorName },
    })

    // 1. Persist to SQLite Database
    let createdArticle: any = null
    try {
      const existing = await getArticleBySlug(cleanSlug)
      if (existing) {
        return NextResponse.json({ error: 'Slug sudah digunakan. Gunakan edit untuk mengubah artikel.' }, { status: 409 })
      } else {
        createdArticle = await createArticle({
          actor: user.id,
          publishedAt: typeof rawBody.publishedAt === 'string' && Number.isFinite(Date.parse(rawBody.publishedAt)) ? new Date(rawBody.publishedAt).toISOString() : undefined,
          title,
          slug: cleanSlug,
          excerpt: excerpt || title,
          content: formattedContent,
          status: targetStatus as any,
          tags,
          categoryId: categoryRow.id,
          authorId: authorRow.id,
          ...schedule,
          scheduledBy: targetStatus === 'scheduled' ? user.id : undefined,
          coverUrl: coverUrl || undefined,
          metaTitle: finalMetaTitle,
          metaDescription: finalMetaDesc,
          locale,
          translationGroupId: translationGroupId || undefined,
          focusKeyphrase: focusKeyphrase || undefined,
          relatedKeyphrases: relatedKeyphrases || undefined,
          seoData: seoData || undefined,
          isCornerstone: Boolean(isCornerstone),
          primaryCategory: primaryCategory || categoryName,
        })
      }
    } catch (dbErr: any) {
      console.error('Failed to save article to SQLite:', dbErr)
      return NextResponse.json(
        { error: 'Gagal menyimpan artikel ke basis data.', details: dbErr.message },
        { status: 500 }
      )
    }

    // On-demand Real-time Cache Purge
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/artikel')
      revalidatePath(`/artikel/${cleanSlug}`)
      revalidatePath('/admin')
    } catch (e) {
      console.warn('[Cache Revalidate] Failed in POST /api/articles:', e)
    }

    // Dispatch On-Demand ISR webhook to satellite frontends
    if (process.env.NODE_ENV !== 'test') {
      dispatchRevalidationWebhook({
        type: 'article',
        slug: cleanSlug,
        path: `/artikel/${cleanSlug}`,
        tags: ['articles', `article:${cleanSlug}`],
      }).catch((webhookErr) => {
        console.warn('[WebhookDispatcher] POST /api/articles webhook error:', webhookErr)
      })
    }

    // Automated Indexing Trigger (Next.js 16 after() non-blocking execution)
    // Strictly isolates drafts, in_review, and scheduled articles
    if (targetStatus === 'published') {
      const targetUrl = normalizeIndexingUrl(`/artikel/${cleanSlug}`)
      const articleId = createdArticle?.id
      const actor = user.name || user.id || 'user'
      let robots: string | null = null
      if (typeof seoData?.robots === 'string') {
        robots = seoData.robots
      } else if (seoData?.robots && typeof seoData.robots === 'object') {
        if (seoData.robots.index === false || seoData.robots.noindex === true) {
          robots = 'noindex'
        }
      } else if (typeof rawBody.robots === 'string') {
        robots = rawBody.robots
      }

      const dispatchTask = async () => {
        try {
          await triggerAutomatedIndexing({
            url: targetUrl,
            entityType: 'article',
            entityId: articleId,
            actor,
            robots,
            isEditorialUpdate: false,
          })
        } catch (indexingErr) {
          console.warn('[AutomatedIndexing] Background execution error in POST /api/articles:', indexingErr)
        }
      }

      try {
        after(dispatchTask)
      } catch {
        // Fallback for non-request environments (e.g. direct Vitest test execution)
        void Promise.resolve().then(dispatchTask)
      }
    }

    return NextResponse.json({
      success: true,
      message: targetStatus === 'published'
        ? 'Artikel berhasil diterbitkan ke database!'
        : targetStatus === 'in_review'
          ? 'Artikel diajukan untuk review editorial!'
          : 'Draf artikel berhasil disimpan di database!',
      slug: cleanSlug,
      url: `/artikel/${cleanSlug}`,
    })
  } catch (error) {
    if (error instanceof Error && /Jadwal|Zona waktu/.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(
      { error: 'Gagal menyimpan artikel', details: String(error) },
      { status: 500 }
    )
  }
}

// --- DELETE: Delete Article (Admin Only) ----------------------------------
export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  try {
    const permissions = ROLE_PERMISSIONS[user.role]
    if (!permissions?.canDeleteArticle) {
      return NextResponse.json(
        { error: `Akses ditolak: Peran '${user.role}' tidak memiliki izin menghapus artikel.` },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug artikel tidak disertakan.' }, { status: 400 })
    }

    // 1. Delete from SQLite DB
    try {
      await deleteArticle(slug, user.id)
    } catch (dbErr: any) {
      console.error('SQLite article delete failed:', dbErr)
      return NextResponse.json(
        { error: 'Gagal menghapus artikel dari basis data.', details: dbErr.message },
        { status: 500 }
      )
    }

    // On-demand Real-time Cache Purge
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/artikel')
      revalidatePath(`/artikel/${slug}`)
      revalidatePath('/admin')
    } catch (e) {
      console.warn('[Cache Revalidate] Failed in DELETE /api/articles:', e)
    }

    // Dispatch On-Demand ISR webhook to satellite frontends
    if (process.env.NODE_ENV !== 'test') {
      dispatchRevalidationWebhook({
        type: 'article',
        slug,
        path: `/artikel/${slug}`,
        tags: ['articles', `article:${slug}`],
      }).catch((webhookErr) => {
        console.warn('[WebhookDispatcher] DELETE /api/articles webhook error:', webhookErr)
      })
    }

    return NextResponse.json({
      success: true,
      message: `Artikel dengan slug "${slug}" berhasil dihapus dari database oleh ${user.name}.`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal menghapus artikel', details: String(error) },
      { status: 500 }
    )
  }
}

// --- PATCH: Role-Governed Editorial Status Transitions --------------------
export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error
  const user = auth.user

  try {

    const rawBody = await request.json().catch(() => null)
    const parsed = validateBody(updateArticleSchema, rawBody)
    if (!parsed.success) return parsed.response
    // PATCH must never apply defaults for fields the caller omitted.
    const body = { ...rawBody, ...Object.fromEntries(Object.entries(parsed.data).filter(([key]) => Object.hasOwn(rawBody, key))) }
    const {
      slug,
      status: nextStatus,
      tags,
      title,
      excerpt,
      content,
      category,
      coverUrl,
      coverAlt,
      author,
      metaTitle,
      metaDescription,
      note,
      locale,
      translationGroupId,
      focusKeyphrase,
      relatedKeyphrases,
      seoData,
      isCornerstone,
      primaryCategory,
    } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug artikel tidak disertakan.' }, { status: 400 })
    }

    const lookupSlug = typeof body.originalSlug === 'string' ? body.originalSlug : slug
    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(lookupSlug)) return NextResponse.json({ error: 'Slug tidak valid.' }, { status: 400 })
    const existingArticle = await getArticleBySlug(lookupSlug)
    if (!existingArticle) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan di basis data.' }, { status: 404 })
    }

    if (existingArticle.status === 'scheduled' && !ROLE_PERMISSIONS[user.role]?.canPublish) return NextResponse.json({ error: 'Tidak berwenang mengubah artikel terjadwal.' }, { status: 403 })
    if (!ROLE_PERMISSIONS[user.role]?.canEditAnyDraft && user.role !== 'AUTHOR') {
      const permission = ROLE_PERMISSIONS[user.role]
      const editorialReview = permission?.canReview || permission?.canApprove
      const allowedFields = editorialReview ? ['slug', 'originalSlug', 'status', 'note'] : permission?.canManageSeo ? ['slug', 'originalSlug', 'metaTitle', 'metaDescription', 'focusKeyphrase', 'relatedKeyphrases', 'seoData', 'isCornerstone', 'primaryCategory'] : []
      if (!allowedFields.length || slug !== lookupSlug || Object.keys(body).some((key) => !allowedFields.includes(key))) return NextResponse.json({ error: 'Peran ini tidak dapat mengubah field artikel tersebut.' }, { status: 403 })
    }

    const currentStatus: ArticleStatus = (existingArticle.status || 'published') as ArticleStatus

    const timestamp = new Date().toISOString()

    // Ownership & permission guard for AUTHOR (P0-R.3)
    if (user.role === 'AUTHOR') {
      // 1. Author cannot edit published or approved articles
      if (currentStatus === 'published' || currentStatus === 'approved') {
        return NextResponse.json(
          { error: 'Akses ditolak: Penulis (Author) tidak diizinkan mengubah artikel yang sudah terbit atau disetujui.' },
          { status: 403 }
        )
      }

      // 2. Author can only edit their own articles
      const isOwner = ownsArticle(existingArticle, user)

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengedit draf artikel milik Anda sendiri.' },
          { status: 403 }
        )
      }
    }

    // If status transition is requested, validate against RBAC state machine
    if (nextStatus && nextStatus !== currentStatus) {
      const validation = validateStatusTransition(currentStatus, nextStatus as ArticleStatus, user.role)
      if (!validation.allowed) {
        return NextResponse.json(
          { error: `Transisi status ditolak: ${validation.error}` },
          { status: 403 }
        )
      }
    }

    const mergedSeoData = mergeEditorialSeo(existingArticle.seoData, seoData, { metaTitle, metaDescription, coverAlt })
    const effectiveStatus = nextStatus || currentStatus
    // Validate the resulting live/scheduled record, including status-less PATCH requests.
    const schedule = nextStatus === 'scheduled' ? normalizeSchedule(body.scheduledAt, body.publicationTimezone) : {}
    if (effectiveStatus === 'published' || effectiveStatus === 'scheduled') {
      const existing: any = existingArticle
      const activeContent = content !== undefined ? content : (existing.content || '')
      const contentImages = extractContentImages(activeContent)
      const activeTitle = title ?? existing.title ?? ''
      const activeMetaDesc = metaDescription !== undefined ? metaDescription || '' : mergedSeoData.metaDescription ?? existing.seo?.metaDescription ?? ''
      const activeMetaTitle = metaTitle !== undefined ? metaTitle || '' : mergedSeoData.seoTitle ?? existing.seo?.metaTitle ?? ''
      const activeCoverUrl = coverUrl !== undefined ? coverUrl : (existing.coverUrl || existing.featuredImage?.url)

      const gateResult = checkPublicationGate({
        locale: locale || existingArticle?.locale || 'id',
        title: activeTitle,
        slug,
        metaDescription: activeMetaDesc,
        seoTitle: activeMetaTitle,
        existingSlugs: [],
        images: contentImages,
        heroVisual: activeCoverUrl ? { url: activeCoverUrl, altText: mergedSeoData.openGraph?.imageAlt ?? '', decorative: false } : null,
      })

      if (!gateResult.canPublish) {
        return NextResponse.json(
          {
            error: 'Publikasi ditolak: Syarat Gerbang Publikasi SEO belum terpenuhi.',
            gateResult,
            violations: gateResult.violations,
          },
          { status: 422 }
        )
      }
    }

    let explicitPublishedAt: string | undefined
    if (body.publishedAt !== undefined && body.publishedAt !== existingArticle.publishedAt) {
      if (!ROLE_PERMISSIONS[user.role]?.canPublish) return NextResponse.json({ error: 'Tidak berwenang mengubah tanggal publikasi.' }, { status: 403 })
      if (typeof body.publishedAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(body.publishedAt) || !Number.isFinite(Date.parse(body.publishedAt))) return NextResponse.json({ error: 'Tanggal publikasi harus berupa waktu dengan zona yang valid.' }, { status: 400 })
      explicitPublishedAt = new Date(body.publishedAt).toISOString()
    }
    if (slug !== lookupSlug && await getArticleBySlug(slug)) return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 409 })
    const relations: { categoryId?: number; authorId?: number } = {}
    let effectivePrimaryCategory: string | undefined = primaryCategory
    if (typeof category === 'string' && category.trim()) {
      const catTrim = category.trim()
      const categorySlug = catTrim.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
      if (!categorySlug) return NextResponse.json({ error: 'Kategori tidak valid.' }, { status: 400 })
      const saved = await prisma.orm.public.Category.upsert({ conflictOn: { slug: categorySlug }, create: { name: catTrim, slug: categorySlug }, update: { name: catTrim } })
      relations.categoryId = saved.id
      if (effectivePrimaryCategory === undefined) {
        effectivePrimaryCategory = catTrim
      }
    }
    if (typeof author === 'string' && author.trim()) {
      const authorName = user.role === 'AUTHOR' ? user.name : author.trim()
      const existingAuthor = user.role === 'AUTHOR' ? await prisma.orm.public.Author.where({ slug: `user-${user.id}` }).first() : await prisma.orm.public.Author.where({ name: authorName }).first()
      const authorSlug = user.role === 'AUTHOR' ? `user-${user.id}` : authorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const saved = existingAuthor || await prisma.orm.public.Author.create({ name: authorName, slug: authorSlug || `author-${Date.now()}`, email: user.role === 'AUTHOR' ? user.email : null })
      relations.authorId = saved.id
    }
    // 1. Update SQLite DB
    try {
      await updateArticle(lookupSlug, {
        ...(slug !== lookupSlug ? { slug } : {}),
        actor: user.id,
        ...relations,
        ...(tags !== undefined ? { tags } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(coverUrl !== undefined ? { coverUrl, featuredImage: coverUrl } : {}),
        ...(metaTitle !== undefined ? { metaTitle } : {}),
        ...(metaDescription !== undefined ? { metaDescription } : {}),
        ...(locale !== undefined ? { locale } : {}),
        ...(translationGroupId !== undefined ? { translationGroupId } : {}),
        ...(focusKeyphrase !== undefined ? { focusKeyphrase } : {}),
        ...(relatedKeyphrases !== undefined ? { relatedKeyphrases } : {}),
        ...(seoData !== undefined || coverAlt !== undefined || metaTitle !== undefined || metaDescription !== undefined ? { seoData: mergedSeoData } : {}),
        ...(isCornerstone !== undefined ? { isCornerstone: Boolean(isCornerstone) } : {}),
        ...(effectivePrimaryCategory !== undefined ? { primaryCategory: effectivePrimaryCategory } : {}),
        ...schedule,
        ...(nextStatus === 'scheduled' ? { scheduledBy: user.id, scheduleError: null } : {}),
        ...(nextStatus && nextStatus !== 'scheduled' ? { scheduledAt: null } : {}),
        ...(nextStatus ? { status: nextStatus as any } : {}),
        ...(explicitPublishedAt ? { publishedAt: explicitPublishedAt } : nextStatus === 'published' && !existingArticle.publishedAt ? { publishedAt: timestamp } : {}),
      })
    } catch (dbErr: any) {
      console.error('SQLite updateArticle error:', dbErr)
      return NextResponse.json(
        { error: 'Gagal memperbarui artikel di basis data.', details: dbErr.message },
        { status: 500 }
      )
    }

    // On-demand Real-time Cache Purge
    try {
      revalidatePath('/', 'layout')
      revalidatePath('/artikel')
      revalidatePath(`/artikel/${lookupSlug}`)
      revalidatePath(`/artikel/${slug}`)
      revalidatePath('/admin')
    } catch (e) {
      console.warn('[Cache Revalidate] Failed in PATCH /api/articles:', e)
    }

    // Dispatch On-Demand ISR webhook to satellite frontends
    if (process.env.NODE_ENV !== 'test') {
      const activeSlug = slug || lookupSlug
      dispatchRevalidationWebhook({
        type: 'article',
        slug: activeSlug,
        path: `/artikel/${activeSlug}`,
        tags: ['articles', `article:${activeSlug}`],
      }).catch((webhookErr) => {
        console.warn('[WebhookDispatcher] PATCH /api/articles webhook error:', webhookErr)
      })
    }

    // Automated Indexing Trigger (Next.js 16 after() non-blocking execution)
    // Strictly isolates drafts, in_review, future scheduled, and archived states
    if (effectiveStatus === 'published') {
      const targetSlug = slug || lookupSlug
      const targetUrl = normalizeIndexingUrl(`/artikel/${targetSlug}`)
      const articleId = existingArticle.id
      const actor = user.name || user.id || 'user'
      const wasAlreadyPublished = currentStatus === 'published'
      let mergedRobots: string | null = null
      if (typeof mergedSeoData?.robots === 'string') {
        mergedRobots = mergedSeoData.robots
      } else if (mergedSeoData?.robots && typeof mergedSeoData.robots === 'object') {
        if (mergedSeoData.robots.index === false || mergedSeoData.robots.noindex === true) {
          mergedRobots = 'noindex'
        }
      }

      const dispatchTask = async () => {
        try {
          await triggerAutomatedIndexing({
            url: targetUrl,
            entityType: 'article',
            entityId: articleId,
            actor,
            robots: mergedRobots,
            isEditorialUpdate: wasAlreadyPublished,
          })
        } catch (indexingErr) {
          console.warn('[AutomatedIndexing] Background execution error in PATCH /api/articles:', indexingErr)
        }
      }

      try {
        after(dispatchTask)
      } catch {
        // Fallback for non-request environments (e.g. direct Vitest test execution)
        void Promise.resolve().then(dispatchTask)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Artikel "${title || existingArticle?.title || slug}" berhasil diperbarui.`,
      status: nextStatus || currentStatus,
    })
  } catch (error) {
    if (error instanceof Error && /Jadwal|Zona waktu/.test(error.message)) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(
      { error: 'Gagal memperbarui artikel', details: String(error) },
      { status: 500 }
    )
  }
}
