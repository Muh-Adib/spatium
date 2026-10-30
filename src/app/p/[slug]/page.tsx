import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlockRenderer } from '@/blocks/BlockRenderer'
import { UnimasiBlockInstance } from '@/blocks/contracts'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 300 // 5 minutes cache

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ').toUpperCase()} — UNIMASI Studio`,
    description: `Dynamic landing experience rendered via Server-Driven UI block system.`,
  }
}

export default async function DynamicBlockPage({ params }: PageProps) {
  const { slug } = await params

  // Sample Server-Driven UI blocks (as returned by Core CMS Delivery API)
  const blocks: UnimasiBlockInstance[] = [
    {
      type: 'hero-cinema',
      data: {
        badge: 'Iconic 3D Studio',
        headline: 'We engineer CGI animations that command attention.',
        subheadline:
          'From architectural visual effects to anamorphic 3D videotron billboards, our production pipeline brings complex narratives to life.',
        primaryCta: { label: 'Start Project Consultation', href: '/contact' },
        secondaryCta: { label: 'Explore Our Work', href: '/portfolio' },
      },
      settings: {
        height: 'large',
        animation: 'reveal-stagger',
        alignment: 'left',
      },
    },
    {
      type: 'stats-ticker',
      data: {
        eyebrow: 'Proven Scale',
        title: 'Studio metrics that validate precision',
        metrics: [
          { value: '1,140+', label: 'Delivered Projects', detail: 'Across Indonesia & Southeast Asia' },
          { value: '4K/60fps', label: 'Mastering Fidelity', detail: 'Realtime GPU render farm' },
          { value: '100%', label: 'Delivery Guarantee', detail: 'Milestone-based sprints' },
        ],
      },
      settings: {
        columns: 3,
      },
    },
    {
      type: 'process-timeline',
      data: {
        eyebrow: 'Our Methodology',
        title: 'The 4-stage studio production pipeline',
        steps: [
          {
            stepNumber: '01',
            title: 'Brief & Treatment',
            summary: 'Aligning business objectives, core messaging, and tone-of-voice before a single frame is drawn.',
            deliverables: ['Creative Brief', 'Style Frames'],
          },
          {
            stepNumber: '02',
            title: 'Storyboarding & Animatics',
            summary: 'Creating timed 2D animatics with rough audio to lock pacing, camera angles, and transitions.',
            deliverables: ['Full Animatic Deck', 'Voiceover Timing'],
          },
          {
            stepNumber: '03',
            title: '3D Look-Dev & Simulation',
            summary: 'Building custom 3D geometries, materials, lighting, and physics simulations in Blender and Houdini.',
            deliverables: ['Clay Renders', 'Shading Passes'],
          },
          {
            stepNumber: '04',
            title: 'Compositing & Sound Mastering',
            summary: 'Color grading, motion blur passes, sound design, and exporting in multi-display aspect ratios.',
            deliverables: ['DCP/ProRes 4K', 'Social Crops'],
          },
        ],
      },
    },
    {
      type: 'interactive-cta',
      data: {
        eyebrow: 'Start Your Brief',
        headline: 'Bring us the idea that feels impossible to explain.',
        body: 'Our creative directors will review your brief within 24 hours and advise the optimal visual pipeline.',
        primaryCta: { label: 'Schedule Studio Briefing', href: '/contact' },
        secondaryCta: { label: 'Read Journal Articles', href: '/journal' },
      },
    },
  ]

  return (
    <main className="min-h-screen bg-black">
      <BlockRenderer blocks={blocks} />
    </main>
  )
}
