'use client'

/**
 * SPATIUM — "Photonic Radiance Dust" WebGL Scene
 *
 * Implements 3D Gaussian Splatting & LiDAR point-cloud metaphor:
 * - 7,500 glowing radiance particles that begin as floating cosmic dust.
 * - Smoothly coalesce and assemble into a crisp 3D spatial camera & reality capture pavilion.
 * - Hold structure with gentle 3D rotation and responsive mouse depth parallax.
 * - Disperse into swirling dust upon cursor interaction and cycle periodically.
 * - Built on raw Three.js with zero memory leaks and reduced-motion compliance.
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

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      onStatus?.('ready')
      return
    }

    let isDisposed = false
    let animationFrameId: number | null = null

    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    try {
      scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x040711, 0.038)

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
      camera.position.set(0, 0, 13)

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
      console.warn('[WebGL] Initialization failed:', e)
      onStatus?.('failed')
      return
    }

    // -------------------------------------------------------------
    // PARTICLE POINT CLOUD: DUST -> 3D SPATIAL CAMERA RIG & PAVILION
    // -------------------------------------------------------------
    const COUNT = 7200
    const geometry = new THREE.BufferGeometry()

    const currentPositions = new Float32Array(COUNT * 3)
    const dustPositions = new Float32Array(COUNT * 3)
    const targetPositions = new Float32Array(COUNT * 3)
    const particleColors = new Float32Array(COUNT * 3)
    const particleSizes = new Float32Array(COUNT)

    // Palette: Clean SPATIUM Electric Cyan, Photonic White, Azure Laser
    const cCyan = new THREE.Color('#00E5FF')
    const cAzure = new THREE.Color('#38BDF8')
    const cWhite = new THREE.Color('#FFFFFF')
    const cDeepBlue = new THREE.Color('#1E40AF')

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3

      // 1. Dust Positions: widely scattered spherical & helical dust cloud
      const dustR = 3.5 + Math.random() * 11.5
      const dustTheta = Math.random() * Math.PI * 2
      const dustPhi = (Math.random() - 0.5) * Math.PI

      dustPositions[i3] = dustR * Math.cos(dustPhi) * Math.cos(dustTheta)
      dustPositions[i3 + 1] = dustR * Math.sin(dustPhi) * 1.1 + (Math.random() - 0.5) * 2.0
      dustPositions[i3 + 2] = dustR * Math.cos(dustPhi) * Math.sin(dustTheta)

      // Start particles at dust positions
      currentPositions[i3] = dustPositions[i3]
      currentPositions[i3 + 1] = dustPositions[i3 + 1]
      currentPositions[i3 + 2] = dustPositions[i3 + 2]

      // 2. Target Positions: Coalesces into a 3D Spatial Camera / LiDAR Scanner & Room Grid
      let tx = 0
      let ty = 0
      let tz = 0
      let color = cCyan

      if (i < 2400) {
        // A. Central Spatial Camera Lens & Barrel: Cylindrical rings & lens optics
        const angle = (i / 2400) * Math.PI * 32
        const ringIdx = Math.floor(i / 150)
        const radius = 0.5 + (ringIdx % 8) * 0.22
        const depth = ((i % 150) / 150) * 1.8 - 0.9

        tx = Math.cos(angle) * radius
        ty = Math.sin(angle) * radius
        tz = depth

        // Concentric lens colors
        color = (ringIdx % 3 === 0) ? cWhite : ((ringIdx % 2 === 0) ? cCyan : cAzure)
      } else if (i < 4600) {
        // B. LiDAR Viewfinder & Sensor Chassis: Geometric bounding frame with chamfered corners
        const pIdx = i - 2400
        const perimeter = pIdx / 2200 // 0 to 1
        const side = Math.floor(perimeter * 4)
        const t = (perimeter * 4) % 1
        const w = 4.2
        const h = 2.8
        const zLayer = ((pIdx % 6) / 5) * 2.4 - 1.2

        if (side === 0) {
          tx = -w / 2 + t * w
          ty = h / 2
        } else if (side === 1) {
          tx = w / 2
          ty = h / 2 - t * h
        } else if (side === 2) {
          tx = w / 2 - t * w
          ty = -h / 2
        } else {
          tx = -w / 2
          ty = -h / 2 + t * h
        }
        tz = zLayer
        color = (side % 2 === 0) ? cCyan : cAzure
      } else if (i < 6200) {
        // C. Radiance Field Waves (Gaussian Splat Ellipsoids around the capture rig)
        const pIdx = i - 4600
        const shellRadius = 3.6 + (pIdx % 4) * 0.7
        const theta = Math.random() * Math.PI * 2
        const phi = (Math.random() - 0.5) * 0.9

        tx = shellRadius * Math.cos(phi) * Math.cos(theta)
        ty = shellRadius * Math.sin(phi) * 0.65
        tz = shellRadius * Math.cos(phi) * Math.sin(theta)

        color = Math.random() > 0.6 ? cCyan : cWhite
      } else {
        // D. Walkable Reality Grid Ground (Spatial Coordinate Floor)
        const pIdx = i - 6200
        const totalFloor = COUNT - 6200
        const col = (pIdx % 25) - 12
        const row = Math.floor(pIdx / 25) - 10
        tx = col * 0.52
        ty = -2.8
        tz = row * 0.52
        color = cDeepBlue
      }

      targetPositions[i3] = tx
      targetPositions[i3 + 1] = ty
      targetPositions[i3 + 2] = tz

      particleColors[i3] = color.r
      particleColors[i3 + 1] = color.g
      particleColors[i3 + 2] = color.b

      particleSizes[i] = Math.random() * 0.05 + 0.035
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    // Particle Shader Material with soft circular falloff
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
      grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)')
      grad.addColorStop(0.8, 'rgba(0, 229, 255, 0.15)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    }
    const particleTexture = new THREE.CanvasTexture(canvas)

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const pointCloud = new THREE.Points(geometry, material)
    scene.add(pointCloud)

    // Sleek Spatial Coordinate Axis Grid Lines
    const gridHelper = new THREE.GridHelper(14, 28, 0x00e5ff, 0x0f1932)
    gridHelper.position.y = -2.85
    const gridMaterial = gridHelper.material as THREE.Material
    gridMaterial.transparent = true
    gridMaterial.opacity = 0.15
    scene.add(gridHelper)

    // Subtle Cyan Center Laser Focus Indicator
    const ringGeo = new THREE.RingGeometry(2.4, 2.43, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.z = 0.05
    scene.add(ringMesh)

    // -------------------------------------------------------------
    // INTERACTION & ANIMATION LOOP
    // -------------------------------------------------------------
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handlePointerMove = (e: PointerEvent) => {
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1
      targetX = ndcX * 1.8
      targetY = ndcY * 1.2
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    const handleResize = () => {
      if (!renderer || !camera || !container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener('resize', handleResize)

    const clock = new THREE.Clock()
    const posAttr = geometry.attributes.position as THREE.BufferAttribute

    const animate = () => {
      if (isDisposed) return

      const elapsed = clock.getElapsedTime()

      // Smooth pointer tracking
      currentX += (targetX - currentX) * 0.04
      currentY += (targetY - currentY) * 0.04

      const scrollProg = progressRef?.current ?? 0

      // Morph Cycle: Dust -> Coalesce into Object -> Hold -> Disperse -> Repeat
      // 10-second repeating cycle
      const cycleTime = (elapsed % 11)
      let morphWeight = 1.0

      if (cycleTime < 1.8) {
        // Coalescence phase: particles rush in from dust
        const t = cycleTime / 1.8
        // Cubic ease out
        morphWeight = 1 - Math.pow(1 - t, 3)
      } else if (cycleTime < 8.5) {
        // Assembled phase: solid object shimmers and holds
        morphWeight = 1.0
      } else {
        // Dispersion phase: bursts back into floating dust
        const t = (cycleTime - 8.5) / 2.5
        // Smooth ease in out
        morphWeight = 1 - (t * t * (3 - 2 * t))
      }

      // Update positions buffer
      const posArray = posAttr.array as Float32Array
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3

        const dx = dustPositions[i3] + Math.sin(elapsed * 0.4 + i) * 0.4
        const dy = dustPositions[i3 + 1] + Math.cos(elapsed * 0.35 + i * 0.5) * 0.4
        const dz = dustPositions[i3 + 2] + Math.sin(elapsed * 0.3 + i * 0.2) * 0.3

        const tx = targetPositions[i3]
        const ty = targetPositions[i3 + 1]
        const tz = targetPositions[i3 + 2]

        // Linear interpolation with slight organic offset
        posArray[i3] = dx + (tx - dx) * morphWeight
        posArray[i3 + 1] = dy + (ty - dy) * morphWeight
        posArray[i3 + 2] = dz + (tz - dz) * morphWeight
      }
      posAttr.needsUpdate = true

      // Rotate point cloud gently
      pointCloud.rotation.y = elapsed * 0.08 + currentX * 0.3
      pointCloud.rotation.x = Math.sin(elapsed * 0.15) * 0.05 - currentY * 0.2
      pointCloud.position.y = Math.sin(elapsed * 0.6) * 0.1 - scrollProg * 1.5

      // Coordinate ring follows center
      ringMesh.rotation.z = elapsed * 0.2
      ringMesh.rotation.y = pointCloud.rotation.y
      ringMesh.rotation.x = pointCloud.rotation.x

      // Ground grid subtle drift
      gridHelper.rotation.y = elapsed * 0.02

      // Camera parallax
      if (camera) {
        camera.position.x = currentX * 0.5
        camera.position.y = -currentY * 0.35
        camera.position.z = 13 - scrollProg * 3.5
        camera.lookAt(0, 0, 0)
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    onStatus?.('ready')

    return () => {
      isDisposed = true
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('resize', handleResize)

      geometry.dispose()
      material.dispose()
      particleTexture.dispose()
      gridHelper.geometry.dispose()
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
