/**
 * Pure model of the Studio entity editor (service category, service,
 * portfolio): stored row ↔ form, form → save payload (`POST /api/<entity>`),
 * form → draft preview message, publication gate input, issue → field
 * mapping and lifecycle actions. No React; covered by
 * tests/entity-editor-model.test.ts.
 */
import { resolveEntityBlocks, type StoredBlock } from '@/blocks/presets'
import type { PublicationGateInput } from '@/lib/blocks/publication-gate'
import type { EntityTarget } from '@/lib/blocks/define'
import { serviceDetailPath } from '@/lib/content/entity-model'
import { PREVIEW_MESSAGES, type PreviewDraftMessage } from '@/lib/content/entity-preview-model'
import { superSplatIdFromUrl } from '@/lib/content/spatium-types'
import { ALLOWED_EMBED_DOMAINS, validateEmbedUrl } from '@/lib/media/embedValidator'
import { ensureBlockIds, isRecord, type EditorBlock } from '../blocks/model'
import { isEditorialStatus, type EditorialStatus } from '../pages/status'

export type EntityKind = EntityTarget

/* --------------------------------- Forms ---------------------------------- */

type CommonForm = {
  slug: string
  heroImage: string
  coverAlt: string
  metaTitle: string
  metaDescription: string
  focusKeyphrase: string
  blocks: EditorBlock[]
}

export type CategoryForm = CommonForm & {
  kind: 'service-category'
  title: string
  tag: string
  shortDescription: string
  themePreset: string
  order: string
  showInNav: boolean
  deliverables: string[]
  tools: string[]
}

export type ServiceForm = CommonForm & {
  kind: 'service'
  name: string
  categoryId: number | null
  indexNumber: string
  shortDescription: string
  longDescription: string
  order: string
  featured: boolean
  portfolioIds: number[]
  deliverables: string[]
  technologies: string[]
}

export type PortfolioForm = CommonForm & {
  kind: 'portfolio'
  title: string
  category: string
  client: string
  year: string
  summary: string
  liveUrl: string
  challenge: string
  approach: string
  result: string
  technologies: string[]
  pointCount: string
  accuracy: string
  location: string
  featured: boolean
}

export type EntityForm = CategoryForm | ServiceForm | PortfolioForm
export type FormOf<K extends EntityKind> = Extract<EntityForm, { kind: K }>

/** Editable field keys (everything but `kind` and `blocks`). */
export type FieldKey<F extends EntityForm = EntityForm> = Exclude<F extends unknown ? keyof F : never, 'kind' | 'blocks'> & string

/** Where an issue sends the editor: a field, or the block list. */
export type IssueTarget = { kind: 'field'; field: string } | { kind: 'blocks'; index?: number }

/** A stored row as returned by the Studio list APIs (JSON columns may be strings or parsed). */
export type EntityRow = Record<string, unknown> & { id: number; slug: string }

/* ------------------------------ JSON helpers ------------------------------ */

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (!value.trim()) return null
  try {
    return JSON.parse(value)
  } catch (err) {
    console.warn('[entity-editor] malformed JSON column:', err)
    return null
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '')
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

export type LabelledItem = { label: string; value: string; detail?: string | null }

/** `[{ label, value, detail? }]` column (keyOutcomes, metrics). Malformed entries are dropped. */
export function labelledList(raw: unknown): LabelledItem[] {
  const parsed = parseMaybeJson(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((item): LabelledItem[] => {
    if (!isRecord(item) || typeof item.label !== 'string' || typeof item.value !== 'string') return []
    const detail = typeof item.detail === 'string' ? item.detail : undefined
    return [detail === undefined ? { label: item.label, value: item.value } : { label: item.label, value: item.value, detail }]
  })
}

/** `["a"]` or `[{ label|title|name|value }]` column, as strings (same rule as the public view). */
export function stringList(raw: unknown): string[] {
  const parsed = parseMaybeJson(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [item.trim()] : []
    if (isRecord(item)) {
      const text = [item.label, item.title, item.name, item.value].find((v): v is string => typeof v === 'string' && v.trim() !== '')
      return text ? [text.trim()] : []
    }
    return []
  })
}

