/**
 * Dynamic Block Ontology & Capability Registry (ADR-0012)
 *
 * Provides a dynamic, extensible, schema-driven source of truth for all
 * editorial and visual blocks in SegiaTech Studio.
 *
 * The LLM learns about blocks dynamically from this registry (types, purposes,
 * narrative sequence, input parameters, and visual effects) without hardcoding.
 */

import { z } from 'zod'
import {
  blockSchema,
  parseBlocks,
  Block,
} from './schema'
import { ContentBlock, generateBlockId } from '../articles/blockEditor'

export type BlockCategory =
  | 'hero'
  | 'editorial'
  | 'feature'
  | 'architecture'
  | 'data'
  | 'social-proof'
  | 'interactive'
  | 'conversion'

export type TargetPageKind = 'article' | 'service' | 'solution' | 'landing' | 'portfolio' | 'all'

export interface BlockFieldInputDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  label: string
  description: string
  required: boolean
  allowedValues?: string[]
  effectOnRender: string
}

export interface BlockDefinition {
  type: string
  label: string
  category: BlockCategory
  purpose: string
  idealHierarchyIndex: number // 10 (Hero) -> 20 (Intro) -> 30 (Pillars) -> 40 (Grid) -> 50 (Matrix/Table) -> 60 (Stats/Proof) -> 70 (FAQ) -> 80 (CTA)
  supportedPageKinds: TargetPageKind[]
  inputs: BlockFieldInputDef[]
  examplePayload: Record<string, any>
  generateDefault: (ctx?: Record<string, any>) => Record<string, any>
}

class BlockOntologyRegistry {
  private registry = new Map<string, BlockDefinition>()

  public register(def: BlockDefinition) {
    this.registry.set(def.type, def)
  }

  public get(type: string): BlockDefinition | undefined {
    return this.registry.get(type)
  }

  public list(filter?: { category?: BlockCategory; pageKind?: TargetPageKind }): BlockDefinition[] {
    let all = Array.from(this.registry.values())
    if (filter?.category) {
      all = all.filter((b) => b.category === filter.category)
    }
    if (filter?.pageKind && filter.pageKind !== 'all') {
      all = all.filter(
        (b) => b.supportedPageKinds.includes('all') || b.supportedPageKinds.includes(filter.pageKind!)
      )
    }
    return all.sort((a, b) => a.idealHierarchyIndex - b.idealHierarchyIndex)
  }

  /**
   * Returns ideal sequential block flow for a given page kind.
   */
  public getRecommendedSequence(pageKind: TargetPageKind): string[] {
    return this.list({ pageKind }).map((b) => b.type)
  }

  /**
   * Generates a dynamic markdown manifest for LLM system prompt injection.
   * Tells the LLM what blocks exist, why they are used, their sequence, and how inputs affect the output.
   */
  public generateLlmManifest(pageKind?: TargetPageKind): string {
    const blocks = this.list(pageKind ? { pageKind } : undefined)
    const lines: string[] = [
      '### KATALOG BLOK DINAMIS SEGIA STUDIO (Dynamic Block Ontology)',
      'Gunakan blok-blok terstruktur di bawah ini saat menyusun atau memodifikasi layout canvas editor:',
      '',
    ]

    for (const b of blocks) {
      lines.push(`#### [${b.type}] — ${b.label} (Kategori: ${b.category.toUpperCase()}, Urutan Ideal: #${b.idealHierarchyIndex})`)
      lines.push(`- **Tujuan / Kegunaan**: ${b.purpose}`)
      lines.push(`- **Cocok untuk**: ${b.supportedPageKinds.join(', ')}`)
      lines.push('- **Parameter Input & Efek Tampilan**:')
      for (const inp of b.inputs) {
        const reqStr = inp.required ? 'WAJIB' : 'Opsional'
        const valStr = inp.allowedValues ? ` [Nilai: ${inp.allowedValues.join(' | ')}]` : ''
        lines.push(`  * \`${inp.name}\` (${inp.type}${valStr}, ${reqStr}): ${inp.description}. *Efek:* ${inp.effectOnRender}`)
      }
      lines.push(`- **Contoh JSON Valid**:`)
      lines.push('```json')
      lines.push(JSON.stringify(b.examplePayload, null, 2))
      lines.push('```')
      lines.push('')
    }

    lines.push('### PRINSIP URUTAN NARASI BLOK (Storytelling Sequence):')
    lines.push('1. **Hook / Top (#10-20)**: Mulai dengan Hero atau Paragraf Pembuka yang menyajikan nilai utama dan focus keyphrase.')
    lines.push('2. **Elaborasi / Masalah (#20-30)**: Paparkan tantangan, konteks industri, atau pilar rekayasa (Engineering Pillars / Heading 2).')
    lines.push('3. **Solusi & Fitur (#30-40)**: Tampilkan fitur utama atau alur kerja (Feature Bento Grid / Workflow Phases).')
    lines.push('4. **Data & Komparasi (#50)**: Sajikan tabel spesifikasi, komparasi, atau matrix teknis (Comparison Matrix / Table).')
    lines.push('5. **Bukti & Dampak (#60)**: Tampilkan angka dampak, statistik riil, atau kutipan (Stats Impact / Executive Quote).')
    lines.push('6. **Resolusi & Edukasi (#70)**: Rangkum FAQ untuk mengatasi keberatan pembaca (FAQ Accordion).')
    lines.push('7. **Konversi (#80)**: Tutup dengan ajakan bertindak yang jelas (Studio CTA / Tautan Internal).')

    return lines.join('\n')
  }
}

