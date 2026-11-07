'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Search, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button, inputClass } from './blocks/ui'
import { entityApi } from './entity/client'
import { CreateEntityDialog } from './entity/CreateEntityDialog'
import { EntityEditor } from './entity/EntityEditor'
import { EntityCard, ListState, editButtonId, useAdminParams, useReturnFocus } from './entity/list'
import type { EntityRow } from './entity/model'
import { TourUploadDialog } from './entity/TourUploadDialog'

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const ALL = ''

/**
 * Studio "Portofolio" tab: list, create, upload a tour, and the entity editor
 * at `/admin?tab=portfolio&id=<id>` (MCP deep link `slug=<slug>` still works).
 */
export function StudioPortfolioManager() {
  const { can } = useAuth()
  const params = useAdminParams()
  const [items, setItems] = useState<EntityRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [createOpen, setCreateOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const idParam = params.get('id')
  const editingId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  const rememberFocus = useReturnFocus(editingId !== null, headingRef)

  const load = useCallback(async () => {
    setLoadError(null)
    const res = await entityApi.list('portfolio')
    if (res.ok) setItems(res.data)
    else setLoadError(res.failure.error)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Old deep link (MCP editUrl): ?slug=<slug> → editor by id, once; only for roles that can save.
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    const slug = params.get('slug')
    if (!items || !slug || deepLinkHandled.current) return
    deepLinkHandled.current = true
    const match = items.find((p) => p.slug === slug)
    if (match && can('portfolio:update')) params.set({ id: String(match.id), slug: null }, 'replace')
  }, [items, params, can])

  const open = (id: number) => {
    rememberFocus(editButtonId('portfolio', id))
    setNotice('')
    params.set({ id: String(id), slug: null })
  }
  const close = (message?: string) => {
    setNotice(message ?? '')
    params.set({ id: null })
    void load()
  }

  const categories = useMemo(() => [...new Set((items ?? []).map((p) => str(p.category)).filter(Boolean))].sort(), [items])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (items ?? []).filter((p) => {
      if (category !== ALL && str(p.category) !== category) return false
      if (!q) return true
      return [p.title, p.client, p.category, p.slug].some((v) => str(v).toLowerCase().includes(q))
    })
  }, [items, query, category])

  if (editingId !== null && items) {
    return (
      <EntityEditor
        key={editingId}
        kind="portfolio"
        id={editingId}
        context={{ categories: [], services: [], portfolios: items }}
        onBack={() => close()}
        onChanged={() => void load()}
        onDeleted={(title) => close(`“${title}” dihapus.`)}
      />
    )
  }

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="font-heading text-lg font-semibold outline-none">
          Portofolio
        </h2>
        <div className="flex flex-wrap gap-2">
          {can('portfolio:create') ? (
            <>
              <Button icon={Upload} onClick={() => setTourOpen(true)}>
                Unggah tur
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
                Portofolio baru
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <p role="status" className={notice ? 'rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100' : 'sr-only'}>
        {notice}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <label htmlFor="portfolio-search" className="mb-1.5 block text-sm font-medium text-neutral-100">
            Cari
          </label>
          <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-neutral-300" aria-hidden="true" />
          <input
            id="portfolio-search"
            type="search"
            value={query}
            placeholder="Judul, klien, kategori, atau slug"
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass(false, 'h-10 pl-9')}
          />
        </div>
        <div className="min-w-[10rem]">
          <label htmlFor="portfolio-category" className="mb-1.5 block text-sm font-medium text-neutral-100">
            Kategori
          </label>
          <select id="portfolio-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass(false, 'h-10')}>
            <option value={ALL}>Semua ({items?.length ?? 0})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({(items ?? []).filter((p) => str(p.category) === c).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      <ListState
        loading={!items}
        error={loadError}
        onRetry={() => void load()}
        empty={items && items.length === 0 ? 'Belum ada portofolio.' : filtered.length === 0 ? 'Tidak ada portofolio yang cocok. Ubah pencarian atau kategori.' : null}
      >
        <p className="text-xs text-neutral-300" aria-live="polite">
          {filtered.length} dari {items?.length ?? 0} portofolio
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <EntityCard
              key={p.id}
              kind="portfolio"
              id={p.id}
              title={str(p.title)}
              status={p.status}
              path={`/portfolio/${p.slug}`}
              liveHref={p.status === 'published' ? `/portfolio/${p.slug}` : null}
              description={str(p.summary)}
              image={str(p.heroImage) || null}
              meta={
                <>
                  {str(p.category) ? <span>{str(p.category)}</span> : null}
                  {typeof p.year === 'number' ? <span>{p.year}</span> : null}
                  {str(p.client) ? <span>{str(p.client)}</span> : null}
                  {p.featured === true ? <span>Unggulan</span> : null}
                </>
              }
              canEdit={can('portfolio:update')}
              onEdit={() => open(p.id)}
            />
          ))}
        </ul>
      </ListState>

      <CreateEntityDialog
        kind="portfolio"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existing={items ?? []}
        categories={[]}
        onCreated={(id) => {
          setCreateOpen(false)
          void load()
          open(id)
        }}
      />
      <TourUploadDialog open={tourOpen} onClose={() => setTourOpen(false)} onUploaded={() => void load()} categories={categories} />
    </div>
  )
}
