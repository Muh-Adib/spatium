import { createHash } from 'crypto'
import { safeFetch } from '@/lib/security/ssrf'

export interface WordPressConnection { siteUrl: string; username?: string; applicationPassword?: string; completeExport?: boolean }
export function normalizeWordPressSource(siteUrl: string): string {
  const url = new URL(siteUrl)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Gunakan URL situs HTTPS tanpa kredensial, query, atau fragmen.')
  return url.href.replace(/\/+$/, '')
}
export function contentHash(value: unknown): string {
  const stable = (v: any): any => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}
export function localContentHash(row: Record<string, unknown>): string {
  return 'v2:' + contentHash(Object.fromEntries(['slug', 'title', 'content', 'excerpt', 'status', 'metaTitle', 'metaDescription', 'seoData', 'coverUrl', 'tags', 'categoryId', 'authorId', 'publishedAt', 'canonicalUrl', 'robots', 'focusKeyphrase', 'relatedKeyphrases', 'primaryCategory', 'isCornerstone'].map((key) => [key, row[key] ?? null])))
}
export function wordpressDate(gmt?: string, local?: string): string | null {
  if (gmt && !gmt.startsWith('0000-')) {
    const date = new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(gmt) ? gmt : `${gmt}Z`)
    if (!Number.isFinite(date.getTime())) throw new Error('Tanggal UTC WordPress tidak valid.')
    return date.toISOString()
  }
  return local || null
}
export async function* wordpressCollection(connection: WordPressConnection, entity: string): AsyncGenerator<Record<string, any>> {
  const source = normalizeWordPressSource(connection.siteUrl)
  if (!!connection.username !== !!connection.applicationPassword) throw new Error('Username dan Application Password harus diisi bersama.')
  const authenticated = !!connection.applicationPassword
  if (connection.completeExport && !authenticated) throw new Error('Ekspor lengkap memerlukan akun administrator WordPress dan Application Password.')
  let received = 0
  let expected: number | null = null
  let totalPages: number | null = null

  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ per_page: '100', page: String(page), _embed: 'true' })
    if (authenticated && (entity === 'posts' || entity === 'pages')) {
      query.set('context', 'edit')
      query.set('status', 'any')
    }
    const response = await safeFetch(`${source}/wp-json/${connection.completeExport ? 'webshift/v1/export' : 'wp/v2'}/${entity}?${query}`, {
      maxRedirects: authenticated ? 0 : 3,
      timeoutMs: 45_000,
      headers: { Accept: 'application/json', ...(authenticated ? { Authorization: `Basic ${Buffer.from(`${connection.username}:${connection.applicationPassword}`).toString('base64')}` } : {}) },
    })
    if (!response.ok) {
      if (page > 1 && response.status === 400) {
        try {
          const errJson = await response.json()
          if (errJson?.code === 'rest_post_invalid_page_number') {
            break
          }
        } catch {}
      }
      if (response.status === 401) {
        throw new Error(
          `Autentikasi gagal (HTTP 401) pada ${entity}. Pastikan: (1) Gunakan 'Sandi Aplikasi' (Application Password) dari WP Admin > Pengguna > Profil Saya, BUKAN sandi login akun biasa. (2) Jika hosting menggunakan LiteSpeed/Hostinger, pastikan modul Authorization aktif di .htaccess.`
        )
      }
      throw new Error(`Gagal mengambil ${entity} halaman ${page}: HTTP ${response.status}. Periksa URL dan izin WordPress.`)
    }
    if (connection.completeExport && response.headers.get('x-webshift-export-version') !== '1') throw new Error('Exporter WordPress tidak tersedia atau versinya tidak didukung.')
    const items = await response.json()
    if (!Array.isArray(items)) throw new Error(`Respons ${entity} bukan daftar WordPress yang valid.`)

    const total = response.headers.get('x-wp-total')
    if (total !== null) {
      const n = Number(total)
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Jumlah total WordPress tidak valid.')
      if (expected !== null && expected !== n) {
        console.warn(`[wordpress-sync] Data WordPress berubah saat sinkronisasi (${entity}: sebelumnya ${expected}, sekarang ${n}).`)
      }
      expected = n
    }

    const totalPagesHeader = response.headers.get('x-wp-totalpages')
    if (totalPagesHeader !== null) {
      const p = Number(totalPagesHeader)
      if (Number.isSafeInteger(p) && p >= 0) {
        totalPages = p
      }
    } else if (expected !== null) {
      totalPages = Math.ceil(expected / 100)
    }

    if (items.length === 0) break

    for (const item of items) {
      if (!Number.isSafeInteger(item.id)) throw new Error(`ID ${entity} tidak valid.`)
      received++
      yield item
    }

    // Determine when to stop pagination:
    if (totalPages !== null) {
      if (page >= totalPages) break
    } else if (expected !== null) {
      if (received >= expected) break
    } else {
      if (items.length < 100) break
    }
  }

  // Strict check only for dedicated webshift complete export; for standard WP REST, variance is logged
  if (connection.completeExport && expected !== null && received !== expected) {
    throw new Error(`Jumlah ${entity} tidak cocok: diterima ${received}, sumber ${expected}.`)
  } else if (expected !== null && received !== expected) {
    console.warn(`[wordpress-sync] Info: Total ${entity} yang diterima (${received}) berbeda dari header x-wp-total (${expected}). Hal ini wajar di WordPress karena filter otorisasi/status privat lampiran.`)
  }
}
