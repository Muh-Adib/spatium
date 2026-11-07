/** Data-bound block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { overrideTextSchema, safeUrlSchema } from '@/lib/blocks/primitives'
import { DATA_BOUND_NOTE, eyebrowField, headingField } from '../entity-fields'

export const entityCtaBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('entity-cta'),
  eyebrow: overrideTextSchema(120),
  heading: overrideTextSchema(300),
  body: overrideTextSchema(1000),
  primaryLabel: overrideTextSchema(80),
  primaryHref: safeUrlSchema.optional(),
  secondaryLabel: overrideTextSchema(80),
  secondaryHref: safeUrlSchema.optional(),
})

export type EntityCtaBlockData = z.output<typeof entityCtaBlockSchema>

export const entityCtaBlock = defineBlock({
  schema: entityCtaBlockSchema,
  dataBound: true,
  catalog: [
    {
      type: 'entity-cta',
      label: 'CTA halaman entri',
      description: `Ajakan penutup dengan judul dari nama entri (mis. "Diskusikan proyek Filmmaking Anda."). ${DATA_BOUND_NOTE}`,
      category: 'conversion',
      targets: ['service-category', 'service', 'portfolio'],
      fields: [
        eyebrowField('sesuai jenis entri'),
        headingField('sesuai nama entri'),
        { key: 'body', label: 'Isi', kind: 'textarea', help: 'Kosongkan untuk teks bawaan.' },
        { key: 'primaryLabel', label: 'Teks tombol utama', kind: 'text' },
        { key: 'primaryHref', label: 'URL tombol utama', kind: 'url', help: 'Bawaan: /contact.' },
        { key: 'secondaryLabel', label: 'Teks tombol kedua', kind: 'text' },
        { key: 'secondaryHref', label: 'URL tombol kedua', kind: 'url' },
      ],
      example: { type: 'entity-cta' },
    },
  ],
})
