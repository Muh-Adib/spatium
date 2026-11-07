import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'
import { buildPreset, hasDataBoundBlocks, resolveEntityBlocks, type StoredBlock } from '@/blocks/presets'
import { serviceCategoryMutationSchema } from '@/lib/validation/api-schemas'
import { slugify } from '@/lib/pages/page-schema'
import { SERVICE_VISUALS } from '@/lib/content/spatium-types'
import {
  DRAFT_ONLY_HINT,
  EDITABLE_STATUSES,
  DraftError,
  blockList,
  checkBlocksFor,
  defineTool,
  expectedUpdatedAtField,
  fail,
  fromDraftError,
  imageUrlField,
  mediaIdField,
  ok,
  readOnly,
  resolveImage,
  siteUrl,
  write,
  type McpTool,
  type ToolResult,
} from '../tool-kit'
import { asArray, asRecord, assertEditable, parseJson, recordHistory } from './history'

/**
 * MCP tools for service categories (use cases at /services/<slug>). Same
 * rules as the other draft tools: drafts only, strict inputs, no status
 * fields, expectedUpdatedAt on every edit, one transaction per write with
 * ContentRevision + SeoAuditLog (entity type `service_category`, like the
 * Studio). Scopes: `services:read` / `services:draft`.
 */

const CATEGORY_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type CategoryRow = NonNullable<Awaited<ReturnType<typeof prisma.orm.public.ServiceCategory.first>>>
type Outcome = { label: string; value: string; detail?: string | null }

export function categoryUrls(row: { id: number; slug: string; status: string | null }) {
  return {
    editUrl: `${siteUrl()}/admin?tab=services&category=${encodeURIComponent(row.slug)}`,
    previewUrl: `${siteUrl()}/admin/preview/service-category/${row.id}`,
    publicUrl: (row.status ?? 'published') === 'published' ? `${siteUrl()}/services/${row.slug}` : null,
  }
}

function blocksOf(row: CategoryRow): StoredBlock[] {
  return asArray(parseJson(row.blocks, `service_categories.blocks#${row.slug}`)).filter(
    (b): b is StoredBlock => b !== null && typeof b === 'object' && typeof (b as StoredBlock).type === 'string',
  )
}

function outcomesOf(row: Pick<CategoryRow, 'keyOutcomes' | 'slug'>): Outcome[] {
  return asArray(parseJson(row.keyOutcomes, `service_categories.key_outcomes#${row.slug}`)).flatMap((o) => {
    const rec = asRecord(o)
    return typeof rec.label === 'string' && typeof rec.value === 'string'
      ? [{ label: rec.label, value: rec.value, detail: typeof rec.detail === 'string' ? rec.detail : null }]
      : []
  })
}

function coverAltOf(row: CategoryRow): string | null {
  const seo = asRecord(parseJson(row.seoData, `service_categories.seo_data#${row.slug}`))
  return typeof seo.coverAlt === 'string' && seo.coverAlt ? seo.coverAlt : null
}

export function categoryGate(row: CategoryRow) {
  const gate = validateCatalogPublication({
    title: row.title,
    slug: row.slug,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    heroImage: row.heroImage ?? undefined,
    heroImageAlt: coverAltOf(row) ?? undefined,
    blocks: blocksOf(row),
    target: 'service-category',
  })
  return { ready: gate.canPublish, issues: gate.issues, warnings: gate.warnings, note: 'Only a human editor can publish, from the Studio (editUrl).' }
}

/** How the stored list renders: `preset` (none stored), `legacy` (folded into the preset) or `explicit`. */
function blocksMode(blocks: readonly StoredBlock[]): 'preset' | 'legacy' | 'explicit' {
  if (blocks.length === 0) return 'preset'
  return hasDataBoundBlocks(blocks) ? 'explicit' : 'legacy'
}

async function childrenOf(categoryId: number) {
  const rows = await prisma.orm.public.Service.where({ categoryId }).orderBy((s) => s.order.asc()).all()
  return rows.map((s) => ({ id: s.id, slug: s.slug, name: s.name, status: s.status }))
}

