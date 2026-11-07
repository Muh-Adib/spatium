import { PAGE_STATUSES, type PageStatus } from '@/lib/pages/page-schema'

/** Editorial statuses: pages use four; catalogue entries (portfolio, services) also `approved`. */
export type EditorialStatus = PageStatus | 'approved'

export const EDITORIAL_STATUSES: readonly EditorialStatus[] = [...PAGE_STATUSES, 'approved']

export function isEditorialStatus(value: unknown): value is EditorialStatus {
  return typeof value === 'string' && (EDITORIAL_STATUSES as readonly string[]).includes(value)
}
