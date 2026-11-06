import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { projectSectors, type Project } from '@/lib/content/spatium-types'

const SRC = path.resolve(__dirname, '../src')

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'seed' ? [] : sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

describe('zero-mock content (AGENTS.md §3.3)', () => {
  it('no app code imports the seed JSON', () => {
    const offenders = sourceFiles(SRC).filter((file) => /data\/seed/.test(fs.readFileSync(file, 'utf-8')))
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([])
  })

  it('site chrome carries no hardcoded use cases or social handles', () => {
    const site = fs.readFileSync(path.join(SRC, 'data/site.ts'), 'utf-8')
    const config = fs.readFileSync(path.join(SRC, 'config/site.ts'), 'utf-8')
    for (const text of [site, config]) {
      expect(text).not.toMatch(/instagram\.com|linkedin\.com/)
      expect(text).not.toMatch(/\/services\/[a-z]/)
    }
  })
})

describe('projectSectors', () => {
  const project = (slug: string, discipline: string): Project => ({
    slug,
    title: slug,
    category: 'unknown',
    discipline,
    tagline: '',
    brief: '',
    approach: [],
    delivered: [],
    variant: 0,
    blocks: [],
  })

  it('lists only sectors that have published scenes, with counts', () => {
    const sectors = projectSectors([
      project('a', 'Food & Beverage · Exterior'),
      project('b', 'Food & Beverage · Interior'),
      project('c', 'Healthcare'),
      project('d', ''),
    ])
    expect(sectors).toEqual([
      { name: 'Food & Beverage', category: 'fnb', sceneCount: 2 },
      { name: 'Healthcare', category: 'healthcare', sceneCount: 1 },
    ])
  })

  it('returns [] when there are no scenes', () => {
    expect(projectSectors([])).toEqual([])
  })
})
