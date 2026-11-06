import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'
import { serviceMutationSchema } from '@/lib/validation/api-schemas'
import { slugify } from '@/lib/pages/page-schema'
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
  ok,
  readOnly,
  siteUrl,
  write,
  type McpTool,
  type ToolResult,
} from '../tool-kit'
import { asArray, asRecord, assertEditable, parseJson, recordHistory } from './history'

/**
 * MCP tools for services (the capabilities listed under a published use case
 * at /services/<category>). Studio saves services inline in /api/services, so
 * the draft repository lives here: one transaction per write with
 * ContentRevision + SeoAuditLog. Gate: the Studio catalogue gate
 * (`validateCatalogPublication`). Service categories (use cases) are read-only.
 */

const SERVICE_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type ServiceRow = NonNullable<Awaited<ReturnType<typeof prisma.orm.public.Service.first>>>

export function serviceUrls(row: { slug: string; status: string | null }) {
  return {
    editUrl: `${siteUrl()}/admin?tab=services&slug=${encodeURIComponent(row.slug)}`,
    // Capability URLs redirect to their parent use-case page.
    publicUrl: (row.status ?? 'published') === 'published' ? `${siteUrl()}/services/${row.slug}` : null,
  }
}

function blocksOf(row: ServiceRow): unknown[] {
  return asArray(parseJson(row.blocks, `services.blocks#${row.slug}`))
}

export function serviceGate(row: ServiceRow) {
  const gate = validateCatalogPublication({
    title: row.name,
    slug: row.slug,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    blocks: blocksOf(row),
  })
  const warnings = [...gate.warnings]
  if (row.categoryId === null) warnings.push('Not linked to a service category: it will not appear on any use-case page.')
  return { ready: gate.canPublish, issues: gate.issues, warnings, note: 'Only a human editor can publish, from the Studio (editUrl).' }
}

async function categoryMap(): Promise<Map<number, { slug: string; title: string; status: string }>> {
  const rows = await prisma.orm.public.ServiceCategory.orderBy((c) => c.order.asc()).all()
  return new Map(rows.map((c) => [c.id, { slug: c.slug, title: c.title, status: c.status }]))
}

function serviceView(row: ServiceRow, categories: Map<number, { slug: string; title: string; status: string }>, options: { includeBlocks: boolean }) {
  const status = row.status
  const blocks = blocksOf(row)
  const category = row.categoryId !== null ? categories.get(row.categoryId) : undefined
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status,
    editable: EDITABLE_STATUSES.includes(status),
    category: category ? { slug: category.slug, title: category.title } : null,
    shortDescription: row.shortDescription,
    longDescription: row.longDescription,
    highlightWord: row.highlightWord,
    order: row.order,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    focusKeyphrase: row.focusKeyphrase,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...serviceUrls(row),
    blockCount: blocks.length,
    ...(options.includeBlocks
      ? { blocks }
      : { outline: blocks.map((b, index) => ({ index, id: asRecord(b).id ?? null, type: asRecord(b).type ?? null })) }),
    publication: serviceGate(row),
  }
}

// ─── Inputs (field limits reuse the Studio service schema) ────────────────────

const shape = serviceMutationSchema.shape
const serviceId = z.number().int().positive().describe('Service id (from list_services, get_service or create_service_draft).')

const serviceFields = {
  category: z.string().trim().min(1).max(200).nullable().optional().describe('Slug of an existing service category / use case (see list_services). null unlinks.'),
  shortDescription: shape.shortDescription.describe('One or two sentences, shown on the use-case page.'),
  longDescription: z.string().max(20_000).nullable().optional().describe('Longer plain-text description.'),
  highlightWord: z.string().trim().max(100).nullable().optional().describe('Word of the name to highlight in the hero.'),
  metaTitle: z.string().trim().max(300).nullable().optional().describe('SEO title, 10–70 characters.'),
  metaDescription: z.string().trim().max(500).nullable().optional().describe('SEO description, 20–165 characters.'),
  focusKeyphrase: z.string().trim().max(200).nullable().optional(),
}

