/**
 * SPATIUM block catalogue — the single source of truth for block types.
 *
 * Validation lives in `./schema` (Zod). This module adds what editors and
 * machine clients (MCP) need on top of it: a label, a description, a category,
 * the canonical fields to edit, and a valid example payload. The page editor
 * palette, the generated property forms, `/api/blocks/manifest` and the MCP
 * tools all read from here — never from a hand-written list.
 *
 * Schemas accept several legacy alias fields (e.g. `headline` / `title`). The
 * `fields` declared here are the canonical ones new content should use.
 *
 * Safe to import from client and server code (no server-only dependencies).
 */
import { z } from 'zod'
import {
  blockSchema,
  parseBlocks,
  splatViewerBlockSchema,
  heroCinemaBlockSchema,
  textEditorialBlockSchema,
  editorialParagraphBlockSchema,
  editorialHeadingBlockSchema,
  processTimelineBlockSchema,
  featureBentoGridBlockSchema,
  mediaShowcaseBlockSchema,
  visualShowcaseGalleryBlockSchema,
  portfolioProofGridBlockSchema,
  statsTickerBlockSchema,
  faqAccordionBlockSchema,
  tableBlockSchema,
  internalLinksBlockSchema,
  interactiveCtaBlockSchema,
  studioCtaBlockSchema,
  deliverablesChecklistBlockSchema,
  workflowPhasesBlockSchema,
  heroPortfolioBlockSchema,
  portfolioCaseStudyBlockSchema,
  type Block,
} from './schema'

/** Where a block may be placed. `page` = dynamic pages at `/<slug>`. */
export type BlockTarget = 'page' | 'portfolio' | 'service' | 'solution'

export type BlockCategory = 'hero' | 'spatial' | 'content' | 'media' | 'proof' | 'conversion' | 'navigation'

export const BLOCK_CATEGORY_LABEL: Record<BlockCategory, string> = {
  hero: 'Hero',
  spatial: 'Spasial',
  content: 'Konten',
  media: 'Media',
  proof: 'Bukti & data',
  conversion: 'Konversi',
  navigation: 'Navigasi',
}

/** Editable field description used to generate property forms and MCP docs. */
export type BlockField =
  | { key: string; label: string; kind: 'text' | 'textarea' | 'url' | 'number' | 'boolean'; help?: string; required?: boolean; max?: number }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[]; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'image'; altKey: string; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'link'; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'stringList'; itemLabel: string; help?: string; required?: boolean }
  | { key: string; label: string; kind: 'list'; itemLabel: string; fields: BlockField[]; help?: string; required?: boolean; max?: number }
  /** Rows of strings (`string[][]`); the column headings come from the stringList at `columnsKey`. */
  | { key: string; label: string; kind: 'table'; columnsKey: string; help?: string; required?: boolean; max?: number }

export interface BlockCatalogEntry {
  type: string
  label: string
  description: string
  category: BlockCategory
  targets: readonly BlockTarget[]
  schema: z.ZodType
  fields: readonly BlockField[]
  /** A valid, honest starter payload (no invented metrics, clients or quotes). */
  example: Record<string, unknown>
}

const ALL: readonly BlockTarget[] = ['page', 'portfolio', 'service', 'solution']

