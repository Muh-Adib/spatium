import 'server-only'
import { z } from 'zod'
import {
  BLOCK_CATEGORY_LABEL,
  blockJsonSchema,
  getBlockEntry,
  listBlocksFor,
  validateBlockList,
  type BlockCategory,
  type BlockIssue,
  type BlockTarget,
} from '@/lib/blocks/catalog'
import { PAGE_STATUSES, slugify } from '@/lib/pages/page-schema'
import { DATA_BOUND_TYPES } from '@/blocks/registry'
import {
  createPage,
  getPageById,
  getPageBySlug,
  listPages,
  publicationIssues,
  updatePage,
  PageError,
  type PageRecord,
} from '@/lib/pages/repository'
import type { McpScope } from './scopes'
import {
  EDITABLE_STATUSES as EDITABLE_STATUS_LIST,
  blockIssuesResult,
  blockList,
  defineTool,
  fail,
  ok,
  readOnly,
  rejectPublicationFields,
  siteUrl,
  validateBlocksFor,
  withIds,
  write,
  type McpTool,
  type ToolAnnotations,
  type ToolContext,
  type ToolResult,
} from './tool-kit'
import { ARTICLE_TOOLS } from './content/articles'
import { PORTFOLIO_TOOLS } from './content/portfolio'
import { SERVICE_TOOLS } from './content/services'
import { SERVICE_CATEGORY_TOOLS } from './content/service-categories'
import { BLOCK_PRESETS, PRESET_TYPES } from '@/blocks/presets'
import { ENTITY_TARGETS } from '@/lib/blocks/define'

export type { ToolContext, ToolResult } from './tool-kit'

/**
 * MCP tools: deterministic wrappers around the block catalogue and the content
 * repositories. Nothing here can publish, archive or delete: every write only
 * produces or edits drafts and writes ContentRevision + SeoAuditLog rows with
 * the `mcp:<key name>` actor. Article/portfolio/service tools live in ./content.
 */

function fromPageError(err: PageError): ToolResult {
  const hints: Record<PageError['code'], string> = {
    not_found: 'Call list_pages to find a valid page id.',
    conflict: 'The page changed since you read it. Call get_page again and retry with the new updatedAt as expectedUpdatedAt.',
    slug_taken: 'Choose a different slug (e.g. add a qualifier) and retry.',
    invalid: 'Fix the listed issues and retry. Use get_block_type for the exact fields of a block type.',
    gate: 'The page does not meet the publication gate yet.',
    forbidden: 'This action is not allowed for MCP clients.',
  }
  return fail(`${err.message} (${err.code})`, { code: err.code, hint: hints[err.code], ...err.details })
}

// ─── Shared schemas ───────────────────────────────────────────────────────────

const TARGETS = ['page', 'service-category', 'service', 'portfolio'] as const satisfies readonly BlockTarget[]
const CATEGORIES = Object.keys(BLOCK_CATEGORY_LABEL) as [BlockCategory, ...BlockCategory[]]
const EDITABLE_STATUSES = new Set(EDITABLE_STATUS_LIST)

const pageId = z.number().int().positive().describe('Page id (from list_pages, get_page or create_page_draft).')
const expectedUpdatedAt = z
  .string()
  .describe('The page updatedAt you last read (get_page). The edit is refused if the page changed since.')

const blockLocator = {
  blockId: z.string().optional().describe('Target block id (preferred).'),
  index: z.number().int().min(0).optional().describe('Target block position (0-based), used when blockId is omitted.'),
}

