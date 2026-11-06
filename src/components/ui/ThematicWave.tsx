'use client'

import React, { useRef, useEffect } from 'react'

interface ThematicWaveProps {
  className?: string
  variant?: 'hero' | 'full' | 'subtle'
  opacity?: number
  showTopWave?: boolean
  showBottomWave?: boolean
  glassmorphism?: boolean
}

interface WaveLayerConfig {
  amplitude: number
  frequency: number
  speed: number
  secondaryAmplitude: number
  secondaryFrequency: number
  phaseOffset: number
  baseHeightRatio: number
  crestRgba: string
  midRgba: string
  crestLineColor: string
}

const WAVE_LAYERS: WaveLayerConfig[] = [
  {
    // Layer 1: Deep slow rolling base (Subtle Deep Orange & Charcoal)
    amplitude: 26,
    frequency: 0.0016,
    speed: 0.0008,
    secondaryAmplitude: 12,
    secondaryFrequency: 0.0032,
    phaseOffset: 0,
    baseHeightRatio: 0.28,
    crestRgba: 'rgba(77, 139, 255, 0.18)',
    midRgba: 'rgba(12, 12, 12, 0.40)',
    crestLineColor: 'rgba(211, 173, 141, 0.25)',
  },
  {
    // Layer 2: Medium undulating Warm Taupe & Amber wave
    amplitude: 20,
    frequency: 0.0024,
    speed: -0.0012,
    secondaryAmplitude: 10,
    secondaryFrequency: 0.0048,
    phaseOffset: 2.2,
    baseHeightRatio: 0.20,
    crestRgba: 'rgba(178, 146, 121, 0.16)',
    midRgba: 'rgba(145, 118, 100, 0.10)',
    crestLineColor: 'rgba(211, 173, 141, 0.28)',
  },
  {
    // Layer 3: Fast surface subtle luminous crest (Core Orange / Warm Peach)
    amplitude: 15,
    frequency: 0.0034,
    speed: 0.0018,
    secondaryAmplitude: 8,
    secondaryFrequency: 0.0068,
    phaseOffset: 4.5,
    baseHeightRatio: 0.12,
    crestRgba: 'rgba(77, 139, 255, 0.20)',
    midRgba: 'rgba(211, 173, 141, 0.12)',
    crestLineColor: 'rgba(77, 139, 255, 0.35)',
  },
]

function FluidWaveCanvas({
  className = '',
  glassmorphism = false,
}: {
  className?: string
  glassmorphism?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.parentElement.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    let startTime = performance.now()

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime

      ctx.clearRect(0, 0, width, height)

      WAVE_LAYERS.forEach((layer) => {
        // Base Y is anchored organically in the lower 35% of the full section
        const baseY = height * (0.80 - layer.baseHeightRatio)

        ctx.beginPath()
        ctx.moveTo(0, height)

        const step = 6 // 6px step for buttery 60fps
        for (let x = 0; x <= width + step; x += step) {
          const wave1 =
            Math.sin(x * layer.frequency + elapsed * layer.speed + layer.phaseOffset) *
            layer.amplitude
          const wave2 =
            Math.cos(
              x * layer.secondaryFrequency - elapsed * (layer.speed * 1.35) + layer.phaseOffset
            ) * layer.secondaryAmplitude

          const y = baseY + wave1 + wave2

          if (x === 0) {
            ctx.lineTo(0, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()

        // Smooth vertical gradient that fades to complete 0 opacity at top and bottom
        const topY = baseY - layer.amplitude * 2
        const grad = ctx.createLinearGradient(0, topY, 0, height)
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.0)')
        grad.addColorStop(0.25, layer.crestRgba)
        grad.addColorStop(0.65, layer.midRgba)
        grad.addColorStop(1, 'rgba(2, 13, 50, 0.0)')

        ctx.fillStyle = grad
        ctx.fill()

        // Luminous crest stroke line
        if (layer.crestLineColor) {
          ctx.save()
          ctx.beginPath()
          for (let x = 0; x <= width + step; x += step) {
            const wave1 =
              Math.sin(x * layer.frequency + elapsed * layer.speed + layer.phaseOffset) *
              layer.amplitude
            const wave2 =
              Math.cos(
                x * layer.secondaryFrequency -
                  elapsed * (layer.speed * 1.35) +
                  layer.phaseOffset
              ) * layer.secondaryAmplitude
            const y = baseY + wave1 + wave2

            if (x === 0) {
              ctx.moveTo(0, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.strokeStyle = layer.crestLineColor
          ctx.lineWidth = 1.2
          ctx.stroke()
          ctx.restore()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${glassmorphism ? 'backdrop-blur-[10px]' : ''} ${className}`}
      style={{
        display: 'block',
        ...(glassmorphism
          ? {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }
          : {}),
      }}
    />
  )
}

/**
 * ThematicWave Component
 * Renders the signature SPATIUM midnight & electric-blue ambient background.
 * Uses full-bleed multi-harmonic Canvas wave physics with smooth vertical mask-image
 * to ensure 100% seamless, unclipped, organic wave motion.
 */
export function ThematicWave({
  className = '',
  variant = 'hero',
  opacity = 1,
  showTopWave = false,
  showBottomWave = true,
  glassmorphism = false,
}: ThematicWaveProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* --- 1. Structural Black and Deep Charcoal Base Gradient --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2B2B2B] via-[#242424] to-[#2B2B2B]" />

      {/* --- 2. Subtle Warm Taupe & Deep Orange Ambient Glows --- */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 75% 45% at 50% 0%, rgba(77, 139, 255, 0.12), transparent 70%), ' +
            'radial-gradient(ellipse 60% 45% at 85% 55%, rgba(178, 146, 121, 0.08), transparent 60%), ' +
            'radial-gradient(ellipse 60% 45% at 15% 65%, rgba(211, 173, 141, 0.08), transparent 60%), ' +
            'radial-gradient(ellipse 40% 30% at 50% 85%, rgba(12, 12, 12, 0.8), transparent 60%)',
        }}
      />

      {/* --- 3. Subtle Warm Ambient Spotlight --- */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[620px] rounded-full bg-gradient-to-b from-[#4d8bff]/12 via-[#B29279]/08 to-transparent blur-[150px] animate-aurora pointer-events-none" />

      {/* --- 4. Moving Subtle Warm Taupe / Charcoal Mesh Orbs --- */}
      <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tr from-[#4d8bff]/10 via-[#191919]/40 to-transparent blur-[120px] animate-mesh-1" />
      <div className="absolute top-[25%] -right-[12%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-bl from-[#B29279]/08 via-[#242424]/50 to-transparent blur-[130px] animate-mesh-2" />
      <div className="absolute -bottom-[15%] left-[20%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-t from-[#4d8bff]/08 via-[#242424]/60 to-transparent blur-[110px] animate-mesh-1" />

      {/* --- 5. Full-Bleed Organic Fluid Wave Canvas with Smooth Feather Fade --- */}
      {showBottomWave && (
        <div
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            glassmorphism ? 'opacity-90' : 'opacity-85'
          }`}
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 35%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, black 35%, black 88%, transparent 100%)',
          }}
        >
          <FluidWaveCanvas glassmorphism={glassmorphism} />
        </div>
      )}
    </div>
  )
}
