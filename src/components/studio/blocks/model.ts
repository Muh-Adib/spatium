/**
 * Pure helpers behind the Studio block editor: immutable path updates, issue
 * mapping from `validateBlockList` to blocks and fields, and display summaries.
 * No React here, so everything is unit-testable.
 */
import { BLOCK_CATEGORY_LABEL, getBlockEntry, newBlockId, type BlockCatalogEntry, type BlockField, type BlockIssue } from '@/lib/blocks/catalog'

export type EditorBlock = { id: string; type: string; [key: string]: unknown }
export type FieldPath = readonly (string | number)[]

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function pathKey(path: FieldPath): string {
  return path.join('.')
}

export function getAt(source: unknown, path: FieldPath): unknown {
  let cur: unknown = source
  for (const seg of path) {
    if (Array.isArray(cur) && typeof seg === 'number') cur = cur[seg]
    else if (isRecord(cur) && typeof seg === 'string') cur = cur[seg]
    else return undefined
  }
  return cur
}

/** True for values an optional field should drop instead of storing. */
function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === ''
}

/**
 * Immutable set. Setting an object key to `undefined` or `''` removes it, so
 * optional fields are not stored as empty strings; array slots are kept.
 */
export function setAt<T>(source: T, path: FieldPath, value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  if (typeof head === 'number') {
    const arr: unknown[] = Array.isArray(source) ? [...source] : []
    arr[head] = setAt(arr[head], rest, value)
    return arr as T
  }
  const obj: Record<string, unknown> = isRecord(source) ? { ...source } : {}
  const next = rest.length === 0 ? value : setAt(obj[head], rest, value)
  if (rest.length === 0 && isEmptyValue(next)) delete obj[head]
  else obj[head] = next
  return obj as T
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list]
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index)
}

/** Ensures every block has a unique string id (legacy rows may lack one). Returns the same array when nothing changed. */
export function ensureBlockIds(raw: readonly unknown[]): EditorBlock[] {
  const seen = new Set<string>()
  let changed = false
  const out = raw.map((item) => {
    const rec = isRecord(item) ? item : {}
    const type = typeof rec.type === 'string' ? rec.type : 'unknown'
    let id = typeof rec.id === 'string' && rec.id ? rec.id : ''
    if (!id || seen.has(id)) {
      id = newBlockId(type)
      changed = true
    }
    seen.add(id)
    if (!isRecord(item) || rec.type !== type) changed = true
    return { ...rec, id, type } as EditorBlock
  })
  return changed ? out : (raw as EditorBlock[])
}

/** Fresh copy of a block with new ids (used for duplicate). */
export function cloneBlock(block: EditorBlock): EditorBlock {
  return { ...structuredClone(block), id: newBlockId(block.type) }
}

// ─── Validation mapping ──────────────────────────────────────────────────────

export type BlockIssueGroup = {
  /** Messages that belong to the whole block (no field path, or a path no field renders). */
  general: string[]
  /** Field messages keyed by dotted path relative to the block (e.g. `steps.0.title`). */
  byPath: Map<string, string[]>
  count: number
}

const PATH_PREFIX = /^((?:[\w-]+\.)*[\w-]+): ([\s\S]+)$/

/** Splits a `validateBlockList` message into its field path (if any) and text. */
export function splitIssueMessage(message: string): { path: string | null; text: string } {
  const m = PATH_PREFIX.exec(message)
  return m ? { path: m[1], text: m[2] } : { path: null, text: message }
}

/** Plain-language Indonesian for the common Zod messages. */
export function humanizeIssue(text: string): string {
  if (/expected (string|number|array|object|boolean), received undefined/i.test(text)) return 'Wajib diisi.'
  const tooBig = /too big: expected (string|array) to have <=?(\d+)/i.exec(text)
  if (tooBig) return tooBig[1] === 'string' ? `Maksimal ${tooBig[2]} karakter.` : `Maksimal ${tooBig[2]} item.`
  const tooSmall = /too small: expected (string|array) to have >=?(\d+)/i.exec(text)
  if (tooSmall) return tooSmall[1] === 'string' ? `Minimal ${tooSmall[2]} karakter.` : `Minimal ${tooSmall[2]} item.`
  const wrongType = /expected (\w+), received (\w+)/i.exec(text)
  if (wrongType) return `Nilai harus berupa ${wrongType[1]}, bukan ${wrongType[2]}.`
  if (/^invalid input$/i.test(text.trim())) return 'Nilai tidak valid.'
  return text
}

