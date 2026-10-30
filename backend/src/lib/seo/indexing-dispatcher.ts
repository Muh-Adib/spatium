import 'server-only'
import { submitToIndexNow, IndexNowSubmissionResult } from './indexnow'
import { inspectUrlWithGsc, GscInspectionResult } from '@/lib/gsc/indexing'
import { createIndexingSubmission } from '@/lib/db/indexing'
import { checkIndexingCooldown, normalizeIndexingUrl } from './indexing-rate-limit'

export interface IndexingResult {
  url: string
  provider: 'indexnow' | 'google'
  status: 'accepted' | 'success' | 'failed' | 'rate_limited' | 'unconfigured'
  httpStatus: number | null
  responsePayload?: string
  error?: string
}

export interface TriggerAutomatedIndexingOptions {
  url: string
  entityType?: 'article' | 'page' | 'custom'
  entityId?: number
  actor?: string
  robots?: string | null
  isEditorialUpdate?: boolean
  now?: Date
}

/**
 * Coordinated Indexing Dispatcher
 * Dispatches concurrent submissions to IndexNow and Google Search Console,
 * enforces draft and robots isolation, respects cooldown on editorial updates,
 * and records all submission events into PostgreSQL without throwing unhandled rejections.
 */
export async function triggerAutomatedIndexing(
  options: TriggerAutomatedIndexingOptions
): Promise<IndexingResult[]> {
  const {
    url: rawUrl,
    entityType = 'custom',
    entityId,
    actor = 'system:publication',
    robots,
    isEditorialUpdate = false,
    now = new Date(),
  } = options

  const results: IndexingResult[] = []

  // 1. Robots 'noindex' Protection: strictly isolate noindexed content
  if (robots && robots.toLowerCase().includes('noindex')) {
    console.warn(`[Indexing Dispatcher] URL "${rawUrl}" memiliki direktif noindex. Pengindeksan dibatalkan.`)
    return []
  }

  let normalizedUrl: string
  try {
    normalizedUrl = normalizeIndexingUrl(rawUrl)
  } catch (err: any) {
    console.error(`[Indexing Dispatcher] URL "${rawUrl}" tidak valid:`, err.message)
    return []
  }

  // 2. Cooldown Evaluation for Editorial Updates
  // When an article/page is already published and edited (editorial update),
  // suppress automated re-submission if within the 24-hour cooldown window to prevent search engine spam.
  if (isEditorialUpdate) {
    try {
      const cooldown = await checkIndexingCooldown(normalizedUrl, 'all', now.getTime(), { readonly: true })
      if (!cooldown.allowed) {
        console.info(
          `[Indexing Dispatcher] Editorial update for "${normalizedUrl}" suppressed by 24h cooldown (${cooldown.remainingFormatted} remaining).`
        )
        return []
      }
    } catch (err) {
      console.warn('[Indexing Dispatcher] Cooldown check failed, continuing dispatch:', err)
    }
  }

  // 3. Concurrent Dispatch to IndexNow and Google Search Console via Promise.allSettled
  const [indexNowOutcome, gscOutcome] = await Promise.allSettled([
    submitToIndexNow([normalizedUrl]),
    inspectUrlWithGsc(normalizedUrl),
  ])

  // 4. Process IndexNow Result & Persist to DB
  let indexNowResult: IndexingResult
  if (indexNowOutcome.status === 'fulfilled') {
    const res: IndexNowSubmissionResult = indexNowOutcome.value
    const status = res.status
    const httpStatus = res.statusCode ?? (res.success ? 202 : 500)
    const payloadStr = JSON.stringify(res)

    try {
      await createIndexingSubmission({
        url: normalizedUrl,
        entityType,
        entityId,
        provider: 'indexnow',
        status,
        httpStatus,
        responsePayload: payloadStr,
        trigger: 'publication',
        actor,
      })
    } catch (dbErr) {
      console.error('[Indexing Dispatcher] Failed to persist IndexNow record to DB:', dbErr)
    }

    indexNowResult = {
      url: normalizedUrl,
      provider: 'indexnow',
      status,
      httpStatus,
      responsePayload: payloadStr,
      error: res.error,
    }
  } else {
    const errMsg = indexNowOutcome.reason?.message || 'Unknown IndexNow error'
    try {
      await createIndexingSubmission({
        url: normalizedUrl,
        entityType,
        entityId,
        provider: 'indexnow',
        status: 'failed',
        httpStatus: 500,
        responsePayload: JSON.stringify({ error: errMsg }),
        trigger: 'publication',
        actor,
      })
    } catch (dbErr) {
      console.error('[Indexing Dispatcher] Failed to persist IndexNow failure to DB:', dbErr)
    }

    indexNowResult = {
      url: normalizedUrl,
      provider: 'indexnow',
      status: 'failed',
      httpStatus: 500,
      error: errMsg,
    }
  }
  results.push(indexNowResult)

  // 5. Process Google Search Console Result & Persist to DB
  let gscResult: IndexingResult
  if (gscOutcome.status === 'fulfilled') {
    const res: GscInspectionResult = gscOutcome.value
    const status = res.status
    const httpStatus = res.httpStatus
    const payloadStr = JSON.stringify(res)

    try {
      await createIndexingSubmission({
        url: normalizedUrl,
        entityType,
        entityId,
        provider: 'google',
        status,
        httpStatus,
        responsePayload: payloadStr,
        trigger: 'publication',
        actor,
      })
    } catch (dbErr) {
      console.error('[Indexing Dispatcher] Failed to persist Google record to DB:', dbErr)
    }

    gscResult = {
      url: normalizedUrl,
      provider: 'google',
      status,
      httpStatus,
      responsePayload: payloadStr,
      error: res.error,
    }
  } else {
    const errMsg = gscOutcome.reason?.message || 'Unknown GSC error'
    try {
      await createIndexingSubmission({
        url: normalizedUrl,
        entityType,
        entityId,
        provider: 'google',
        status: 'failed',
        httpStatus: 500,
        responsePayload: JSON.stringify({ error: errMsg }),
        trigger: 'publication',
        actor,
      })
    } catch (dbErr) {
      console.error('[Indexing Dispatcher] Failed to persist Google failure to DB:', dbErr)
    }

    gscResult = {
      url: normalizedUrl,
      provider: 'google',
      status: 'failed',
      httpStatus: 500,
      error: errMsg,
    }
  }
  results.push(gscResult)

  return results
}
