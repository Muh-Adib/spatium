import React from 'react'
import type { PageBlock } from '@/lib/content/types'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeImage } from '@/lib/content/transform'
import { cleanWpHtml } from '@/lib/import/transform'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import { IframeEmbed } from '@/components/ui/IframeEmbed'
import {
  HeroDepartmentBlock,
  HeroServiceBlock,
  FeatureBentoGridBlock,
  TechStackChipsBlock,
  ExecutiveQuoteCardBlock,
  EngineeringPillarsBlock,
  WorkflowPhasesBlock,
  PortfolioProofGridBlock,
  FaqAccordionBlock,
  StudioCtaBlock,
  EditorialParagraphBlock,
  EditorialHeadingBlock,
  ComparisonMatrixBlock,
  ArchitectureBlueprintBlock,
  ClientStatsImpactBlock,
  DeliverablesChecklistBlock,
  InteractiveTechMatrixBlock,
  DepartmentServiceListBlock,
  VisualShowcaseGalleryBlock,
  MediaShowcaseBlock,
} from './CatalogBlocks'
import { getAnimationClasses } from '@/lib/blocks/animation'

interface BlockRendererProps {
  blocks?: any[]
  contextData?: {
    portfolios?: any[]
    subServices?: any[]
    services?: any[]
    solutions?: any[]
  }
}

/**
 * AnimatedBlockWrapper wraps rendered blocks with animation transitions,
 * specular ambient chromatic glow, and responsive spacing.
 */
function AnimatedBlockWrapper({ block, children }: { block: any; children: React.ReactNode }) {
  const anim = block?.animation
  const { containerClasses, glowBackdrop, paddingClasses } = getAnimationClasses(anim)

  return (
    <div
      data-block-id={block?.id}
      data-block-type={block?.type}
      className={`relative w-full ${containerClasses} ${paddingClasses ? '' : ''}`}
    >
      {glowBackdrop && (
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
          <div className="w-[700px] h-[380px] rounded-full bg-gradient-to-r from-[#F2C7A0]/[0.08] via-purple-500/[0.05] to-[#F2C7A0]/[0.08] blur-[150px] animate-pulse pointer-events-none" />
        </div>
      )}
      {children}
    </div>
  )
}

function renderBlockContent(block: any, idx: number, contextData?: BlockRendererProps['contextData']) {
  const type = block.type || block.__component

  switch (type) {
    // Catalog & Department Blocks
    case 'hero-department':
      return <HeroDepartmentBlock block={block} />
    case 'hero-service':
      return <HeroServiceBlock block={block} />
    case 'feature-bento-grid':
      return <FeatureBentoGridBlock block={block} />
    case 'tech-stack-chips':
      return <TechStackChipsBlock block={block} />
    case 'executive-quote-card':
      return <ExecutiveQuoteCardBlock block={block} />
    case 'engineering-pillars':
      return <EngineeringPillarsBlock block={block} />
    case 'workflow-phases':
      return <WorkflowPhasesBlock block={block} />
    case 'comparison-matrix':
      return <ComparisonMatrixBlock block={block} />
    case 'architecture-blueprint':
      return <ArchitectureBlueprintBlock block={block} />
    case 'client-stats-impact':
      return <ClientStatsImpactBlock block={block} />
    case 'deliverables-checklist':
      return <DeliverablesChecklistBlock block={block} />
    case 'interactive-tech-matrix':
      return <InteractiveTechMatrixBlock block={block} />
    case 'department-service-list':
      return (
        <DepartmentServiceListBlock
          block={block}
          contextServices={contextData?.subServices || contextData?.services}
        />
      )
    case 'visual-showcase-gallery':
      return <VisualShowcaseGalleryBlock block={block} />
    case 'media-showcase':
    case 'editorial-image':
    case 'image':
      return <MediaShowcaseBlock block={block} />
    case 'portfolio-proof-grid':
      return (
        <PortfolioProofGridBlock
          block={{
            ...block,
            portfolios:
              contextData?.portfolios && contextData.portfolios.length > 0
                ? contextData.portfolios
                : block.portfolios || [],
          }}
        />
      )
    case 'faq-accordion':
      return <FaqAccordionBlock block={block} />
    case 'studio-cta':
      return <StudioCtaBlock block={block} />
    case 'paragraph':
      return <EditorialParagraphBlock block={block} />
    case 'heading2':
    case 'heading3':
      return <EditorialHeadingBlock block={block} />

    // Legacy Strapi Components
    case 'blocks.hero':
      return <HeroBlockComponent block={block} />
    case 'blocks.feature-grid':
      return <FeatureGridBlockComponent block={block} />
    case 'blocks.rich-text':
      return <RichTextBlockComponent block={block} />
    case 'blocks.statistics':
      return <StatisticsBlockComponent block={block} />
    case 'blocks.faq-section':
      return <FAQBlockComponent block={block} />
    case 'blocks.testimonials':
      return <TestimonialsBlockComponent block={block} />
    case 'blocks.cta-section':
      return <CTABlockComponent block={block} />
    case 'blocks.process':
      return <ProcessBlockComponent block={block} />
    case 'blocks.technology-stack':
      return <TechnologyStackComponent block={block} />
    case 'blocks.video-section':
      return <VideoSectionBlockComponent block={block} />
    case 'blocks.live-embed':
      return <LiveEmbedBlockComponent block={block} />
    default:
      return null
  }
}

