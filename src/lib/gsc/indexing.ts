import 'server-only'
import { getGoogleAccessToken, GoogleServiceAccountAuth } from './client'
import { getSiteProfile } from '@/lib/db/siteProfile'

export interface GscInspectionResult {
  connected: boolean
  success: boolean
  status: 'success' | 'rate_limited' | 'failed' | 'unconfigured'
  httpStatus: number | null
  verdict?: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL' | string
  coverageState?: string
  robotsTxtState?: string
  indexingState?: string
  lastCrawlTime?: string
  message: string
  data?: any
  error?: string
}

export interface InspectUrlWithGscOptions {
  siteUrl?: string
  timeoutMs?: number
  auth?: GoogleServiceAccountAuth
}

/**
 * Inspect a URL against the Google Search Console URL Inspection API.
 * Uses service account RS256 JWT auth without any external Google SDK.
 */
export async function inspectUrlWithGsc(
  inspectionUrl: string,
  options?: InspectUrlWithGscOptions
): Promise<GscInspectionResult> {
  const clientEmail = options?.auth?.clientEmail || process.env.GSC_CLIENT_EMAIL
  const privateKey = options?.auth?.privateKey || process.env.GSC_PRIVATE_KEY
  const timeoutMs = options?.timeoutMs ?? 10_000

  // 1. Verify credential configuration
  if (!clientEmail || !privateKey) {
    return {
      connected: false,
      success: false,
      status: 'unconfigured',
      httpStatus: null,
      message: 'Google Search Console belum terhubung (GSC_CLIENT_EMAIL atau GSC_PRIVATE_KEY belum dikonfigurasi).',
    }
  }

  try {
    // 2. Resolve canonical site URL property
    let siteUrl = options?.siteUrl
    if (!siteUrl) {
      try {
        const profile = await getSiteProfile()
        siteUrl = profile?.url ? (profile.url.endsWith('/') ? profile.url : `${profile.url}/`) : 'https://www.unimasi.com/'
      } catch {
        siteUrl = 'https://www.unimasi.com/'
      }
    }

    // 3. Obtain OAuth2 token via RS256 JWT
    const accessToken = await getGoogleAccessToken(
      { clientEmail, privateKey },
      ['https://www.googleapis.com/auth/webmasters.readonly']
    )

    // 4. Query URL Inspection API
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
      signal: AbortSignal.timeout(timeoutMs),
    })

    const httpStatus = res.status

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      const status = httpStatus === 429 ? 'rate_limited' : 'failed'
      return {
        connected: true,
        success: false,
        status,
        httpStatus,
        message: `GSC URL Inspection API error (${httpStatus}): ${errorText}`,
        error: errorText,
      }
    }

    const data = await res.json()
    const inspectionResult = data?.inspectionResult
    const indexStatus = inspectionResult?.indexStatusResult

    return {
      connected: true,
      success: true,
      status: 'success',
      httpStatus: 200,
      verdict: indexStatus?.verdict || 'PASS',
      coverageState: indexStatus?.coverageState,
      robotsTxtState: indexStatus?.robotsTxtState,
      indexingState: indexStatus?.indexingState,
      lastCrawlTime: indexStatus?.lastCrawlTime,
      data,
      message: 'Inspeksi URL Google Search Console berhasil.',
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return {
      connected: true,
      success: false,
      status: 'failed',
      httpStatus: isTimeout ? 504 : 500,
      message: isTimeout
        ? `GSC URL Inspection timed out after ${timeoutMs}ms.`
        : err?.message || 'Gagal memanggil Google Search Console API.',
      error: err?.message,
    }
  }
}

/**
 * Backward compatibility alias for inspectUrlWithGsc
 */
export const inspectUrlGoogle = inspectUrlWithGsc