const createInput = z.strictObject({
  name: shape.name.describe('Service name.'),
  slug: z.string().optional().describe('URL slug. Omit to derive from the name. Fixed after creation.'),
  ...serviceFields,
  blocks: blockList.default([]).describe('Optional catalogue blocks (target "service").'),
})

const updateInput = z.strictObject({
  id: serviceId,
  expectedUpdatedAt: expectedUpdatedAtField,
  name: shape.name.optional(),
  ...serviceFields,
  blocks: blockList.optional().describe('Replaces the entire block list when provided.'),
})

type Values = Record<string, unknown>

async function toValues(
  args: z.output<typeof createInput> | z.output<typeof updateInput>,
  previous: { shortDescription: string | null; longDescription: string | null } | null,
): Promise<{ ok: true; values: Values } | { ok: false; result: ToolResult }> {
  const values: Values = {}
  if (args.name !== undefined) values.name = args.name
  for (const key of ['shortDescription', 'longDescription', 'highlightWord', 'metaTitle', 'metaDescription', 'focusKeyphrase'] as const) {
    const value = args[key]
    if (value !== undefined) values[key] = value === null || value === '' ? null : value
  }
  if (args.shortDescription !== undefined || args.longDescription !== undefined) {
    // Same derivation as the Studio: description = long || short.
    const long = args.longDescription !== undefined ? args.longDescription : previous?.longDescription
    const short = args.shortDescription !== undefined ? args.shortDescription : previous?.shortDescription
    values.description = long || short || null
  }
  if (args.category !== undefined) {
    if (args.category === null) values.categoryId = null
    else {
      const category = await prisma.orm.public.ServiceCategory.where({ slug: slugify(args.category) }).first()
      if (!category) {
        const available = [...(await categoryMap()).values()].map((c) => ({ slug: c.slug, title: c.title }))
        return {
          ok: false,
          result: fail(`Unknown service category "${args.category}". Nothing was saved.`, {
            available,
            hint: 'Use the slug of an existing category (list_services), or omit category. Categories are managed by a human in the Studio.',
          }),
        }
      }
      values.categoryId = category.id
    }
  }
  if (args.blocks !== undefined) {
    const check = checkBlocksFor('service', args.blocks)
    if (!check.ok) return check
    values.blocks = check.blocks.length ? JSON.stringify(check.blocks) : null
  }
  return { ok: true, values }
}

// ─── Repository ───────────────────────────────────────────────────────────────

async function createServiceDraft(slug: string, values: Values, actor: string): Promise<ServiceRow> {
  return prisma.transaction(async (tx) => {
    const clash = await tx.orm.public.Service.where({ slug }).first()
    if (clash) throw new DraftError('slug_taken', `Slug "${slug}" is already used by another service.`)
    const last = await tx.orm.public.Service.orderBy((s) => s.order.desc()).first()
    const created = await tx.orm.public.Service.create({
      ...values,
      name: String(values.name),
      slug,
      documentId: `svc-${slug}`,
      order: (last?.order ?? 0) + 1,
      featured: false,
      status: 'draft',
    })
    await recordHistory(tx, 'service', created, actor, 'create')
    return created
  })
}

async function updateServiceDraft(id: number, values: Values, expectedUpdatedAt: string, actor: string): Promise<ServiceRow> {
  return prisma.transaction(async (tx) => {
    const current = await tx.orm.public.Service.where({ id }).forUpdate().first()
    assertEditable(`Service ${id}`, current, expectedUpdatedAt)
    await tx.orm.public.Service.where({ id }).update(values)
    const row = await tx.orm.public.Service.where({ id }).first()
    if (!row) throw new DraftError('not_found', `Service ${id} not found.`)
    await recordHistory(tx, 'service', current, actor, 'update', { fields: Object.keys(values) })
    return row
  })
}

