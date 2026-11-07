/**
 * Entity render context for data-bound blocks. The view models live in
 * `@/lib/content/spatium-types`; this narrows them per entity kind.
 */
import type { EntityContext, EntityKind } from '@/lib/content/spatium-types'

export type { EntityContext, EntityKind } from '@/lib/content/spatium-types'

/** The entity context of one kind. */
export type EntityOf<K extends EntityKind> = Extract<EntityContext, { kind: K }>

export function isEntityOf<K extends EntityKind>(entity: EntityContext | undefined, kinds: readonly K[]): entity is EntityOf<K> {
  return entity !== undefined && (kinds as readonly EntityKind[]).includes(entity.kind)
}
