/**
 * Building blocks for block definitions.
 *
 * Every block type lives in its own module, `src/blocks/<type>/definition.ts`,
 * created with `defineBlock()`: the Zod schema (validation), the catalogue
 * metadata offered to the editor and MCP (label, category, fields, example),
 * and the legacy alias keys the editor form reads. `src/blocks/registry.ts`
 * collects the definitions; `./schema` and `./catalog` derive everything else
 * from that registry.
 *
 * Types and constants only — safe to import from client and server code.
 */
import type { z } from 'zod'

/**
 * Where a block may be placed. `page` = dynamic pages at `/<slug>`;
 * `service-category` = use-case pages at `/services/<slug>`; `service` = child
 * service pages at `/services/<category>/<slug>`; `portfolio` = `/portfolio/<slug>`.
 */
export type BlockTarget = 'page' | 'service-category' | 'service' | 'portfolio'

/** Targets whose page is an entity (data-bound blocks read the entity from the render context). */
export type EntityTarget = Exclude<BlockTarget, 'page'>
export const ENTITY_TARGETS: readonly EntityTarget[] = ['service-category', 'service', 'portfolio']

export type BlockCategory = 'hero' | 'spatial' | 'content' | 'media' | 'proof' | 'conversion' | 'navigation'

export const BLOCK_CATEGORY_LABEL: Record<BlockCategory, string> = {
  hero: 'Hero',
  spatial: 'Spasial',
  content: 'Konten',
  media: 'Media',
  proof: 'Bukti & data',
  conversion: 'Konversi',
  navigation: 'Navigasi',
}

/** Every target: the default for blocks usable anywhere. */
export const ALL_TARGETS: readonly BlockTarget[] = ['page', 'service-category', 'service', 'portfolio']

/** Editable field description used to generate property forms and MCP docs. */
export type BlockField =
  | { key: string; label: string; kind: 'text' | 'textarea' | 'url' | 'number' | 'boolean'; help?: string; required?: boolean; max?: number }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[]; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'image'; altKey: string; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'link'; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'stringList'; itemLabel: string; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'list'; itemLabel: string; fields: BlockField[]; help?: string; required?: boolean; max?: number }
  /** Rows of strings (`string[][]`); the column headings come from the stringList at `columnsKey`. */
  | { key: string; label: string; kind: 'table'; columnsKey: string; help?: string; required?: boolean; max?: number }

export type BlockFieldKind = BlockField['kind']

/** Catalogue metadata a definition declares for one type it offers to editors and MCP. */
export interface BlockCatalogMeta<T extends string = string> {
  type: T
  label: string
  description: string
  category: BlockCategory
  targets: readonly BlockTarget[]
  fields: readonly BlockField[]
  /** A valid, honest starter payload (no invented metrics, clients or quotes). */
  example: Record<string, unknown> & { type: T }
  /**
   * Legacy alias keys for canonical fields (the schema still accepts them).
   * The form reads the canonical key first, then these; writing the canonical
   * key drops them. Keyed by field path without list indices, e.g.
   * `{ 'links.href': ['url'] }`.
   */
  aliases?: Readonly<Record<string, readonly string[]>>
}

/** A catalogue entry as exposed by `@/lib/blocks/catalog` (metadata + its schema). */
export interface BlockCatalogEntry extends BlockCatalogMeta {
  schema: z.ZodType
}

/** A Zod object schema usable as a member of the block union (its `type` is a literal or an enum). */
export type BlockMemberSchema = z.ZodType & z.core.$ZodTypeDiscriminable & { shape: { type: z.ZodType<string> } }

/** Block type strings accepted by a member schema. */
export type TypesOf<S extends BlockMemberSchema> = z.output<S['shape']['type']>

export interface BlockDefinition<S extends BlockMemberSchema = BlockMemberSchema> {
  /** Validation for every type this module owns; its `type` field lists them. */
  schema: S
  /** Types offered in the palette / MCP. Omit for legacy types that only need to keep validating and rendering. */
  catalog?: readonly BlockCatalogMeta<TypesOf<S>>[]
  /** True when the block renders the page's own `<h1>` hero, so pages skip their fallback title. */
  pageHero?: boolean
  /**
   * Data-bound block: renders the entity of its catalogue targets from the
   * render context (the block JSON only holds presentation options). A stored
   * list containing one is "explicit" (see `resolveEntityBlocks` in
   * `src/blocks/presets.ts`).
   */
  dataBound?: boolean
}

/** Identity helper that type-checks a definition (catalogue types must belong to the schema). */
export function defineBlock<S extends BlockMemberSchema>(definition: BlockDefinition<S>): BlockDefinition<S> {
  return definition
}

/** The `type` strings a member schema accepts (from its literal or enum). */
export function schemaTypes(schema: BlockMemberSchema): string[] {
  const t: unknown = schema.shape.type
  if (t && typeof t === 'object') {
    if ('options' in t && Array.isArray(t.options)) return t.options.filter((o): o is string => typeof o === 'string')
    if ('value' in t && typeof t.value === 'string') return [t.value]
  }
  return []
}
