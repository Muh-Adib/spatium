/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const portfolioProofGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-proof-grid'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  portfolios: z.array(z.any()).optional().default([]),
  portfolioIds: z.array(z.any()).optional(),
})

export const portfolioProofGridBlock = defineBlock({
  schema: portfolioProofGridBlockSchema,
  catalog: [
    {
      type: 'portfolio-proof-grid',
      label: 'Grid portofolio',
      description: 'Menampilkan scene portofolio dari database. Kosongkan pilihan untuk menampilkan yang terbaru.',
      category: 'proof',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        { key: 'description', label: 'Deskripsi', kind: 'textarea' },
        { key: 'category', label: 'Filter kategori', kind: 'text', help: 'Opsional, mis. fnb, hospitality, property.' },
      ],
      example: { type: 'portfolio-proof-grid', title: 'Captured spaces, ready to explore' },
    },
  ],
})
