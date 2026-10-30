import 'server-only'
import { getAllSites, getSiteBySlug, type SiteEntity } from '@/lib/db/site'

export interface RevalidationEvent {
  type: 'article' | 'page' | 'service' | 'portfolio' | 'redirect' | 'theme' | 'general'
  slug?: string
  path?: string
  tags?: string[]
  siteSlug?: string
}

export interface WebhookDispatchResult {
  siteSlug: string
  webhookUrl: string
  success: boolean
  statusCode?: number
  error?: string
  durationMs: number
}

/**
 * Dispatches On-Demand ISR revalidation webhooks to satellite frontends
 * Non-blocking, failsafe, and supports timeout guards.
 */
export async function dispatchRevalidationWebhook(
  event: RevalidationEvent
): Promise<WebhookDispatchResult[]> {
  const sitesToNotify: SiteEntity[] = []

  if (event.siteSlug) {
    const site = await getSiteBySlug(event.siteSlug)
    if (site && site.webhookUrl && site.isActive) {
      sitesToNotify.push(site)
    }
  } else {
    const allSites = await getAllSites()
    for (const site of allSites) {
      if (site.webhookUrl && site.isActive) {
        sitesToNotify.push(site)
      }
    }
  }

  if (sitesToNotify.length === 0) {
    return []
  }

  const defaultTags = [
    event.type,
    event.slug ? `${event.type}:${event.slug}` : null,
    event.path ? `path:${event.path}` : null,
  ].filter(Boolean) as string[]

  const finalTags = event.tags && event.tags.length > 0 ? event.tags : defaultTags

  const payload = {
    type: event.type,
    slug: event.slug,
    path: event.path,
    tags: finalTags,
    timestamp: Date.now(),
  }

  const dispatchPromises = sitesToNotify.map(async (site): Promise<WebhookDispatchResult> => {
    const start = Date.now()
    const url = site.webhookUrl!
    const secret = site.webhookSecret || process.env.REVALIDATE_SECRET || ''

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': secret,
          'User-Agent': 'SegiaTech-Core-WebhookDispatcher/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const durationMs = Date.now() - start

      return {
        siteSlug: site.slug,
        webhookUrl: url,
        success: response.ok,
        statusCode: response.status,
        durationMs,
      }
    } catch (err) {
      const durationMs = Date.now() - start
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.warn(`[WebhookDispatcher] Failed to dispatch to ${site.slug} (${url}):`, errorMessage)

      return {
        siteSlug: site.slug,
        webhookUrl: url,
        success: false,
        error: errorMessage,
        durationMs,
      }
    }
  })

  return Promise.all(dispatchPromises)
}
