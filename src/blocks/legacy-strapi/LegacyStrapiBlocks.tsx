import Image from 'next/image'
import Link from 'next/link'
import { normalizeImage } from '@/lib/content/transform'
import { cleanRichHtml } from '@/lib/content/html'
import { sanitizeHtmlContent } from '@/lib/security/sanitize-html'
import { IframeEmbed } from '@/components/ui/IframeEmbed'

/** Renderers for blocks imported from the previous Strapi site (`blocks.*`). Kept so stored content still renders. */
export function HeroBlockComponent({ block }: { block: any }) {
  const bgImg = normalizeImage(block.backgroundImage)
  return (
    <section className="relative overflow-hidden bg-[var(--color-background)] py-24 text-white md:py-32">
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
          <p className="mt-6 max-w-2xl text-body-xl text-[var(--text-dim)]">
            {block.description}
          </p>
        )}
        {block.cta?.primaryUrl && (
          <div className="mt-8 flex gap-4">
            <Link
              href={block.cta.primaryUrl}
              className="btn btn--primary"
            >
              {block.cta.primaryLabel ?? 'Mulai Konsultasi'}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export function FeatureGridBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-[var(--color-background)]">
      <div className="container">
        {block.title && <h2 className="text-display-sm font-bold md:text-display-md">{block.title}</h2>}
        {block.description && <p className="mt-3 max-w-2xl text-body-lg text-[var(--text-muted)]">{block.description}</p>}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {block.items?.map((item: any, i: number) => (
            <div key={i} className="group rounded-2xl border border-border p-6 transition-all hover:border-accent/40 hover:shadow-md">
              <h3 className="text-body-lg font-semibold">{item.title}</h3>
              {item.description && <p className="mt-2 text-body-md text-[var(--text-muted)]">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function RichTextBlockComponent({ block }: { block: any }) {
  const content = typeof block.content === 'string' ? cleanRichHtml(block.content) : ''
  const sanitizedContent = sanitizeHtmlContent(content)
  return (
    <section className="py-16 sm:py-24 bg-[var(--color-background)] text-white border-b border-white/[0.08]">
      <div
        className="container max-w-4xl mx-auto px-4 sm:px-6 prose dark:prose-invert prose-neutral prose-headings:font-display prose-headings:text-white prose-p:text-[var(--text-muted)] prose-p:leading-relaxed prose-a:text-accent hover:prose-a:underline prose-img:rounded-3xl prose-img:border prose-img:border-white/10 prose-img:shadow-2xl prose-img:my-8 prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:text-[var(--text-muted)]"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </section>
  )
}

export function StatisticsBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py-sm border-y border-border bg-[var(--color-surface)]">
      <div className="container grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        {block.stats?.map((stat: any, i: number) => (
          <div key={i}>
            <p className="text-display-lg font-bold text-accent">
              {stat.prefix}{stat.value}{stat.suffix}
            </p>
            <p className="mt-1 text-body-sm font-medium text-[var(--text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProcessBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-[var(--color-background)]">
      <div className="container">
        {block.title && <h2 className="text-display-sm font-bold md:text-display-md">{block.title}</h2>}
        {block.description && <p className="mt-3 max-w-2xl text-body-lg text-[var(--text-muted)]">{block.description}</p>}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {block.steps?.map((step: any, i: number) => (
            <div key={i} className="relative rounded-2xl border border-border p-6">
              <span className="text-display-sm font-bold text-accent">{step.number ?? `0${i + 1}`}</span>
              <h3 className="mt-4 text-body-lg font-semibold">{step.title}</h3>
              {step.description && <p className="mt-2 text-body-sm text-[var(--text-muted)]">{step.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FAQBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py border-t border-border bg-[var(--color-background)]">
      <div className="container max-w-3xl">
        {block.title && <h2 className="text-display-sm font-bold">{block.title}</h2>}
        <div className="mt-8 divide-y divide-border">
          {block.items?.map((item: any, i: number) => (
            <details key={i} className="group py-4">
              <summary className="cursor-pointer text-body-lg font-medium">{item.question}</summary>
              <div
                className="mt-3 text-body-md text-[var(--text-muted)]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(item.answer) }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTABlockComponent({ block }: { block: any }) {
  const cta = block.cta
  return (
    <section className="section-py bg-accent text-[var(--color-primaryForeground)]">
      <div className="container text-center">
        <h2 className="text-display-md font-bold">{cta?.title ?? 'Diskusikan Solusi Digital Anda'}</h2>
        {cta?.description && <p className="mx-auto mt-4 max-w-lg text-body-lg text-[var(--color-primaryForeground)]">{cta.description}</p>}
        {cta?.primaryUrl && (
          <Link href={cta.primaryUrl} className="btn btn--dark mt-8 inline-block">
            {cta.primaryLabel ?? 'Hubungi Kami'}
          </Link>
        )}
      </div>
    </section>
  )
}

export function TestimonialsBlockComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-[var(--color-surface)] text-white">
      <div className="container">
        {block.title && <h2 className="text-center text-display-sm font-bold">{block.title}</h2>}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {block.items?.map((item: any, i: number) => (
            <div key={i} className="rounded-2xl border border-[var(--card-border)] bg-[var(--color-background)] p-6">
              <p className="italic text-[var(--text-muted)]">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-white">{item.author}</p>
              <p className="text-body-xs text-[var(--text-dim)]">{item.role} {item.company && `at ${item.company}`}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function TechnologyStackComponent({ block }: { block: any }) {
  return (
    <section className="section-py bg-[var(--color-background)]">
      <div className="container text-center">
        {block.title && <h2 className="text-display-sm font-bold">{block.title}</h2>}
        {block.description && <p className="mt-2 text-body-md text-[var(--text-muted)]">{block.description}</p>}
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

export function VideoSectionBlockComponent({ block }: { block: any }) {
  const videoUrl = block.videoUrl ?? ''
  return (
    <section className="section-py bg-[var(--color-background)] text-white">
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

export function LiveEmbedBlockComponent({ block }: { block: any }) {
  const embedUrl = block.url ?? block.embedUrl ?? ''
  return (
    <section className="section-py bg-[var(--color-background)]">
      <div className="container max-w-5xl">
        {block.title && (
          <div className="mb-8 text-center">
            <h2 className="text-display-sm md:text-display-md font-bold text-foreground">
              {block.title}
            </h2>
            {block.description && (
              <p className="mt-3 text-body-lg text-[var(--text-muted)] max-w-2xl mx-auto">
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