const metaFields = {
  metaTitle: z.string().max(120).nullable().optional().describe('SEO title (≤ 60 characters recommended). Required before a human can publish.'),
  metaDescription: z
    .string()
    .max(320)
    .nullable()
    .optional()
    .describe('SEO description (120–160 characters recommended). Required before a human can publish.'),
  ogImage: z.string().max(1000).nullable().optional().describe('Social share image URL.'),
  ogImageAlt: z.string().max(300).nullable().optional().describe('Alt text for ogImage (required when ogImage is set).'),
  robots: z.enum(['index, follow', 'noindex, follow', 'noindex, nofollow']).optional(),
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

export function pageUrls(page: Pick<PageRecord, 'id' | 'slug' | 'status'>) {
  return {
    editUrl: `${siteUrl()}/admin?tab=pages&page=${page.id}`,
    publicUrl: page.status === 'published' ? `${siteUrl()}/${page.slug}` : null,
  }
}

function blockOutline(blocks: unknown[]) {
  return blocks.map((b, index) => {
    const rec = b && typeof b === 'object' ? (b as Record<string, unknown>) : {}
    return { index, id: typeof rec.id === 'string' ? rec.id : null, type: typeof rec.type === 'string' ? rec.type : null }
  })
}

function pageView(page: PageRecord, options: { includeBlocks: boolean }) {
  const gate = publicationIssues(page)
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    editable: EDITABLE_STATUSES.has(page.status),
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogImage: page.ogImage,
    ogImageAlt: page.ogImageAlt,
    robots: page.robots,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
    ...pageUrls(page),
    blockCount: page.blocks.length,
    ...(options.includeBlocks ? { blocks: page.blocks } : { outline: blockOutline(page.blocks) }),
    publication: {
      ready: gate.issues.length === 0 && gate.blockIssues.length === 0,
      issues: gate.issues,
      warnings: gate.warnings,
      blockIssues: gate.blockIssues,
      note: 'Only a human editor can publish, from the Studio (editUrl).',
    },
  }
}

type Located = { ok: true; index: number } | { ok: false; result: ToolResult }

function locate(blocks: unknown[], loc: { blockId?: string; index?: number }): Located {
  if (loc.blockId !== undefined) {
    const index = blocks.findIndex((b) => b !== null && typeof b === 'object' && (b as Record<string, unknown>).id === loc.blockId)
    if (index < 0) {
      return { ok: false, result: fail(`No block with id "${loc.blockId}" on this page.`, { outline: blockOutline(blocks) }) }
    }
    return { ok: true, index }
  }
  if (loc.index !== undefined) {
    if (loc.index >= blocks.length) {
      return { ok: false, result: fail(`Index ${loc.index} is out of range (page has ${blocks.length} blocks).`, { outline: blockOutline(blocks) }) }
    }
    return { ok: true, index: loc.index }
  }
  return { ok: false, result: fail('Pass blockId or index to choose a block.') }
}

type Editable = { ok: true; page: PageRecord } | { ok: false; result: ToolResult }

async function loadEditablePage(id: number, expected?: string): Promise<Editable> {
  const page = await getPageById(id)
  if (!page) return { ok: false, result: fail(`Page ${id} not found.`, { hint: 'Call list_pages to find a valid page id.' }) }
  if (!EDITABLE_STATUSES.has(page.status)) {
    return {
      ok: false,
      result: fail(`Page ${id} is ${page.status}; MCP clients can only edit draft or in_review pages.`, {
        status: page.status,
        editUrl: pageUrls(page).editUrl,
        hint: 'Ask a human editor to move it back to draft in the Studio, or create a new draft with create_page_draft.',
      }),
    }
  }
  if (expected !== undefined && expected !== page.updatedAt) {
    return {
      ok: false,
      result: fail('The page changed since you last read it. Nothing was saved.', {
        code: 'conflict',
        currentUpdatedAt: page.updatedAt,
        hint: 'Call get_page, re-apply your change to the latest blocks, and pass the new updatedAt.',
      }),
    }
  }
  return { ok: true, page }
}

async function saveBlocks(page: PageRecord, blocks: unknown[], ctx: ToolContext, summary: Record<string, unknown>): Promise<ToolResult> {
  const check = validateBlockList(blocks)
  if (!check.ok) return blockIssuesResult(check.issues)
  try {
    // The read's updatedAt guards against concurrent edits and status changes.
    const saved = await updatePage(page.id, { blocks: check.blocks, expectedUpdatedAt: page.updatedAt }, ctx.actor)
    return ok({ ...summary, page: pageView(saved, { includeBlocks: false }) })
  } catch (err) {
    if (err instanceof PageError) return fromPageError(err)
    throw err
  }
}

// ─── Tools ────────────────────────────────────────────────────────────────────

