import { revalidatePath } from 'next/cache'
import { dispatchRevalidationWebhook } from '@/lib/webhooks/dispatcher'

export type CatalogEntity =
  | 'category'
  | 'service'
  | 'portfolio'
  | 'template'
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
        revalidatePath('/services')
        if (slug) {
          revalidatePath(`/services/${slug}`)
        }
        if (childSlugs && childSlugs.length > 0) {
          for (const cSlug of childSlugs) {
            revalidatePath(`/services/${cSlug}`)
          }
        }
        // Use cases feed the header mega menu and footer (root layout), so every
        // page that renders the site chrome must be regenerated.
        revalidatePath('/', 'layout')
        revalidatePath('/sitemap.xml')
        break

      case 'service':
        revalidatePath('/services')
        if (slug) {
          revalidatePath(`/services/${slug}`)
        }
        // Services and portfolios also feed the navigation in the root layout.
        revalidatePath('/', 'layout')
        revalidatePath('/sitemap.xml')
        break

      case 'portfolio':
        revalidatePath('/portfolio')
        if (slug) {
          revalidatePath(`/portfolio/${slug}`)
        }
        revalidatePath('/', 'layout')
        revalidatePath('/sitemap.xml')
        break

      case 'template':
        revalidatePath('/services')
        break

      case 'article':
        revalidatePath('/journal')
        if (slug) {
          revalidatePath(`/journal/${slug}`)
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
          ? `/services/${slug}`
          : entity === 'portfolio'
          ? `/portfolio/${slug}`
          : entity === 'article'
          ? `/journal/${slug}`
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