async function categoryView(row: CategoryRow, options: { includeBlocks: boolean }) {
  const status = row.status
  const blocks = blocksOf(row)
  const outcomes = outcomesOf(row)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status,
    editable: EDITABLE_STATUSES.includes(status),
    tag: row.tag,
    shortDescription: row.shortDescription,
    heroImage: row.heroImage,
    heroImageAlt: coverAltOf(row),
    visual: row.themePreset,
    deliverables: outcomes.filter((o) => o.label === 'deliverable').map((o) => o.value),
    tools: outcomes.filter((o) => o.label === 'tool').map((o) => o.value),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    focusKeyphrase: row.focusKeyphrase,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...categoryUrls(row),
    services: await childrenOf(row.id),
    blockCount: blocks.length,
    blocksMode: blocksMode(blocks),
    ...(options.includeBlocks
      ? {
          blocks,
          // What the page renders. Edit from this list: storing it keeps the page identical.
          resolvedBlocks: resolveEntityBlocks('service-category', blocks),
        }
      : { outline: blocks.map((b, index) => ({ index, id: b.id ?? null, type: b.type })) }),
    publication: categoryGate(row),
  }
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

const shape = serviceCategoryMutationSchema.shape
const categoryId = z.number().int().positive().describe('Service category id (from list_service_categories or create_service_category_draft).')
const textList = (what: string) => z.array(z.string().trim().min(1).max(200)).max(30).optional().describe(what)

const categoryFields = {
  tag: z.string().trim().max(200).nullable().optional().describe('Short tagline shown as a pill in the hero.'),
  shortDescription: shape.shortDescription.describe('Summary (hero lede; intro when no paragraphs are set).'),
  heroImageAlt: z.string().trim().max(300).nullable().optional().describe('Alt text for the cover image. Required before publishing when a cover is set.'),
  heroMediaId: mediaIdField.optional(),
  visual: z.enum(SERVICE_VISUALS).optional().describe('Interactive illustration of the intro block.'),
  deliverables: textList('What the client receives (listed in the deliverables block). Replaces the list.'),
  tools: textList('Capture/processing tools (hero pills and intro). Replaces the list.'),
  metaTitle: z.string().trim().max(300).nullable().optional().describe('SEO title, 10–70 characters.'),
  metaDescription: z.string().trim().max(500).nullable().optional().describe('SEO description, 20–165 characters.'),
  focusKeyphrase: z.string().trim().max(200).nullable().optional(),
}

const createInput = z.strictObject({
  title: shape.title.describe('Use-case title, e.g. "Filmmaking & VFX".'),
  slug: z.string().optional().describe('URL slug at /services/<slug>. Omit to derive from the title. Fixed after creation.'),
  heroImage: imageUrlField.optional().describe('Cover image: site path (Media library) or https URL. Never invent image URLs.'),
  ...categoryFields,
  blocks: blockList
    .optional()
    .describe('Page blocks (target "service-category"). Omit to start from the preset (get_block_preset).'),
})

const updateInput = z.strictObject({
  id: categoryId,
  expectedUpdatedAt: expectedUpdatedAtField,
  title: shape.title.optional(),
  heroImage: imageUrlField.nullable().optional().describe('New cover image; null removes it.'),
  ...categoryFields,
  blocks: blockList.optional().describe('Replaces the entire block list. [] reverts the page to the preset.'),
})

type Values = Record<string, unknown>

