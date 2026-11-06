'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CreatePageDialog } from './CreatePageDialog'
import { PageEditor } from './PageEditor'
import { PagesList } from './PagesList'
import { pagesApi, type ApiFailure, type PageSummaryDto } from './client'

/**
 * Studio "Halaman" tab: list, create, edit (blocks + SEO + history), publish
 * and delete dynamic pages rendered at `/<slug>`. Self-contained; mount it
 * inside the admin shell.
 */
export default function StudioPagesManager() {
  const [pages, setPages] = useState<PageSummaryDto[] | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  // The open page lives in the URL (`?tab=pages&page=<id>`) so links from MCP
  // ("editUrl") and browser back/forward land on the right editor.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageParam = searchParams?.get('page') ?? null
  const editingId = pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : null
  const setEditingId = useCallback(
    (id: number | null) => {
      const next = new URLSearchParams(searchParams?.toString() ?? '')
      if (id === null) next.delete('page')
      else next.set('page', String(id))
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const listHeadingRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async () => {
    setFailure(null)
    const res = await pagesApi.list()
    if (res.ok) setPages(res.data.pages)
    else {
      setPages(null)
      setFailure(res.failure)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const existingSlugs = useMemo(() => new Set((pages ?? []).map((p) => p.slug)), [pages])

  const backToList = (message?: string) => {
    setEditingId(null)
    setNotice(message ?? '')
    void loadList()
    // Move focus to the list so keyboard users are not left on a removed element.
    requestAnimationFrame(() => listHeadingRef.current?.focus())
  }

  return (
    <div className="text-white">
      <div role="status" className="sr-only">
        {notice}
      </div>
      {editingId !== null ? (
        <PageEditor
          key={editingId}
          pageId={editingId}
          onBack={() => backToList()}
          onChanged={() => void loadList()}
          onDeleted={(title) => backToList(`Halaman “${title}” dihapus.`)}
        />
      ) : (
        <div ref={listHeadingRef} tabIndex={-1} className="outline-none">
          {notice ? <p className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</p> : null}
          <PagesList pages={pages} failure={failure} onRetry={() => void loadList()} onCreate={() => setCreateOpen(true)} onOpen={(id) => setEditingId(id)} />
        </div>
      )}
      <CreatePageDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existingSlugs={existingSlugs}
        onCreated={(page) => {
          setCreateOpen(false)
          setNotice('')
          setEditingId(page.id)
          void loadList()
        }}
      />
    </div>
  )
}
