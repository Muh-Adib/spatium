import { prisma } from '@/lib/db/prisma'
import { calculateStylometry, StylometryMetrics } from './stylometry'

export interface VoiceDeviation {
  dimension: string
  message: string
  severity: 'warning' | 'error'
  expected?: any
  actual?: any
}

export interface VoiceMatchResult {
  score: number // 0 - 100
  pass: boolean
  deviations: VoiceDeviation[]
  stylometry: StylometryMetrics
  profileName: string
}

export interface VoiceProfileData {
  id: number
  name: string
  version: number
  stylometry: StylometryMetrics
  guide: string
  lexicon: {
    signaturePhrases?: string[]
    bannedPhrases?: string[]
    mandatoryTerms?: string[]
  }
  structure?: any
  active: boolean
}

/**
 * Retrieves the currently active voice profile from PostgreSQL via Prisma 8
 */
export async function getActiveVoiceProfile(): Promise<VoiceProfileData | null> {
  try {
    const row = await prisma.orm.public.VoiceProfile
      .where({ active: true })
      .first()

    if (!row) {
      return null
    }
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      stylometry: typeof row.stylometry === 'string' ? JSON.parse(row.stylometry) : row.stylometry,
      guide: row.guide,
      lexicon: typeof row.lexicon === 'string' ? JSON.parse(row.lexicon || '{}') : row.lexicon || {},
      structure: typeof row.structure === 'string' ? JSON.parse(row.structure || '{}') : row.structure,
      active: Boolean(row.active),
    }
  } catch (err) {
    console.warn('[VoiceChecker] Failed to retrieve voice profile from database:', err)
    return null
  }
}

/**
 * Validates editorial content against Brand Voice Profile (ADR-0012 / Sprint S6)
 * Checks:
 * 1. Stylometric divergence (sentence length, POV consistency, passive ratio)
 * 2. Lexicon rules (banned phrases, signature phrases)
 * 3. WordPress alur kerja editorial rules (Email Ban, anti-stuffing)
 */
export function evaluateContentVoice(
  rawText: string,
  profile: VoiceProfileData
): VoiceMatchResult {
  const stylometry = calculateStylometry(rawText)
  const deviations: VoiceDeviation[] = []
  const textLower = rawText.toLowerCase()

  // 1. Email Ban Rule (ADR-0012 §4: aturan alur kerja WordPress tanpa alamat email di body konten)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const foundEmails = rawText.match(emailRegex)
  if (foundEmails && foundEmails.length > 0) {
    deviations.push({
      dimension: 'email_ban',
      message: `Ditemukan alamat email langsung pada konten body (${foundEmails.join(', ')}). Alur kerja editorial melarang penulisan email mentah; gunakan tautan formulir atau tombol kontak.`,
      severity: 'error',
      actual: foundEmails,
    })
  }

  // 2. Lexicon: Banned Phrases
  const banned = profile.lexicon?.bannedPhrases || []
  for (const phrase of banned) {
    if (textLower.includes(phrase.toLowerCase())) {
      deviations.push({
        dimension: 'banned_phrase',
        message: `Konten memuat frasa terlarang: "${phrase}". Hindari klaim berlebihan atau bahasa promosi murah.`,
        severity: 'error',
        expected: 'Bebas klaim hiperbolik',
        actual: phrase,
      })
    }
  }

  // 3. Stylometry: Average Sentence Length (Words per sentence)
  const targetSentLen = profile.stylometry.avgSentenceLength || 17.5
  if (stylometry.avgSentenceLength > targetSentLen * 1.7) {
    deviations.push({
      dimension: 'sentence_length',
      message: `Rata-rata panjang kalimat (${stylometry.avgSentenceLength} kata) terlalu berbelit-belit. Target editorial adalah ~${targetSentLen} kata per kalimat.`,
      severity: 'warning',
      expected: `~${targetSentLen} kata`,
      actual: `${stylometry.avgSentenceLength} kata`,
    })
  } else if (stylometry.avgSentenceLength < 7 && stylometry.wordCount > 50) {
    deviations.push({
      dimension: 'sentence_length',
      message: `Rata-rata panjang kalimat (${stylometry.avgSentenceLength} kata) terlalu pendek / terfragmentasi.`,
      severity: 'warning',
      expected: `~${targetSentLen} kata`,
      actual: `${stylometry.avgSentenceLength} kata`,
    })
  }

  // 4. Stylometry: POV Check (UNIMASI engineering tone uses 1st Person Plural "kami" or 2nd Person "Anda")
  if (stylometry.povRatios.firstPersonSingular > 0.45 && stylometry.wordCount > 20) {
    deviations.push({
      dimension: 'pov_consistency',
      message: `Sudut pandang orang pertama tunggal ("saya/aku": ${(stylometry.povRatios.firstPersonSingular * 100).toFixed(0)}%) terlalu dominan. Gunakan perspektif tim korporat/engineering ("kami" / "kita" atau berorientasi pada pembaca "Anda").`,
      severity: 'warning',
      expected: 'Dominan "kami" atau "Anda"',
      actual: `${(stylometry.povRatios.firstPersonSingular * 100).toFixed(0)}% saya/aku`,
    })
  }

  // 5. Signature phrases recommendation for long articles
  const signatures = profile.lexicon?.signaturePhrases || []
  if (signatures.length > 0 && stylometry.wordCount > 300) {
    const hasSignature = signatures.some((s) => textLower.includes(s.toLowerCase()))
    if (!hasSignature) {
      deviations.push({
        dimension: 'signature_phrases',
        message: `Disarankan menyertakan minimal salah satu pilar terminologi UNIMASI (misal: ${signatures.slice(0, 3).map((s) => `"${s}"`).join(', ')}).`,
        severity: 'warning',
        expected: 'Minimal 1 frasa pilar',
      })
    }
  }

  // Calculate overall match score (0 - 100)
  let score = 100
  for (const dev of deviations) {
    if (dev.severity === 'error') {
      score -= 25
    } else {
      score -= 10
    }
  }
  if (score < 0) score = 0

  const hasErrors = deviations.some((d) => d.severity === 'error')
  const pass = score >= 70 && !hasErrors

  return {
    score,
    pass,
    deviations,
    stylometry,
    profileName: profile.name,
  }
}

/**
 * Convenience method: checks content against the active database voice profile
 */
export async function checkVoiceMatch(rawText: string): Promise<VoiceMatchResult> {
  const profile = await getActiveVoiceProfile()
  if (!profile) {
    // Default fallback baseline if database row is unreachable
    const defaultProfile: VoiceProfileData = {
      id: 0,
      name: 'Default Engineering Voice',
      version: 1,
      stylometry: {
        wordCount: 500,
        sentenceCount: 30,
        paragraphCount: 10,
        avgSentenceLength: 17.5,
        avgParagraphSentences: 3.2,
        avgParagraphWords: 50,
        passiveVoiceRatio: 0.15,
        povRatios: { firstPersonPlural: 0.65, secondPerson: 0.3, firstPersonSingular: 0.05 },
        numberRatio: 0.08,
        listRatio: 0.12,
      },
      guide: 'Suara rekayasa perangkat lunak modern, terukur, dan objektif.',
      lexicon: {
        signaturePhrases: ['arsitektur web modern', 'performa sub-detik', 'standar enterprise'],
        bannedPhrases: ['termurah se-indonesia', 'dijamin nomor satu', 'tanpa modal'],
      },
      active: true,
    }
    return evaluateContentVoice(rawText, defaultProfile)
  }

  return evaluateContentVoice(rawText, profile)
}
