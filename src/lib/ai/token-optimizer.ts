export interface TokenOptimizationConfig {
  // RTK - Tool Output Compression (rtk-ai/rtk)
  // Mengurangi 60-90% token masukan dari git, grep, ls, database JSON, dan logs
  rtkEnabled: boolean
  rtkMode: 'aggressive' | 'balanced' | 'minimal'
  rtkMaxOutputChars: number
  rtkSmartCrusher: boolean

  // Headroom - Context Compression (chopratejas/headroom)
  // Kompresi konteks obrolan sebelum dirutekan ke LLM
  headroomEnabled: boolean
  headroomMode: 'smart-crush' | 'ast' | 'ml' | 'off'
  headroomExtras: {
    code: boolean // AST compression (syntax/comment/docstring stripping)
    ml: boolean // Kompress-v2 HF model simulation for prose/traces
  }
  headroomContextLimit: number // e.g. 200000

  // Caveman - Concise Output Compression (JuliusBrussee/caveman)
  // Prompt sistem gaya ringkas → ~65% lebih sedikit token keluaran (hingga 87%)
  cavemanMode: 'caveman' | 'terse' | 'off'

  // Ponytail - Lazy Senior Dev (DietrichGebert/ponytail)
  // Membimbing model ke kode minimal: YAGNI, gunakan ulang stdlib/native first, hapus daripada menambah
  ponytailEnabled: boolean

  // Custom System Prompt
  // Appends user's own instruction to every request independently of savers above
  customSystemPrompt: string
}

export const DEFAULT_TOKEN_OPTIMIZATION_CONFIG: TokenOptimizationConfig = {
  rtkEnabled: true,
  rtkMode: 'balanced',
  rtkMaxOutputChars: 2500,
  rtkSmartCrusher: true,

  headroomEnabled: true,
  headroomMode: 'smart-crush',
  headroomExtras: {
    code: true,
    ml: false,
  },
  headroomContextLimit: 200000,

  cavemanMode: 'terse',
  ponytailEnabled: true,
  customSystemPrompt: '',
}

const STORAGE_TOKEN_OPT_KEY = 'segiatech_ai_token_opt'

export function getTokenOptimizationConfig(): TokenOptimizationConfig {
  if (typeof window === 'undefined') return DEFAULT_TOKEN_OPTIMIZATION_CONFIG

  try {
    const raw = localStorage.getItem(STORAGE_TOKEN_OPT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_TOKEN_OPTIMIZATION_CONFIG,
        ...parsed,
        headroomExtras: {
          ...DEFAULT_TOKEN_OPTIMIZATION_CONFIG.headroomExtras,
          ...(parsed.headroomExtras || {}),
        },
      }
    }
  } catch (_) {}

  return DEFAULT_TOKEN_OPTIMIZATION_CONFIG
}

export function saveTokenOptimizationConfig(config: Partial<TokenOptimizationConfig>): TokenOptimizationConfig {
  const current = getTokenOptimizationConfig()
  const updated: TokenOptimizationConfig = {
    ...current,
    ...config,
    headroomExtras: {
      ...current.headroomExtras,
      ...(config.headroomExtras || {}),
    },
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_TOKEN_OPT_KEY, JSON.stringify(updated))
    } catch (_) {}
  }

  return updated
}

/**
 * RTK Tool Output Compressor (Inspired by rtk-ai/rtk)
 * Memangkas output tool (JSON DB, logs, array panjang) sehingga menghemat 60-90% token input.
 */
export function compressToolOutput(
  rawOutput: any,
  config?: Partial<TokenOptimizationConfig>
): string {
  const opt = { ...DEFAULT_TOKEN_OPTIMIZATION_CONFIG, ...config }

  if (!opt.rtkEnabled) {
    return typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput, null, 2)
  }

  let text = ''

  if (typeof rawOutput === 'object' && rawOutput !== null) {
    if (opt.rtkSmartCrusher) {
      // Smart crushing: truncate long arrays to first 3 items with count notice
      const crushed = crushJsonObject(rawOutput, opt.rtkMode)
      text = JSON.stringify(crushed, null, opt.rtkMode === 'aggressive' ? 0 : 2)
    } else {
      text = JSON.stringify(rawOutput, null, 2)
    }
  } else {
    text = String(rawOutput || '')
  }

  // Strip ANSI color escape codes
  text = text.replace(/\u001b\[[0-9;]*m/g, '')

  // Remove consecutive empty lines (more than 2 lines)
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n')

  // Truncate to maximum characters limit
  const limit = opt.rtkMaxOutputChars || 2500
  if (text.length > limit) {
    const originalLen = text.length
    text = text.slice(0, limit) + `\n\n[...RTK Compressor: dipangkas dari ${originalLen} karakter ke ${limit} karakter untuk menghemat token masukan]`
  }

  return text
}

