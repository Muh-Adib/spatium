import { Locale } from './schema'
import {
  validateAiTitle,
  validateAiMetaDescription,
  validateAltText,
  validateSlug,
  AiValidationResult,
} from './validation'
import { callLlm } from '@/lib/agent/llm'

export interface SeoAiContext {
  title: string
  content?: string
  excerpt?: string
  focusKeyphrase?: string
  relatedKeyphrases?: string[]
  searchIntent?: 'informational' | 'navigational' | 'transactional' | 'commercial'
  locale?: Locale
  contentType?: 'article' | 'service' | 'portfolio' | 'page'
  existingTitles?: string[]
  existingSlugs?: string[]
  existingKeyphrases?: string[]
  gscTopQueries?: string[]
  brandName?: string
  aiConfig?: {
    provider?: 'google' | 'openrouter'
    apiKey?: string
    model?: string
    proxyUrl?: string
  }
}

export interface AiSuggestionResult {
  value: string | string[] | any
  variants?: string[]
  source: 'ai' | 'template_fallback'
  modelUsed?: string
  validation: AiValidationResult
  attempts: number
  generatedAt: string
}

/**
 * Deterministic Template Fallback for SEO Fields (Zero paid subscription, always reliable)
 */
export function generateTemplateFallback(
  field: 'seoTitle' | 'metaDescription' | 'slug' | 'focusKeyphrase' | 'relatedKeyphrases' | 'altText',
  ctx: SeoAiContext,
  extraParams?: { fileName?: string; imageContext?: string }
): string | string[] {
  const brand = ctx.brandName || 'SegiaTech'
  const title = (ctx.title || '').trim()
  const kw = (ctx.focusKeyphrase || '').trim()
  const locale = ctx.locale || 'id'

  switch (field) {
    case 'focusKeyphrase': {
      if (ctx.gscTopQueries && ctx.gscTopQueries.length > 0) {
        return ctx.gscTopQueries[0]
      }
      // Extract main noun phrase from title
      const cleanTitle = title
        .toLowerCase()
        .replace(/^(panduan|cara|tips|rahasia|mengenal|definisi|strategi)\s+/i, '')
        .replace(/[\-–|:].*$/, '')
        .trim()
      return cleanTitle.slice(0, 40)
    }

    case 'relatedKeyphrases': {
      if (ctx.gscTopQueries && ctx.gscTopQueries.length > 1) {
        return ctx.gscTopQueries.slice(1, 4)
      }
      if (locale === 'id') {
        return [
          `jasa ${kw || title.toLowerCase()}`,
          `panduan ${kw || title.toLowerCase()}`,
          `solusi ${kw || title.toLowerCase()}`,
        ].slice(0, 3)
      }
      return [
        `best ${kw || title.toLowerCase()}`,
        `${kw || title.toLowerCase()} guide`,
        `${kw || title.toLowerCase()} services`,
      ].slice(0, 3)
    }

    case 'seoTitle': {
      const mainPart = kw ? (title.toLowerCase().includes(kw.toLowerCase()) ? title : `${kw}: ${title}`) : title
      const candidate = `${mainPart} | ${brand}`
      if (candidate.length <= 65) return candidate
      return candidate.slice(0, 62) + '...'
    }

    case 'metaDescription': {
      const summary = (ctx.excerpt || ctx.content || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const kwPrefix = kw ? (locale === 'id' ? `Pelajari ${kw}. ` : `Discover ${kw}. `) : ''
      const action = locale === 'id' ? ' Simak ulasan lengkap dan panduan praktisnya di sini.' : ' Read our complete guide and insights here.'
      const raw = `${kwPrefix}${summary.slice(0, 100)}${action}`
      if (raw.length >= 120 && raw.length <= 160) return raw
      return raw.slice(0, 155) + '...'
    }

    case 'slug': {
      const source = kw || title
      return source
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 70)
    }

    case 'altText': {
      const imgCtx = extraParams?.imageContext || title
      const fileStem = (extraParams?.fileName || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim()

      if (locale === 'id') {
        const alt = `Ilustrasi ${imgCtx}${kw ? ` terkait ${kw}` : ''}`
        return alt.slice(0, 115)
      }
      const alt = `Visual illustration for ${imgCtx}${kw ? ` showcasing ${kw}` : ''}`
      return alt.slice(0, 115)
    }

    default:
      return title
  }
}

/**
 * Calls AI LLM with prompt and retry logic. Falls back gracefully to Template Fallback.
 */
export async function suggestSeoWithAi(
  field: 'seoTitle' | 'metaDescription' | 'slug' | 'focusKeyphrase' | 'relatedKeyphrases' | 'altText',
  ctx: SeoAiContext,
  extraParams?: { fileName?: string; imageContext?: string }
): Promise<AiSuggestionResult> {
  const provider = ctx.aiConfig?.provider || null
  const apiKey = ctx.aiConfig?.apiKey?.trim() || null
  const locale = ctx.locale || 'id'

  // If no AI key configured, use deterministic template fallback immediately
  if (!apiKey || !provider) {
    const val = generateTemplateFallback(field, ctx, extraParams)
    let validation: AiValidationResult = { valid: true, errors: [], warnings: [] }
    if (field === 'seoTitle' && typeof val === 'string') {
      validation = validateAiTitle(val, ctx.focusKeyphrase || '', locale, ctx.existingTitles)
    } else if (field === 'metaDescription' && typeof val === 'string') {
      validation = validateAiMetaDescription(val, ctx.focusKeyphrase || '', locale)
    } else if (field === 'slug' && typeof val === 'string') {
      validation = validateSlug(val, ctx.existingSlugs)
    } else if (field === 'altText' && typeof val === 'string') {
      validation = validateAltText(val, false)
    }

    return {
      value: val,
      variants: typeof val === 'string' ? [val] : (val as string[]),
      source: 'template_fallback',
      validation,
      attempts: 0,
      generatedAt: new Date().toISOString(),
    }
  }

  // Define prompts per field
  const systemPrompt = `You are an elite Technical SEO and Editorial Director for ${ctx.brandName || 'SegiaTech'}.
Target Language: ${locale === 'id' ? 'Bahasa Indonesia (formal, professional, compelling)' : 'English (authoritative, clear, crisp)'}.
Strict Rules:
- Return ONLY valid JSON formatted as { "value": string | string[], "variants": string[] }.
- Never output markdown code fences or conversational text.
- Do NOT hallucinate false claims, statistics, or non-existent pricing.`

  let userPrompt = ''
  switch (field) {
    case 'seoTitle':
      userPrompt = `Generate a high-CTR SEO title for an article with title: "${ctx.title}".
Focus Keyphrase: "${ctx.focusKeyphrase || ''}".
Rules:
1. Must include the focus keyphrase naturally (preferably front-loaded near the beginning).
2. Length must strictly be between 40 and 60 characters.
3. Language must be ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}.
4. Provide 3 distinct variants.`
      break

    case 'metaDescription':
      userPrompt = `Generate an enticing SERP Meta Description for:
Title: "${ctx.title}"
Focus Keyphrase: "${ctx.focusKeyphrase || ''}"
Excerpt/Summary: "${(ctx.excerpt || ctx.content || '').slice(0, 300)}"
Rules:
1. Length must strictly be between 120 and 155 characters.
2. Must naturally incorporate the focus keyphrase.
3. Must include a clear call-to-action / reason to click.
4. Language must be ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}.
5. Provide 3 distinct variants.`
      break

    case 'slug':
      userPrompt = `Generate an SEO-optimized URL slug for:
Title: "${ctx.title}"
Focus Keyphrase: "${ctx.focusKeyphrase || ''}"
Rules:
1. Lowercase alphanumeric and single hyphens only.
2. Keep it concise (< 60 chars), removing unnecessary filler stop words.
3. Must contain the keyphrase.`
      break

    case 'focusKeyphrase':
      userPrompt = `Analyze the following content and identify the single best high-intent Focus Keyphrase:
Title: "${ctx.title}"
Summary: "${(ctx.excerpt || ctx.content || '').slice(0, 400)}"
Known GSC queries: ${JSON.stringify(ctx.gscTopQueries || [])}
Rules:
1. Provide a focused 2-4 word keyphrase with strong search intent.
2. Language must be ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}.`
      break

    case 'relatedKeyphrases':
      userPrompt = `Generate 3 to 5 related secondary keyphrases for:
Title: "${ctx.title}"
Focus Keyphrase: "${ctx.focusKeyphrase || ''}"
Language: ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}.`
      break

    case 'altText':
      userPrompt = `Generate a concise, accessible Alt Text for an image:
Image Context / Filename: "${extraParams?.fileName || 'image'}"
Article Title: "${ctx.title}"
Focus Keyphrase: "${ctx.focusKeyphrase || ''}"
Rules:
1. Maximum 125 characters.
2. Describe the actual visual subject concisely.
3. DO NOT start with "gambar", "foto", "image of", or "picture of".
4. Language must be ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}.`
      break
  }

  // Execution with retry loop (up to 2 retry attempts)
  let attempts = 0
  let lastValidation: AiValidationResult = { valid: false, errors: [], warnings: [] }

  while (attempts < 2) {
    attempts++
    try {
      const selectedModel = ctx.aiConfig?.model || (provider === 'google' ? 'gemini-2.0-flash' : 'google/gemini-2.0-flash-001')
      const llmResult = await callLlm({
        provider: provider as 'google' | 'openrouter',
        apiKey,
        model: selectedModel,
        proxyUrl: ctx.aiConfig?.proxyUrl,
        systemInstruction: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
        maxTokens: 600,
      })
      const rawText = llmResult.reply

      // Parse JSON
      const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      const candidateValue = parsed.value || parsed.variants?.[0]
      const variants = parsed.variants || (typeof candidateValue === 'string' ? [candidateValue] : candidateValue)

      // Validate according to Section 3.5 rules
      if (field === 'seoTitle' && typeof candidateValue === 'string') {
        lastValidation = validateAiTitle(candidateValue, ctx.focusKeyphrase || '', locale, ctx.existingTitles)
      } else if (field === 'metaDescription' && typeof candidateValue === 'string') {
        lastValidation = validateAiMetaDescription(candidateValue, ctx.focusKeyphrase || '', locale)
      } else if (field === 'slug' && typeof candidateValue === 'string') {
        lastValidation = validateSlug(candidateValue, ctx.existingSlugs)
      } else if (field === 'altText' && typeof candidateValue === 'string') {
        lastValidation = validateAltText(candidateValue, false)
      } else {
        lastValidation = { valid: true, errors: [], warnings: [] }
      }

      if (lastValidation.valid) {
        return {
          value: candidateValue,
          variants,
          source: 'ai',
          modelUsed: provider === 'google' ? 'gemini-2.0-flash' : 'openrouter',
          validation: lastValidation,
          attempts,
          generatedAt: new Date().toISOString(),
        }
      }

      // Feedback for retry
      userPrompt += `\nPrevious output failed validation: ${lastValidation.errors.join('; ')}. Fix these issues strictly.`
    } catch (err) {
      console.warn(`[AI SEO] Attempt ${attempts} failed:`, err)
    }
  }

  // If retries failed or validation still invalid, fallback to deterministic template generator
  const fallbackVal = generateTemplateFallback(field, ctx, extraParams)
  return {
    value: fallbackVal,
    variants: typeof fallbackVal === 'string' ? [fallbackVal] : (fallbackVal as string[]),
    source: 'template_fallback',
    validation: {
      valid: true,
      errors: [],
      warnings: ['Digenerasi menggunakan Template Fallback karena panggilan AI gagal atau tidak memenuhi aturan.'],
    },
    attempts,
    generatedAt: new Date().toISOString(),
  }
}
