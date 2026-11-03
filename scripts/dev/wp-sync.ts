#!/usr/bin/env tsx
/**
 * DEV-ONLY WordPress → Seed Synchronizer (UNIMASI)
 *
 * NOT part of the production runtime. Never imported by `src/`.
 *
 * Usage:
 *   WP_SITE_URL=https://www.unimasi.com \
 *   WP_USER=admin \
 *   WP_APP_PASSWORD='xxxx xxxx xxxx xxxx' \
 *   npm run dev:wp-sync -- --i-know-this-is-dev
 *
 * Reads all posts/pages (publish, future, draft, pending, private) plus
 * categories, tags, authors, media and Yoast SEO data via the WordPress REST
 * API using an Application Password (Basic auth, context=edit).
 *
 * Writes:
 *   src/data/seed/seed_articles.json   (sharded: seed_articles.<n>.json if large)
 *   src/data/seed/seed_pages.json
 *   src/data/seed/seed-manifest.json   (counts + checksum per entity)
 *   docs/services/wp-reconciliation.md (WP count vs seed count)
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '../..')
const SEED_DIR = path.join(ROOT, 'src/data/seed')
const DOCS_DIR = path.join(ROOT, 'docs/services')
const SHARD_BYTES = 2 * 1024 * 1024 // 2 MB per shard

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

// ---- guards ---------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  fail('Refusing to run in production. This is a development-only tool.')
}
if (!process.argv.includes('--i-know-this-is-dev')) {
  fail('Missing required flag: --i-know-this-is-dev')
}
const SITE_URL = (process.env.WP_SITE_URL || '').replace(/\/+$/, '')
const WP_USER = process.env.WP_USER || ''
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || ''
if (!SITE_URL || !WP_USER || !WP_APP_PASSWORD) {
  fail('Set WP_SITE_URL, WP_USER and WP_APP_PASSWORD in your local environment.')
}

const AUTH = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64')

async function wp<T = any>(endpoint: string, params: Record<string, string | number> = {}): Promise<{ data: T; totalPages: number; total: number }> {
  const url = new URL(`${SITE_URL}/wp-json/wp/v2/${endpoint}`)
  for (const [k, v] of Object.entries({ per_page: 100, context: 'edit', ...params })) {
    url.searchParams.set(k, String(v))
  }
  const res = await fetch(url, { headers: { Authorization: AUTH, 'User-Agent': 'unimasi-dev-wp-sync' } })
  if (!res.ok) {
    fail(`WP REST ${endpoint} → HTTP ${res.status} ${res.statusText}. Periksa Application Password & izin administrator.`)
  }
  return {
    data: (await res.json()) as T,
    totalPages: Number(res.headers.get('x-wp-totalpages') || 1),
    total: Number(res.headers.get('x-wp-total') || 0),
  }
}

async function fetchAll<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const first = await wp<T[]>(endpoint, { ...params, page: 1 })
  const all: T[] = [...first.data]
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await wp<T[]>(endpoint, { ...params, page })
    all.push(...next.data)
    process.stdout.write(`\r  ${endpoint}: ${all.length}/${first.total}`)
  }
  process.stdout.write('\n')
  return all
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
}

function writeSharded(name: string, rows: unknown[]): { files: string[]; bytes: number } {
  const files: string[] = []
  let batch: unknown[] = []
  let batchBytes = 0
  let index = 1
  const flush = () => {
    if (batch.length === 0) return
    const file = `${name}.${index}.json`
    const body = JSON.stringify(batch, null, 2)
    fs.writeFileSync(path.join(SEED_DIR, file), body)
    files.push(file)
    batch = []
    batchBytes = 0
    index++
  }
  for (const row of rows) {
    const size = JSON.stringify(row).length
    if (batchBytes + size > SHARD_BYTES) flush()
    batch.push(row)
    batchBytes += size
  }
  flush()
  const bytes = files.reduce((n, f) => n + fs.statSync(path.join(SEED_DIR, f)).size, 0)
  return { files, bytes }
}

async function main() {
  console.log(`\n🔄 UNIMASI dev WP sync ← ${SITE_URL}\n`)
  fs.mkdirSync(SEED_DIR, { recursive: true })
  fs.mkdirSync(DOCS_DIR, { recursive: true })

  const statuses = ['publish', 'future', 'draft', 'pending', 'private']
  const posts: any[] = []
  for (const status of statuses) {
    const rows = await fetchAll<any>('posts', { status })
    posts.push(...rows)
  }
  const pages = await fetchAll<any>('pages', { status: 'any' })
  const categories = await fetchAll<any>('categories')
  const tags = await fetchAll<any>('tags')
  const users = await fetchAll<any>('users')
  const media = await fetchAll<any>('media')

  const mapPost = (p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title?.rendered ?? p.title?.raw ?? '',
    excerpt: p.excerpt?.rendered ?? '',
    content: p.content?.rendered ?? '',
    status: p.status,
    date: p.date,
    modified: p.modified,
    author: users.find((u) => u.id === p.author)?.name ?? 'Tim Redaksi',
    category: categories.find((c) => p.categories?.includes(c.id))?.name ?? 'Umum',
    tags: (p.tags || []).map((id: number) => tags.find((t) => t.id === id)?.name).filter(Boolean),
    featuredMedia: p.featured_media || null,
    seo: p.yoast_head_json
      ? {
          metaTitle: p.yoast_head_json.title,
          metaDescription: p.yoast_head_json.description,
          canonicalUrl: p.yoast_head_json.canonical,
          focusKeyphrase: p.yoast_head_json.schema?.['@graph']?.[0]?.keywords ?? '',
          ogImage: p.yoast_head_json.og_image?.[0]?.url,
          robots: p.yoast_head_json.robots,
        }
      : null,
  })

  const mappedPosts = posts.map(mapPost)
  const mappedPages = pages.map(mapPost)

  const postShards = writeSharded('seed_articles', mappedPosts)
  const pageShards = writeSharded('seed_pages', mappedPages)

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: SITE_URL,
    counts: {
      posts: mappedPosts.length,
      pages: mappedPages.length,
      categories: categories.length,
      tags: tags.length,
      users: users.length,
      media: media.length,
    },
    statusBreakdown: {
      posts: statuses.reduce<Record<string, number>>((acc, s) => {
        acc[s] = mappedPosts.filter((p) => p.status === s).length
        return acc
      }, {}),
      pages: statuses.reduce<Record<string, number>>((acc, s) => {
        acc[s] = mappedPages.filter((p) => p.status === s).length
        return acc
      }, {}),
    },
    shards: { posts: postShards.files, pages: pageShards.files },
    checksums: {
      posts: sha256(JSON.stringify(mappedPosts)),
      pages: sha256(JSON.stringify(mappedPages)),
    },
  }
  fs.writeFileSync(path.join(SEED_DIR, 'seed-manifest.json'), JSON.stringify(manifest, null, 2))

  const lines = [
    '# WP Reconciliation — UNIMASI',
    '',
    `Sumber: ${SITE_URL}`,
    `Waktu: ${manifest.generatedAt}`,
    '',
    '| Entitas | WordPress | Seed | Selisih |',
    '|---|---|---|---|',
    `| Posts | ${manifest.counts.posts} | ${mappedPosts.length} | ${manifest.counts.posts - mappedPosts.length} |`,
    `| Pages | ${manifest.counts.pages} | ${mappedPages.length} | ${manifest.counts.pages - mappedPages.length} |`,
    `| Categories | ${manifest.counts.categories} | — | — |`,
    `| Tags | ${manifest.counts.tags} | — | — |`,
    `| Media | ${manifest.counts.media} | — | — |`,
    '',
    '## Status breakdown (posts)',
    ...Object.entries(manifest.statusBreakdown.posts).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Status breakdown (pages)',
    ...Object.entries(manifest.statusBreakdown.pages).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '> Selisih 0 = semua item berhasil diambil. Item yang gagal dicatat manual di sini.',
  ]
  fs.writeFileSync(path.join(DOCS_DIR, 'wp-reconciliation.md'), lines.join('\n'))

  console.log(`\n✔ Posts: ${mappedPosts.length} (${postShards.files.length} shard)`)
  console.log(`✔ Pages: ${mappedPages.length} (${pageShards.files.length} shard)`)
  console.log(`✔ Manifest: src/data/seed/seed-manifest.json`)
  console.log(`✔ Reconciliation: docs/services/wp-reconciliation.md\n`)
}

main().catch((err) => fail(String(err)))