async function toValues(
  args: z.output<typeof createInput> | z.output<typeof updateInput>,
  previous: CategoryRow | null,
): Promise<{ ok: true; values: Values } | { ok: false; result: ToolResult }> {
  const values: Values = {}
  if (args.title !== undefined) values.title = args.title
  for (const key of ['tag', 'shortDescription', 'metaTitle', 'metaDescription', 'focusKeyphrase'] as const) {
    const value = args[key]
    if (value !== undefined) values[key] = value === null || value === '' ? null : value
  }
  if (args.visual !== undefined) values.themePreset = args.visual

  if (args.deliverables !== undefined || args.tools !== undefined) {
    // Rebuild key outcomes: replace the lists sent, keep every other label (e.g. imageAlt).
    const kept = previous ? outcomesOf(previous) : []
    const next: Outcome[] = kept.filter(
      (o) => !(o.label === 'deliverable' && args.deliverables !== undefined) && !(o.label === 'tool' && args.tools !== undefined),
    )
    for (const value of args.deliverables ?? []) next.push({ label: 'deliverable', value })
    for (const value of args.tools ?? []) next.push({ label: 'tool', value })
    values.keyOutcomes = next.length ? JSON.stringify(next) : null
  }

  if (args.blocks !== undefined) {
    if (args.blocks.length === 0) values.blocks = previous ? null : JSON.stringify(buildPreset('service-category', { ids: 'fresh' }))
    else {
      const check = checkBlocksFor('service-category', args.blocks)
      if (!check.ok) return check
      values.blocks = JSON.stringify(check.blocks)
    }
  } else if (!previous) {
    values.blocks = JSON.stringify(buildPreset('service-category', { ids: 'fresh' }))
  }

  const seo = previous ? asRecord(parseJson(previous.seoData, `service_categories.seo_data#${previous.slug}`)) : {}
  let seoChanged = false
  if (args.heroImage !== undefined || args.heroMediaId !== undefined) {
    const hero = await resolveImage({ url: args.heroImage, mediaId: args.heroMediaId, alt: args.heroImageAlt })
    if (!hero.ok) return hero
    values.heroImage = hero.url
    Object.assign(seo, { coverAlt: hero.alt ?? '' })
    seoChanged = true
  } else if (args.heroImageAlt !== undefined) {
    Object.assign(seo, { coverAlt: args.heroImageAlt ?? '' })
    seoChanged = true
  }
  if (seoChanged) values.seoData = JSON.stringify(seo)
  return { ok: true, values }
}

// ─── Repository ───────────────────────────────────────────────────────────────

async function createCategoryDraft(slug: string, values: Values, actor: string): Promise<CategoryRow> {
  return prisma.transaction(async (tx) => {
    const clash = await tx.orm.public.ServiceCategory.where({ slug }).first()
    if (clash) throw new DraftError('slug_taken', `Slug "${slug}" is already used by another service category.`)
    const last = await tx.orm.public.ServiceCategory.orderBy((c) => c.order.desc()).first()
    const created = await tx.orm.public.ServiceCategory.create({
      ...values,
      title: String(values.title),
      slug,
      order: (last?.order ?? 0) + 1,
      // Hidden from the header menu until a human publishes it and decides.
      showInNav: false,
      status: 'draft',
    })
    await recordHistory(tx, 'service_category', created, actor, 'create')
    return created
  })
}

async function updateCategoryDraft(id: number, values: Values, expectedUpdatedAt: string, actor: string): Promise<CategoryRow> {
  return prisma.transaction(async (tx) => {
    const current = await tx.orm.public.ServiceCategory.where({ id }).forUpdate().first()
    assertEditable(`Service category ${id}`, current, expectedUpdatedAt)
    await tx.orm.public.ServiceCategory.where({ id }).update(values)
    const row = await tx.orm.public.ServiceCategory.where({ id }).first()
    if (!row) throw new DraftError('not_found', `Service category ${id} not found.`)
    await recordHistory(tx, 'service_category', current, actor, 'update', { fields: Object.keys(values) })
    return row
  })
}

