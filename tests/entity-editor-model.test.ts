import { describe, it, expect } from 'vitest'
import { DATA_BOUND_TYPES } from '../src/blocks/registry'
import { PRESET_TYPES } from '../src/blocks/presets'
import { validateCatalogPublication } from '../src/lib/blocks/publication-gate'
import { DRAFT_FIELD_SCHEMAS, buildPreviewPage, previewDraftMessageSchema, type PreviewPayload } from '../src/lib/content/entity-preview-model'
import { portfolioMutationSchema, serviceCategoryMutationSchema, serviceMutationSchema } from '../src/lib/validation/api-schemas'
import {
  FIELD_TAB,
  buildPreviewDraftMessage,
  editorBlocks,
  gateInput,
  gateIssueTarget,
  isDirty,
  lifecycleActions,
  liveUrlStatus,
  mergeKeyOutcomes,
  mergeMetrics,
  payloadFieldTarget,
  publicPathOf,
  rowToForm,
  toPreviewFields,
  toSavePayload,
  validateForm,
  type EntityRow,
} from '../src/components/studio/entity/model'

/* --------------------------------- Fixtures -------------------------------- */

const categoryRow: EntityRow = {
  id: 7,
  slug: 'filmmaking-vfx',
  title: 'Filmmaking & VFX',
  tag: 'Set digital',
  shortDescription: 'Ringkasan kategori.',
  heroImage: '/uploads/set.jpg',
  themePreset: 'charcoal',
  // GET /api/service-categories returns parsed JSON columns.
  keyOutcomes: [
    { label: 'deliverable', value: 'Point cloud' },
    { label: 'tool', value: 'Laser scan' },
    { label: 'imageAlt', value: 'Alt lama' },
  ],
  blocks: [],
  order: 2,
  status: 'draft',
  showInNav: true,
  metaTitle: null,
  metaDescription: null,
  focusKeyphrase: null,
  seoData: { coverAlt: 'Set film dipindai', other: 'kept' },
}

const serviceRow: EntityRow = {
  id: 12,
  slug: 'scan-set',
  name: 'Scan set',
  categoryId: 7,
  indexNumber: null,
  shortDescription: 'Singkat.',
  longDescription: null,
  description: 'Baris satu\nBaris dua',
  heroImage: null,
  // GET /api/services returns raw string columns.
  deliverables: JSON.stringify([{ label: 'Mesh', detail: 'OBJ' }]),
  technologies: JSON.stringify(['LiDAR']),
  blocks: JSON.stringify([{ id: 'p1', type: 'paragraph', content: 'Blok lama' }]),
  order: 1,
  featured: false,
  status: 'published',
  metaTitle: 'Scan set untuk film',
  metaDescription: 'Deskripsi meta yang cukup panjang.',
  seoData: null,
  portfolioIds: [3, 4],
}

const portfolioRow: EntityRow = {
  id: 21,
  slug: 'museum',
  title: 'Museum',
  client: null,
  year: 2024,
  category: 'Memori & Dokumenter',
  summary: 'Ringkasan.',
  challenge: null,
  approach: 'Langkah 1\nLangkah 2',
  result: null,
  heroImage: null,
  liveUrl: 'https://superspl.at/s?id=abc123',
  metrics: JSON.stringify([
    { label: 'pointCount', value: '1 juta' },
    { label: 'scenePair', value: 'museum-b', detail: 'Sayap B' },
  ]),
  technologies: JSON.stringify(['3D Gaussian Splatting']),
  blocks: null,
  featured: true,
  status: 'in_review',
  seoData: JSON.stringify({ coverAlt: '' }),
}

/* ------------------------------- Row → form -------------------------------- */

describe('entity editor: row → form', () => {
  it('reads category key outcomes and cover alt from parsed JSON', () => {
    const f = rowToForm('service-category', categoryRow)
    expect(f.deliverables).toEqual(['Point cloud'])
    expect(f.tools).toEqual(['Laser scan'])
    expect(f.coverAlt).toBe('Set film dipindai')
    expect(f.order).toBe('2')
    expect(f.metaTitle).toBe('')
  })

  it('reads service lists from string columns and falls back to description', () => {
    const f = rowToForm('service', serviceRow)
    expect(f.deliverables).toEqual(['Mesh'])
    expect(f.technologies).toEqual(['LiDAR'])
    expect(f.longDescription).toBe('Baris satu\nBaris dua')
    expect(f.portfolioIds).toEqual([3, 4])
  })

  it('reads named portfolio metrics', () => {
    const f = rowToForm('portfolio', portfolioRow)
    expect(f.pointCount).toBe('1 juta')
    expect(f.accuracy).toBe('')
    expect(f.year).toBe('2024')
  })

  it('starts from the blocks the public page renders (preset / legacy resolved)', () => {
    expect(editorBlocks('service-category', []).map((b) => b.type)).toEqual([...PRESET_TYPES['service-category']])
    const service = editorBlocks('service', serviceRow.blocks)
    expect(service.map((b) => b.type)).toContain('paragraph')
    expect(service.some((b) => DATA_BOUND_TYPES.has(b.type))).toBe(true)
    expect(new Set(service.map((b) => b.id)).size).toBe(service.length)
  })
})