function idList(raw: unknown): number[] {
  return Array.isArray(raw) ? raw.filter((v): v is number => typeof v === 'number' && Number.isInteger(v)) : []
}

/** Cover alt text from `seoData.coverAlt` (string or parsed object). */
export function coverAltFromRow(seoData: unknown): string {
  const parsed = parseMaybeJson(seoData)
  return isRecord(parsed) && typeof parsed.coverAlt === 'string' ? parsed.coverAlt : ''
}

export function statusOf(row: EntityRow): EditorialStatus | null {
  return isEditorialStatus(row.status) ? row.status : null
}

/* ------------------------------- Row → form ------------------------------- */

const METRIC_KEYS = ['pointCount', 'accuracy', 'location'] as const
type MetricKey = (typeof METRIC_KEYS)[number]

function storedBlocks(raw: unknown): StoredBlock[] {
  const parsed = parseMaybeJson(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.filter((b): b is StoredBlock => isRecord(b) && typeof b.type === 'string')
}

/**
 * Blocks the editor starts from: what the public page renders
 * (`resolveEntityBlocks`), so saving them changes nothing visible.
 */
export function editorBlocks(kind: EntityKind, raw: unknown): EditorBlock[] {
  return ensureBlockIds(resolveEntityBlocks(kind, storedBlocks(raw)))
}

function commonFrom(kind: EntityKind, row: EntityRow): CommonForm {
  return {
    slug: str(row.slug),
    heroImage: str(row.heroImage),
    coverAlt: coverAltFromRow(row.seoData),
    metaTitle: str(row.metaTitle),
    metaDescription: str(row.metaDescription),
    focusKeyphrase: str(row.focusKeyphrase),
    blocks: editorBlocks(kind, row.blocks),
  }
}

export function rowToForm(kind: 'service-category', row: EntityRow): CategoryForm
export function rowToForm(kind: 'service', row: EntityRow): ServiceForm
export function rowToForm(kind: 'portfolio', row: EntityRow): PortfolioForm
export function rowToForm(kind: EntityKind, row: EntityRow): EntityForm
export function rowToForm(kind: EntityKind, row: EntityRow): EntityForm {
  const common = commonFrom(kind, row)
  switch (kind) {
    case 'service-category': {
      const outcomes = labelledList(row.keyOutcomes)
      return {
        ...common,
        kind,
        title: str(row.title),
        tag: str(row.tag),
        shortDescription: str(row.shortDescription),
        themePreset: str(row.themePreset),
        order: row.order === null || row.order === undefined ? '' : str(row.order),
        showInNav: bool(row.showInNav, true),
        deliverables: outcomes.filter((o) => o.label === 'deliverable').map((o) => o.value),
        tools: outcomes.filter((o) => o.label === 'tool').map((o) => o.value),
      }
    }
    case 'service':
      return {
        ...common,
        kind,
        name: str(row.name),
        categoryId: typeof row.categoryId === 'number' ? row.categoryId : null,
        indexNumber: str(row.indexNumber),
        shortDescription: str(row.shortDescription),
        longDescription: str(row.longDescription) || str(row.description),
        order: row.order === null || row.order === undefined ? '' : str(row.order),
        featured: bool(row.featured, false),
        portfolioIds: idList(row.portfolioIds),
        deliverables: stringList(row.deliverables),
        technologies: stringList(row.technologies),
      }
    case 'portfolio': {
      const metrics = labelledList(row.metrics)
      const metric = (key: MetricKey) => metrics.find((m) => m.label === key)?.value ?? ''
      return {
        ...common,
        kind,
        title: str(row.title),
        category: str(row.category),
        client: str(row.client),
        year: row.year === null || row.year === undefined ? '' : str(row.year),
        summary: str(row.summary),
        liveUrl: str(row.liveUrl),
        challenge: str(row.challenge),
        approach: str(row.approach),
        result: str(row.result),
        technologies: stringList(row.technologies),
        pointCount: metric('pointCount'),
        accuracy: metric('accuracy'),
        location: metric('location'),
        featured: bool(row.featured, false),
      }
    }
  }
}

/* ------------------------------ Form → payload ----------------------------- */

const text = (v: string): string | null => (v.trim() ? v.trim() : null)
const cleanList = (list: readonly string[]): string[] => list.map((s) => s.trim()).filter(Boolean)

function intOrNull(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v.trim())
  return Number.isInteger(n) ? n : null
}

