import 'server-only'
import { z } from 'zod'
import { siteConfig } from '@/config/site'
import { BLOCK_CATALOG, listBlocksFor } from '@/lib/blocks/catalog'
import { bearerFrom, verifyMcpApiKey, type McpPrincipal } from './keys'
import { mcpRateLimiter } from './rate-limit'
import { MCP_INSTRUCTIONS, callTool, listToolsFor } from './tools'

/**
 * Model Context Protocol server over the Streamable HTTP transport
 * (revision 2025-06-18; 2025-03-26 is also negotiated).
 *
 * Stateless: no `Mcp-Session-Id` is issued or required, and the server never
 * opens an SSE stream (GET → 405). Every POST carries one JSON-RPC message or
 * a batch (batches are a 2025-03-26 feature, still accepted) and receives an
 * `application/json` response, or 202 when it only contained notifications.
 */

export const SERVER_NAME = 'spatium'
export const SERVER_VERSION = '1.0.0'
export const LATEST_PROTOCOL_VERSION = '2025-06-18'
export const SUPPORTED_PROTOCOL_VERSIONS: readonly string[] = ['2025-06-18', '2025-03-26']
/** Spec: without the header, servers assume 2025-03-26. */
const DEFAULT_HEADER_VERSION = '2025-03-26'
const MAX_BODY_BYTES = 1_000_000
const MAX_BATCH = 50

export const JSONRPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32003,
  RATE_LIMITED: -32029,
} as const

type JsonRpcId = string | number | null
type JsonRpcError = { code: number; message: string; data?: unknown }
type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | { jsonrpc: '2.0'; id: JsonRpcId; error: JsonRpcError }

const idSchema = z.union([z.string(), z.number().int()])
const messageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: idSchema.optional(),
  method: z.string().min(1).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
})

const initializeParams = z.looseObject({ protocolVersion: z.string() })
const toolsCallParams = z.looseObject({ name: z.string().min(1), arguments: z.record(z.string(), z.unknown()).optional() })
const resourceReadParams = z.looseObject({ uri: z.string().min(1) })
const promptGetParams = z.looseObject({ name: z.string().min(1), arguments: z.record(z.string(), z.string()).optional() })