export const blockOntology = new BlockOntologyRegistry()

// ─── Register Core Editorial & Studio Blocks ──────────────────────────────────

// 1. Editorial: Paragraph
blockOntology.register({
  type: 'paragraph',
  label: 'Paragraf Teks Naratif',
  category: 'editorial',
  purpose: 'Menyajikan penjelasan naratif, argumen teknis, atau introduksi ide. Wajib aktif (passive <= 10%) dan memuat kata transisi.',
  idealHierarchyIndex: 20,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'text',
      type: 'string',
      label: 'Isi Paragraf',
      description: 'Teks paragraf dengan dukungan inline markdown (bold, italic, link)',
      required: true,
      effectOnRender: 'Merender teks berjarak tipografi proporsional untuk kenyamanan membaca.',
    },
  ],
  examplePayload: {
    type: 'paragraph',
    text: 'Sistem arsitektur modern menuntut keandalan tinggi dan isolasi state yang presisi.',
  },
  generateDefault: (ctx) => ({
    type: 'paragraph',
    id: generateBlockId('p'),
    text: ctx?.text || 'Tuliskan paragraf naratif di sini...',
  }),
})

// 2. Editorial: Heading 2
blockOntology.register({
  type: 'heading2',
  label: 'Subjudul Bagian Utama (H2)',
  category: 'editorial',
  purpose: 'Membagi topik besar artikel menjadi subtopik terstruktur. Wajib memuat focus keyphrase atau variasi LSI.',
  idealHierarchyIndex: 25,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'text',
      type: 'string',
      label: 'Teks Subjudul H2',
      description: 'Judul seksi utama (idealnya 25-60 karakter)',
      required: true,
      effectOnRender: 'Merender judul tingkat 2 dengan tipografi display tebal dan anchor slug otomatis.',
    },
  ],
  examplePayload: {
    type: 'heading2',
    text: 'Arsitektur Rekayasa WebGL & Standar Next.js 16',
  },
  generateDefault: (ctx) => ({
    type: 'heading2',
    id: generateBlockId('h2'),
    text: ctx?.title || 'Subjudul H2 Utama',
  }),
})

// 3. Editorial: Heading 3
blockOntology.register({
  type: 'heading3',
  label: 'Sub-subjudul Rincian (H3)',
  category: 'editorial',
  purpose: 'Mendukung penjabaran teknis lebih mendalam di bawah seksi H2 tanpa memutus hierarki.',
  idealHierarchyIndex: 30,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'text',
      type: 'string',
      label: 'Teks Subjudul H3',
      description: 'Judul cabang detail',
      required: true,
      effectOnRender: 'Merender judul tingkat 3 yang lebih kompak dengan margin atas terukur.',
    },
  ],
  examplePayload: {
    type: 'heading3',
    text: 'Manajemen Buffer Geometri & Disposal Tekstur',
  },
  generateDefault: (ctx) => ({
    type: 'heading3',
    id: generateBlockId('h3'),
    text: ctx?.title || 'Subjudul H3 Detail',
  }),
})

