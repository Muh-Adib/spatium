import React from 'react'
import {
  UnimasiBlockInstance,
  BlockManifestEntry,
} from './contracts'
import { HeroCinemaBlock } from './HeroCinemaBlock'
import { ProcessTimelineBlock } from './ProcessTimelineBlock'
import { StatsTickerBlock } from './StatsTickerBlock'
import { InteractiveCtaBlock, TextEditorialBlock } from './InteractiveCtaBlock'

/**
 * Manifest definitions describing every block for Core CMS & AI Agents.
 */
export const UNIMASI_BLOCK_MANIFEST: BlockManifestEntry[] = [
  {
    type: 'hero-cinema',
    name: 'Hero Cinematic Showcase',
    category: 'hero',
    description: 'Header hero visual besar dengan headline tegas, badge, dan dua tombol CTA aksi.',
    dataSchema: {
      badge: { type: 'string', description: 'Label kecil di atas judul' },
      headline: { type: 'string', required: true, description: 'Judul utama berukuran display-xl' },
      subheadline: { type: 'string', description: 'Deskripsi pengantar' },
      primaryCta: { type: 'object', description: '{ label, href }' },
      secondaryCta: { type: 'object', description: '{ label, href }' },
    },
    settingsSchema: {
      height: ['screen', 'large', 'medium', 'compact'],
      animation: ['reveal-stagger', 'fade-up', 'split-text', 'none'],
      alignment: ['left', 'center'],
      theme: ['dark', 'charcoal'],
    },
    samplePayload: {
      type: 'hero-cinema',
      data: {
        badge: 'Animation Studio',
        headline: 'We make ideas move with iconic CGI.',
        subheadline: '3D animation, photorealistic videotron billboards, and motion design.',
        primaryCta: { label: 'Explore Portfolio', href: '/portfolio' },
        secondaryCta: { label: 'Start Project', href: '/contact' },
      },
      settings: { height: 'screen', animation: 'reveal-stagger', alignment: 'left' },
    },
  },
  {
    type: 'process-timeline',
    name: 'Production Pipeline Timeline',
    category: 'narrative',
    description: 'Diagram timeline tahapan alur kerja produksi studio dengan deliverables detail.',
    dataSchema: {
      eyebrow: { type: 'string' },
      title: { type: 'string', required: true },
      description: { type: 'string' },
      steps: { type: 'array', required: true, description: 'Array of { stepNumber, title, summary, deliverables }' },
    },
    settingsSchema: {
      animation: ['fade-up', 'reveal-stagger', 'none'],
      theme: ['dark', 'accent'],
    },
    samplePayload: {
      type: 'process-timeline',
      data: {
        eyebrow: 'Our Pipeline',
        title: 'How we turn a script into award-winning animation',
        steps: [
          { stepNumber: '01', title: 'Creative Brief', summary: 'Aligning message and narrative.', deliverables: ['Treatment Deck'] },
          { stepNumber: '02', title: 'Storyboarding', summary: 'Shot-by-shot 2D animatics.', deliverables: ['Animatic video'] },
          { stepNumber: '03', title: '3D Modeling & FX', summary: 'High-detail asset texturing.', deliverables: ['Look-dev renders'] },
          { stepNumber: '04', title: 'Mastering', summary: 'Sound design, color grading, multi-format delivery.', deliverables: ['Final 4K Master'] },
        ],
      },
    },
  },
  {
    type: 'stats-ticker',
    name: 'Studio Metrics & Statistics',
    category: 'stats',
    description: 'Grid metrik dan pencapaian numerik untuk membangun kredibilitas (social proof).',
    dataSchema: {
      eyebrow: { type: 'string' },
      title: { type: 'string' },
      metrics: { type: 'array', required: true, description: 'Array of { value, label, detail }' },
    },
    settingsSchema: {
      columns: [2, 3, 4],
      animation: ['fade-up', 'scale-in', 'none'],
    },
    samplePayload: {
      type: 'stats-ticker',
      data: {
        eyebrow: 'Track Record',
        title: 'Delivering results across global markets',
        metrics: [
          { value: '1,140+', label: 'Published Productions', detail: 'Across 12 industries' },
          { value: '60 FPS', label: 'Realtime Pipeline', detail: 'Zero render lag' },
          { value: '100%', label: 'On-Time Delivery', detail: 'Strict studio milestones' },
        ],
      },
      settings: { columns: 3 },
    },
  },
  {
    type: 'interactive-cta',
    name: 'Interactive Call-To-Action Banner',
    category: 'cta',
    description: 'Banner penutup berkonversi tinggi untuk mengarahkan pengunjung ke form inquiry.',
    dataSchema: {
      eyebrow: { type: 'string' },
      headline: { type: 'string', required: true },
      body: { type: 'string' },
      primaryCta: { type: 'object', required: true },
      secondaryCta: { type: 'object' },
    },
    settingsSchema: {
      theme: ['dark', 'accent'],
      animation: ['scale-in', 'fade-up'],
    },
    samplePayload: {
      type: 'interactive-cta',
      data: {
        eyebrow: 'Ready to animate?',
        headline: 'Bring us the brief that is hard to explain.',
        body: 'Send us your vision and we will provide a clear timeline, pipeline recommendation, and cost estimate.',
        primaryCta: { label: 'Start Project Consultation', href: '/contact' },
        secondaryCta: { label: 'Explore Services', href: '/services' },
      },
    },
  },
  {
    type: 'text-editorial',
    name: 'Editorial Text & Aside Note',
    category: 'narrative',
    description: 'Blok narasi editorial dengan dukungan HTML kaya dan catatan samping (aside box).',
    dataSchema: {
      eyebrow: { type: 'string' },
      headline: { type: 'string', required: true },
      contentHtml: { type: 'string', required: true },
      asideNote: { type: 'string' },
    },
    settingsSchema: {
      layout: ['split', 'single'],
      theme: ['dark'],
    },
    samplePayload: {
      type: 'text-editorial',
      data: {
        headline: 'Why animation communicates faster than live action',
        contentHtml: '<p>Complex industrial workflows cannot be easily filmed with a physical camera. CGI eliminates physical constraints, allowing viewers to see inside machinery and microscopic processes.</p>',
      },
      settings: { layout: 'split' },
    },
  },
]

/**
 * Component Registry Map.
 */
export const BLOCK_COMPONENT_REGISTRY: Record<string, React.ComponentType<{ block: any }>> = {
  'hero-cinema': HeroCinemaBlock,
  'process-timeline': ProcessTimelineBlock,
  'stats-ticker': StatsTickerBlock,
  'interactive-cta': InteractiveCtaBlock,
  'text-editorial': TextEditorialBlock,
}
