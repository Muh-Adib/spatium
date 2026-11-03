'use client'

/**
 * "Spatial Studio Viewport" — WebGL Scene for UNIMASI Hero.
 *
 * Built with raw Three.js (no heavy wrapper runtime).
 * Features:
 * - Dynamic 3D dimensional viewport grid with depth coordinates
 * - Spatial particle constellation with Brand Yellow (#FFD600) and Dark Blue (#0F3A79) hues
 * - Interactive camera parallax tracking mouse cursor smoothly
 * - Scroll-driven depth morphing and camera fly-through
 * - Safe memory management, zero-leak disposal, reduced-motion bypass
 */

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type AnimationWebGLStatus = 'ready' | 'failed'

interface AnimationWebGLProps {
  progressRef?: React.MutableRefObject<number>
  onStatus?: (status: AnimationWebGLStatus) => void
}

export function AnimationWebGL({ progressRef, onStatus }: AnimationWebGLProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Check reduced motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      onStatus?.('ready')
      return
    }

    let isDisposed = false
    let animationFrameId: number | null = null

    // 2. Initialize Three.js Scene, Camera, Renderer
    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null

    try {
      scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x060a17, 0.035)

      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
      camera.position.set(0, 0, 14)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace

      container.appendChild(renderer.domElement)
    } catch (e) {
      console.warn('[WebGL] Initialization failed, falling back to CSS stage', e)
      onStatus?.('failed')
      return
    }

    // 3. Construct 3D Elements

    // A. Volumetric Brand Particle Swarm
    const particleCount = 2800
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const scales = new Float32Array(particleCount)

    const colorYellow = new THREE.Color('#FFD600')
    const colorBlue = new THREE.Color('#1E3E77')
    const colorWhite = new THREE.Color('#FFFFFF')

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      // Distributed in cylindrical/spherical field
      const radius = 2.5 + Math.random() * 9.5
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI

      positions[i3] = radius * Math.cos(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * 0.8
      positions[i3 + 2] = radius * Math.cos(phi) * Math.sin(theta)

      const mixVal = Math.random()
      let c = colorBlue
      if (mixVal > 0.65) c = colorYellow
      else if (mixVal > 0.92) c = colorWhite

      colors[i3] = c.r
      colors[i3 + 1] = c.g
      colors[i3 + 2] = c.b

      scales[i] = Math.random() * 0.8 + 0.2
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1))

    // Particle Material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particleSystem)

    // B. Dimensional 3D Wireframe Frame Prisms (Studio Viewport Metaphor)
    const prismGroup = new THREE.Group()

    // Outer framing box (Cinema viewport bounding box)
    const boxGeo = new THREE.BoxGeometry(6.4, 4.0, 1.2)
    const boxEdges = new THREE.EdgesGeometry(boxGeo)
    const boxMat = new THREE.LineBasicMaterial({
      color: 0xffd600,
      transparent: true,
      opacity: 0.35,
    })
    const boxLine = new THREE.LineSegments(boxEdges, boxMat)
    prismGroup.add(boxLine)

    // Inner timeline plane
    const planeGeo = new THREE.PlaneGeometry(5.8, 3.4, 6, 4)
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x0f3a79,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    })
    const planeMesh = new THREE.Mesh(planeGeo, planeMat)
    prismGroup.add(planeMesh)

    // Orbiting camera coordinate indicator rings
    const ringGeo = new THREE.RingGeometry(4.2, 4.22, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.rotation.x = Math.PI / 2.3
    prismGroup.add(ringMesh)

    prismGroup.position.set(2.8, -0.2, 0)
    scene.add(prismGroup)

    // 4. Interactive Pointer Parallax
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handlePointerMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2
      const halfH = window.innerHeight / 2
      targetX = (e.clientX - halfW) / halfW
      targetY = (e.clientY - halfH) / halfH
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // 5. Responsive Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      // Adjust prism position for mobile vs desktop
      if (w < 1000) {
        prismGroup.position.set(0, -0.5, -2)
        prismGroup.scale.set(0.7, 0.7, 0.7)
      } else {
        prismGroup.position.set(3.0, -0.2, 0)
        prismGroup.scale.set(1, 1, 1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // 6. Animation Loop with RAF and lerp
    let clock = new THREE.Clock()

    const animate = () => {
      if (isDisposed) return

      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      // Smooth pointer lerp
      currentX += (targetX - currentX) * 0.05
      currentY += (targetY - currentY) * 0.05

      const scrollProgress = progressRef?.current ?? 0

      // Rotate particle cloud gently
      if (particleSystem) {
        particleSystem.rotation.y = elapsed * 0.04 + currentX * 0.2
        particleSystem.rotation.x = currentY * 0.1
      }

      // Rotate and tilt dimensional prism
      if (prismGroup) {
        prismGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.08 + currentX * 0.35
        prismGroup.rotation.x = Math.cos(elapsed * 0.25) * 0.06 - currentY * 0.25 + scrollProgress * 0.3
        prismGroup.rotation.z = currentX * 0.05

        // Floating pulse
        prismGroup.position.y = -0.2 + Math.sin(elapsed * 0.7) * 0.12
      }

      // Camera parallax
      if (camera) {
        camera.position.x = currentX * 0.6
        camera.position.y = -currentY * 0.4
        camera.position.z = 14 - scrollProgress * 4.0
        camera.lookAt(0, 0, 0)
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    onStatus?.('ready')

    // 7. Cleanup & Resource Disposal
    return () => {
      isDisposed = true
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('resize', handleResize)

      particleGeometry.dispose()
      particleMaterial.dispose()
      boxGeo.dispose()
      boxEdges.dispose()
      boxMat.dispose()
      planeGeo.dispose()
      planeMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()

      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
    }
  }, [progressRef, onStatus])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}

export default AnimationWebGL