// 4. Data / Editorial: Table
blockOntology.register({
  type: 'table',
  label: 'Tabel Spesifikasi & Data',
  category: 'data',
  purpose: 'Menyajikan perbandingan teknis, matriks fitur, atau data spesifikasi terstruktur yang mudah dipindai.',
  idealHierarchyIndex: 50,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'headers',
      type: 'array',
      label: 'Kolom Header Tabel',
      description: 'Daftar nama kolom kepala tabel',
      required: true,
      effectOnRender: 'Merender baris header dengan latar kontras dan teks semi-bold.',
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Baris Data',
      description: 'Matriks array 2 dimensi berisi nilai sel tiap baris',
      required: true,
      effectOnRender: 'Merender sel data dengan garis batas halus dan alternating zebra striping.',
    },
    {
      name: 'caption',
      type: 'string',
      label: 'Keterangan Tabel',
      description: 'Keterangan ringkas di bawah tabel',
      required: false,
      effectOnRender: 'Merender teks caption kecil untuk aksesibilitas dan konteks data.',
    },
  ],
  examplePayload: {
    type: 'table',
    headers: ['Aspek', 'Next.js 16 App Router', 'Arsitektur Konvensional'],
    rows: [
      ['Rendering', 'React Server Components (RSC)', 'Client-Side Rendering (CSR)'],
      ['SEO & CrUX', 'Sangat Tinggi (LCP < 1.2s)', 'Sedang (Beban JS Berat)'],
      ['Penyimpanan State', 'PostgreSQL via Prisma 8', 'Legacy SQLite / JSON'],
    ],
    caption: 'Perbandingan performa dan efisiensi arsitektur sistem.',
  },
  generateDefault: () => ({
    type: 'table',
    id: generateBlockId('tbl'),
    headers: ['Kriteria', 'Standar SegiaTech', 'Metode Konvensional'],
    rows: [
      ['Kualitas', 'Enterprise Grade', 'Standar'],
      ['Kecepatan', 'Sub-second LCP', '3-5 detik'],
    ],
  }),
})

// 5. Visual / Feature: Feature Bento Grid
blockOntology.register({
  type: 'feature-bento-grid',
  label: 'Feature Bento Grid (Visual Layout)',
  category: 'feature',
  purpose: 'Menampilkan 3-6 kapabilitas utama dengan tata letak visual asimetris bento modern yang sangat menarik secara visual.',
  idealHierarchyIndex: 35,
  supportedPageKinds: ['service', 'solution', 'landing', 'article'],
  inputs: [
    {
      name: 'sectionTitle',
      type: 'string',
      label: 'Judul Seksi Bento',
      description: 'Judul payung untuk kumpulan kartu bento',
      required: false,
      effectOnRender: 'Menampilkan judul seksi elegan di atas grid bento.',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Kartu Bento',
      description: 'Daftar kartu fitur (title, description, icon, colSpan: 1 | 2)',
      required: true,
      effectOnRender: 'Mengatur ukuran grid kartu secara responsif di desktop dan mobile.',
    },
  ],
  examplePayload: {
    type: 'feature-bento-grid',
    sectionTitle: 'Fitur Utama Rekayasa Platform',
    items: [
      { title: 'Three.js / WebGL Native', description: 'Simulasi grafis spatial berlatensi rendah', icon: 'zap', colSpan: 2 },
      { title: 'Prisma 8 ORM', description: 'Kontrak tipe data presisi dengan PostgreSQL', icon: 'database', colSpan: 1 },
      { title: 'Audit SEO Otomatis', description: 'Inspeksi gerbang on-page real-time', icon: 'shield-check', colSpan: 1 },
    ],
  },
  generateDefault: () => ({
    type: 'feature-bento-grid',
    id: generateBlockId('bento'),
    sectionTitle: 'Kapabilitas Unggulan',
    items: [
      { title: 'Performa Tinggi', description: 'Dioptimalkan untuk kecepatan dan efisiensi.', icon: 'zap', colSpan: 2 },
      { title: 'Desain Editorial', description: 'Tipografi presisi standar Dogstudio.', icon: 'sparkles', colSpan: 1 },
    ],
  }),
})

