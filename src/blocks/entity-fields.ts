/**
 * Field descriptors shared by the data-bound entity blocks
 * (`category-*`, `service-*`, `portfolio-*`, `entity-cta`). Server-safe: no React.
 */
import type { BlockField } from '@/lib/blocks/define'

export const eyebrowField = (fallback: string): BlockField => ({
  key: 'eyebrow',
  label: 'Eyebrow',
  kind: 'text',
  help: `Kosongkan untuk teks bawaan: ${fallback}`,
})

export const headingField = (fallback: string): BlockField => ({
  key: 'heading',
  label: 'Judul bagian',
  kind: 'text',
  help: `Kosongkan untuk judul bawaan: ${fallback}`,
})

export const ledeField = (fallback: string): BlockField => ({
  key: 'lede',
  label: 'Pengantar',
  kind: 'textarea',
  help: `Kosongkan untuk teks bawaan: ${fallback}`,
})

export const limitField = (what: string): BlockField => ({
  key: 'limit',
  label: `Jumlah ${what} maksimum`,
  kind: 'number',
  help: 'Kosongkan untuk jumlah bawaan blok.',
})

export const toggleField = (key: string, label: string, help?: string): BlockField => ({ key, label, kind: 'boolean', help })

/** Appended to every data-bound block description. */
export const DATA_BOUND_NOTE = 'Isi diambil otomatis dari data entri; blok hanya menyimpan opsi tampilan.'
