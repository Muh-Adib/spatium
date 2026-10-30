import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { checkPublicationGate } from '@/lib/seo/validation'
import { extractContentImages } from './validation'
import { normalizeIndexingUrl } from '@/lib/seo/indexing-rate-limit'
import { triggerAutomatedIndexing } from '@/lib/seo/indexing-dispatcher'

/** Database rows survive restarts. Row locks prevent duplicate publication across replicas. */
export async function publishDueArticles(now = new Date()) {
  const { slugs, publishedArticles } = await prisma.transaction(async (tx) => {
    const due = await tx.orm.public.Article.where({ status: 'scheduled' })
      .where((a) => a.scheduledAt.lte(now.toISOString()))
      .orderBy((a) => a.scheduledAt.asc()).limit(20).forUpdate({ skipLocked: true }).all()
    const slugs: string[] = []
    const publishedArticles: Array<{ id: number; slug: string }> = []
    for (const article of due) {
      let seo: { openGraph?: { imageAlt?: string } } = {}
      let invalidSeo = false
      try {
        const parsed = article.seoData ? JSON.parse(article.seoData) : {}
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) invalidSeo = true
        else seo = parsed
      } catch { invalidSeo = true }
      const gate = checkPublicationGate({
        locale: article.locale === 'en' ? 'en' : 'id', title: article.title, slug: article.slug,
        seoTitle: article.metaTitle || '', metaDescription: article.metaDescription || '',
        existingSlugs: [], images: extractContentImages(article.content || ''),
        heroVisual: article.coverUrl || article.featuredImage ? {
          url: article.coverUrl || article.featuredImage || '',
          altText: seo.openGraph?.imageAlt || '', decorative: false,
        } : null,
      })
      if (invalidSeo) {
        gate.canPublish = false
        gate.violations.push({ rule: 'invalid_seo_json', field: 'seoData', severity: 'critical', message: 'Metadata SEO rusak; perbaiki sebelum menjadwalkan ulang.' })
      }
      const action = gate.canPublish ? 'scheduled_publish' : 'schedule_rejected'
      await tx.orm.public.ContentRevision.create({ entityType: 'article', entityId: String(article.id), actor: article.scheduledBy || 'scheduler', action, snapshot: JSON.stringify(article) })
      await tx.orm.public.Article.where({ id: article.id }).update({
        status: gate.canPublish ? 'published' : 'draft',
        publishedAt: gate.canPublish ? article.publishedAt || article.scheduledAt : article.publishedAt,
        scheduledAt: null,
        scheduleError: gate.canPublish ? null : gate.violations.map((v) => v.message).join('; '),
      })
      await tx.orm.public.SeoAuditLog.create({ entityType: 'article', entityId: String(article.id), actor: article.scheduledBy || 'scheduler', action, diff: JSON.stringify({ from: 'scheduled', to: gate.canPublish ? 'published' : 'draft', executedAt: now.toISOString(), violations: gate.violations }) })
      if (gate.canPublish) {
        slugs.push(article.slug)
        publishedArticles.push({ id: article.id, slug: article.slug })
      }
    }
    return { slugs, publishedArticles }
  })

  if (slugs.length) {
    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/artikel')
      revalidatePath('/sitemap.xml')
      for (const slug of slugs) revalidatePath(`/artikel/${slug}`)
    } catch (error) { console.warn('[scheduler] Published successfully; cache invalidation unavailable outside a request', error) }

    // Automated Indexing for newly published scheduled articles
    // Executes outside the DB transaction without blocking the scheduler tick
    for (const item of publishedArticles) {
      try {
        const targetUrl = normalizeIndexingUrl(`/artikel/${item.slug}`)
        void triggerAutomatedIndexing({
          url: targetUrl,
          entityType: 'article',
          entityId: item.id,
          actor: 'scheduler',
          isEditorialUpdate: false,
        }).catch((indexingErr) => {
          console.warn(`[scheduler] Automated indexing failed for ${item.slug}:`, indexingErr)
        })
      } catch (err) {
        console.warn(`[scheduler] Failed to initiate indexing for ${item.slug}:`, err)
      }
    }
  }

  return slugs
}

export function startPublicationScheduler() {
  const runtime = globalThis as typeof globalThis & { publicationTimer?: ReturnType<typeof setInterval> }
  if (runtime.publicationTimer) return
  let busy = false
  const tick = async () => {
    if (busy) return
    busy = true
    try { await publishDueArticles() } catch (error) { console.error('[scheduler] Publication tick failed', error) } finally { busy = false }
  }
  runtime.publicationTimer = setInterval(tick, 30_000)
  runtime.publicationTimer.unref()
  void tick()
}
