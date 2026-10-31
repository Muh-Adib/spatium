/**
 * Block Schema Contract (K-2)
 *
 * Defines Zod schemas for all dynamic presentation blocks in UNIMASI WebShift.
 * Used for strict validation of content blocks across service categories,
 * services, solutions, landing pages, and templates.
 */
import { z } from 'zod'

export const BLOCK_SCHEMA_VERSION = 1
export const MAX_BLOCKS_PER_PAGE = 60

// ─── Shared Primitive Types ──────────────────────────────────────────────────
export const safeUrlSchema = z.string().refine(
  (url) => {
    if (!url) return true
    return (
      url.startsWith('/') ||
      url.startsWith('https://') ||
      url.startsWith('http://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('#')
    )
  },
  { message: 'URL harus diawali dengan /, https://, http://, mailto:, tel:, atau #' }
)

export const iconNameSchema = z.string().regex(/^[a-z0-9-]+$/i, {
  message: 'Nama ikon hanya boleh berupa huruf, angka, dan tanda hubung (-)',
})

// ─── 1. Hero Department ───────────────────────────────────────────────────────
export const heroDepartmentBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-department'),
  variant: z.string().optional().default('cinematic'),
  title: z.string().max(300),
  tagline: z.string().max(500).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  keyOutcomes: z
    .array(
      z.object({
        label: z.string().max(100),
        value: z.string().max(100),
      })
    )
    .optional()
    .default([]),
  heroImage: z.string().optional(),
  imageCaption: z.string().max(200).optional(),
  imageBadge: z.string().max(100).optional(),
  windowTitle: z.string().max(200).optional(),
  windowBadge: z.string().max(100).optional(),
  floatingBadges: z
    .array(
      z.object({
        label: z.string().max(100),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  cta: z
    .object({
      label: z.string().max(100).optional(),
      url: safeUrlSchema.optional(),
    })
    .optional(),
})

// ─── 2. Hero Service ──────────────────────────────────────────────────────────
export const heroServiceBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('hero-service'),
    title: z.string().max(300).optional(),
    name: z.string().max(300).optional(),
    subtitle: z.string().max(1000).optional(),
    badge: z.string().max(100).optional(),
    indexNumber: z.string().max(50).optional(),
    categoryBadge: z.string().max(100).optional(),
    categorySlug: z.string().max(100).optional(),
    department: z.string().max(200).optional(),
    headline: z.string().max(300).optional(),
    tagline: z.string().max(500).optional(),
    highlightWord: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    whatsappPrompt: z.string().max(500).optional(),
    deliveryModel: z.string().max(100).optional(),
    timeline: z.string().max(100).optional(),
    technologies: z.array(z.string().max(100)).optional().default([]),
    keyDeliverables: z.array(z.string().max(200)).optional().default([]),
    heroImage: z.string().optional(),
    primaryMedia: z
      .object({
        type: z.string().optional(),
        imageUrl: z.string().optional(),
        altText: z.string().max(300).optional(),
        badgeText: z.string().max(100).optional(),
      })
      .optional(),
    metrics: z
      .array(
        z.object({
          label: z.string().max(100),
          value: z.string().max(100),
          detail: z.string().max(200).optional(),
        })
      )
      .optional()
      .default([]),
    cta: z
      .object({
        primaryLabel: z.string().max(100).optional(),
        primaryUrl: safeUrlSchema.optional(),
        secondaryLabel: z.string().max(100).optional(),
        secondaryUrl: safeUrlSchema.optional(),
      })
      .optional(),
    pricing: z
      .object({
        startingAt: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.title || data.name), {
    message: 'hero-service harus memiliki title atau name',
  })

// ─── 3. Feature Bento Grid ───────────────────────────────────────────────────
export const featureBentoGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('feature-bento-grid'),
  variant: z.string().max(100).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tag: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        icon: z.string().optional(),
        size: z.string().max(50).optional(),
        image: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
      })
    )
    .optional(),
  features: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tag: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        icon: z.string().optional(),
        size: z.string().max(50).optional(),
        image: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
      })
    )
    .optional(),
})

// ─── 4. Tech Stack Chips ─────────────────────────────────────────────────────
export const techStackChipsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('tech-stack-chips'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(500).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  categories: z
    .array(
      z.object({
        category: z.string().max(100),
        technologies: z.array(z.string().max(100)),
      })
    )
    .optional(),
  technologies: z
    .array(
      z.union([
        z.string().max(100),
        z.object({
          name: z.string().max(100),
          category: z.string().max(100).optional(),
        }),
      ])
    )
    .optional(),
})

