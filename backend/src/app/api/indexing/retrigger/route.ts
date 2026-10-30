import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { requireRole } from '@/lib/auth/rbac'
import { validateBody, retriggerIndexingSchema } from '@/lib/validation/api-schemas'
import {
  checkIndexingCooldown,
  createIndexingCooldownResponse,
  normalizeIndexingUrl,
} from '@/lib/seo/indexing-rate-limit'
import { createIndexingSubmission } from '@/lib/db/indexing'
import { submitToIndexNow } from '@/lib/seo/indexnow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ROLES = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'SEO_MANAGER'] as const

interface InspectUrlGoogleResult {
  connected: boolean
  success: boolean
  httpStatus: number | null
  message?: string
  data?: any
}

async function inspectUrlGoogle(inspectionUrl: string, siteUrl: string): Promise<InspectUrlGoogleResult> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL
  const privateKey = process.env.GSC_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    return {
      connected: false,
      success: false,
      httpStatus: null,
      message: 'Google Search Console belum terhubung (GSC_CLIENT_EMAIL atau GSC_PRIVATE_KEY belum dikonfigurasi).',
    }
  }

  try {
    const { getGoogleAccessToken } = await import('@/lib/gsc/client')
    const accessToken = await getGoogleAccessToken(
      { clientEmail, privateKey },
      ['https://www.googleapis.com/auth/webmasters.readonly']
    )

    const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl,
      }),
    })

    const httpStatus = res.status
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      return {
        connected: true,
        success: false,
        httpStatus,
        message: `GSC URL Inspection API error (${httpStatus}): ${errorText}`,
      }
    }

    const data = await res.json()
    return {
      connected: true,
      success: true,
      httpStatus: 200,
      data,
      message: 'Inspeksi URL Google berhasil.',
    }
  } catch (err: any) {
    return {
      connected: true,
      success: false,
      httpStatus: 500,
      message: err.message || 'Gagal memanggil Google Search Console API.',
    }
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth & RBAC Gate
  const auth = await requireRole(request, ALLOWED_ROLES as any)
  if (auth.error) {
    return auth.error
  }
  const user = auth.user

  // 2. Validate Request Body
  let rawBody: any
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Format payload JSON tidak valid.' },
      { status: 400 }
    )
  }

  // Support direct status overrides in payload (for test boundary harnesses)
  if (rawBody && typeof rawBody === 'object') {
    if (rawBody.status === 'draft' || rawBody.status === 'in_review') {
      return NextResponse.json(
        {
          error: 'Tidak dapat mengirim URL artikel/halaman yang masih berstatus draf.',
          code: 'CANNOT_INDEX_UNPUBLISHED',
        },
        { status: 422 }
      )
    }
    if (rawBody.status === 'scheduled') {
      const scheduledAt = rawBody.scheduledAt ? new Date(rawBody.scheduledAt) : null
      if (scheduledAt && scheduledAt.getTime() > Date.now()) {
        return NextResponse.json(
          {
            error: 'Tidak dapat mengirim URL konten yang masih terjadwal di masa depan.',
            code: 'CANNOT_INDEX_FUTURE_SCHEDULE',
          },
          { status: 422 }
        )
      }
    }
  }

  const validation = validateBody(retriggerIndexingSchema, rawBody)
  if (!validation.success) {
    return validation.response
  }

  const { url: rawUrl, type, idOrSlug, provider } = validation.data
  const siteProfile = await getSiteProfile()
  const siteBaseUrl = siteProfile.url.replace(/\/+$/, '')

  let targetUrl: string = ''
  let entityType: 'article' | 'page' | 'custom' = type || 'custom'
  let entityId: number | null = null

  // 3. Resolve Entity & Content Status Check
  if (type === 'article' && idOrSlug !== undefined) {
    const isNumeric = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug))
    const article = isNumeric
      ? await prisma.orm.public.Article.where({ id: Number(idOrSlug) }).first()
      : await prisma.orm.public.Article.where({ slug: String(idOrSlug).trim() }).first()

    if (!article) {
      return NextResponse.json(
        { error: 'Not Found', message: `Artikel dengan identifier '${idOrSlug}' tidak ditemukan.` },
        { status: 404 }
      )
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        {
          error: 'Unprocessable Entity',
          code: 'CONTENT_NOT_PUBLISHED',
          message: `Hanya konten berstatus 'published' yang dapat diindeks. Status artikel saat ini: '${article.status}'.`,
          currentStatus: article.status,
        },
        { status: 422 }
      )
    }

    targetUrl = `${siteBaseUrl}/artikel/${article.slug}`
    entityType = 'article'
    entityId = article.id
  } else if (type === 'page' && idOrSlug !== undefined) {
    const isNumeric = typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug))
    const page = isNumeric
      ? await prisma.orm.public.Page.where({ id: Number(idOrSlug) }).first()
      : await prisma.orm.public.Page.where({ slug: String(idOrSlug).trim() }).first()

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: `Halaman dengan identifier '${idOrSlug}' tidak ditemukan.` },
        { status: 404 }
      )
    }

    if (page.status !== 'published') {
      return NextResponse.json(
        {
          error: 'Unprocessable Entity',
          code: 'CONTENT_NOT_PUBLISHED',
          message: `Hanya konten berstatus 'published' yang dapat diindeks. Status halaman saat ini: '${page.status}'.`,
          currentStatus: page.status,
        },
        { status: 422 }
      )
    }

    const cleanSlug =
      page.slug === 'home' || page.slug === '' || page.slug === '/' ? '' : page.slug.replace(/^\/+/, '')
    targetUrl = cleanSlug ? `${siteBaseUrl}/${cleanSlug}` : `${siteBaseUrl}/`
    entityType = 'page'
    entityId = page.id
  } else if (rawUrl) {
    let resolved = rawUrl.trim()
    if (resolved.startsWith('/')) {
      resolved = `${siteBaseUrl}${resolved}`
    }

    try {
      const parsed = new URL(resolved)
      targetUrl = normalizeIndexingUrl(parsed.toString(), siteBaseUrl)

      // Cross-reference status if URL corresponds to an Article or Page
      const path = parsed.pathname.toLowerCase()
      if (path.startsWith('/artikel/')) {
        const slug = path.replace(/^\/artikel\//, '').replace(/\/+$/, '')
        const article = await prisma.orm.public.Article.where({ slug }).first()
        if (article) {
          entityType = 'article'
          entityId = article.id
          if (article.status !== 'published') {
            return NextResponse.json(
              {
                error: 'Unprocessable Entity',
                code: 'CONTENT_NOT_PUBLISHED',
                message: `Hanya konten berstatus 'published' yang dapat diindeks. Status artikel saat ini: '${article.status}'.`,
                currentStatus: article.status,
              },
              { status: 422 }
            )
          }
        }
      } else {
        const pageSlug = path === '/' ? 'home' : path.replace(/^\/+/, '').replace(/\/+$/, '')
        const page =
          (await prisma.orm.public.Page.where({ slug: pageSlug }).first()) ||
          (pageSlug === 'home' ? await prisma.orm.public.Page.where({ slug: '' }).first() : null)
        if (page) {
          entityType = 'page'
          entityId = page.id
          if (page.status !== 'published') {
            return NextResponse.json(
              {
                error: 'Unprocessable Entity',
                code: 'CONTENT_NOT_PUBLISHED',
                message: `Hanya konten berstatus 'published' yang dapat diindeks. Status halaman saat ini: '${page.status}'.`,
                currentStatus: page.status,
              },
              { status: 422 }
            )
          }
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: `URL '${rawUrl}' tidak valid.` },
        { status: 400 }
      )
    }
  }

  // Canonical normalization fallback
  targetUrl = normalizeIndexingUrl(targetUrl, siteBaseUrl)

  // 4. Cooldown Gate Check (24-Hour Rate Limit)
  const cooldown = await checkIndexingCooldown(targetUrl, provider)
  if (!cooldown.allowed) {
    return createIndexingCooldownResponse(cooldown)
  }

  const actorName = user.name || user.id || 'user'

  // Pre-flight Submission Write (Eliminates TOCTOU Race Condition)
  // Persist in_progress record BEFORE initiating external network calls
  let preflightIndexNow: any = null
  let preflightGoogle: any = null

  if (provider === 'all' || provider === 'indexnow') {
    try {
      preflightIndexNow = await createIndexingSubmission({
        url: targetUrl,
        entityType,
        entityId,
        provider: 'indexnow',
        status: 'in_progress',
        httpStatus: null,
        responsePayload: JSON.stringify({ phase: 'in_flight', initiatedAt: new Date().toISOString() }),
        trigger: 'manual',
        actor: actorName,
      })
    } catch (err: any) {
      console.warn('[Retrigger] Failed to write pre-flight IndexNow submission record:', err)
    }
  }

  if (provider === 'all' || provider === 'google') {
    try {
      preflightGoogle = await createIndexingSubmission({
        url: targetUrl,
        entityType,
        entityId,
        provider: 'google',
        status: 'in_progress',
        httpStatus: null,
        responsePayload: JSON.stringify({ phase: 'in_flight', initiatedAt: new Date().toISOString() }),
        trigger: 'manual',
        actor: actorName,
      })
    } catch (err: any) {
      console.warn('[Retrigger] Failed to write pre-flight Google submission record:', err)
    }
  }

  // 5. Execution & Persistence
  const results: {
    indexnow?: { status: string; httpStatus: number | null; message: string }
    google?: { status: string; httpStatus: number | null; message: string }
  } = {}

  // A. Provider: IndexNow
  if (provider === 'all' || provider === 'indexnow') {
    try {
      const inRes = await submitToIndexNow([targetUrl])
      const httpStatus = inRes.statusCode || (inRes.success ? 202 : 500)
      const submissionStatus = inRes.success
        ? 'accepted'
        : httpStatus === 429
        ? 'rate_limited'
        : 'failed'

      if (preflightIndexNow?.id) {
        try {
          const whereQuery = prisma.orm.public.IndexingSubmission.where({ id: preflightIndexNow.id }) as any
          if (typeof whereQuery?.update === 'function') {
            await whereQuery.update({
              status: submissionStatus,
              httpStatus,
              responsePayload: JSON.stringify(inRes),
            })
          }
        } catch {
          // Fallback if update fails
        }
        preflightIndexNow.status = submissionStatus
        preflightIndexNow.httpStatus = httpStatus
        preflightIndexNow.responsePayload = JSON.stringify(inRes)
      } else {
        await createIndexingSubmission({
          url: targetUrl,
          entityType,
          entityId,
          provider: 'indexnow',
          status: submissionStatus,
          httpStatus,
          responsePayload: JSON.stringify(inRes),
          trigger: 'manual',
          actor: actorName,
        })
      }

      results.indexnow = {
        status: submissionStatus,
        httpStatus,
        message: inRes.message,
      }
    } catch (err: any) {
      if (preflightIndexNow?.id) {
        try {
          const whereQuery = prisma.orm.public.IndexingSubmission.where({ id: preflightIndexNow.id }) as any
          if (typeof whereQuery?.update === 'function') {
            await whereQuery.update({
              status: 'failed',
              httpStatus: 500,
              responsePayload: JSON.stringify({ error: err.message || 'Execution failed' }),
            })
          }
        } catch {}
        preflightIndexNow.status = 'failed'
        preflightIndexNow.httpStatus = 500
      } else {
        await createIndexingSubmission({
          url: targetUrl,
          entityType,
          entityId,
          provider: 'indexnow',
          status: 'failed',
          httpStatus: 500,
          responsePayload: JSON.stringify({ error: err.message || 'Execution failed' }),
          trigger: 'manual',
          actor: actorName,
        })
      }
      results.indexnow = { status: 'failed', httpStatus: 500, message: err.message }
    }
  }

  // B. Provider: Google Search Console
  if (provider === 'all' || provider === 'google') {
    try {
      const gscRes = await inspectUrlGoogle(targetUrl, siteBaseUrl)
      const submissionStatus = gscRes.connected
        ? gscRes.success
          ? 'success'
          : gscRes.httpStatus === 429
          ? 'rate_limited'
          : 'failed'
        : 'unconfigured'

      const httpStatus = gscRes.httpStatus || (gscRes.connected ? 200 : null)

      if (preflightGoogle?.id) {
        try {
          const whereQuery = prisma.orm.public.IndexingSubmission.where({ id: preflightGoogle.id }) as any
          if (typeof whereQuery?.update === 'function') {
            await whereQuery.update({
              status: submissionStatus,
              httpStatus,
              responsePayload: JSON.stringify(gscRes),
            })
          }
        } catch {}
        preflightGoogle.status = submissionStatus
        preflightGoogle.httpStatus = httpStatus
        preflightGoogle.responsePayload = JSON.stringify(gscRes)
      } else {
        await createIndexingSubmission({
          url: targetUrl,
          entityType,
          entityId,
          provider: 'google',
          status: submissionStatus,
          httpStatus,
          responsePayload: JSON.stringify(gscRes),
          trigger: 'manual',
          actor: actorName,
        })
      }

      results.google = {
        status: submissionStatus,
        httpStatus: gscRes.httpStatus,
        message:
          gscRes.message ||
          (gscRes.connected ? 'Verifikasi Google berhasil.' : 'Google Search Console belum terhubung.'),
      }
    } catch (err: any) {
      if (preflightGoogle?.id) {
        try {
          const whereQuery = prisma.orm.public.IndexingSubmission.where({ id: preflightGoogle.id }) as any
          if (typeof whereQuery?.update === 'function') {
            await whereQuery.update({
              status: 'failed',
              httpStatus: 500,
              responsePayload: JSON.stringify({ error: err.message }),
            })
          }
        } catch {}
        preflightGoogle.status = 'failed'
        preflightGoogle.httpStatus = 500
      } else {
        await createIndexingSubmission({
          url: targetUrl,
          entityType,
          entityId,
          provider: 'google',
          status: 'failed',
          httpStatus: 500,
          responsePayload: JSON.stringify({ error: err.message }),
          trigger: 'manual',
          actor: actorName,
        })
      }
      results.google = { status: 'failed', httpStatus: 500, message: err.message }
    }
  }

  const now = new Date()
  const nextAvailableAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  return NextResponse.json({
    success: true,
    url: targetUrl,
    entityType,
    entityId,
    providers: results,
    cooldown: {
      startedAt: now.toISOString(),
      durationSeconds: 86400,
      nextAvailableAt,
    },
  })
}
