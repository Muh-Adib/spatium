import 'server-only'
import { prisma } from '../db/prisma'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  accent: string
  accentForeground: string
  border: string
  muted: string
  mutedForeground: string
}

export interface ThemeTypography {
  displayFont: string
  bodyFont: string
  monoFont: string
}

export interface ThemeTokensPayload {
  colors: ThemeColors
  typography: ThemeTypography
  radius: string
  motion: 'off' | 'subtle' | 'full'
}

export interface ThemeTokensEntity {
  id: number
  name: string
  tokens: ThemeTokensPayload
  active: boolean
  version: number
  createdAt: string | null
  updatedAt: string | null
}

export const DEFAULT_THEME_TOKENS: ThemeTokensPayload = {
  colors: {
    background: '#060A17',
    foreground: '#F8FAFC',
    card: '#0E1A33',
    cardForeground: '#F8FAFC',
    accent: '#FFDE00',
    accentForeground: '#070E1E',
    border: 'rgba(255, 255, 255, 0.08)',
    muted: '#142345',
    mutedForeground: '#94A3B8',
  },
  typography: {
    displayFont: 'var(--font-syne), "Syne", sans-serif',
    bodyFont: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
    monoFont: 'var(--font-dm-mono), "DM Mono", monospace',
  },
  radius: '0.75rem',
  motion: 'full',
}

export function generateCssVariables(tokens: ThemeTokensPayload): string {
  const { colors, typography, radius } = tokens
  return `
    :root {
      --theme-background: ${colors.background};
      --theme-foreground: ${colors.foreground};
      --theme-card: ${colors.card};
      --theme-card-foreground: ${colors.cardForeground};
      --theme-accent: ${colors.accent};
      --theme-accent-foreground: ${colors.accentForeground};
      --theme-border: ${colors.border};
      --theme-muted: ${colors.muted};
      --theme-muted-foreground: ${colors.mutedForeground};
      --theme-radius: ${radius};
      --theme-font-display: ${typography.displayFont};
      --theme-font-body: ${typography.bodyFont};
      --theme-font-mono: ${typography.monoFont};
    }
  `.replace(/\s+/g, ' ').trim()
}

export async function getActiveThemeTokens(): Promise<ThemeTokensPayload> {
  try {
    const row = await prisma.orm.public.ThemeToken
      .where({ active: true })
      .orderBy((t: any) => t.id.desc())
      .first()

    if (row && row.tokens) {
      const parsed = typeof row.tokens === 'string' ? JSON.parse(row.tokens) : row.tokens
      return {
        colors: { ...DEFAULT_THEME_TOKENS.colors, ...parsed.colors },
        typography: { ...DEFAULT_THEME_TOKENS.typography, ...parsed.typography },
        radius: parsed.radius || DEFAULT_THEME_TOKENS.radius,
        motion: parsed.motion || DEFAULT_THEME_TOKENS.motion,
      }
    }
  } catch (err) {
    console.warn('[Theme] Could not query active theme tokens from DB, fallback to default:', err)
  }

  return DEFAULT_THEME_TOKENS
}

export async function getAllThemeTokens(): Promise<ThemeTokensEntity[]> {
  try {
    const rows = await prisma.orm.public.ThemeToken
      .orderBy((t: any) => t.id.desc())
      .all()
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      tokens: typeof row.tokens === 'string' ? JSON.parse(row.tokens) : row.tokens,
      active: Boolean(row.active),
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  } catch {
    return []
  }
}
