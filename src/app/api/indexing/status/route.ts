import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { requireRole, type Role } from '@/lib/auth/rbac'
import { indexingStatusQuerySchema } from '@/lib/validation/api-schemas'
import { checkIndexingCooldown, normalizeIndexingUrl } from '@/lib/seo/indexing-rate-limit'
import { getLatestSubmissionsForUrl } from '@/lib/db/indexing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ROLES: Role[] = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER']

function safeJsonParse(payload: string | null | undefined) {
  if (!payload) return null
  try {
    return JSON.parse(payload)
  } catch {
    return payload
  }
}

export async function GET(request: NextRequest) {
  // 1. Auth & RBAC Gate
  const auth = await requireRole(request, ALLOWED_ROLES)
  if (auth.error) {
    return auth.error
  }

  // 2. Validate Query Parameters
  const queryObj = Object.fromEntries(request.nextUrl.searchParams.entries())
  const validation = indexingStatusQuerySchema.safeParse(queryObj)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: 'Parameter query tidak valid.',
        issues: validation.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
      { status: 400 }
    )
  }

  const { url: rawUrl, type, idOrSlug, provider = 'all' } = validation.data
  const siteProfile = await getSiteProfile()
  const siteBaseUrl = siteProfile.url.replace(/\/+$/, '')

  let targetUrl: string = ''
  let entityType: 'article' | 'page' | 'custom' = type || 'custom'
  let entityId: number | null = null
  let entityStatus: string = 'unknown'

  // 3. Resolve Target URL and Entity Metadata
  if (type === 'article' && idOrSlug !== undefined) {
    const isNumeric = /^\d+$/.test(idOrSlug)
    const article = isNumeric
      ? await prisma.orm.public.Article.where({ id: Number(idOrSlug) }).first()
      : await prisma.orm.public.Article.where({ slug: idOrSlug.trim() }).first()

    if (!article) {
      return NextResponse.json(
        { error: 'Not Found', message: `Artikel '${idOrSlug}' tidak ditemukan.` },
        { status: 404 }
      )
    }

    targetUrl = `${siteBaseUrl}/artikel/${article.slug}`
    entityType = 'article'
    entityId = article.id
    entityStatus = article.status
  } else if (type === 'page' && idOrSlug !== undefined) {
    const isNumeric = /^\d+$/.test(idOrSlug)
    const page = isNumeric
      ? await prisma.orm.public.Page.where({ id: Number(idOrSlug) }).first()
      : await prisma.orm.public.Page.where({ slug: idOrSlug.trim() }).first()

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: `Halaman '${idOrSlug}' tidak ditemukan.` },
        { status: 404 }
      )
    }

    const cleanSlug =
      page.slug === 'home' || page.slug === '' || page.slug === '/' ? '' : page.slug.replace(/^\/+/, '')
    targetUrl = cleanSlug ? `${siteBaseUrl}/${cleanSlug}` : `${siteBaseUrl}/`
    entityType = 'page'
    entityId = page.id
    entityStatus = page.status
  } else if (rawUrl) {
    let resolved = rawUrl.trim()
    if (resolved.startsWith('/')) {
      resolved = `${siteBaseUrl}${resolved}`
    }

    try {
      const parsed = new URL(resolved)
      targetUrl = normalizeIndexingUrl(parsed.toString(), siteBaseUrl)

      const path = parsed.pathname.toLowerCase()
      if (path.startsWith('/artikel/')) {
        const slug = path.replace(/^\/artikel\//, '').replace(/\/+$/, '')
        const article = await prisma.orm.public.Article.where({ slug }).first()
        if (article) {
          entityType = 'article'
          entityId = article.id
          entityStatus = article.status
        }
      } else {
        const pageSlug = path === '/' ? 'home' : path.replace(/^\/+/, '').replace(/\/+$/, '')
        const page =
          (await prisma.orm.public.Page.where({ slug: pageSlug }).first()) ||
          (pageSlug === 'home' ? await prisma.orm.public.Page.where({ slug: '' }).first() : null)
        if (page) {
          entityType = 'page'
          entityId = page.id
          entityStatus = page.status
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: `URL '${rawUrl}' tidak valid.` },
        { status: 400 }
      )
    }
  }

  targetUrl = normalizeIndexingUrl(targetUrl, siteBaseUrl)

  // 4. Query Latest Submissions for each provider and Cooldown state
  const [{ indexnow: latestIndexNow, google: latestGoogle }, cooldown] = await Promise.all([
    getLatestSubmissionsForUrl(targetUrl),
    checkIndexingCooldown(targetUrl, provider, undefined, { readonly: true }),
  ])

  const canRetrigger = (entityStatus === 'published' || entityStatus === 'unknown') && cooldown.allowed

  return NextResponse.json({
    url: targetUrl,
    entity: {
      type: entityType,
      id: entityId,
      status: entityStatus,
    },
    providers: {
      indexnow: latestIndexNow
        ? {
            status: latestIndexNow.status,
            httpStatus: latestIndexNow.httpStatus,
            submittedAt: latestIndexNow.submittedAt,
            trigger: latestIndexNow.trigger,
            actor: latestIndexNow.actor,
            response: safeJsonParse(latestIndexNow.responsePayload),
          }
        : null,
      google: latestGoogle
        ? {
            status: latestGoogle.status,
            httpStatus: latestGoogle.httpStatus,
            submittedAt: latestGoogle.submittedAt,
            trigger: latestGoogle.trigger,
            actor: latestGoogle.actor,
            response: safeJsonParse(latestGoogle.responsePayload),
          }
        : null,
    },
    cooldown: {
      inCooldown: !cooldown.allowed,
      remainingSeconds: cooldown.remainingSeconds,
      remainingFormatted: cooldown.remainingFormatted,
      lastSubmittedAt: cooldown.lastSubmittedAt || null,
      nextAvailableAt: cooldown.nextAvailableAt || null,
    },
    canRetrigger,
    retriggerBlockedReason:
      entityStatus !== 'published' && entityStatus !== 'unknown'
        ? `Konten belum berstatus 'published' (status saat ini: '${entityStatus}')`
        : !cooldown.allowed
        ? `Masa jeda 24 jam masih aktif (${cooldown.remainingFormatted} tersisa)`
        : null,
  })
}