class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data?: unknown,
  ) {
    super(message)
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

function httpError(status: number, code: number, message: string, headers: Record<string, string> = {}): Response {
  return json({ jsonrpc: '2.0', id: null, error: { code, message } }, status, headers)
}

function configuredOrigins(): Set<string> {
  const set = new Set<string>()
  for (const value of [siteConfig.url, ...(process.env.MCP_ALLOWED_ORIGINS ?? '').split(',')]) {
    const trimmed = value.trim()
    if (!trimmed) continue
    try {
      set.add(new URL(trimmed).origin)
    } catch (err) {
      console.warn('[mcp] ignoring malformed allowed origin:', trimmed, err)
    }
  }
  return set
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * DNS-rebinding protection: browser requests carry an Origin, which must be
 * the configured site URL or one of MCP_ALLOWED_ORIGINS (outside production,
 * loopback origins are also accepted). The Host header is deliberately NOT
 * trusted: a rebinding attacker controls it. CLI/desktop clients send no Origin.
 */
export function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  let parsed: URL
  try {
    parsed = new URL(origin)
  } catch (err) {
    console.warn('[mcp] malformed Origin header rejected:', err)
    return false
  }
  if (configuredOrigins().has(parsed.origin)) return true
  return process.env.NODE_ENV !== 'production' && LOOPBACK_HOSTS.has(parsed.hostname)
}

const AUTH_MESSAGES = {
  missing: 'Missing API key. Send "Authorization: Bearer spm_…" (create a key in Studio → MCP).',
  malformed: 'Malformed API key.',
  unknown: 'Invalid API key.',
  revoked: 'This API key has been revoked.',
  expired: 'This API key has expired.',
} as const

function unauthorized(reason: keyof typeof AUTH_MESSAGES): Response {
  const challenge =
    reason === 'missing'
      ? 'Bearer realm="spatium-mcp"'
      : `Bearer realm="spatium-mcp", error="invalid_token", error_description="${AUTH_MESSAGES[reason]}"`
  return httpError(401, JSONRPC.UNAUTHORIZED, AUTH_MESSAGES[reason], { 'WWW-Authenticate': challenge })
}

// ─── Resources & prompts ──────────────────────────────────────────────────────

const CATALOG_URI = 'spatium://blocks/catalog'

function catalogResource() {
  return {
    uri: CATALOG_URI,
    name: 'block-catalog',
    title: 'SPATIUM block catalogue',
    description: 'Every block type available for pages: label, description, category, fields and a valid example.',
    mimeType: 'application/json',
  }
}

function catalogText(): string {
  return JSON.stringify(
    listBlocksFor('page').map((e) => ({
      type: e.type,
      label: e.label,
      description: e.description,
      category: e.category,
      fields: e.fields,
      example: e.example,
    })),
    null,
    2,
  )
}

const LANDING_PROMPT = {
  name: 'build_landing_page',
  title: 'Build a landing page draft',
  description: 'Guides the model through composing a landing page draft from catalogue blocks in the recommended order.',
  arguments: [
    { name: 'topic', description: 'What the page is about (service, campaign or audience).', required: true },
    { name: 'audience', description: 'Who the page is for.', required: false },
  ],
}

function landingPromptText(topic: string, audience?: string): string {
  const order = ['hero-cinema', 'heading2', 'paragraph', 'feature-bento-grid', 'splat-viewer', 'process-timeline', 'faq-accordion', 'studio-cta']
  const available = new Set(BLOCK_CATALOG.map((e) => e.type))
  const steps = order.filter((t) => available.has(t))
  return [
    `Build a SPATIUM landing page draft about: ${topic}.${audience ? ` Audience: ${audience}.` : ''}`,
    '1. Call list_block_types, then get_block_type for each block you plan to use.',
    `2. Recommended order: ${steps.join(' → ')}. Skip blocks you have no real content for.`,
    '3. Use only facts the user gave you. Never invent metrics, client names, testimonials or image URLs; leave images out rather than guessing.',
    '4. Call create_page_draft with a clear title, metaTitle (≤ 60 chars) and metaDescription (120–160 chars).',
    '5. Call get_page, fix what you can from publication.issues, and give the user the editUrl so a human can review and publish.',
  ].join('\n')
}

const ARTICLE_PROMPT = {
  name: 'write_article',
  title: 'Write a journal article draft',
  description: 'Guides the model through writing a journal article draft that is ready for human review.',
  arguments: [
    { name: 'topic', description: 'What the article is about.', required: true },
    { name: 'audience', description: 'Who the article is for.', required: false },
  ],
}

function articlePromptText(topic: string, audience?: string): string {
  return [
    `Write a SPATIUM journal article draft about: ${topic}.${audience ? ` Audience: ${audience}.` : ''}`,
    '1. Call list_article_taxonomy and pick an existing category (and author, only if the user named one). Do not invent new ones.',
    '2. Write semantic HTML: an intro <p>, then <h2> sections (with <h3> sub-sections when needed), lists where they help. No <h1>: the title is the H1.',
    '3. Use only facts the user gave you or that are common knowledge. Never invent metrics, client names, quotes, testimonials or image URLs; leave images out rather than guessing, and give every <img> alt text.',
    '4. Call create_article_draft with title, content, excerpt (1–2 sentences), metaTitle (≤ 60 chars) and metaDescription (120–160 chars).',
    '5. Call get_article, fix what you can from publication.issues with update_article_draft (pass expectedUpdatedAt), and give the user the editUrl so a human can review and publish.',
  ].join('\n')
}

const PROMPTS = [LANDING_PROMPT, ARTICLE_PROMPT] as const

// ─── Dispatch ─────────────────────────────────────────────────────────────────

async function dispatch(method: string, params: Record<string, unknown>, principal: McpPrincipal): Promise<unknown> {
  const canReadBlocks = principal.scopes.includes('blocks:read')
  switch (method) {
    case 'initialize': {
      const p = initializeParams.safeParse(params)
      if (!p.success) throw new RpcError(JSONRPC.INVALID_PARAMS, 'initialize requires params.protocolVersion')
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(p.data.protocolVersion) ? p.data.protocolVersion : LATEST_PROTOCOL_VERSION
      return {
        protocolVersion,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
        serverInfo: { name: SERVER_NAME, title: 'SPATIUM content studio', version: SERVER_VERSION },
        instructions: MCP_INSTRUCTIONS,
      }
    }
    case 'ping':
      return {}
    case 'tools/list':
      return { tools: listToolsFor(principal.scopes) }
    case 'tools/call': {
      const p = toolsCallParams.safeParse(params)
      if (!p.success) throw new RpcError(JSONRPC.INVALID_PARAMS, 'tools/call requires params.name (string) and optional params.arguments (object)')
      let outcome
      try {
        outcome = await callTool(p.data.name, p.data.arguments ?? {}, { actor: principal.actor, scopes: principal.scopes })
      } catch (err) {
        console.error(`[mcp] tool ${p.data.name} failed for ${principal.actor}:`, err)
        return { content: [{ type: 'text', text: 'The tool failed because of a server error. Try again later.' }], isError: true }
      }
      if (outcome.kind === 'unknown_tool') throw new RpcError(JSONRPC.INVALID_PARAMS, `Unknown tool: ${p.data.name}`)
      return outcome.result
    }
    case 'resources/list':
      return { resources: canReadBlocks ? [catalogResource()] : [] }
    case 'resources/templates/list':
      return { resourceTemplates: [] }
    case 'resources/read': {
      const p = resourceReadParams.safeParse(params)
      if (!p.success) throw new RpcError(JSONRPC.INVALID_PARAMS, 'resources/read requires params.uri')
      if (p.data.uri !== CATALOG_URI || !canReadBlocks) throw new RpcError(-32002, `Resource not found: ${p.data.uri}`)
      return { contents: [{ uri: CATALOG_URI, mimeType: 'application/json', text: catalogText() }] }
    }
    case 'prompts/list':
      return { prompts: [...PROMPTS] }
    case 'prompts/get': {
      const p = promptGetParams.safeParse(params)
      if (!p.success) throw new RpcError(JSONRPC.INVALID_PARAMS, 'prompts/get requires params.name')
      const prompt = PROMPTS.find((candidate) => candidate.name === p.data.name)
      if (!prompt) throw new RpcError(JSONRPC.INVALID_PARAMS, `Unknown prompt: ${p.data.name}`)
      const topic = p.data.arguments?.topic?.trim()
      if (!topic) throw new RpcError(JSONRPC.INVALID_PARAMS, 'Missing required argument: topic')
      const audience = p.data.arguments?.audience
      const text = prompt.name === ARTICLE_PROMPT.name ? articlePromptText(topic, audience) : landingPromptText(topic, audience)
      return { description: prompt.description, messages: [{ role: 'user', content: { type: 'text', text } }] }
    }
    default:
      throw new RpcError(JSONRPC.METHOD_NOT_FOUND, `Method not found: ${method}`)
  }
}

/** Handles one JSON-RPC message; returns null for notifications and client responses. */
async function handleMessage(raw: unknown, principal: McpPrincipal): Promise<JsonRpcResponse | null> {
  const parsed = messageSchema.safeParse(raw)
  if (!parsed.success) {
    const id = raw && typeof raw === 'object' && 'id' in raw ? idSchema.safeParse((raw as { id: unknown }).id) : null
    return { jsonrpc: '2.0', id: id?.success ? id.data : null, error: { code: JSONRPC.INVALID_REQUEST, message: 'Invalid JSON-RPC 2.0 message' } }
  }
  const msg = parsed.data
  if (!msg.method) return null // A response to a server request: we never send any, so ignore.
  if (msg.id === undefined) return null // Notification (notifications/initialized, cancelled…): no reply.
  try {
    const result = await dispatch(msg.method, msg.params ?? {}, principal)
    return { jsonrpc: '2.0', id: msg.id, result }
  } catch (err) {
    if (err instanceof RpcError) {
      return { jsonrpc: '2.0', id: msg.id, error: { code: err.code, message: err.message, ...(err.data ? { data: err.data } : {}) } }
    }
    console.error(`[mcp] ${msg.method} failed for ${principal.actor}:`, err)
    return { jsonrpc: '2.0', id: msg.id, error: { code: JSONRPC.INTERNAL_ERROR, message: 'Internal error' } }
  }
}

export async function handleMcpPost(request: Request): Promise<Response> {
  if (!isOriginAllowed(request)) return httpError(403, JSONRPC.FORBIDDEN, 'Origin not allowed')

  const headerVersion = request.headers.get('mcp-protocol-version') ?? DEFAULT_HEADER_VERSION
  if (!SUPPORTED_PROTOCOL_VERSIONS.includes(headerVersion)) {
    return httpError(400, JSONRPC.INVALID_REQUEST, `Unsupported MCP-Protocol-Version: ${headerVersion}. Supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')}`)
  }

  let auth: Awaited<ReturnType<typeof verifyMcpApiKey>>
  try {
    auth = await verifyMcpApiKey(bearerFrom(request.headers.get('authorization')))
  } catch (err) {
    console.error('[mcp] API key verification failed (database unavailable?):', err)
    return httpError(503, JSONRPC.INTERNAL_ERROR, 'Authentication is temporarily unavailable. Try again shortly.', { 'Retry-After': '5' })
  }
  if (!auth.ok) return unauthorized(auth.reason)
  const principal = auth.principal

  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (declaredLength > MAX_BODY_BYTES) return httpError(413, JSONRPC.INVALID_REQUEST, 'Request body too large')
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return httpError(413, JSONRPC.INVALID_REQUEST, 'Request body too large')

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch (err) {
    console.warn(`[mcp] parse error from ${principal.actor}:`, err instanceof Error ? err.message : err)
    return httpError(400, JSONRPC.PARSE_ERROR, 'Parse error: body is not valid JSON')
  }

  const isBatch = Array.isArray(body)
  const messages: unknown[] = Array.isArray(body) ? body : [body]
  if (isBatch && messages.length === 0) return httpError(400, JSONRPC.INVALID_REQUEST, 'Empty batch')
  if (messages.length > MAX_BATCH) return httpError(400, JSONRPC.INVALID_REQUEST, `Batch too large (max ${MAX_BATCH})`)

  const limit = mcpRateLimiter.take(`key:${principal.keyId}`, messages.length)
  if (!limit.allowed) {
    return httpError(429, JSONRPC.RATE_LIMITED, 'Rate limit exceeded for this API key', { 'Retry-After': String(limit.retryAfterSeconds) })
  }

  const responses: JsonRpcResponse[] = []
  for (const message of messages) {
    // Sequential on purpose: edits in one batch apply in order.
    const response = await handleMessage(message, principal)
    if (response) responses.push(response)
  }
  if (responses.length === 0) return new Response(null, { status: 202 })
  return json(isBatch ? responses : responses[0], 200, { 'X-RateLimit-Remaining': String(limit.remaining) })
}

export function methodNotAllowed(): Response {
  return httpError(405, JSONRPC.INVALID_REQUEST, 'Method not allowed: this MCP server is stateless and accepts POST only (no SSE stream).', {
    Allow: 'POST',
  })
}
