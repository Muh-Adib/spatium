/**
 * Capability-Based Authorization Contract (K-1)
 *
 * Implements fine-grained capability checks (ADR-0014) mapped to
 * current RBAC roles until full permission tables ship in G2.
 */
import type { NextRequest } from 'next/server'
import { requireRole, AuthResult } from './rbac'
import type { Role } from './types'

export type Capability =
  | 'article:create'
  | 'article:update'
  | 'article:delete'
  | 'article:publish'
  | 'service:create'
  | 'service:update'
  | 'service:delete'
  | 'service:publish'
  | 'category:create'
  | 'category:update'
  | 'category:delete'
  | 'template:create'
  | 'template:update'
  | 'template:delete'
  | 'template:manage'
  | 'portfolio:create'
  | 'portfolio:update'
  | 'portfolio:delete'
  | 'landing:manage'
  | 'cta:manage'
  | 'redirect:manage'
  | 'seo:manage'
  | 'media:manage'
  | 'system:manage'
  | 'theme:manage'
  | 'catalog:publish'

const CAPABILITY_ROLE_MAP: Record<Capability, Role[]> = {
  'article:create': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'AUTHOR'],
  'article:update': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'AUTHOR'],
  'article:delete': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'article:publish': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],

  'service:create': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'service:update': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'service:delete': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  'service:publish': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],

  'category:create': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'category:update': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'category:delete': ['SUPER_ADMIN', 'CONTENT_ADMIN'],

  'template:create': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'template:update': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'template:delete': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  'template:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],

  'portfolio:create': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'portfolio:update': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'portfolio:delete': ['SUPER_ADMIN', 'CONTENT_ADMIN'],

  'landing:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'cta:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  'redirect:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'SEO_MANAGER'],
  'seo:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'SEO_MANAGER'],
  'media:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR', 'MEDIA_MANAGER'],
  'system:manage': ['SUPER_ADMIN'],
  'theme:manage': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  'catalog:publish': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
}

export async function requireCan(request: NextRequest, capability: Capability): Promise<AuthResult> {
  const allowedRoles = CAPABILITY_ROLE_MAP[capability] || ['SUPER_ADMIN']
  return requireRole(request, allowedRoles)
}