/** keyOutcomes: other labels (e.g. legacy `imageAlt`) are kept as stored. */
export function mergeKeyOutcomes(stored: unknown, deliverables: readonly string[], tools: readonly string[]): LabelledItem[] {
  const others = labelledList(stored).filter((o) => o.label !== 'deliverable' && o.label !== 'tool')
  return [
    ...others,
    ...cleanList(deliverables).map((value) => ({ label: 'deliverable', value })),
    ...cleanList(tools).map((value) => ({ label: 'tool', value })),
  ]
}

/** metrics: the named fields replace their entries; other labels (scenePair, sceneUrl, …) are kept. */
export function mergeMetrics(stored: unknown, values: Readonly<Record<MetricKey, string>>): LabelledItem[] {
  const list = labelledList(stored)
  const out: LabelledItem[] = []
  const written = new Set<string>()
  for (const item of list) {
    const key = METRIC_KEYS.find((k) => k === item.label)
    if (!key) {
      out.push(item)
      continue
    }
    if (written.has(key)) continue
    written.add(key)
    const value = values[key].trim()
    if (value) out.push({ ...item, value })
  }
  for (const key of METRIC_KEYS) {
    const value = values[key].trim()
    if (!written.has(key) && value) out.push({ label: key, value })
  }
  return out
}

type Payload = Record<string, unknown>
type FieldWriter<F> = (form: F, row: EntityRow | null) => Payload

const COMMON_WRITERS: Record<Exclude<keyof CommonForm, 'slug'>, FieldWriter<CommonForm>> = {
  heroImage: (f) => ({ heroImage: text(f.heroImage) }),
  // Merged server-side into seoData (other SEO keys are kept).
  coverAlt: (f) => ({ seoData: { coverAlt: f.coverAlt.trim() } }),
  metaTitle: (f) => ({ metaTitle: text(f.metaTitle) }),
  metaDescription: (f) => ({ metaDescription: text(f.metaDescription) }),
  focusKeyphrase: (f) => ({ focusKeyphrase: text(f.focusKeyphrase) }),
  blocks: (f) => ({ blocks: f.blocks }),
}

const CATEGORY_WRITERS: Record<Exclude<keyof CategoryForm, 'kind' | 'slug' | 'title' | keyof CommonForm>, FieldWriter<CategoryForm>> = {
  tag: (f) => ({ tag: text(f.tag) }),
  shortDescription: (f) => ({ shortDescription: text(f.shortDescription) }),
  themePreset: (f) => ({ themePreset: text(f.themePreset) }),
  order: (f) => ({ order: intOrNull(f.order) }),
  showInNav: (f) => ({ showInNav: f.showInNav }),
  deliverables: (f, row) => ({ keyOutcomes: mergeKeyOutcomes(row?.keyOutcomes, f.deliverables, f.tools) }),
  tools: (f, row) => ({ keyOutcomes: mergeKeyOutcomes(row?.keyOutcomes, f.deliverables, f.tools) }),
}

const SERVICE_WRITERS: Record<Exclude<keyof ServiceForm, 'kind' | 'slug' | 'name' | keyof CommonForm>, FieldWriter<ServiceForm>> = {
  categoryId: (f) => ({ categoryId: f.categoryId }),
  indexNumber: (f) => ({ indexNumber: text(f.indexNumber) }),
  shortDescription: (f) => ({ shortDescription: text(f.shortDescription) }),
  // The API mirrors longDescription into `description` (older readers use it).
  longDescription: (f) => ({ longDescription: text(f.longDescription) }),
  order: (f) => ({ order: intOrNull(f.order) }),
  featured: (f) => ({ featured: f.featured }),
  portfolioIds: (f) => ({ portfolioIds: [...f.portfolioIds] }),
  deliverables: (f) => ({ deliverables: cleanList(f.deliverables) }),
  technologies: (f) => ({ technologies: cleanList(f.technologies) }),
}