const blockSummary = z.object({
  type: z.string(),
  label: z.string(),
  description: z.string(),
  category: z.string(),
  targets: z.array(z.string()),
  dataBound: z.boolean(),
})

const PAGE_TOOLS: readonly McpTool[] = [
  defineTool({
    name: 'list_block_types',
    title: 'List block types',
    scope: 'blocks:read',
    description:
      'Step 1 of building a page. Lists the block types available for a target (default "page"): type, label, description, category, targets and dataBound. ' +
      'dataBound blocks (service-category / service / portfolio) render the entry\'s own data and only store presentation options. ' +
      'Pick blocks from here, then call get_block_type for the exact fields of each type you use.',
    input: z.strictObject({
      target: z
        .enum(TARGETS)
        .default('page')
        .describe('Where the blocks will be placed: "page" (dynamic pages), "service-category", "service" or "portfolio".'),
      category: z.enum(CATEGORIES).optional().describe('Only return blocks of this category.'),
    }),
    output: z.object({ target: z.string(), count: z.number(), blocks: z.array(blockSummary) }),
    annotations: readOnly,
    run: async ({ target, category }) => {
      const blocks = listBlocksFor(target)
        .filter((e) => !category || e.category === category)
        .map((e) => ({
          type: e.type,
          label: e.label,
          description: e.description,
          category: e.category,
          targets: [...e.targets],
          dataBound: DATA_BOUND_TYPES.has(e.type),
        }))
      return ok({ target, count: blocks.length, blocks })
    },
  }),

  defineTool({
    name: 'get_block_type',
    title: 'Get block type details',
    scope: 'blocks:read',
    description:
      'Returns the editable fields, a valid example payload and the full JSON Schema of one block type. ' +
      'Start from the example and change only the content: never invent metrics, client names, quotes or image URLs.',
    input: z.strictObject({ type: z.string().min(1).describe('Block type from list_block_types, e.g. "hero-cinema".') }),
    annotations: readOnly,
    run: async ({ type }) => {
      const entry = getBlockEntry(type)
      if (!entry) {
        return fail(`Unknown block type "${type}".`, { availableTypes: listBlocksFor('page').map((e) => e.type) })
      }
      return ok({
        type: entry.type,
        label: entry.label,
        description: entry.description,
        category: entry.category,
        targets: [...entry.targets],
        fields: entry.fields,
        example: entry.example,
        jsonSchema: blockJsonSchema(type),
      })
    },
  }),

  defineTool({
    name: 'get_block_preset',
    title: 'Get block preset',
    scope: 'blocks:read',
    description:
      'Returns the default page of a service category, service or portfolio entry: the preset block list (what an entry without stored blocks renders, ' +
      'and what create_*_draft stores when blocks are omitted) with each block\'s fields. Data-bound blocks render the entry\'s own data; their fields are ' +
      'optional presentation overrides (eyebrow, heading, limits, toggles). Customise by editing, reordering, removing, or inserting generic blocks.',
    input: z.strictObject({ target: z.enum(ENTITY_TARGETS).describe('"service-category", "service" or "portfolio".') }),
    annotations: readOnly,
    run: async ({ target }) => {
      const blocks = BLOCK_PRESETS[target].map(({ id: _presetId, ...block }) => block)
      return ok({
        target,
        types: [...PRESET_TYPES[target]],
        blocks,
        fields: Object.fromEntries(
          PRESET_TYPES[target].map((type) => {
            const entry = getBlockEntry(type)
            return [type, { label: entry?.label ?? type, description: entry?.description ?? '', fields: entry?.fields ?? [] }]
          }),
        ),
        note: 'Ids are assigned on save. Pass these blocks (edited) as blocks to create_*_draft / update_*_draft.',
      })
    },
  }),

  defineTool({
    name: 'validate_blocks',
    title: 'Validate blocks',
    scope: 'blocks:read',
    description:
      'Validates an array of blocks against the catalogue without saving anything. Returns ok plus per-block issues (index, blockId, type, message). ' +
      'Pass target "portfolio" or "service" to also check the types are offered there. ' +
      'Use it before create_*_draft / update_*_draft when composing many blocks at once.',
    input: z.strictObject({
      blocks: blockList,
      target: z.enum(TARGETS).default('page').describe('Where the blocks will be placed.'),
    }),
    output: z.object({
      ok: z.boolean(),
      blockCount: z.number(),
      issues: z.array(z.object({ index: z.number(), blockId: z.string().optional(), type: z.string().optional(), message: z.string() })),
    }),
    annotations: readOnly,
    run: async ({ blocks, target }) => {
      const result = validateBlocksFor(target, withIds(blocks))
      return ok({ ok: result.ok, blockCount: blocks.length, issues: result.issues })
    },
  }),

  defineTool({
    name: 'list_pages',
    title: 'List pages',
    scope: 'pages:read',
    description: 'Lists dynamic pages (newest first): id, slug, title, status, updatedAt, blockCount and editUrl. Filter by status.',
    input: z.strictObject({ status: z.enum(PAGE_STATUSES).optional().describe('Only pages with this status.') }),
    output: z.object({
      count: z.number(),
      pages: z.array(
        z.object({
          id: z.number(),
          slug: z.string(),
          title: z.string(),
          status: z.string(),
          updatedAt: z.string(),
          blockCount: z.number(),
          editUrl: z.string(),
          publicUrl: z.string().nullable(),
        }),
      ),
    }),
    annotations: readOnly,
    run: async ({ status }) => {
      const pages = (await listPages(status ? { status } : {})).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        status: p.status,
        updatedAt: p.updatedAt,
        blockCount: p.blockCount,
        ...pageUrls(p),
      }))
      return ok({ count: pages.length, pages })
    },
  }),

  defineTool({
    name: 'get_page',
    title: 'Get page',
    scope: 'pages:read',
    description:
      'Returns one page by id or slug with all blocks, updatedAt (pass it back as expectedUpdatedAt when editing), editable, ' +
      'and publication: what a human must still fix before publishing.',
    input: z.strictObject({
      id: pageId.optional(),
      slug: z.string().optional().describe('Page slug, used when id is omitted.'),
    }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const page = id !== undefined ? await getPageById(id) : await getPageBySlug(slugify(slug ?? ''))
      if (!page) return fail('Page not found.', { hint: 'Call list_pages to see existing pages.' })
      return ok(pageView(page, { includeBlocks: true }))
    },
  }),

  defineTool({
    name: 'get_page_url',
    title: 'Get page URLs',
    scope: 'pages:read',
    description:
      'Returns where a page can be seen: publicUrl (only for published pages) and editUrl, the Studio editor where a human previews, reviews and publishes drafts.',
    input: z.strictObject({ id: pageId.optional(), slug: z.string().optional() }),
    output: z.object({
      id: z.number(),
      status: z.string(),
      editUrl: z.string(),
      publicUrl: z.string().nullable(),
      preview: z.string(),
    }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const page = id !== undefined ? await getPageById(id) : await getPageBySlug(slugify(slug ?? ''))
      if (!page) return fail('Page not found.')
      const urls = pageUrls(page)
      return ok({
        id: page.id,
        status: page.status,
        ...urls,
        preview:
          page.status === 'published'
            ? 'The page is live at publicUrl.'
            : 'Drafts are not public. Open editUrl (Studio login required) to preview the draft and send it for review.',
      })
    },
  }),

  defineTool({
    name: 'create_page_draft',
    title: 'Create page draft',
    scope: 'pages:draft',
    description:
      'Creates a new DRAFT page at /<slug>. slug is optional (derived from title). Blocks without an id get one. ' +
      'Returns the page (with updatedAt for further edits), editUrl and the publication checklist. The page is never published by this tool.',
    input: z.strictObject({
      title: z.string().trim().min(1).max(200).describe('Page title (also the H1 when no hero block is used).'),
      slug: z.string().optional().describe('URL slug: lowercase letters, digits and hyphens. Omit to derive from the title.'),
      ...metaFields,
      blocks: blockList.default([]),
    }),
    annotations: write,
    run: async (args, ctx) => {
      const slug = slugify(args.slug ?? args.title)
      if (slug.length < 2) return fail('Could not derive a valid slug. Pass slug explicitly (e.g. "kampanye-wedding").')
      const blocks = withIds(args.blocks)
      const check = validateBlockList(blocks)
      if (!check.ok) return blockIssuesResult(check.issues)
      try {
        const page = await createPage(
          {
            title: args.title,
            slug,
            metaTitle: args.metaTitle,
            metaDescription: args.metaDescription,
            ogImage: args.ogImage,
            ogImageAlt: args.ogImageAlt,
            robots: args.robots,
            blocks: check.blocks,
          },
          ctx.actor,
        )
        return ok({ created: true, page: pageView(page, { includeBlocks: false }) })
      } catch (err) {
        if (err instanceof PageError) return fromPageError(err)
        throw err
      }
    },
  }),

  defineTool({
    name: 'update_page_draft',
    title: 'Update page draft',
    scope: 'pages:draft',
    description:
      'Patches a draft (or in_review) page: title, slug, meta fields and/or the WHOLE block list. Requires expectedUpdatedAt from get_page. ' +
      'Refused for published or archived pages: ask a human, or create a new draft instead. For single-block edits prefer insert_blocks / update_block / remove_block / move_block.',
    input: z.strictObject({
      id: pageId,
      expectedUpdatedAt,
      title: z.string().trim().min(1).max(200).optional(),
      slug: z.string().optional(),
      ...metaFields,
      blocks: blockList.optional().describe('Replaces the entire block list when provided.'),
    }),
    annotations: write,
    run: async (args, ctx) => {
      const loaded = await loadEditablePage(args.id, args.expectedUpdatedAt)
      if (!loaded.ok) return loaded.result
      const patch: Parameters<typeof updatePage>[1] = { expectedUpdatedAt: loaded.page.updatedAt }
      if (args.title !== undefined) patch.title = args.title
      if (args.slug !== undefined) patch.slug = slugify(args.slug)
      for (const key of ['metaTitle', 'metaDescription', 'ogImage', 'ogImageAlt'] as const) {
        if (args[key] !== undefined) patch[key] = args[key]
      }
      if (args.robots !== undefined) patch.robots = args.robots
      if (args.blocks !== undefined) {
        const check = validateBlockList(withIds(args.blocks))
        if (!check.ok) return blockIssuesResult(check.issues)
        patch.blocks = check.blocks
      }
      try {
        const saved = await updatePage(args.id, patch, ctx.actor)
        return ok({ updated: true, page: pageView(saved, { includeBlocks: false }) })
      } catch (err) {
        if (err instanceof PageError) return fromPageError(err)
        throw err
      }
    },
  }),

  defineTool({
    name: 'insert_blocks',
    title: 'Insert blocks',
    scope: 'pages:draft',
    description:
      'Inserts one or more blocks into a draft page without resending the page. Position: afterBlockId, or index (0 = top), default = append at the end. ' +
      'New blocks get ids. Returns the updated outline (index, id, type) and the new updatedAt.',
    input: z.strictObject({
      pageId,
      blocks: blockList.min(1),
      afterBlockId: z.string().optional().describe('Insert right after this block.'),
      index: z.number().int().min(0).optional().describe('Insert at this position (0-based). Ignored when afterBlockId is set.'),
      expectedUpdatedAt: expectedUpdatedAt.optional(),
    }),
    annotations: write,
    run: async (args, ctx) => {
      const loaded = await loadEditablePage(args.pageId, args.expectedUpdatedAt)
      if (!loaded.ok) return loaded.result
      const current = [...loaded.page.blocks]
      let at = current.length
      if (args.afterBlockId !== undefined) {
        const found = locate(current, { blockId: args.afterBlockId })
        if (!found.ok) return found.result
        at = found.index + 1
      } else if (args.index !== undefined) {
        at = Math.min(args.index, current.length)
      }
      const taken = new Set(blockOutline(current).flatMap((b) => (b.id ? [b.id] : [])))
      const inserted = withIds(args.blocks, taken)
      current.splice(at, 0, ...inserted)
      return saveBlocks(loaded.page, current, ctx, { inserted: inserted.map((b, i) => ({ index: at + i, id: b.id, type: b.type })) })
    },
  }),

  defineTool({
    name: 'update_block',
    title: 'Update block',
    scope: 'pages:draft',
    description:
      'Edits one block on a draft page (by blockId or index). "set" shallow-merges fields into the block (a nested object or list replaces the old value); ' +
      '"unset" removes optional fields. type and id cannot change: remove_block + insert_blocks to swap a type.',
    input: z.strictObject({
      pageId,
      ...blockLocator,
      set: z.record(z.string(), z.unknown()).default({}).describe('Fields to set, e.g. {"headline": "…"}.'),
      unset: z.array(z.string()).default([]).describe('Field names to remove.'),
      expectedUpdatedAt: expectedUpdatedAt.optional(),
    }),
    annotations: write,
    run: async (args, ctx) => {
      if ('type' in args.set || 'id' in args.set || args.unset.includes('type') || args.unset.includes('id')) {
        return fail('type and id cannot be changed. Use remove_block and insert_blocks to replace a block with another type.')
      }
      const loaded = await loadEditablePage(args.pageId, args.expectedUpdatedAt)
      if (!loaded.ok) return loaded.result
      const current = [...loaded.page.blocks]
      const found = locate(current, args)
      if (!found.ok) return found.result
      const before = current[found.index]
      const merged: Record<string, unknown> = { ...(before && typeof before === 'object' ? before : {}), ...args.set }
      for (const key of args.unset) delete merged[key]
      current[found.index] = merged
      return saveBlocks(loaded.page, current, ctx, { updated: { index: found.index, id: merged.id ?? null, type: merged.type ?? null } })
    },
  }),

  defineTool({
    name: 'remove_block',
    title: 'Remove block',
    scope: 'pages:draft',
    description: 'Removes one block (by blockId or index) from a draft page. The previous version stays in the page revision history.',
    input: z.strictObject({ pageId, ...blockLocator, expectedUpdatedAt: expectedUpdatedAt.optional() }),
    annotations: { ...write, destructiveHint: true },
    run: async (args, ctx) => {
      const loaded = await loadEditablePage(args.pageId, args.expectedUpdatedAt)
      if (!loaded.ok) return loaded.result
      const current = [...loaded.page.blocks]
      const found = locate(current, args)
      if (!found.ok) return found.result
      const [removed] = current.splice(found.index, 1)
      return saveBlocks(loaded.page, current, ctx, { removed: blockOutline([removed]).map((b) => ({ ...b, index: found.index }))[0] })
    },
  }),

  defineTool({
    name: 'move_block',
    title: 'Move block',
    scope: 'pages:draft',
    description: 'Moves one block (by blockId or index) to toIndex, its final 0-based position, on a draft page.',
    input: z.strictObject({
      pageId,
      ...blockLocator,
      toIndex: z.number().int().min(0).describe('Final position of the block (0 = top).'),
      expectedUpdatedAt: expectedUpdatedAt.optional(),
    }),
    annotations: write,
    run: async (args, ctx) => {
      const loaded = await loadEditablePage(args.pageId, args.expectedUpdatedAt)
      if (!loaded.ok) return loaded.result
      const current = [...loaded.page.blocks]
      const found = locate(current, args)
      if (!found.ok) return found.result
      if (args.toIndex >= current.length) {
        return fail(`toIndex ${args.toIndex} is out of range (0–${current.length - 1}).`, { outline: blockOutline(current) })
      }
      const [block] = current.splice(found.index, 1)
      current.splice(args.toIndex, 0, block)
      return saveBlocks(loaded.page, current, ctx, { moved: { from: found.index, to: args.toIndex } })
    },
  }),
]

