export type AnimationType =
  | 'none'
  | 'fade-up'
  | 'scale-in'
  | 'slide-in'
  | 'blur-reveal'
  | 'glow-pulse'

export type AnimationDuration = 'fast' | 'normal' | 'slow'
export type AnimationDelay = 'none' | 'short' | 'medium' | 'long' | 'stagger'
export type ResponsivePadding = 'compact' | 'normal' | 'spacious'

export interface StudioBlockAnimation {
  type?: AnimationType
  duration?: AnimationDuration
  delay?: AnimationDelay
  immersiveGlow?: boolean
  responsivePadding?: ResponsivePadding
}

/**
 * Returns CSS classes for the given block animation settings.
 */
export function getAnimationClasses(animation?: StudioBlockAnimation): {
  containerClasses: string
  glowBackdrop: boolean
  paddingClasses: string
} {
  if (!animation) {
    return {
      containerClasses: '',
      glowBackdrop: false,
      paddingClasses: '',
    }
  }

  const { type = 'none', duration = 'normal', delay = 'none', immersiveGlow = false, responsivePadding = 'normal' } = animation

  const animClassMap: Record<AnimationType, string> = {
    none: '',
    'fade-up': 'animate-in fade-in slide-in-from-bottom-6',
    'scale-in': 'animate-in fade-in zoom-in-95',
    'slide-in': 'animate-in fade-in slide-in-from-left-6',
    'blur-reveal': 'animate-in fade-in duration-700 backdrop-blur-none',
    'glow-pulse': 'animate-pulse duration-1000',
  }

  const durationMap: Record<AnimationDuration, string> = {
    fast: 'duration-300',
    normal: 'duration-600',
    slow: 'duration-1000',
  }

  const delayMap: Record<AnimationDelay, string> = {
    none: 'delay-0',
    short: 'delay-150',
    medium: 'delay-300',
    long: 'delay-500',
    stagger: 'delay-700',
  }

  const paddingMap: Record<ResponsivePadding, string> = {
    compact: 'py-10 sm:py-14',
    normal: 'py-16 sm:py-24',
    spacious: 'py-24 sm:py-36',
  }

  const containerClasses = [
    type !== 'none' ? animClassMap[type] : '',
    type !== 'none' ? durationMap[duration] : '',
    type !== 'none' ? delayMap[delay] : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    containerClasses,
    glowBackdrop: Boolean(immersiveGlow),
    paddingClasses: paddingMap[responsivePadding] || paddingMap.normal,
  }
}