const metricValues = (f: PortfolioForm) => ({ pointCount: f.pointCount, accuracy: f.accuracy, location: f.location })

const PORTFOLIO_WRITERS: Record<Exclude<keyof PortfolioForm, 'kind' | 'slug' | 'title' | keyof CommonForm>, FieldWriter<PortfolioForm>> = {
  category: (f) => ({ category: text(f.category) }),
  client: (f) => ({ client: text(f.client) }),
  year: (f) => ({ year: f.year.trim() ? Number(f.year.trim()) : null }),
  summary: (f) => ({ summary: text(f.summary) }),
  liveUrl: (f) => ({ liveUrl: text(f.liveUrl) }),
  challenge: (f) => ({ challenge: text(f.challenge) }),
  approach: (f) => ({ approach: text(f.approach) }),
  result: (f) => ({ result: text(f.result) }),
  technologies: (f) => ({ technologies: cleanList(f.technologies) }),
  pointCount: (f, row) => ({ metrics: mergeMetrics(row?.metrics, metricValues(f)) }),
  accuracy: (f, row) => ({ metrics: mergeMetrics(row?.metrics, metricValues(f)) }),
  location: (f, row) => ({ metrics: mergeMetrics(row?.metrics, metricValues(f)) }),
  featured: (f) => ({ featured: f.featured }),
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b)

function changedWriters<F extends EntityForm>(form: F, baseline: F | null, writers: Record<string, FieldWriter<F>>, row: EntityRow | null): Payload {
  const out: Payload = {}
  const formRecord: Record<string, unknown> = form
  const baseRecord: Record<string, unknown> | null = baseline
  for (const [key, write] of Object.entries(writers)) {
    if (baseRecord && same(formRecord[key], baseRecord[key])) continue
    Object.assign(out, write(form, row))
  }
  return out
}

/**
 * Body for `POST /api/<entity>`. Only fields that changed against `baseline`
 * are sent (the API updates partially, so untouched columns keep their stored
 * shape); identity fields (`id`, title/name, slug) are always sent because
 * the schema requires them. `baseline: null` sends everything.
 */
export function toSavePayload(
  form: EntityForm,
  baseline: EntityForm | null,
  row: EntityRow | null,
  extra: { status?: EditorialStatus; expectedUpdatedAt?: string | null } = {},
): Payload {
  const base = baseline && baseline.kind === form.kind ? baseline : null
  const identity: Payload = { ...(row ? { id: row.id } : {}), slug: form.slug.trim() }
  let fields: Payload
  switch (form.kind) {
    case 'service-category':
      identity.title = form.title.trim()
      fields = changedWriters(form, base?.kind === 'service-category' ? base : null, { ...COMMON_WRITERS, ...CATEGORY_WRITERS }, row)
      break
    case 'service':
      identity.name = form.name.trim()
      fields = changedWriters(form, base?.kind === 'service' ? base : null, { ...COMMON_WRITERS, ...SERVICE_WRITERS }, row)
      break
    case 'portfolio':
      identity.title = form.title.trim()
      fields = changedWriters(form, base?.kind === 'portfolio' ? base : null, { ...COMMON_WRITERS, ...PORTFOLIO_WRITERS }, row)
      break
  }
  return {
    ...identity,
    ...fields,
    ...(extra.status ? { status: extra.status } : {}),
    // Optimistic concurrency: the server answers 409 `conflict` when the row changed since.
    ...(row && extra.expectedUpdatedAt ? { expectedUpdatedAt: extra.expectedUpdatedAt } : {}),
  }
}

/** `updatedAt` of a stored row as the list API returned it (sent back as `expectedUpdatedAt`). */
export function updatedAtOf(row: EntityRow | null): string | null {
  return row && typeof row.updatedAt === 'string' && row.updatedAt ? row.updatedAt : null
}

