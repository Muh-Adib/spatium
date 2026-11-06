import { prisma } from '@/lib/db/prisma'
import { siteConfig } from '@/config/site'

export interface IndexNowSubmissionResult {
  success: boolean
  status: 'accepted' | 'rate_limited' | 'failed'
  submittedUrls: string[]
  statusCode?: number
  message: string
  error?: string
}

/**
 * Returns or initializes the IndexNow key stored in site_configs
 */
export async function getOrCreateIndexNowKey(): Promise<string> {
  const config = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
  if (config?.indexNowKey) {
    return config.indexNowKey
  }

  // Generate a random 32-character hexadecimal key using crypto
  const { randomBytes } = await import('node:crypto')
  const generatedKey = randomBytes(16).toString('hex')

  if (config) {
    await prisma.orm.public.SiteConfig.where({ id: 1 }).update({
      indexNowKey: generatedKey,
    })
  } else {
    await prisma.orm.public.SiteConfig.create({
      id: 1,
      name: siteConfig.name,
      url: siteConfig.url,
      indexNowKey: generatedKey,
    })
  }

  return generatedKey
}

/**
 * Submits changed URLs to IndexNow HTTP endpoint with timeout resilience
 */
export async function submitToIndexNow(
  urls: string[],
  options?: { timeoutMs?: number }
): Promise<IndexNowSubmissionResult> {
  if (!urls || urls.length === 0) {
    return {
      success: true,
      status: 'accepted',
      submittedUrls: [],
      message: 'Tidak ada URL untuk dikirim.',
    }
  }

  const timeoutMs = options?.timeoutMs ?? 10_000

  try {
    const key = await getOrCreateIndexNowKey()
    let baseSiteUrl = siteConfig.url || 'https://spatium.id'
    try {
      const { getSiteProfile } = await import('@/lib/db/siteProfile')
      const profile = await getSiteProfile()
      if (profile?.url) {
        baseSiteUrl = profile.url
      }
    } catch (err) {
      console.warn('[indexnow] Site profile unavailable, using siteConfig.url', err)
    }

    const cleanBase = baseSiteUrl.replace(/\/+$/, '')
    const host = new URL(cleanBase).host
    const keyLocation = `${cleanBase}/${key}.txt`

    // Ensure all URLs are absolute and normalized
    const absoluteUrls = urls.map((u) => {
      if (u.startsWith('http://') || u.startsWith('https://')) return u
      const cleanPath = u.startsWith('/') ? u : `/${u}`
      return `${cleanBase}${cleanPath}`
    })

    const payload = {
      host,
      key,
      keyLocation,
      urlList: absoluteUrls,
    }

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    })

    // IndexNow responds with:
    // 200: OK (URL submitted and processed)
    // 202: Accepted (Key is being validated)
    // 429: Rate limited
    const httpStatus = res.status
    const isSuccess = httpStatus === 200 || httpStatus === 202
    const status: 'accepted' | 'rate_limited' | 'failed' = isSuccess
      ? 'accepted'
      : httpStatus === 429
      ? 'rate_limited'
      : 'failed'

    return {
      success: isSuccess,
      status,
      statusCode: httpStatus,
      submittedUrls: absoluteUrls,
      message: isSuccess
        ? `Berhasil mengirim ${absoluteUrls.length} URL ke jaringan IndexNow (HTTP ${httpStatus}).`
        : `IndexNow merespons dengan HTTP ${httpStatus}.`,
    }
  } catch (err) {
    console.error('[indexnow] Submission failed', err)
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    const errorMsg = isTimeout
      ? `IndexNow request timed out after ${timeoutMs}ms.`
      : 'Gagal mengirim URL ke IndexNow.'

    return {
      success: false,
      status: 'failed',
      statusCode: isTimeout ? 504 : 500,
      submittedUrls: urls,
      message: 'Gagal mengirim URL ke IndexNow.',
      error: errorMsg,
    }
  }
}
