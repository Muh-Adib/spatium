import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { db as prisma } from '../prisma/db'
import { BLOCK_TYPES, DATA_BOUND_TYPES, PAGE_HERO_TYPES } from '../src/blocks/registry'
import { BLOCK_PRESETS, PRESET_TYPES, buildPreset, categoryFaqs, hasDataBoundBlocks, resolveEntityBlocks } from '../src/blocks/presets'
import { BLOCK_CATALOG, listBlocksFor, validateBlockListFor } from '../src/lib/blocks/catalog'
import { ENTITY_TARGETS } from '../src/lib/blocks/define'
import { validateCatalogPublication } from '../src/lib/blocks/publication-gate'
import { catalogBlocksColumn } from '../src/lib/db/catalogMutations'
import { BlockRenderer } from '../src/components/blocks/BlockRenderer'
import { PortfolioView, ServiceCategoryView, ServiceView } from '../src/components/entity/EntityViews'
import { categoryEntity, portfolioEntity, serviceEntity, toProject, toServiceDetail, toUseCase, type CategoryRow, type PortfolioRow, type ServiceRow } from '../src/lib/content/entity-model'
import { buildPreviewPage, previewDraftMessageSchema, type PreviewPayload } from '../src/lib/content/entity-preview-model'
import { getPortfolioPage, getServiceCategoryPage, getServicePage, getServicePathBySlug, getPublishedServicePaths } from '../src/lib/content/spatium'

/* --------------------------------- Fixtures -------------------------------- */

const categoryRow: CategoryRow = {
  id: 9001,
  slug: 'uji-kategori',
  title: 'Uji & Kategori',
  tag: 'Tagline uji',
  shortDescription: 'Ringkasan kategori uji.',
  heroImage: null,
  themePreset: 'filmmaking',
  keyOutcomes: JSON.stringify([
    { label: 'deliverable', value: 'Keluaran A' },
    { label: 'tool', value: 'Laser scan' },
  ]),
  blocks: null,
  order: 1,
  metaTitle: 'Uji kategori layanan',
  metaDescription: 'Deskripsi meta kategori uji yang cukup panjang.',
  seoData: null,
  status: 'published',
}

const serviceRow: ServiceRow = {
  id: 9101,
  slug: 'uji-layanan',
  name: 'Uji Layanan',
  categoryId: 9001,
  indexNumber: null,
  shortDescription: 'Ringkasan layanan uji.',
  longDescription: 'Paragraf satu.\nParagraf dua.',
  description: null,
  heroImage: null,
  deliverables: JSON.stringify(['Model 3D']),
  technologies: JSON.stringify(['LiDAR']),
  blocks: null,
  order: 1,
  metaTitle: null,
  metaDescription: null,
  seoData: null,
  status: 'published',
}

const portfolioRow: PortfolioRow = {
  id: 9201,
  slug: 'uji-scene',
  title: 'Uji Scene',
  client: null,
  year: null,
  category: 'Hospitality · Wedding',
  summary: 'Tagline scene.',
  challenge: 'Konteks scene.',
  approach: 'Langkah satu\nLangkah dua',
  result: 'Aset satu',
  heroImage: null,
  liveUrl: 'https://superspl.at/s?id=abc123',
  metrics: null,
  technologies: JSON.stringify(['3D Gaussian Splatting']),
  blocks: null,
  status: 'published',
}

/* ------------------------------- Registry ---------------------------------- */