/* ------------------------------ Riwayat ----------------------------------- */

/**
 * Form for "Pulihkan versi ini": the snapshot's content fields and blocks,
 * applied over the open form as unsaved changes. Kept from the open form:
 * the slug (restoring must not move the public URL) and a service's linked
 * portfolios (not part of revision snapshots). Status is not a form field,
 * so it never changes here.
 */
export function formFromSnapshot(kind: EntityKind, snapshot: Readonly<Record<string, unknown>>, current: EntityForm): EntityForm {
  const restored = rowToForm(kind, { ...snapshot, id: typeof snapshot.id === 'number' ? snapshot.id : 0, slug: current.slug })
  restored.slug = current.slug
  if (restored.kind === 'service' && current.kind === 'service') restored.portfolioIds = [...current.portfolioIds]
  return restored
}

/** Column names in revision snapshots → Studio labels (glossary in docs/EDITORS.md). */
const COLUMN_LABEL: Record<string, string> = {
  title: 'Judul',
  name: 'Nama',
  slug: 'Slug',
  tag: 'Tagline',
  shortDescription: 'Deskripsi singkat',
  longDescription: 'Deskripsi lengkap',
  description: 'Deskripsi lengkap',
  summary: 'Ringkasan',
  heroImage: 'Gambar sampul',
  seoData: 'Teks alternatif gambar sampul',
  metaTitle: 'Meta title',
  metaDescription: 'Meta description',
  focusKeyphrase: 'Frasa kunci utama',
  relatedKeyphrases: 'Frasa kunci terkait',
  blocks: 'Blok',
  keyOutcomes: 'Keluaran & alat',
  deliverables: 'Keluaran',
  technologies: 'Teknologi',
  metrics: 'Metrik',
  order: 'Urutan',
  showInNav: 'Tampil di menu header',
  featured: 'Unggulan',
  categoryId: 'Kategori induk',
  indexNumber: 'Nomor tampilan',
  themePreset: 'Ilustrasi',
  client: 'Klien',
  year: 'Tahun',
  category: 'Kategori',
  liveUrl: 'Scene 3D',
  challenge: 'Tantangan',
  approach: 'Langkah capture',
  solution: 'Solusi',
  process: 'Proses',
  result: 'Keluaran',
}

/** Readable, de-duplicated labels for changed columns. */
export function changedFieldLabels(columns: readonly string[]): string[] {
  return [...new Set(columns.map((c) => COLUMN_LABEL[c] ?? c))]
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Dibuat',
  'create:tour-upload': 'Dibuat dari unggahan tur',
  update: 'Diubah',
  'update:tour-upload': 'Tur diunggah ulang',
  delete: 'Dihapus',
  baseline: 'Versi tertua yang tercatat',
}

const HISTORY_TIME = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** `7 Nov 2026 16.20` for messages about a version. */
export function formatHistoryTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : HISTORY_TIME.format(d)
}

export function historyActionLabel(action: string): string {
  return ACTION_LABEL[action] ?? action
}

export function isDirty(form: EntityForm | null, baseline: EntityForm | null): boolean {
  return Boolean(form && baseline && !same(form, baseline))
}

/* ------------------------------- Preview ---------------------------------- */

/**
 * Unsaved fields for the draft preview, with exactly the keys
 * `DRAFT_FIELD_SCHEMAS[kind]` accepts (it is strict: one unknown key and the
 * iframe ignores them all).
 */
