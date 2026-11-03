import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { createArticle } from '@/lib/db/articles'
import { callLlm } from '@/lib/agent/llm'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import { slugify, calculateReadingTime } from '@/lib/content/html'
import { compressToolOutput, buildOptimizerSystemDirectives } from './token-optimizer'

function generateEditorialBannerSvg(title: string, category: string, brandName: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const safeCategory = category.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safeBrand = brandName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const words = safeTitle.split(' ')
  const line1 = words.slice(0, 6).join(' ')
  const line2 = words.slice(6, 12).join(' ')
  const line3 = words.slice(12, 18).join(' ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0D13" />
      <stop offset="50%" stop-color="#111625" />
      <stop offset="100%" stop-color="#07090E" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#818CF8" />
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" stroke-opacity="0.03" stroke-width="1" />
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#grid)" />

  <circle cx="1020" cy="180" r="140" fill="none" stroke="url(#accentGrad)" stroke-width="1.5" stroke-opacity="0.4" />
  <circle cx="1020" cy="180" r="90" fill="none" stroke="#38BDF8" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="4 6" />
  <rect x="940" y="320" width="160" height="160" rx="20" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
  <path d="M880 440 L1080 240" stroke="url(#accentGrad)" stroke-width="2" stroke-opacity="0.3" />

  <rect x="80" y="80" width="180" height="34" rx="17" fill="#0284C7" fill-opacity="0.15" stroke="#38BDF8" stroke-opacity="0.3" stroke-width="1" />
  <text x="170" y="102" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" text-anchor="middle">${safeCategory.toUpperCase()}</text>

  <text x="80" y="210" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" letter-spacing="-0.02em">
    ${line1}
  </text>
  ${line2 ? `<text x="80" y="270" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" letter-spacing="-0.02em">${line2}</text>` : ''}
  ${line3 ? `<text x="80" y="330" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700" letter-spacing="-0.02em">${line3}</text>` : ''}

  <line x1="80" y1="520" x2="1120" y2="520" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1" />
  <text x="80" y="560" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="0.5">${safeBrand}</text>
  <text x="240" y="560" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500">Editorial Experience · Production Ready</text>
  <text x="1120" y="560" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" text-anchor="end">SEGIA WebShift AI Engine</text>
</svg>`
}

export interface GenerateDraftOptions {
  topic: string
  targetKeyword?: string
  audience?: string
  categorySlug?: string
  categoryId?: number
  actor?: { id: string; name: string; email?: string }
  aiConfig?: {
    provider?: 'google' | 'openrouter'
    apiKey?: string
    model?: string
    proxyUrl?: string
    temperature?: number
    thinkingMode?: 'auto' | 'off' | 'on'
    tokenOptimization?: {
      rtkEnabled?: boolean
      rtkMode?: 'aggressive' | 'balanced' | 'minimal'
      rtkMaxOutputChars?: number
      rtkSmartCrusher?: boolean
      headroomEnabled?: boolean
      cavemanMode?: 'caveman' | 'terse' | 'off'
      ponytailEnabled?: boolean
      customSystemPrompt?: string
    }
  }
}

const draftSchema = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().max(1000),
  content: z.string().min(1),
})

/**
 * AI-assisted editorial draft generator with RTK, Caveman, and Ponytail token savers.
 * Sesuai aturan SEGIA Rule 8: Draf berstatus DRAFT, tidak auto-publish, dan zero-mock policy.
 */
export async function generateArticleDraft(options: GenerateDraftOptions) {
  const provider = options.aiConfig?.provider || 'google'
  const apiKey = options.aiConfig?.apiKey?.trim() || ''
  const model = options.aiConfig?.model?.trim() || ''

  if (!apiKey) {
    throw new Error(
      `API Key untuk ${provider === 'google' ? 'Google AI Studio' : 'OpenRouter'} belum diisi. Masukkan kunci API secara dinamis pada panel Pengaturan AI atau sidebar.`
    )
  }

  if (!model) {
    throw new Error(
      `Model AI untuk ${provider === 'google' ? 'Google AI Studio' : 'OpenRouter'} belum ditentukan. Pilih model dari daftar fetch atau ketik model yang diinginkan.`
    )
  }

  const site = await getSiteProfile()

  // 1. RTK: Kompresi input profil dan brand voice untuk menghemat 60-90% token masukan
  const compressedBrandVoice = compressToolOutput(
    {
      name: site.name,
      voice: site.brandVoice || 'Profesional, berwibawa, inovatif, dan berorientasi arsitektur modern',
      audience: options.audience || 'Profesional Digital, Arsitek Web, & Pemimpin Bisnis',
    },
    options.aiConfig?.tokenOptimization
  )

  // 2. Directives: Caveman (hapus basa-basi & meta-komentar), Ponytail (HTML5 semantic tags), Custom prompt
  const optimizerDirectives = buildOptimizerSystemDirectives(options.aiConfig?.tokenOptimization)

  const systemInstruction = [
    `Anda adalah Editor Ahli & Penulis Konten Senior untuk ${site.name}.
Tulis draf editorial komprehensif berbahasa Indonesia.
Kembalikan respon HANYA dalam format JSON valid dengan field:
{
  "title": "Judul artikel informatif & berdaya pikat tinggi",
  "excerpt": "Ringkasan 1-2 kalimat padat (maks 250 karakter)",
  "content": "Isi artikel lengkap dalam format HTML semantik (h2, h3, p, ul, ol, blockquote)"
}`,
    optimizerDirectives,
    `ATURAN KONTEN & PUBLIKASI (RULE 8):
- Jangan mengarang hasil bisnis palsu, klaim statistik fiktif, garansi tak berdasar, atau testimoni palsu.
- Jangan membuat variasi kota keyword stuffing atau daftar tag buatan.
- Konten ini akan ditinjau secara teliti oleh Editor sebelum publikasi resmi.
- Output JSON valid murni tanpa blok pembuka/penutup basa-basi.`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const userPayload = {
    topic: options.topic,
    targetKeyword: options.targetKeyword || options.topic,
    brandGuidelines: compressedBrandVoice,
  }

  const result = await callLlm({
    provider,
    apiKey,
    model,
    systemInstruction,
    proxyUrl: options.aiConfig?.proxyUrl,
    temperature: options.aiConfig?.temperature ?? 0.35,
    thinkingMode: options.aiConfig?.thinkingMode,
    messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
  })

  // Parse JSON response safely
  const cleanedReply = result.reply
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsedJson: any
  try {
    parsedJson = JSON.parse(cleanedReply)
  } catch (err: any) {
    // If wrapped in narrative text, extract outermost JSON object
    const match = cleanedReply.match(/\{[\s\S]*\}/)
    if (match) {
      parsedJson = JSON.parse(match[0])
    } else {
      throw new Error(`Gagal mem-parsing respon AI: ${err.message}`)
    }
  }

  const draft = draftSchema.parse(parsedJson)
  let content = sanitizeHtmlContent(draft.content)

  if (!content.replace(/<[^>]*>/g, '').trim()) {
    throw new Error('Penyedia AI tidak mengembalikan teks artikel yang valid.')
  }

  const suffix = randomUUID().slice(0, 8)
  const articleSlug = `${slugify(draft.title).slice(0, 180) || 'artikel'}-${suffix}`

  // Agentic Workflow: Pembuatan Gambar Featured & Penempatan Langsung ke Artikel
  let featuredImageUrl: string | null = null
  let mediaItemId: number | null = null

  try {
    const publicDir = path.join(process.cwd(), 'public')
    const uploadsArticlesDir = path.join(publicDir, 'uploads', 'articles')
    if (!fs.existsSync(uploadsArticlesDir)) {
      fs.mkdirSync(uploadsArticlesDir, { recursive: true })
    }

    const svgFileName = `${articleSlug}-featured.svg`
    const svgFilePath = path.join(uploadsArticlesDir, svgFileName)
    const relMediaUrl = `/uploads/articles/${svgFileName}`

    const bannerSvg = generateEditorialBannerSvg(
      draft.title,
      options.categorySlug || 'Wawasan Arsitektur',
      site.name || 'SEGIA Digital'
    )

    fs.writeFileSync(svgFilePath, bannerSvg, 'utf8')
    const stat = fs.statSync(svgFilePath)

    const altTextObj = {
      id: `Visual editorial untuk artikel: ${draft.title}`,
      en: `Editorial illustration for article: ${draft.title}`,
    }

    const createdMedia = await prisma.orm.public.MediaItem.create({
      fileName: svgFileName,
      url: relMediaUrl,
      size: stat.size,
      mimeType: 'image/svg+xml',
      width: 1200,
      height: 630,
      altText: JSON.stringify(altTextObj),
      focalPoint: JSON.stringify({ x: 50, y: 50 }),
      usedIn: JSON.stringify([`/artikel/${articleSlug}`]),
      uploadedBy: 'ai_agent_studio',
    })

    featuredImageUrl = relMediaUrl
    mediaItemId = createdMedia.id

    // Sisipkan gambar ilustrasi utama ke dalam konten artikel (Agentic Placement)
    const visualFigureHtml = `<figure class="my-6 rounded-2xl overflow-hidden border border-white/10 shadow-lg"><img src="${relMediaUrl}" alt="${altTextObj.id}" class="w-full h-auto object-cover" width="1200" height="630" /><figcaption class="text-xs text-neutral-400 mt-2 px-1 text-center italic">${altTextObj.id}</figcaption></figure>`
    content = `${visualFigureHtml}\n\n${content}`
  } catch (mediaErr) {
    console.warn('[generateArticleDraft] Failed to generate agentic media:', mediaErr)
  }

  let authorId: number | undefined
  if (options.actor) {
    const slug = `user-${options.actor.id}`
    const author = await prisma.orm.public.Author.upsert({
      conflictOn: { slug },
      create: { slug, name: options.actor.name, email: options.actor.email || null },
      update: {},
    })
    authorId = author.id
  }

  const article = await createArticle({
    actor: options.actor?.id || 'ai-draft',
    authorId,
    categoryId: options.categoryId,
    title: draft.title,
    slug: articleSlug,
    content,
    excerpt: draft.excerpt,
    status: 'draft',
    featuredImage: featuredImageUrl || undefined,
    coverUrl: featuredImageUrl || undefined,
    readingTime: calculateReadingTime(content),
    metaTitle: draft.title,
    metaDescription: draft.excerpt,
    focusKeyphrase: options.targetKeyword || options.topic,
  })

  const record = await prisma.orm.public.AiDraft.create({
    id: `draft-${randomUUID()}`,
    articleId: article.id,
    title: draft.title,
    prompt: options.topic,
    content,
    targetKeyword: options.targetKeyword || options.topic,
    model: result.model,
    status: 'draft',
  })

  return {
    success: true,
    article,
    draftId: record.id,
    featuredImage: featuredImageUrl,
    mediaItemId,
    status: 'draft',
    provenance: {
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
    },
  }
}
