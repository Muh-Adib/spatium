import { AnalysisIndicator, Locale } from './schema'

// ─── Indonesian & English Transition Word Dictionaries ───────────────────────
const ID_TRANSITION_WORDS = [
  'selain itu',
  'oleh karena itu',
  'dengan demikian',
  'namun',
  'akan tetapi',
  'meskipun demikian',
  'walaupun demikian',
  'di sisi lain',
  'sebagai contoh',
  'misalnya',
  'pada akhirnya',
  'pertama',
  'kedua',
  'ketiga',
  'selanjutnya',
  'kemudian',
  'akibatnya',
  'oleh sebab itu',
  'terlebih lagi',
  'bahkan',
  'sebaliknya',
  'khususnya',
  'terutama',
  'singkatnya',
  'kesimpulannya',
  'sebagai hasilnya',
  'maka dari itu',
  'kendati demikian',
]

const EN_TRANSITION_WORDS = [
  'furthermore',
  'moreover',
  'in addition',
  'however',
  'nevertheless',
  'consequently',
  'as a result',
  'for example',
  'for instance',
  'therefore',
  'on the other hand',
  'meanwhile',
  'firstly',
  'secondly',
  'subsequently',
  'in conclusion',
  'specifically',
  'in contrast',
  'ultimately',
  'besides',
  'in particular',
  'likewise',
]

export interface ReadabilityMetrics {
  score: number // 0 - 100
  fleschScore?: number
  indicators: AnalysisIndicator[]
  sentenceCount: number
  wordCount: number
  longSentencePercent: number
  transitionWordPercent: number
  passiveSentencePercent: number
}

/**
 * Analyzes article text readability in Indonesian (`id`) or English (`en`)
 */