// 6. Conversion / Interactive: FAQ Accordion
blockOntology.register({
  type: 'faq-accordion',
  label: 'FAQ Accordion (Tanya Jawab Terstruktur)',
  category: 'conversion',
  purpose: 'Menjawab pertanyaan umum pembaca, mengatasi keraguan klien, dan mendukung schema FAQ Google.',
  idealHierarchyIndex: 70,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'title',
      type: 'string',
      label: 'Judul Seksi FAQ',
      description: 'Judul pembuka tanya jawab',
      required: false,
      effectOnRender: 'Merender judul dengan badge edukasi di atas accordion.',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Daftar Pertanyaan & Jawaban',
      description: 'Array objek { question, answer }',
      required: true,
      effectOnRender: 'Merender item akordeon interaktif yang dapat dibuka-tutup.',
    },
  ],
  examplePayload: {
    type: 'faq-accordion',
    title: 'Pertanyaan yang Sering Diajukan',
    items: [
      {
        question: 'Berapa lama estimasi implementasi sistem WebGL interaktif?',
        answer: 'Rata-rata fase discovery dan prototipe memakan waktu 2–3 minggu, dilanjutkan produksi penuh 4–8 minggu.',
      },
      {
        question: 'Apakah website Next.js 16 ramah pengindeksan SEO?',
        answer: 'Ya, seluruh rute dipra-render secara statis/SSR dengan skema JSON-LD terverifikasi.',
      },
    ],
  },
  generateDefault: () => ({
    type: 'faq-accordion',
    id: generateBlockId('faq'),
    title: 'Pertanyaan Umum',
    items: [
      { question: 'Pertanyaan pertama?', answer: 'Jawaban penjelasan detail di sini.' },
      { question: 'Pertanyaan kedua?', answer: 'Jawaban kedua yang jelas dan padat.' },
    ],
  }),
})

// 7. Conversion: Studio CTA
blockOntology.register({
  type: 'studio-cta',
  label: 'Studio CTA Banner (Ajakan Bertindak)',
  category: 'conversion',
  purpose: 'Mendorong pembaca melakukan konsultasi, pemesanan layanan, atau membuka kontak WhatsApp resmi SegiaTech.',
  idealHierarchyIndex: 80,
  supportedPageKinds: ['all'],
  inputs: [
    {
      name: 'headline',
      type: 'string',
      label: 'Kalimat Ajakan Utama',
      description: 'Headline kuat dan memikat (maks 100 karakter)',
      required: true,
      effectOnRender: 'Merender teks display tebal di tengah banner dengan aksen gradien.',
    },
    {
      name: 'subline',
      type: 'string',
      label: 'Subteks Penjelasan',
      description: 'Kalimat penjelas singkat manfaat konsultasi',
      required: false,
      effectOnRender: 'Menampilkan teks netral lembut di bawah headline.',
    },
    {
      name: 'buttonLabel',
      type: 'string',
      label: 'Label Tombol Aksi',
      description: 'Teks tombol CTA, misal: "Konsultasi Proyek Sekarang"',
      required: true,
      effectOnRender: 'Merender tombol magnetik dengan efek hover dan link tujuan.',
    },
    {
      name: 'buttonUrl',
      type: 'string',
      label: 'URL Tujuan',
      description: 'Rute internal (/kontak) atau link WhatsApp resmi',
      required: true,
      effectOnRender: 'Mengikat navigasi klik pengguna.',
    },
  ],
  examplePayload: {
    type: 'studio-cta',
    headline: 'Siap Mentransformasi Pengalaman Digital Bisnis Anda?',
    subline: 'Diskusikan arsitektur sistem, simulasi WebGL, dan integrasi Next.js dengan tim rekayasa SegiaTech.',
    buttonLabel: 'Mulai Konsultasi Rekayasa',
    buttonUrl: '/kontak',
  },
  generateDefault: () => ({
    type: 'studio-cta',
    id: generateBlockId('cta'),
    headline: 'Diskusikan Kebutuhan Proyek Anda Bersama SegiaTech',
    subline: 'Tim rekayasa kami siap merancang solusi arsitektur web modern berkinerja tinggi.',
    buttonLabel: 'Hubungi Tim Rekayasa',
    buttonUrl: '/kontak',
  }),
})

