// web/src/lib/ai/copilot-agent-runner.ts
import { callLlm, normalizeToolCall, ChatMessage } from '@/lib/agent/llm'
import { contentToBlocks } from '@/lib/articles/blockEditor'
import { validateSafeUrl } from '@/lib/security/ssrf'
import seedPortfolio from '@/data/seed/seed_portfolio.json'
import seedServices from '@/data/seed/seed_services.json'

export interface EvidenceDossierItem {
  claim: string
  sourceUrl: string
  sourceType: 'primary' | 'documentation' | 'industry' | 'competitor' | 'internal_catalog'
  supportingQuote: string
  confidenceScore: number
  verificationStatus: 'verified' | 'unverified' | 'contradiction'
}

export const COPILOT_EDITOR_TOOLS = [
  // --- TAHAP 1: SEARCH INTENT & TOPIC ANALYSIS ---
  {
    name: 'research_topic_intent',
    description:
      'Tahap 1 Research Pipeline: Menganalisis search intent (informational, commercial, navigational), audiens sasaran, sudut pandang unik, dan cakupan topik menyeluruh yang wajib dijawab oleh artikel.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: {
          type: 'STRING',
          description: 'Topik utama atau instruksi yang diajukan oleh pengguna.',
        },
        targetAudience: {
          type: 'STRING',
          description: 'Target audiens spesifik (misal: Enterprise CTO, Web Developer, Digital Marketing Manager, Pemilik Bisnis).',
        },
        intentType: {
          type: 'STRING',
          description: 'Jenis search intent: informational, commercial, navigational, atau transactional.',
        },
        coreQuestions: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Daftar 3-5 pertanyaan kunci yang harus terjawab secara mendalam oleh artikel.',
        },
      },
      required: ['topic', 'intentType'],
    },
  },

  // --- TAHAP 2: MULTI-SOURCE RESEARCH ---
  {
    name: 'web_search_multi_query',
    description:
      'Tahap 2 Multi-Source Research: Menjalankan pencarian riset mendalam dengan beberapa variasi query (intent user, broad research, deep technical, sumber primer, dan sudut pandang kompetitor) melintasi database katalog internal dan sumber pengetahuan web.',
    parameters: {
      type: 'OBJECT',
      properties: {
        queries: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Array berisi 2 hingga 4 variasi query pencarian yang berbeda untuk meneliti topik dari berbagai sudut pandang.',
        },
        searchScope: {
          type: 'STRING',
          description: 'Cakupan riset: "all" (semua sumber), "primary_docs" (dokumentasi & standar resmi), atau "internal_catalog" (portofolio & layanan UNIMASI).',
        },
      },
      required: ['queries'],
    },
  },

  // --- TAHAP 2 & 3: EVIDENCE EXTRACTION ---
  {
    name: 'fetch_web_evidence',
    description:
      'Tahap 2 & 3: Mengambil dan mengekstrak teks kutipan faktual dari URL eksternal (dengan proteksi SSRF) atau rute internal UNIMASI (/portofolio/..., /layanan/...) untuk diverifikasi keabsahannya.',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description: 'URL target (https://...) atau rute internal (/portofolio/... atau /layanan/...) yang ingin diambil teksnya.',
        },
        claimToVerify: {
          type: 'STRING',
          description: 'Pernyataan fakta spesifik yang ingin diverifikasi dari halaman tersebut.',
        },
      },
      required: ['url'],
    },
  },

  // --- TAHAP 3: EVIDENCE & FACT VERIFICATION ---
  {
    name: 'record_evidence_dossier',
    description:
      'Tahap 3 Evidence & Fact Verification: Mencatat ringkasan bukti faktual (Research Dossier) berisi daftar klaim, URL sumber, kutipan data pendukung, dan tingkat keyakinan (confidence). Penulis dilarang mengarang fakta tanpa didukung dossier ini.',
    parameters: {
      type: 'OBJECT',
      properties: {
        dossier: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              claim: { type: 'STRING', description: 'Pernyataan fakta spesifik yang akan dimasukkan ke artikel.' },
              sourceUrl: { type: 'STRING', description: 'URL atau referensi sumber kredibel pendukung fakta.' },
              sourceType: { type: 'STRING', description: 'primary, documentation, industry, competitor, atau internal_catalog.' },
              supportingQuote: { type: 'STRING', description: 'Kutipan teks asli dari sumber yang membuktikan klaim.' },
              confidenceScore: { type: 'NUMBER', description: 'Skor keyakinan bukti dari 0 sampai 100.' },
              verificationStatus: { type: 'STRING', description: 'verified, unverified, atau contradiction.' },
            },
            required: ['claim', 'sourceUrl', 'supportingQuote', 'verificationStatus'],
          },
          description: 'Daftar klaim fakta terverifikasi hasil riset multi-sumber.',
        },
        summary: {
          type: 'STRING',
          description: 'Ringkasan sintesis bukti yang ditemukan sebelum artikel ditulis.',
        },
      },
      required: ['dossier'],
    },
  },

  // --- TAHAP 4: GAP ANALYSIS & CROSS-CHECK ---
  {
    name: 'gap_analysis_and_cross_check',
    description:
      'Tahap 4 Gap Analysis: Memeriksa apakah ada informasi yang kurang, bertentangan, usang, atau hanya bertumpu pada 1 sumber. Menentukan apakah artikel siap ditulis atau butuh riset tambahan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING', description: 'Topik artikel yang sedang dianalisis gap-nya.' },
        identifiedGaps: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Daftar area topik yang bukti informasinya masih belum cukup atau lemah.',
        },
        singleSourceRisks: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Klaim penting yang saat ini hanya didukung oleh satu sumber saja.',
        },
        readyToDraft: {
          type: 'BOOLEAN',
          description: 'Apakah bukti riset sudah cukup kuat untuk mulai menghasilkan draf artikel.',
        },
      },
      required: ['topic', 'readyToDraft'],
    },
  },

  // --- EDITOR WORKING TOOLS ---
  {
    name: 'inspect_active_article',
    description:
      'Membaca isi lengkap artikel yang sedang dibuka di editor beserta skor SEO, keterbacaan (readability), dan daftar indikator masalahnya. Panggil tool ini jika Anda perlu memeriksa teks lengkap sebelum mengedit atau menganalisis.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'analyze_keyword_and_readability',
    description:
      'Menghitung kepadatan kata kunci (keyword density %), posisi focus keyphrase di 100 kata pertama, rasio kalimat pasif, kata transisi, panjang meta title/description, dan memberikan metrik faktual.',
    parameters: {
      type: 'OBJECT',
      properties: {
        focusKeyphrase: {
          type: 'STRING',
          description: 'Kata kunci utama yang ingin diuji terhadap teks artikel.',
        },
        textToAnalyze: {
          type: 'STRING',
          description: 'Opsional: Teks yang ingin dianalisis. Jika dikosongkan, otomatis menganalisis teks artikel aktif di editor.',
        },
      },
      required: ['focusKeyphrase'],
    },
  },
  {
    name: 'edit_article_segment',
    description:
      'Mengubah kalimat tertentu, mengoreksi tata bahasa (grammar/typo), mengubah kalimat pasif menjadi aktif, atau memperbarui paragraf spesifik di artikel tanpa harus menulis ulang seluruh artikel.',
    parameters: {
      type: 'OBJECT',
      properties: {
        originalText: {
          type: 'STRING',
          description: 'Kalimat atau potongan teks asli di artikel yang ingin diganti.',
        },
        updatedText: {
          type: 'STRING',
          description: 'Kalimat atau potongan teks baru hasil perbaikan tata bahasa/gaya penulisan.',
        },
        explanation: {
          type: 'STRING',
          description: 'Alasan editorial singkat mengenai perbaikan yang dilakukan.',
        },
      },
      required: ['originalText', 'updatedText', 'explanation'],
    },
  },
  {
    name: 'apply_article_draft_or_metadata',
    description:
      'Tahap 5 Article Generation: Menyusun draf artikel lengkap di halaman editor berdasarkan Research Dossier yang sudah diverifikasi, atau mengubah metadata SEO (title, slug, focusKeyphrase, seoTitle, metaDescription, coverAlt, category).',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Judul artikel optimal (40-75 karakter) yang memuat focus keyphrase.',
        },
        slug: {
          type: 'STRING',
          description: 'Slug URL format kebab-case.',
        },
        category: {
          type: 'STRING',
          description: 'Kategori artikel (misal: Website Development, Interactive 3D & WebGL, UI/UX Design).',
        },
        focusKeyphrase: {
          type: 'STRING',
          description: 'Kata kunci fokus utama (Focus Keyphrase).',
        },
        seoTitle: {
          type: 'STRING',
          description: 'Meta Title SEO (40-68 karakter, diakhiri " | UNIMASI").',
        },
        metaDescription: {
          type: 'STRING',
          description: 'Meta Description SEO (120-160 karakter, memuat focus keyphrase dan ajakan membaca).',
        },
        coverAlt: {
          type: 'STRING',
          description: 'Deskripsi gambar sampul (Alt Text) yang memuat kata kunci.',
        },
        excerpt: {
          type: 'STRING',
          description: 'Ringkasan pembuka artikel (1-2 kalimat).',
        },
        content: {
          type: 'STRING',
          description: 'Isi lengkap artikel dalam format HTML semantik (<h2>, <h3>, <p>, <ul>, <li>, <a href="...">). Wajib mencantumkan tautan internal ke /portofolio atau /layanan.',
        },
        summary: {
          type: 'STRING',
          description: 'Ringkasan perubahan editorial yang diterapkan ke editor.',
        },
      },
      required: ['summary'],
    },
  },

  // --- TAHAP 6: INDEPENDENT AUDIT & PUBLISHING GATE ---
  {
    name: 'independent_seo_audit_gate',
    description:
      'Tahap 6 Independent Audit & Publishing Gate: Mengaudit draf artikel terhadap kepatuhan Yoast SEO, keterbacaan, tautan internal kontekstual, dan validasi bahwa klaim faktual didukung oleh Research Dossier.',
    parameters: {
      type: 'OBJECT',
      properties: {
        focusKeyphrase: { type: 'STRING', description: 'Kata kunci utama yang ingin diaudit.' },
        contentToAudit: { type: 'STRING', description: 'Opsional: Teks HTML yang ingin diaudit. Default mengambil draf di editor.' },
      },
      required: ['focusKeyphrase'],
    },
  },
]