/** Groups issues per block id; `-1`-index issues (list-level) go under the `''` key. */
export function groupIssuesByBlock(issues: readonly BlockIssue[], blocks: readonly EditorBlock[]): Map<string, BlockIssueGroup> {
  const out = new Map<string, BlockIssueGroup>()
  for (const issue of issues) {
    const id = issue.index >= 0 ? (blocks[issue.index]?.id ?? issue.blockId ?? '') : ''
    let group = out.get(id)
    if (!group) {
      group = { general: [], byPath: new Map(), count: 0 }
      out.set(id, group)
    }
    const { path, text } = splitIssueMessage(issue.message)
    const human = humanizeIssue(text)
    if (path) {
      const list = group.byPath.get(path) ?? []
      list.push(human)
      group.byPath.set(path, list)
    } else {
      group.general.push(human)
    }
    group.count += 1
  }
  return out
}

/** Every dotted path a catalogue form renders for `block` (so unmatched issues can be shown as general). */
export function renderedPaths(fields: readonly BlockField[], value: unknown, base: FieldPath = []): Set<string> {
  const out = new Set<string>()
  for (const f of fields) {
    const p = [...base, f.key]
    out.add(pathKey(p))
    if (f.kind === 'image') out.add(pathKey([...base, f.altKey]))
    if (f.kind === 'link') {
      out.add(pathKey([...p, 'label']))
      out.add(pathKey([...p, 'href']))
    }
    const items = getAt(value, p)
    if (Array.isArray(items)) {
      items.forEach((item, i) => {
        out.add(pathKey([...p, i]))
        if (f.kind === 'list') for (const sub of renderedPaths(f.fields, value, [...p, i])) out.add(sub)
        if (f.kind === 'table' && Array.isArray(item)) item.forEach((_, c) => out.add(pathKey([...p, i, c])))
      })
    }
  }
  return out
}

/** Issues for a block, with messages for paths the form does not render moved to `general`. */
export function issuesForForm(group: BlockIssueGroup | undefined, entry: BlockCatalogEntry | undefined, block: EditorBlock): BlockIssueGroup | undefined {
  if (!group || !entry) return group
  const known = renderedPaths(entry.fields, block)
  const general = [...group.general]
  const byPath = new Map<string, string[]>()
  for (const [path, msgs] of group.byPath) {
    if (known.has(path)) byPath.set(path, msgs)
    else for (const m of msgs) general.push(`${path}: ${m}`)
  }
  return { general, byPath, count: group.count }
}

/** Display string for issues of a block (manager compat & summaries). */
export function formatIssue(issue: BlockIssue, blocks: readonly EditorBlock[]): string {
  if (issue.index < 0) return issue.message
  const block = blocks[issue.index]
  const label = block ? (getBlockEntry(block.type)?.label ?? block.type) : 'Blok'
  const { path, text } = splitIssueMessage(issue.message)
  return `Blok ${issue.index + 1} (${label})${path ? ` · ${path}` : ''}: ${humanizeIssue(text)}`
}

// ─── Display ─────────────────────────────────────────────────────────────────

const SUMMARY_KEYS = ['headline', 'title', 'content', 'leadText', 'name', 'question', 'splatId', 'caption', 'body', 'text', 'description']

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Short human summary of a block's content for the outline row. */
export function blockSummary(block: EditorBlock): string {
  for (const key of SUMMARY_KEYS) {
    const v = block[key]
    if (typeof v === 'string' && v.trim()) {
      const plain = stripHtml(v)
      return plain.length > 90 ? `${plain.slice(0, 87).trimEnd()}…` : plain
    }
  }
  return ''
}

/** Top-level keys of `block` that the catalogue form does not render (shown in the JSON section). */
export function extraKeys(block: EditorBlock, entry: BlockCatalogEntry | undefined): string[] {
  const covered = entry ? coveredKeys(entry) : new Set(['id', 'type'])
  return Object.keys(block).filter((k) => !covered.has(k))
}

/** Every top-level key a catalogue entry's form writes (for schema-consistency tests). */
export function fieldKeys(fields: readonly BlockField[]): string[] {
  return fields.flatMap((f) => (f.kind === 'image' ? [f.key, f.altKey] : [f.key]))
}

/** Default value for a new list item / field. */
export function emptyValueFor(field: BlockField): unknown {
  switch (field.kind) {
    case 'boolean':
      return false
    case 'stringList':
    case 'list':
    case 'table':
      return []
    case 'link':
      return { label: '', href: '' }
    default:
      return ''
  }
}

/** A new, empty item for a `list` field: required text fields start empty so the user sees what to fill. */
export function newListItem(field: Extract<BlockField, { kind: 'list' }>): Record<string, unknown> {
  const item: Record<string, unknown> = {}
  for (const sub of field.fields) {
    if (sub.kind === 'stringList' || sub.kind === 'list' || sub.kind === 'table') continue
    if (sub.required) item[sub.key] = emptyValueFor(sub)
  }
  return item
}

export function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (isRecord(value)) return Object.values(value).every(isEmptyFieldValue)
  return false
}

// ─── Legacy aliases ──────────────────────────────────────────────────────────

/**
 * Older blocks stored the same content under alias keys (the schemas still
 * accept them). The form reads the canonical key first, then these aliases,
 * and writing the canonical key drops the aliases so there is one source.
 * Keyed by `type:path` where list indices are omitted (e.g. `internal-links:links.title`).
 */
