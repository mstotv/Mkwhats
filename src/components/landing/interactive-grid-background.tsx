'use client'

import { useEffect, useRef } from 'react'

interface InteractiveGridBackgroundProps {
  gridSize?: number
  glowRadius?: number
  parallaxStrength?: number
  className?: string
}

export function InteractiveGridBackground({
  gridSize = 40,
  glowRadius = 380,
  parallaxStrength = 18,
  className = '',
}: InteractiveGridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowLayerRef = useRef<HTMLDivElement>(null)
  const gridLayerRef = useRef<HTMLDivElement>(null)

  // Physics animation state
  const mouseState = useRef({
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    parallaxX: 0,
    parallaxY: 0,
    targetParallaxX: 0,
    targetParallaxY: 0,
    isVisible: false,
  })

  useEffect(() => {
    let animationFrameId: number

    // Center coordinates initially
    if (typeof window !== 'undefined') {
      const initialX = window.innerWidth / 2
      const initialY = window.innerHeight * 0.35
      mouseState.current.currentX = initialX
      mouseState.current.currentY = initialY
      mouseState.current.targetX = initialX
      mouseState.current.targetY = initialY
    }

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      mouseState.current.targetX = x
      mouseState.current.targetY = y
      mouseState.current.isVisible = true

      // Calculate normalized parallax delta (-1 to 1) from viewport center
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const normX = (e.clientX - centerX) / centerX
      const normY = (e.clientY - centerY) / centerY

      mouseState.current.targetParallaxX = normX * parallaxStrength
      mouseState.current.targetParallaxY = normY * parallaxStrength
    }

    const handlePointerLeave = () => {
      mouseState.current.targetParallaxX = 0
      mouseState.current.targetParallaxY = 0
    }

    // 60FPS / 120FPS smooth Lerp loop with GPU transforms
    const animate = () => {
      const state = mouseState.current

      // Smooth interpolation (Lerp factor 0.12)
      state.currentX += (state.targetX - state.currentX) * 0.12
      state.currentY += (state.targetY - state.currentY) * 0.12
      state.parallaxX += (state.targetParallaxX - state.parallaxX) * 0.08
      state.parallaxY += (state.targetParallaxY - state.parallaxY) * 0.08

      if (glowLayerRef.current) {
        const maskStyle = `radial-gradient(${glowRadius}px circle at ${state.currentX}px ${state.currentY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 80%)`
        glowLayerRef.current.style.maskImage = maskStyle
        glowLayerRef.current.style.webkitMaskImage = maskStyle
      }

      if (gridLayerRef.current) {
        // Subtle 3D parallax translation on the grid plane
        gridLayerRef.current.style.transform = `translate3d(${state.parallaxX}px, ${state.parallaxY}px, 0)`
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    animationFrameId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [glowRadius, parallaxStrength])

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* ── 1. Parallax Interactive Container ─────────────────────── */}
      <div
        ref={gridLayerRef}
        className="absolute -inset-x-16 -inset-y-16 will-change-transform"
      >
        {/* Base faint geometric grid lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="base-grid-pattern"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-black/20 dark:text-white/20"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#base-grid-pattern)" />
        </svg>

        {/* ── 2. Glowing Soft Grid Layer (Smoothly Revealed around cursor) ── */}
        <div
          ref={glowLayerRef}
          className="absolute inset-0"
          style={{
            maskImage: `radial-gradient(${glowRadius}px circle at 50% 30%, black 0%, rgba(0,0,0,0.5) 50%, transparent 80%)`,
            WebkitMaskImage: `radial-gradient(${glowRadius}px circle at 50% 30%, black 0%, rgba(0,0,0,0.5) 50%, transparent 80%)`,
          }}
        >
          {/* Glowing emerald grid lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-80 dark:opacity-70"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="glowing-grid-pattern"
                width={gridSize}
                height={gridSize}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="text-emerald-500 dark:text-emerald-400"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#glowing-grid-pattern)" />
          </svg>

          {/* Smooth Velvety Spotlight Bloom Glow */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
