import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import crypto from 'node:crypto'

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'tests') {
        getAllFiles(fullPath, fileList)
      }
    } else {
      fileList.push(fullPath)
    }
  }
  return fileList
}

describe('L0 Policy: Zero Default Credentials & Secrets (tests/no-default-credentials.test.ts)', () => {
  const rootDir = path.resolve(__dirname, '../../')
  const webSrcDir = path.resolve(rootDir, 'web/src')
  const webScriptsDir = path.resolve(rootDir, 'web/scripts')
  const mcpDir = path.resolve(rootDir, 'mcp')

  it('(a) Ensures no prohibited credential or secret literal patterns in codebase', () => {
    const targetDirs = [webSrcDir, webScriptsDir, mcpDir]
    const filesToScan: string[] = []
    for (const d of targetDirs) {
      getAllFiles(d, filesToScan)
    }

    const prohibitedPatterns = [
      /password:\s*['"]segiatech['"]/i,
      /setPassword\(\s*['"]segiatech['"]\s*\)/i,
      /scrypt:5ad671ad137562aff501c4b61cc68a4a:/,
      /webshift-sync-secret-key-2026/,
      /segia_sync_secret_production_2026/,
      /unimasi_sync_secret_2026/,
      /unicam_sync_secret_2026/,
      /erfo_sync_secret_2026/,
      /pundsae_sync_secret_2026/,
      /itokoh_sync_secret_2026/,
      /itskes_sync_secret_2026/,
      /kalasan_sync_secret_2026/,
      /kit_sync_secret_2026/,
      /yspi_sync_secret_2026/,
    ]

    const violations: Array<{ file: string; match: string }> = []

    for (const file of filesToScan) {
      if (!file.match(/\.(ts|tsx|js|jsx|json)$/)) continue
      const content = fs.readFileSync(file, 'utf-8')
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(rootDir, file),
            match: pattern.toString(),
          })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('(b) Verifies no scrypt hash in codebase matches common/default passwords', () => {
    const targetDirs = [webSrcDir, webScriptsDir, mcpDir]
    const filesToScan: string[] = []
    for (const d of targetDirs) {
      getAllFiles(d, filesToScan)
    }

    const scryptRegex = /scrypt:([a-f0-9]+):([a-f0-9]+)/g
    const commonPasswords = ['segiatech', 'admin123', 'password', 'admin', 'segia', '123456']
    const matchedHashes: Array<{ file: string; password: string; hash: string }> = []

    for (const file of filesToScan) {
      if (!file.match(/\.(ts|tsx|js|jsx|json)$/)) continue
      const content = fs.readFileSync(file, 'utf-8')
      let match: RegExpExecArray | null

      while ((match = scryptRegex.exec(content)) !== null) {
        const fullHash = match[0]
        const [, saltHex, keyHex] = fullHash.split(':')
        const expectedKey = Buffer.from(keyHex, 'hex')

        for (const pw of commonPasswords) {
          const derived = crypto.scryptSync(pw, saltHex, expectedKey.length, { N: 16384, r: 8, p: 1 })
          if (crypto.timingSafeEqual(derived, expectedKey)) {
            matchedHashes.push({
              file: path.relative(rootDir, file),
              password: pw,
              hash: fullHash,
            })
          }
        }
      }
    }

    expect(matchedHashes).toEqual([])
  })

  it('(c) Ensures no signIn calls with hardcoded literal passwords', () => {
    const filesToScan: string[] = []
    getAllFiles(webSrcDir, filesToScan)

    const signInLiteralRegex = /signIn\s*\(\s*['"]credentials['"]\s*,\s*\{[\s\S]*?password:\s*['"][^'"]+['"]/
    const violations: string[] = []

    for (const file of filesToScan) {
      if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue
      const content = fs.readFileSync(file, 'utf-8')
      if (signInLiteralRegex.test(content)) {
        violations.push(path.relative(rootDir, file))
      }
    }

    expect(violations).toEqual([])
  })
})
