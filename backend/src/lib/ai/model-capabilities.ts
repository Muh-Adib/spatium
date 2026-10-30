export type ModelCapability = 'text' | 'vision' | 'thinking' | 'code' | 'image-gen'

export interface AiModelItem {
  id: string
  name: string
  provider: 'google' | 'openrouter'
  contextLength?: number
  isFree?: boolean
  hasThinking?: boolean
  hasVision?: boolean
  capabilities?: ModelCapability[]
  description?: string
  pricing?: { prompt?: string; completion?: string }
  assignedKeyId?: string // Opsional: key spesifik yang digunakan untuk model ini
  testedStatus?: 'valid' | 'invalid' | 'untested'
  testedLatencyMs?: number
  testedReply?: string
}

/**
 * Normalisasi nama model Google Gemini agar sesuai dengan model resmi Google AI Studio.
 * - Mempertahankan model modern resmi (seperti gemini-3.8-flash, gemini-3.x) tanpa mendowngrade.
 * - Membersihkan awalan provider ("google/") dan namespace path ("models/").
 * - Membersihkan suffix OpenRouter tag (seperti ":free", ":online", ":nitro").
 * - Mengembalikan default "gemini-2.5-flash" jika input kosong atau tidak valid.
 */
export function normalizeGoogleModel(rawModel?: string): string {
  if (!rawModel || typeof rawModel !== 'string' || !rawModel.trim()) {
    return 'gemini-2.5-flash'
  }

  let clean = rawModel.trim()

  let prev = ''
  while (clean !== prev) {
    prev = clean
    clean = clean.replace(/^\/+|\/+$/g, '').trim()
    clean = clean.replace(/:(free|online|nitro)$/i, '')
    clean = clean.replace(/^(google\/|models\/)+/i, '')
    clean = clean.replace(/^(google|models)$/i, '')
    clean = clean.replace(/^\/+|\/+$/g, '').trim()
  }

  if (!clean) {
    return 'gemini-2.5-flash'
  }

  return clean
}

/**
 * Deteksi otomatis kemampuan model berdasarkan ID dan metadata
 */
export function detectModelCapabilities(modelId: string, rawData?: any): ModelCapability[] {
  const caps: ModelCapability[] = ['text']
  const lowerId = (modelId || '').toLowerCase()
  const lowerDesc = (rawData?.description || '').toLowerCase()

  // 1. Vision / Multimodal
  const isVision =
    lowerId.includes('gemini') ||
    lowerId.includes('vision') ||
    lowerId.includes('vl') ||
    lowerId.includes('4o') ||
    lowerId.includes('multimodal') ||
    lowerId.includes('claude-3') ||
    lowerId.includes('pixtral') ||
    lowerDesc.includes('image') ||
    lowerDesc.includes('vision') ||
    rawData?.architecture?.modality?.includes('image')

  if (isVision) caps.push('vision')

  // 2. Reasoning / Thinking
  const isThinking =
    Boolean(rawData?.hasThinking) ||
    lowerId.includes('gemini-3') ||
    lowerId.includes('gemini-2.5') ||
    lowerId.includes('thinking') ||
    lowerId.includes('nemotron') ||
    lowerId.includes('deepseek-r1') ||
    lowerId.includes('reason') ||
    lowerId.includes('o1') ||
    lowerId.includes('o3') ||
    lowerDesc.includes('thinking') ||
    lowerDesc.includes('reasoning')

  if (isThinking) caps.push('thinking')

  // 3. Code Generation
  const isCode =
    lowerId.includes('code') ||
    lowerId.includes('coder') ||
    lowerId.includes('deepseek-coder') ||
    lowerId.includes('qwen-coder') ||
    lowerDesc.includes('coding') ||
    lowerDesc.includes('code generation')

  if (isCode) caps.push('code')

  // 4. Image Generation
  const isImageGen =
    lowerId.includes('imagen') ||
    lowerId.includes('dall-e') ||
    lowerId.includes('flux') ||
    lowerId.includes('sdxl') ||
    lowerId.includes('midjourney')

  if (isImageGen) caps.push('image-gen')

  return caps
}

/**
 * Model-model rekomendasi awal yang komprehensif
 */
export const DEFAULT_SELECTED_MODELS: AiModelItem[] = [
  // Google Gemini Models
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    contextLength: 1048576,
    isFree: false,
    hasThinking: true,
    hasVision: true,
    capabilities: ['text', 'vision', 'thinking'],
    description: 'Generasi modern model Gemini dengan penalaran thinking adaptif, multimodal vision, dan latensi inferensi ultra rendah.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    contextLength: 1048576,
    isFree: false,
    hasThinking: true,
    hasVision: true,
    capabilities: ['text', 'vision', 'thinking'],
    description: 'Model utama Google tercepat dengan kapabilitas multimodal (vision) dan penalaran thinking mendalam.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    contextLength: 2097152,
    isFree: false,
    hasThinking: true,
    hasVision: true,
    capabilities: ['text', 'vision', 'thinking'],
    description: 'Flagship Google untuk penalaran kompleks, analisis kode, dan konteks raksasa 2 juta token.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    contextLength: 1048576,
    isFree: false,
    hasThinking: false,
    hasVision: true,
    capabilities: ['text', 'vision'],
    description: 'Inferensi berlatensi sangat rendah untuk respon chat seketika dan ekstraksi media visual.',
  },
  // OpenRouter Free & High-Context Models
  {
    id: 'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
    name: 'nvidia/nemotron-3-super-120b-a12b:free',
    provider: 'openrouter',
    contextLength: 1048576,
    isFree: true,
    hasThinking: true,
    hasVision: false,
    capabilities: ['text', 'thinking'],
    description: 'Nvidia Nemotron-3 Super model dengan konteks 1M dan kapabilitas reasoning mendalam.',
  },
  {
    id: 'openrouter/cohere/north-mini-code:free',
    name: 'cohere/north-mini-code:free',
    provider: 'openrouter',
    contextLength: 262144,
    isFree: true,
    hasThinking: false,
    hasVision: false,
    capabilities: ['text', 'code'],
    description: 'Model khusus pembuat kode & refactoring cepat dari Cohere dengan konteks 256k.',
  },
  {
    id: 'openrouter/nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    contextLength: 1048576,
    isFree: true,
    hasThinking: true,
    hasVision: false,
    capabilities: ['text', 'thinking'],
    description: 'Model ultra 550B parameter kelas enterprise untuk penalaran kode dan analisis sistem.',
  },
  {
    id: 'openrouter/nvidia/nemotron-3.5-lightning:free',
    name: 'nvidia/nemotron-3.5-lightning:free',
    provider: 'openrouter',
    contextLength: 524288,
    isFree: true,
    hasThinking: false,
    hasVision: false,
    capabilities: ['text'],
    description: 'Model inferensi kilat dengan konteks 512k, ideal untuk chat studio berlatensi rendah.',
  },
  {
    id: 'openrouter/poolside/laguna-xs-2.1:free',
    name: 'poolside/laguna-xs-2.1:free',
    provider: 'openrouter',
    contextLength: 200000,
    isFree: true,
    hasThinking: false,
    hasVision: false,
    capabilities: ['text', 'code'],
    description: 'Model agentic code generation teroptimasi dari Poolside dengan konteks 200k.',
  },
]
