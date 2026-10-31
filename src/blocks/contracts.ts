/**
 * UNIMASI Dynamic Block Element Contracts (Server-Driven UI)
 *
 * Each block has:
 * - `type`: Unique identifier string
 * - `name`: Human-readable label for Admin Studio / Agent
 * - `category`: Grouping (hero, narrative, showcase, stats, cta)
 * - `data`: Content payload (headlines, text, media, arrays)
 * - `settings`: Visual parameters (animations, sizing, themes, alignments)
 */

export type BlockAnimationPreset =
  | 'none'
  | 'fade-up'
  | 'reveal-stagger'
  | 'split-text'
  | 'scale-in'

export type BlockTheme = 'dark' | 'light' | 'accent' | 'charcoal'
export type BlockSize = 'screen' | 'large' | 'medium' | 'compact'

export interface BaseBlockMeta {
  type: string
  name: string
  category: 'hero' | 'narrative' | 'showcase' | 'stats' | 'cta'
  description: string
}

// 1. Hero Cinema Block
export interface HeroCinemaBlockInstance {
  id?: string
  type: 'hero-cinema'
  data: {
    badge?: string
    headline: string
    subheadline?: string
    primaryCta?: { label: string; href: string }
    secondaryCta?: { label: string; href: string }
    mediaUrl?: string
    mediaType?: 'image' | 'video'
  }
  settings?: {
    height?: BlockSize
    theme?: BlockTheme
    animation?: BlockAnimationPreset
    alignment?: 'left' | 'center'
  }
}

// 2. Process Timeline Block (Production Pipeline)
export interface ProcessTimelineBlockInstance {
  id?: string
  type: 'process-timeline'
  data: {
    eyebrow?: string
    title: string
    description?: string
    steps: Array<{
      stepNumber: string
      title: string
      summary: string
      deliverables?: string[]
    }>
  }
  settings?: {
    theme?: BlockTheme
    animation?: BlockAnimationPreset
  }
}

// 3. Stats & Metrics Counter Block
export interface StatsTickerBlockInstance {
  id?: string
  type: 'stats-ticker'
  data: {
    eyebrow?: string
    title?: string
    metrics: Array<{
      value: string
      label: string
      detail?: string
    }>
  }
  settings?: {
    theme?: BlockTheme
    animation?: BlockAnimationPreset
    columns?: 2 | 3 | 4
  }
}

// 4. Interactive Call to Action Block
export interface InteractiveCtaBlockInstance {
  id?: string
  type: 'interactive-cta'
  data: {
    eyebrow?: string
    headline: string
    body?: string
    primaryCta: { label: string; href: string }
    secondaryCta?: { label: string; href: string }
    backgroundImageUrl?: string
  }
  settings?: {
    theme?: BlockTheme
    animation?: BlockAnimationPreset
  }
}

// 5. Editorial Narrative Block
export interface TextEditorialBlockInstance {
  id?: string
  type: 'text-editorial'
  data: {
    eyebrow?: string
    headline: string
    contentHtml: string
    asideNote?: string
  }
  settings?: {
    theme?: BlockTheme
    layout?: 'split' | 'single'
    animation?: BlockAnimationPreset
  }
}

export interface GenericUnimasiBlockInstance {
  id?: string
  type: string
  data: Record<string, any>
  settings?: Record<string, any>
}

// Union of all block instances
export type UnimasiBlockInstance =
  | HeroCinemaBlockInstance
  | ProcessTimelineBlockInstance
  | StatsTickerBlockInstance
  | InteractiveCtaBlockInstance
  | TextEditorialBlockInstance
  | GenericUnimasiBlockInstance

/**
 * Manifest Schema describing all available blocks for CMS & AI Agents.
 */
export interface BlockManifestEntry {
  type: string
  name: string
  category: string
  description: string
  dataSchema: Record<string, { type: string; required?: boolean; description?: string }>
  settingsSchema: {
    theme?: BlockTheme[]
    animation?: BlockAnimationPreset[]
    height?: BlockSize[]
    [key: string]: any
  }
  samplePayload: UnimasiBlockInstance
}
