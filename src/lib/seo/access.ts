/**
 * Roles allowed to run SEO tooling that costs external quota or makes the
 * server fetch URLs (site crawl, PageSpeed, IndexNow / URL inspection).
 * Derived from `canManageSeo` so the role matrix stays the single source.
 */
import { ROLE_PERMISSIONS, type Role } from '@/lib/auth/types'

export const SEO_TOOL_ROLES: Role[] = (Object.keys(ROLE_PERMISSIONS) as Role[]).filter(
  (role) => ROLE_PERMISSIONS[role].canManageSeo,
)
