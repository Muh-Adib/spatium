import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

/**
 * Lane 5 (QA-CI: Gerbang Kebijakan & Policy Gates) - L5-T3
 * Automated regression test validating §10.2 policy invariants across the codebase:
 * 1. Zero default credentials & revoked hashes
 * 2. Zero synthetic mock data (no Math.random in SEO/GSC, no fake clicks/scores)
 * 3. Zero runtime imports of archived static catalog data (services-data / solutions-data)
 * 4. Zero hardcoded localhost:3000 in MCP production paths
 */

const repoRoot = path.resolve(__dirname, '../..')
const webSrc = path.resolve(__dirname, '../src')
const mcpDir = path.resolve(repoRoot, 'mcp')

function runRg(query: string, searchPaths: string[], extraFlags = ''): string[] {
  try {
    const pathsArg = searchPaths.map((p) => `"${p}"`).join(' ')
    const cmd = `rg -n ${extraFlags} "${query}" ${pathsArg}`
    const output = execSync(cmd, { cwd: repoRoot, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
    return output
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  } catch {
    // ripgrep exits with code 1 if no matches found
    return []
  }
}

describe('L5 Policy Gates (§10.2 Invariants)', () => {
  it('enforces zero default credentials or revoked hash patterns in core & mcp', () => {
    const matches = runRg(
      "password: 'segiatech'|setPassword\\('segiatech'\\)|scrypt:5ad671ad",
      [path.resolve(__dirname, '..'), mcpDir],
      "--glob '!**/node_modules/**' --glob '!**/tests/**' --glob '!docs/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero fake/synthetic data generators in GSC, SEO, and keywords', () => {
    const matches = runRg(
      "Math\\.(random|sin)\\(",
      [
        path.join(webSrc, 'lib/gsc'),
        path.join(webSrc, 'lib/seo'),
        path.join(webSrc, 'lib/db/keywords.ts'),
        mcpDir,
      ],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero fake metrics literals in web/src and mcp', () => {
    const matches = runRg(
      "totalClicks: 4180|job_wp_|performanceScore = 94",
      [webSrc, mcpDir],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero runtime imports of legacy static catalog data', () => {
    const matches = runRg(
      "services-data|solutions-data",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/scripts/**' --glob '!web/archive/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero hardcoded localhost:3000 endpoints in MCP server', () => {
    const matches = runRg(
      "localhost:3000",
      [mcpDir],
      "--glob '!**/node_modules/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero dummy contact numbers (6281234567890) in web/src (L8-T1)', () => {
    const matches = runRg(
      "6281234567890",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero legacy FAQ constants (HOMEPAGE_FAQS|STUDIO_PORTFOLIO_FAQS|SERVICES_FAQS) in web/src (L8-T3)', () => {
    const matches = runRg(
      "HOMEPAGE_FAQS|STUDIO_PORTFOLIO_FAQS|SERVICES_FAQS",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero hardcoded client arrays in ClientLogoSlider (L8-T4)', () => {
    const matches = runRg(
      "const CLIENT_LOGOS",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero static redirect arrays (STATIC_REDIRECTS) in web/src (L8-T7)', () => {
    const matches = runRg(
      "const STATIC_REDIRECTS",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/tests/**' --glob '!web/src/data/**'"
    )
    expect(matches).toEqual([])
  })

  it('enforces zero hardcoded CATEGORY_OPTIONS arrays in web/src (L8-T6)', () => {
    const matches = runRg(
      "const CATEGORY_OPTIONS",
      [webSrc],
      "--glob '!**/node_modules/**' --glob '!web/tests/**'"
    )
    expect(matches).toEqual([])
  })
})