const linkFields = (prefix: string, label: string): BlockField => ({ key: prefix, label, kind: 'link' })

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = [
  {
    type: 'hero-cinema',
    label: 'Hero sinematik',
    description: 'Pembuka halaman: badge, headline besar, subjudul, dua tombol aksi, dan media opsional.',
    category: 'hero',
    targets: ALL,
    schema: heroCinemaBlockSchema,
    fields: [
      { key: 'badge', label: 'Badge', kind: 'text', max: 200 },
      { key: 'headline', label: 'Headline', kind: 'text', required: true, max: 500 },
      { key: 'subheadline', label: 'Subjudul', kind: 'textarea', max: 1000 },
      linkFields('primaryCta', 'Tombol utama'),
      linkFields('secondaryCta', 'Tombol kedua'),
    ],
    example: {
      type: 'hero-cinema',
      badge: 'Spatial Technology Studio',
      headline: 'Real places. New perspectives.',
      subheadline: 'Digital twin untuk industri kreatif — ruang nyata yang bisa dijelajahi dari mana saja.',
      primaryCta: { label: 'Mulai proyek', href: '/contact' },
      secondaryCta: { label: 'Lihat portofolio', href: '/portfolio' },
    },
  },
  {
    type: 'splat-viewer',
    label: 'Viewer 3D Gaussian Splat',
    description: 'Menyematkan scene SuperSplat yang bisa dijelajahi. Viewer dimuat saat pengunjung mengeklik, kecuali autoLoad aktif.',
    category: 'spatial',
    targets: ALL,
    schema: splatViewerBlockSchema,
    fields: [
      { key: 'splatId', label: 'ID scene SuperSplat', kind: 'text', required: true, help: 'Bagian setelah ?id= atau /scene/ pada URL SuperSplat, mis. e318925e.' },
      { key: 'title', label: 'Judul', kind: 'text', max: 200 },
      { key: 'caption', label: 'Keterangan', kind: 'textarea', max: 1000 },
      { key: 'posterUrl', label: 'Gambar poster', kind: 'image', altKey: 'posterAlt' },
      { key: 'autoLoad', label: 'Muat viewer otomatis', kind: 'boolean', help: 'Lebih berat untuk pengunjung. Biarkan nonaktif kecuali scene adalah fokus halaman.' },
    ],
    example: { type: 'splat-viewer', splatId: 'e318925e', title: 'Jelajahi ruangnya', caption: 'Drag untuk memutar, scroll untuk zoom.' },
  },
  {
    type: 'heading2',
    label: 'Judul bagian (H2)',
    description: 'Judul bagian utama. Gunakan berurutan: H2 lalu H3, jangan melompat level.',
    category: 'content',
    targets: ALL,
    schema: editorialHeadingBlockSchema,
    fields: [{ key: 'content', label: 'Teks judul', kind: 'text', required: true, max: 1000 }],
    example: { type: 'heading2', content: 'Dari dunia nyata ke 3D Gaussian Splat' },
  },
  {
    type: 'heading3',
    label: 'Sub-judul (H3)',
    description: 'Sub-judul di bawah sebuah H2.',
    category: 'content',
    targets: ALL,
    schema: editorialHeadingBlockSchema,
    fields: [{ key: 'content', label: 'Teks sub-judul', kind: 'text', required: true, max: 1000 }],
    example: { type: 'heading3', content: 'Capture once, use everywhere' },
  },
  {
    type: 'paragraph',
    label: 'Paragraf',
    description: 'Teks paragraf. Mendukung tautan dan penekanan sederhana (HTML akan disanitasi).',
    category: 'content',
    targets: ALL,
    schema: editorialParagraphBlockSchema,
    fields: [{ key: 'content', label: 'Isi paragraf', kind: 'textarea', required: true, max: 20000 }],
    example: { type: 'paragraph', content: 'Tulis isi paragraf di sini.' },
  },
  {
    type: 'text-editorial',
    label: 'Teks editorial',
    description: 'Paragraf pembuka (lead) yang lebih besar diikuti isi teks.',
    category: 'content',
    targets: ALL,
    schema: textEditorialBlockSchema,
    fields: [
      { key: 'leadText', label: 'Lead', kind: 'textarea' },
      { key: 'body', label: 'Isi', kind: 'textarea' },
    ],
    example: { type: 'text-editorial', leadText: 'Kalimat pembuka yang merangkum bagian ini.', body: 'Isi teks bagian ini.' },
  },
  {
    type: 'process-timeline',
    label: 'Alur kerja / pipeline',
    description: 'Tahapan berurutan, cocok untuk pipeline Laser Scan → Point Cloud → 3D Geometry → 3D Gaussian Splat.',
    category: 'content',
    targets: ALL,
    schema: processTimelineBlockSchema,
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      {
        key: 'steps',
        label: 'Tahap',
        kind: 'list',
        itemLabel: 'Tahap',
        max: 12,
        fields: [
          { key: 'number', label: 'Nomor', kind: 'text' },
          { key: 'title', label: 'Judul tahap', kind: 'text', required: true },
          { key: 'description', label: 'Deskripsi', kind: 'textarea' },
          { key: 'deliverables', label: 'Keluaran', kind: 'stringList', itemLabel: 'Keluaran' },
        ],
      },
    ],
    example: {
      type: 'process-timeline',
      eyebrow: 'Alur kerja',
      title: 'Dari dunia nyata ke 3D Gaussian Splat',
      steps: [
        { number: '01', title: 'Laser Scan', description: 'Merekam pengukuran spasial dari lokasi nyata.' },
        { number: '02', title: 'Point Cloud', description: 'Representasi 3D dari titik-titik spasial berwarna.' },
        { number: '03', title: '3D Geometry', description: 'Mesh terstruktur yang bisa diedit.' },
        { number: '04', title: '3D Gaussian Splat', description: 'Representasi ringan, fotorealistis, dan imersif.' },
      ],
    },
  },
  {
    type: 'feature-bento-grid',
    label: 'Grid fitur',
    description: 'Kartu fitur atau manfaat dalam grid. Hindari metrik yang belum terverifikasi.',
    category: 'content',
    targets: ALL,
    schema: featureBentoGridBlockSchema,
    fields: [
      { key: 'badge', label: 'Badge', kind: 'text' },
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      {
        key: 'items',
        label: 'Kartu',
        kind: 'list',
        itemLabel: 'Kartu',
        max: 12,
        fields: [
          { key: 'title', label: 'Judul kartu', kind: 'text', required: true },
          { key: 'description', label: 'Deskripsi', kind: 'textarea' },
          { key: 'image', label: 'Gambar', kind: 'url' },
        ],
      },
    ],
    example: {
      type: 'feature-bento-grid',
      title: 'One Point, Unlimited Possibilities',
      items: [
        { title: 'Real-world accuracy', description: 'Skala dan detail nyata sebagai fondasi.' },
        { title: 'Versatile data', description: 'Point cloud, mesh, tekstur, panorama.' },
        { title: 'Multiple outputs', description: '3D, 2D, interaktif, imersif.' },
      ],
    },
  },
  {
    type: 'media-showcase',
    label: 'Gambar tunggal',
    description: 'Satu gambar besar dengan keterangan. Alt text wajib.',
    category: 'media',
    targets: ALL,
    schema: mediaShowcaseBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'src', label: 'Gambar', kind: 'image', altKey: 'alt', required: true },
      { key: 'caption', label: 'Keterangan', kind: 'textarea' },
    ],
    example: {
      type: 'media-showcase',
      src: '/images/spatium/web/pipe-04-splat.webp',
      alt: 'Rumah modern yang direkam sebagai 3D Gaussian Splat',
      caption: 'Contoh hasil 3D Gaussian Splat.',
    },
  },
  {
    type: 'visual-showcase-gallery',
    label: 'Galeri gambar',
    description: 'Beberapa gambar dalam grid. Setiap gambar wajib punya alt text.',
    category: 'media',
    targets: ALL,
    schema: visualShowcaseGalleryBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      {
        key: 'images',
        label: 'Gambar',
        kind: 'list',
        itemLabel: 'Gambar',
        max: 24,
        fields: [
          { key: 'src', label: 'Gambar', kind: 'image', altKey: 'alt', required: true },
          { key: 'caption', label: 'Keterangan', kind: 'text' },
        ],
      },
    ],
    example: {
      type: 'visual-showcase-gallery',
      title: 'Dari point cloud ke splat',
      images: [
        { src: '/images/spatium/web/pipe-02-pointcloud.webp', alt: 'Rumah sebagai point cloud', caption: 'Point cloud' },
        { src: '/images/spatium/web/pipe-04-splat.webp', alt: 'Rumah yang sama sebagai 3D Gaussian Splat', caption: '3D Gaussian Splat' },
      ],
    },
  },
  {
    type: 'portfolio-proof-grid',
    label: 'Grid portofolio',
    description: 'Menampilkan scene portofolio dari database. Kosongkan pilihan untuk menampilkan yang terbaru.',
    category: 'proof',
    targets: ALL,
    schema: portfolioProofGridBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      { key: 'category', label: 'Filter kategori', kind: 'text', help: 'Opsional, mis. fnb, hospitality, property.' },
    ],
    example: { type: 'portfolio-proof-grid', title: 'Captured spaces, ready to explore' },
  },
  {
    type: 'stats-ticker',
    label: 'Angka proyek',
    description: 'Deretan angka. HANYA untuk data terukur dan terverifikasi — jangan isi angka perkiraan.',
    category: 'proof',
    targets: ALL,
    schema: statsTickerBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      {
        key: 'metrics',
        label: 'Angka',
        kind: 'list',
        itemLabel: 'Angka',
        max: 8,
        fields: [
          { key: 'value', label: 'Nilai', kind: 'text', required: true },
          { key: 'label', label: 'Label', kind: 'text', required: true },
          { key: 'subtext', label: 'Sumber / catatan', kind: 'text' },
        ],
      },
    ],
    example: { type: 'stats-ticker', title: 'Data proyek', metrics: [] },
  },
  {
    type: 'faq-accordion',
    label: 'FAQ',
    description: 'Daftar pertanyaan dan jawaban yang bisa dibuka-tutup.',
    category: 'content',
    targets: ALL,
    schema: faqAccordionBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      {
        key: 'items',
        label: 'Pertanyaan',
        kind: 'list',
        itemLabel: 'Pertanyaan',
        max: 30,
        fields: [
          { key: 'question', label: 'Pertanyaan', kind: 'text', required: true },
          { key: 'answer', label: 'Jawaban', kind: 'textarea', required: true },
        ],
      },
    ],
    example: {
      type: 'faq-accordion',
      title: 'Pertanyaan umum',
      items: [
        {
          question: 'Apa itu 3D Gaussian Splat?',
          answer: 'Representasi 3D yang ringan, fotorealistis, dan imersif yang dibangun dari capture ruang nyata.',
        },
      ],
    },
  },
  {
    type: 'table',
    label: 'Tabel',
    description: 'Tabel data sederhana dengan baris judul.',
    category: 'content',
    targets: ALL,
    schema: tableBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'caption', label: 'Keterangan', kind: 'text' },
      { key: 'headers', label: 'Kolom', kind: 'stringList', itemLabel: 'Kolom' },
      { key: 'rows', label: 'Baris', kind: 'table', columnsKey: 'headers', max: 100 },
    ],
    example: {
      type: 'table',
      title: 'Foto, video, dan media spasial',
      headers: ['Media', 'Menangkap'],
      rows: [
        ['Foto', 'Gambar'],
        ['Video', 'Momen'],
        ['Media spasial', 'Ruang'],
      ],
    },
  },
  {
    type: 'internal-links',
    label: 'Tautan terkait',
    description: 'Daftar tautan ke halaman lain di situs.',
    category: 'navigation',
    targets: ALL,
    schema: internalLinksBlockSchema,
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
  },
  {
    type: 'interactive-cta',
    label: 'Ajakan konsultasi',
    description: 'Banner ajakan dengan judul, deskripsi, dan dua tombol.',
    category: 'conversion',
    targets: ALL,
    schema: interactiveCtaBlockSchema,
    fields: [
      { key: 'badge', label: 'Badge', kind: 'text' },
      { key: 'title', label: 'Judul', kind: 'text', required: true },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      linkFields('primaryCta', 'Tombol utama'),
      linkFields('secondaryCta', 'Tombol kedua'),
    ],
    example: {
      type: 'interactive-cta',
      title: 'Every space has a story. Let’s make it explorable.',
      primaryCta: { label: 'Diskusikan ruang Anda', href: '/contact' },
    },
  },
  {
    type: 'studio-cta',
    label: 'CTA sederhana',
    description: 'Ajakan singkat dengan satu tombol.',
    category: 'conversion',
    targets: ALL,
    schema: studioCtaBlockSchema,
    fields: [
      { key: 'headline', label: 'Judul', kind: 'text', required: true },
      { key: 'description', label: 'Deskripsi', kind: 'textarea' },
      { key: 'buttonText', label: 'Teks tombol', kind: 'text' },
      { key: 'buttonUrl', label: 'URL tombol', kind: 'url' },
    ],
    example: { type: 'studio-cta', headline: 'Elevate your space with us!', buttonText: 'Mulai proyek', buttonUrl: '/contact' },
  },
  {
    type: 'deliverables-checklist',
    label: 'Daftar keluaran',
    description: 'Checklist hal yang diterima klien.',
    category: 'content',
    targets: ALL,
    schema: deliverablesChecklistBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      {
        key: 'items',
        label: 'Item',
        kind: 'list',
        itemLabel: 'Item',
        max: 20,
        fields: [
          { key: 'title', label: 'Item', kind: 'text', required: true },
          { key: 'description', label: 'Deskripsi', kind: 'text' },
        ],
      },
    ],
    example: {
      type: 'deliverables-checklist',
      title: 'Yang Anda terima',
      items: [{ title: 'Scene 3D Gaussian Splat' }, { title: 'Viewer interaktif di browser' }],
    },
  },
  {
    type: 'workflow-phases',
    label: 'Fase proyek',
    description: 'Fase kerja dengan keluaran per fase.',
    category: 'content',
    targets: ALL,
    schema: workflowPhasesBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      {
        key: 'phases',
        label: 'Fase',
        kind: 'list',
        itemLabel: 'Fase',
        max: 10,
        fields: [
          { key: 'title', label: 'Nama fase', kind: 'text', required: true },
          { key: 'description', label: 'Deskripsi', kind: 'textarea' },
          { key: 'deliverables', label: 'Keluaran', kind: 'stringList', itemLabel: 'Keluaran' },
        ],
      },
    ],
    example: {
      type: 'workflow-phases',
      title: 'Alur proyek',
      phases: [
        { title: 'Capture', description: 'Perekaman di lokasi.' },
        { title: 'Process', description: 'Point cloud dan rekonstruksi.' },
        { title: 'Deliver', description: 'Scene dan viewer siap dipakai.' },
      ],
    },
  },
  {
    type: 'hero-portfolio',
    label: 'Hero studi kasus',
    description: 'Header halaman portofolio.',
    category: 'hero',
    targets: ['portfolio'],
    schema: heroPortfolioBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text', required: true },
      { key: 'summary', label: 'Ringkasan', kind: 'textarea' },
      { key: 'client', label: 'Klien / venue', kind: 'text' },
      { key: 'category', label: 'Kategori', kind: 'text' },
    ],
    example: { type: 'hero-portfolio', title: 'Judul studi kasus', summary: 'Ringkasan singkat proyek.' },
  },
  {
    type: 'portfolio-case-study',
    label: 'Narasi studi kasus',
    description: 'Tantangan, pendekatan, solusi, dan hasil.',
    category: 'content',
    targets: ['portfolio'],
    schema: portfolioCaseStudyBlockSchema,
    fields: [
      { key: 'title', label: 'Judul', kind: 'text' },
      { key: 'challenge', label: 'Tantangan', kind: 'textarea' },
      { key: 'approach', label: 'Pendekatan', kind: 'textarea' },
      { key: 'solution', label: 'Solusi', kind: 'textarea' },
      { key: 'result', label: 'Hasil', kind: 'textarea' },
    ],
    example: { type: 'portfolio-case-study', title: 'Studi kasus', challenge: 'Tantangan proyek.', approach: 'Pendekatan yang dipakai.' },
  },
]