function crushJsonObject(obj: any, mode: 'aggressive' | 'balanced' | 'minimal'): any {
  if (Array.isArray(obj)) {
    const maxItems = mode === 'aggressive' ? 2 : mode === 'balanced' ? 3 : 5
    if (obj.length > maxItems) {
      const sliced = obj.slice(0, maxItems).map((item) => crushJsonObject(item, mode))
      sliced.push(`[... +${obj.length - maxItems} item lainnya diringkas oleh RTK SmartCrusher]`)
      return sliced
    }
    return obj.map((item) => crushJsonObject(item, mode))
  }

  if (typeof obj === 'object' && obj !== null) {
    const res: Record<string, any> = {}
    for (const [k, v] of Object.entries(obj)) {
      // Skip empty objects or long repetitive metadata
      if (v === null || v === undefined) continue
      if (typeof v === 'string' && v.length > 500) {
        res[k] = v.slice(0, 500) + '... (dipangkas oleh RTK)'
      } else {
        res[k] = crushJsonObject(v, mode)
      }
    }
    return res
  }

  return obj
}

/**
 * Headroom Context Compressor (Inspired by chopratejas/headroom)
 * Menyingkat histori chat dan menghilangkan format yang memboroskan konteks.
 */
export function compressChatHistory(
  messages: { role: string; content: string }[],
  config?: Partial<TokenOptimizationConfig>
): { role: string; content: string }[] {
  const opt = { ...DEFAULT_TOKEN_OPTIMIZATION_CONFIG, ...config }
  if (!opt.headroomEnabled || messages.length <= 4) return messages

  // Keep system message if any, and last 8 messages
  const lastMessages = messages.slice(-8)

  return lastMessages.map((m) => {
    let content = m.content

    // If code AST stripping enabled, strip huge comment blocks from code snippets
    if (opt.headroomExtras.code) {
      content = content.replace(/\/\*[\s\S]*?\*\//g, '')
    }

    return {
      role: m.role,
      content,
    }
  })
}

/**
 * Menyusun Persona & Directive Saver Prompts:
 * Menggabungkan Caveman, Ponytail, dan Custom System Prompt.
 */
export function buildOptimizerSystemDirectives(config?: Partial<TokenOptimizationConfig>): string {
  const opt = { ...DEFAULT_TOKEN_OPTIMIZATION_CONFIG, ...config }
  const directives: string[] = []

  // 1. Caveman Mode (Output token compressor)
  if (opt.cavemanMode === 'caveman') {
    directives.push(
      `[KOMPRESI OUTPUT CAVEMAN]: Jawab secara ultra-ringkas (gaya telegram/catatan teknis). Drop articles/kata sambung berlebih, fragments OK. Hapus salam pembuka, pengantar, atau penutup basa-basi. Langsung ke kode, poin esensial, atau instruksi actionable. Hemat ~65-87% token.`
    )
  } else if (opt.cavemanMode === 'terse') {
    directives.push(
      `[MODALITAS RINGKAS]: Jawab secara ringkas, lugas, padat, dan efisien tanpa basa-basi pembuka atau penutup.`
    )
  }

  // 2. Ponytail Mode (Lazy senior developer)
  if (opt.ponytailEnabled) {
    directives.push(
      `[PRINSIP DEVELOPER SENIOR (PONYTAIL)]: Utamakan YAGNI (You Aren't Gonna Need It). Terapkan Ladder: stdlib & fitur native platform first sebelum menambah dependensi library pihak ketiga. Lebih baik menghapus kode mati/menyederhanakan daripada menambah baris baru. Hasilkan solusi paling minimal, efisien, dan bersih.`
    )
  }

  // 3. Custom System Prompt (independently appended)
  if (opt.customSystemPrompt && opt.customSystemPrompt.trim()) {
    directives.push(
      `[ARAHAN KHUSUS PENGGUNA]:\n${opt.customSystemPrompt.trim()}`
    )
  }

  return directives.join('\n\n')
}
