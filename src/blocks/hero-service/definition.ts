/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'
import { safeUrlSchema } from '@/lib/blocks/primitives'

export const heroServiceBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('hero-service'),
    title: z.string().max(300).optional(),
    name: z.string().max(300).optional(),
    subtitle: z.string().max(1000).optional(),
    badge: z.string().max(100).optional(),
    indexNumber: z.string().max(50).optional(),
    categoryBadge: z.string().max(100).optional(),
    categorySlug: z.string().max(100).optional(),
    department: z.string().max(200).optional(),
    headline: z.string().max(300).optional(),
    tagline: z.string().max(500).optional(),
    highlightWord: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    whatsappPrompt: z.string().max(500).optional(),
    deliveryModel: z.string().max(100).optional(),
    timeline: z.string().max(100).optional(),
    technologies: z.array(z.string().max(100)).optional().default([]),
    keyDeliverables: z.array(z.string().max(200)).optional().default([]),
    heroImage: z.string().optional(),
    primaryMedia: z
      .object({
        type: z.string().optional(),
        imageUrl: z.string().optional(),
        altText: z.string().max(300).optional(),
        badgeText: z.string().max(100).optional(),
      })
      .optional(),
    metrics: z
      .array(
        z.object({
          label: z.string().max(100),
          value: z.string().max(100),
          detail: z.string().max(200).optional(),
        })
      )
      .optional()
      .default([]),
    cta: z
      .object({
        primaryLabel: z.string().max(100).optional(),
        primaryUrl: safeUrlSchema.optional(),
        secondaryLabel: z.string().max(100).optional(),
        secondaryUrl: safeUrlSchema.optional(),
      })
      .optional(),
    pricing: z
      .object({
        startingAt: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.title || data.name), {
    message: 'hero-service harus memiliki title atau name',
  })

export const heroServiceBlock = defineBlock({
  schema: heroServiceBlockSchema,
  pageHero: true,
})