const BY_TYPE = new Map(BLOCK_CATALOG.map((e) => [e.type, e]))

/** Every type the validator accepts (catalogue + legacy types that still render). */
const KNOWN_TYPES: ReadonlySet<string> = new Set(
  blockSchema.options.flatMap((o) => {
    const t = o.shape.type
    return 'options' in t ? [...(t.options as readonly string[])] : [t.value as string]
  }),
)

export function getBlockEntry(type: string): BlockCatalogEntry | undefined {
  return BY_TYPE.get(type)
}

/** Blocks offered in editors / to MCP for a target. Legacy types stay renderable but are not offered. */
export function listBlocksFor(target: BlockTarget): BlockCatalogEntry[] {
  return BLOCK_CATALOG.filter((e) => e.targets.includes(target))
}

/** JSON Schema (draft 2020-12) of a block's accepted input, for MCP clients. */
export function blockJsonSchema(type: string): Record<string, unknown> | null {
  const entry = BY_TYPE.get(type)
  if (!entry) return null
  return z.toJSONSchema(entry.schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>
}

let idCounter = 0
/** Stable-enough unique id for a new block (client or server). */
export function newBlockId(type: string): string {
  idCounter = (idCounter + 1) % 1_000_000
  const rand = Math.random().toString(36).slice(2, 8)
  return `${type}-${Date.now().toString(36)}-${idCounter.toString(36)}${rand}`
}

/** A new block of `type`, pre-filled with the catalogue example. */
export function createBlock(type: string): Block | null {
  const entry = BY_TYPE.get(type)
  if (!entry) return null
  const candidate = { ...structuredClone(entry.example), id: newBlockId(type) }
  const parsed = blockSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export type BlockIssue = { index: number; blockId?: string; type?: string; message: string }

/**
 * Validates a block list and returns per-block issues the editor (and MCP)
 * can point at. Unknown types and schema failures are both reported.
 */
export function validateBlockList(raw: unknown): { ok: boolean; blocks: Block[]; issues: BlockIssue[] } {
  const parsed = parseBlocks(raw)
  if (parsed.ok) return { ok: true, blocks: parsed.blocks, issues: [] }
  const list: unknown[] = Array.isArray(raw) ? raw : []
  const issues: BlockIssue[] = []
  list.forEach((item, index) => {
    const rec = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
    const type = typeof rec.type === 'string' ? rec.type : undefined
    const blockId = typeof rec.id === 'string' ? rec.id : undefined
    if (type && !KNOWN_TYPES.has(type)) {
      issues.push({ index, blockId, type, message: `Tipe blok tidak dikenal: "${type}". Lihat daftar tipe di katalog blok.` })
      return
    }
    if (!type) {
      issues.push({ index, blockId, message: 'Blok wajib punya field "type".' })
      return
    }
    const one = blockSchema.safeParse(item)
    if (!one.success) {
      for (const iss of one.error.issues) {
        const where = iss.path.length ? `${iss.path.join('.')}: ` : ''
        issues.push({ index, blockId, type, message: `${where}${iss.message}` })
      }
    }
  })
  if (issues.length === 0) {
    for (const message of parsed.issues ?? ['Daftar blok tidak valid.']) issues.push({ index: -1, message })
  }
  return { ok: false, blocks: [], issues }
}
