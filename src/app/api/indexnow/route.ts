import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOrCreateIndexNowKey, submitToIndexNow } from '@/lib/seo/indexnow'
import { siteConfig } from '@/config/site'
import { requireUser, requireRole } from '@/lib/auth/rbac'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { SEO_TOOL_ROLES } from '@/lib/seo/access'
import { normalizeIndexingUrl } from '@/lib/seo/indexing-rate-limit'
import { isSameSiteHost } from '@/lib/seo/site-url'
import { publicMessage } from '@/lib/http/errors'

const indexNowSubmitSchema = z.object({
  urls: z
    .array(z.string().trim().min(1).max(2000))
    .min(1, 'urls array wajib diisi.')
    .max(100, 'Maksimal 100 URL per pengiriman.'),
})

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.error) return auth.error

  try {
    const key = await getOrCreateIndexNowKey()
    return NextResponse.json({
      data: {
        key,
        keyUrl: `${siteConfig.url}/${key}.txt`,
        endpoint: 'https://api.indexnow.org/indexnow',
        participatingEngines: ['Bing', 'Yandex', 'Seznam', 'Naver'],
      },
      errors: [],
      warnings: [],
    })
  } catch (err) {
    console.error('[indexnow] Failed to load key', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal memuat status IndexNow.')] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, SEO_TOOL_ROLES)
  if (auth.error) return auth.error

  const raw = await request.json().catch(() => null)
  const parsed = indexNowSubmitSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, errors: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    )
  }

  try {
    const siteUrl = (await getSiteProfile()).url
    const urls: string[] = []
    for (const entry of parsed.data.urls) {
      let normalized: string
      try {
        normalized = normalizeIndexingUrl(entry, siteUrl)
      } catch (err) {
        console.warn('[indexnow] Rejected malformed URL', entry, err)
        return NextResponse.json({ data: null, errors: [`URL tidak valid: ${entry}`] }, { status: 400 })
      }
      if (!isSameSiteHost(normalized, siteUrl)) {
        return NextResponse.json(
          { data: null, errors: [`Hanya URL di ${new URL(siteUrl).hostname} yang dapat dikirim: ${entry}`] },
          { status: 400 }
        )
      }
      urls.push(normalized)
    }

    const result = await submitToIndexNow(urls)
    return NextResponse.json({
      data: result,
      message: result.message,
      errors: result.error ? [result.error] : [],
      warnings: [],
    })
  } catch (err) {
    console.error('[indexnow] Submission failed', err)
    return NextResponse.json(
      { data: null, errors: [publicMessage(err, 'Gagal mengirim URL ke IndexNow.')] },
      { status: 500 }
    )
  }
}
