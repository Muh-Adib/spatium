/**
 * Block Schema Contract (K-2)
 *
 * Validation for every block type. The per-type Zod schemas live next to their
 * renderer in `src/blocks/<type>/definition.ts`; `src/blocks/registry.ts`
 * assembles them into the discriminated union exported here. Used for strict
 * validation of content blocks across pages, portfolios, services
 * and templates (Studio, Delivery API, MCP, publication gate).
 *
 * Server-safe: no React.
 */
import { z } from 'zod'
import { blockUnionSchema } from '@/blocks/registry'
import { MAX_BLOCKS_PER_PAGE } from './primitives'
import { ZOD_ID_ERRORS } from '@/lib/validation/zod-id'

export { BLOCK_SCHEMA_VERSION, MAX_BLOCKS_PER_PAGE, iconNameSchema, safeUrlSchema } from './primitives'
export { splatIdSchema } from '@/blocks/splat-viewer/definition'

// ─── Discriminated Union of All Blocks ────────────────────────────────────────
export const blockSchema = blockUnionSchema

export type Block = z.infer<typeof blockSchema>
export type { BlockType } from '@/blocks/registry'

export const blocksListSchema = z
  .array(blockSchema)
  .max(MAX_BLOCKS_PER_PAGE, `Jumlah blok per halaman tidak boleh melebihi ${MAX_BLOCKS_PER_PAGE}`)

// ─── Block Parser & Validator Helper ──────────────────────────────────────────
export interface ParseBlocksResult {
  ok: boolean
  blocks: Block[]
  issues?: string[]
}

export function parseBlocks(rawInput: unknown): ParseBlocksResult {
  if (!rawInput) {
    return { ok: true, blocks: [] }
  }

  let parsedData: unknown = rawInput
  if (typeof rawInput === 'string') {
    try {
      parsedData = JSON.parse(rawInput)
    } catch (err) {
      console.warn('[blocks] block list is not valid JSON:', err)
      return { ok: false, blocks: [], issues: ['Data blok bukan JSON yang valid. Muat ulang editor lalu coba lagi.'] }
    }
  }

  if (!Array.isArray(parsedData)) {
    return { ok: false, blocks: [], issues: ['Blok harus dikirim sebagai daftar. Muat ulang editor lalu coba lagi.'] }
  }

  // Pre-normalize legacy Strapi '__component' to 'type'
  const normalized = parsedData.map((b: any) => {
    if (b && typeof b === 'object' && !b.type && b.__component) {
      return { ...b, type: b.__component }
    }
    return b
  })

  const result = blocksListSchema.safeParse(normalized, { error: ZOD_ID_ERRORS })
  if (!result.success) {
    // `Blok 2, kolom title: …` (1-based, like the editor's block list).
    const issues = result.error.issues.map((iss) => {
      const [index, ...field] = iss.path
      if (typeof index !== 'number') return `Daftar blok: ${iss.message}`
      return `Blok ${index + 1}${field.length ? `, kolom ${field.map(String).join('.')}` : ''}: ${iss.message}`
    })
    return { ok: false, blocks: [], issues }
  }

  return { ok: true, blocks: result.data }
}
