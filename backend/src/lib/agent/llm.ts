import { getSiteSettings } from '@/lib/content/queries'
import { normalizeGoogleModel } from '@/lib/ai/model-capabilities'
import { blockOntology } from '@/lib/blocks/ontology'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'model' | 'function'
  content?: string
  name?: string
  tool_call_id?: string
  tool_calls?: any[]
  parts?: any[]
  functionCall?: any
  functionResponse?: any
}

export interface LlmCallOptions {
  provider: 'google' | 'openrouter'
  apiKey: string
  model: string
  messages: ChatMessage[]
  systemInstruction?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  proxyUrl?: string
  thinkingMode?: 'auto' | 'off' | 'on'
  retries?: number
  tools?: any[]
  toolChoice?: any
}

export interface LlmCallResult {
  reply: string
  durationMs: number
  provider: string
  model: string
  thoughts?: string
  toolCalls?: any[]
  finishReason?: string
}

export interface NormalizedToolCall {
  id?: string
  name: string
  arguments: Record<string, any>
}

export interface ExtractedCandidateParts {
  text: string
  thoughts: string[]
  functionCalls: Array<{ name: string; args: Record<string, any> }>
  hasContent: boolean
}

/**
 * Extracts text, thoughts, and function calls from Google Gemini candidates
 * without falling back to "Tidak ada respons teks yang dihasilkan."
 */
export function parseCandidateParts(candidate: any): ExtractedCandidateParts {
  if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
    return { text: '', thoughts: [], functionCalls: [], hasContent: false }
  }

  const textParts: string[] = []
  const thoughts: string[] = []
  const functionCalls: Array<{ name: string; args: Record<string, any> }> = []

  for (const part of candidate.content.parts) {
    if (!part || typeof part !== 'object') continue

    if (part.thought === true && typeof part.text === 'string') {
      if (part.text.trim()) thoughts.push(part.text)
    } else if (typeof part.text === 'string') {
      textParts.push(part.text)
    }

    if (part.functionCall && typeof part.functionCall.name === 'string') {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      })
    }
  }

  const combinedText = textParts.join('\n').trim()
  const hasContent = combinedText.length > 0 || thoughts.length > 0 || functionCalls.length > 0

  return {
    text: combinedText,
    thoughts,
    functionCalls,
    hasContent,
  }
}

/**
 * Normalizes tool calls from both Google Gemini (`functionCall` format: `{ name, args }`)
 * and OpenRouter/OpenAI (`tool_calls` format: `{ id, type, function: { name, arguments } }`)
 * into a single unified `{ id, name, arguments }` structure.
 */
export function normalizeToolCall(tc: any): NormalizedToolCall {
  if (!tc || typeof tc !== 'object') {
    return { name: '', arguments: {} }
  }

  // OpenAI / OpenRouter format
  if (tc.function?.name) {
    let args: Record<string, any> = {}
    if (typeof tc.function.arguments === 'string') {
      try {
        args = JSON.parse(tc.function.arguments)
      } catch {
        args = {}
      }
    } else if (typeof tc.function.arguments === 'object' && tc.function.arguments !== null) {
      args = tc.function.arguments
    }
    return {
      id: tc.id,
      name: tc.function.name,
      arguments: args,
    }
  }

  // Google Gemini format
  const name = tc.name || ''
  let args = tc.args || tc.arguments || {}
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch {
      args = {}
    }
  }

  return {
    id: tc.id,
    name,
    arguments: typeof args === 'object' && args !== null ? args : {},
  }
}

export interface AiErrorClassification {
  isQuotaOrRateLimit: boolean
  isQuotaExceeded: boolean
  isRateLimited: boolean
  isLimitZero: boolean
  status?: number
  code?: string
  message: string
  provider: string
  model: string
}

/**
 * Centralized AI error classification helper.
 * Detects HTTP 429 (Rate Limit), HTTP 402 (Credits Exhausted), RESOURCE_EXHAUSTED,
 * Quota exceeded limit 0, and Google RPC QuotaFailure details.
 */
