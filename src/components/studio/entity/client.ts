/**
 * Fetch helpers for the Studio catalogue APIs (`/api/service-categories`,
 * `/api/services`, `/api/portfolio`). Every call resolves to a result object;
 * failures carry the server message (or a network message) plus the issue
 * lists the editor maps to fields and blocks.
 */
import type { BlockIssue } from '@/lib/blocks/catalog'
import type { CatalogHistoryEntry } from '@/lib/catalog/history'
import { API_PATH, type EntityKind, type EntityRow } from './model'

export type EntityApiFailure = {
  status: number
  /** Server machine code (`conflict`, `slug_taken`, `gate`, `invalid`, `not_found`, …) when sent. */
  code?: string
  /** On `conflict`: the stored row's `updatedAt`, to overwrite deliberately. */
  currentUpdatedAt?: string
  error: string
  /** Gate / block issues as text. */
  issues: string[]
  /** Zod issues of the request body (`{ field, message }`). */
  fieldIssues: { field: string; message: string }[]
  blockIssues: BlockIssue[]
}

export type EntityApiResult<T> = { ok: true; data: T } | { ok: false; failure: EntityApiFailure }

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

async function request(url: string, init?: RequestInit): Promise<EntityApiResult<Record<string, unknown>>> {
  let res: Response
  try {
    res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store' })
  } catch (err) {
    console.warn('[entity-client] network error:', err)
    return {
      ok: false,
      failure: { status: 0, error: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', issues: [], fieldIssues: [], blockIssues: [] },
    }
  }
  let body: unknown = null
  try {
    body = await res.json()
  } catch (err) {
    console.warn('[entity-client] non-JSON response:', err)
  }
  const b = isObject(body) ? body : {}
  if (res.ok && b.success !== false) return { ok: true, data: b }
  const rawIssues = Array.isArray(b.issues) ? b.issues : []
  const error =
    res.status === 401
      ? 'Sesi Anda berakhir. Masuk lagi lalu coba simpan.'
      : res.status === 403
        ? 'Peran Anda tidak diizinkan melakukan tindakan ini.'
        : typeof b.error === 'string'
          ? b.error
          : `Permintaan gagal (HTTP ${res.status}). Coba lagi.`
  return {
    ok: false,
    failure: {
      status: res.status,
      ...(typeof b.code === 'string' ? { code: b.code } : {}),
      ...(typeof b.currentUpdatedAt === 'string' ? { currentUpdatedAt: b.currentUpdatedAt } : {}),
      error,
      issues: rawIssues.filter((i): i is string => typeof i === 'string'),
      fieldIssues: rawIssues.flatMap((i) =>
        isObject(i) && typeof i.field === 'string' && typeof i.message === 'string' ? [{ field: i.field, message: i.message }] : [],
      ),
      blockIssues: Array.isArray(b.blockIssues) ? b.blockIssues.filter((i): i is BlockIssue => isObject(i) && typeof i.index === 'number' && typeof i.message === 'string') : [],
    },
  }
}

function rowsOf(data: Record<string, unknown>): EntityRow[] {
  const list = Array.isArray(data.data) ? data.data : []
  return list.filter((r): r is EntityRow => isObject(r) && typeof r.id === 'number' && typeof r.slug === 'string')
}

export const entityApi = {
  async list(kind: EntityKind): Promise<EntityApiResult<EntityRow[]>> {
    const res = await request(API_PATH[kind])
    return res.ok ? { ok: true, data: rowsOf(res.data) } : res
  },

  /** Create (no `id`) or update. Resolves to the saved id. */
  async save(kind: EntityKind, payload: Record<string, unknown>): Promise<EntityApiResult<{ id: number }>> {
    const res = await request(API_PATH[kind], { method: 'POST', body: JSON.stringify(payload) })
    if (!res.ok) return res
    const nested = isObject(res.data.data) ? res.data.data.id : undefined
    const id = typeof res.data.id === 'number' ? res.data.id : typeof nested === 'number' ? nested : null
    if (id === null) {
      console.warn('[entity-client] save response without id:', res.data)
      return { ok: false, failure: { status: 200, error: 'Server tidak mengembalikan ID. Muat ulang daftar lalu coba lagi.', issues: [], fieldIssues: [], blockIssues: [] } }
    }
    return { ok: true, data: { id } }
  },

  /** Version history for the Riwayat tab (`GET /api/<entity>/<id>/revisions`). */
  async revisions(kind: EntityKind, id: number): Promise<EntityApiResult<{ revisions: CatalogHistoryEntry[]; truncated: boolean }>> {
    const res = await request(`${API_PATH[kind]}/${id}/revisions`)
    if (!res.ok) return res
    const data = isObject(res.data.data) ? res.data.data : {}
    const list = Array.isArray(data.revisions) ? data.revisions : []
    const revisions = list.filter(
      (r): r is CatalogHistoryEntry => isObject(r) && typeof r.id === 'number' && typeof r.action === 'string' && typeof r.createdAt === 'string',
    )
    return { ok: true, data: { revisions, truncated: data.truncated === true } }
  },

  async remove(kind: EntityKind, id: number): Promise<EntityApiResult<null>> {
    const res = await request(`${API_PATH[kind]}?id=${id}`, { method: 'DELETE' })
    return res.ok ? { ok: true, data: null } : res
  },
}
