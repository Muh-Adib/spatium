'use client'

/**
 * "Kinetic Storyboard" — GPU particle morph scene for the UNIMASI hero.
 *
 * Raw three.js (no react-three-fiber). Brand-yellow (#FFD600) particles on a
 * void background morph cube -> sphere -> torus knot. The morph is driven by
 * the hero ScrollTrigger progress (shared ref) plus a slow idle time uniform.
 *
 * Engineering contract (non-negotiable):
 * - Renders NOTHING when the visitor prefers reduced motion (parent keeps the
 *   CSS fallback visible) or when WebGL context creation fails.
 * - Never throws to the parent; every failure path reports 'failed' and tears
 *   down cleanly (geometry, material, renderer, RAF, observers, listeners).
 * - RAF pauses when the document is hidden or the hero leaves the viewport.
 */

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type AnimationWebGLStatus = 'ready' | 'failed'

type QualityTier = 'low' | 'medium' | 'high'

const BRAND_YELLOW = '#FFD600'

const PARTICLE_COUNT: Record<QualityTier, number> = {
  low: 2500,
  medium: 6000,
  high: 12000,
}

/** Particle diameter in world units — fewer particles get slightly larger points. */
const PARTICLE_SIZE: Record<QualityTier, number> = {
  low: 0.02,
  medium: 0.0135,
  high: 0.0115,
}

type Capability = { reduced: boolean; tier: QualityTier }

/** Computed exactly once per mount, on the client only (component is ssr:false). */
function computeCapability(): Capability {
  if (typeof window === 'undefined') {
    return { reduced: false, tier: 'medium' }
  }

  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return { reduced: true, tier: 'low' }

  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const isSmallViewport = window.innerWidth < 768

  if (cores <= 2 || memory <= 2 || isSmallViewport) return { reduced: false, tier: 'low' }
  if (cores >= 8 && memory >= 8) return { reduced: false, tier: 'high' }
  return { reduced: false, tier: 'medium' }
}

/* --------------------------- Target shape buffers --------------------------- */

/** Shape 0 — points scattered just inside the surface of a cube. */
function buildCubePositions(count: number): Float32Array {
  const data = new Float32Array(count * 3)
  const half = 0.95
  for (let i = 0; i < count; i += 1) {
    const face = Math.floor(Math.random() * 6)
    const u = Math.random() * 2 - 1
    const v = Math.random() * 2 - 1
    let x = 0
    let y = 0
    let z = 0
    if (face === 0) {
      x = half
      y = u * half
      z = v * half
    } else if (face === 1) {
      x = -half
      y = u * half
      z = v * half
    } else if (face === 2) {
      y = half
      x = u * half
      z = v * half
    } else if (face === 3) {
      y = -half
      x = u * half
      z = v * half
    } else if (face === 4) {
      z = half
      x = u * half
      y = v * half
    } else {
      z = -half
      x = u * half
      y = v * half
    }
    const jitter = 0.92 + Math.random() * 0.08
    data[i * 3] = x * jitter
    data[i * 3 + 1] = y * jitter
    data[i * 3 + 2] = z * jitter
  }
  return data
}

/** Shape 1 — uniform shell of a sphere (Marsaglia rejection sampling). */
function buildSpherePositions(count: number): Float32Array {
  const data = new Float32Array(count * 3)
  const radius = 1.08
  for (let i = 0; i < count; i += 1) {
    let x = 0
    let y = 0
    let z = 0
    let len = 0
    do {
      x = Math.random() * 2 - 1
      y = Math.random() * 2 - 1
      z = Math.random() * 2 - 1
      len = x * x + y * y + z * z
    } while (len > 1 || len < 1e-6)
    len = Math.sqrt(len)
    const r = radius * (0.98 + Math.random() * 0.04)
    data[i * 3] = (x / len) * r
    data[i * 3 + 1] = (y / len) * r
    data[i * 3 + 2] = (z / len) * r
  }
  return data
}

