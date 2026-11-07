'use client'

import { useEffect, useMemo, useState } from 'react'
import { useScrollReveal } from '@/hooks'
import { PortfolioView, ServiceCategoryView, ServiceView } from './EntityViews'
import {
  PREVIEW_MESSAGES,
  buildPreviewPage,
  previewDraftMessageSchema,
  type PreviewDraft,
  type PreviewPayload,
} from '@/lib/content/entity-preview-model'
import type { PublicContact } from '@/lib/contact/public-contact'

type Props = {
  payload: PreviewPayload
  /** The id segment of the preview URL (echoed in messages). */
  id: string
  status: string
  publicPath: string | null
  contact?: PublicContact
}

/**
 * Studio preview of a service category, service or portfolio. Renders the
 * stored version through the public entity view; when the Studio editor (the
 * parent window, same origin) posts a `spatium:preview:draft` message, it
 * re-renders with the unsaved blocks/fields instead. Nothing is saved.
 */
export function EntityPreview({ payload, id, status, publicPath, contact }: Props) {
  const [draft, setDraft] = useState<PreviewDraft | null>(null)
  useScrollReveal()

  const page = useMemo(() => buildPreviewPage(payload, draft), [payload, draft])

  useEffect(() => {
    if (window.parent === window) return
    const origin = window.location.origin
    const onMessage = (event: MessageEvent) => {
      // Only the Studio window that embeds this preview, on this origin.
      if (event.origin !== origin || event.source !== window.parent) return
      const parsed = previewDraftMessageSchema.safeParse(event.data)
      if (!parsed.success) {
        if (event.data && typeof event.data === 'object' && (event.data as { type?: unknown }).type === PREVIEW_MESSAGES.draft) {
          console.warn('[preview] ignored malformed draft message:', parsed.error.message)
        }
        return
      }
      if (parsed.data.entity !== payload.kind) return
      if (parsed.data.id !== undefined && String(parsed.data.id) !== id) return
      setDraft({ blocks: parsed.data.blocks, fields: parsed.data.fields })
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: PREVIEW_MESSAGES.ready, entity: payload.kind, id }, origin)
    return () => window.removeEventListener('message', onMessage)
  }, [payload.kind, id])

  // Report what was applied (and what was skipped) back to the editor.
  useEffect(() => {
    if (!draft || window.parent === window) return
    window.parent.postMessage(
      {
        type: PREVIEW_MESSAGES.applied,
        entity: payload.kind,
        id,
        blockIssues: page.blockIssues,
        fieldIssues: page.fieldIssues,
        blockCount: page.blocks.length,
      },
      window.location.origin,
    )
  }, [draft, page, payload.kind, id])

  const issueCount = page.blockIssues.length + page.fieldIssues.length

  return (
    <>
      <p
        role="status"
        className="sticky top-0 z-50 border-b border-amber-400/40 bg-[#1a1405] px-4 py-2 text-center text-sm text-amber-100"
      >
        {draft ? 'Pratinjau perubahan yang belum disimpan' : 'Pratinjau versi tersimpan'} · status: {status}
        {publicPath ? ` · alamat publik: ${publicPath}` : ''}
        {status === 'published' ? '' : ' (belum tampil di situs)'}
        {issueCount > 0 ? ` · ${issueCount} masalah dilewati` : ''}
      </p>
      <main id="main" className="app-main">
        {page.entity.kind === 'service-category' ? (
          <ServiceCategoryView entity={page.entity} blocks={page.blocks} contact={contact} />
        ) : page.entity.kind === 'service' ? (
          <ServiceView entity={page.entity} blocks={page.blocks} contact={contact} />
        ) : (
          <PortfolioView entity={page.entity} blocks={page.blocks} contact={contact} />
        )}
      </main>
    </>
  )
}