// 8. Editorial / SEO: Internal Links
blockOntology.register({
  type: 'internal-links',
  label: 'Tautan Internal Kontekstual',
  category: 'editorial',
  purpose: 'Menautkan pembaca ke 3-5 layanan, artikel terkait, atau portofolio resmi SegiaTech untuk memperkuat PageRank internal.',
  idealHierarchyIndex: 75,
  supportedPageKinds: ['article', 'all'],
  inputs: [
    {
      name: 'title',
      type: 'string',
      label: 'Judul Seksi Tautan',
      description: 'Misal: "Artikel & Layanan Terkait"',
      required: false,
      effectOnRender: 'Menampilkan header mini sebelum daftar kartu tautan.',
    },
    {
      name: 'links',
      type: 'array',
      label: 'Daftar Tautan Internal',
      description: 'Array objek { title, slug, url, excerpt }',
      required: true,
      effectOnRender: 'Merender kartu tautan interaktif dengan border halus dan transisi hover.',
    },
  ],
  examplePayload: {
    type: 'internal-links',
    title: 'Layanan Terkait SegiaTech',
    links: [
      { title: 'Jasa Pembuatan Website Next.js 16', slug: 'website-development', url: '/layanan/website-development' },
      { title: 'Simulasi Interaktif WebGL & Three.js', slug: 'interactive-3d-aquarium', url: '/layanan/interactive-3d-aquarium' },
    ],
  },
  generateDefault: () => ({
    type: 'internal-links',
    id: generateBlockId('links'),
    title: 'Rekomendasi Layanan Terkait',
    links: [
      { title: 'Website Development', slug: 'website-development', url: '/layanan/website-development' },
    ],
  }),
})

// ─── Universal Block Composer & Validator ─────────────────────────────────────

export interface ComposeBlocksInput {
  blocks: Array<Record<string, any>>
  targetPageKind?: TargetPageKind
}

export interface ComposeBlocksResult {
  valid: boolean
  blocks: any[]
  errors?: string[]
}

/**
 * Validates, formats, and auto-generates deterministic IDs for any sequence of blocks.
 */
export function composeAndValidateBlocks(input: ComposeBlocksInput): ComposeBlocksResult {
  const { blocks, targetPageKind = 'all' } = input
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { valid: false, blocks: [], errors: ['Daftar blok tidak boleh kosong.'] }
  }

  const formattedBlocks: any[] = []
  const validationErrors: string[] = []

  blocks.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') {
      validationErrors.push(`Blok #${idx + 1} tidak valid (bukan objek).`)
      return
    }

    const type = raw.type
    if (!type || typeof type !== 'string') {
      validationErrors.push(`Blok #${idx + 1} tidak memiliki tipe (\`type\`).`)
      return
    }

    const definition = blockOntology.get(type)
    const blockId = raw.id || generateBlockId(`b${idx + 1}`)

    const preparedBlock: Record<string, any> = {
      ...raw,
      id: blockId,
    }

    // Check required inputs if registered
    if (definition) {
      for (const inputDef of definition.inputs) {
        if (inputDef.required && (preparedBlock[inputDef.name] === undefined || preparedBlock[inputDef.name] === null || preparedBlock[inputDef.name] === '')) {
          validationErrors.push(`Blok #${idx + 1} [${type}] kekurangan field wajib: \`${inputDef.name}\`.`)
        }
      }
    }

    formattedBlocks.push(preparedBlock)
  })

  // Validate against Master Discriminated Union in schema.ts
  const parseResult = parseBlocks(formattedBlocks)
  if (!parseResult.ok && parseResult.issues && parseResult.issues.length > 0) {
    // Only fail if critical schema issues
    return {
      valid: false,
      blocks: formattedBlocks,
      errors: [...validationErrors, ...parseResult.issues],
    }
  }

  return {
    valid: validationErrors.length === 0,
    blocks: formattedBlocks,
    errors: validationErrors.length > 0 ? validationErrors : undefined,
  }
}