function draftFailure(err: unknown, editUrl?: string): ToolResult {
  if (!(err instanceof DraftError)) throw err
  const withUrl = editUrl ? new DraftError(err.code, err.message, { ...err.details, editUrl }) : err
  return fromDraftError(withUrl, 'service_category', {
    not_found: 'Call list_service_categories to find a valid id.',
    conflict: 'The category changed since you read it. Call get_service_category again and retry with the new updatedAt as expectedUpdatedAt.',
    forbidden: `${DRAFT_ONLY_HINT} Ask a human editor to move it back to draft, or create a new draft with create_service_category_draft.`,
  })
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export const SERVICE_CATEGORY_TOOLS: readonly McpTool[] = [
  defineTool({
    name: 'list_service_categories',
    title: 'List service categories',
    scope: 'services:read',
    description:
      'Lists service categories (use cases at /services/<slug>): id, slug, title, status, updatedAt, serviceCount, editUrl, previewUrl and publicUrl. Filter by status.',
    input: z.strictObject({ status: z.enum(CATEGORY_STATUSES).optional().describe('Only categories with this status.') }),
    annotations: readOnly,
    run: async ({ status }) => {
      const [rows, services] = await Promise.all([
        (status ? prisma.orm.public.ServiceCategory.where({ status }) : prisma.orm.public.ServiceCategory).orderBy((c) => c.order.asc()).all(),
        prisma.orm.public.Service.all(),
      ])
      const categories = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        updatedAt: r.updatedAt,
        serviceCount: services.filter((s) => s.categoryId === r.id).length,
        ...categoryUrls(r),
      }))
      return ok({ count: categories.length, categories })
    },
  }),

  defineTool({
    name: 'get_service_category',
    title: 'Get service category',
    scope: 'services:read',
    description:
      'Returns one service category by id or slug: fields, its services, stored blocks, resolvedBlocks (what the page renders; edit from these), ' +
      'blocksMode (preset | legacy | explicit), updatedAt (pass it back as expectedUpdatedAt), editable and publication issues.',
    input: z.strictObject({ id: categoryId.optional(), slug: z.string().optional().describe('Slug, used when id is omitted.') }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const row =
        id !== undefined
          ? await prisma.orm.public.ServiceCategory.where({ id }).first()
          : await prisma.orm.public.ServiceCategory.where({ slug: slugify(slug ?? '') }).first()
      if (!row) return fail('Service category not found.', { hint: 'Call list_service_categories to see existing categories.' })
      return ok(await categoryView(row, { includeBlocks: true }))
    },
  }),

  defineTool({
    name: 'create_service_category_draft',
    title: 'Create service category draft',
    scope: 'services:draft',
    description:
      'Creates a new DRAFT service category (use case). Without blocks the page starts from the preset (hero, intro, capabilities, deliverables, FAQ, ' +
      'related work, other use cases, CTA) that renders the category data. Use only facts the user gave you. Hidden from the menu; never publishes.',
    input: createInput,
    annotations: write,
    run: async (args, ctx) => {
      const slug = slugify(args.slug ?? args.title)
      if (slug.length < 2 || !SLUG_PATTERN.test(slug)) return fail('Could not derive a valid slug. Pass slug explicitly (e.g. "heritage-preservation").')
      const mapped = await toValues(args, null)
      if (!mapped.ok) return mapped.result
      try {
        const row = await createCategoryDraft(slug, mapped.values, ctx.actor)
        return ok({ created: true, category: await categoryView(row, { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err)
      }
    },
  }),

  defineTool({
    name: 'update_service_category_draft',
    title: 'Update service category draft',
    scope: 'services:draft',
    description:
      'Patches a draft (or in_review) service category; omitted fields stay unchanged, null clears a field. blocks replaces the whole list ' +
      '(start from resolvedBlocks of get_service_category). Requires expectedUpdatedAt. The slug cannot change through MCP. Refused for approved, published or archived categories.',
    input: updateInput,
    annotations: write,
    run: async (args, ctx) => {
      const current = await prisma.orm.public.ServiceCategory.where({ id: args.id }).first()
      if (!current) return fail(`Service category ${args.id} not found.`, { hint: 'Call list_service_categories to find a valid id.' })
      const mapped = await toValues(args, current)
      if (!mapped.ok) return mapped.result
      if (Object.keys(mapped.values).length === 0) return fail('Nothing to update: pass at least one field to change.')
      try {
        const row = await updateCategoryDraft(args.id, mapped.values, args.expectedUpdatedAt, ctx.actor)
        return ok({ updated: true, category: await categoryView(row, { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err, categoryUrls(current).editUrl)
      }
    },
  }),
]