export function classifyAiError(
  err: any,
  provider: string = 'unknown',
  model: string = 'unknown'
): AiErrorClassification {
  if (!err) {
    return {
      isQuotaOrRateLimit: false,
      isQuotaExceeded: false,
      isRateLimited: false,
      isLimitZero: false,
      message: 'No error provided',
      provider,
      model,
    }
  }

  // 1. Extract status code
  let status: number | undefined = undefined
  if (typeof err?.status === 'number') {
    status = err.status
  } else if (typeof err?.statusCode === 'number') {
    status = err.statusCode
  } else if (typeof err?.error?.code === 'number') {
    status = err.error.code
  } else if (typeof err?.code === 'number') {
    status = err.code
  }

  // 2. Extract code / error status string
  let code: string | undefined = undefined
  if (typeof err?.code === 'string') {
    code = err.code
  } else if (typeof err?.error?.status === 'string') {
    code = err.error.status
  } else if (typeof err?.error?.code === 'string') {
    code = String(err.error.code)
  } else if (typeof err?.status === 'string') {
    code = err.status
  }

  // 3. Extract QuotaFailure details (Google RPC)
  const quotaViolation =
    err?.details?.[0]?.violations?.[0]?.description ||
    err?.error?.details?.[0]?.violations?.[0]?.description ||
    ''

  // 4. Extract message string
  let message =
    err?.message ||
    err?.error?.message ||
    (typeof err === 'string' ? err : '') ||
    ''

  if (quotaViolation && !message.includes(quotaViolation)) {
    message = message ? `${message} (${quotaViolation})` : quotaViolation
  }
  if (!message) {
    message = code || (status ? `HTTP ${status}` : 'Unknown AI Error')
  }

  // 5. If status not found yet, check regex in message string
  if (!status) {
    const statusMatch = message.match(/\b(429|402|404|500|503)\b/)
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10)
    }
  }

  // 6. Comprehensive string checking
  const combinedText = `${message} ${quotaViolation} ${code || ''} ${status || ''}`.toLowerCase()

  const isLimitZero =
    combinedText.includes('limit 0') ||
    combinedText.includes('limit: 0') ||
    combinedText.includes('limit:0') ||
    combinedText.includes('quota exceeded limit 0')

  const isQuotaExceeded =
    isLimitZero ||
    status === 402 ||
    combinedText.includes('resource_exhausted') ||
    combinedText.includes('quota exceeded') ||
    combinedText.includes('resource has been exhausted') ||
    combinedText.includes('credits exhausted') ||
    combinedText.includes('insufficient_quota') ||
    combinedText.includes('out of credits') ||
    combinedText.includes('credit limit')

  const isRateLimited =
    status === 429 ||
    combinedText.includes('429') ||
    combinedText.includes('rate limit') ||
    combinedText.includes('rate_limit') ||
    combinedText.includes('too many requests')

  const isQuotaOrRateLimit = isQuotaExceeded || isRateLimited || isLimitZero

  return {
    isQuotaOrRateLimit,
    isQuotaExceeded,
    isRateLimited,
    isLimitZero,
    status,
    code,
    message,
    provider,
    model,
  }
}

/**
 * Delay helper for exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function cleanContentAndExtractThoughts(rawContent: string, existingThoughts?: string): { cleanReply: string; finalThoughts?: string } {
  if (!rawContent || typeof rawContent !== 'string') {
    return { cleanReply: '', finalThoughts: existingThoughts }
  }

  let thoughtsCollector = existingThoughts || ''
  let cleaned = rawContent

  // 1. Extract <think>...</think> or <thought>...</thought>
  const tagRegex = /<(?:think|thought)>([\s\S]*?)<\/(?:think|thought)>/gi
  let match: RegExpExecArray | null
  while ((match = tagRegex.exec(cleaned)) !== null) {
    if (match[1]?.trim()) {
      thoughtsCollector = (thoughtsCollector ? thoughtsCollector + '\n\n' : '') + match[1].trim()
    }
  }
  cleaned = cleaned.replace(tagRegex, '').trim()

  // 2. Extract leading thinking scratchpad (e.g. "Here's a thinking process: ...", "Thinking Process: ...")
  const leadingThinkRegex = /^(?:Here'?s a thinking process[:\n]|Thinking Process[:\n]|Thinking[:\n])([\s\S]*?)(?=(?:#+\s+|[A-Z][a-z0-9\s]+:|```|<h[1-6]>|\n\n(?:Di|Dalam|Pada|Untuk|Sebagai|Berikut|Halo|Hai|SegiaTech)))/i
  const leadingMatch = cleaned.match(leadingThinkRegex)
  if (leadingMatch && leadingMatch[1]?.trim()) {
    thoughtsCollector = (thoughtsCollector ? thoughtsCollector + '\n\n' : '') + leadingMatch[0].trim()
    cleaned = cleaned.replace(leadingThinkRegex, '').trim()
  }

  // 3. Strip trailing scratchpad notes leaked before markdown
  cleaned = cleaned.replace(/^`\.\s*So I can use that pattern[\s\S]*?(?=(?:#+\s+|```|<h[1-6]>|\n\n[A-Z]))/i, '').trim()

  return {
    cleanReply: cleaned,
    finalThoughts: thoughtsCollector.trim() || undefined,
  }
}

/**
 * Normalizes JSON Schema types recursively for OpenRouter/OpenAI (lowercase) or Google (UPPERCASE)
 */