export function BlockRenderer({ blocks, contextData }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="flex flex-col">
      {blocks.map((block, idx) => {
        const content = renderBlockContent(block, idx, contextData)
        if (!content) return null

        return (
          <AnimatedBlockWrapper key={block.id || idx} block={block}>
            {content}
          </AnimatedBlockWrapper>
        )
      })}
    </div>
  )
}

function HeroBlockComponent({ block }: { block: any }) {
  const bgImg = normalizeImage(block.backgroundImage)
  return (
    <section className="relative overflow-hidden bg-neutral-950 py-24 text-white md:py-32">
      {bgImg && (
        <div className="absolute inset-0 opacity-20">
          <Image src={bgImg.src} alt="" fill className="object-cover" priority />
        </div>
      )}
      <div className="container relative z-10">
        {block.badge && (
          <span className="mb-4 inline-block rounded-full bg-accent-500/20 px-3 py-1 text-body-xs font-medium uppercase tracking-wider text-accent-300">
            {block.badge}
          </span>
        )}
        <h1 className="max-w-4xl text-display-xl font-bold tracking-tight text-white md:text-display-2xl">
          {block.headline}
        </h1>
        {block.description && (
          <p className="mt-6 max-w-2xl text-body-xl text-neutral-400">
            {block.description}
          </p>
        )}
        {block.cta?.primaryUrl && (
          <div className="mt-8 flex gap-4">
            <Link
              href={block.cta.primaryUrl}
              className="rounded-lg bg-accent-500 px-6 py-3.5 text-body-md font-medium text-white transition-colors hover:bg-accent-600"
            >
              {block.cta.primaryLabel ?? 'Mulai Konsultasi'}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function FeatureGridBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-background">
      <div className="container">
        {block.title && <h2 className="text-display-sm font-bold md:text-display-md">{block.title}</h2>}
        {block.description && <p className="mt-3 max-w-2xl text-body-lg text-muted-foreground">{block.description}</p>}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {block.items?.map((item: any, i: number) => (
            <div key={i} className="group rounded-2xl border border-border p-6 transition-all hover:border-accent-400 hover:shadow-soft-md">
              <h3 className="text-body-lg font-semibold">{item.title}</h3>
              {item.description && <p className="mt-2 text-body-md text-muted-foreground">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RichTextBlockComponent({ block }: { block: any }) {
  const content = typeof block.content === 'string' ? cleanWpHtml(block.content) : ''
  const sanitizedContent = sanitizeHtmlContent(content)
  return (
    <section className="py-16 sm:py-24 bg-[#0A0A0A] text-white border-b border-white/[0.08]">
      <div
        className="container max-w-4xl mx-auto px-4 sm:px-6 prose dark:prose-invert prose-neutral prose-headings:font-display prose-headings:text-white prose-p:text-[#DBD7D5] prose-p:leading-relaxed prose-a:text-[#F2C7A0] hover:prose-a:underline prose-img:rounded-3xl prose-img:border prose-img:border-white/10 prose-img:shadow-2xl prose-img:my-8 prose-blockquote:border-l-4 prose-blockquote:border-[#F2C7A0] prose-blockquote:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </section>
  )
}

function StatisticsBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py-sm border-y border-border bg-neutral-50 dark:bg-neutral-900">
      <div className="container grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        {block.stats?.map((stat: any, i: number) => (
          <div key={i}>
            <p className="text-display-lg font-bold text-accent-500">
              {stat.prefix}{stat.value}{stat.suffix}
            </p>
            <p className="mt-1 text-body-sm font-medium text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProcessBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-background">
      <div className="container">
        {block.title && <h2 className="text-display-sm font-bold md:text-display-md">{block.title}</h2>}
        {block.description && <p className="mt-3 max-w-2xl text-body-lg text-muted-foreground">{block.description}</p>}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {block.steps?.map((step: any, i: number) => (
            <div key={i} className="relative rounded-2xl border border-border p-6">
              <span className="text-display-sm font-bold text-accent-400">{step.number ?? `0${i + 1}`}</span>
              <h3 className="mt-4 text-body-lg font-semibold">{step.title}</h3>
              {step.description && <p className="mt-2 text-body-sm text-muted-foreground">{step.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py border-t border-border bg-background">
      <div className="container max-w-3xl">
        {block.title && <h2 className="text-display-sm font-bold">{block.title}</h2>}
        <div className="mt-8 divide-y divide-border">
          {block.items?.map((item: any, i: number) => (
            <details key={i} className="group py-4">
              <summary className="cursor-pointer text-body-lg font-medium">{item.question}</summary>
              <div
                className="mt-3 text-body-md text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.answer) }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABlockComponent({ block }: { block: any }) {
  const cta = block.cta
  return (
    <section className="section-py bg-accent-500 text-white">
      <div className="container text-center">
        <h2 className="text-display-md font-bold">{cta?.title ?? 'Diskusikan Solusi Digital Anda'}</h2>
        {cta?.description && <p className="mx-auto mt-4 max-w-lg text-body-lg text-accent-100">{cta.description}</p>}
        {cta?.primaryUrl && (
          <Link href={cta.primaryUrl} className="mt-8 inline-block rounded-lg bg-white px-8 py-4 font-medium text-accent-700 transition-colors hover:bg-neutral-100">
            {cta.primaryLabel ?? 'Hubungi Kami'}
          </Link>
        )}
      </div>
    </section>
  )
}

function TestimonialsBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-neutral-900 text-white">
      <div className="container">
        {block.title && <h2 className="text-center text-display-sm font-bold">{block.title}</h2>}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {block.items?.map((item: any, i: number) => (
            <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
              <p className="italic text-neutral-300">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-white">{item.author}</p>
              <p className="text-body-xs text-neutral-400">{item.role} {item.company && `at ${item.company}`}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TechnologyStackComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-background">
      <div className="container text-center">
        {block.title && <h2 className="text-display-sm font-bold">{block.title}</h2>}
        {block.description && <p className="mt-2 text-body-md text-muted-foreground">{block.description}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {block.technologies?.map((tech: any, i: number) => {
            const label = typeof tech === 'string' ? tech : (tech?.name || tech?.title || '')
            if (!label) return null
            return (
              <span key={i} className="rounded-lg border border-border px-4 py-2 text-body-sm font-medium">
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function VideoSectionBlockComponent({ block }: { block: any }) {
  const videoUrl = block.videoUrl ?? ''
  return (
    <section className="section-py bg-neutral-950 text-white">
      <div className="container max-w-4xl text-center">
        {block.title && (
          <h2 className="text-display-sm md:text-display-md font-bold mb-8 text-white">
            {block.title}
          </h2>
        )}
        {videoUrl && (
          <IframeEmbed
            url={videoUrl}
            title={block.title ?? 'Video Player'}
            aspectRatio="16/9"
            className="mt-6"
            openExternalLabel="Tonton di Platform Asli"
          />
        )}
      </div>
    </section>
  )
}

function LiveEmbedBlockComponent({ block }: { block: any }) {
  const embedUrl = block.url ?? block.embedUrl ?? ''
  return (
    <section className="section-py bg-background">
      <div className="container max-w-5xl">
        {block.title && (
          <div className="mb-8 text-center">
            <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
              {block.title}
            </h2>
            {block.description && (
              <p className="mt-3 text-body-lg text-muted-foreground max-w-2xl mx-auto">
                {block.description}
              </p>
            )}
          </div>
        )}
        {embedUrl && (
          <IframeEmbed
            url={embedUrl}
            title={block.title ?? 'Live Project Preview'}
            aspectRatio={block.aspectRatio ?? '16/9'}
            openExternalLabel="Buka Live Project"
          />
        )}
      </div>
    </section>
  )
}

