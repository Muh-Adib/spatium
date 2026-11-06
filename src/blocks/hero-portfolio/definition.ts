/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { defineBlock } from '@/lib/blocks/define'

export const heroCaseStudyBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-case-study'),
  title: z.string().max(500).optional(),
  headline: z.string().max(500).optional(),
  client: z.string().max(300).optional(),
  year: z.union([z.number(), z.string()]).optional(),
  category: z.string().max(200).optional(),
  discipline: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  heroImage: z.string().optional(),
  posterUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  statusBadge: z.string().optional(),
  primaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  secondaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  data: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const heroCaseStudyBlock = defineBlock({
  schema: heroCaseStudyBlockSchema,
  pageHero: true,
})

export const heroPortfolioBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-portfolio'),
  title: z.string().max(500).optional(),
  headline: z.string().max(500).optional(),
  client: z.string().max(300).optional(),
  year: z.union([z.number(), z.string()]).optional(),
  category: z.string().max(200).optional(),
  discipline: z.string().max(200).optional(),
  summary: z.string().max(5000).optional(),
  heroImage: z.string().optional(),
  posterUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  statusBadge: z.string().optional(),
  primaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  secondaryCta: z.object({ label: z.string().optional(), href: z.string().optional() }).optional(),
  data: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const heroPortfolioBlock = defineBlock({
  schema: heroPortfolioBlockSchema,
  catalog: [
    {
      type: 'hero-portfolio',
      label: 'Hero studi kasus',
      description: 'Header halaman portofolio.',
      category: 'hero',
      targets: ['portfolio'],
      fields: [
        { key: 'title', label: 'Judul', kind: 'text', required: true },
        { key: 'summary', label: 'Ringkasan', kind: 'textarea' },
        { key: 'client', label: 'Klien / venue', kind: 'text' },
        { key: 'category', label: 'Kategori', kind: 'text' },
      ],
      example: { type: 'hero-portfolio', title: 'Judul studi kasus', summary: 'Ringkasan singkat proyek.' },
      aliases: { title: ['headline'] },
    },
  ],
  pageHero: true,
})
