import { prisma } from '../src/lib/db/prisma'
import { describe, it, expect } from 'vitest'
import { generateCssVariables, getActiveThemeTokens, DEFAULT_THEME_TOKENS } from '../src/lib/theme/tokens'
import { getSiteProfile } from '../src/lib/db/siteProfile'
import { getLocations, getLocationBySlug } from '../src/lib/db/locations'

describe('White Label, Theme Tokens & GEO Locations (Sprint S3 / ADR-0007)', () => {
  it('generates valid CSS variable definitions from theme tokens payload', () => {
    const css = generateCssVariables(DEFAULT_THEME_TOKENS)
    expect(css).toContain('--theme-background: #1A1A1A')
    expect(css).toContain('--theme-accent: #F2C7A0')
    expect(css).toContain('--theme-radius: 1rem')
    expect(css).toContain('--theme-font-display:')
  })

  it('retrieves active theme tokens from SQLite database', async () => {
    const tokens = await getActiveThemeTokens()
    expect(tokens).toBeDefined()
    expect(tokens.colors).toBeDefined()
    expect(tokens.colors.background).toBeTruthy()
    expect(tokens.colors.accent).toBeTruthy()
  })

  it('retrieves single-brand site profile from site_configs without hardcoded leaks', async () => {
    const profile = await getSiteProfile()
    const stored = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    expect(profile).toBeDefined()
    expect(profile.name).toBe('SegiaTech')
    expect(profile.defaultLocale).toBe('id')
    expect(profile.brandVoice).toBe(stored?.brandVoice || null)
    expect(profile.hqLocation).toBe(stored?.hqLocation || null)
    expect(profile.revisionGuarantee).toBe(stored?.revisionGuarantee || null)
    expect(Array.isArray(profile.targetCities)).toBe(true)
    expect(profile.targetCities).toEqual(stored?.targetCities ? JSON.parse(stored.targetCities) : [])
  })

  it('retrieves GEO coverage locations from SQLite database', async () => {
    const locs = await getLocations()
    expect(Array.isArray(locs)).toBe(true)
    expect(locs.length).toBeGreaterThanOrEqual(16)

    const jkt = await getLocationBySlug('jakarta')
    expect(jkt).toBeDefined()
    expect(jkt?.name).toBe('Jakarta')
    expect(jkt?.region).toBe('DKI Jakarta')
  })
})
