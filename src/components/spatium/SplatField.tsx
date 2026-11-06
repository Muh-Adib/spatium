'use client'

/**
 * SPATIUM — Gaussian splat field
 *
 * A lightweight Three.js scene that tells the deck's core story in one image:
 * scattered "capture" particles converge into a real-world pavilion, rendered
 * as soft, additive gaussian splats, while a laser-scan plane sweeps through.
 *
 * - Pure ShaderMaterial points (one draw call), no external assets.
 * - Pointer parallax + gentle sway; scroll progress (0–1) disperses the splats.
 * - Reduced motion: renders a single assembled frame, no animation loop.
 * - Fails soft: reports 'failed' so the caller can keep its static backdrop.
 */

import { useEffect, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

export type SplatFieldStatus = 'ready' | 'failed'

type Props = {
  /** 0 → assembled, 1 → fully dispersed (driven by scroll). */
  progressRef?: MutableRefObject<number>
  onStatus?: (status: SplatFieldStatus) => void
  className?: string
}

type Rng = () => number

function mulberry32(seed: number): Rng {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(rng: Rng): number {
  const u = Math.max(rng(), 1e-6)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

type Splat = { p: [number, number, number]; c: [number, number, number]; s: number; a: number }

const COOL: [number, number, number] = [0.62, 0.78, 1.0]
const DEEP: [number, number, number] = [0.2, 0.38, 0.95]
const WHITE: [number, number, number] = [0.92, 0.95, 1.0]
const WARM: [number, number, number] = [1.0, 0.78, 0.5]

/** Builds the pavilion target shape: ground, pool, glass volume, roof, trees. */
function buildPavilion(budget: number, rng: Rng): Splat[] {
  const out: Splat[] = []
  const push = (x: number, y: number, z: number, c: [number, number, number], s: number, a = 1) =>
    out.push({ p: [x, y, z], c, s, a })
  const n = (share: number) => Math.round(budget * share)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  // Ground plane — sparse, dim, wide.
  for (let i = 0; i < n(0.22); i++) {
    const x = lerp(-8, 8, rng())
    const z = lerp(-4.5, 4.5, rng())
    const fade = 1 - Math.min(1, Math.hypot(x / 8, z / 4.5))
    push(x, -1.6 + gauss(rng) * 0.015, z, DEEP, 0.6 + rng() * 0.8, 0.25 + fade * 0.55)
  }

  // Pool — tight, reflective cool splats.
  for (let i = 0; i < n(0.07); i++) {
    push(lerp(-0.5, 5.2, rng()), -1.56, lerp(1.6, 3.6, rng()), COOL, 0.9 + rng() * 1.2, 0.55)
  }

  // Box edges helper.
  const edges = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, count: number, c: typeof WHITE) => {
    const xs = [x0, x1]
    const ys = [y0, y1]
    const zs = [z0, z1]
    const segs: Array<[[number, number, number], [number, number, number]]> = []
    for (const y of ys) for (const z of zs) segs.push([[x0, y, z], [x1, y, z]])
    for (const x of xs) for (const z of zs) segs.push([[x, y0, z], [x, y1, z]])
    for (const x of xs) for (const y of ys) segs.push([[x, y, z0], [x, y, z1]])
    for (let i = 0; i < count; i++) {
      const [a, b] = segs[Math.floor(rng() * segs.length)]
      const t = rng()
      push(
        lerp(a[0], b[0], t) + gauss(rng) * 0.012,
        lerp(a[1], b[1], t) + gauss(rng) * 0.012,
        lerp(a[2], b[2], t) + gauss(rng) * 0.012,
        c,
        0.7 + rng() * 0.7,
        0.95,
      )
    }
  }

  // Ground-floor glass volume: edges + sparse glass faces.
  edges(-3, 3, -1.6, 0.6, -2, 1, n(0.11), WHITE)
  for (let i = 0; i < n(0.09); i++) {
    const face = Math.floor(rng() * 3)
    const x = face === 1 ? (rng() < 0.5 ? -3 : 3) : lerp(-3, 3, rng())
    const z = face === 0 ? 1 : face === 2 ? -2 : lerp(-2, 1, rng())
    push(x, lerp(-1.6, 0.6, rng()), z, COOL, 0.8 + rng(), 0.35)
  }

  // Warm interior light pools.
  for (let i = 0; i < n(0.06); i++) {
    const cx = [-1.8, 0.2, 2][Math.floor(rng() * 3)]
    push(cx + gauss(rng) * 0.7, -0.8 + gauss(rng) * 0.4, -0.5 + gauss(rng) * 0.6, WARM, 1.2 + rng() * 2.6, 0.75)
  }

  // Cantilevered roof slab.
  for (let i = 0; i < n(0.13); i++) {
    const top = rng() < 0.6
    push(lerp(-3.8, 4.4, rng()), top ? 0.85 : 0.62, lerp(-2.5, 1.9, rng()), WHITE, 0.6 + rng() * 0.8, 0.8)
  }

  // Upper volume.
  edges(-2.6, 0.8, 0.85, 2.25, -2.1, 0.3, n(0.07), WHITE)
  for (let i = 0; i < n(0.03); i++) {
    push(lerp(-2.6, 0.8, rng()), lerp(0.85, 2.25, rng()), 0.3, WARM, 1 + rng() * 1.5, 0.35)
  }

  // Pillars.
  for (let i = 0; i < n(0.03); i++) {
    const px = [-3.6, 4.1][Math.floor(rng() * 2)]
    push(px, lerp(-1.6, 0.62, rng()), 1.7, WHITE, 0.7, 0.9)
  }

  // Trees — trunk + gaussian foliage.
  const trees: Array<[number, number, number, number]> = [
    [-5.4, -0.6, 1.1, 1.0],
    [5.8, -1.2, 1.3, 1.2],
    [-6.6, 1.6, 0.8, 0.8],
  ]
  const treeBudget = n(0.21)
  trees.forEach(([tx, tz, r, h], ti) => {
    const per = Math.round(treeBudget / trees.length)
    for (let i = 0; i < per; i++) {
      if (i < per * 0.12) {
        push(tx + gauss(rng) * 0.04, lerp(-1.6, h, rng()), tz + gauss(rng) * 0.04, COOL, 0.7, 0.8)
      } else {
        const cy = h + 0.9 + ti * 0.1
        push(tx + gauss(rng) * r * 0.7, cy + gauss(rng) * r * 0.55, tz + gauss(rng) * r * 0.7, COOL, 0.8 + rng() * 1.8, 0.7)
      }
    }
  })

  return out
}

const VERT = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSeed;
  uniform float uTime;
  uniform float uAssemble;
  uniform float uDisperse;
  uniform float uScan;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vScan;

  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    float t = clamp(uAssemble * 1.6 - aSeed * 0.6, 0.0, 1.0);
    vec3 pos = mix(aStart, position, easeOutCubic(t));

    // Breathing drift so the splats never feel frozen.
    pos += 0.025 * vec3(
      sin(uTime * 0.7 + aSeed * 40.0),
      cos(uTime * 0.6 + aSeed * 23.0),
      sin(uTime * 0.5 + aSeed * 17.0)
    );

    // Scroll-driven dispersal outward and upward.
    vec3 dir = normalize(position + vec3(0.001, 0.6, 0.001));
    pos += dir * uDisperse * (2.0 + aSeed * 6.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (96.0 / -mv.z);

    vScan = smoothstep(0.55, 0.0, abs(position.x - uScan)) * t;
    vColor = aColor;
    vAlpha = aAlpha * mix(0.35, 1.0, t) * (1.0 - uDisperse * 0.7);
  }
`

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vScan;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    float g = exp(-r2 * 18.0);
    vec3 col = vColor + vScan * vec3(0.35, 0.6, 1.0);
    float a = g * (vAlpha * 0.8 + vScan * 0.5);
    gl_FragColor = vec4(col * a, a);
  }
`

export function SplatField({ progressRef, onStatus, className }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const statusRef = useRef(onStatus)
  statusRef.current = onStatus

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 768px)').matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch (error) {
      console.warn('[SplatField] WebGL unavailable, keeping static backdrop.', error)
      statusRef.current?.('failed')
      return
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(pixelRatio)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)

    const rng = mulberry32(20261106)
    const splats = buildPavilion(compact ? 5200 : 10000, rng)
    const count = splats.length

    const position = new Float32Array(count * 3)
    const start = new Float32Array(count * 3)
    const color = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const alpha = new Float32Array(count)
    const seed = new Float32Array(count)

    splats.forEach((s, i) => {
      position.set(s.p, i * 3)
      // Start as a loose capture cloud orbiting the scene.
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      const radius = 9 + rng() * 7
      start.set(
        [radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi) * 0.5, radius * Math.sin(phi) * Math.sin(theta)],
        i * 3,
      )
      color.set(s.c, i * 3)
      size[i] = s.s
      alpha[i] = s.a
      seed[i] = rng()
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

    const uniforms = {
      uTime: { value: 0 },
      uAssemble: { value: reduced ? 1 : 0 },
      uDisperse: { value: 0 },
      uScan: { value: -20 },
      uPixelRatio: { value: pixelRatio },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    const rig = new THREE.Group()
    rig.add(points)
    scene.add(rig)

    const layout = () => {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      const wide = w > 1024
      // Desktop: pavilion sits right of the headline. Mobile: centred, further back.
      camera.position.set(wide ? -4.6 : 0, wide ? 5.2 : 5, wide ? 17.5 : 22)
      // Narrow screens: lift the pavilion into the top third, above the copy.
      camera.lookAt(wide ? -4.6 : 0, wide ? -0.6 : -6.2, 0)
      rig.position.set(wide ? 1.4 : 0, wide ? 0.2 : -1.2, 0)
      camera.updateProjectionMatrix()
    }
    layout()

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
    }

    const resizeObserver = new ResizeObserver(layout)
    resizeObserver.observe(container)

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !reduced && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(container)

    const startedAt = performance.now()
    function tick() {
      raf = 0
      if (!visible) return
      const t = (performance.now() - startedAt) / 1000
      uniforms.uTime.value = t
      uniforms.uAssemble.value = Math.min(1, t / 3.2)
      uniforms.uDisperse.value = THREE.MathUtils.clamp(progressRef?.current ?? 0, 0, 1)
      // Laser sweep every ~7s once assembled.
      uniforms.uScan.value = t > 2.4 ? ((t - 2.4) % 7) * 3.2 - 9 : -20

      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      rig.rotation.y = -0.45 + Math.sin(t * 0.12) * 0.18 + pointer.x * 0.22
      rig.rotation.x = 0.06 + pointer.y * 0.06

      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }

    if (reduced) {
      rig.rotation.set(0.06, -0.45, 0)
      uniforms.uTime.value = 0
      renderer.render(scene, camera)
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true })
      raf = requestAnimationFrame(tick)
    }
    statusRef.current?.('ready')

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointer)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [progressRef])

  return <div ref={mountRef} className={className} aria-hidden="true" />
}

export default SplatField
