import type { CSSProperties, ElementType, ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Element to render. Defaults to a div. */
  as?: ElementType
  variant?: 'up' | 'left' | 'right' | 'scale'
  /** Stagger delay in milliseconds. */
  delay?: number
  className?: string
  style?: CSSProperties
  id?: string
}

/**
 * Marks a subtree for the global IntersectionObserver in `useScrollReveal`.
 * Paired with the `[data-reveal]` rules in globals.css.
 */
export function Reveal({ children, as: Tag = 'div', variant = 'up', delay = 0, className, style, id }: RevealProps) {
  const mergedStyle: CSSProperties = delay ? { ...style, ['--reveal-delay' as string]: `${delay}ms` } : { ...style }

  return (
    <Tag data-reveal={variant} className={className} style={mergedStyle} id={id}>
      {children}
    </Tag>
  )
}

export default Reveal
