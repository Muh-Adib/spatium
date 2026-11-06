import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { MCP_SCOPES, mcpScopeListSchema, type McpScope } from './scopes'

/**
 * Per-client API keys for the MCP endpoint (`/api/mcp`).
 *
 * - Plaintext format: `spm_<base64url of 32 random bytes>` (47 chars). It is
 *   returned exactly once, by `createMcpApiKey`, and never stored.
 * - Storage: SHA-256 hex digest (`keyHash`, unique) + a short display prefix.
 *   Keys carry 256 bits of entropy, so a fast unsalted hash is appropriate
 *   (no offline brute force is feasible); lookups use the unique index.
 * - Verification re-compares the stored digest in constant time, rejects
 *   revoked and expired keys, and touches `lastUsedAt` at most once a minute.
 */

export { MCP_SCOPES, type McpScope }

const KEY_PREFIX = 'spm_'
const KEY_PATTERN = /^spm_[A-Za-z0-9_-]{43}$/
const DISPLAY_PREFIX_LENGTH = 10
const LAST_USED_THROTTLE_MS = 60_000

export type McpKeyStatus = 'active' | 'revoked' | 'expired'

/** Safe-to-display key metadata (never includes the hash). */
export type McpApiKeyInfo = {
  id: number
  name: string
  keyPrefix: string
  scopes: McpScope[]
  createdBy: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
  expiresAt: string | null
  status: McpKeyStatus
}

/** Identity attached to a verified MCP request. */
export type McpPrincipal = {
  keyId: number
  name: string
  scopes: McpScope[]
  /** Audit actor recorded on every mutation: `mcp:<key name>`. */
  actor: string
}

export type VerifyResult =
  | { ok: true; principal: McpPrincipal }
  | { ok: false; reason: 'missing' | 'malformed' | 'unknown' | 'revoked' | 'expired' }

type KeyRow = {
  id: number
  name: string
  keyPrefix: string
  keyHash: string
  scopes: string
  createdBy: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
  expiresAt: string | null
}

export const createMcpKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter.')
    .max(80, 'Nama maksimal 80 karakter.')
    .regex(/^[\p{L}\p{N} ._\-–—()/@+:]+$/u, 'Nama hanya boleh huruf, angka, spasi, dan tanda baca sederhana (. _ - – ( ) / @ + :).'),
  scopes: mcpScopeListSchema,
  expiresAt: z.iso
    .datetime({ offset: true, message: 'Tanggal kedaluwarsa harus ISO 8601.' })
    .nullable()
    .optional()
    .refine((v) => !v || Date.parse(v) > Date.now(), { message: 'Tanggal kedaluwarsa harus di masa depan.' }),
})
export type CreateMcpKeyInput = z.infer<typeof createMcpKeySchema>

export function hashMcpKey(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf8').digest('hex')
}

export function generateMcpKey(): string {
  return `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`
}

/** Parses the stored JSON scope list; unknown or malformed entries are dropped (logged). */
export function parseStoredScopes(raw: string | null): McpScope[] {
  if (!raw) return []
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch (err) {
    console.warn('[mcp/keys] stored scopes are not valid JSON:', err)
    return []
  }
  if (!Array.isArray(value)) return []
  const list: unknown[] = value
  return MCP_SCOPES.filter((s) => list.includes(s))
}

function statusOf(row: Pick<KeyRow, 'revokedAt' | 'expiresAt'>, now = Date.now()): McpKeyStatus {
  if (row.revokedAt) return 'revoked'
  if (row.expiresAt && Date.parse(row.expiresAt) <= now) return 'expired'
  return 'active'
}

function toInfo(row: KeyRow): McpApiKeyInfo {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    scopes: parseStoredScopes(row.scopes),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
    expiresAt: row.expiresAt,
    status: statusOf(row),
  }
}