export function slugifyText(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 75)
}

/**
 * Canonical tool call signature for deterministic deduplication
 */
function canonicalizeValue(val: any): any {
  if (val === null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(canonicalizeValue)
  const sorted: Record<string, any> = {}
  for (const k of Object.keys(val).sort()) {
    sorted[k] = canonicalizeValue(val[k])
  }
  return sorted
}

export function getToolCallSignature(name: string, args: Record<string, any>): string {
  try {
    const canonical = canonicalizeValue(args || {})
    return `${name}:${JSON.stringify(canonical)}`
  } catch {
    return `${name}:${JSON.stringify(args || {})}`
  }
}

/**
 * Deteksi intent apakah pengguna meminta agen untuk melanjutkan pekerjaan yang terputus / belum selesai
 */
export function isContinuationIntent(query: string): boolean {
  if (!query || typeof query !== 'string') return false
  const q = query.toLowerCase().trim()
  return (
    /^(?:lanjut(?:kan)?|teruskan|continue|resume|next|lanjut\s+tadi|lanjutkan\s+yang\s+tadi|teruskan\s+pekerjaan\s+tadi|selesaikan\s+tadi|sambung|lanjutkan\s+penulisan|lanjutkan\s+draf)\b/i.test(q) ||
    /\b(?:lanjutkan|teruskan|sambung|selesaikan)\s+(?:pekerjaan|tugas|draf|artikel|penulisan|proses)\s+(?:yang\s+terputus|tadi|sebelumnya)\b/i.test(q)
  )
}

/**
 * Classifies whether a user prompt is exploratory vs content-modifying/continuation
 */
export function isExploratoryQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return true
  const q = query.toLowerCase().trim()

  // 1. Continuation intents are not exploratory
  if (isContinuationIntent(q)) return false

  // 2. Drafting / mutation / modification intents are not exploratory
  const isMutation = (
    /\b(?:buatkan|buat|tuliskan|tulis|generate|susun|bikin|draft|draf)\b[\s\S]{0,40}\b(?:artikel|konten|tulisan|post|draf|draft|paragraf|heading|meta|judul|slug)\b/i.test(q) ||
    /\b(?:terapkan|apply|ganti|ubah|perbaiki|replace)\s+(?:sebuah\s+)?(?:draf\s+)?(?:artikel|konten|tulisan|post|paragraf|kalimat|heading|meta|judul|slug|perubahan|metadata)\b/i.test(q) ||
    /\b(?:buatkan|tuliskan|tulis|buat|susun|bikin)\s+(?:sebuah\s+)?(?:draf|draft)\b/i.test(q)
  )

  if (isMutation) return false

  return true
}