/* ------------------------------ Form → payload ----------------------------- */

describe('entity editor: form → save payload', () => {
  it('sends only identity fields when nothing changed', () => {
    const f = rowToForm('service', serviceRow)
    expect(toSavePayload(f, f, serviceRow)).toEqual({ id: 12, slug: 'scan-set', name: 'Scan set' })
    expect(isDirty(f, f)).toBe(false)
  })

  it('maps changed fields to API names and validates against the mutation schemas', () => {
    const base = rowToForm('service-category', categoryRow)
    const f = { ...base, tools: ['Laser scan', 'Drone'], coverAlt: ' Alt baru ', order: '', themePreset: 'filmmaking' }
    const payload = toSavePayload(f, base, categoryRow, { status: 'in_review' })
    expect(payload).toMatchObject({
      id: 7,
      title: 'Filmmaking & VFX',
      seoData: { coverAlt: 'Alt baru' },
      order: null,
      themePreset: 'filmmaking',
      status: 'in_review',
    })
    // Other key-outcome labels (legacy imageAlt) survive.
    expect(payload.keyOutcomes).toEqual([
      { label: 'imageAlt', value: 'Alt lama' },
      { label: 'deliverable', value: 'Point cloud' },
      { label: 'tool', value: 'Laser scan' },
      { label: 'tool', value: 'Drone' },
    ])
    expect(payload).not.toHaveProperty('blocks')
    expect(serviceCategoryMutationSchema.safeParse(payload).success).toBe(true)
  })

  it('sends everything (valid for the API) without a baseline', () => {
    const s = rowToForm('service', serviceRow)
    expect(serviceMutationSchema.safeParse(toSavePayload(s, null, serviceRow)).success).toBe(true)
    const p = rowToForm('portfolio', portfolioRow)
    const payload = toSavePayload(p, null, portfolioRow)
    expect(payload.year).toBe(2024)
    expect(portfolioMutationSchema.safeParse(payload).success).toBe(true)
  })

  it('keeps unnamed metrics (scenePair) and drops cleared named ones', () => {
    expect(mergeMetrics(portfolioRow.metrics, { pointCount: '', accuracy: '±5 mm', location: '' })).toEqual([
      { label: 'scenePair', value: 'museum-b', detail: 'Sayap B' },
      { label: 'accuracy', value: '±5 mm' },
    ])
    expect(mergeKeyOutcomes(null, [' A ', ''], [])).toEqual([{ label: 'deliverable', value: 'A' }])
  })

  it('sends edited blocks', () => {
    const base = rowToForm('portfolio', portfolioRow)
    const f = { ...base, blocks: base.blocks.slice(1) }
    expect(toSavePayload(f, base, portfolioRow).blocks).toEqual(f.blocks)
  })
})

/* -------------------------------- Preview --------------------------------- */

