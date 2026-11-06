import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { validateCatalogPublication } from '@/lib/blocks/publication-gate'
import { portfolioMutationSchema } from '@/lib/validation/api-schemas'
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
 * MCP tools for portfolio entries (scenes at /portfolio/<slug>). Studio saves
 * portfolios inline in /api/portfolio, so the draft repository lives here:
 * every write is one transaction with ContentRevision + SeoAuditLog, the
 * stored shape matches what the Studio portfolio editor writes, and the
 * publication gate is the Studio's `validateCatalogPublication`.
 */

const PORTFOLIO_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type PortfolioRow = NonNullable<Awaited<ReturnType<typeof prisma.orm.public.Portfolio.first>>>

export function portfolioUrls(row: { slug: string; status: string | null }) {
  return {
    editUrl: `${siteUrl()}/admin?tab=portfolio&slug=${encodeURIComponent(row.slug)}`,
    publicUrl: (row.status ?? 'published') === 'published' ? `${siteUrl()}/portfolio/${row.slug}` : null,
  }
}

function heroAltOf(row: PortfolioRow): string | null {
  const seo = asRecord(parseJson(row.seoData, `portfolios.seo_data#${row.slug}`))
  return typeof seo.coverAlt === 'string' && seo.coverAlt ? seo.coverAlt : null
}

function blocksOf(row: PortfolioRow): unknown[] {
  return asArray(parseJson(row.blocks, `portfolios.blocks#${row.slug}`))
}

export function portfolioGate(row: PortfolioRow) {
  const gate = validateCatalogPublication({
    title: row.title,
    slug: row.slug,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    heroImage: row.heroImage ?? undefined,
    heroImageAlt: heroAltOf(row) ?? undefined,
    blocks: blocksOf(row),
  })
  return {
    ready: gate.canPublish,
    issues: gate.issues,
    warnings: gate.warnings,
    note: 'Only a human editor can publish, from the Studio (editUrl).',
  }
}

function portfolioView(row: PortfolioRow, options: { includeBlocks: boolean }) {
  const status = row.status ?? 'published'
  const blocks = blocksOf(row)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status,
    editable: EDITABLE_STATUSES.includes(status),
    client: row.client,
    year: row.year,
    category: row.category,
    summary: row.summary,
    challenge: row.challenge,
    approach: row.approach,
    solution: row.solution,
    process: row.process,
    result: row.result,
    heroImage: row.heroImage,
    heroImageAlt: heroAltOf(row),
    liveUrl: row.liveUrl,
    technologies: asArray(parseJson(row.technologies, `portfolios.technologies#${row.slug}`)),
    metrics: asArray(parseJson(row.metrics, `portfolios.metrics#${row.slug}`)),
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    focusKeyphrase: row.focusKeyphrase,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...portfolioUrls(row),
    blockCount: blocks.length,
    ...(options.includeBlocks
      ? { blocks }
      : { outline: blocks.map((b, index) => ({ index, id: asRecord(b).id ?? null, type: asRecord(b).type ?? null })) }),
    publication: portfolioGate(row),
  }
}

// ─── Inputs (field limits reuse the Studio portfolio schema) ──────────────────

const shape = portfolioMutationSchema.shape
const portfolioId = z.number().int().positive().describe('Portfolio id (from list_portfolios, get_portfolio or create_portfolio_draft).')

const metric = z.strictObject({
  label: z.string().trim().min(1).max(100).describe('Metric key. The site reads "sceneUrl", "pointCount", "accuracy", "location" and "scenePair".'),
  value: z.string().trim().min(1).max(300),
  detail: z.string().trim().max(300).optional(),
})

const portfolioFields = {
  client: shape.client.describe('Client name, only if the user confirmed it may be shown publicly.'),
  year: z.number().int().min(1990).max(2100).nullable().optional().describe('Capture year. Leave empty when unknown.'),
  category: shape.category.describe('Discipline, e.g. "Heritage", "Real Estate". Leave empty when unknown.'),
  summary: shape.summary.describe('One-sentence tagline shown on cards and the hero.'),
  challenge: shape.challenge.describe('The brief: what the client needed.'),
  approach: shape.approach.describe('Approach steps, one per line.'),
  solution: shape.solution,
  process: shape.process,
  result: shape.result.describe('What was delivered, one item per line.'),
  heroImageAlt: z.string().trim().max(300).nullable().optional().describe('Alt text for the hero image. Required before publishing when a hero image is set.'),
  heroMediaId: mediaIdField.optional(),
  liveUrl: z
    .string()
    .trim()
    .max(1000)
    .regex(/^https:\/\/\S+$/i, 'liveUrl must be an https URL (e.g. the SuperSplat scene).')
    .nullable()
    .optional()
    .describe('Public scene viewer URL (https), e.g. a SuperSplat link.'),
  technologies: z.array(z.string().trim().min(1).max(100)).max(30).optional().describe('Capture/processing tools. The first is shown as the capture method.'),
  metrics: z.array(metric).max(30).optional().describe('Measured facts only (point count, accuracy…). Never invent numbers.'),
  metaTitle: shape.metaTitle.describe('SEO title, 10–70 characters.'),
  metaDescription: shape.metaDescription.describe('SEO description, 20–165 characters.'),
  focusKeyphrase: shape.focusKeyphrase,
}

