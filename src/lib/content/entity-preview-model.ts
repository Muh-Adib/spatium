// -----------------------------------------------------------------------------
// Studio entity preview: payload, draft-message contract and page building.
//
// The preview route (`/admin/preview/<type>/<id>`) loads the stored row and
// the published context on the server (auth checked), then renders the same
// entity view as the public page in the browser. The Studio editor can post
// its UNSAVED state to the preview iframe (see `PreviewDraftMessage`); nothing
// is persisted. Pure and client-safe.
// -----------------------------------------------------------------------------
import { z } from 'zod'
import { resolveEntityBlocks, type StoredBlock } from '@/blocks/presets'
import { validateBlockListFor, type BlockIssue } from '@/lib/blocks/catalog'
import type { EntityTarget } from '@/lib/blocks/define'
import { MAX_BLOCKS_PER_PAGE } from '@/lib/blocks/primitives'
import {
  categoryEntity,
  portfolioEntity,
  serviceEntity,
  toProject,
  toServiceDetail,
  toUseCase,
  type CategoryRow,
  type PortfolioRow,
  type ServiceRow,
} from './entity-model'
import type { EntityContext, Project, Service } from './spatium-types'

/* ------------------------------- Payload --------------------------------- */

/** What the server hands the preview: the stored row (any status) plus the published context. */
export type PreviewPayload =
  | {
      kind: 'service-category'
      row: CategoryRow
      /** Published child services of this category. */
      children: ServiceRow[]
      /** Published use cases (the "other use cases" block lists them, minus this one). */
      useCases: Service[]
      projects: Project[]
      position: number
    }
  | {
      kind: 'service'
      row: ServiceRow
      /** Parent category row (any status); null when the service is not linked. */
      parentRow: CategoryRow | null
      /** Published services of the parent (siblings), excluding this one. */
      siblings: ServiceRow[]
      /** Published portfolios linked to this service. */
      linkedProjects: Project[]
    }
  | {
      kind: 'portfolio'
      row: PortfolioRow
      /** Published scenes (related work), in catalogue order. */
      published: Project[]
      index: number
    }

export const PREVIEW_KINDS = ['service-category', 'service', 'portfolio'] as const satisfies readonly EntityTarget[]

/* ---------------------------- Draft contract ------------------------------ */

/**
 * postMessage types between the Studio editor (parent window) and the preview
 * iframe. Same origin only. See docs/EDITORS.md "Pratinjau draf entitas".
 */
export const PREVIEW_MESSAGES = {
  /** iframe → parent once listening: `{ type, entity, id }`. */
  ready: 'spatium:preview:ready',
  /** parent → iframe: `PreviewDraftMessage`. */
  draft: 'spatium:preview:draft',
  /** iframe → parent after applying a draft: `{ type, entity, id, blockIssues, fieldIssues, blockCount }`. */
  applied: 'spatium:preview:applied',
  /** iframe → parent when a block is clicked in the embedded preview: `{ type, entity, id, blockId }`. */
  select: 'spatium:preview:select',
} as const

const text = z.string().max(20_000).nullable()
const jsonish = z
  .union([z.string().max(200_000), z.array(z.unknown()).max(500), z.record(z.string(), z.unknown())])
  .nullable()

/** Unsaved field values, named like the Studio save body (`POST /api/<entity>`). */
export const DRAFT_FIELD_SCHEMAS = {
  'service-category': z.strictObject({
    title: z.string().max(300),
    tag: text,
    shortDescription: text,
    heroImage: text,
    themePreset: text,
    keyOutcomes: jsonish,
    order: z.number().int().nullable(),
    metaTitle: text,
    metaDescription: text,
    seoData: jsonish,
  }).partial(),
  service: z.strictObject({
    name: z.string().max(300),
    indexNumber: text,
    shortDescription: text,
    longDescription: text,
    description: text,
    heroImage: text,
    deliverables: jsonish,
    technologies: jsonish,
    metaTitle: text,
    metaDescription: text,
    seoData: jsonish,
  }).partial(),
  portfolio: z.strictObject({
    title: z.string().max(300),
    client: text,
    year: z.union([z.number().int(), z.string().max(10)]).nullable(),
    category: text,
    summary: text,
    challenge: text,
    approach: text,
    result: text,
    heroImage: text,
    liveUrl: text,
    metrics: jsonish,
    technologies: jsonish,
  }).partial(),
} as const

export const previewDraftMessageSchema = z.object({
  type: z.literal(PREVIEW_MESSAGES.draft),
  entity: z.enum(PREVIEW_KINDS),
  /** Optional: the id shown in the preview URL; a mismatch is ignored by the iframe. */
  id: z.union([z.number(), z.string()]).optional(),
  /** The editor's full block list. Omit to keep the stored blocks; `[]` previews the preset. */
  blocks: z.array(z.unknown()).max(MAX_BLOCKS_PER_PAGE).optional(),
  /** Unsaved entity fields (see DRAFT_FIELD_SCHEMAS). */
  fields: z.record(z.string(), z.unknown()).optional(),
  /** Block selected in the editor: highlighted and scrolled into view (`null` clears). */
  selectedBlockId: z.string().max(200).nullable().optional(),
})

export type PreviewDraftMessage = z.infer<typeof previewDraftMessageSchema>

