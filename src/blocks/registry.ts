import React from 'react'
import {
  UnimasiBlockInstance,
  BlockManifestEntry,
} from './contracts'
import { HeroCinemaBlock } from './HeroCinemaBlock'
import { ProcessTimelineBlock } from './ProcessTimelineBlock'
import { StatsTickerBlock } from './StatsTickerBlock'
import { InteractiveCtaBlock, TextEditorialBlock } from './InteractiveCtaBlock'
import {
  HeroPortfolioBlock,
  PortfolioCaseStudyBlock,
  HeroSolutionBlock,
  TableBlock,
  InternalLinksBlock,
} from '@/components/blocks/CatalogBlocks'

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
      media: { type: 'object', description: '{ type: "image" | "video", url, poster, alt }' },
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
    type: 'comparison-matrix',
    name: 'Perbandingan Kualitas UNIMASI Cinema',
    category: 'showcase',
    description: 'Tabel perbandingan visual animasi 3D bioskop vs aset stok konvensional.',
    dataSchema: {
      title: { type: 'string' },
      items: { type: 'array' },
    },
    settingsSchema: {
      theme: ['dark'],
    },
    samplePayload: {
      type: 'comparison-matrix',
      data: {
        title: 'Perbandingan Kualitas: Mengapa Memilih UNIMASI',
      },
    },
  },
  {
    type: 'visual-showcase-gallery',
    name: 'Galeri Showcase 3D Render',
    category: 'showcase',
    description: 'Showcase karya render 3D, turntable karakter, dan videotron billboard.',
    dataSchema: {
      badge: { type: 'string' },
      title: { type: 'string' },
      items: { type: 'array' },
    },
    settingsSchema: {
      theme: ['dark'],
    },
    samplePayload: {
      type: 'visual-showcase-gallery',
      data: {
        badge: 'Karya Nyata UNIMASI',
        title: 'Showcase Produksi Animasi 3D',
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
  {
    type: 'hero-portfolio',
    name: 'Hero Portofolio / Studi Kasus',
    category: 'hero',
    description: 'Header studi kasus animasi dengan klien, tahun, disiplin, video embed, dan poster showcase.',
    dataSchema: {
      title: { type: 'string', required: true },
      client: { type: 'string' },
      year: { type: 'string' },
      category: { type: 'string' },
      summary: { type: 'string' },
      heroImage: { type: 'string' },
      videoUrl: { type: 'string' },
    },
    settingsSchema: {
      theme: ['dark'],
      animation: ['fade-up', 'reveal-stagger'],
    },
    samplePayload: {
      type: 'hero-portfolio',
      data: {
        title: 'Wilmar Replanting Sawit 3D Explainer',
        client: 'Wilmar International',
        year: '2024',
        category: '3D Industrial',
        summary: 'Visualisasi proses mekanisasi penanaman sawit ramah lingkungan berstandar industri internasional.',
        heroImage: '/images/portfolio/wilmar-cover.jpg',
      },
    },
  },
  {
    type: 'portfolio-case-study',
    name: 'Studi Kasus Naratif (Challenge & Solution)',
    category: 'narrative',
    description: 'Grid modular 4 bagian: Challenge, Approach, Creative Solution, dan Result.',
    dataSchema: {
      eyebrow: { type: 'string' },
      title: { type: 'string', required: true },
      challenge: { type: 'string' },
      approach: { type: 'string' },
      solution: { type: 'string' },
      result: { type: 'string' },
    },
    settingsSchema: {
      theme: ['dark', 'charcoal'],
    },
    samplePayload: {
      type: 'portfolio-case-study',
      data: {
        eyebrow: 'Production Case Study',
        title: 'Tantangan, Pendekatan & Solusi Teknis',
        challenge: 'Menjelaskan alur penanaman sawit yang rumit agar mudah dipahami stakeholder non-teknis.',
        approach: 'Menggunakan visual 3D photorealistic dengan cutaway kamera dinamis.',
        solution: 'Pipeline Maya dan Unreal Engine 5 untuk simulasi pencahayaan realistik dan partikel debu.',
        result: 'Meningkatkan pemahaman SOP hingga 92% dan diapresiasi pimpinan korporat.',
      },
    },
  },
  {
    type: 'hero-solution',
    name: 'Hero Solusi Bisnis & Industri',
    category: 'hero',
    description: 'Header solusi dengan badge industri, deskripsi, daftar manfaat utama, dan CTA konsultasi.',
    dataSchema: {
      badge: { type: 'string' },
      title: { type: 'string', required: true },
      shortDescription: { type: 'string' },
      keyBenefits: { type: 'array' },
      primaryCta: { type: 'object' },
    },
    settingsSchema: {
      theme: ['dark'],
    },
    samplePayload: {
      type: 'hero-solution',
      data: {
        badge: 'Enterprise Animation',
        title: 'Solusi Visualisasi 3D untuk Sektor Manufaktur & Industri',
        shortDescription: 'Optimalkan penjelasan mesin berat dan alur pabrik melalui visualisasi CGI 3D fotorealistik presisi.',
        keyBenefits: ['Simulasi akurat tanpa risiko kecelakaan kerja', 'Edukasi operator 3x lebih cepat'],
      },
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
  'hero-portfolio': HeroPortfolioBlock,
  'hero-case-study': HeroPortfolioBlock,
  'portfolio-case-study': PortfolioCaseStudyBlock,
  'hero-solution': HeroSolutionBlock,
  'table': TableBlock,
  'internal-links': InternalLinksBlock,
}