const createInput = z.strictObject({
  title: shape.title.describe('Scene / project title.'),
  slug: z.string().optional().describe('URL slug at /portfolio/<slug>. Omit to derive from the title. Fixed after creation.'),
  heroImage: imageUrlField.optional().describe('Poster image: site path (Media library) or https URL. Never invent image URLs.'),
  ...portfolioFields,
  blocks: blockList.default([]).describe('Optional catalogue blocks (target "portfolio").'),
})

const updateInput = z.strictObject({
  id: portfolioId,
  expectedUpdatedAt: expectedUpdatedAtField,
  title: shape.title.optional(),
  heroImage: imageUrlField.nullable().optional().describe('New poster image; null removes it.'),
  ...portfolioFields,
  blocks: blockList.optional().describe('Replaces the entire block list when provided.'),
})

type Values = Record<string, unknown>

/** Maps MCP input to stored columns, in the same shape the Studio portfolio editor writes. */
async function toValues(
  args: z.output<typeof createInput> | z.output<typeof updateInput>,
  previousSeo: Record<string, unknown>,
): Promise<{ ok: true; values: Values } | { ok: false; result: ToolResult }> {
  const values: Values = {}
  if (args.title !== undefined) values.title = args.title
  for (const key of ['client', 'category', 'summary', 'challenge', 'approach', 'solution', 'process', 'result', 'liveUrl', 'metaTitle', 'metaDescription', 'focusKeyphrase'] as const) {
    const value = args[key]
    if (value !== undefined) values[key] = value === null || value === '' ? null : value
  }
  if (args.year !== undefined) values.year = args.year
  if (args.technologies !== undefined) values.technologies = args.technologies.length ? JSON.stringify(args.technologies) : null
  if (args.metrics !== undefined) values.metrics = args.metrics.length ? JSON.stringify(args.metrics) : null
  if (args.blocks !== undefined) {
    const check = checkBlocksFor('portfolio', args.blocks)
    if (!check.ok) return check
    values.blocks = check.blocks.length ? JSON.stringify(check.blocks) : null
  }

  const seo = { ...previousSeo }
  let seoChanged = false
  if (args.heroImage !== undefined || args.heroMediaId !== undefined) {
    const hero = await resolveImage({ url: args.heroImage, mediaId: args.heroMediaId, alt: args.heroImageAlt })
    if (!hero.ok) return hero
    values.heroImage = hero.url
    Object.assign(seo, { coverAlt: hero.alt ?? '', ogImage: hero.url, ogImageAlt: hero.alt, twitterImage: hero.url, twitterImageAlt: hero.alt })
    seoChanged = true
  } else if (args.heroImageAlt !== undefined) {
    Object.assign(seo, { coverAlt: args.heroImageAlt ?? '', ogImageAlt: args.heroImageAlt, twitterImageAlt: args.heroImageAlt })
    seoChanged = true
  }
  if (args.metaTitle !== undefined || args.metaDescription !== undefined) {
    if (args.metaTitle !== undefined) seo.metaTitle = args.metaTitle
    if (args.metaDescription !== undefined) seo.metaDescription = args.metaDescription
    seoChanged = true
  }
  if (seoChanged) values.seoData = JSON.stringify(seo)
  return { ok: true, values }
}

// ─── Repository ───────────────────────────────────────────────────────────────

async function createPortfolioDraft(slug: string, values: Values, actor: string): Promise<PortfolioRow> {
  return prisma.transaction(async (tx) => {
    const clash = await tx.orm.public.Portfolio.where({ slug }).first()
    if (clash) throw new DraftError('slug_taken', `Slug "${slug}" is already used by another portfolio entry.`)
    const created = await tx.orm.public.Portfolio.create({
      ...values,
      title: String(values.title),
      slug,
      documentId: `port-${slug}`,
      featured: false,
      status: 'draft',
    })
    await recordHistory(tx, 'portfolio', created, actor, 'create')
    return created
  })
}

async function updatePortfolioDraft(id: number, values: Values, expectedUpdatedAt: string, actor: string): Promise<PortfolioRow> {
  return prisma.transaction(async (tx) => {
    const current = await tx.orm.public.Portfolio.where({ id }).forUpdate().first()
    assertEditable(`Portfolio ${id}`, current, expectedUpdatedAt)
    await tx.orm.public.Portfolio.where({ id }).update(values)
    const row = await tx.orm.public.Portfolio.where({ id }).first()
    if (!row) throw new DraftError('not_found', `Portfolio ${id} not found.`)
    await recordHistory(tx, 'portfolio', current, actor, 'update', { fields: Object.keys(values) })
    return row
  })
}

