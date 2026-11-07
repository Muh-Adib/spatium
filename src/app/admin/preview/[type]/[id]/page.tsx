import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { DynamicPageView } from '@/components/blocks/DynamicPageView'
import { EntityPreview } from '@/components/entity/EntityPreview'
import { getPublicContact } from '@/lib/content/contact'
import { loadPreviewPayload } from '@/lib/content/entity-preview'
import type { PreviewPayload } from '@/lib/content/entity-preview-model'
import { serviceDetailPath } from '@/lib/content/entity-model'
import { userWithCapability } from '@/lib/auth/server-component'
import type { Capability } from '@/lib/auth/capability-matrix'
import { getPageById } from '@/lib/pages/repository'
import { pageIdSchema } from '@/lib/pages/http'

export const metadata: Metadata = {
  title: 'Preview — SPATIUM Studio',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ type: string; id: string }>
}

/** URL type segment → entity kind (`category`/`department` kept for old links). */
const KINDS: Record<string, PreviewPayload['kind']> = {
  'service-category': 'service-category',
  category: 'service-category',
  department: 'service-category',
  service: 'service',
  portfolio: 'portfolio',
}

/** Previewing an entity needs the right to edit it (drafts are not public). */
const PREVIEW_CAPABILITY: Record<PreviewPayload['kind'], Capability> = {
  'service-category': 'service-category:update',
  service: 'service:update',
  portfolio: 'portfolio:update',
}

function publicPathOf(payload: PreviewPayload): string | null {
  switch (payload.kind) {
    case 'service-category':
      return `/services/${payload.row.slug}`
    case 'service':
      return payload.parentRow ? serviceDetailPath(payload.parentRow.slug, payload.row.slug) : null
    case 'portfolio':
      return `/portfolio/${payload.row.slug}`
  }
}

/**
 * Studio preview: `/admin/preview/<type>/<id or slug>`.
 * - `page`: the saved dynamic page, exactly like `/<slug>`.
 * - `service-category` | `service` | `portfolio`: the saved entity (any status)
 *   through the public entity view; the editor can stream unsaved state into
 *   it with postMessage (contract in docs/EDITORS.md).
 */
export default async function AdminEntityPreviewPage({ params }: Props) {
  const { type, id } = await params
  const decodedId = decodeURIComponent(id)

  if (type === 'article') {
    redirect(`${siteConfig.url}/journal/${encodeURIComponent(decodedId)}`)
  }

  if (type === 'page') {
    if (!(await userWithCapability('page:update'))) notFound()
    const pageId = pageIdSchema.safeParse(decodedId)
    const page = pageId.success ? await getPageById(pageId.data) : null
    if (!page) notFound()
    return (
      <>
        <p role="status" className="sticky top-0 z-50 border-b border-amber-400/40 bg-[#1a1405] px-4 py-2 text-center text-sm text-amber-100">
          Pratinjau versi tersimpan · status: {page.status} · alamat publik: /{page.slug}
          {page.status === 'published' ? '' : ' (belum tampil di situs)'}
        </p>
        <main id="main">
          <DynamicPageView title={page.title} slug={page.slug} blocks={page.blocks} contact={await getPublicContact()} />
        </main>
      </>
    )
  }

  const kind = Object.hasOwn(KINDS, type) ? KINDS[type] : undefined
  if (!kind) notFound()
  // Server-side check (the proxy only requires a session): unauthorised → 404, no draft leaks.
  if (!(await userWithCapability(PREVIEW_CAPABILITY[kind]))) notFound()

  let payload: PreviewPayload | null = null
  try {
    payload = await loadPreviewPayload(kind, decodedId)
  } catch (err) {
    console.error('[admin preview] failed to load entity:', err)
  }
  if (!payload) notFound()

  const status = payload.row.status ?? 'published'
  return (
    <EntityPreview
      payload={payload}
      id={decodedId}
      status={status}
      publicPath={publicPathOf(payload)}
      contact={await getPublicContact()}
    />
  )
}
