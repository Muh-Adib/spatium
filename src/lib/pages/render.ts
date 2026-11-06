/**
 * Rendering rules shared by the public `/<slug>` route and the Studio preview,
 * so both show a page exactly the same way. Safe for client and server.
 */
import { PAGE_HERO_TYPES } from '@/blocks/registry'

/** True when the first block already provides the page heading (so no fallback title is rendered). */
export function startsWithHero(blocks: readonly unknown[]): boolean {
  const first = blocks[0]
  if (!first || typeof first !== 'object') return false
  const type = (first as { type?: unknown }).type
  return typeof type === 'string' && PAGE_HERO_TYPES.has(type)
}

export type PageRobots = { index: boolean; follow: boolean }

export function parseRobots(value: string | null | undefined): PageRobots {
  const v = (value ?? '').toLowerCase()
  return { index: !v.includes('noindex'), follow: !v.includes('nofollow') }
}
