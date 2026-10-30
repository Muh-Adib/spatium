import { prisma } from '../src/lib/db/prisma'
import { describe, it, expect } from 'vitest'
import { getSiteProfile } from '@/lib/db/siteProfile'
import { getLocations, getLocationBySlug } from '@/lib/db/locations'
import { getActiveThemeTokens, generateCssVariables } from '@/lib/theme/tokens'

describe('White-Label Profile, Theme Tokens & Locations (ADR-0007 / Sprint S3)', () => {
  it('loads site profile with white-label identity from database', async () => {
    const profile = await getSiteProfile()
    const stored = await prisma.orm.public.SiteConfig.where({ id: 1 }).first()
    expect(profile).toBeDefined()
    expect(profile.name).toBe('SegiaTech')
    expect(profile.brandVoice).toBe(stored?.brandVoice || null)
    expect(profile.hqLocation).toBe(stored?.hqLocation || null)
    expect(profile.defaultLocale).toBe('id')
    expect(Array.isArray(profile.targetCities)).toBe(true)
    expect(profile.targetCities).toEqual(stored?.targetCities ? JSON.parse(stored.targetCities) : [])
  })

  it('loads theme tokens and generates valid CSS variables', async () => {
    const tokens = await getActiveThemeTokens()
    expect(tokens).toBeDefined()
    expect(tokens.colors.background).toBeTruthy()
    expect(tokens.colors.accent).toBeTruthy()
    expect(tokens.typography.displayFont).toBeTruthy()

    const cssVars = generateCssVariables(tokens)
    expect(cssVars).toContain(':root')
    expect(cssVars).toContain('--theme-background:')
    expect(cssVars).toContain('--theme-accent:')
    expect(cssVars).toContain('--theme-font-display:')
  })

  it('retrieves locations from database table with zero hardcode', async () => {
    const allLocations = await getLocations()
    expect(allLocations.length).toBeGreaterThanOrEqual(16)

    const jakarta = await getLocationBySlug('jakarta')
    expect(jakarta).toBeDefined()
    expect(jakarta?.name).toBe('Jakarta')
    expect(jakarta?.region).toBe('DKI Jakarta')
    expect(jakarta?.image).toContain('/images/cities/jakarta-1.jpg')

    const jogja = await getLocationBySlug('yogyakarta')
    expect(jogja).toBeDefined()
    expect(jogja?.name).toBe('Yogyakarta')
  })
})
