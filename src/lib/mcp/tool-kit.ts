import 'server-only'
import { z } from 'zod'
import { siteConfig } from '@/config/site'
import { newBlockId, validateBlockListFor, type BlockIssue, type BlockTarget } from '@/lib/blocks/catalog'
import type { Block } from '@/lib/blocks/schema'
import { getMediaItem } from '@/lib/db/media'
import type { McpScope } from './scopes'

/**
 * Shared building blocks for MCP tool modules (pages, articles, portfolio,
 * services): the tool type, result helpers, and the guards every draft tool
 * applies (strict inputs, no status fields, block and image validation).
 */

export type ToolContext = { actor: string; scopes: readonly McpScope[] }

export type ToolResult = {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

export type ToolAnnotations = {
  title: string
  readOnlyHint: boolean
  destructiveHint: boolean
  idempotentHint: boolean
  openWorldHint: false
}

export type McpTool<S extends z.ZodType = z.ZodType> = {
  name: string
  title: string
  description: string
  scope: McpScope
  input: S
  output?: z.ZodType
  annotations: Omit<ToolAnnotations, 'title' | 'openWorldHint'>
  run: (args: z.output<S>, ctx: ToolContext) => Promise<ToolResult>
}

export function defineTool<S extends z.ZodType>(tool: McpTool<S>): McpTool {
  return tool as unknown as McpTool
}

export const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true } as const
export const write = { readOnlyHint: false, destructiveHint: false, idempotentHint: false } as const

// ─── Results ──────────────────────────────────────────────────────────────────

export function ok(data: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data }
}

export function fail(message: string, details?: Record<string, unknown>): ToolResult {
  const text = details ? `${message}\n${JSON.stringify(details, null, 2)}` : message
  return { content: [{ type: 'text', text }], isError: true }
}

/** Raised by MCP draft repositories; mapped to a tool error with a fix hint. */
export class DraftError extends Error {
  constructor(
    readonly code: 'not_found' | 'conflict' | 'forbidden' | 'slug_taken' | 'invalid',
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'DraftError'
  }
}

export function fromDraftError(err: DraftError, entity: string, hints: Partial<Record<DraftError['code'], string>> = {}): ToolResult {
  const defaults: Record<DraftError['code'], string> = {
    not_found: `Call list_${entity}s to find a valid id.`,
    conflict: `The ${entity} changed since you read it. Call get_${entity} again and retry with the new updatedAt as expectedUpdatedAt.`,
    forbidden: `MCP clients can only edit draft or in_review entries. Ask a human editor in the Studio (editUrl), or create a new draft.`,
    slug_taken: 'Choose a different slug (e.g. add a qualifier) and retry.',
    invalid: 'Fix the listed issues and retry.',
  }
  return fail(`${err.message} (${err.code})`, { code: err.code, hint: hints[err.code] ?? defaults[err.code], ...err.details })
}

// ─── Draft-only guard ─────────────────────────────────────────────────────────

/** Fields that would change publication state. MCP draft tools never accept them. */
export const PUBLICATION_FIELDS = [
  'status',
  'publishedAt',
  'scheduledAt',
  'publicationTimezone',
  'scheduledBy',
  'archived',
  'archivedAt',
  'published',
] as const

export const DRAFT_ONLY_HINT =
  'MCP clients can only create and edit drafts; a human editor reviews and publishes in the Studio (open the editUrl).'

/** Returns a tool error when raw arguments try to set publication state. */
export function rejectPublicationFields(rawArgs: unknown): ToolResult | null {
  if (!rawArgs || typeof rawArgs !== 'object' || Array.isArray(rawArgs)) return null
  const present = PUBLICATION_FIELDS.filter((key) => Object.hasOwn(rawArgs, key))
  if (present.length === 0) return null
  return fail(`Refused: ${present.join(', ')} cannot be set through MCP. Nothing was saved.`, {
    code: 'forbidden',
    fields: present,
    hint: DRAFT_ONLY_HINT,
  })
}

