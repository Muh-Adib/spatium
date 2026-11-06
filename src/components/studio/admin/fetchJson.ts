import type { z } from 'zod'

export type FetchResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

const errorMessage = (raw: unknown, fallback: string): string => {
  if (raw && typeof raw === 'object') {
    const rec = raw as Record<string, unknown>
    if (typeof rec.error === 'string' && rec.error) return rec.error
    if (typeof rec.message === 'string' && rec.message) return rec.message
  }
  return fallback
}

/**
 * Fetch JSON and validate it with a Zod schema at the trust boundary.
 * Network, HTTP and shape failures are logged and returned as `{ ok: false }`
 * so callers can render an honest error state (never mock data).
 */
export async function fetchJson<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  init: RequestInit & { fallbackError: string }
): Promise<FetchResult<z.infer<S>>> {
  const { fallbackError, ...rest } = init
  let res: Response
  try {
    res = await fetch(url, rest)
  } catch (err) {
    if (rest.signal?.aborted) return { ok: false, status: 0, error: 'aborted' }
    console.error(`[studio-admin] ${rest.method || 'GET'} ${url} failed:`, err)
    return { ok: false, status: 0, error: 'Server tidak terjangkau. Periksa koneksi lalu coba lagi.' }
  }
  let raw: unknown = null
  try {
    raw = await res.json()
  } catch (err) {
    console.warn(`[studio-admin] ${url} returned non-JSON (HTTP ${res.status}):`, err)
  }
  if (!res.ok) return { ok: false, status: res.status, error: errorMessage(raw, fallbackError) }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    console.error(`[studio-admin] ${url} returned an unexpected shape:`, parsed.error.issues.slice(0, 3))
    return { ok: false, status: res.status, error: fallbackError }
  }
  return { ok: true, data: parsed.data }
}

export const jsonHeaders = { 'Content-Type': 'application/json' } as const
