import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { toolRegistry } from '../src/lib/agent/registry'
describe('Removed regional page generation', () => {
  it('does not expose regional generation or validation tools', async () => {
    expect(toolRegistry.get('compose_landing_page')).toBeUndefined()
    expect(toolRegistry.get('validate_landing_page')).toBeUndefined()
    await expect(toolRegistry.execute('compose_landing_page', { cityName: 'Example' })).rejects.toThrow('tidak ditemukan')
  })
  it('has no matrix route, generator module or Studio feature component', () => {
    for (const file of ['src/app/api/matrix/generate/route.ts', 'src/lib/pseo/generator.ts', 'src/components/studio/StudioMatrixGenerator.tsx']) expect(fs.existsSync(path.resolve(file))).toBe(false)
  })
})