// ─── 5. Executive Quote Card ─────────────────────────────────────────────────
export const executiveQuoteCardBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('executive-quote-card'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  quote: z.string().max(2000),
  author: z.string().max(150).optional(),
  role: z.string().max(150).optional(),
  company: z.string().max(150).optional(),
  badge: z.string().max(100).optional(),
})

// ─── 6. Engineering Pillars ───────────────────────────────────────────────────
export const engineeringPillarsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('engineering-pillars'),
  variant: z.string().max(100).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  pillars: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        icon: z.string().optional(),
        metric: z.string().max(100).optional(),
        metricLabel: z.string().max(100).optional(),
        points: z.array(z.string().max(200)).optional(),
        badge: z.string().max(100).optional(),
      })
    )
    .optional()
    .default([]),
})

// ─── 7. Workflow Phases ───────────────────────────────────────────────────────
export const workflowPhasesBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('workflow-phases'),
  variant: z.string().optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  phases: z
    .array(
      z.object({
        step: z.string().max(50).optional(),
        phase: z.union([z.string(), z.number()]).optional(),
        title: z.string().max(200).optional(),
        name: z.string().max(200).optional(),
        timeline: z.string().max(100).optional(),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        deliverables: z.array(z.string().max(200)).optional(),
        badge: z.string().max(100).optional(),
      })
    )
    .optional()
    .default([]),
})

// ─── 8. Comparison Matrix ─────────────────────────────────────────────────────
export const comparisonMatrixBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('comparison-matrix'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  traditionalLabel: z.string().max(100).optional(),
  segiaLabel: z.string().max(100).optional(),
  rows: z
    .array(
      z.object({
        aspect: z.string().max(200).optional(),
        feature: z.string().max(200).optional(),
        title: z.string().max(200).optional(),
        desc: z.string().max(2000).optional(),
        traditional: z.string().max(2000),
        segia: z.string().max(2000),
      })
    )
    .optional()
    .default([]),
})

// ─── 9. Architecture Blueprint ────────────────────────────────────────────────
export const architectureBlueprintBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('architecture-blueprint'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  blueprintImage: z.string().optional(),
  image: z.string().optional(),
  imageLabel: z.string().max(200).optional(),
  imageBadge: z.string().max(100).optional(),
  hudTitle: z.string().max(200).optional(),
  hudMetric: z.string().max(100).optional(),
  hudDesc: z.string().max(300).optional(),
  layers: z
    .array(
      z.object({
        name: z.string().max(200).optional(),
        title: z.string().max(200).optional(),
        level: z.string().max(100).optional(),
        badge: z.string().max(100).optional(),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        tech: z.union([z.array(z.string().max(100)), z.string().max(500)]).optional(),
      })
    )
    .optional()
    .default([]),
})

// ─── 10. Client Stats Impact ──────────────────────────────────────────────────
export const clientStatsImpactBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('client-stats-impact'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  stats: z
    .array(
      z.object({
        value: z.string().max(50),
        label: z.string().max(150),
        description: z.string().max(500).optional(),
        detail: z.string().max(500).optional(),
      })
    )
    .optional()
    .default([]),
})

// ─── 11. Deliverables Checklist ───────────────────────────────────────────────
export const deliverablesChecklistBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('deliverables-checklist'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000).optional(),
        desc: z.string().max(2000).optional(),
        included: z.boolean().optional().default(true),
      })
    )
    .optional()
    .default([]),
})

// ─── 12. Interactive Tech Matrix ──────────────────────────────────────────────
export const interactiveTechMatrixBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('interactive-tech-matrix'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  categories: z
    .array(
      z.object({
        name: z.string().max(100),
        badge: z.string().max(100).optional(),
        items: z.array(
          z.union([
            z.string().max(200),
            z.object({
              name: z.string().max(100),
              version: z.string().max(50).optional(),
              purpose: z.string().max(200).optional(),
              badge: z.string().max(50).optional(),
            }),
          ])
        ),
      })
    )
    .optional()
    .default([]),
})

// ─── 13. Department Service List ──────────────────────────────────────────────
export const departmentServiceListBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('department-service-list'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  services: z.array(z.any()).optional(),
})

// ─── 14. Visual Showcase Gallery ──────────────────────────────────────────────
export const visualShowcaseGalleryBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('visual-showcase-gallery'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().max(200).optional(),
        caption: z.string().max(300).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  items: z
    .array(
      z.object({
        title: z.string().max(200),
        category: z.string().max(100).optional(),
        image: z.string().optional(),
        src: z.string().optional(),
        metric: z.string().max(100).optional(),
        desc: z.string().max(2000).optional(),
        description: z.string().max(2000).optional(),
      })
    )
    .optional(),
})

