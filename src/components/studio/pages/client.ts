/**
 * Typed fetch helpers for `/api/pages` used by the Studio pages manager.
 * Every call resolves to a result object; failures carry the server message
 * (or a network message) so the UI can always say what went wrong.
 */
import type { BlockIssue } from '@/lib/blocks/catalog'
import type { PageStatus } from '@/lib/pages/page-schema'
import type { PageGateResult } from '@/lib/pages/gate'

export type PageDto = {
  id: number
  slug: string
  title: string
  status: PageStatus
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  ogImageAlt: string | null
  robots: string
  blocks: unknown[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type PageSummaryDto = Pick<PageDto, 'id' | 'slug' | 'title' | 'status' | 'updatedAt' | 'publishedAt'> & { blockCount: number }
export type RevisionDto = { id: number; actor: string; action: string; createdAt: string }

export type ApiFailure = {
  status: number
  error: string
  code?: string
  issues?: string[]
  blockIssues?: BlockIssue[]
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; failure: ApiFailure }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    })
  } catch (err) {
    console.warn('[pages-client] network error:', err)
    return { ok: false, failure: { status: 0, error: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.' } }
  }
  let body: unknown = null
  try {
    body = await res.json()
  } catch (err) {
    console.warn('[pages-client] non-JSON response:', err)
  }
  if (res.ok) return { ok: true, data: body as T }
  const b = isObject(body) ? body : {}
  const error =
    typeof b.error === 'string' && b.error !== 'Forbidden' && b.error !== 'Unauthorized'
      ? b.error
      : typeof b.message === 'string'
        ? b.message
        : `Permintaan gagal (HTTP ${res.status}).`
  return {
    ok: false,
    failure: {
      status: res.status,
      error,
      code: typeof b.code === 'string' ? b.code : undefined,
      issues: Array.isArray(b.issues) ? b.issues.filter((i): i is string => typeof i === 'string') : undefined,
      blockIssues: Array.isArray(b.blockIssues) ? (b.blockIssues as BlockIssue[]) : undefined,
    },
  }
}

export const pagesApi = {
  list: () => request<{ pages: PageSummaryDto[] }>('/api/pages'),
  get: (id: number) => request<{ page: PageDto; gate: PageGateResult }>(`/api/pages/${id}`),
  create: (input: { title: string; slug: string; blocks: unknown[] }) =>
    request<{ page: PageDto }>('/api/pages', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, patch: Record<string, unknown>) =>
    request<{ page: PageDto; gate: PageGateResult }>(`/api/pages/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  setStatus: (id: number, status: PageStatus) =>
    request<{ page: PageDto }>(`/api/pages/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  remove: (id: number) => request<{ ok: true }>(`/api/pages/${id}`, { method: 'DELETE' }),
  revisions: (id: number) => request<{ revisions: RevisionDto[] }>(`/api/pages/${id}/revisions`),
}