// ─── URLs ─────────────────────────────────────────────────────────────────────

export function siteUrl(): string {
  return siteConfig.url.replace(/\/+$/, '')
}

export const EDITABLE_STATUSES: readonly string[] = ['draft', 'in_review']

export const expectedUpdatedAtField = z
  .string()
  .describe('The updatedAt you last read (get_* or the previous write). The edit is refused if the entry changed since.')

// ─── Blocks ───────────────────────────────────────────────────────────────────

export const blockInput = z
  .looseObject({
    type: z.string().min(1).describe('Block type, e.g. "hero-cinema". See list_block_types (pass the right target).'),
    id: z.string().optional().describe('Stable block id. Omit for new blocks: the server assigns one.'),
  })
  .describe('One block. Besides type/id, use the fields documented by get_block_type.')

export const blockList = z.array(blockInput).max(60, 'At most 60 blocks.')

/** Assigns ids to blocks that lack one (or reuse an id already present). */
export function withIds(blocks: readonly Record<string, unknown>[], taken: Set<string> = new Set()): Record<string, unknown>[] {
  return blocks.map((b) => {
    const type = typeof b.type === 'string' ? b.type : 'block'
    let id = typeof b.id === 'string' && b.id.trim() ? b.id.trim() : ''
    if (!id || taken.has(id)) id = newBlockId(type)
    taken.add(id)
    return { ...b, id }
  })
}

export function blockIssuesResult(issues: BlockIssue[], target: BlockTarget = 'page'): ToolResult {
  return fail('Some blocks are invalid. Nothing was saved.', {
    issues,
    hint: `Call list_block_types with target "${target}" and get_block_type for the failing type to see its fields and a valid example.`,
  })
}

/** Catalogue validation plus "is this type offered for `target`" (blocks must already carry ids). */
export function validateBlocksFor(target: BlockTarget, withId: readonly Record<string, unknown>[]): { ok: boolean; blocks: Block[]; issues: BlockIssue[] } {
  return validateBlockListFor(target, withId)
}

/** Assigns ids, validates for `target`, and returns either clean blocks or a tool error. */
export function checkBlocksFor(target: BlockTarget, blocks: readonly Record<string, unknown>[]): { ok: true; blocks: Block[] } | { ok: false; result: ToolResult } {
  const check = validateBlocksFor(target, withIds(blocks))
  if (!check.ok) return { ok: false, result: blockIssuesResult(check.issues, target) }
  return { ok: true, blocks: check.blocks }
}

// ─── Images ───────────────────────────────────────────────────────────────────

/**
 * An image reference: a site-relative path (e.g. "/uploads/x.webp") or an
 * https URL. No other schemes, no protocol-relative URLs.
 */
export const imageUrlField = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\/[^\s]+$/i.test(v), {
    message: 'Use a site path starting with "/" (e.g. a Media library URL) or an https:// URL.',
  })

export const mediaIdField = z.number().int().positive().describe('Media library item id (Studio → Media). Its URL and alt text are used.')

/** Resolves `{ url | mediaId, alt }` to a stored URL + alt; the media item supplies a default alt. */
export async function resolveImage(input: { url?: string | null; mediaId?: number; alt?: string | null }): Promise<
  { ok: true; url: string | null; alt: string | null } | { ok: false; result: ToolResult }
> {
  if (input.mediaId !== undefined) {
    const item = await getMediaItem(input.mediaId)
    if (!item) return { ok: false, result: fail(`Media item ${input.mediaId} not found.`, { hint: 'Pass an existing media id, or an image URL.' }) }
    const mediaAlt = item.altText.id || item.altText.en || null
    return { ok: true, url: item.url, alt: input.alt ?? mediaAlt }
  }
  if (input.url === null) return { ok: true, url: null, alt: input.alt ?? null }
  return { ok: true, url: input.url ?? null, alt: input.alt ?? null }
}

export function zodIssueList(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message }))
}