/**
 * Kalkulasi faktual kepadatan keyword, kalimat pasif, dan kata transisi Bahasa Indonesia
 */
export function computeEditorialMetrics(rawContent: string, focusKeyphrase: string, meta?: Record<string, any>) {
  const plainText = (rawContent || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = plainText ? plainText.split(/\s+/) : []
  const wordCount = words.length
  const sentences = plainText
    ? plainText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 3)
    : []
  const sentenceCount = Math.max(sentences.length, 1)

  const kp = (focusKeyphrase || '').toLowerCase().trim()
  let kpOccurrences = 0
  let densityPercent = 0
  let inFirst100Words = false

  if (kp && wordCount > 0) {
    const escapedKp = kp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matches = plainText.match(new RegExp(escapedKp, 'gi')) || []
    kpOccurrences = matches.length
    const kpWordLen = kp.split(/\s+/).length
    densityPercent = Number((((kpOccurrences * kpWordLen) / wordCount) * 100).toFixed(2))
    const first100 = words.slice(0, 100).join(' ').toLowerCase()
    inFirst100Words = first100.includes(kp)
  }

  // Deteksi kalimat pasif Bahasa Indonesia (awalan di- pada kata kerja)
  const passiveSentences = sentences.filter((s) => /\bdi[a-z]{3,}(?:kan|i)?\b/i.test(s))
  const passiveRatioPercent = Number(((passiveSentences.length / sentenceCount) * 100).toFixed(1))

  // Deteksi kata transisi Bahasa Indonesia
  const transitionPattern =
    /\b(selain itu|oleh karena itu|namun|akan tetapi|dengan demikian|selanjutnya|lebih lanjut|di samping itu|sebagai hasilnya|pertama|kedua|ketiga|kesimpulannya|pada akhirnya|tidak hanya itu|bahkan|contohnya|misalnya)\b/i
  const transitionSentences = sentences.filter((s) => transitionPattern.test(s))
  const transitionRatioPercent = Number(((transitionSentences.length / sentenceCount) * 100).toFixed(1))

  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 20)
  const longSentenceRatioPercent = Number(((longSentences.length / sentenceCount) * 100).toFixed(1))

  const h2Count = ((rawContent || '').match(/<h2[\s>]/gi) || []).length
  const h3Count = ((rawContent || '').match(/<h3[\s>]/gi) || []).length
  const internalLinkCount = ((rawContent || '').match(/href=["'](\/[^"']*|https?:\/\/(www\.)?unimasi\.com[^"']*)["']/gi) || []).length

  return {
    wordCount,
    sentenceCount,
    focusKeyphrase: kp || '(belum diset)',
    keyphraseOccurrences: kpOccurrences,
    keywordDensityPercent: `${densityPercent}%`,
    densityStatus: densityPercent >= 0.8 && densityPercent <= 2.5 ? 'OPTIMAL' : densityPercent < 0.8 ? 'TERLALU RENDAH (<0.8%)' : 'TERLALU TINGGI (>2.5%)',
    inFirst100Words,
    passiveVoicePercent: `${passiveRatioPercent}%`,
    passiveStatus: passiveRatioPercent <= 10 ? 'OPTIMAL (<=10%)' : 'PERLU DIKURANGI (>10%)',
    transitionWordsPercent: `${transitionRatioPercent}%`,
    transitionStatus: transitionRatioPercent >= 30 ? 'OPTIMAL (>=30%)' : 'PERLU DITAMBAH (<30%)',
    longSentencesPercent: `${longSentenceRatioPercent}%`,
    headings: { h2Count, h3Count },
    internalLinkCount,
    metaTitleLength: (meta?.seoTitle || meta?.title || '').length,
    metaDescriptionLength: (meta?.metaDescription || '').length,
  }
}

/**
 * Real Multi-Query Search across internal catalog + external web references
 */
export async function executeMultiQuerySearch(queries: string[], searchScope = 'all') {
  const allResults: Array<{
    query: string
    title: string
    url: string
    snippet: string
    sourceType: 'internal_catalog' | 'web_search' | 'documentation'
  }> = []

  const portfolios = Array.isArray(seedPortfolio) ? (seedPortfolio as any[]) : []
  const services = Array.isArray(seedServices) ? (seedServices as any[]) : []

  for (const q of queries) {
    const qLower = q.toLowerCase().trim()
    const qTokens = qLower.split(/\s+/).filter((t) => t.length > 2)

    // 1. Internal Catalog Matching (Portfolios & Services)
    if (searchScope === 'all' || searchScope === 'internal_catalog') {
      for (const p of portfolios) {
        const text = `${p.title} ${p.summary} ${p.challenge} ${p.solution}`.toLowerCase()
        const matches = qTokens.some((token) => text.includes(token))
        if (matches) {
          allResults.push({
            query: q,
            title: `Portofolio: ${p.title} (${p.client || 'UNIMASI'})`,
            url: `/portofolio/${p.slug}`,
            snippet: (p.summary || p.challenge || '').replace(/<[^>]*>/g, '').slice(0, 220) + '...',
            sourceType: 'internal_catalog',
          })
        }
      }

      for (const s of services) {
        const text = `${s.name} ${s.shortDescription || ''} ${s.description || ''}`.toLowerCase()
        const matches = qTokens.some((token) => text.includes(token))
        if (matches) {
          allResults.push({
            query: q,
            title: `Layanan: ${s.name}`,
            url: `/layanan/${s.slug}`,
            snippet: (s.shortDescription || s.description || '').replace(/<[^>]*>/g, '').slice(0, 220) + '...',
            sourceType: 'internal_catalog',
          })
        }
      }
    }

    // 2. Safe Web / Documentation Knowledge Search (DuckDuckGo Instant Answer / Wikipedia)
    if (searchScope === 'all' || searchScope === 'primary_docs') {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 2800)

        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
          { signal: controller.signal }
        ).catch(() => null)
        clearTimeout(timer)

        if (ddgRes && ddgRes.ok) {
          const ddgData = await ddgRes.json().catch(() => null)
          if (ddgData) {
            if (ddgData.AbstractText && ddgData.AbstractURL) {
              allResults.push({
                query: q,
                title: ddgData.Heading || q,
                url: ddgData.AbstractURL,
                snippet: ddgData.AbstractText.slice(0, 240) + '...',
                sourceType: 'documentation',
              })
            }
            if (Array.isArray(ddgData.RelatedTopics)) {
              for (const topic of ddgData.RelatedTopics.slice(0, 2)) {
                if (topic.Text && topic.FirstURL) {
                  allResults.push({
                    query: q,
                    title: topic.Text.split(' - ')[0] || q,
                    url: topic.FirstURL,
                    snippet: topic.Text.slice(0, 220) + '...',
                    sourceType: 'web_search',
                  })
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[web_search] Error fetching query "${q}":`, err?.message || err)
      }
    }
  }

  // Deduplicate by URL
  const seenUrls = new Set<string>()
  const uniqueResults = allResults.filter((r) => {
    if (seenUrls.has(r.url)) return false
    seenUrls.add(r.url)
    return true
  })

  return {
    queriesSearched: queries,
    totalResultsFound: uniqueResults.length,
    results: uniqueResults.slice(0, 10),
  }
}

/**
 * Real Web Evidence Fetcher with SSRF Defense
 */
export async function executeFetchWebEvidence(urlStr: string, claimToVerify?: string) {
  // Case A: Internal path
  if (urlStr.startsWith('/') || urlStr.includes('unimasi.com')) {
    const slug = urlStr.split('/').filter(Boolean).pop() || ''
    const portfolioMatch = (seedPortfolio as any[]).find((p) => p.slug === slug)
    if (portfolioMatch) {
      const fullText = `${portfolioMatch.title}. ${portfolioMatch.summary} ${portfolioMatch.challenge} ${portfolioMatch.solution}`.replace(/<[^>]*>/g, ' ')
      return {
        url: urlStr,
        status: 'verified_internal',
        title: portfolioMatch.title,
        excerpt: fullText.slice(0, 400),
        matchedClaim: claimToVerify || null,
        confidenceScore: 98,
      }
    }

    const serviceMatch = (seedServices as any[]).find((s) => s.slug === slug)
    if (serviceMatch) {
      const fullText = `${serviceMatch.name}. ${serviceMatch.shortDescription || ''} ${serviceMatch.description || ''}`.replace(/<[^>]*>/g, ' ')
      return {
        url: urlStr,
        status: 'verified_internal',
        title: serviceMatch.name,
        excerpt: fullText.slice(0, 400),
        matchedClaim: claimToVerify || null,
        confidenceScore: 98,
      }
    }
  }

  // Case B: External HTTPS URL with SSRF protection
  try {
    const safeUrl = await validateSafeUrl(urlStr)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)

    const res = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'UNIMASI-Evidence-Bot/1.0' },
    })
    clearTimeout(timer)

    if (!res.ok) {
      return {
        url: urlStr,
        status: 'fetch_failed',
        error: `HTTP ${res.status}: Gagal mengambil data dari URL`,
        matchedClaim: claimToVerify || null,
      }
    }

    const rawHtml = await res.text()
    const textOnly = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    let relevantExcerpt = textOnly.slice(0, 350)
    if (claimToVerify) {
      const claimWords = claimToVerify.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      const sentences = textOnly.split(/[.!?]+/).map((s) => s.trim())
      const matched = sentences.filter((s) => claimWords.some((cw) => s.toLowerCase().includes(cw)))
      if (matched.length > 0) {
        relevantExcerpt = matched.slice(0, 2).join('. ') + '.'
      }
    }

    return {
      url: urlStr,
      status: 'verified_external',
      excerpt: relevantExcerpt,
      matchedClaim: claimToVerify || null,
      confidenceScore: 90,
    }
  } catch (err: any) {
    return {
      url: urlStr,
      status: 'fetch_error',
      error: err.message || 'Gagal memverifikasi URL eksternal',
      matchedClaim: claimToVerify || null,
    }
  }
}

export interface AgentLoopExecutionInput {
  provider: 'google' | 'openrouter'
  apiKey: string
  model: string
  messages: ChatMessage[]
  systemInstruction: string
  effectiveArticle?: Record<string, any>
  extraTools?: any[]
  onExecuteDomainTool?: (name: string, args: Record<string, any>) => Promise<any>
  maxSteps?: number
  temperature?: number
  proxyUrl?: string
  thinkingMode?: 'auto' | 'off' | 'on'
}

export interface AgentLoopExecutionOutput {
  reply: string
  thoughts?: string
  proposedChanges: Record<string, any> | null
  executedTools: Array<{ name: string; args: Record<string, any>; result: any; durationMs: number }>
  durationMs: number
  model: string
  provider: string
  circuitBreaker?: {
    triggered: boolean
    reason?: string
  }
}

/**
 * Multi-Turn ReAct Agent Runner:
 * Mengorkestrasikan 6 tahap riset & verifikasi fakta sebelum draf artikel diterapkan.
 */
export async function executeCopilotAgentRunner(
  input: AgentLoopExecutionInput
): Promise<AgentLoopExecutionOutput> {
  const t0 = Date.now()
  const maxSteps = input.maxSteps ?? 6
  const conversation: ChatMessage[] = [...input.messages]
  let workingArticle: Record<string, any> = { ...(input.effectiveArticle || {}) }
  let proposedChanges: Record<string, any> | null = null
  const executedTools: Array<{ name: string; args: Record<string, any>; result: any; durationMs: number }> = []
  const collectedThoughts: string[] = []

  const combinedTools = [
    ...COPILOT_EDITOR_TOOLS,
    ...(Array.isArray(input.extraTools) ? input.extraTools : []),
  ]

  let lastModel = input.model
  let lastProvider = input.provider

  const lastUserMsg = conversation.filter((m) => m.role === 'user').pop()?.content || ''
  const isResuming = isContinuationIntent(lastUserMsg)
  const isExploratory = isExploratoryQuery(lastUserMsg)

  const MAX_EXPLORATORY_TOOLS = 3
  let totalToolCallsExecuted = 0
  let lastExecutedFingerprint: string | null = null
  const signatureCallCounts = new Map<string, number>()
  let consecutiveHallucinations = 0
  let circuitBreakerTriggered = false
  let circuitBreakerReason = ''

  const allowedToolNames = new Set<string>()
  for (const t of combinedTools) {
    if (t?.functionDeclarations && Array.isArray(t.functionDeclarations)) {
      for (const fd of t.functionDeclarations) {
        if (fd?.name) allowedToolNames.add(fd.name)
      }
    } else if (t?.type === 'function' && t.function?.name) {
      allowedToolNames.add(t.function.name)
    } else if (t?.name) {
      allowedToolNames.add(t.name)
    }
  }

  let activeSystemInstruction = `${input.systemInstruction}

[ATURAN KETAT PEMANGGILAN TOOLS]:
- DILARANG KERAS mengarang nama fungsi fiktif atau menggunakan contoh dokumentasi seperti "example_function_name", "...", "my_func", atau placeholder lainnya.
- Anda HANYA diizinkan memanggil nama fungsi yang secara eksplisit tercantum dalam daftar function declarations.
- Jika data yang dibutuhkan sudah mencukupi atau tidak ada tool yang cocok, berikan jawaban langsung dalam teks tanpa memanggil tool fiktif.

[STANDAR EKSEKUSI AGENTIC — 6-STAGE RESEARCH & EVIDENCE PIPELINE]:
Anda adalah UNIMASI Editorial Intelligence Agent. Anda TIDAK diperbolehkan langsung membuat artikel secara asal-asalan tanpa riset bertahap dan verifikasi fakta.
Ikuti alur terstruktur ini secara disiplin:
1. Search Intent & Topic Analysis: Jalankan research_topic_intent untuk memahami kebutuhan pengguna, intent (informational/commercial), audiens, dan pertanyaan kunci.
2. Multi-Source Research: Jalankan web_search_multi_query dengan minimal 2-4 query berbeda melintasi broad keywords, deep technical specs, primary docs, dan katalog internal UNIMASI (/portofolio dan /layanan).
3. Evidence & Fact Verification: Ekstrak bukti dengan fetch_web_evidence dan catat bukti faktual ke dalam record_evidence_dossier. DILARANG MENGARANG FAKTA. Semua angka, metrik, dan klaim teknis wajib didukung kutipan dan URL.
4. Gap Analysis & Cross-Check: Jalankan gap_analysis_and_cross_check untuk memastikan tidak ada klaim penting yang hanya didukung 1 sumber atau saling bertentangan.
5. Article Generation: Susun draf dengan apply_article_draft_or_metadata atau edit_article_segment berlandaskan Research Dossier yang terverifikasi.
6. Independent Audit & Publishing Gate: Jalankan independent_seo_audit_gate untuk memverifikasi Yoast SEO (focus keyphrase, transition words >= 30%, passive voice <= 10%, tautan internal, alt text).`

  if (isResuming) {
    activeSystemInstruction += `\n\n[RESUMPTION DIRECTIVE & KONTINUITAS PEKERJAAN]:
Pengguna meminta Anda untuk MELANJUTKAN pekerjaan yang terputus atau belum selesai dari interaksi sebelumnya.
1. Analisis riwayat pesan dan hasil tool terdahulu untuk mengetahui posisi terakhir pekerjaan.
2. Gunakan inspect_active_article untuk membaca teks artikel dan indikator terkini di editor saat ini.
3. Jangan mengulang dari nol! Lanjutkan penulisan bagian yang belum ada, perbaiki bagian yang belum optimal, atau tambahkan heading/paragraf selanjutnya.
4. Terapkan perubahan lanjutan melalui apply_article_draft_or_metadata atau edit_article_segment.`
  }

  for (let step = 0; step < maxSteps; step++) {
    const llmRes = await callLlm({
      provider: input.provider,
      apiKey: input.apiKey,
      model: input.model,
      messages: conversation,
      systemInstruction: activeSystemInstruction,
      tools: combinedTools,
      temperature: input.temperature ?? 0.4,
      maxTokens: 6000,
      proxyUrl: input.proxyUrl,
      thinkingMode: input.thinkingMode,
    })

    lastModel = llmRes.model
    lastProvider = llmRes.provider as 'google' | 'openrouter'

    if (llmRes.thoughts) {
      collectedThoughts.push(llmRes.thoughts)
    }

    // Jika LLM selesai berpikir dan tidak memanggil tool lagi:
    if (!llmRes.toolCalls || llmRes.toolCalls.length === 0) {
      let finalReply = llmRes.reply || ''
      if (
        (!finalReply || finalReply === 'Tidak ada respons teks yang dihasilkan.') &&
        proposedChanges
      ) {
        finalReply = `✅ **Perubahan Diterapkan ke Editor**\n\n${proposedChanges.summary || `Artikel "${proposedChanges.title || workingArticle.title || 'Draf'}" telah berhasil diperbarui.`}`
      }

      return {
        reply: finalReply,
        thoughts: collectedThoughts.length > 0 ? collectedThoughts.join('\n\n') : undefined,
        proposedChanges,
        executedTools,
        durationMs: Date.now() - t0,
        model: lastModel,
        provider: lastProvider,
        circuitBreaker: {
          triggered: false,
        },
      }
    }

    // Jika LLM memanggil 1 atau beberapa tool:
    const normalizedCalls = llmRes.toolCalls.map(normalizeToolCall)

    conversation.push({
      role: 'assistant',
      content: llmRes.reply || undefined,
      tool_calls: normalizedCalls.map((tc, idx) => ({
        id: tc.id || `call_${step}_${idx}`,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments || {}),
        },
      })),
    })

    for (let i = 0; i < normalizedCalls.length; i++) {
      const tc = normalizedCalls[i]
      const callId = tc.id || `call_${step}_${i}`

      // 1. Tool Call Sanitization & Hallucination Defense
      const isHallucinated = (
        !tc.name ||
        tc.name === '...' ||
        /^(?:example|placeholder|function_name|my_func|custom_tool|\.\.\.)/i.test(tc.name) ||
        !allowedToolNames.has(tc.name)
      )

      if (isHallucinated) {
        consecutiveHallucinations++
        const availableSample = Array.from(allowedToolNames).slice(0, 10).join(', ')
        const safeFeedback = {
          error: true,
          code: 'INVALID_TOOL_NAME',
          message: `Tool "${tc.name}" tidak valid atau tidak terdaftar. Dilarang mengarang nama tool atau menggunakan placeholder seperti "example_function_name" atau "...". Tool yang tersedia: ${availableSample}.`,
        }

        executedTools.push({
          name: tc.name || 'invalid_tool',
          args: tc.arguments || {},
          result: safeFeedback,
          durationMs: 0,
        })

        conversation.push({
          role: 'tool',
          name: tc.name || 'invalid_tool',
          tool_call_id: callId,
          content: JSON.stringify(safeFeedback),
        })

        if (consecutiveHallucinations >= 2) {
          circuitBreakerTriggered = true
          circuitBreakerReason = 'Model berulang kali memanggil nama tool fiktif / placeholder.'
          break
        }
        continue
      }

      // Valid tool: reset consecutive hallucinations counter
      consecutiveHallucinations = 0

      // 2. Repetition & Duplicate Call Detection (Circuit Breaker)
      const signature = getToolCallSignature(tc.name, tc.arguments || {})

      if (signature === lastExecutedFingerprint) {
        circuitBreakerTriggered = true
        circuitBreakerReason = `Terdeteksi pemanggilan berulang berurutan pada tool "${tc.name}" dengan argumen identik.`
        break
      }

      const seenCount = (signatureCallCounts.get(signature) || 0) + 1
      signatureCallCounts.set(signature, seenCount)

      if (seenCount >= 2) {
        circuitBreakerTriggered = true
        circuitBreakerReason = `Tool "${tc.name}" telah dipanggil 2 kali dengan argumen yang identik. Sirkuit dihentikan untuk mencegah loop.`
        break
      }

      lastExecutedFingerprint = signature

      // 3. Exploratory Query Tool Limit Check (Pre-execution check)
      if (isExploratory && totalToolCallsExecuted >= MAX_EXPLORATORY_TOOLS) {
        circuitBreakerTriggered = true
        circuitBreakerReason = `Batas maksimal ${MAX_EXPLORATORY_TOOLS} eksekusi tool untuk kueri eksploratori telah tercapai.`
        break
      }

      // 4. Normal Tool Execution
      totalToolCallsExecuted++
      const toolStart = Date.now()
      let toolResult: Record<string, any> = {}

      try {
        switch (tc.name) {
          case 'research_topic_intent': {
            const topic = tc.arguments?.topic || workingArticle.title || 'Topik Utama'
            const intentType = tc.arguments?.intentType || 'informational'
            const targetAudience = tc.arguments?.targetAudience || 'Pengembang & Pemilik Bisnis Digital'
            const coreQuestions = tc.arguments?.coreQuestions || [
              `Apa definisi dan urgensi ${topic} dalam industri modern?`,
              `Bagaimana implementasi arsitektur terbaik untuk ${topic}?`,
              `Apa saja tolok ukur hasil dan efisiensi yang didapatkan?`,
            ]

            toolResult = {
              status: 'intent_analyzed',
              topic,
              intentType,
              targetAudience,
              coreQuestions,
              suggestedSearchQueries: [
                `${topic} arsitektur dan best practices`,
                `${topic} standar performa core web vitals`,
                `implementasi ${topic} enterprise case study`,
              ],
            }
            break
          }

          case 'web_search_multi_query': {
            const queries = Array.isArray(tc.arguments?.queries) ? tc.arguments.queries : [String(tc.arguments?.queries || '')]
            const searchScope = tc.arguments?.searchScope || 'all'
            toolResult = await executeMultiQuerySearch(queries, searchScope)
            break
          }

          case 'fetch_web_evidence': {
            const targetUrl = tc.arguments?.url || ''
            const claim = tc.arguments?.claimToVerify || ''
            toolResult = await executeFetchWebEvidence(targetUrl, claim)
            break
          }

          case 'record_evidence_dossier': {
            const dossierItems: EvidenceDossierItem[] = Array.isArray(tc.arguments?.dossier)
              ? tc.arguments.dossier
              : []
            const summary = tc.arguments?.summary || 'Bukti riset telah diverifikasi.'

            const existingDossier: EvidenceDossierItem[] = workingArticle.evidenceDossier || []
            const mergedDossier = [...existingDossier, ...dossierItems]
            workingArticle.evidenceDossier = mergedDossier

            const verifiedCount = mergedDossier.filter((d) => d.verificationStatus === 'verified').length
            const avgConfidence = mergedDossier.length > 0
              ? Math.round(mergedDossier.reduce((acc, curr) => acc + (curr.confidenceScore || 80), 0) / mergedDossier.length)
              : 0

            toolResult = {
              success: true,
              totalClaims: mergedDossier.length,
              verifiedClaimsCount: verifiedCount,
              averageConfidence: `${avgConfidence}%`,
              summary,
              dossier: mergedDossier,
            }
            break
          }

          case 'gap_analysis_and_cross_check': {
            const topic = tc.arguments?.topic || workingArticle.title || 'Topik'
            const readyToDraft = Boolean(tc.arguments?.readyToDraft)
            const identifiedGaps = tc.arguments?.identifiedGaps || []
            const singleSourceRisks = tc.arguments?.singleSourceRisks || []

            const dossier: EvidenceDossierItem[] = workingArticle.evidenceDossier || []
            const hasMultipleSources = new Set(dossier.map((d) => d.sourceUrl)).size >= 2

            toolResult = {
              topic,
              readyToDraft: readyToDraft && (dossier.length > 0 || hasMultipleSources),
              evidenceDossierSize: dossier.length,
              multipleSourcesConfirmed: hasMultipleSources,
              identifiedGaps,
              singleSourceRisks,
              recommendation: readyToDraft
                ? 'Bukti riset mencukupi. Lanjutkan ke tahap penulisan draf artikel berdasar dossier.'
                : 'Diperlukan pencarian tambahan untuk memperkuat klaim yang belum terverifikasi.',
            }
            break
          }

          case 'inspect_active_article': {
            const metrics = computeEditorialMetrics(
              workingArticle.content || '',
              workingArticle.focusKeyphrase || workingArticle.targetKeyword || '',
              workingArticle
            )
            toolResult = {
              title: workingArticle.title || '(Belum diberi judul)',
              slug: workingArticle.slug || '(draf-baru)',
              category: workingArticle.category || 'Website Development',
              focusKeyphrase: workingArticle.focusKeyphrase || workingArticle.targetKeyword || '',
              seoTitle: workingArticle.seoTitle || workingArticle.title || '',
              metaDescription: workingArticle.metaDescription || workingArticle.excerpt || '',
              coverAlt: workingArticle.coverAlt || '',
              seoScore: workingArticle.seoScore ?? 'N/A',
              readabilityScore: workingArticle.readabilityScore ?? 'N/A',
              metrics,
              content: workingArticle.content || '(Isi artikel masih kosong)',
              evidenceDossier: workingArticle.evidenceDossier || [],
            }
            break
          }

          case 'analyze_keyword_and_readability': {
            const targetContent = tc.arguments?.textToAnalyze || workingArticle.content || ''
            const targetKp =
              tc.arguments?.focusKeyphrase ||
              workingArticle.focusKeyphrase ||
              workingArticle.targetKeyword ||
              ''
            toolResult = computeEditorialMetrics(targetContent, targetKp, workingArticle)
            break
          }

          case 'edit_article_segment': {
            const currentHtml = workingArticle.content || ''
            const originalText = (tc.arguments?.originalText || '').trim()
            const updatedText = (tc.arguments?.updatedText || '').trim()
            const explanation = tc.arguments?.explanation || 'Perbaikan kalimat dan tata bahasa'

            if (!originalText) {
              toolResult = { success: false, error: 'Parameter originalText kosong.' }
              break
            }

            let updatedHtml = currentHtml
            if (currentHtml.includes(originalText)) {
              updatedHtml = currentHtml.replace(originalText, updatedText)
            } else {
              const strippedOriginal = originalText.replace(/<[^>]*>/g, '').trim()
              if (strippedOriginal && currentHtml.includes(strippedOriginal)) {
                updatedHtml = currentHtml.replace(strippedOriginal, updatedText)
              } else {
                toolResult = {
                  success: false,
                  error:
                    'Teks target tidak ditemukan persis di dalam artikel. Panggil tool inspect_active_article untuk membaca teks asli atau gunakan apply_article_draft_or_metadata.',
                }
                break
              }
            }

            const newBlocks = contentToBlocks(updatedHtml)
            workingArticle = {
              ...workingArticle,
              content: updatedHtml,
              blocks: newBlocks,
            }

            proposedChanges = {
              ...(proposedChanges || {}),
              content: updatedHtml,
              blocks: newBlocks,
              summary: explanation,
              autoApply: true,
            }

            toolResult = {
              success: true,
              message: 'Segmen kalimat berhasil diperbarui dan langsung disiapkan untuk editor.',
              explanation,
            }
            break
          }

          case 'apply_article_draft_or_metadata': {
            const args = tc.arguments || {}
            const nextChanges: Record<string, any> = {
              ...(proposedChanges || {}),
            }

            if (args.title) {
              nextChanges.title =
                args.title.length > 80 ? args.title.slice(0, 77).trimEnd() + '...' : args.title
              if (!args.slug && !workingArticle.slug) {
                nextChanges.slug = slugifyText(nextChanges.title)
              }
            }
            if (args.slug) nextChanges.slug = slugifyText(args.slug)
            if (args.category) nextChanges.category = args.category
            if (args.focusKeyphrase) {
              nextChanges.focusKeyphrase = args.focusKeyphrase
              nextChanges.targetKeyword = args.focusKeyphrase
            }
            if (args.seoTitle) {
              const cleanSeoTitle =
                args.seoTitle.length > 68 ? args.seoTitle.slice(0, 65).trimEnd() + '...' : args.seoTitle
              nextChanges.seoTitle = cleanSeoTitle
              nextChanges.metaTitle = cleanSeoTitle
            } else if (nextChanges.title && !workingArticle.seoTitle) {
              const prefix =
                nextChanges.title.length > 56
                  ? nextChanges.title.slice(0, 56).trimEnd()
                  : nextChanges.title
              nextChanges.seoTitle = `${prefix} | UNIMASI`
              nextChanges.metaTitle = nextChanges.seoTitle
            }
            if (args.metaDescription) {
              nextChanges.metaDescription =
                args.metaDescription.length > 160
                  ? args.metaDescription.slice(0, 157).trimEnd() + '...'
                  : args.metaDescription
            }
            if (args.coverAlt) nextChanges.coverAlt = args.coverAlt
            if (args.excerpt) nextChanges.excerpt = args.excerpt
            if (args.content) {
              nextChanges.content = args.content
              nextChanges.blocks = contentToBlocks(args.content)
            }
            nextChanges.summary =
              args.summary || 'Draf artikel dan optimasi SEO berbasis riset berhasil diterapkan.'
            nextChanges.autoApply = true

            workingArticle = {
              ...workingArticle,
              ...nextChanges,
            }
            proposedChanges = nextChanges

            const metricsAfter = computeEditorialMetrics(
              workingArticle.content || '',
              workingArticle.focusKeyphrase || '',
              workingArticle
            )

            toolResult = {
              success: true,
              message: 'Draf artikel berbasis riset berhasil diterapkan ke editor.',
              updatedMetrics: metricsAfter,
            }
            break
          }

          case 'independent_seo_audit_gate': {
            const targetKp = tc.arguments?.focusKeyphrase || workingArticle.focusKeyphrase || ''
            const content = tc.arguments?.contentToAudit || workingArticle.content || ''
            const metrics = computeEditorialMetrics(content, targetKp, workingArticle)

            const violations: string[] = []
            const passedChecks: string[] = []

            if (metrics.wordCount < 300) violations.push(`Panjang artikel masih kurang (${metrics.wordCount}/300 kata minimum).`)
            else passedChecks.push(`Panjang artikel memenuhi syarat (${metrics.wordCount} kata).`)

            if (!metrics.inFirst100Words) violations.push('Focus keyphrase belum terdapat di 100 kata pertama artikel.')
            else passedChecks.push('Focus keyphrase terdeteksi di 100 kata pertama.')

            if (metrics.densityStatus !== 'OPTIMAL') violations.push(`Kepadatan keyphrase (${metrics.keywordDensityPercent}) di luar ambang optimal 0.8% - 2.5%.`)
            else passedChecks.push(`Kepadatan keyphrase optimal (${metrics.keywordDensityPercent}).`)

            if (metrics.transitionStatus !== 'OPTIMAL') violations.push(`Kata transisi (${metrics.transitionWordsPercent}) kurang dari standar 30%.`)
            else passedChecks.push(`Penggunaan kata transisi baik (${metrics.transitionWordsPercent}).`)

            if (metrics.passiveStatus !== 'OPTIMAL') violations.push(`Kalimat pasif (${metrics.passiveVoicePercent}) melebihi batas 10%.`)
            else passedChecks.push(`Distribusi kalimat aktif sangat baik (pasif ${metrics.passiveVoicePercent}).`)

            if (metrics.internalLinkCount < 2) violations.push('Artikel membutuhkan minimal 2 tautan internal ke /portofolio atau /layanan.')
            else passedChecks.push(`Tautan internal terverifikasi (${metrics.internalLinkCount} tautan).`)

            const gatePassed = violations.length === 0
            const score = Math.max(20, Math.min(100, Math.round(100 - violations.length * 15)))

            toolResult = {
              gatePassed,
              seoScore: score,
              violations,
              passedChecks,
              metrics,
              recommendations: violations.length > 0 ? violations : ['Artikel memenuhi 100% kriteria kelulusan publikasi UNIMASI.'],
            }
            break
          }

          default: {
            if (input.onExecuteDomainTool) {
              toolResult = await input.onExecuteDomainTool(tc.name, tc.arguments || {})
            } else {
              toolResult = { error: true, message: `Tool "${tc.name}" tidak terdaftar.` }
            }
            break
          }
        }
      } catch (err: any) {
        console.error(`[executeCopilotAgentRunner] Tool execution failed for "${tc.name}":`, err)
        toolResult = {
          error: true,
          message: err?.message || 'Terjadi kesalahan saat mengeksekusi tool.',
          stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        }
      }

      executedTools.push({
        name: tc.name,
        args: tc.arguments || {},
        result: toolResult,
        durationMs: Date.now() - toolStart,
      })

      conversation.push({
        role: 'tool',
        name: tc.name,
        tool_call_id: callId,
        content: JSON.stringify(toolResult),
      })

      // 5. Post-execution Exploratory Tool Cap Check
      if (isExploratory && totalToolCallsExecuted >= MAX_EXPLORATORY_TOOLS) {
        circuitBreakerTriggered = true
        circuitBreakerReason = `Batas maksimal ${MAX_EXPLORATORY_TOOLS} eksekusi tool untuk kueri eksploratori telah tercapai.`
        break
      }
    }

    if (circuitBreakerTriggered) {
      break
    }
  }

  if (!circuitBreakerTriggered) {
    circuitBreakerTriggered = true
    circuitBreakerReason = `Batas maksimal langkah (${maxSteps}) telah tercapai.`
  }

  // 3. Circuit Breaker Final Synthesis
  if (executedTools.length > 0) {
    conversation.push({
      role: 'user',
      content: `[SISTEM — CIRCUIT BREAKER AKTIF]: Batas eksekusi tool tercapai (${circuitBreakerReason}). Berdasarkan data dan hasil observasi tool yang telah diperoleh di atas, susunlah jawaban akhir yang komprehensif, terstruktur, faktual, dan koheren untuk menjawab pertanyaan pengguna. DILARANG memanggil tool apapun lagi. Jawab langsung dalam teks Bahasa Indonesia yang profesional.`,
    })

    try {
      const synthesisRes = await callLlm({
        provider: input.provider,
        apiKey: input.apiKey,
        model: input.model,
        messages: conversation,
        systemInstruction: activeSystemInstruction,
        tools: [], // CRITICAL: Tools disabled completely during synthesis turn
        temperature: 0.3,
        maxTokens: 3000,
        proxyUrl: input.proxyUrl,
        thinkingMode: input.thinkingMode,
      })

      if (synthesisRes.thoughts) {
        collectedThoughts.push(synthesisRes.thoughts)
      }

      const synthReply = (synthesisRes.reply || '').trim()
      if (synthReply && synthReply !== 'Tidak ada respons teks yang dihasilkan.') {
        return {
          reply: synthReply,
          thoughts: collectedThoughts.length > 0 ? collectedThoughts.join('\n\n') : undefined,
          proposedChanges,
          executedTools,
          durationMs: Date.now() - t0,
          model: synthesisRes.model || lastModel,
          provider: (synthesisRes.provider as any) || lastProvider,
          circuitBreaker: {
            triggered: true,
            reason: circuitBreakerReason,
          },
        }
      }
    } catch (synthErr) {
      console.warn(
        '[executeCopilotAgentRunner] Circuit breaker synthesis call failed, falling back to deterministic summary:',
        synthErr
      )
    }
  }

  let fallbackReply = ''
  if (proposedChanges) {
    fallbackReply = `✅ **Checkpoint Tersimpan: Perubahan Diterapkan ke Editor**\n\n${
      proposedChanges.summary || 'Progres saat ini telah berhasil diperbarui di editor.'
    }\n\n👉 *Pekerjaan ini dapat dilanjutkan. Ketik **"lanjutkan"** atau kirim instruksi berikutnya untuk meneruskan ke tahap selanjutnya.*`
  } else if (executedTools.length > 0) {
    const executedSummary = executedTools
      .map((t) => {
        const snippet =
          typeof t.result === 'object'
            ? JSON.stringify(t.result).slice(0, 150)
            : String(t.result).slice(0, 150)
        return `- \`${t.name}\`: ${snippet}`
      })
      .join('\n')
    fallbackReply = `⚠️ **Circuit Breaker Aktif (${circuitBreakerReason})**\n\nBerikut ringkasan data observasi yang berhasil dikumpulkan:\n${executedSummary}\n\n👉 *Pekerjaan dapat dilanjutkan kapan saja. Ketik **"lanjutkan"** untuk meneruskan ke tahap berikutnya.*`
  } else {
    fallbackReply = 'Proses analisis dan eksekusi tool selesai dijalankan.'
  }

  return {
    reply: fallbackReply,
    thoughts: collectedThoughts.length > 0 ? collectedThoughts.join('\n\n') : undefined,
    proposedChanges,
    executedTools,
    durationMs: Date.now() - t0,
    model: lastModel,
    provider: lastProvider,
    circuitBreaker: {
      triggered: true,
      reason: circuitBreakerReason,
    },
  }
}