export function analyzeReadability(
  content: string,
  locale: Locale = 'id'
): ReadabilityMetrics {
  const indicators: AnalysisIndicator[] = []

  // 1. Clean HTML tags
  const cleanText = content
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleanText.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  if (wordCount === 0) {
    return {
      score: 0,
      indicators: [
        {
          id: 'readability-empty',
          label: 'Keterbacaan Konten',
          status: 'problem',
          message: 'Konten masih kosong. Tulis artikel untuk melihat skor keterbacaan.',
        },
      ],
      sentenceCount: 0,
      wordCount: 0,
      longSentencePercent: 0,
      transitionWordPercent: 0,
      passiveSentencePercent: 0,
    }
  }

  // 2. Extract Sentences
  const rawSentences = cleanText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
  const sentenceCount = Math.max(1, rawSentences.length)

  // 3. Sentence Length Check (> 20 words is long)
  let longSentences = 0
  for (const s of rawSentences) {
    const sWords = s.split(/\s+/).filter(Boolean).length
    if (sWords > 20) longSentences++
  }
  const longSentencePercent = Math.round((longSentences / sentenceCount) * 100)

  if (longSentencePercent > 30) {
    indicators.push({
      id: 'readability-sentence-len',
      label: 'Panjang Kalimat (>20 kata)',
      status: 'problem',
      message: `${longSentencePercent}% kalimat memuat lebih dari 20 kata (maksimal target 25%). Bagi kalimat panjang menjadi beberapa kalimat ringkas.`,
      value: `${longSentencePercent}%`,
    })
  } else if (longSentencePercent > 25) {
    indicators.push({
      id: 'readability-sentence-len',
      label: 'Panjang Kalimat (>20 kata)',
      status: 'ok',
      message: `${longSentencePercent}% kalimat panjang. Sedikit di atas batas ideal 25%.`,
      value: `${longSentencePercent}%`,
    })
  } else {
    indicators.push({
      id: 'readability-sentence-len',
      label: 'Panjang Kalimat (>20 kata)',
      status: 'good',
      message: `Hanya ${longSentencePercent}% kalimat panjang. Struktur kalimat ringkas dan mudah dipahami pembaca.`,
      value: `${longSentencePercent}%`,
    })
  }

  // 4. Subheading Distribution (Max 300 words without a subheading)
  // Check headings in raw html content
  const headingMatches = content.match(/<h[2-4][^>]*>/gi) || []
  const headingCount = headingMatches.length
  const wordsPerSubheading = headingCount > 0 ? Math.round(wordCount / (headingCount + 1)) : wordCount

  if (wordCount > 350 && headingCount === 0) {
    indicators.push({
      id: 'readability-subheadings',
      label: 'Distribusi Subjudul (H2/H3)',
      status: 'problem',
      message: 'Tulisan memuat lebih dari 350 kata tanpa subjudul (H2/H3). Tambahkan subjudul untuk memecah teks.',
      value: `${headingCount} subjudul`,
    })
  } else if (wordsPerSubheading > 300) {
    indicators.push({
      id: 'readability-subheadings',
      label: 'Distribusi Subjudul (H2/H3)',
      status: 'ok',
      message: `Rata-rata terdapat ${wordsPerSubheading} kata per subjudul. Usahakan maksimal 300 kata per bagian.`,
      value: `${wordsPerSubheading} kata/bagian`,
    })
  } else {
    indicators.push({
      id: 'readability-subheadings',
      label: 'Distribusi Subjudul (H2/H3)',
      status: 'good',
      message: `Distribusi subjudul seimbang (${headingCount} subjudul terdeteksi).`,
      value: `${headingCount} subjudul`,
    })
  }

  // 5. Paragraph Length (Split by <p> or double newline)
  const paragraphs = content
    .split(/<\/p>|\n\s*\n/gi)
    .map((p) => p.replace(/<[^>]+>/g, '').trim())
    .filter((p) => p.length > 10)
  
  let longParagraphs = 0
  for (const p of paragraphs) {
    const pWords = p.split(/\s+/).filter(Boolean).length
    if (pWords > 150) longParagraphs++
  }

  if (longParagraphs > 0) {
    indicators.push({
      id: 'readability-paragraph-len',
      label: 'Panjang Paragraf',
      status: 'problem',
      message: `Terdapat ${longParagraphs} paragraf yang memuat lebih dari 150 kata. Usahakan paragraf lebih ringkas untuk kenyamanan membaca di mobile.`,
      value: `${longParagraphs} paragraf panjang`,
    })
  } else {
    indicators.push({
      id: 'readability-paragraph-len',
      label: 'Panjang Paragraf',
      status: 'good',
      message: 'Semua paragraf ringkas dan nyaman dibaca di layar perangkat mobile.',
    })
  }

  // 6. Transition Words Analysis
  const transitionList = locale === 'id' ? ID_TRANSITION_WORDS : EN_TRANSITION_WORDS
  let sentencesWithTransition = 0
  const lowerText = cleanText.toLowerCase()

  for (const s of rawSentences) {
    const sLower = s.toLowerCase()
    const hasTrans = transitionList.some((t) => sLower.includes(t))
    if (hasTrans) sentencesWithTransition++
  }

  const transitionWordPercent = Math.round((sentencesWithTransition / sentenceCount) * 100)
  if (transitionWordPercent < 20) {
    indicators.push({
      id: 'readability-transitions',
      label: 'Kata Transisi / Penghubung',
      status: 'problem',
      message: `Hanya ${transitionWordPercent}% kalimat menggunakan kata transisi (target minimal 25-30%). Tambahkan kata seperti "${transitionList.slice(0, 3).join('", "')}".`,
      value: `${transitionWordPercent}%`,
    })
  } else if (transitionWordPercent < 30) {
    indicators.push({
      id: 'readability-transitions',
      label: 'Kata Transisi / Penghubung',
      status: 'ok',
      message: `${transitionWordPercent}% kalimat memiliki kata transisi. Cukup baik, disarankan mencapai >30%.`,
      value: `${transitionWordPercent}%`,
    })
  } else {
    indicators.push({
      id: 'readability-transitions',
      label: 'Kata Transisi / Penghubung',
      status: 'good',
      message: `${transitionWordPercent}% kalimat memuat kata transisi alami. Alur baca tulisan mengalir dengan sangat baik.`,
      value: `${transitionWordPercent}%`,
    })
  }

  // 7. Passive Voice Detection
  let passiveSentences = 0
  for (const s of rawSentences) {
    if (locale === 'id') {
      // Indonesian passive pattern: prefix "di-" or "ter-" followed by root verb
      if (/\b(?:di|ter)(?:buat|kerjakan|lakukan|tulis|baca|gunakan|terapkan|sajikan|pasang|atur|pilih|bangun|rancang)\b/i.test(s)) {
        passiveSentences++
      }
    } else {
      // English passive pattern: was/were/is/are/been + -ed
      if (/\b(?:is|are|was|were|been|being)\s+\w+ed\b/i.test(s)) {
        passiveSentences++
      }
    }
  }
  const passiveSentencePercent = Math.round((passiveSentences / sentenceCount) * 100)
  if (passiveSentencePercent > 15) {
    indicators.push({
      id: 'readability-passive',
      label: 'Kalimat Pasif',
      status: 'ok',
      message: `${passiveSentencePercent}% kalimat menggunakan bentuk pasif (target maksimal 15%). Gunakan lebih banyak kalimat aktif untuk gaya penulisan yang lebih hidup.`,
      value: `${passiveSentencePercent}%`,
    })
  } else {
    indicators.push({
      id: 'readability-passive',
      label: 'Kalimat Pasif',
      status: 'good',
      message: `Penggunaan kalimat pasif sangat rendah (${passiveSentencePercent}%). Tulisan aktif dan tegas.`,
      value: `${passiveSentencePercent}%`,
    })
  }

  // 8. Consecutive Sentence Variety
  let consecutiveStarts = 0
  for (let i = 0; i < rawSentences.length - 2; i++) {
    const word1 = rawSentences[i].split(/\s+/)[0]?.toLowerCase()
    const word2 = rawSentences[i + 1].split(/\s+/)[0]?.toLowerCase()
    const word3 = rawSentences[i + 2].split(/\s+/)[0]?.toLowerCase()
    if (word1 && word1 === word2 && word2 === word3) {
      consecutiveStarts++
    }
  }
  if (consecutiveStarts > 0) {
    indicators.push({
      id: 'readability-variety',
      label: 'Variasi Awal Kalimat',
      status: 'problem',
      message: `Terdeteksi 3 kalimat berurutan yang diawali dengan kata yang persis sama. Variasikan pembuka kalimat.`,
    })
  } else {
    indicators.push({
      id: 'readability-variety',
      label: 'Variasi Awal Kalimat',
      status: 'good',
      message: 'Variasi awal kalimat beragam dan tidak monoton.',
    })
  }

  // Calculate composite score (0-100)
  let score = 100
  for (const ind of indicators) {
    if (ind.status === 'problem') score -= 15
    if (ind.status === 'ok') score -= 5
  }
  score = Math.max(10, Math.min(100, score))

  return {
    score,
    indicators,
    sentenceCount,
    wordCount,
    longSentencePercent,
    transitionWordPercent,
    passiveSentencePercent,
  }
}