export type PreviewDraft = { blocks?: unknown[]; fields?: Record<string, unknown> }

/** iframe → parent: a block was clicked in the embedded preview. */
export const previewSelectMessageSchema = z.object({
  type: z.literal(PREVIEW_MESSAGES.select),
  entity: z.enum(PREVIEW_KINDS),
  id: z.union([z.number(), z.string()]),
  blockId: z.string().min(1).max(200),
})

/** iframe → parent: what the preview rendered for the last draft. */
export const previewAppliedMessageSchema = z.object({
  type: z.literal(PREVIEW_MESSAGES.applied),
  entity: z.enum(PREVIEW_KINDS),
  id: z.union([z.number(), z.string()]),
  blockIssues: z.array(z.object({ index: z.number(), blockId: z.string().optional(), type: z.string().optional(), message: z.string() })),
  fieldIssues: z.array(z.object({ field: z.string(), message: z.string() })),
  blockCount: z.number(),
})

export type FieldIssue = { field: string; message: string }

/* ----------------------------- Page building ------------------------------ */

const asColumn = (value: unknown): string | null =>
  value === null || value === undefined || value === '' ? null : typeof value === 'string' ? value : JSON.stringify(value)

/** Validates draft fields and patches them onto the stored row (unknown fields → issues, ignored). */
function patchRow<R extends Record<string, unknown>>(
  kind: EntityTarget,
  row: R,
  fields: Record<string, unknown> | undefined,
): { row: R; issues: FieldIssue[] } {
  if (!fields) return { row, issues: [] }
  const parsed = DRAFT_FIELD_SCHEMAS[kind].safeParse(fields)
  if (!parsed.success) {
    return { row, issues: parsed.error.issues.map((i) => ({ field: i.path.map(String).join('.') || '(root)', message: i.message })) }
  }
  const next: Record<string, unknown> = { ...row }
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue
    if (key === 'order') next.order = value
    else if (key === 'year') next.year = value === null || value === '' ? null : Number(value) || null
    else if (key === 'title' || key === 'name') next[key] = value
    else next[key] = asColumn(value)
  }
  return { row: next as R, issues: [] }
}

/** Keeps the draft blocks that validate for the target; the others are reported and skipped. */
function draftBlocks(target: EntityTarget, blocks: readonly unknown[]): { blocks: StoredBlock[]; issues: BlockIssue[] } {
  const check = validateBlockListFor(target, blocks)
  if (check.ok) return { blocks: check.blocks as StoredBlock[], issues: [] }
  const bad = new Set(check.issues.map((i) => i.index))
  const kept = blocks.filter(
    (b, i): b is StoredBlock => !bad.has(i) && b !== null && typeof b === 'object' && typeof (b as StoredBlock).type === 'string',
  )
  return { blocks: kept, issues: check.issues }
}

const UNLINKED_PARENT: Service = {
  slug: '',
  index: '00',
  name: 'Belum ada kategori',
  shortName: 'Belum ada kategori',
  tagline: '',
  summary: '',
  metaTitle: '',
  metaDescription: '',
  intro: [],
  capabilities: [],
  deliverables: [],
  tools: [],
  visual: 'marketing',
  imageAlt: '',
  faqs: [],
  related: [],
  extraBlocks: [],
  blocks: [],
}

export type PreviewPage = {
  entity: EntityContext
  blocks: StoredBlock[]
  blockIssues: BlockIssue[]
  fieldIssues: FieldIssue[]
}

/** The page the preview renders: stored row (+ draft fields) → entity, stored or draft blocks → resolved blocks. */
export function buildPreviewPage(payload: PreviewPayload, draft?: PreviewDraft | null): PreviewPage {
  const target: EntityTarget = payload.kind
  const fromDraft = draft?.blocks ? draftBlocks(target, draft.blocks) : null

  switch (payload.kind) {
    case 'service-category': {
      const { row, issues } = patchRow(target, payload.row, draft?.fields)
      const category = toUseCase(row, payload.children, payload.position)
      const others = payload.useCases.filter((u) => u.slug !== payload.row.slug)
      return {
        entity: categoryEntity(category, payload.projects, [category, ...others]),
        blocks: resolveEntityBlocks(target, fromDraft ? fromDraft.blocks : category.blocks),
        blockIssues: fromDraft?.issues ?? [],
        fieldIssues: issues,
      }
    }
    case 'service': {
      const { row, issues } = patchRow(target, payload.row, draft?.fields)
      const parent = payload.parentRow ? toUseCase(payload.parentRow, payload.siblings, 0) : UNLINKED_PARENT
      const detail = toServiceDetail(row, parent, 0)
      return {
        entity: serviceEntity(detail, parent, payload.linkedProjects),
        blocks: resolveEntityBlocks(target, fromDraft ? fromDraft.blocks : detail.blocks),
        blockIssues: fromDraft?.issues ?? [],
        fieldIssues: issues,
      }
    }
    case 'portfolio': {
      const { row, issues } = patchRow(target, payload.row, draft?.fields)
      const project = toProject(row, payload.index)
      return {
        entity: portfolioEntity(project, payload.published),
        blocks: resolveEntityBlocks(target, fromDraft ? fromDraft.blocks : project.blocks),
        blockIssues: fromDraft?.issues ?? [],
        fieldIssues: issues,
      }
    }
  }
}
