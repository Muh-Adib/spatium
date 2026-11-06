/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const caseStudyChapterBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('case-study-chapter'),
  chapterNumber: z.string().max(50).optional(),
  title: z.string().max(300),
  subtitle: z.string().max(300).optional(),
  content: z.string().max(20000),
})

export const caseStudyChapterBlock = defineBlock({
  schema: caseStudyChapterBlockSchema,
})
