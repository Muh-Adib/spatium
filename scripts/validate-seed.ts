#!/usr/bin/env tsx
/**
 * Seed validator — fails fast on broken seed data.
 *
 * Checks:
 *  1. duplicate slugs per entity
 *  2. service → category link integrity (no orphans)
 *  3. required fields (slug, name/title, shortDescription)
 *  4. portfolio status validity; `client` is null (not recorded — never
 *     invented, AGENTS.md §3.3) or a non-empty name
 *  5. referenced image paths exist on disk
 *  6. seed-manifest.json count parity
 *
 * Usage: npm run validate-seed
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SEED = path.join(ROOT, 'src/data/seed')
const errors: string[] = []

function load(name: string): any[] | null {
  const p = path.join(SEED, name)
  if (!fs.existsSync(p)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
    return Array.isArray(parsed) ? parsed : null
  } catch (e) {
    errors.push(`${name}: invalid JSON (${(e as Error).message})`)
    return null
  }
}

const cats = load('seed_service_categories.json')
const svcs = load('seed_services.json')
const ports = load('seed_portfolio.json')
const arts = load('seed_articles.json')
const pages = load('seed_pages.json')

// 1. duplicate slugs
for (const [name, data] of Object.entries({ categories: cats, services: svcs, portfolios: ports, articles: arts, pages })) {
  if (!data) continue
  const seen = new Set<string>()
  for (const row of data) {
    const slug = row?.slug
    if (!slug) continue
    if (seen.has(slug)) errors.push(`${name}: duplicate slug "${slug}"`)
    seen.add(slug)
  }
}

// 2. service → category integrity
const catSlugs = new Set((cats ?? []).map((c) => c.slug))
for (const s of svcs ?? []) {
  if (s.categorySlug && !catSlugs.has(s.categorySlug)) {
    errors.push(`service "${s.slug}": orphan category "${s.categorySlug}"`)
  }
}

// 3. required fields
for (const c of cats ?? []) {
  if (!c.slug || !c.title) errors.push(`category missing slug/title: ${JSON.stringify(c).slice(0, 80)}`)
}
for (const s of svcs ?? []) {
  if (!s.slug || !s.name) errors.push(`service missing slug/name: ${s.slug ?? '(none)'}`)
  if (!s.shortDescription) errors.push(`service "${s.slug}": missing shortDescription`)
}

// 4. portfolio status
for (const p of ports ?? []) {
  if (!['draft', 'published'].includes(p.status)) {
    errors.push(`portfolio "${p.slug}": invalid status "${p.status}" (expected draft|published)`)
  }
  if (p.client !== null && (typeof p.client !== 'string' || !p.client.trim())) {
    errors.push(`portfolio "${p.slug}": client must be null (unknown) or a non-empty name`)
  }
}

// 5. image paths exist
const refs = new Set<string>()
for (const d of [...(svcs ?? []), ...(ports ?? []), ...(pages ?? [])]) {
  for (const field of ['coverImage', 'heroImage', 'thumbnail']) {
    const v = d?.[field]
    if (typeof v === 'string' && v.startsWith('/')) refs.add(v)
    else if (v && typeof v === 'object' && typeof v.url === 'string' && v.url.startsWith('/')) refs.add(v.url)
  }
}
for (const ref of refs) {
  if (!fs.existsSync(path.join(ROOT, 'public', ref.replace(/^\//, '')))) {
    errors.push(`missing image file: ${ref}`)
  }
}

// 6. manifest parity
const manifestPath = path.join(SEED, 'seed-manifest.json')
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  const actual: Record<string, number> = {
    categories: cats?.length ?? 0,
    services: svcs?.length ?? 0,
    portfolios: ports?.length ?? 0,
    articles: arts?.length ?? 0,
    pages: pages?.length ?? 0,
  }
  for (const [k, v] of Object.entries(manifest.counts ?? {})) {
    if (k in actual && actual[k] !== v) {
      errors.push(`manifest mismatch: ${k} manifest=${v} actual=${actual[k]}`)
    }
  }
}

if (errors.length) {
  console.error(`\n✖ Seed validation failed (${errors.length} issue${errors.length > 1 ? 's' : ''}):\n`)
  for (const e of errors) console.error(`  - ${e}`)
  console.error('')
  process.exit(1)
}

console.log(
  `✔ Seed valid — ${cats?.length ?? 0} categories, ${svcs?.length ?? 0} services, ` +
    `${ports?.length ?? 0} portfolios, ${arts?.length ?? 0} articles, ${pages?.length ?? 0} pages.`
)
