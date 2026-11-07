import { getBlockEntry } from '@/lib/blocks/catalog'

/**
 * Shown for a data-bound block rendered without its entity (e.g. the Studio
 * manager's block-only preview). Public pages always pass the entity, so this
 * never appears on the site.
 */
export function EntityBlockPlaceholder({ type }: { type: string }) {
  const label = getBlockEntry(type)?.label ?? type
  return (
    <section className="section section--tight" data-entity-placeholder={type}>
      <div className="container container--wide">
        <p className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-neutral-300">
          <strong className="text-white">{label}</strong> menampilkan data entri ini. Buka pratinjau halaman untuk melihat isinya.
        </p>
      </div>
    </section>
  )
}