/** Shape 2 — a (2,3) torus knot with particles scattered inside the tube. */
function buildKnotPositions(count: number): Float32Array {
  const data = new Float32Array(count * 3)
  const p = 2
  const q = 3
  const scale = 0.42
  const tube = 0.17
  for (let i = 0; i < count; i += 1) {
    const t = Math.random() * Math.PI * 2
    const base = 2 + Math.cos(q * t)
    const cx = base * Math.cos(p * t) * scale
    const cy = base * Math.sin(p * t) * scale
    const cz = Math.sin(q * t) * scale * 1.6
    let ox = 0
    let oy = 0
    let oz = 0
    let len = 0
    do {
      ox = Math.random() * 2 - 1
      oy = Math.random() * 2 - 1
      oz = Math.random() * 2 - 1
      len = ox * ox + oy * oy + oz * oz
    } while (len > 1 || len < 1e-6)
    const r = tube * Math.cbrt(Math.random())
    data[i * 3] = cx + ox * r
    data[i * 3 + 1] = cy + oy * r
    data[i * 3 + 2] = cz + oz * r
  }
  return data
}

function buildSeeds(count: number): Float32Array {
  const data = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i += 1) data[i] = Math.random()
  return data
}

/* --------------------------------- Shaders --------------------------------- */

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uScale;

attribute vec3 aSphere;
attribute vec3 aKnot;
attribute vec3 aSeed;

varying float vGlow;
varying float vSeed;