export async function listMcpApiKeys(): Promise<McpApiKeyInfo[]> {
  const rows = (await prisma.orm.public.McpApiKey.orderBy((k) => k.id.desc()).all()) as KeyRow[]
  return rows.map(toInfo)
}

/** Creates a key and returns its plaintext ONCE, plus the stored metadata. */
export async function createMcpApiKey(
  input: CreateMcpKeyInput,
  createdBy: string,
): Promise<{ plaintext: string; key: McpApiKeyInfo }> {
  const data = createMcpKeySchema.parse(input)
  const plaintext = generateMcpKey()
  const row = await prisma.transaction(async (tx) => {
    const created = (await tx.orm.public.McpApiKey.create({
      name: data.name,
      keyPrefix: plaintext.slice(0, DISPLAY_PREFIX_LENGTH),
      keyHash: hashMcpKey(plaintext),
      scopes: JSON.stringify(data.scopes),
      createdBy,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    })) as KeyRow
    await tx.orm.public.SeoAuditLog.create({
      entityType: 'mcp_key',
      entityId: String(created.id),
      action: 'create',
      actor: createdBy,
      diff: JSON.stringify({ name: data.name, scopes: data.scopes, expiresAt: created.expiresAt }),
    })
    return created
  })
  return { plaintext, key: toInfo(row) }
}

/** Revokes a key (idempotent). Returns null when the id does not exist. */
export async function revokeMcpApiKey(id: number, actor: string): Promise<McpApiKeyInfo | null> {
  return prisma.transaction(async (tx) => {
    const current = (await tx.orm.public.McpApiKey.where({ id }).first()) as KeyRow | null
    if (!current) return null
    if (current.revokedAt) return toInfo(current)
    const revokedAt = new Date().toISOString()
    await tx.orm.public.McpApiKey.where({ id }).update({ revokedAt })
    await tx.orm.public.SeoAuditLog.create({
      entityType: 'mcp_key',
      entityId: String(id),
      action: 'revoke',
      actor,
      diff: JSON.stringify({ name: current.name }),
    })
    return toInfo({ ...current, revokedAt })
  })
}

const lastTouched = new Map<number, number>()

async function touchLastUsed(row: KeyRow, now: number): Promise<void> {
  const memo = lastTouched.get(row.id) ?? 0
  const stored = row.lastUsedAt ? Date.parse(row.lastUsedAt) : 0
  if (now - Math.max(memo, stored) < LAST_USED_THROTTLE_MS) return
  lastTouched.set(row.id, now)
  try {
    await prisma.orm.public.McpApiKey.where({ id: row.id }).update({ lastUsedAt: new Date(now).toISOString() })
  } catch (err) {
    // Usage tracking must never block an authenticated request.
    console.warn('[mcp/keys] failed to update lastUsedAt:', err)
  }
}

/** Extracts the bearer credential from an `Authorization` header value. */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header)
  return match ? match[1] : null
}

export async function verifyMcpApiKey(plaintext: string | null, now = Date.now()): Promise<VerifyResult> {
  if (!plaintext) return { ok: false, reason: 'missing' }
  if (!KEY_PATTERN.test(plaintext)) return { ok: false, reason: 'malformed' }
  const digest = hashMcpKey(plaintext)
  const row = (await prisma.orm.public.McpApiKey.where({ keyHash: digest }).first()) as KeyRow | null
  if (!row) return { ok: false, reason: 'unknown' }
  const stored = Buffer.from(row.keyHash, 'hex')
  const given = Buffer.from(digest, 'hex')
  if (stored.length !== given.length || !timingSafeEqual(stored, given)) return { ok: false, reason: 'unknown' }
  const status = statusOf(row, now)
  if (status !== 'active') return { ok: false, reason: status }
  await touchLastUsed(row, now)
  return {
    ok: true,
    principal: { keyId: row.id, name: row.name, scopes: parseStoredScopes(row.scopes), actor: `mcp:${row.name}` },
  }
}
