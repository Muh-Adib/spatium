import { describe, it, expect } from 'vitest'
import { getNavigationEntries } from '../src/lib/navigation/getNav'

describe('L2-T8 Server-side Navigation from Database', () => {
  it('loads dynamic service categories from SQLite database', async () => {
    const nav = await getNavigationEntries()
    expect(nav).toBeDefined()
    expect(Array.isArray(nav)).toBe(true)

    const layananEntry = nav.find((n) => n.label === 'Layanan')
    expect(layananEntry).toBeDefined()
    expect(layananEntry?.sections).toBeDefined()
    expect(layananEntry?.sections?.length).toBeGreaterThan(0)

    // Verify sections have titles and items
    for (const section of layananEntry?.sections || []) {
      expect(section.title).toBeTruthy()
      expect(Array.isArray(section.items)).toBe(true)
      expect(section.items.length).toBeGreaterThan(0)
      for (const item of section.items) {
        expect(item.label).toBeTruthy()
        expect(item.href).toMatch(/^\/layanan\//)
      }
    }
  })
})
