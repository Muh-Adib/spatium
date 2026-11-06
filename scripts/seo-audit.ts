#!/usr/bin/env tsx
/**
 * SEO audit — crawls the local sitemap and reports per-page SEO health.
 *
 * Usage:
 *   npm run build && npm start &
 *   BASE_URL=http://localhost:3002 npm run seo-audit
 *
 * Output (gitignored): .tmp/reports/seo-audit.md + .tmp/reports/seo-audit.csv
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BASE = (process.env.BASE_URL || 'http://localhost:3002').replace(/\/$/, '')
const DOCS = path.join(ROOT, '.tmp', 'reports')
fs.mkdirSync(DOCS, { recursive: true })

interface Row {
  url: string
  status: number
  title: string
  titleLen: number
  description: string
  descLen: number
  canonical: string
  robots: string
  h1Count: number
  jsonLdCount: number
  jsonLdValid: boolean
  imagesMissingAlt: number
  ogComplete: boolean
  issues: string[]
}

async function getSitemapUrls(): Promise<string[]> {
  for (const candidate of ['/sitemap.xml', '/sitemap_index.xml']) {
    try {
      const res = await fetch(`${BASE}${candidate}`)
      if (!res.ok) continue
      const xml = await res.text()
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
      if (locs.length === 0) continue
      // Follow one level of sitemap index
      if (locs.every((l) => l.endsWith('.xml'))) {
        const nested: string[] = []
        for (const l of locs) {
          try {
            const r = await fetch(l)
            if (!r.ok) continue
            const x = await r.text()
            nested.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))
          } catch { /* skip */ }
        }
        return [...new Set(nested)]
      }
      return [...new Set(locs)]
    } catch { /* try next */ }
  }
  return []
}

function attr(html: string, re: RegExp): string {
  const m = html.match(re)
  return m ? m[1].trim() : ''
}

async function auditUrl(url: string): Promise<Row> {
  const issues: string[] = []
  let status = 0
  let html = ''
  try {
    const res = await fetch(url, { redirect: 'follow' })
    status = res.status
    html = await res.text()
  } catch (e) {
    issues.push(`fetch failed: ${(e as Error).message}`)
  }

  if (status >= 400) issues.push(`HTTP ${status}`)

  const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const description = attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
  const robots = attr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length
  const ldBlocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  let jsonLdValid = true
  for (const b of ldBlocks) {
    try { JSON.parse(b[1]) } catch { jsonLdValid = false }
  }
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  const imagesMissingAlt = imgs.filter((t) => !/\balt=["'][^"']+["']/i.test(t)).length
  const ogComplete = /property=["']og:title["']/i.test(html) && /property=["']og:image["']/i.test(html)

  if (!title) issues.push('missing title')
  else if (title.length < 30 || title.length > 65) issues.push(`title length ${title.length}`)
  if (!description) issues.push('missing meta description')
  else if (description.length < 120 || description.length > 165) issues.push(`description length ${description.length}`)
  if (!canonical) issues.push('missing canonical')
  if (h1Count !== 1) issues.push(`h1 count ${h1Count}`)
  if (!jsonLdValid) issues.push('invalid JSON-LD')
  if (imagesMissingAlt > 0) issues.push(`${imagesMissingAlt} img without alt`)
  if (!ogComplete) issues.push('incomplete Open Graph')

  return {
    url, status, title, titleLen: title.length, description, descLen: description.length,
    canonical, robots, h1Count, jsonLdCount: ldBlocks.length, jsonLdValid, imagesMissingAlt, ogComplete, issues,
  }
}

async function main() {
  fs.mkdirSync(DOCS, { recursive: true })
  const urls = await getSitemapUrls()
  if (urls.length === 0) {
    console.error(`✖ No sitemap URLs found at ${BASE}. Is the server running?`)
    process.exit(1)
  }
  console.log(`Auditing ${urls.length} URLs from ${BASE}…`)

  const rows: Row[] = []
  for (const url of urls) {
    rows.push(await auditUrl(url))
    process.stdout.write('.')
  }
  process.stdout.write('\n')

  const failing = rows.filter((r) => r.issues.length > 0)
  const csv = [
    'url,status,titleLen,descLen,canonical,h1,jsonLd,imgMissingAlt,ogComplete,issues',
    ...rows.map((r) =>
      [r.url, r.status, r.titleLen, r.descLen, r.canonical ? 'yes' : 'no', r.h1Count, r.jsonLdCount,
       r.imagesMissingAlt, r.ogComplete ? 'yes' : 'no', `"${r.issues.join('; ')}"`].join(',')
    ),
  ].join('\n')
  fs.writeFileSync(path.join(DOCS, 'seo-audit.csv'), csv)

  const md = [
    '# SEO Audit',
    '',
    `Base: ${BASE}`,
    `Generated: ${new Date().toISOString()}`,
    `Pages audited: ${rows.length}`,
    `Pages with issues: ${failing.length}`,
    '',
    '| URL | Status | Title | Desc | Canonical | H1 | JSON-LD | img w/o alt | OG | Issues |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) =>
      `| ${r.url} | ${r.status} | ${r.titleLen} | ${r.descLen} | ${r.canonical ? '✓' : '✗'} | ${r.h1Count} | ${r.jsonLdCount} | ${r.imagesMissingAlt} | ${r.ogComplete ? '✓' : '✗'} | ${r.issues.join('; ') || '—'} |`
    ),
  ].join('\n')
  fs.writeFileSync(path.join(DOCS, 'seo-audit.md'), md)

  console.log(`✔ ${rows.length} pages, ${failing.length} with issues`)
  console.log('  .tmp/reports/seo-audit.md')
  console.log('  .tmp/reports/seo-audit.csv')
  if (failing.length > 0) process.exitCode = 0 // report only; do not fail CI on warnings
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