function draftFailure(err: unknown, editUrl?: string): ToolResult {
  if (!(err instanceof DraftError)) throw err
  const withUrl = editUrl ? new DraftError(err.code, err.message, { ...err.details, editUrl }) : err
  return fromDraftError(withUrl, 'service', {
    forbidden: `${DRAFT_ONLY_HINT} Ask a human editor to move it back to draft, or create a new draft with create_service_draft.`,
  })
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export const SERVICE_TOOLS: readonly McpTool[] = [
  defineTool({
    name: 'list_services',
    title: 'List services',
    scope: 'services:read',
    description:
      'Lists services (capabilities) with id, slug, name, status, category, updatedAt, editUrl and publicUrl, plus the existing service categories ' +
      '(use cases) a service can be linked to. Filter by status or category slug.',
    input: z.strictObject({
      status: z.enum(SERVICE_STATUSES).optional().describe('Only services with this status.'),
      category: z.string().trim().min(1).optional().describe('Only services in this category (slug).'),
    }),
    annotations: readOnly,
    run: async ({ status, category }) => {
      const categories = await categoryMap()
      const rows = await (status ? prisma.orm.public.Service.where({ status }) : prisma.orm.public.Service).orderBy((s) => s.order.asc()).all()
      const services = rows
        .map((r) => ({ row: r, category: r.categoryId !== null ? categories.get(r.categoryId) : undefined }))
        .filter(({ category: c }) => !category || c?.slug === category)
        .map(({ row, category: c }) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          status: row.status,
          category: c?.slug ?? null,
          updatedAt: row.updatedAt,
          ...serviceUrls(row),
        }))
      return ok({
        count: services.length,
        services,
        categories: [...categories.values()].map((c) => ({ slug: c.slug, title: c.title, status: c.status })),
      })
    },
  }),

  defineTool({
    name: 'get_service',
    title: 'Get service',
    scope: 'services:read',
    description:
      'Returns one service by id or slug with all fields and blocks, updatedAt (pass it back as expectedUpdatedAt), editable, ' +
      'and publication: what a human must still fix before publishing.',
    input: z.strictObject({ id: serviceId.optional(), slug: z.string().optional().describe('Slug, used when id is omitted.') }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const row = id !== undefined ? await prisma.orm.public.Service.where({ id }).first() : await prisma.orm.public.Service.where({ slug: slugify(slug ?? '') }).first()
      if (!row) return fail('Service not found.', { hint: 'Call list_services to see existing services.' })
      return ok(serviceView(row, await categoryMap(), { includeBlocks: true }))
    },
  }),

  defineTool({
    name: 'create_service_draft',
    title: 'Create service draft',
    scope: 'services:draft',
    description:
      'Creates a new DRAFT service, optionally linked to an existing service category (use case). Use only facts the user gave you. ' +
      'Returns the service (updatedAt for further edits), editUrl and the publication checklist. Never publishes.',
    input: createInput,
    annotations: write,
    run: async (args, ctx) => {
      const slug = slugify(args.slug ?? args.name)
      if (slug.length < 2 || !SLUG_PATTERN.test(slug)) return fail('Could not derive a valid slug. Pass slug explicitly (e.g. "scan-lidar-interior").')
      const mapped = await toValues(args, null)
      if (!mapped.ok) return mapped.result
      try {
        const row = await createServiceDraft(slug, mapped.values, ctx.actor)
        return ok({ created: true, service: serviceView(row, await categoryMap(), { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err)
      }
    },
  }),

  defineTool({
    name: 'update_service_draft',
    title: 'Update service draft',
    scope: 'services:draft',
    description:
      'Patches a draft (or in_review) service; omitted fields stay unchanged, null clears a field. blocks replaces the whole list. ' +
      'Requires expectedUpdatedAt from get_service. The slug cannot change through MCP. Refused for approved, published or archived services.',
    input: updateInput,
    annotations: write,
    run: async (args, ctx) => {
      const current = await prisma.orm.public.Service.where({ id: args.id }).first()
      if (!current) return fail(`Service ${args.id} not found.`, { hint: 'Call list_services to find a valid id.' })
      const mapped = await toValues(args, current)
      if (!mapped.ok) return mapped.result
      if (Object.keys(mapped.values).length === 0) return fail('Nothing to update: pass at least one field to change.')
      try {
        const row = await updateServiceDraft(args.id, mapped.values, args.expectedUpdatedAt, ctx.actor)
        return ok({ updated: true, service: serviceView(row, await categoryMap(), { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err, serviceUrls(current).editUrl)
      }
    },
  }),
]
