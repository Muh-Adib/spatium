/**
 * Studio role matrix — the single list of which role may do what.
 *
 * Pure and client-safe: API routes enforce it through `requireCan`
 * (`src/lib/auth/capabilities.ts`), the Studio UI hides actions with `can()`
 * (via `useAuth().can`), and `ROLE_PERMISSIONS` (article workflow) is derived
 * from it. Do not write role lists anywhere else; add a capability here.
 *
 * Principles:
 * - Deleting content: SUPER_ADMIN and CONTENT_ADMIN.
 * - Publishing (articles, pages, catalog): SUPER_ADMIN, CONTENT_ADMIN, EDITOR.
 *   REVIEWER approves articles, AUTHOR submits them for review.
 * - A role that owns a domain may also delete inside it: SEO_MANAGER for
 *   redirects, MEDIA_MANAGER for the media library.
 * - Users, site settings, MCP keys and system actions: SUPER_ADMIN, CONTENT_ADMIN.
 */
import type { Role } from './types'

export const ALL_ROLES = [
  'SUPER_ADMIN',
  'CONTENT_ADMIN',
  'EDITOR',
  'AUTHOR',
  'REVIEWER',
  'SEO_MANAGER',
  'MEDIA_MANAGER',
] as const satisfies readonly Role[]

const ADMINS = ['SUPER_ADMIN', 'CONTENT_ADMIN'] as const satisfies readonly Role[]
const PUBLISHERS = [...ADMINS, 'EDITOR'] as const satisfies readonly Role[]
const WRITERS = [...PUBLISHERS, 'AUTHOR'] as const satisfies readonly Role[]
const SEO_ROLES = [...PUBLISHERS, 'SEO_MANAGER'] as const satisfies readonly Role[]
const MEDIA_ROLES = [...PUBLISHERS, 'MEDIA_MANAGER'] as const satisfies readonly Role[]

export const CAPABILITY_ROLES = {
  // Articles (editorial workflow, see validateStatusTransition)
  /** Read editorial content in the Studio (everyone except the media-only role). */
  'article:read': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER', 'SEO_MANAGER'],
  'article:create': WRITERS,
  /** Edit own drafts (AUTHOR) or any draft (see `article:update-any`). */
  'article:update': WRITERS,
  'article:update-any': PUBLISHERS,
  'article:submit': WRITERS,
  /** Review: approve or send back to draft. */
  'article:review': [...PUBLISHERS, 'REVIEWER'],
  /** Publish, schedule, unpublish and archive. */
  'article:publish': PUBLISHERS,
  'article:delete': ADMINS,

  // Article categories
  'article-category:create': WRITERS,
  'article-category:update': PUBLISHERS,
  'article-category:delete': ADMINS,

  // Dynamic pages
  'page:create': PUBLISHERS,
  'page:update': PUBLISHERS,
  /** Publish, unpublish and archive. */
  'page:publish': PUBLISHERS,
  'page:delete': ADMINS,

  // Catalog
  'portfolio:create': PUBLISHERS,
  'portfolio:update': PUBLISHERS,
  'portfolio:publish': PUBLISHERS,
  'portfolio:delete': ADMINS,
  'service:create': PUBLISHERS,
  'service:update': PUBLISHERS,
  'service:publish': PUBLISHERS,
  'service:delete': ADMINS,
  'service-category:create': PUBLISHERS,
  'service-category:update': PUBLISHERS,
  'service-category:publish': PUBLISHERS,
  'service-category:delete': ADMINS,

  // Reusable content
  'client:manage': PUBLISHERS,
  'client:delete': ADMINS,
  'cta:manage': PUBLISHERS,
  'cta:delete': ADMINS,
  'template:create': PUBLISHERS,
  'template:update': PUBLISHERS,
  'template:delete': ADMINS,

  // Media
  /** Upload images through the picker (authors need it for their own articles). */
  'media:upload': [...MEDIA_ROLES, 'AUTHOR'],
  /** Library: upload, edit metadata, rename, optimise. */
  'media:manage': MEDIA_ROLES,
  'media:delete': [...ADMINS, 'MEDIA_MANAGER'],

  // SEO
  /** Audit, PageSpeed, indexing, IndexNow, keyword bank, Search Console sync. */
  'seo:manage': SEO_ROLES,
  'redirect:manage': SEO_ROLES,
  'redirect:delete': [...ADMINS, 'SEO_MANAGER'],

  // Governance
  'user:manage': ADMINS,
  'settings:manage': ADMINS,
  'mcp:manage': ADMINS,
  'theme:manage': ADMINS,
  /** Flush the cache from the Studio, system maintenance actions. */
  'system:manage': ADMINS,
} as const satisfies Record<string, readonly Role[]>

export type Capability = keyof typeof CAPABILITY_ROLES

export const CAPABILITIES = Object.keys(CAPABILITY_ROLES) as Capability[]

export function rolesFor(capability: Capability): readonly Role[] {
  return CAPABILITY_ROLES[capability]
}

/** Whether `role` holds `capability`. Unknown or missing roles hold nothing. */
export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false
  return (CAPABILITY_ROLES[capability] as readonly Role[]).includes(role)
}

/** Every capability `role` holds, in matrix order. */
export function capabilitiesFor(role: Role | null | undefined): Capability[] {
  return CAPABILITIES.filter((capability) => can(role, capability))
}

export const isCapability = (v: unknown): v is Capability =>
  typeof v === 'string' && Object.hasOwn(CAPABILITY_ROLES, v)