describe('data-bound entity blocks', () => {
  it('registers every preset type as a data-bound catalogue block offered only to entity targets', () => {
    for (const target of ENTITY_TARGETS) {
      for (const type of PRESET_TYPES[target]) {
        expect(BLOCK_TYPES, type).toContain(type)
        expect(DATA_BOUND_TYPES.has(type), type).toBe(true)
        const entry = BLOCK_CATALOG.find((e) => e.type === type)
        expect(entry?.targets, type).toContain(target)
        expect(entry?.targets, type).not.toContain('page')
      }
    }
    for (const hero of ['category-hero', 'service-hero', 'portfolio-hero']) expect(PAGE_HERO_TYPES.has(hero)).toBe(true)
    // Generic blocks stay available to every entity target.
    for (const target of ENTITY_TARGETS) expect(listBlocksFor(target).map((e) => e.type)).toEqual(expect.arrayContaining(['paragraph', 'splat-viewer', 'faq-accordion', 'studio-cta']))
  })

  it('presets validate for their own target and are refused elsewhere', () => {
    for (const target of ENTITY_TARGETS) {
      const preset = buildPreset(target, { ids: 'fresh' })
      expect(validateBlockListFor(target, preset).ok, target).toBe(true)
      expect(new Set(preset.map((b) => b.id)).size).toBe(preset.length)
      expect(BLOCK_PRESETS[target].map((b) => b.id)).toEqual(PRESET_TYPES[target].map((t) => `preset-${t}`))
    }
    const misplaced = validateBlockListFor('portfolio', [{ id: 'x', type: 'category-hero' }])
    expect(misplaced.ok).toBe(false)
    expect(misplaced.issues[0].message).toMatch(/tidak tersedia untuk portfolio/)
    expect(validateBlockListFor('page', buildPreset('service')).ok).toBe(false)
    const gate = validateCatalogPublication({
      title: 'Judul uji',
      slug: 'judul-uji',
      metaTitle: 'Meta title uji panjang',
      metaDescription: 'Meta description uji yang cukup panjang.',
      blocks: [{ id: 'a', type: 'portfolio-hero' }],
      target: 'service',
    })
    expect(gate.canPublish).toBe(false)
  })
})

/* --------------------------- resolveEntityBlocks ---------------------------- */

describe('resolveEntityBlocks', () => {
  it('renders the preset when nothing is stored and explicit lists as stored', () => {
    expect(resolveEntityBlocks('portfolio', []).map((b) => b.type)).toEqual([...PRESET_TYPES.portfolio])
    const explicit = [{ id: 'h', type: 'service-hero' }, { id: 'p', type: 'paragraph', text: 'x' }]
    expect(resolveEntityBlocks('service', explicit)).toEqual(explicit)
    expect(hasDataBoundBlocks(explicit)).toBe(true)
  })

  it('folds legacy category carriers into the preset and keeps extras after the deliverables', () => {
    const legacy = [
      { type: 'paragraph', id: 'p1', text: 'Intro satu' },
      { type: 'paragraph', id: 'p2', text: 'Intro dua' },
      { type: 'faq-accordion', id: 'f', items: [{ question: 'Q?', answer: 'A.' }] },
      { type: 'internal-links', id: 'l', links: [{ title: 'Scene', url: '/portfolio/wedding-venue' }, { title: 'Lain', url: '/about' }] },
      { type: 'studio-cta', id: 'extra', headline: 'Extra' },
    ]
    const resolved = resolveEntityBlocks('service-category', legacy)
    expect(resolved.map((b) => b.type)).toEqual([
      'category-hero', 'category-intro', 'category-capabilities', 'category-deliverables', 'studio-cta',
      'category-faq', 'category-related-work', 'category-next', 'entity-cta',
    ])
    expect(resolved.find((b) => b.type === 'category-intro')?.paragraphs).toEqual(['Intro satu', 'Intro dua'])
    expect(resolved.find((b) => b.type === 'category-faq')?.items).toEqual([{ question: 'Q?', answer: 'A.' }])
    expect(resolved.find((b) => b.type === 'category-related-work')?.portfolioSlugs).toEqual(['wedding-venue'])
    expect(categoryFaqs(resolved)).toEqual([{ q: 'Q?', a: 'A.' }])
    // Lossless: the folded list is valid and stays identical once stored.
    expect(validateBlockListFor('service-category', resolved).ok).toBe(true)
    expect(resolveEntityBlocks('service-category', resolved)).toEqual(resolved)
  })

  it('keeps legacy portfolio pages as stored and puts legacy service blocks before the CTA', () => {
    const custom = [{ type: 'paragraph', id: 'p', text: 'Halaman khusus' }]
    expect(resolveEntityBlocks('portfolio', custom)).toEqual(custom)
    const service = resolveEntityBlocks('service', custom).map((b) => b.type)
    expect(service.slice(-2)).toEqual(['paragraph', 'entity-cta'])
  })
})

/* -------------------------------- Rendering --------------------------------- */