const FIELD_ALIASES: Record<string, readonly string[]> = {
  'paragraph:content': ['text'],
  'heading2:content': ['text', 'title'],
  'heading3:content': ['text', 'title'],
  'hero-cinema:headline': ['title'],
  'hero-cinema:subheadline': ['subtitle', 'description'],
  'interactive-cta:title': ['headline'],
  'interactive-cta:description': ['subheadline'],
  'studio-cta:headline': ['title'],
  'text-editorial:leadText': ['lead'],
  'text-editorial:body': ['content'],
  'faq-accordion:items': ['faqs'],
  'feature-bento-grid:items': ['features'],
  'feature-bento-grid:items.description': ['desc'],
  'media-showcase:src': ['image', 'imageUrl', 'url', 'heroImage'],
  'media-showcase:alt': ['altText'],
  'internal-links:links.title': ['text', 'name'],
  'internal-links:links.href': ['url'],
  'deliverables-checklist:items.description': ['desc'],
  'workflow-phases:phases.title': ['name'],
  'workflow-phases:phases.description': ['desc'],
  'process-timeline:steps.number': ['step'],
  'hero-portfolio:title': ['headline'],
}

function aliasKey(type: string, path: FieldPath): string {
  return `${type}:${path.filter((p) => typeof p === 'string').join('.')}`
}

export function aliasesFor(type: string, path: FieldPath): readonly string[] {
  return FIELD_ALIASES[aliasKey(type, path)] ?? []
}

/** Field value with legacy alias fallback (see FIELD_ALIASES). */
export function readField(block: EditorBlock, path: FieldPath): unknown {
  const value = getAt(block, path)
  if (!isEmptyFieldValue(value)) return value
  const parent = path.slice(0, -1)
  for (const alias of aliasesFor(block.type, path)) {
    const v = getAt(block, [...parent, alias])
    if (!isEmptyFieldValue(v)) return v
  }
  return value
}

/** Writes a field and removes its legacy aliases at the same level. */
export function writeField(block: EditorBlock, path: FieldPath, value: unknown): EditorBlock {
  let next = setAt(block, path, value)
  const parent = path.slice(0, -1)
  for (const alias of aliasesFor(block.type, path)) {
    if (getAt(next, [...parent, alias]) !== undefined) next = setAt(next, [...parent, alias], undefined)
  }
  return next
}

/** Keys considered "covered" by the form, including aliases it reads from. */
export function coveredKeys(entry: BlockCatalogEntry): Set<string> {
  const out = new Set<string>(['id', 'type'])
  for (const f of entry.fields) {
    out.add(f.key)
    if (f.kind === 'image') out.add(f.altKey)
    for (const a of aliasesFor(entry.type, [f.key])) out.add(a)
    if (f.kind === 'image') for (const a of aliasesFor(entry.type, [f.altKey])) out.add(a)
  }
  return out
}

// ─── Catalogue-level required fields ─────────────────────────────────────────

function collectRequired(block: EditorBlock, fields: readonly BlockField[], base: FieldPath, out: BlockIssue[], index: number) {
  for (const f of fields) {
    const p = [...base, f.key]
    const value = readField(block, p)
    if (f.required && isEmptyFieldValue(value)) {
      out.push({ index, blockId: block.id, type: block.type, message: `${pathKey(p)}: ${f.label} wajib diisi.` })
    }
    if (f.kind === 'image' && !isEmptyFieldValue(value) && isEmptyFieldValue(readField(block, [...base, f.altKey]))) {
      out.push({ index, blockId: block.id, type: block.type, message: `${pathKey([...base, f.altKey])}: Teks alternatif wajib diisi bila gambar dipakai.` })
    }
    if (f.kind === 'list' && Array.isArray(value)) {
      value.forEach((_, i) => collectRequired(block, f.fields, [...p, i], out, index))
    }
  }
}

/**
 * Issues for catalogue fields marked `required` that are empty (the Zod
 * schemas accept many of them as optional for legacy data), plus images
 * without alt text. Legacy types without a catalogue entry yield none.
 */
export function catalogIssues(blocks: readonly EditorBlock[]): BlockIssue[] {
  const out: BlockIssue[] = []
  blocks.forEach((block, index) => {
    const entry = getBlockEntry(block.type)
    if (entry) collectRequired(block, entry.fields, [], out, index)
  })
  return out
}

// ─── Palette search ──────────────────────────────────────────────────────────

function normalizeText(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

/** Multi-word, accent-insensitive filter over label, type, description and category. */
export function filterBlocks(entries: readonly BlockCatalogEntry[], query: string): BlockCatalogEntry[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...entries]
  return entries.filter((e) => {
    const hay = normalizeText(`${e.label} ${e.type} ${e.description} ${BLOCK_CATEGORY_LABEL[e.category]}`)
    return words.every((w) => hay.includes(w))
  })
}
