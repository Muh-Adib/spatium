'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { serviceDetailPath } from '@/lib/content/entity-model'
import { PanelTabs } from './blocks/PanelTabs'
import { Button } from './blocks/ui'
import { entityApi } from './entity/client'
import type { EditorContext } from './entity/content'
import { CreateEntityDialog } from './entity/CreateEntityDialog'
import { EntityEditor } from './entity/EntityEditor'
import { EntityCard, ListState, editButtonId, useAdminParams, useReturnFocus } from './entity/list'
import type { EntityKind, EntityRow } from './entity/model'

type ListTab = 'categories' | 'services'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/**
 * Studio "Layanan" tab: service categories and their services. The editor
 * opens in place at `/admin?tab=services&type=category|service&id=<id>`;
 * the MCP deep links `slug=<service>` and `category=<category>` still work.
 */
export function StudioServicesManager() {
  const { can } = useAuth()
  const params = useAdminParams()
  const baseId = useId()
  const [lists, setLists] = useState<EditorContext | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createKind, setCreateKind] = useState<EntityKind>('service-category')
  const [createOpen, setCreateOpen] = useState(false)
  const startCreate = (kind: EntityKind) => {
    setCreateKind(kind)
    setCreateOpen(true)
  }
  const [notice, setNotice] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  const typeParam = params.get('type')
  const idParam = params.get('id')
  const editing: { kind: EntityKind; id: number } | null =
    idParam && /^\d+$/.test(idParam) ? { kind: typeParam === 'category' ? 'service-category' : 'service', id: Number(idParam) } : null
  const [listTab, setListTab] = useState<ListTab>(typeParam === 'service' ? 'services' : 'categories')
  const rememberFocus = useReturnFocus(editing !== null, headingRef)

  const load = useCallback(async () => {
    setLoadError(null)
    const [categories, services, portfolios] = await Promise.all([entityApi.list('service-category'), entityApi.list('service'), entityApi.list('portfolio')])
    if (!categories.ok || !services.ok) {
      setLoadError((!categories.ok ? categories.failure.error : !services.ok ? services.failure.error : '') || 'Coba lagi.')
      return
    }
    if (!portfolios.ok) console.warn('[services] portfolio list unavailable:', portfolios.failure.error)
    setLists({ categories: categories.data, services: services.data, portfolios: portfolios.ok ? portfolios.data : [] })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Old deep links (MCP editUrl): ?slug=<service> / ?category=<category slug> → editor by id, once.
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (!lists || deepLinkHandled.current) return
    const slug = params.get('slug')
    const categorySlug = params.get('category')
    if (!slug && !categorySlug) return
    deepLinkHandled.current = true
    const service = slug ? lists.services.find((s) => s.slug === slug) : undefined
    const category = categorySlug ? lists.categories.find((c) => c.slug === categorySlug) : undefined
    // Only roles that can save edits get the editor; others just see the list.
    if (service && can('service:update')) params.set({ type: 'service', id: String(service.id), slug: null, category: null }, 'replace')
    else if (category && can('service-category:update')) params.set({ type: 'category', id: String(category.id), slug: null, category: null }, 'replace')
  }, [lists, params, can])

  const open = (kind: EntityKind, id: number) => {
    rememberFocus(editButtonId(kind, id))
    setNotice('')
    params.set({ type: kind === 'service-category' ? 'category' : 'service', id: String(id), slug: null, category: null })
  }
  const close = (message?: string) => {
    setNotice(message ?? '')
    params.set({ type: null, id: null })
    void load()
  }

  const categoriesById = useMemo(() => new Map((lists?.categories ?? []).map((c) => [c.id, c])), [lists])

  if (editing && lists) {
    return (
      <EntityEditor
        key={`${editing.kind}-${editing.id}`}
        kind={editing.kind}
        id={editing.id}
        context={lists}
        onBack={() => close()}
        onChanged={() => void load()}
        onDeleted={(title) => close(`“${title}” dihapus.`)}
      />
    )
  }

  const categories = lists?.categories ?? []
  const services = lists?.services ?? []
  const groups: { key: string; title: string; parent: EntityRow | null; items: EntityRow[] }[] = [
    ...categories.map((c) => ({ key: String(c.id), title: str(c.title) || c.slug, parent: c, items: services.filter((s) => s.categoryId === c.id) })),
    { key: 'none', title: 'Tanpa kategori induk', parent: null, items: services.filter((s) => typeof s.categoryId !== 'number' || !categoriesById.has(s.categoryId)) },
  ].filter((g) => g.parent || g.items.length > 0)

  const tabs = [
    { id: 'categories', label: 'Kategori layanan', badge: categories.length },
    { id: 'services', label: 'Layanan', badge: services.length },
  ]

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 ref={headingRef} tabIndex={-1} className="font-heading text-lg font-semibold outline-none">
          Layanan
        </h2>
        {listTab === 'categories' && can('service-category:create') ? (
          <Button variant="primary" icon={Plus} onClick={() => startCreate('service-category')}>
            Kategori layanan baru
          </Button>
        ) : listTab === 'services' && can('service:create') ? (
          <Button variant="primary" icon={Plus} onClick={() => startCreate('service')}>
            Layanan baru
          </Button>
        ) : null}
      </div>

      <p role="status" className={notice ? 'rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100' : 'sr-only'}>
        {notice}
      </p>

      <div className="rounded-xl border border-white/10">
        <PanelTabs baseId={baseId} panels={tabs} active={listTab} onChange={(id) => setListTab(id === 'services' ? 'services' : 'categories')} label="Daftar layanan" />
        <div role="tabpanel" id={`${baseId}-panel-${listTab}`} aria-labelledby={`${baseId}-tab-${listTab}`} className="p-3 sm:p-4">
          <ListState
            loading={!lists}
            error={loadError}
            onRetry={() => void load()}
            empty={listTab === 'categories' ? (categories.length ? null : 'Belum ada kategori layanan.') : services.length ? null : 'Belum ada layanan.'}
          >
            {listTab === 'categories' ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {categories.map((c) => {
                  const title = str(c.title)
                  const count = services.filter((s) => s.categoryId === c.id).length
                  return (
                    <EntityCard
                      key={c.id}
                      kind="service-category"
                      id={c.id}
                      title={title}
                      status={c.status}
                      path={`/services/${c.slug}`}
                      liveHref={c.status === 'published' ? `/services/${c.slug}` : null}
                      description={str(c.shortDescription)}
                      meta={
                        <>
                          <span>{count} layanan</span>
                          <span>{c.showInNav === false ? 'Tidak di menu header' : 'Di menu header'}</span>
                        </>
                      }
                      canEdit={can('service-category:update')}
                      onEdit={() => open('service-category', c.id)}
                    />
                  )
                })}
              </ul>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <section key={g.key} aria-labelledby={`${baseId}-group-${g.key}`} className="space-y-2">
                    <h3 id={`${baseId}-group-${g.key}`} className="text-sm font-semibold text-neutral-100">
                      {g.title} <span className="font-normal text-neutral-300">· {g.items.length} layanan</span>
                    </h3>
                    {g.items.length === 0 ? (
                      <p className="text-sm text-neutral-300">Belum ada layanan di kategori ini.</p>
                    ) : (
                      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {g.items.map((s) => {
                          const path = g.parent ? serviceDetailPath(g.parent.slug, s.slug) : null
                          const live = s.status === 'published' && g.parent?.status === 'published'
                          return (
                            <EntityCard
                              key={s.id}
                              kind="service"
                              id={s.id}
                              title={str(s.name)}
                              status={s.status}
                              path={path ?? 'Belum tampil: pilih kategori induk'}
                              liveHref={live && path ? path : null}
                              description={str(s.shortDescription)}
                              canEdit={can('service:update')}
                              onEdit={() => open('service', s.id)}
                            />
                          )
                        })}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}
          </ListState>
        </div>
      </div>

      <CreateEntityDialog
        kind={createKind}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existing={createKind === 'service' ? services : categories}
        categories={categories}
        onCreated={(id) => {
          setCreateOpen(false)
          void load()
          open(createKind, id)
        }}
      />
    </div>
  )
}