describe('entity views', () => {
  const category = toUseCase(categoryRow, [serviceRow], 0)
  const project = toProject(portfolioRow, 0)

  it('renders the category preset from entity data, with capability links to child pages', () => {
    const entity = categoryEntity(category, [project], [category])
    const html = renderToStaticMarkup(createElement(ServiceCategoryView, { entity, blocks: resolveEntityBlocks('service-category', []) }))
    expect(html.match(/<h1/g)?.length).toBe(1)
    expect(html).toContain('Uji &amp; Kategori')
    expect(html).toContain('href="/services/uji-kategori/uji-layanan"')
    expect(html).toContain('Keluaran A')
    expect(html).toContain('Diskusikan proyek')
    expect(html).not.toContain('data-entity-placeholder')
  })

  it('renders a service page and a portfolio page through their views', () => {
    const detail = toServiceDetail(serviceRow, category, 0)
    const service = renderToStaticMarkup(
      createElement(ServiceView, { entity: serviceEntity(detail, category, []), blocks: resolveEntityBlocks('service', []) }),
    )
    expect(service).toContain('Uji Layanan')
    expect(service).toContain('Paragraf dua.')
    expect(service).toContain('Model 3D')
    expect(service).toContain('href="/services/uji-kategori"')

    const portfolio = renderToStaticMarkup(
      createElement(PortfolioView, { entity: portfolioEntity(project, [project]), blocks: resolveEntityBlocks('portfolio', []) }),
    )
    expect(portfolio).toContain('Konteks scene.')
    expect(portfolio).toContain('Langkah dua')
    expect(portfolio).not.toContain('min-h-screen')
  })

  it('shows a placeholder (never entity data) for a data-bound block rendered without its entity', () => {
    const html = renderToStaticMarkup(createElement(BlockRenderer, { blocks: [{ id: 'x', type: 'category-hero' }] }))
    expect(html).toContain('data-entity-placeholder="category-hero"')
    const wrongKind = renderToStaticMarkup(
      createElement(BlockRenderer, { blocks: [{ id: 'x', type: 'service-hero' }], contextData: { entity: portfolioEntity(project, []) } }),
    )
    expect(wrongKind).toContain('data-entity-placeholder="service-hero"')
  })
})

/* ------------------------------ Draft preview ------------------------------- */

describe('draft preview model', () => {
  const payload: PreviewPayload = {
    kind: 'service-category',
    row: categoryRow,
    children: [serviceRow],
    useCases: [],
    projects: [],
    position: 0,
  }

  it('renders the stored version, then unsaved fields and blocks', () => {
    const stored = buildPreviewPage(payload)
    expect(stored.blocks.map((b) => b.type)).toEqual([...PRESET_TYPES['service-category']])
    const draft = buildPreviewPage(payload, {
      fields: { title: 'Judul belum disimpan', keyOutcomes: [{ label: 'deliverable', value: 'Keluaran draf' }] },
      blocks: [{ id: 'h', type: 'category-hero', eyebrow: 'Draf' }],
    })
    expect(draft.entity.kind === 'service-category' && draft.entity.category.name).toBe('Judul belum disimpan')
    expect(draft.entity.kind === 'service-category' && draft.entity.category.deliverables).toEqual(['Keluaran draf'])
    expect(draft.blocks).toEqual([{ id: 'h', type: 'category-hero', eyebrow: 'Draf' }])
    expect(draft.blockIssues).toEqual([])
  })

  it('skips and reports invalid draft blocks and unknown fields', () => {
    const page = buildPreviewPage(payload, {
      fields: { status: 'published' },
      blocks: [{ id: 'ok', type: 'category-hero' }, { id: 'bad', type: 'portfolio-scene' }, { id: 'nope', type: 'no-such-block' }],
    })
    expect(page.blocks.map((b) => b.id)).toEqual(['ok'])
    expect(page.blockIssues.map((i) => i.blockId)).toEqual(expect.arrayContaining(['bad', 'nope']))
    expect(page.fieldIssues.length).toBeGreaterThan(0)
  })

  it('accepts only well-formed draft messages', () => {
    expect(previewDraftMessageSchema.safeParse({ type: 'spatium:preview:draft', entity: 'portfolio', blocks: [] }).success).toBe(true)
    expect(previewDraftMessageSchema.safeParse({ type: 'spatium:preview:draft', entity: 'page' }).success).toBe(false)
    expect(previewDraftMessageSchema.safeParse({ type: 'other', entity: 'portfolio' }).success).toBe(false)
  })
})

/* ------------------------------ Studio saves -------------------------------- */