export function toPreviewFields(form: EntityForm, row: EntityRow | null): Record<string, unknown> {
  const seoData = { coverAlt: form.coverAlt.trim() }
  switch (form.kind) {
    case 'service-category':
      return {
        title: form.title,
        tag: text(form.tag),
        shortDescription: text(form.shortDescription),
        heroImage: text(form.heroImage),
        themePreset: text(form.themePreset),
        keyOutcomes: mergeKeyOutcomes(row?.keyOutcomes, form.deliverables, form.tools),
        order: intOrNull(form.order),
        metaTitle: text(form.metaTitle),
        metaDescription: text(form.metaDescription),
        seoData,
      }
    case 'service':
      return {
        name: form.name,
        indexNumber: text(form.indexNumber),
        shortDescription: text(form.shortDescription),
        longDescription: text(form.longDescription),
        description: text(form.longDescription),
        heroImage: text(form.heroImage),
        deliverables: cleanList(form.deliverables),
        technologies: cleanList(form.technologies),
        metaTitle: text(form.metaTitle),
        metaDescription: text(form.metaDescription),
        seoData,
      }
    case 'portfolio':
      return {
        title: form.title,
        client: text(form.client),
        year: /^\d{4}$/.test(form.year.trim()) ? Number(form.year.trim()) : null,
        category: text(form.category),
        summary: text(form.summary),
        challenge: text(form.challenge),
        approach: text(form.approach),
        result: text(form.result),
        heroImage: text(form.heroImage),
        liveUrl: text(form.liveUrl),
        metrics: mergeMetrics(row?.metrics, metricValues(form)),
        technologies: cleanList(form.technologies),
      }
  }
}

/** The `spatium:preview:draft` message for the preview iframe (contract in docs/EDITORS.md). */
export function buildPreviewDraftMessage(
  form: EntityForm,
  row: EntityRow,
  selectedBlockId: string | null,
): PreviewDraftMessage {
  return {
    type: PREVIEW_MESSAGES.draft,
    entity: form.kind,
    id: row.id,
    blocks: form.blocks,
    fields: toPreviewFields(form, row),
    selectedBlockId,
  }
}

export function previewPath(kind: EntityKind, id: number): string {
  return `/admin/preview/${kind}/${id}`
}

/** Public URL of the entity (service pages need the parent category slug). */
export function publicPathOf(form: EntityForm, parentSlug?: string | null): string | null {
  const slug = form.slug.trim() || '…'
  switch (form.kind) {
    case 'service-category':
      return `/services/${slug}`
    case 'service':
      return parentSlug ? serviceDetailPath(parentSlug, slug) : null
    case 'portfolio':
      return `/portfolio/${slug}`
  }
}

/* ------------------------------ Validation -------------------------------- */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type LiveUrlStatus =
  | { kind: 'empty' }
  | { kind: 'superSplat'; sceneId: string }
  | { kind: 'embed'; domain: string }
  | { kind: 'local' }
  | { kind: 'invalid'; message: string }

/**
 * How the portfolio scene block will use `liveUrl`: a SuperSplat scene id is
 * embedded; other URLs only when `validateEmbedUrl` allows them (CSP); a local
 * tour path (`/tours/…`) is not embedded (the block shows the poster).
 */
export function liveUrlStatus(raw: string): LiveUrlStatus {
  const url = raw.trim()
  if (!url) return { kind: 'empty' }
  const sceneId = superSplatIdFromUrl(url)
  if (sceneId) return { kind: 'superSplat', sceneId }
  if (/^\/(?!\/)[^\s]*$/.test(url)) return { kind: 'local' }
  const check = validateEmbedUrl(url)
  if (check.isValid && check.domain) return { kind: 'embed', domain: check.domain }
  const domains = ALLOWED_EMBED_DOMAINS.filter((d) => !d.startsWith('www.')).join(', ')
  return {
    kind: 'invalid',
    message: `${check.reason ?? 'URL tidak bisa disematkan.'} Gunakan URL scene SuperSplat (https://superspl.at/s?id=…) atau domain yang diizinkan: ${domains}.`,
  }
}

export type FieldErrors = Partial<Record<string, string>>