export function normalizeSchemaTypes(schema: any, uppercase: boolean): any {
  if (!schema || typeof schema !== 'object') return schema
  if (Array.isArray(schema)) return schema.map((item) => normalizeSchemaTypes(item, uppercase))

  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'type' && typeof v === 'string') {
      result[k] = uppercase ? v.toUpperCase() : v.toLowerCase()
    } else if (typeof v === 'object' && v !== null) {
      result[k] = normalizeSchemaTypes(v, uppercase)
    } else {
      result[k] = v
    }
  }
  return result
}

/**
 * Converts tool definitions into Google Gemini functionDeclarations format
 */
export function formatToolsForGoogle(tools: any[]): any[] {
  if (!Array.isArray(tools) || tools.length === 0) return []
  if (tools[0]?.functionDeclarations) return tools

  const declarations = tools.map((t) => {
    const fn = t.type === 'function' && t.function ? t.function : t
    return {
      name: fn.name,
      description: fn.description || '',
      parameters: normalizeSchemaTypes(
        fn.parameters || { type: 'OBJECT', properties: {} },
        true
      ),
    }
  })

  return [{ functionDeclarations: declarations }]
}

/**
 * Converts tool definitions into OpenAI / OpenRouter `{ type: 'function', function: ... }` format
 */
export function formatToolsForOpenRouter(tools: any[]): any[] {
  if (!Array.isArray(tools) || tools.length === 0) return []

  const rawList = tools[0]?.functionDeclarations ? tools[0].functionDeclarations : tools
  return rawList.map((t: any) => {
    const fn = t.type === 'function' && t.function ? t.function : t
    return {
      type: 'function',
      function: {
        name: fn.name,
        description: fn.description || '',
        parameters: normalizeSchemaTypes(
          fn.parameters || { type: 'object', properties: {} },
          false
        ),
      },
    }
  })
}

/**
 * Centralized LLM execution engine with header-based authorization,
 * token bounds, and exponential backoff retry for transient rate limits.
 * (ADR-0011 / L10-T5)
 */
