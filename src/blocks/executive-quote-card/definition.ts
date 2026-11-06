/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const executiveQuoteCardBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('executive-quote-card'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  quote: z.string().max(2000),
  author: z.string().max(150).optional(),
  role: z.string().max(150).optional(),
  company: z.string().max(150).optional(),
  badge: z.string().max(100).optional(),
})

export const executiveQuoteCardBlock = defineBlock({
  schema: executiveQuoteCardBlockSchema,
})
