export interface StylometryMetrics {
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  avgSentenceLength: number // words per sentence
  avgParagraphSentences: number // sentences per paragraph
  avgParagraphWords: number // words per paragraph
  passiveVoiceRatio: number // proportion of sentences with passive markers
  povRatios: {
    firstPersonPlural: number // kami, kita, our, we
    secondPerson: number // anda, kamu, kalian, you, your
    firstPersonSingular: number // saya, aku, i, my
  }
  numberRatio: number // proportion of sentences with numeric values
  listRatio: number // proportion of bullet/list items relative to paragraphs
}

/**
 * Strips HTML and markdown formatting to analyze clean prose
 */
export function extractCleanText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/```[\s\S]*?```/g, ' ') // Strip code blocks
    .replace(/`[^`]*`/g, ' ') // Strip inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, strip URL
    .replace(/[#*_~>\-]/g, ' ') // Strip markdown formatting symbols
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

/**
 * Splits text into sentences using standard punctuation boundaries
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return []
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

/**
 * Calculates deterministic stylometry metrics for Indonesian & English editorial prose (ADR-0012 / Sprint S6)
 */
export function calculateStylometry(rawText: string): StylometryMetrics {
  const clean = extractCleanText(rawText)
  if (!clean) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgSentenceLength: 0,
      avgParagraphSentences: 0,
      avgParagraphWords: 0,
      passiveVoiceRatio: 0,
      povRatios: { firstPersonPlural: 0, secondPerson: 0, firstPersonSingular: 0 },
      numberRatio: 0,
      listRatio: 0,
    }
  }

  // Count raw paragraphs and list items before flattening
  const rawParagraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const listItems = (rawText.match(/^[\s]*[-*+]\s+.+$/gm) || []).length
  const paragraphCount = Math.max(1, rawParagraphs.length)

  // Tokenize sentences and words
  const sentences = splitSentences(clean)
  const sentenceCount = Math.max(1, sentences.length)

  const words = clean
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  const wordCount = words.length

  const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(2))
  const avgParagraphSentences = Number((sentenceCount / paragraphCount).toFixed(2))
  const avgParagraphWords = Number((wordCount / paragraphCount).toFixed(2))

  // Passive voice detection in Indonesian ("di-", "ter-") and English ("was/were/is/are + verb-ed/en")
  let passiveSentences = 0
  const idPassivePattern = /\b(di|ter)[a-z]{3,}\b/i
  const enPassivePattern = /\b(is|are|was|were|been|being)\s+[a-z]+(ed|en)\b/i

  for (const s of sentences) {
    if (idPassivePattern.test(s) || enPassivePattern.test(s)) {
      passiveSentences++
    }
  }
  const passiveVoiceRatio = Number((passiveSentences / sentenceCount).toFixed(3))

  // Point of View (POV) Pronoun counting
  let count1PPlural = 0 // kami, kita, we, our
  let count2P = 0 // anda, kamu, kalian, you, your
  let count1PSingular = 0 // saya, aku, i, my, me

  for (const w of words) {
    if (/^(kami|kita|we|our|ours)$/.test(w)) count1PPlural++
    else if (/^(anda|kamu|kalian|you|your|yours)$/.test(w)) count2P++
    else if (/^(saya|aku|i|my|me|mine)$/.test(w)) count1PSingular++
  }

  const totalPronouns = count1PPlural + count2P + count1PSingular || 1
  const povRatios = {
    firstPersonPlural: Number((count1PPlural / totalPronouns).toFixed(2)),
    secondPerson: Number((count2P / totalPronouns).toFixed(2)),
    firstPersonSingular: Number((count1PSingular / totalPronouns).toFixed(2)),
  }

  // Numeric density: sentences containing numbers
  const numberSentences = sentences.filter((s) => /\d+/.test(s)).length
  const numberRatio = Number((numberSentences / sentenceCount).toFixed(3))

  // List ratio: list items relative to paragraphs
  const listRatio = Number((listItems / paragraphCount).toFixed(2))

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgSentenceLength,
    avgParagraphSentences,
    avgParagraphWords,
    passiveVoiceRatio,
    povRatios,
    numberRatio,
    listRatio,
  }
}

/**
 * Builds an aggregated stylometry baseline across a corpus of articles (Layer 1 deterministic)
 */
export function buildProfileFromArticles(articlesContent: string[]): StylometryMetrics {
  if (!articlesContent || articlesContent.length === 0) {
    return calculateStylometry('')
  }

  const metricsList = articlesContent.map((c) => calculateStylometry(c))
  const count = metricsList.length

  const sum = metricsList.reduce(
    (acc, m) => {
      acc.wordCount += m.wordCount
      acc.sentenceCount += m.sentenceCount
      acc.paragraphCount += m.paragraphCount
      acc.avgSentenceLength += m.avgSentenceLength
      acc.avgParagraphSentences += m.avgParagraphSentences
      acc.avgParagraphWords += m.avgParagraphWords
      acc.passiveVoiceRatio += m.passiveVoiceRatio
      acc.firstPersonPlural += m.povRatios.firstPersonPlural
      acc.secondPerson += m.povRatios.secondPerson
      acc.firstPersonSingular += m.povRatios.firstPersonSingular
      acc.numberRatio += m.numberRatio
      acc.listRatio += m.listRatio
      return acc
    },
    {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgSentenceLength: 0,
      avgParagraphSentences: 0,
      avgParagraphWords: 0,
      passiveVoiceRatio: 0,
      firstPersonPlural: 0,
      secondPerson: 0,
      firstPersonSingular: 0,
      numberRatio: 0,
      listRatio: 0,
    }
  )

  return {
    wordCount: Math.round(sum.wordCount / count),
    sentenceCount: Math.round(sum.sentenceCount / count),
    paragraphCount: Math.round(sum.paragraphCount / count),
    avgSentenceLength: Number((sum.avgSentenceLength / count).toFixed(2)),
    avgParagraphSentences: Number((sum.avgParagraphSentences / count).toFixed(2)),
    avgParagraphWords: Number((sum.avgParagraphWords / count).toFixed(2)),
    passiveVoiceRatio: Number((sum.passiveVoiceRatio / count).toFixed(3)),
    povRatios: {
      firstPersonPlural: Number((sum.firstPersonPlural / count).toFixed(2)),
      secondPerson: Number((sum.secondPerson / count).toFixed(2)),
      firstPersonSingular: Number((sum.firstPersonSingular / count).toFixed(2)),
    },
    numberRatio: Number((sum.numberRatio / count).toFixed(3)),
    listRatio: Number((sum.listRatio / count).toFixed(2)),
  }
}
