/**
 * Zero-Mock & Truth Remediation Test Suite (L1-T9)
 *
 * Verifies that no synthetic data generators (Math.random, Math.sin),
 * fake metrics (4180, default PSI 94/98), or fake jobs (job_wp_) exist
 * in production integration paths.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getGscOverview, getGscTopQueries } from '../src/lib/gsc/queries'
import { runPageSpeedAudit } from '../src/lib/seo/pagespeed'
import { getKeywordOpportunities } from '../src/lib/db/keywords'

const ROOT_DIR = path.resolve(__dirname, '..', '..')
const WEB_SRC = path.resolve(__dirname, '..', 'src')
const MCP_DIR = path.join(ROOT_DIR, 'mcp')

function scanFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = []
  if (!fs.existsSync(dir)) return results

  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.next') {
        results = results.concat(scanFiles(fullPath, extensions))
      }
    } else if (extensions.some((ext) => item.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

describe('L1-T9: Zero-Mock & Fake Data Remediation', () => {
  it('should not contain Math.random or Math.sin in lib/gsc, lib/seo, lib/db/keywords, or mcp', () => {
    const targets = [
      path.join(WEB_SRC, 'lib', 'gsc'),
      path.join(WEB_SRC, 'lib', 'seo'),
      path.join(WEB_SRC, 'lib', 'db', 'keywords.ts'),
      MCP_DIR,
    ]

    const filesToScan: string[] = []
    for (const t of targets) {
      if (fs.existsSync(t)) {
        if (fs.statSync(t).isDirectory()) {
          filesToScan.push(...scanFiles(t, ['.ts', '.tsx', '.js', '.jsx']))
        } else {
          filesToScan.push(t)
        }
      }
    }

    const violations: Array<{ file: string; match: string }> = []
    const mathRandomOrSin = /Math\s*\.\s*(random|sin)\s*\(/g

    for (const file of filesToScan) {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(mathRandomOrSin)
      if (matches) {
        violations.push({
          file: path.relative(ROOT_DIR, file),
          match: matches.join(', '),
        })
      }
    }

    expect(violations).toEqual([])
  })

  it('should not contain fake click metrics (4180), fake job IDs (job_wp_), or localhost:3000 in mcp', () => {
    const mcpFiles = scanFiles(MCP_DIR, ['.js', '.json'])
    const violations: Array<{ file: string; pattern: string }> = []

    for (const file of mcpFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      if (content.includes('4180') && !file.endsWith('.test.ts')) {
        violations.push({ file: path.relative(ROOT_DIR, file), pattern: '4180' })
      }
      if (content.includes('job_wp_')) {
        violations.push({ file: path.relative(ROOT_DIR, file), pattern: 'job_wp_' })
      }
      if (content.includes('localhost:3000')) {
        violations.push({ file: path.relative(ROOT_DIR, file), pattern: 'localhost:3000' })
      }
    }

    expect(violations).toEqual([])
  })

  it('should not have hardcoded default scores (performance 94, seo 98, lcp 1850) in pagespeed.ts', () => {
    const pagespeedPath = path.join(WEB_SRC, 'lib', 'seo', 'pagespeed.ts')
    const content = fs.readFileSync(pagespeedPath, 'utf-8')

    expect(content).not.toContain('performanceScore = 94')
    expect(content).not.toContain('seoScore = 98')
    expect(content).not.toContain('lcpMs = 1850')
  })

  it('should return honest notConnected state for GSC when unconfigured', async () => {
    const originalEmail = process.env.GSC_CLIENT_EMAIL
    const originalKey = process.env.GSC_PRIVATE_KEY

    delete process.env.GSC_CLIENT_EMAIL
    delete process.env.GSC_PRIVATE_KEY

    try {
      const overview = await getGscOverview()
      expect(overview.connected).toBe(false)
      if (!overview.connected) {
        expect(overview.reason).toBeDefined()
        expect(overview.howToConnect).toBeDefined()
      }

      const topQueries = await getGscTopQueries(10)
      expect(topQueries.connected).toBe(false)
      if (!topQueries.connected) {
        expect(topQueries.reason).toBeDefined()
        expect(topQueries.howToConnect).toBeDefined()
      }
    } finally {
      if (originalEmail) process.env.GSC_CLIENT_EMAIL = originalEmail
      if (originalKey) process.env.GSC_PRIVATE_KEY = originalKey
    }
  })

  it('should return honest notConnected state for PageSpeed audit when unconfigured', async () => {
    const originalKey = process.env.PAGESPEED_API_KEY
    delete process.env.PAGESPEED_API_KEY

    try {
      const report = await runPageSpeedAudit('https://www.segiatech.com', 'mobile')
      expect(report.connected).toBe(false)
      if (!report.connected) {
        expect(report.reason).toContain('PAGESPEED_API_KEY')
        expect(report.howToConnect).toBeDefined()
      }
    } finally {
      if (originalKey) process.env.PAGESPEED_API_KEY = originalKey
    }
  })

  it('should return empty opportunities array when database has no GSC records without faking pages', async () => {
    const opps = await getKeywordOpportunities('id')
    expect(Array.isArray(opps)).toBe(true)
    for (const opp of opps) {
      expect(opp.query).toBeDefined()
      expect(opp.page).toBeDefined()
    }
  })
})
