/**
 * Rendering rules shared by the public `/<slug>` route and the Studio preview,
 * so both show a page exactly the same way. Safe for client and server.
 */
import { BLOCK_CATALOG } from '@/lib/blocks/catalog'

/** Block types that render their own `<h1>` hero (catalogue heroes + legacy ones still stored). */
const HERO_TYPES: ReadonlySet<string> = new Set([
  ...BLOCK_CATALOG.filter((e) => e.category === 'hero').map((e) => e.type),
  'hero-department',
  'hero-service',
  'hero-solution',
  'hero-case-study',
  'blocks.hero',
])

/** True when the first block already provides the page heading (so no fallback title is rendered). */
export function startsWithHero(blocks: readonly unknown[]): boolean {
  const first = blocks[0]
  if (!first || typeof first !== 'object') return false
  const type = (first as { type?: unknown }).type
  return typeof type === 'string' && HERO_TYPES.has(type)
}

export type PageRobots = { index: boolean; follow: boolean }

export function parseRobots(value: string | null | undefined): PageRobots {
  const v = (value ?? '').toLowerCase()
  return { index: !v.includes('noindex'), follow: !v.includes('nofollow') }
}