/** Checks run before every save: each message names the fix. */
export function validateForm(form: EntityForm): FieldErrors {
  const errors: FieldErrors = {}
  const titleKey = form.kind === 'service' ? 'name' : 'title'
  const title = form.kind === 'service' ? form.name : form.title
  if (!title.trim()) errors[titleKey] = form.kind === 'service' ? 'Isi nama layanan.' : 'Isi judul.'
  const slug = form.slug.trim()
  if (!slug) errors.slug = 'Isi slug, mis. pemindaian-gedung.'
  else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Gunakan huruf kecil, angka, dan tanda hubung saja, mis. pemindaian-gedung.'
  if (form.heroImage.trim() && !form.coverAlt.trim()) errors.coverAlt = 'Jelaskan isi gambar sampul untuk pembaca layar.'
  if (form.kind !== 'portfolio' && form.order.trim() && !/^-?\d+$/.test(form.order.trim())) errors.order = 'Isi urutan dengan angka bulat, mis. 1.'
  if (form.kind === 'service' && form.categoryId === null) errors.categoryId = 'Pilih kategori induk. Halaman layanan tayang di bawah kategorinya.'
  if (form.kind === 'portfolio') {
    const year = form.year.trim()
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2200)) errors.year = 'Isi tahun 4 digit, mis. 2025, atau kosongkan.'
    const live = liveUrlStatus(form.liveUrl)
    if (live.kind === 'invalid') errors.liveUrl = live.message
  }
  return errors
}

/* ------------------------------ Gate & issues ----------------------------- */

/** Input of the publication gate (`validateCatalogPublication`), same as the API runs. */
export function gateInput(form: EntityForm): PublicationGateInput {
  return {
    title: form.kind === 'service' ? form.name : form.title,
    slug: form.slug.trim(),
    metaTitle: text(form.metaTitle) ?? undefined,
    metaDescription: text(form.metaDescription) ?? undefined,
    heroImage: text(form.heroImage) ?? undefined,
    heroImageAlt: text(form.coverAlt) ?? undefined,
    blocks: form.blocks,
    target: form.kind,
  }
}

/** Gate message (Indonesian, from publication-gate.ts) → where to fix it. */
export function gateIssueTarget(kind: EntityKind, issue: string): IssueTarget | null {
  const s = issue.toLowerCase()
  if (s.startsWith('judul')) return { kind: 'field', field: kind === 'service' ? 'name' : 'title' }
  if (s.startsWith('slug')) return { kind: 'field', field: 'slug' }
  if (s.startsWith('meta title')) return { kind: 'field', field: 'metaTitle' }
  if (s.startsWith('meta description')) return { kind: 'field', field: 'metaDescription' }
  if (s.startsWith('teks alternatif gambar sampul')) return { kind: 'field', field: 'coverAlt' }
  // `Blok 3 (type): …` is 1-based; the editor's list is 0-based.
  const blockNumber = /^blok (\d+)/.exec(s)
  if (blockNumber) return { kind: 'blocks', index: Number(blockNumber[1]) - 1 }
  if (s.startsWith('blok') || s.startsWith('daftar blok')) return { kind: 'blocks' }
  return null
}

/** API payload field (Zod issue path) → form field. */
export function payloadFieldTarget(kind: EntityKind, field: string): IssueTarget | null {
  const head = field.split('.')[0] ?? ''
  if (head === 'blocks') {
    const index = Number(field.split('.')[1])
    return { kind: 'blocks', index: Number.isInteger(index) ? index : undefined }
  }
  const map: Record<string, string> = {
    seoData: 'coverAlt',
    keyOutcomes: 'deliverables',
    metrics: 'pointCount',
    description: 'longDescription',
  }
  const key = map[head] ?? head
  return FIELD_TAB[kind][key] ? { kind: 'field', field: key } : null
}

/** Field → editor tab. Unknown keys are not fields of that entity. */
export const FIELD_TAB: Record<EntityKind, Record<string, 'content' | 'seo'>> = {
  'service-category': tabs(['title', 'slug', 'tag', 'shortDescription', 'themePreset', 'order', 'showInNav', 'heroImage', 'coverAlt', 'deliverables', 'tools']),
  service: tabs(['name', 'categoryId', 'slug', 'indexNumber', 'shortDescription', 'longDescription', 'order', 'featured', 'portfolioIds', 'heroImage', 'coverAlt', 'deliverables', 'technologies']),
  portfolio: tabs(['title', 'slug', 'category', 'client', 'year', 'summary', 'liveUrl', 'pointCount', 'accuracy', 'location', 'heroImage', 'coverAlt', 'challenge', 'approach', 'result', 'technologies', 'featured']),
}