// ─── 15. Media Showcase / Image ───────────────────────────────────────────────
export const mediaShowcaseBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['media-showcase', 'editorial-image', 'image']),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  caption: z.string().max(500).optional(),
  badge: z.string().max(100).optional(),
  src: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  heroImage: z.string().optional(),
  alt: z.string().max(300).optional().default(''),
  altText: z.string().max(300).optional(),
  aspectRatio: z.string().max(50).optional(),
  frameStyle: z.string().max(50).optional(),
  imageLabel: z.string().max(300).optional(),
  windowTitle: z.string().max(300).optional(),
  floatingBadges: z
    .array(
      z.object({
        label: z.string().max(100),
        icon: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

// ─── 16. Portfolio Proof Grid ─────────────────────────────────────────────────
export const portfolioProofGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('portfolio-proof-grid'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  badge: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  portfolios: z.array(z.any()).optional().default([]),
  portfolioIds: z.array(z.any()).optional(),
})

// ─── 17. FAQ Accordion ────────────────────────────────────────────────────────
export const faqAccordionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('faq-accordion'),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  badge: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        question: z.string().max(500),
        answer: z.string().max(5000),
      })
    )
    .optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().max(500),
        answer: z.string().max(5000),
      })
    )
    .optional(),
})

// ─── 18. Studio CTA ───────────────────────────────────────────────────────────
export const studioCtaBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('studio-cta'),
  headline: z.string().max(300).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  buttonText: z.string().max(100).optional(),
  buttonUrl: safeUrlSchema.optional(),
  style: z.string().max(50).optional(),
  badge: z.string().max(100).optional(),
})

// ─── 19. Editorial Paragraph ──────────────────────────────────────────────────
export const editorialParagraphBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('paragraph'),
    content: z.string().max(20000).optional(),
    text: z.string().max(20000).optional(),
    dropCap: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.content || data.text), {
    message: 'paragraph harus memiliki content atau text',
  })

// ─── 20. Editorial Headings ───────────────────────────────────────────────────
export const editorialHeadingBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(['heading2', 'heading3']),
    level: z.union([z.literal(2), z.literal(3)]).optional(),
    content: z.string().max(1000).optional(),
    text: z.string().max(1000).optional(),
    title: z.string().max(1000).optional(),
  })
  .refine((data) => Boolean(data.content || data.text || data.title), {
    message: 'Heading harus memiliki content, text, atau title',
  })

// ─── 21. Portfolio Case Study Blocks (Templates) ──────────────────────────────
export const heroCaseStudyBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('hero-case-study'),
  title: z.string().max(300),
  client: z.string().max(200).optional(),
  year: z.union([z.number(), z.string()]).optional(),
  category: z.string().max(100).optional(),
  summary: z.string().max(2000).optional(),
})

export const caseStudyChapterBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('case-study-chapter'),
  chapterNumber: z.string().max(50).optional(),
  title: z.string().max(300),
  subtitle: z.string().max(300).optional(),
  content: z.string().max(20000),
})

// ─── 22. Dedicated UNIMASI Cinema & Editorial Blocks ─────────────────────────
export const heroCinemaBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('hero-cinema'),
    badge: z.string().max(200).optional(),
    headline: z.string().max(500).optional(),
    title: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    subtitle: z.string().max(1000).optional(),
    description: z.string().max(5000).optional(),
    primaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    secondaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    media: z
      .object({
        type: z.string().optional(),
        src: z.string().optional(),
        poster: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const processTimelineBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('process-timeline'),
    title: z.string().max(500).optional(),
    eyebrow: z.string().max(200).optional(),
    badge: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    steps: z
      .array(
        z
          .object({
            step: z.string().optional(),
            number: z.string().optional(),
            title: z.string().optional(),
            description: z.string().optional(),
            duration: z.string().optional(),
            deliverables: z.array(z.string()).optional(),
          })
          .passthrough()
      )
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const statsTickerBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('stats-ticker'),
    title: z.string().max(500).optional(),
    eyebrow: z.string().max(200).optional(),
    badge: z.string().max(200).optional(),
    metrics: z
      .array(
        z
          .object({
            value: z.string().optional(),
            label: z.string().optional(),
            subtext: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    stats: z.array(z.any()).optional(),
    items: z.array(z.any()).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const interactiveCtaBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('interactive-cta'),
    title: z.string().max(500).optional(),
    headline: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    description: z.string().max(5000).optional(),
    badge: z.string().max(200).optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    secondaryCtaText: z.string().optional(),
    secondaryCtaLink: z.string().optional(),
    primaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    secondaryCta: z
      .object({
        label: z.string().optional(),
        href: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

export const textEditorialBlockSchema = z
  .object({
    id: z.string().optional(),
    type: z.literal('text-editorial'),
    leadText: z.string().max(5000).optional(),
    lead: z.string().max(5000).optional(),
    body: z.string().max(50000).optional(),
    content: z.string().max(50000).optional(),
    columns: z.union([z.number(), z.string()]).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()

// ─── Legacy Strapi Blocks ─────────────────────────────────────────────────────
export const legacyHeroBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.hero'),
  headline: z.string().max(500).optional(),
  description: z.string().max(3000).optional(),
  badge: z.string().max(100).optional(),
  backgroundImage: z.any().optional(),
  cta: z.any().optional(),
})

export const legacyFeatureGridBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.feature-grid'),
  title: z.string().max(300).optional(),
  features: z.array(z.any()).optional(),
})

export const legacyRichTextBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.rich-text'),
  body: z.string().max(30000).optional(),
})

export const legacyStatisticsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.statistics'),
}).passthrough()

export const legacyFaqSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.faq-section'),
}).passthrough()