export const MCP_TOOLS: readonly McpTool[] = [...PAGE_TOOLS, ...ARTICLE_TOOLS, ...PORTFOLIO_TOOLS, ...SERVICE_CATEGORY_TOOLS, ...SERVICE_TOOLS]

const BY_NAME = new Map(MCP_TOOLS.map((t) => [t.name, t]))

// ─── Protocol-facing surface ──────────────────────────────────────────────────

function jsonSchemaOf(schema: z.ZodType, io: 'input' | 'output'): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io, unrepresentable: 'any' }) as Record<string, unknown>
  // Some MCP clients reject the `$schema` keyword; the 2020-12 dialect is the MCP default.
  const { $schema: _dialect, ...rest } = json
  return rest
}

export type ToolDescriptor = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  annotations: ToolAnnotations
}

export function describeTool(tool: McpTool): ToolDescriptor {
  return {
    name: tool.name,
    title: tool.title,
    description: `${tool.description} [scope: ${tool.scope}]`,
    inputSchema: jsonSchemaOf(tool.input, 'input'),
    ...(tool.output ? { outputSchema: jsonSchemaOf(tool.output, 'output') } : {}),
    annotations: { title: tool.title, ...tool.annotations, openWorldHint: false },
  }
}

/** Tools visible to a key: only those its scopes allow. */
export function listToolsFor(scopes: readonly McpScope[]): ToolDescriptor[] {
  return MCP_TOOLS.filter((t) => scopes.includes(t.scope)).map(describeTool)
}

