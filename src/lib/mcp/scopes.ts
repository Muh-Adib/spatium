/**
 * MCP API key scopes. Safe for client and server (the Studio UI renders these).
 * There is deliberately no publish/archive/delete scope: MCP clients only
 * create and edit drafts; a human publishes from the Studio.
 */
import { z } from 'zod'

export const MCP_SCOPES = ['blocks:read', 'pages:read', 'pages:draft'] as const
export type McpScope = (typeof MCP_SCOPES)[number]

export const DEFAULT_MCP_SCOPES: readonly McpScope[] = MCP_SCOPES

export const MCP_SCOPE_INFO: Record<McpScope, { label: string; description: string }> = {
  'blocks:read': { label: 'Baca katalog blok', description: 'Melihat tipe blok, field, contoh, dan memvalidasi blok.' },
  'pages:read': { label: 'Baca halaman', description: 'Melihat daftar halaman, isi blok, dan syarat publikasi.' },
  'pages:draft': { label: 'Tulis draf', description: 'Membuat dan mengubah halaman draf. Tidak bisa menerbitkan atau menghapus.' },
}

export const mcpScopeSchema = z.enum(MCP_SCOPES)
export const mcpScopeListSchema = z
  .array(mcpScopeSchema)
  .min(1, 'Pilih minimal satu izin.')
  .transform((list) => MCP_SCOPES.filter((s) => list.includes(s)))
