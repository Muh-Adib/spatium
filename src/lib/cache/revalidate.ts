import { revalidatePath } from 'next/cache'
import { dispatchRevalidationWebhook } from '@/lib/webhooks/dispatcher'

export type CatalogEntity =
  | 'category'
  | 'service'
  | 'solution'
  | 'portfolio'
  | 'template'
  | 'config'
  | 'article'

/**
 * Unified Catalog Revalidation Contract (K-6)
 *
 * Enforces centralized, deterministic cache revalidation rules across all
 * catalog mutation routes. Avoids scattered revalidatePath calls.
 */
export async function revalidateCatalog(
  entity: CatalogEntity,
  slug?: string | null,
  childSlugs?: string[]
): Promise<void> {
  try {
    switch (entity) {
      case 'category':
        // Category change revalidates overview, child routes, and home/navigation
        revalidatePath('/layanan')
        if (slug) {
          revalidatePath(`/layanan/${slug}`)
        }
        if (childSlugs && childSlugs.length > 0) {
          for (const cSlug of childSlugs) {
            revalidatePath(`/layanan/${cSlug}`)
          }
        }
        revalidatePath('/')
        revalidatePath('/sitemap.xml')
        break

      case 'service':
        revalidatePath('/layanan')
        if (slug) {
          revalidatePath(`/layanan/${slug}`)
        }
        revalidatePath('/')
        revalidatePath('/sitemap.xml')
        break

      case 'solution':
        revalidatePath('/solusi')
        if (slug) {
          revalidatePath(`/solusi/${slug}`)
        }
        revalidatePath('/')
        revalidatePath('/sitemap.xml')
        break

      case 'portfolio':
        revalidatePath('/portofolio')
        if (slug) {
          revalidatePath(`/portofolio/${slug}`)
        }
        revalidatePath('/')
        revalidatePath('/sitemap.xml')
        break

      case 'template':
      case 'config':
        revalidatePath('/layanan')
        revalidatePath('/solusi')
        break

      case 'article':
        revalidatePath('/artikel')
        if (slug) {
          revalidatePath(`/artikel/${slug}`)
        }
        revalidatePath('/')
        revalidatePath('/sitemap.xml')
        break

      default:
        break
    }

    // Dispatch On-Demand ISR webhook to satellite frontends
    if (process.env.NODE_ENV !== 'test') {
      const eventType =
        entity === 'article'
          ? 'article'
          : entity === 'service' || entity === 'category'
          ? 'service'
          : entity === 'portfolio'
          ? 'portfolio'
          : 'general'

      const entityPath = slug
        ? entity === 'service'
          ? `/layanan/${slug}`
          : entity === 'portfolio'
          ? `/portofolio/${slug}`
          : entity === 'article'
          ? `/artikel/${slug}`
          : entity === 'solution'
          ? `/solusi/${slug}`
          : undefined
        : undefined

      dispatchRevalidationWebhook({
        type: eventType,
        slug: slug || undefined,
        path: entityPath,
        tags: [entity, slug ? `${entity}:${slug}` : null].filter(Boolean) as string[],
      }).catch((webhookErr) => {
        console.warn('[revalidateCatalog] Webhook dispatch warning:', webhookErr)
      })
    }
  } catch (err) {
    // In test environment or edge execution where revalidatePath may not be active
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[revalidateCatalog] Warning during revalidation:', err)
    }
  }
}