export type CallOutcome = { kind: 'unknown_tool' } | { kind: 'result'; result: ToolResult }

export async function callTool(name: string, rawArgs: unknown, ctx: ToolContext): Promise<CallOutcome> {
  const tool = BY_NAME.get(name)
  if (!tool) return { kind: 'unknown_tool' }
  if (!ctx.scopes.includes(tool.scope)) {
    return {
      kind: 'result',
      result: fail(`This API key lacks the "${tool.scope}" scope required by ${name}.`, {
        hint: 'Ask a Studio admin for a key with this scope (Studio → MCP).',
      }),
    }
  }
  if (tool.scope.endsWith(':draft')) {
    // Drafts only (AGENTS.md §3.5): never silently drop a publish attempt.
    const refused = rejectPublicationFields(rawArgs)
    if (refused) return { kind: 'result', result: refused }
  }
  const parsed = tool.input.safeParse(rawArgs ?? {})
  if (!parsed.success) {
    // Argument errors are tool results (not protocol errors) so the model can self-correct.
    return {
      kind: 'result',
      result: fail(`Invalid arguments for ${name}.`, {
        issues: parsed.error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message })),
        hint: 'Unknown fields are rejected, not ignored: use only the properties in this tool\'s inputSchema.',
      }),
    }
  }
  return { kind: 'result', result: await tool.run(parsed.data, ctx) }
}