describe('entity editor: preview message', () => {
  it.each([
    ['service-category', categoryRow],
    ['service', serviceRow],
    ['portfolio', portfolioRow],
  ] as const)('%s fields pass the strict draft schema', (kind, row) => {
    const form = rowToForm(kind, row)
    expect(DRAFT_FIELD_SCHEMAS[kind].safeParse(toPreviewFields(form, row)).success).toBe(true)
    const msg = buildPreviewDraftMessage(form, row, form.blocks[0]?.id ?? null)
    const parsed = previewDraftMessageSchema.safeParse(msg)
    expect(parsed.success).toBe(true)
    expect(msg).toMatchObject({ entity: kind, id: row.id })
  })

  it('renders the unsaved fields in the shared view model', () => {
    const form = { ...rowToForm('portfolio', portfolioRow), title: 'Judul draf', accuracy: '±2 mm' }
    const payload: PreviewPayload = {
      kind: 'portfolio',
      row: {
        id: 21, slug: 'museum', title: 'Museum', client: null, year: 2024, category: null, summary: null, challenge: null,
        approach: null, result: null, heroImage: null, liveUrl: null, metrics: null, technologies: null, blocks: null, status: 'draft',
      },
      published: [],
      index: 0,
    }
    const msg = buildPreviewDraftMessage(form, portfolioRow, null)
    const page = buildPreviewPage(payload, { blocks: msg.blocks, fields: msg.fields })
    expect(page.fieldIssues).toEqual([])
    expect(page.blockIssues).toEqual([])
    expect(page.entity.kind === 'portfolio' && page.entity.project.title).toBe('Judul draf')
    expect(page.entity.kind === 'portfolio' && page.entity.project.accuracy).toBe('±2 mm')
  })

  it('builds public paths (services nest under the parent)', () => {
    expect(publicPathOf(rowToForm('service', serviceRow), 'filmmaking-vfx')).toBe('/services/filmmaking-vfx/scan-set')
    expect(publicPathOf(rowToForm('service', serviceRow), null)).toBeNull()
    expect(publicPathOf(rowToForm('portfolio', portfolioRow))).toBe('/portfolio/museum')
  })
})

/* ------------------------------ Validation -------------------------------- */

describe('entity editor: validation and issue mapping', () => {
  it('names the fix for local errors', () => {
    const f = { ...rowToForm('portfolio', portfolioRow), slug: 'Bad Slug', heroImage: '/x.jpg', coverAlt: '', year: '24', liveUrl: 'https://evil.example/x' }
    const errors = validateForm(f)
    expect(Object.keys(errors).sort()).toEqual(['coverAlt', 'liveUrl', 'slug', 'year'])
    expect(errors.liveUrl).toContain('superspl.at')
    const s = { ...rowToForm('service', serviceRow), categoryId: null }
    expect(validateForm(s).categoryId).toBeTruthy()
  })

  it('classifies scene URLs like the scene block', () => {
    expect(liveUrlStatus('')).toEqual({ kind: 'empty' })
    expect(liveUrlStatus('https://superspl.at/s?id=abc123')).toEqual({ kind: 'superSplat', sceneId: 'abc123' })
    expect(liveUrlStatus('/tours/museum/index.html')).toEqual({ kind: 'local' })
    expect(liveUrlStatus('https://player.vimeo.com/video/1').kind).toBe('embed')
    expect(liveUrlStatus('javascript:alert(1)').kind).toBe('invalid')
  })

  it('maps every gate issue to a field or the block list', () => {
    const form = { ...rowToForm('service', serviceRow), name: '', slug: 'x y', metaTitle: '', metaDescription: '', heroImage: '/a.jpg', coverAlt: '' }
    const gate = validateCatalogPublication(gateInput(form))
    expect(gate.issues.length).toBeGreaterThanOrEqual(5)
    const targets = gate.issues.map((i) => gateIssueTarget('service', i))
    expect(targets).toEqual(
      expect.arrayContaining([
        { kind: 'field', field: 'name' },
        { kind: 'field', field: 'slug' },
        { kind: 'field', field: 'metaTitle' },
        { kind: 'field', field: 'metaDescription' },
        { kind: 'field', field: 'coverAlt' },
      ]),
    )
    expect(targets.every((t) => t !== null)).toBe(true)
    expect(gateIssueTarget('portfolio', 'Skema Blok: [Block 2] tidak valid')).toEqual({ kind: 'blocks', index: 2 })
  })

  it('maps API body fields to form fields and tabs', () => {
    expect(payloadFieldTarget('portfolio', 'year')).toEqual({ kind: 'field', field: 'year' })
    expect(payloadFieldTarget('service-category', 'seoData')).toEqual({ kind: 'field', field: 'coverAlt' })
    expect(payloadFieldTarget('service', 'blocks.3.title')).toEqual({ kind: 'blocks', index: 3 })
    expect(payloadFieldTarget('service', 'whatsappPrompt')).toBeNull()
    expect(FIELD_TAB.portfolio.metaTitle).toBe('seo')
    expect(FIELD_TAB.service.portfolioIds).toBe('content')
  })

  it('offers lifecycle actions per status', () => {
    expect(lifecycleActions('published').map((a) => a.label)).toEqual(['Tarik dari situs', 'Arsipkan'])
    expect(lifecycleActions('draft').find((a) => a.primary)?.to).toBe('published')
    expect(lifecycleActions('in_review').filter((a) => !a.publisher).map((a) => a.label)).toEqual(['Kembalikan ke draf'])
    expect(lifecycleActions('archived')).toHaveLength(1)
  })
})