function draftFailure(err: unknown, editUrl?: string): ToolResult {
  if (!(err instanceof DraftError)) throw err
  const withUrl = editUrl ? new DraftError(err.code, err.message, { ...err.details, editUrl }) : err
  return fromDraftError(withUrl, 'portfolio', {
    forbidden: `${DRAFT_ONLY_HINT} Ask a human editor to move it back to draft, or create a new draft with create_portfolio_draft.`,
  })
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export const PORTFOLIO_TOOLS: readonly McpTool[] = [
  defineTool({
    name: 'list_portfolios',
    title: 'List portfolio entries',
    scope: 'portfolio:read',
    description: 'Lists portfolio entries (scenes), newest first: id, slug, title, status, updatedAt, editUrl and publicUrl. Filter by status.',
    input: z.strictObject({ status: z.enum(PORTFOLIO_STATUSES).optional().describe('Only entries with this status.') }),
    annotations: readOnly,
    run: async ({ status }) => {
      const base = status ? prisma.orm.public.Portfolio.where({ status }) : prisma.orm.public.Portfolio
      const rows = await base.orderBy((p) => p.updatedAt.desc()).all()
      const portfolios = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status ?? 'published',
        updatedAt: r.updatedAt,
        ...portfolioUrls(r),
      }))
      return ok({ count: portfolios.length, portfolios })
    },
  }),

  defineTool({
    name: 'get_portfolio',
    title: 'Get portfolio entry',
    scope: 'portfolio:read',
    description:
      'Returns one portfolio entry by id or slug with all fields and blocks, updatedAt (pass it back as expectedUpdatedAt), editable, ' +
      'and publication: what a human must still fix before publishing.',
    input: z.strictObject({ id: portfolioId.optional(), slug: z.string().optional().describe('Slug, used when id is omitted.') }),
    annotations: readOnly,
    run: async ({ id, slug }) => {
      if (id === undefined && !slug) return fail('Pass id or slug.')
      const row = id !== undefined ? await prisma.orm.public.Portfolio.where({ id }).first() : await prisma.orm.public.Portfolio.where({ slug: slugify(slug ?? '') }).first()
      if (!row) return fail('Portfolio entry not found.', { hint: 'Call list_portfolios to see existing entries.' })
      return ok(portfolioView(row, { includeBlocks: true }))
    },
  }),

  defineTool({
    name: 'create_portfolio_draft',
    title: 'Create portfolio draft',
    scope: 'portfolio:draft',
    description:
      'Creates a new DRAFT portfolio entry at /portfolio/<slug>. Use only facts the user gave you: leave client, year, metrics and images out when unknown. ' +
      'Returns the entry (updatedAt for further edits), editUrl and the publication checklist. Never publishes.',
    input: createInput,
    annotations: write,
    run: async (args, ctx) => {
      const slug = slugify(args.slug ?? args.title)
      if (slug.length < 2 || !SLUG_PATTERN.test(slug)) return fail('Could not derive a valid slug. Pass slug explicitly (e.g. "candi-plaosan-scan").')
      const mapped = await toValues(args, {})
      if (!mapped.ok) return mapped.result
      try {
        const row = await createPortfolioDraft(slug, mapped.values, ctx.actor)
        return ok({ created: true, portfolio: portfolioView(row, { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err)
      }
    },
  }),

  defineTool({
    name: 'update_portfolio_draft',
    title: 'Update portfolio draft',
    scope: 'portfolio:draft',
    description:
      'Patches a draft (or in_review) portfolio entry; omitted fields stay unchanged, null clears a field. blocks replaces the whole list. ' +
      'Requires expectedUpdatedAt from get_portfolio. The slug cannot change through MCP. Refused for approved, published or archived entries.',
    input: updateInput,
    annotations: write,
    run: async (args, ctx) => {
      const current = await prisma.orm.public.Portfolio.where({ id: args.id }).first()
      if (!current) return fail(`Portfolio ${args.id} not found.`, { hint: 'Call list_portfolios to find a valid id.' })
      const mapped = await toValues(args, asRecord(parseJson(current.seoData, `portfolios.seo_data#${current.slug}`)))
      if (!mapped.ok) return mapped.result
      if (Object.keys(mapped.values).length === 0) return fail('Nothing to update: pass at least one field to change.')
      try {
        const row = await updatePortfolioDraft(args.id, mapped.values, args.expectedUpdatedAt, ctx.actor)
        return ok({ updated: true, portfolio: portfolioView(row, { includeBlocks: false }) })
      } catch (err) {
        return draftFailure(err, portfolioUrls(current).editUrl)
      }
    },
  }),
]