describe('catalog blocks column (Studio save routes)', () => {
  it('stores the preset on create without blocks and validates against the target', async () => {
    for (const raw of [undefined, null, []]) {
      const created = catalogBlocksColumn('service-category', raw, 'create')
      expect(created.ok && JSON.parse(created.value ?? '[]').map((b: { type: string }) => b.type)).toEqual([...PRESET_TYPES['service-category']])
    }
    const unchanged = catalogBlocksColumn('service', undefined, 'update')
    expect(unchanged.ok && unchanged.value).toBeUndefined()
    const cleared = catalogBlocksColumn('service', [], 'update')
    expect(cleared.ok && cleared.value).toBeNull()
    const refused = catalogBlocksColumn('portfolio', [{ id: 'a', type: 'category-faq' }], 'update')
    expect(refused.ok).toBe(false)
    if (!refused.ok) {
      expect(refused.response.status).toBe(422)
      expect((await refused.response.json()).blockIssues[0].type).toBe('category-faq')
    }
  })
})

/* ------------------------------ Public loaders ------------------------------ */

describe('public entity pages (live DB)', () => {
  const RUN = Date.now().toString(36)
  const ids = { categories: [] as number[], services: [] as number[] }

  beforeAll(async () => {
    const live = await prisma.orm.public.ServiceCategory.create({ slug: `uji-live-${RUN}`, title: `Uji Live ${RUN}`, status: 'published' })
    const hidden = await prisma.orm.public.ServiceCategory.create({ slug: `uji-draft-${RUN}`, title: `Uji Draft ${RUN}`, status: 'draft' })
    ids.categories.push(live.id, hidden.id)
    for (const [slug, categoryId, status] of [
      [`svc-live-${RUN}`, live.id, 'published'],
      [`svc-draft-${RUN}`, live.id, 'draft'],
      [`svc-orphan-${RUN}`, hidden.id, 'published'],
    ] as const) {
      const row = await prisma.orm.public.Service.create({ slug, name: slug, categoryId, status, shortDescription: 'Ringkasan.' })
      ids.services.push(row.id)
    }
  })

  afterAll(async () => {
    for (const id of ids.services) await prisma.orm.public.Service.where({ id }).deleteAll()
    for (const id of ids.categories) await prisma.orm.public.ServiceCategory.where({ id }).deleteAll()
  })

  it('renders existing categories without stored data-bound blocks through the preset (content unchanged)', async () => {
    const page = await getServiceCategoryPage('filmmaking-vfx')
    if (!page) return // seed not loaded in this database
    expect(page.blocks.map((b) => b.type).filter((t) => DATA_BOUND_TYPES.has(t))).toEqual([...PRESET_TYPES['service-category']])
    expect(page.entity.category.capabilities.every((c) => c.href.startsWith('/services/filmmaking-vfx/'))).toBe(true)
    const intro = page.blocks.find((b) => b.type === 'category-intro')
    expect(intro?.paragraphs).toEqual(page.entity.category.intro)
  })

  it('renders portfolios without blocks through the preset', async () => {
    const page = await getPortfolioPage('wedding-venue')
    if (!page) return
    expect(page.blocks.map((b) => b.type)).toEqual([...PRESET_TYPES.portfolio])
  })

  it('serves child service pages only when the service and its category are published', async () => {
    const live = await getServicePage(`uji-live-${RUN}`, `svc-live-${RUN}`)
    expect(live?.entity.service.href).toBe(`/services/uji-live-${RUN}/svc-live-${RUN}`)
    expect(live?.blocks.map((b) => b.type)).toEqual([...PRESET_TYPES.service])
    expect(await getServicePage(`uji-live-${RUN}`, `svc-draft-${RUN}`)).toBeNull()
    expect(await getServicePage(`uji-draft-${RUN}`, `svc-orphan-${RUN}`)).toBeNull()
    // Wrong parent in the URL: not found.
    expect(await getServicePage('filmmaking-vfx', `svc-live-${RUN}`)).toBeNull()

    expect(await getServicePathBySlug(`svc-live-${RUN}`)).toBe(`/services/uji-live-${RUN}/svc-live-${RUN}`)
    expect(await getServicePathBySlug(`svc-draft-${RUN}`)).toBeNull()
    const paths = (await getPublishedServicePaths()).map((p) => p.slug)
    expect(paths).toContain(`svc-live-${RUN}`)
    expect(paths).not.toContain(`svc-draft-${RUN}`)
    expect(paths).not.toContain(`svc-orphan-${RUN}`)

    const category = await getServiceCategoryPage(`uji-live-${RUN}`)
    expect(category?.entity.category.capabilities.map((c) => c.slug)).toEqual([`svc-live-${RUN}`])
  })
})
