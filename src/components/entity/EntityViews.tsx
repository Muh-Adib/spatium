import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { hasDataBoundBlocks } from '@/blocks/presets'
import type { EntityOf } from '@/blocks/entity-context'
import type { PublicContact } from '@/lib/contact/public-contact'

/**
 * One view per entity type. The public routes and the Studio preview
 * (`/admin/preview/<type>/<id>`, including unsaved drafts) both render through
 * these, so the preview is the public page. `blocks` is the resolved list
 * (`resolveEntityBlocks`); data-bound blocks read `entity`.
 *
 * Synchronous and hook-free: a Server Component on the public site and a
 * client component inside the draft preview.
 */
type ViewProps<K extends 'service-category' | 'service' | 'portfolio'> = {
  entity: EntityOf<K>
  blocks: readonly unknown[]
  contact?: PublicContact
}

export function ServiceCategoryView({ entity, blocks, contact }: ViewProps<'service-category'>) {
  return (
    <div data-entity="service-category" data-entity-slug={entity.category.slug}>
      <BlockRenderer blocks={[...blocks]} contextData={{ entity, contact }} />
    </div>
  )
}

export function ServiceView({ entity, blocks, contact }: ViewProps<'service'>) {
  return (
    <div data-entity="service" data-entity-slug={entity.service.slug}>
      <BlockRenderer blocks={[...blocks]} contextData={{ entity, contact }} />
    </div>
  )
}

export function PortfolioView({ entity, blocks, contact }: ViewProps<'portfolio'>) {
  // Legacy custom pages (generic blocks only) keep the dark canvas they were designed on.
  const legacy = !hasDataBoundBlocks(blocks)
  return (
    <div
      data-entity="portfolio"
      data-entity-slug={entity.project.slug}
      className={legacy ? 'min-h-screen bg-[var(--color-background)] text-white' : undefined}
    >
      <BlockRenderer blocks={[...blocks]} contextData={{ entity, contact }} />
    </div>
  )
}
