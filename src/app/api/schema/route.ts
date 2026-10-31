import { NextRequest, NextResponse } from 'next/server'
import {
  ContentSeoSchema,
  MediaMetadataSchema,
  CtaPresetSchema,
  KeywordBankItemSchema,
  SiteAuditIssueSchema,
  AnalysisReportSchema,
  PublicationGateResultSchema,
} from '@/lib/seo/schema'
import { requireUser } from '@/lib/auth/rbac'

export async function GET(req: NextRequest) {
  const auth = await requireUser(req)
  if (auth.error) return auth.error
  return NextResponse.json({
    status: 'success',
    version: '4.0.0',
    specification: 'SEGIA Digital Experience Platform - Internal SEO Engine & Media Manager',
    schemas: {
      seo: {
        description: 'Structured SEO data model per locale (Yoast Parity)',
        fields: {
          locale: "enum: 'id' | 'en'",
          translationGroupId: 'string - connects bilingual pairs',
          focusKeyphrase: 'string - 1 primary keyphrase per locale',
          relatedKeyphrases: 'string[] - up to 5 secondary keyphrases',
          seoTitle: 'string - template variables: %title%, %sitename%, %sep%, %category%, %date%',
          metaDescription: 'string - target 120-160 characters',
          slug: 'string - lowercase, hyphens, unique',
          canonicalUrl: 'string | null - default self',
          robots: '{ index: boolean, follow: boolean, maxImagePreview: "none"|"standard"|"large" }',
          openGraph: '{ title, description, image, imageAlt, type, locale }',
          twitter: '{ card, title, description, image, imageAlt }',
          schema: '{ type, properties, faqItems }',
          breadcrumbTitle: 'string',
          isCornerstone: 'boolean',
          primaryCategory: 'string',
          redirects: 'string[]',
          analysis: 'AnalysisReport',
          fieldSource: 'Record<string, "human" | "ai" | "ai-edited">',
          heroVisual: '{ url, altText: { id, en }, decorative, focalPoint: { x, y }, priority }',
        },
      },
      media: {
        description: 'Media Manager item with multilingual alt text and URL tracking',
        fields: {
          id: 'number',
          fileName: 'string (slug-friendly)',
          url: 'string (relative to /public)',
          altText: '{ id: string, en: string } (mandatory before publish)',
          title: 'string (optional)',
          caption: 'string (optional)',
          description: 'string (optional)',
          decorative: 'boolean',
          focalPoint: '{ x: number, y: number }',
          credit: 'string (optional)',
          width: 'number',
          height: 'number',
          size: 'number (bytes)',
          mimeType: 'string',
          usedIn: 'string[] (content URLs using this image)',
        },
      },
      ctaPreset: {
        description: 'Global reusable Call-To-Action preset',
        fields: {
          id: 'number',
          name: 'string',
          slug: 'string',
          locale: "'id' | 'en'",
          content: '{ title, description, primary: { label, href, rel }, secondary, tracking: { eventId, utm } }',
          style: '{ variant: "banner"|"card"|"inline"|"sticky"|"split", bg, text, button, radius, align }',
          placement: '{ mode: "after-paragraph"|"end-of-article"|"sidebar", index }',
          active: 'boolean',
        },
      },
      keywords: {
        description: 'Internal Keyword Bank & GSC Opportunities',
        fields: {
          keyword: 'string',
          locale: "'id' | 'en'",
          intent: "'informational' | 'navigational' | 'transactional' | 'commercial'",
          status: "'planned' | 'in_progress' | 'published' | 'decaying'",
          gscImpressions: 'number',
          gscClicks: 'number',
          gscPosition: 'number',
          priorityScore: 'number (0-100)',
        },
      },
      siteAudit: {
        description: 'Layer 1 In-DB & Layer 2 Live Crawler issues',
        fields: {
          severity: "'critical' | 'warning' | 'info'",
          category: "'meta' | 'images' | 'links' | 'headings' | 'schema' | 'hreflang' | 'redirects' | 'performance'",
          urlOrPath: 'string',
          title: 'string',
          description: 'string',
          recommendation: 'string',
        },
      },
      publicationGate: {
        description: 'Validation gates required to publish content',
        rules: [
          'All images must have alt text for content locale (unless decorative)',
          'Hero/Cover image must have alt text for content locale (unless decorative)',
          'SEO title and meta description must not be empty',
          'URL slug must be unique and valid',
          'AI-generated values must be validated and approved',
        ],
      },
    },
    meta: {
      generatedAt: new Date().toISOString(),
      provider: 'UNIMASI Platform Core',
    },
  })
}
