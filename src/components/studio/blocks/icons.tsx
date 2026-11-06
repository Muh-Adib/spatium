import React from 'react'
import { Box, FileText, Image as ImageIcon, LayoutTemplate, Link2, Megaphone, ShieldCheck, Shapes } from 'lucide-react'
import type { BlockCategory } from '@/lib/blocks/catalog'

const ICONS = {
  hero: LayoutTemplate,
  spatial: Box,
  content: FileText,
  media: ImageIcon,
  proof: ShieldCheck,
  conversion: Megaphone,
  navigation: Link2,
} as const

/** Decorative category icon (the label next to it carries the meaning). */
export function CategoryIcon({ category, className = 'h-4 w-4' }: { category: BlockCategory | null; className?: string }) {
  const Icon = category ? ICONS[category] : Shapes
  return <Icon className={className} aria-hidden="true" />
}
