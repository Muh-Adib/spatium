/**
 * MCP API key scopes. Safe for client and server (the Studio UI renders these).
 * There is deliberately no publish/archive/delete scope: MCP clients only
 * create and edit drafts; a human publishes from the Studio.
 */
import { z } from 'zod'

export const MCP_SCOPES = [
  'blocks:read',
  'pages:read',
  'pages:draft',
  'articles:read',
  'articles:draft',
  'portfolio:read',
  'portfolio:draft',
  'services:read',
  'services:draft',
] as const
export type McpScope = (typeof MCP_SCOPES)[number]

/** Pre-selected when creating a key: the page builder. Content scopes are opt-in. */
export const DEFAULT_MCP_SCOPES: readonly McpScope[] = ['blocks:read', 'pages:read', 'pages:draft']

export const MCP_SCOPE_INFO: Record<McpScope, { label: string; description: string }> = {
  'blocks:read': { label: 'Baca katalog blok', description: 'Melihat tipe blok, field, contoh, dan memvalidasi blok.' },
  'pages:read': { label: 'Baca halaman', description: 'Melihat daftar halaman, isi blok, dan syarat publikasi.' },
  'pages:draft': { label: 'Tulis draf halaman', description: 'Membuat dan mengubah halaman draf. Tidak bisa menerbitkan atau menghapus.' },
  'articles:read': { label: 'Baca artikel', description: 'Melihat artikel jurnal, kategori, penulis, dan syarat publikasi.' },
  'articles:draft': {
    label: 'Tulis draf artikel',
    description: 'Membuat dan mengubah artikel draf. Tidak bisa menerbitkan, menjadwalkan, atau menghapus.',
  },
  'portfolio:read': { label: 'Baca portofolio', description: 'Melihat entri portofolio (scene) dan syarat publikasinya.' },
  'portfolio:draft': { label: 'Tulis draf portofolio', description: 'Membuat dan mengubah portofolio draf. Tidak bisa menerbitkan atau menghapus.' },
  'services:read': { label: 'Baca layanan', description: 'Melihat layanan, kategori layanan, dan syarat publikasinya.' },
  'services:draft': {
    label: 'Tulis draf layanan',
    description: 'Membuat dan mengubah layanan dan kategori layanan draf. Tidak bisa menerbitkan atau menghapus.',
  },
}

export const mcpScopeSchema = z.enum(MCP_SCOPES)
export const mcpScopeListSchema = z
  .array(mcpScopeSchema)
  .min(1, 'Pilih minimal satu izin.')
  .transform((list) => MCP_SCOPES.filter((s) => list.includes(s)))
