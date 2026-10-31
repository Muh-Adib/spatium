'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * ClientLogoSlider — Ultra-sleek Compact Floating Logo Marquee
 * 
 * Pembaruan:
 * 1. Menampilkan kembali label "Kolaborasi & Kepercayaan" dalam badge minimalis yang rapi.
 * 2. Tanpa judul besar "Sudah Dipercaya Oleh" dan tanpa garis bawah tebal (tetap ramping & ringkas).
 * 3. Glow saat logo dipencet dibuat sangat rapi, bersih, dan presisi (hanya pada logo yang diklik, tanpa blur berantakan).
 * 4. Tooltip nama perusahaan muncul eksklusif di atas logo yang disentuh/diklik.
 * 5. Infinite scroll 100% mulus + gestur drag interaktif.
 */

export interface ClientLogoItem {
  id: string
  name: string
  src: string
  alt: string
  imgClass?: string
}

export function ClientLogoSlider({ items = [] }: { items?: ClientLogoItem[] }) {
  const logos = items
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const set1Ref = useRef<HTMLDivElement>(null)
  const set2Ref = useRef<HTMLDivElement>(null)

  const [isGrabbing, setIsGrabbing] = useState(false)
  // Store exact clicked instance key so only that specific logo activates
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null)

  // Track pointerdown coordinate to differentiate drag vs click/tap
  const pointerDownPos = useRef({ x: 0, y: 0 })

  // Motion physics ref for 60/120fps RAF loop
  const stateRef = useRef({
    x: 0,
    baseSpeed: 0.85, // px per frame at 60fps
    velocity: 0,
    isDragging: false,
    lastX: 0,
    lastTime: 0,
    singleSetWidth: 0,
  })

  // Measure exact subpixel distance between Set 1 and Set 2 (including gaps)
  const updateDistance = useCallback(() => {
    if (!set1Ref.current || !set2Ref.current) return
    const card1 = set1Ref.current.firstElementChild as HTMLElement | null
    const card2 = set2Ref.current.firstElementChild as HTMLElement | null

    if (card1 && card2) {
      const r1 = card1.getBoundingClientRect()
      const r2 = card2.getBoundingClientRect()
      const dist = r2.left - r1.left
      if (dist > 50) {
        stateRef.current.singleSetWidth = dist
      }
    } else if (set1Ref.current) {
      const gap = trackRef.current
        ? parseFloat(window.getComputedStyle(trackRef.current).columnGap || '32')
        : 32
      stateRef.current.singleSetWidth = set1Ref.current.offsetWidth + gap
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    updateDistance()

    const ro = new ResizeObserver(() => {
      updateDistance()
    })

    if (set1Ref.current) ro.observe(set1Ref.current)
    if (set2Ref.current) ro.observe(set2Ref.current)
    if (containerRef.current) ro.observe(containerRef.current)

    window.addEventListener('resize', updateDistance)

    let animationFrameId: number
    let lastTimestamp = performance.now()

    const animate = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 16.667, 2.0)
      lastTimestamp = timestamp

      const state = stateRef.current
      const width = state.singleSetWidth

      if (!state.isDragging) {
        state.velocity *= 0.94
        if (Math.abs(state.velocity) < 0.05) state.velocity = 0

        // Continuous linear auto-scroll to the left
        state.x -= (state.baseSpeed + state.velocity) * dt
      }

      // Mathematical Seamless Loop (Zero jump)
      if (width > 0) {
        while (state.x <= -width) {
          state.x += width
        }
        while (state.x > 0) {
          state.x -= width
        }
      }

      track.style.transform = `translate3d(${state.x}px, 0, 0)`

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateDistance)
      cancelAnimationFrame(animationFrameId)
    }
  }, [updateDistance])

  // Dismiss popup when clicking outside
  useEffect(() => {
    const handleWindowClick = () => {
      setActiveItemKey(null)
    }
    window.addEventListener('pointerdown', handleWindowClick)
    return () => window.removeEventListener('pointerdown', handleWindowClick)
  }, [])

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return

    const state = stateRef.current
    state.isDragging = true
    state.lastX = e.clientX
    state.lastTime = performance.now()
    state.velocity = 0
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    setIsGrabbing(true)

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // safe fallback
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current
    if (!state.isDragging) return

    const now = performance.now()
    const deltaX = e.clientX - state.lastX
    const timeDelta = Math.max(now - state.lastTime, 1)

    // Direct cursor dragging
    state.x += deltaX
    state.velocity = -(deltaX / timeDelta) * 12

    state.lastX = e.clientX
    state.lastTime = now

    // Keep wrapped during drag
    const width = state.singleSetWidth
    if (width > 0) {
      while (state.x <= -width) {
        state.x += width
      }
      while (state.x > 0) {
        state.x -= width
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = stateRef.current
    state.isDragging = false
    setIsGrabbing(false)

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // safe fallback
    }
  }

  // Handle logo tap/click (only if not dragging)
  const handleLogoTap = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y
    )
    // If movement < 6px, treat as pure click/tap
    if (dist < 6) {
      setActiveItemKey((prev) => (prev === key ? null : key))
    }
  }

  const renderLogoItem = (
    item: ClientLogoItem,
    setKey: string
  ) => {
    const itemKey = `${setKey}-${item.id}`
    const isActive = activeItemKey === itemKey

    return (
      <div
        key={itemKey}
        onClick={(e) => handleLogoTap(e, itemKey)}
        className="group relative flex items-center justify-center shrink-0
                   w-[180px] sm:w-[250px] h-[76px] sm:h-[100px] px-3 cursor-pointer select-none"
      >
        {/* Floating Tooltip Pill showing Company Name only for this clicked logo */}
        {isActive && (
          <div
            aria-live="polite"
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap
                       px-3.5 py-1 rounded-full bg-[#191919]/95 border border-[#2B2B2B] backdrop-blur-md
                       text-[11px] sm:text-xs font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(255, 214, 0,0.15)]
                       flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600] shrink-0" />
            <span>{item.name}</span>
            {/* Arrow pointer */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#191919] border-r border-b border-[#2B2B2B] rotate-45" />
          </div>
        )}

        {/* Clean Logo Image — Glow rapi, terarah & tidak berantakan */}
        <img
          src={item.src}
          alt={item.alt}
          onLoad={updateDistance}
          draggable={false}
          className={`relative z-10 w-auto h-auto max-w-[170px] sm:max-w-[220px] max-h-[64px] sm:max-h-[80px] object-contain transition-all duration-300
                     filter brightness-100 contrast-110 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]
                     pointer-events-none select-none ${item.imgClass || ''} ${
            isActive
              ? 'opacity-100 scale-110 brightness-120 drop-shadow-[0_0_14px_rgba(255, 214, 0,0.35)]'
              : 'opacity-70 group-hover:opacity-100 group-hover:scale-106 group-hover:drop-shadow-[0_0_10px_rgba(255, 214, 0,0.2)]'
          }`}
        />
      </div>
    )
  }

  if (!logos || logos.length === 0) {
    return null
  }

  return (
    <section
      className="relative overflow-hidden border-b border-white/10 py-6 sm:py-8 select-none"
      style={{ background: 'linear-gradient(180deg, #000000 0%, #0C0C0C 100%)' }}
      aria-label="Klien dan institusi yang telah mempercayai UNIMASI"
    >
      {/* ── Section label: Kolaborasi & Kepercayaan (Minimalis & Elegan) ── */}
      <div className="text-center mb-5 px-4 pointer-events-none">
        <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.25em] text-[#FFD600] font-semibold px-3 py-1 rounded-full bg-[#191919] border border-[#2B2B2B] backdrop-blur-sm shadow-[0_0_12px_rgba(255, 214, 0,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]" />
          Kolaborasi &amp; Kepercayaan
        </span>
      </div>

      {/* ── Left fade mask ── */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-24 sm:w-44 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #000000 15%, rgba(0, 0, 0, 0.7) 60%, transparent 100%)',
        }}
      />

      {/* ── Right fade mask ── */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-24 sm:w-44 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #0C0C0C 15%, rgba(12, 12, 12, 0.8) 60%, transparent 100%)',
        }}
      />

      {/* ── Interactive Draggable Container ── */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative overflow-hidden touch-pan-y py-6 ${
          isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Track containing 4 identical sets */}
        <div
          ref={trackRef}
          className="flex gap-8 sm:gap-12 w-max items-center py-2"
          style={{ willChange: 'transform' }}
        >
          {/* Set 1 — Primary Reference */}
          <div ref={set1Ref} className="flex gap-8 sm:gap-12 shrink-0 items-center h-[76px] sm:h-[100px]">
            {logos.map((item) => renderLogoItem(item, 'set1'))}
          </div>

          {/* Set 2 — Secondary Reference for subpixel measurement */}
          <div ref={set2Ref} className="flex gap-8 sm:gap-12 shrink-0 items-center h-[76px] sm:h-[100px]" aria-hidden="true">
            {logos.map((item) => renderLogoItem(item, 'set2'))}
          </div>

          {/* Set 3 — Extended buffer */}
          <div className="flex gap-8 sm:gap-12 shrink-0 items-center h-[76px] sm:h-[100px]" aria-hidden="true">
            {logos.map((item) => renderLogoItem(item, 'set3'))}
          </div>

          {/* Set 4 — Extended buffer for ultrawide screens */}
          <div className="flex gap-8 sm:gap-12 shrink-0 items-center h-[76px] sm:h-[100px]" aria-hidden="true">
            {logos.map((item) => renderLogoItem(item, 'set4'))}
          </div>
        </div>
      </div>
    </section>
  )
}
