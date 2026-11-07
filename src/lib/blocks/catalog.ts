/**
 * SPATIUM block catalogue — what editors and machine clients (MCP) are offered.
 *
 * Block types are defined one per module in `src/blocks/<type>/definition.ts`
 * and listed once in `src/blocks/registry.ts`; this module derives the
 * catalogue from that registry and adds the helpers built on it. Validation
 * lives in `./schema` (Zod). Each entry carries a label, a description, a
 * category, the canonical fields to edit and a valid example payload. The page
 * editor palette, the generated property forms, `/api/blocks/manifest` and the
 * MCP tools all read from here — never from a hand-written list.
 *
 * Schemas accept several legacy alias fields (e.g. `headline` / `title`). The
 * `fields` declared here are the canonical ones new content should use.
 *
 * Safe to import from client and server code (no React, no server-only dependencies).
 */
import { z } from 'zod'
import { BLOCK_TYPES, CATALOG_ENTRIES } from '@/blocks/registry'
import type { BlockCatalogEntry, BlockTarget } from './define'
import { blockSchema, parseBlocks, type Block } from './schema'

export {
  BLOCK_CATEGORY_LABEL,
  type BlockCatalogEntry,
  type BlockCategory,
  type BlockField,
  type BlockFieldKind,
  type BlockTarget,
} from './define'

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = CATALOG_ENTRIES

const BY_TYPE = new Map(BLOCK_CATALOG.map((e) => [e.type, e]))

/** Every type the validator accepts (catalogue + legacy types that still render). */
const KNOWN_TYPES: ReadonlySet<string> = new Set(BLOCK_TYPES)

export function getBlockEntry(type: string): BlockCatalogEntry | undefined {
  return BY_TYPE.get(type)
}

/** Blocks offered in editors / to MCP for a target. Legacy types stay renderable but are not offered. */
export function listBlocksFor(target: BlockTarget): BlockCatalogEntry[] {
  return BLOCK_CATALOG.filter((e) => e.targets.includes(target))
}

/** JSON Schema (draft 2020-12) of a block's accepted input, for MCP clients. */
export function blockJsonSchema(type: string): Record<string, unknown> | null {
  const entry = BY_TYPE.get(type)
  if (!entry) return null
  return z.toJSONSchema(entry.schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>
}

let idCounter = 0
/** Stable-enough unique id for a new block (client or server). */
export function newBlockId(type: string): string {
  idCounter = (idCounter + 1) % 1_000_000
  const rand = Math.random().toString(36).slice(2, 8)
  return `${type}-${Date.now().toString(36)}-${idCounter.toString(36)}${rand}`
}

/** A new block of `type`, pre-filled with the catalogue example. */
export function createBlock(type: string): Block | null {
  const entry = BY_TYPE.get(type)
  if (!entry) return null
  const candidate = { ...structuredClone(entry.example), id: newBlockId(type) }
  const parsed = blockSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

/** Where a block list lives, as named in Studio copy. */
const TARGET_LABEL: Record<BlockTarget, string> = {
  page: 'halaman',
  portfolio: 'portofolio',
  service: 'layanan',
  'service-category': 'kategori layanan',
}

export type BlockIssue = { index: number; blockId?: string; type?: string; message: string }

/**
 * Validates a block list and returns per-block issues the editor (and MCP)
 * can point at. Unknown types and schema failures are both reported.
 */
export function validateBlockList(raw: unknown): { ok: boolean; blocks: Block[]; issues: BlockIssue[] } {
  const parsed = parseBlocks(raw)
  if (parsed.ok) return { ok: true, blocks: parsed.blocks, issues: [] }
  const list: unknown[] = Array.isArray(raw) ? raw : []
  const issues: BlockIssue[] = []
  list.forEach((item, index) => {
    const rec = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const type = typeof rec.type === 'string' ? rec.type : undefined
    const blockId = typeof rec.id === 'string' ? rec.id : undefined
    if (type && !KNOWN_TYPES.has(type)) {
      issues.push({ index, blockId, type, message: `Tipe blok "${type}" tidak dikenal. Hapus blok ini atau ganti dengan blok dari katalog.` })
      return
    }
    if (!type) {
      issues.push({ index, blockId, message: 'Blok ini tidak punya tipe. Hapus blok ini lalu tambahkan lagi dari katalog.' })
      return
    }
    const one = blockSchema.safeParse(item)
    if (!one.success) {
      for (const iss of one.error.issues) {
        // `path: message` — the editor splits on it and humanizes Zod's wording (blocks/model.ts).
        const where = iss.path.length ? `${iss.path.join('.')}: ` : ''
        issues.push({ index, blockId, type, message: `${where}${iss.message}` })
      }
    }
  })
  if (issues.length === 0) {
    for (const message of parsed.issues ?? ['Daftar blok tidak valid. Muat ulang editor lalu coba lagi.']) issues.push({ index: -1, message })
  }
  return { ok: false, blocks: [], issues }
}

/**
 * `validateBlockList` plus "is this catalogue type offered for `target`"
 * (e.g. `category-hero` only on service categories). Legacy types without a
 * catalogue entry stay accepted so stored content keeps saving.
 */
export function validateBlockListFor(target: BlockTarget, raw: unknown): { ok: boolean; blocks: Block[]; issues: BlockIssue[] } {
  const check = validateBlockList(raw)
  const issues: BlockIssue[] = [...check.issues]
  const list: unknown[] = Array.isArray(raw) ? raw : []
  list.forEach((item, index) => {
    const rec = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const type = typeof rec.type === 'string' ? rec.type : undefined
    const entry = type ? BY_TYPE.get(type) : undefined
    if (entry && !entry.targets.includes(target)) {
      issues.push({
        index,
        blockId: typeof rec.id === 'string' ? rec.id : undefined,
        type,
        message: `Blok "${type}" tidak tersedia untuk ${TARGET_LABEL[target]}. Hapus blok ini atau ganti dengan blok yang tersedia.`,
      })
    }
  })
  return { ok: check.ok && issues.length === 0, blocks: issues.length === 0 ? check.blocks : [], issues }
}