function tabs(content: string[]): Record<string, 'content' | 'seo'> {
  const out: Record<string, 'content' | 'seo'> = {}
  for (const key of content) out[key] = 'content'
  for (const key of ['metaTitle', 'metaDescription', 'focusKeyphrase']) out[key] = 'seo'
  return out
}

/** DOM id of a field's control (one editor is open at a time). */
export function fieldDomId(field: string): string {
  return `entity-field-${field}`
}

/* -------------------------------- Lifecycle ------------------------------- */

export type LifecycleAction = {
  to: EditorialStatus
  label: string
  /** Needs `<entity>:publish` (going live or leaving the live state, archiving). */
  publisher: boolean
  primary: boolean
}

/** Status changes offered for the current status (Indonesian glossary from the review). */
export function lifecycleActions(status: EditorialStatus | null): LifecycleAction[] {
  switch (status) {
    case 'published':
      return [
        { to: 'draft', label: 'Tarik dari situs', publisher: true, primary: true },
        { to: 'archived', label: 'Arsipkan', publisher: true, primary: false },
      ]
    case 'archived':
      return [{ to: 'draft', label: 'Pulihkan ke draf', publisher: true, primary: true }]
    case 'in_review':
    case 'approved':
      return [
        { to: 'published', label: 'Terbitkan', publisher: true, primary: true },
        { to: 'draft', label: 'Kembalikan ke draf', publisher: false, primary: false },
        { to: 'archived', label: 'Arsipkan', publisher: true, primary: false },
      ]
    case 'draft':
    case null:
      return [
        { to: 'published', label: 'Terbitkan', publisher: true, primary: true },
        { to: 'in_review', label: 'Kirim ke review', publisher: false, primary: false },
        { to: 'archived', label: 'Arsipkan', publisher: true, primary: false },
      ]
  }
}

export const STATUS_SUCCESS: Record<EditorialStatus, string> = {
  published: 'Terbit. Halaman tampil di situs.',
  draft: 'Dijadikan draf. Halaman tidak tampil di situs.',
  in_review: 'Dikirim ke review.',
  approved: 'Disetujui.',
  archived: 'Diarsipkan. Halaman tidak tampil di situs.',
}

/* ------------------------------ Entity labels ----------------------------- */

export const ENTITY_LABEL: Record<EntityKind, { one: string; all: string; capability: 'service-category' | 'service' | 'portfolio' }> = {
  'service-category': { one: 'kategori layanan', all: 'Semua kategori', capability: 'service-category' },
  service: { one: 'layanan', all: 'Semua layanan', capability: 'service' },
  portfolio: { one: 'portofolio', all: 'Semua portofolio', capability: 'portfolio' },
}

export const API_PATH: Record<EntityKind, string> = {
  'service-category': '/api/service-categories',
  service: '/api/services',
  portfolio: '/api/portfolio',
}

/** Title shown in headers and lists. */
export function titleOf(form: EntityForm): string {
  return form.kind === 'service' ? form.name : form.title
}

/** Readable checklist text for a gate issue (the gate's own wording is kept for block issues). */
export function gateIssueText(kind: EntityKind, issue: string): string {
  const target = gateIssueTarget(kind, issue)
  if (target?.kind !== 'field') return issue
  const texts: Record<string, string> = {
    title: 'Isi judul, minimal 3 karakter.',
    name: 'Isi nama layanan, minimal 3 karakter.',
    slug: 'Perbaiki slug: huruf kecil, angka, dan tanda hubung saja.',
    metaTitle: 'Isi meta title, minimal 10 karakter.',
    metaDescription: 'Isi meta description, minimal 20 karakter.',
    coverAlt: 'Isi teks alternatif gambar sampul, minimal 3 karakter.',
  }
  return texts[target.field] ?? issue
}
