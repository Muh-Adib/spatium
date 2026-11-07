/**
 * Pure helpers for the `/api/pages` route handlers: role policy, error → HTTP
 * mapping and which public paths to revalidate after a change. Kept free of
 * Next.js and database imports so they can be unit-tested directly.
 */
import { z } from 'zod'
import type { Capability } from '@/lib/auth/capability-matrix'
import type { BlockIssue } from '@/lib/blocks/catalog'
import { PAGE_STATUSES, type PageStatus } from './page-schema'

/**
 * Capability needed to move a page from `from` to `to`. Going live, leaving
 * the live state or archiving is a publishing decision (`page:publish`);
 * draft ⇄ review is editing (`page:update`). Roles: capability matrix.
 */
export function capabilityForTransition(from: PageStatus, to: PageStatus): Capability {
  if (to === 'published' || to === 'archived' || from === 'published') return 'page:publish'
  return 'page:update'
}

export const pageIdSchema = z.coerce.number().int().positive()
export const pageStatusBodySchema = z.object({ status: z.enum(PAGE_STATUSES) })
export const pageListQuerySchema = z.object({
  status: z.enum(PAGE_STATUSES).optional(),
  q: z.string().trim().max(200).optional(),
})

/** HTTP status for each repository error code. */
export const PAGE_ERROR_STATUS = {
  not_found: 404,
  conflict: 409,
  slug_taken: 409,
  invalid: 422,
  gate: 422,
  forbidden: 403,
} as const

export type PageErrorCodeLike = keyof typeof PAGE_ERROR_STATUS

export type PageErrorBody = {
  error: string
  code: PageErrorCodeLike
  issues?: string[]
  blockIssues?: BlockIssue[]
}

/** Response payload for a repository `PageError`. Never includes stack traces. */
export function pageErrorPayload(err: {
  code: PageErrorCodeLike
  message: string
  details?: { issues?: string[]; blockIssues?: BlockIssue[] }
}): { status: number; body: PageErrorBody } {
  const body: PageErrorBody = { error: err.message, code: err.code }
  if (err.details?.issues?.length) body.issues = err.details.issues
  if (err.details?.blockIssues?.length) body.blockIssues = err.details.blockIssues
  return { status: PAGE_ERROR_STATUS[err.code], body }
}

type PageRef = { slug: string; status: PageStatus } | null | undefined

/**
 * Public paths whose cached HTML is stale after a page changes from `before`
 * to `after` (either may be null for create/delete). A page that is or was
 * published invalidates its URL(s) and the sitemap; drafts touch nothing public.
 */
export function pathsToRevalidate(before: PageRef, after: PageRef): string[] {
  const paths = new Set<string>()
  if (before?.status === 'published') paths.add(`/${before.slug}`)
  if (after?.status === 'published') paths.add(`/${after.slug}`)
  if (paths.size > 0) paths.add('/sitemap.xml')
  return [...paths]
}

/** Case-insensitive title/slug filter for the list endpoint. */
export function matchesPageQuery(page: { title: string; slug: string }, q: string | undefined): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return page.title.toLowerCase().includes(needle) || page.slug.includes(needle)
}
