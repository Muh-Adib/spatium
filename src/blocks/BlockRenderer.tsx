'use client'

import React from 'react'
import { UnimasiBlockInstance } from './contracts'
import { BLOCK_COMPONENT_REGISTRY } from './registry'

interface BlockRendererProps {
  blocks?: UnimasiBlockInstance[]
  className?: string
}

/**
 * Universal Server-Driven UI Block Renderer
 * Iterates over structured JSON blocks from Core CMS and renders the appropriate React component.
 */
export function BlockRenderer({ blocks, className = '' }: BlockRendererProps) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null
  }

  return (
    <div className={`blocks-container ${className}`}>
      {blocks.map((block, idx) => {
        if (!block) return null
        const blockType = (block as any)?.type || (block as any)?.__component
        const Component = BLOCK_COMPONENT_REGISTRY[blockType]

        if (!Component) {
          console.warn(`[BlockRenderer] Unknown block type: "${blockType}" at index ${idx}`)
          return null
        }

        return <Component key={block.id || `${blockType}-${idx}`} block={block} />
      })}
    </div>
  )
}
