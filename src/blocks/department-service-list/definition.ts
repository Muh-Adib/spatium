/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const departmentServiceListBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('department-service-list'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  services: z.array(z.any()).optional(),
})

export const departmentServiceListBlock = defineBlock({
  schema: departmentServiceListBlockSchema,
})