/** Server instructions sent in `initialize`: teaches the client the workflow. */
export const MCP_INSTRUCTIONS = [
  'SPATIUM content studio. You write pages, journal articles, portfolio entries and services as DRAFTS; a human editor reviews and publishes them in the Studio. You cannot publish, schedule, archive or delete, and any status/publishedAt/scheduledAt argument is refused.',
  'Pages: 1) list_block_types → 2) get_block_type for each type you use (start from its example) → 3) optional validate_blocks → 4) create_page_draft (title, metaTitle, metaDescription, blocks) → 5) refine with insert_blocks / update_block / move_block / remove_block, or update_page_draft for bulk changes → 6) get_page to read publication issues and report the editUrl to the user.',
  'Articles: list_article_taxonomy (existing categories/authors) → create_article_draft (title, HTML or markdown content, excerpt, metaTitle, metaDescription) → get_article → update_article_draft. Portfolio: create_portfolio_draft / update_portfolio_draft. Service categories (use cases): list_service_categories → create_service_category_draft / update_service_category_draft. Services: list_services → create_service_draft / update_service_draft.',
  'Entity pages (service-category, service, portfolio) are made of blocks too. Every section is a block; data-bound blocks (e.g. category-hero, service-description, portfolio-scene) render the entry\'s own fields and only store presentation options. Creating without blocks stores the default preset (get_block_preset). To customise, read get_* resolvedBlocks, edit/reorder/remove or insert generic blocks (list_block_types with that target), and send the whole list as blocks. Give the user the previewUrl/editUrl.',
  'Edits need fresh state: every write returns the new updatedAt; pass it as expectedUpdatedAt. On a conflict, read again and retry. Unknown arguments are rejected, not ignored.',
  'Content rules: write in the site language (Indonesian unless asked otherwise), keep headings in order (H2 then H3), give every image alt text, and never invent metrics, client names, testimonials, quotes or image URLs. Always end by giving the user the editUrl and the remaining publication issues.',
].join('\n')