export async function callLlm(options: LlmCallOptions): Promise<LlmCallResult> {
  const {
    provider,
    apiKey,
    model,
    messages,
    systemInstruction = '',
    temperature = 0.4,
    maxTokens = 2500,
    topP,
    proxyUrl,
    thinkingMode,
    retries = 2,
  } = options

  const t0 = Date.now()
  const customProxy = typeof proxyUrl === 'string' && proxyUrl.trim() ? proxyUrl.trim().replace(/\/$/, '') : null
  const safeMessages = Array.isArray(messages) ? messages : (messages ? [messages] : [])

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s...
        await sleep(1000 * Math.pow(2, attempt - 1))
      }

      if (provider === 'google') {
        const cleanModel = normalizeGoogleModel(model)
        // Use both header and query param per official Google Generative Language REST API specs
        const apiUrl = customProxy
          ? `${customProxy}/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`
          : `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`

        const contents: Array<{ role: string; parts: any[] }> = []
        for (const m of safeMessages) {
          if (!m || m.role === 'system') continue

          let role = m.role === 'assistant' ? 'model' : m.role
          if (role === 'tool') role = 'function'

          if (Array.isArray(m.parts) && m.parts.length > 0) {
            contents.push({ role, parts: m.parts })
            continue
          }
          if (m.functionCall) {
            contents.push({ role: 'model', parts: [{ functionCall: m.functionCall }] })
            continue
          }
          if (m.functionResponse) {
            const part = { functionResponse: m.functionResponse }
            const prev = contents[contents.length - 1]
            if (prev && prev.role === 'function') {
              prev.parts.push(part)
            } else {
              contents.push({ role: 'function', parts: [part] })
            }
            continue
          }
          if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
            const parts: any[] = m.tool_calls.map((tc: any) => {
              const name = tc.function?.name || tc.name
              let args = tc.function?.arguments || tc.args || {}
              if (typeof args === 'string') {
                try {
                  args = JSON.parse(args)
                } catch {
                  args = {}
                }
              }
              return { functionCall: { name, args } }
            })
            if (m.content) {
              parts.unshift({ text: m.content })
            }
            contents.push({ role: 'model', parts })
            continue
          }
          if (m.role === 'tool' && m.name) {
            let resp = m.content
            if (typeof resp === 'string') {
              try {
                resp = JSON.parse(resp)
              } catch {}
            }
            const fnPart = {
              functionResponse: {
                name: m.name,
                response: typeof resp === 'object' && resp !== null ? resp : { content: resp },
              },
            }
            const prev = contents[contents.length - 1]
            if (prev && prev.role === 'function') {
              prev.parts.push(fnPart)
            } else {
              contents.push({ role: 'function', parts: [fnPart] })
            }
            continue
          }
          contents.push({
            role: role === 'function' ? 'function' : role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content || '' }],
          })
        }

        const generationConfig: Record<string, any> = {
          temperature,
          maxOutputTokens: maxTokens,
        }
        if (typeof topP === 'number') generationConfig.topP = topP
        if (thinkingMode === 'off') {
          generationConfig.thinkingConfig = { thinkingBudget: 0 }
        }

        const payload: any = {
          contents,
          generationConfig,
        }

        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }],
          }
        }

        if (options.tools && options.tools.length > 0) {
          payload.tools = formatToolsForGoogle(options.tools)
        }

        if (options.toolChoice) {
          if (typeof options.toolChoice === 'object') {
            payload.toolConfig = options.toolChoice
          } else if (typeof options.toolChoice === 'string') {
            payload.toolConfig = {
              functionCallingConfig: {
                mode: options.toolChoice.toUpperCase(),
              },
            }
          }
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const violationDesc = data.error?.details?.[0]?.violations?.[0]?.description
          let errMsg = data.error?.message || data.error?.status || `HTTP ${res.status}`
          if (violationDesc && !errMsg.includes(violationDesc)) {
            errMsg = `${errMsg} (${violationDesc})`
          }

          // Tool schema degradation for Google Gemini
          if (res.status === 400 && payload.tools && /tool|function|declaration|support/i.test(errMsg)) {
            console.warn(`[callLlm] Google model "${cleanModel}" rejected tools (${errMsg}). Retrying without tools...`)
            delete payload.tools
            delete payload.toolConfig

            const retryRes = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify(payload),
            })

            if (retryRes.ok) {
              const retryData = await retryRes.json()
              const candidate = retryData.candidates?.[0]
              const finishReason = candidate?.finishReason
              const parsed = parseCandidateParts(candidate)
              let reply = parsed.text
              if (!reply && parsed.thoughts.length > 0) {
                reply = parsed.thoughts.join('\n\n')
              } else if (!reply) {
                reply = 'Tidak ada respons teks yang dihasilkan.'
              }
              return {
                reply,
                thoughts: parsed.thoughts.length > 0 ? parsed.thoughts.join('\n\n') : undefined,
                toolCalls: undefined,
                finishReason,
                durationMs: Date.now() - t0,
                provider,
                model: cleanModel,
              }
            }
          }

          if (res.status === 404) {
            throw new Error(`Google Gemini Error (404 Not Found): Model "${cleanModel}" tidak ditemukan di Google AI Studio. Pastikan menggunakan model resmi seperti gemini-2.5-flash atau gemini-2.5-pro. Detail: ${errMsg}`)
          }

          const classification = classifyAiError({ status: res.status, error: data.error, message: errMsg, details: data.error?.details }, provider, cleanModel)
          if (classification.isLimitZero || classification.isQuotaExceeded) {
            throw new Error(`Google API Quota Error (${res.status}): ${errMsg}`)
          }
          if (res.status === 429 || res.status >= 500) {
            throw new Error(`Google API Transient Error (${res.status}): ${errMsg}`)
          }
          throw new Error(`Google Gemini Error: ${errMsg}`)
        }

        const data = await res.json()
        const candidate = data.candidates?.[0]
        const finishReason = candidate?.finishReason
        const parsed = parseCandidateParts(candidate)

        const toolCalls = parsed.functionCalls.length > 0 ? parsed.functionCalls : undefined
        const thoughts = parsed.thoughts.length > 0 ? parsed.thoughts.join('\n\n') : undefined

        let reply = parsed.text
        if (!reply && (!toolCalls || toolCalls.length === 0)) {
          if (thoughts) {
            reply = thoughts
          } else {
            reply = 'Tidak ada respons teks yang dihasilkan.'
          }
        }

        return {
          reply,
          thoughts,
          toolCalls,
          finishReason,
          durationMs: Date.now() - t0,
          provider,
          model: cleanModel,
        }
      }

      if (provider === 'openrouter') {
        const cleanOpenRouterModel = (model || 'meta-llama/llama-3.3-70b-instruct:free').replace(/^openrouter\//, '')
        let apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
        if (customProxy) {
          if (customProxy.includes('/chat/completions')) {
            apiUrl = customProxy
          } else if (customProxy.includes('/v1')) {
            apiUrl = `${customProxy}/chat/completions`
          } else {
            apiUrl = `${customProxy}/api/v1/chat/completions`
          }
        }

        const openRouterMessages = [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          ...safeMessages.map((m: any) => {
            const role = m.role === 'model' ? 'assistant' : m.role === 'function' ? 'tool' : m.role
            const msg: Record<string, any> = {
              role,
              content: m.content ?? null,
            }
            if (m.tool_calls) msg.tool_calls = m.tool_calls
            if (m.tool_call_id) msg.tool_call_id = m.tool_call_id
            if (m.name) msg.name = m.name
            if (!m.tool_calls && m.functionCall) {
              msg.tool_calls = [
                {
                  id: `call_${Date.now()}`,
                  type: 'function',
                  function: {
                    name: m.functionCall.name,
                    arguments: typeof m.functionCall.args === 'string' ? m.functionCall.args : JSON.stringify(m.functionCall.args || {}),
                  },
                },
              ]
            }
            if (m.functionResponse) {
              msg.role = 'tool'
              msg.name = m.functionResponse.name
              msg.content = typeof m.functionResponse.response === 'string' ? m.functionResponse.response : JSON.stringify(m.functionResponse.response ?? {})
              msg.tool_call_id = m.tool_call_id || `call_${m.functionResponse.name}`
            }
            return msg
          }),
        ]

        const payload: Record<string, any> = {
          model: cleanOpenRouterModel,
          messages: openRouterMessages,
          temperature,
          max_tokens: maxTokens,
        }
        if (typeof topP === 'number') payload.top_p = topP
        if (options.tools && options.tools.length > 0) {
          payload.tools = formatToolsForOpenRouter(options.tools)
        }
        if (options.toolChoice) payload.tool_choice = options.toolChoice

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://www.segiatech.com',
            'X-Title': 'SegiaTech Digital Studio',
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errMsg = data.error?.message || `HTTP ${res.status}`

          // Tool schema degradation: If model rejects tools (HTTP 400), retry immediately without tools payload
          if (res.status === 400 && payload.tools) {
            const isToolRejection =
              /tool|function|support|parameter|schema/i.test(errMsg) ||
              errMsg.toLowerCase().includes('provider does not support') ||
              errMsg.toLowerCase().includes('not supported')

            if (isToolRejection) {
              console.warn(
                `[callLlm] OpenRouter model "${cleanOpenRouterModel}" rejected tools (${errMsg}). Retrying with tool degradation...`
              )
              delete payload.tools
              delete payload.tool_choice

              const retryRes = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                  'HTTP-Referer': 'https://www.segiatech.com',
                  'X-Title': 'SegiaTech Digital Studio',
                },
                body: JSON.stringify(payload),
              })

              if (retryRes.ok) {
                const retryData = await retryRes.json()
                const choice = retryData.choices?.[0]
                const message = choice?.message
                const content = message?.content
                const rawThoughts = (
                  typeof message?.reasoning === 'string'
                    ? message.reasoning
                    : typeof message?.reasoning_content === 'string'
                      ? message.reasoning_content
                      : typeof message?.thought === 'string'
                        ? message.thought
                        : ''
                ).trim() || undefined

                const rawContent = (typeof content === 'string' ? content : '').trim()
                const { cleanReply, finalThoughts } = cleanContentAndExtractThoughts(rawContent, rawThoughts)

                let reply = cleanReply
                if (!reply && finalThoughts) {
                  reply = finalThoughts
                } else if (!reply) {
                  reply = 'Tidak ada respons teks yang dihasilkan.'
                }

                return {
                  reply,
                  thoughts: finalThoughts,
                  toolCalls: undefined,
                  finishReason: choice?.finish_reason,
                  durationMs: Date.now() - t0,
                  provider,
                  model: cleanOpenRouterModel,
                }
              }
            }
          }

          const classification = classifyAiError({ status: res.status, error: data.error, message: errMsg }, provider, cleanOpenRouterModel)
          if (classification.isLimitZero || classification.isQuotaExceeded) {
            throw new Error(`OpenRouter Quota Error (${res.status}): ${errMsg}`)
          }
          if (res.status === 429 || res.status >= 500) {
            throw new Error(`OpenRouter Transient Error (${res.status}): ${errMsg}`)
          }
          throw new Error(`OpenRouter Error: ${errMsg}`)
        }

        const data = await res.json()
        const choice = data.choices?.[0]
        const message = choice?.message
        const content = message?.content
        const rawToolCalls = message?.tool_calls
        const finishReason = choice?.finish_reason

        const toolCalls = Array.isArray(rawToolCalls) && rawToolCalls.length > 0 ? rawToolCalls : undefined
        const rawThoughts = (
          typeof message?.reasoning === 'string'
            ? message.reasoning
            : typeof message?.reasoning_content === 'string'
              ? message.reasoning_content
              : typeof message?.thought === 'string'
                ? message.thought
                : ''
        ).trim() || undefined

        const rawContent = (typeof content === 'string' ? content : '').trim()
        const { cleanReply, finalThoughts } = cleanContentAndExtractThoughts(rawContent, rawThoughts)

        let reply = cleanReply
        if (!reply && (!toolCalls || toolCalls.length === 0)) {
          if (finalThoughts) {
            reply = finalThoughts
          } else {
            reply = 'Tidak ada respons teks yang dihasilkan.'
          }
        }

        return {
          reply,
          thoughts: finalThoughts,
          toolCalls,
          finishReason,
          durationMs: Date.now() - t0,
          provider,
          model: cleanOpenRouterModel,
        }
      }

      throw new Error(`Provider tidak didukung: ${provider}`)
    } catch (err: any) {
      lastError = err
      const classification = classifyAiError(err, provider, model)
      if (classification.isLimitZero || classification.isQuotaExceeded) {
        break
      }
      // If error is not transient, do not retry
      if (!err.message?.includes('Transient Error') && !err.message?.includes('429')) {
        break
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi LLM provider setelah beberapa percobaan.')
}

/**
 * Build dynamic system prompt grounded in live site settings and editorial voice.
 */
export async function buildSystemPrompt(context?: {
  currentTab?: string
  pathname?: string
  role?: string
  actorName?: string
  toneVoice?: string
  pageTitle?: string
  selectedSlug?: string
  focusKeyphrase?: string
  violations?: string
  locationName?: string
  userMemories?: { key: string; content: string }[]
  sessionSummary?: string
  article?: Record<string, any>
}): Promise<string> {
  let siteName = 'SegiaTech'
  let siteTagline = 'Creative Technology & Immersive Software Engineering House'
  let siteUrl = 'https://www.segiatech.com'

  try {
    const settings = await getSiteSettings()
    if (settings) {
      siteName = settings.siteName || siteName
      siteTagline = settings.siteDescription || siteTagline
      siteUrl = settings.siteUrl || siteUrl
    }
  } catch {}

  const art = context?.article

  return `Anda adalah SegiaTech AI Studio Assistant, asisten kecerdasan rekayasa web dan editorial resmi dari ${siteName} (${siteUrl}).

PROFIL & IDENTITAS BRAND:
- Nama: ${siteName}
- Tagline: ${siteTagline}
- Posisi: Digital Product Studio & Creative Technology House berbasis di Yogyakarta. Spesialis Next.js 16 App Router, simulasi interaktif WebGL/Three.js (seperti Interactive 3D Aquarium & Projection Mapping), dan platform digital institusi (kampus, sekolah, museum, perusahaan).
- Gaya Komunikasi: Editorial berkelas, presisi teknis, percaya diri, informatif, dan menginspirasi. Hindari bahasa berlebihan/hiperbola tanpa dasar data.

ATURAN REKAYASA & KEAMANAN (AGENTS.md & ZERO-MOCK):
1. ZERO-MOCK POLICY: DILARANG mengarang angka metrik, data trafik palsu, atau skor buatan. Jika data tidak ada atau integrasi belum terhubung, sampaikan status faktual secara jujur.
2. DATABASE SEBAGAI SUMBER TUNGGAL: Seluruh konten tersimpan dalam basis data PostgreSQL via Prisma 8 ORM.
3. PRINSIP DRAF HANYA (Rule 8): Agen AI HANYA diizinkan membuat draf konten, analisis SEO, atau saran perbaikan. Agen DILARANG mempublikasikan konten secara sepihak tanpa persetujuan editor manusia.
4. SINGLE-BRAND SEGIATECH (ADR-0007): Platform ini 100% didedikasikan untuk ekosistem SegiaTech.
5. PROTOKOL PENALARAN (REASONING & THINKING FIRST):
   - Sebelum memutuskan mengambil tindakan, memilih tool, atau merumuskan perubahan, lakukan penalaran logis terlebih dahulu:
     * Analisis maksud pengguna secara semantik.
     * Evaluasi apakah data dan konteks yang tersedia sudah cukup untuk menjawab atau bertindak.
     * Rencanakan langkah eksekusi atau pemilihan tool secara objektif.
   - Jika model memiliki kemampuan thinking (reasoning mode), tuangkan alur penalaran Anda secara eksplisit dan mendalam.
6. KLARIFIKASI & MENANYAKAN KONTEKS JIKA KURANG JELAS:
   - Jika instruksi pengguna ambigu, terlalu singkat (misalnya "perbaiki ini" tanpa konteks masalah atau bagian yang dituju), atau memiliki banyak kemungkinan interpretasi:
     * JANGAN membuat asumsi sepihak atau mengubah konten secara sembarangan.
     * Tanyakan klarifikasi secara ramah, ringkas, dan proaktif dengan menyajikan 2-3 pilihan opsi terarah agar pengguna dapat memutuskan langkah selanjutnya dengan cepat.
   - PENGECUALIAN: Jika pengguna meminta perbaikan dan data artikel aktif SUDAH TERSEDIA di editor (tercantum pada bagian DATA LENGKAP ARTIKEL AKTIF di atas), gunakan langsung data tersebut dan uraikan masalah serta perbaikannya tanpa meminta ulang teks artikel kepada pengguna.
7. DINAMIKA BLOK KONTEN & ARSITEKTUR HALAMAN (DYNAMIC BLOCK ONTOLOGY):
   - Platform SegiaTech menggunakan katalog blok modular terstruktur yang terus bertambah. Pahami peran, urutan narasi (#10 Hero s/d #80 CTA), blok wajib (anchor), dan efek visual berikut:
${blockOntology.generateLlmManifest()}
8. [ATURAN KETAT PEMANGGILAN TOOLS]:
   - DILARANG KERAS mengarang nama fungsi fiktif atau menggunakan contoh dokumentasi seperti "example_function_name", "...", "my_func", atau placeholder lainnya.
   - Anda HANYA diizinkan memanggil nama fungsi yang secara eksplisit tercantum dalam daftar function declarations.
   - Jika data yang dibutuhkan sudah mencukupi atau tidak ada tool yang cocok, berikan jawaban langsung dalam teks tanpa memanggil tool fiktif.


KONTEKS PENGGUNA & LOKASI AKTIF:
- Operator/Penulis: ${context?.actorName || 'Editor Studio'} (${context?.role || 'EDITOR'})
- Tab Aktif: ${context?.currentTab || 'Umum'}
- Jalur/Halaman: ${context?.pathname || '/admin'}
${context?.locationName ? `- Lokasi Rute/Kerja: ${context.locationName}` : ''}
${context?.selectedSlug ? `- Slug Konten: /artikel/${context.selectedSlug}` : ''}
${context?.pageTitle ? `- Judul Konten: ${context.pageTitle}` : ''}
${context?.focusKeyphrase ? `- Focus Keyphrase: ${context.focusKeyphrase}` : ''}
${context?.violations ? `- Evaluasi Gerbang Publikasi: ${context.violations}` : ''}
${context?.toneVoice ? `- Preferensi Gaya Tulisan: ${context.toneVoice}` : ''}
${
  context?.userMemories && context.userMemories.length > 0
    ? `\nMEMORI & PREFERENSI PENGGUNA (ChatGPT/Gemini Style Memory):\n` +
      context.userMemories.map((m) => `- ${m.key}: ${m.content}`).join('\n')
    : ''
}
${
  context?.sessionSummary
    ? `\nRINGKASAN SESI TERDAHULU (Prompt Cache Prefix):\n${context.sessionSummary}\n`
    : ''
}
${
  art
    ? `
=====================================================
DATA LENGKAP ARTIKEL AKTIF DI EDITOR STUDIO SAAT INI:
=====================================================
- Judul Halaman: "${art.title || '(Belum diberi judul)'}"
- Slug: /artikel/${art.slug || '(draf-baru)'}
- Kategori: ${art.category || 'Website Development'}
- Status: ${art.status || 'draft'}
- Bahasa / Locale: ${art.locale || 'id'}
- Penulis: ${art.author || context?.actorName || 'Tim SegiaTech'}
- Focus Keyphrase: "${art.focusKeyphrase || art.targetKeyword || '(Belum diset)'}"
- Related Keyphrases: ${art.relatedKeyphrases?.length ? art.relatedKeyphrases.join(', ') : '(Belum ada)'}
- SEO Meta Title: "${art.seoTitle || art.title || '(Belum diset)'}"
- SEO Meta Description: "${art.metaDescription || art.excerpt || '(Belum diset)'}"
- Cover Image: ${art.coverUrl ? `Ada (${art.coverUrl})` : 'Belum ada'} | Alt Text: "${art.coverAlt || '(KOSONG)'}"
- Total Kata: ${art.wordCount || 0} kata (~${art.readingTimeMinutes || 1} menit baca)
- Tautan Internal SegiaTech: ${art.internalLinksCount || 0} tautan

SKOR & EVALUASI ANALYZER REAL-TIME (YOAST-PARITY):
- Skor SEO Saat Ini: ${art.seoScore ?? 'N/A'}/100
- Skor Keterbacaan (Readability) Saat Ini: ${art.readabilityScore ?? 'N/A'}/100
${
  art.seoIndicators && art.seoIndicators.length > 0
    ? `- Evaluasi Indikator SEO:
${art.seoIndicators.map((i: any) => `  * [${(i.status || '').toUpperCase()}] ${i.label}: ${i.message}`).join('\n')}`
    : ''
}
${
  art.readabilityIndicators && art.readabilityIndicators.length > 0
    ? `- Evaluasi Indikator Keterbacaan (Readability):
${art.readabilityIndicators.map((i: any) => `  * [${(i.status || '').toUpperCase()}] ${i.label}: ${i.message}${i.fixHint ? ` (Solusi: ${i.fixHint})` : ''}`).join('\n')}`
    : ''
}
${
  art.gateViolations && art.gateViolations.length > 0
    ? `- Pelanggaran Gerbang Publikasi: ${art.gateViolations.join('; ')}`
    : '- Gerbang Publikasi: LOLOS'
}

CUPLIKAN ISI KONTEN ARTIKEL SAAT INI:
"""
${(art.content || '(Isi artikel masih kosong)').slice(0, 3500)}
"""
=====================================================

PETUNJUK PENGGUNAAN TOOLS & REKOMENDASI PERUBAHAN:
[ATURAN KETAT PEMANGGILAN TOOLS]:
- DILARANG KERAS mengarang nama fungsi fiktif atau menggunakan contoh dokumentasi seperti "example_function_name", "...", "my_func", atau placeholder lainnya.
- Anda HANYA diizinkan memanggil nama fungsi yang secara eksplisit tercantum dalam daftar function declarations.
- Jika data yang dibutuhkan sudah mencukupi atau tidak ada tool yang cocok, berikan jawaban langsung dalam teks tanpa memanggil tool fiktif.

1. Jika tool tersedia, UTAMAKAN memanggil tool:
   - \`inspect_active_article\` untuk membaca teks lengkap atau indikator artikel aktif.
   - \`edit_article_segment\` jika hanya mengoreksi kalimat, typo, atau paragraf tertentu.
   - \`analyze_keyword_and_readability\` untuk menghitung metrik kepadatan dan kalimat pasif secara akurat.
   - \`apply_article_draft_or_metadata\` untuk membuat draf artikel baru atau memperbarui metadata SEO.
2. Jika tool tidak tersedia / terjadi fallback non-tool dan pengguna meminta pembuatan atau perbaikan artikel untuk mencapai skor 100:
   a. Mulai jawaban dengan analisis ringkas poin-poin yang belum optimal.
   b. Berikan perbaikan komprehensif (judul 40-70 kar, meta description 120-160 kar, kata kunci di awal, kepadatan 0.8%-2.5%, dsb).
   c. Sertakan blok kode \`\`\`json:article-changes di akhir respons:
\`\`\`json:article-changes
{
  "title": "<Judul artikel riil yang telah dioptimalkan 40-70 karakter>",
  "seoTitle": "<Judul SEO 40-70 Karakter — SegiaTech>",
  "metaDescription": "<Deskripsi meta 120-160 karakter memikat dan memuat kata kunci fokus>",
  "focusKeyphrase": "<kata kunci fokus riil artikel>",
  "coverAlt": "<Deskripsi alternatif gambar cover yang mendeskripsikan subjek artikel>",
  "category": "<Kategori yang relevan>",
  "content": "<Konten lengkap artikel dalam format HTML / Markdown dengan heading H2, H3, paragraf aktif, kata transisi, dan tautan internal...>",
  "summary": "<Ringkasan komprehensif perbaikan editorial yang telah diterapkan>"
}
\`\`\`
Blok ini dibaca oleh Studio untuk mengaktifkan tombol 1-klik "Terapkan Perubahan ke Editor".`
    : ''
}

Berikan jawaban yang ringkas, terstruktur, berbasis data riil, dan berfokus pada solusi rekayasa web.`
}