float easeInOut(float t) {
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  // Morph chain: position (cube) -> aSphere -> aKnot. At uMorph = 1 both
  // segments evaluate to aSphere, so the transition stays continuous.
  float m1 = easeInOut(clamp(uMorph, 0.0, 1.0));
  float m2 = easeInOut(clamp(uMorph - 1.0, 0.0, 1.0));
  vec3 pos = mix(position, aSphere, m1);
  pos = mix(pos, aKnot, m2);

  // Slow idle drift so the cloud never reads as frozen.
  float t = uTime * 0.55 + aSeed.x * 6.28318;
  pos += 0.035 * vec3(
    sin(t * 1.35 + aSeed.y * 4.7),
    cos(t * 1.05 + aSeed.z * 4.1),
    sin(t * 0.85 + aSeed.x * 3.3)
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation against the drawing-buffer height.
  float dist = max(-mvPosition.z, 0.001);
  gl_PointSize = clamp(uSize * uScale / dist, 1.0, 9.0);

  vGlow = 0.6 + 0.4 * sin(uTime * 0.9 + aSeed.y * 6.28318);
  vSeed = aSeed.z;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;

varying float vGlow;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.5, 0.05, d);
  float alpha = core * core * uOpacity;
  vec3 color = mix(uColor, vec3(1.0), smoothstep(0.32, 0.0, d) * 0.4);
  gl_FragColor = vec4(color * (0.82 + 0.35 * vGlow * vSeed), alpha);
}
`

/* -------------------------------- Component -------------------------------- */

type AnimationWebGLProps = {
  /** Shared ref carrying the hero scroll progress (0..1) that drives the morph. */
  progressRef?: React.RefObject<number>
  /** Reports 'ready' once the scene is live, or 'failed' on any unrecoverable error. */
  onStatus?: (status: AnimationWebGLStatus) => void
  className?: string
}

export function AnimationWebGL({ progressRef, onStatus, className }: AnimationWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [capability] = useState<Capability>(computeCapability)
  const [failed, setFailed] = useState(false)
  const onStatusRef = useRef(onStatus)

  useEffect(() => {
    onStatusRef.current = onStatus
  }, [onStatus])

  useEffect(() => {
    if (capability.reduced || failed) return undefined
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const { tier } = capability
    let renderer: THREE.WebGLRenderer | null = null
    let geometry: THREE.BufferGeometry | null = null
    let material: THREE.ShaderMaterial | null = null
    let rafId = 0
    let disposed = false
    let running = false
    let inView = true

    const disposeRenderer = () => {
      try {
        renderer?.forceContextLoss()
      } catch {
        // Extension unavailable — dispose() below is enough.
      }
      renderer?.dispose()
    }

    const stopLoop = () => {
      running = false
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const reportFailure = () => {
      if (disposed) return
      disposed = true
      stopLoop()
      setFailed(true)
      onStatusRef.current?.('failed')
    }

    try {
      // Probe the context ourselves first: when WebGL is unavailable,
      // canvas.getContext returns null and letting THREE.WebGLRenderer
      // discover it logs its own internal console.error before we could
      // fall back — keep the degradation fully silent.
      const glContext =
        canvas.getContext('webgl2', { alpha: true, antialias: tier === 'high', powerPreference: 'high-performance' }) ??
        canvas.getContext('webgl', { alpha: true, antialias: tier === 'high', powerPreference: 'high-performance' })
      if (!glContext || typeof glContext.getParameter !== 'function') {
        reportFailure()
        return undefined
      }
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: glContext,
        alpha: true,
        antialias: tier === 'high',
        powerPreference: 'high-performance',
      })
    } catch {
      reportFailure()
      return undefined
    }

    try {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
      camera.position.set(0, 0, 4.2)

      const count = PARTICLE_COUNT[tier]
      geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(buildCubePositions(count), 3))
      geometry.setAttribute('aSphere', new THREE.BufferAttribute(buildSpherePositions(count), 3))
      geometry.setAttribute('aKnot', new THREE.BufferAttribute(buildKnotPositions(count), 3))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(buildSeeds(count), 3))

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: tier === 'low' ? THREE.NormalBlending : THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uSize: { value: PARTICLE_SIZE[tier] },
          uScale: { value: 1 },
          uColor: { value: new THREE.Color(BRAND_YELLOW) },
          uOpacity: { value: tier === 'low' ? 0.8 : 0.9 },
        },
      })

      const group = new THREE.Group()
      group.add(new THREE.Points(geometry, material))
      group.rotation.x = 0.18
      scene.add(group)

      const resize = () => {
        const host = canvas.parentElement
        if (!host) return
        const width = host.clientWidth
        const height = host.clientHeight
        if (width === 0 || height === 0) return
        renderer?.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        if (material && renderer) {
          const bufferHeight = height * renderer.getPixelRatio()
          material.uniforms.uScale.value =
            (bufferHeight * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))
        }
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas.parentElement ?? canvas)
      resize()

      const clock = new THREE.Clock()
      let morph = 0

      const tick = () => {
        if (!running || disposed) return
        const delta = Math.min(clock.getDelta(), 0.05)
        const time = clock.elapsedTime

        if (material) {
          material.uniforms.uTime.value = time
          const scrollMorph = (progressRef?.current ?? 0) * 2
          const idle = Math.sin(time * 0.16) * 0.045
          morph += (scrollMorph + idle - morph) * Math.min(1, delta * 3.5)
          material.uniforms.uMorph.value = THREE.MathUtils.clamp(morph, 0, 2)
        }
        group.rotation.y += delta * 0.055

        renderer?.render(scene, camera)
        rafId = requestAnimationFrame(tick)
      }

      const startLoop = () => {
        if (running || disposed || !inView || document.hidden) return
        running = true
        clock.getDelta() // flush the delta accumulated while paused
        rafId = requestAnimationFrame(tick)
      }

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting)
          if (inView) startLoop()
          else stopLoop()
        },
        { threshold: 0 },
      )
      intersectionObserver.observe(canvas)

      const onVisibilityChange = () => {
        if (document.hidden) stopLoop()
        else startLoop()
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      const onContextLost = (event: Event) => {
        event.preventDefault()
        reportFailure()
      }
      canvas.addEventListener('webglcontextlost', onContextLost)

      onStatusRef.current?.('ready')

      return () => {
        disposed = true
        stopLoop()
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        canvas.removeEventListener('webglcontextlost', onContextLost)
        geometry?.dispose()
        material?.dispose()
        disposeRenderer()
      }
    } catch {
      reportFailure()
      return () => {
        geometry?.dispose()
        material?.dispose()
        disposeRenderer()
      }
    }
  }, [capability, failed, progressRef])

  // Reduced motion or failed WebGL: render nothing so the parent's CSS
  // fallback (hero stage) stays the visible experience.
  if (capability.reduced || failed) return null

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

export default AnimationWebGL