export const legacyTestimonialsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.testimonials'),
}).passthrough()

export const legacyCtaSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.cta-section'),
}).passthrough()

export const legacyProcessBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.process'),
}).passthrough()

export const legacyTechnologyStackBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.technology-stack'),
}).passthrough()

export const legacyVideoSectionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.video-section'),
}).passthrough()

export const legacyLiveEmbedBlockSchema = z.object({
  id: z.string().optional(),
  type: z.literal('blocks.live-embed'),
}).passthrough()

// ─── Discriminated Union of All Blocks ────────────────────────────────────────
export const blockSchema = z.discriminatedUnion('type', [
  heroCinemaBlockSchema,
  processTimelineBlockSchema,
  statsTickerBlockSchema,
  interactiveCtaBlockSchema,
  textEditorialBlockSchema,
  heroDepartmentBlockSchema,
  heroServiceBlockSchema,
  featureBentoGridBlockSchema,
  techStackChipsBlockSchema,
  executiveQuoteCardBlockSchema,
  engineeringPillarsBlockSchema,
  workflowPhasesBlockSchema,
  comparisonMatrixBlockSchema,
  architectureBlueprintBlockSchema,
  clientStatsImpactBlockSchema,
  deliverablesChecklistBlockSchema,
  interactiveTechMatrixBlockSchema,
  departmentServiceListBlockSchema,
  visualShowcaseGalleryBlockSchema,
  mediaShowcaseBlockSchema,
  portfolioProofGridBlockSchema,
  faqAccordionBlockSchema,
  studioCtaBlockSchema,
  editorialParagraphBlockSchema,
  editorialHeadingBlockSchema,
  heroCaseStudyBlockSchema,
  caseStudyChapterBlockSchema,
  legacyHeroBlockSchema,
  legacyFeatureGridBlockSchema,
  legacyRichTextBlockSchema,
  legacyStatisticsBlockSchema,
  legacyFaqSectionBlockSchema,
  legacyTestimonialsBlockSchema,
  legacyCtaSectionBlockSchema,
  legacyProcessBlockSchema,
  legacyTechnologyStackBlockSchema,
  legacyVideoSectionBlockSchema,
  legacyLiveEmbedBlockSchema,
])

export type Block = z.infer<typeof blockSchema>

export const blocksListSchema = z
  .array(blockSchema)
  .max(MAX_BLOCKS_PER_PAGE, `Jumlah blok per halaman tidak boleh melebihi ${MAX_BLOCKS_PER_PAGE}`)

// ─── Block Parser & Validator Helper ──────────────────────────────────────────
export interface ParseBlocksResult {
  ok: boolean
  blocks: Block[]
  issues?: string[]
}

export function parseBlocks(rawInput: unknown): ParseBlocksResult {
  if (!rawInput) {
    return { ok: true, blocks: [] }
  }

  let parsedData: unknown = rawInput
  if (typeof rawInput === 'string') {
    try {
      parsedData = JSON.parse(rawInput)
    } catch (err: any) {
      return { ok: false, blocks: [], issues: [`Invalid JSON string: ${err.message}`] }
    }
  }

  if (!Array.isArray(parsedData)) {
    return { ok: false, blocks: [], issues: ['Blocks payload must be an array'] }
  }

  // Pre-normalize legacy Strapi '__component' to 'type'
  const normalized = parsedData.map((b: any) => {
    if (b && typeof b === 'object' && !b.type && b.__component) {
      return { ...b, type: b.__component }
    }
    return b
  })

  const result = blocksListSchema.safeParse(normalized)
  if (!result.success) {
    const issues = result.error.issues.map(
      (iss) => `[Block ${iss.path.join('.') || 'root'}] ${iss.message}`
    )
    return { ok: false, blocks: [], issues }
  }

  return { ok: true, blocks: result.data }
}
