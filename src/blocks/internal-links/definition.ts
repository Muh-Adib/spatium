/** Block definition (schema + catalogue metadata). Server-safe: no React. */
import { z } from 'zod'
import { ALL_TARGETS, defineBlock } from '@/lib/blocks/define'

export const internalLinksBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('internal-links'),
  title: z.string().max(300).optional(),
  links: z.array(
    z.object({
      title: z.string().max(300).optional(),
      text: z.string().max(300).optional(),
      name: z.string().max(300).optional(),
      href: z.string().max(1000).optional(),
      url: z.string().max(1000).optional(),
      slug: z.string().max(300).optional(),
      description: z.string().max(1000).optional(),
      excerpt: z.string().max(1000).optional(),
    }).passthrough()
  ).default([]),
}).passthrough()

export const internalLinksBlock = defineBlock({
  schema: internalLinksBlockSchema,
  catalog: [
    {
      type: 'internal-links',
      label: 'Tautan terkait',
      description: 'Daftar tautan ke halaman lain di situs.',
      category: 'navigation',
      targets: ALL_TARGETS,
      fields: [
        { key: 'title', label: 'Judul', kind: 'text' },
        {
          key: 'links',
          label: 'Tautan',
          kind: 'list',
          itemLabel: 'Tautan',
          max: 12,
          fields: [
            { key: 'title', label: 'Teks', kind: 'text', required: true },
            { key: 'href', label: 'URL', kind: 'url', required: true },
            { key: 'description', label: 'Deskripsi', kind: 'text' },
          ],
        },
      ],
      example: {
        type: 'internal-links',
        title: 'Jelajahi lebih lanjut',
        links: [
          { title: 'Semua layanan', href: '/services' },
          { title: 'Portofolio', href: '/portfolio' },
        ],
      },
      aliases: { 'links.title': ['text', 'name'], 'links.href': ['url'] },
    },
  ],
})
