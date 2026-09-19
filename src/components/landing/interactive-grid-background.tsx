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
    if (typeof window === 'undefined') return

    // 1. Check for reduced motion or touch/mobile screens
    const isCoarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window
    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Default center glow
    const initialX = window.innerWidth / 2
    const initialY = window.innerHeight * 0.35
    mouseState.current.currentX = initialX
    mouseState.current.currentY = initialY
    mouseState.current.targetX = initialX
    mouseState.current.targetY = initialY

    if (glowLayerRef.current) {
      const maskStyle = `radial-gradient(${glowRadius}px circle at ${initialX}px ${initialY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 80%)`
      glowLayerRef.current.style.maskImage = maskStyle
      glowLayerRef.current.style.webkitMaskImage = maskStyle
    }

    // On touch devices or reduced motion, maintain static beautiful glow without spinning CPU cycles
    if (isCoarse || isReducedMotion) {
      return
    }

    let animationFrameId: number | null = null
    let isRunning = false

    const animate = () => {
      const state = mouseState.current

      // Smooth interpolation (Lerp)
      const dx = state.targetX - state.currentX
      const dy = state.targetY - state.currentY
      const dpx = state.targetParallaxX - state.parallaxX
      const dpy = state.targetParallaxY - state.parallaxY

      // Check if settled (Idle Detection) to save 100% CPU/GPU when mouse is stationary
      if (
        Math.abs(dx) < 0.2 &&
        Math.abs(dy) < 0.2 &&
        Math.abs(dpx) < 0.05 &&
        Math.abs(dpy) < 0.05
      ) {
        state.currentX = state.targetX
        state.currentY = state.targetY
        state.parallaxX = state.targetParallaxX
        state.parallaxY = state.targetParallaxY

        if (glowLayerRef.current) {
          const maskStyle = `radial-gradient(${glowRadius}px circle at ${state.currentX}px ${state.currentY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 80%)`
          glowLayerRef.current.style.maskImage = maskStyle
          glowLayerRef.current.style.webkitMaskImage = maskStyle
        }
        if (gridLayerRef.current) {
          gridLayerRef.current.style.transform = `translate3d(${state.parallaxX}px, ${state.parallaxY}px, 0)`
        }

        isRunning = false
        animationFrameId = null
        return
      }

      state.currentX += dx * 0.12
      state.currentY += dy * 0.12
      state.parallaxX += dpx * 0.08
      state.parallaxY += dpy * 0.08

      if (glowLayerRef.current) {
        const maskStyle = `radial-gradient(${glowRadius}px circle at ${state.currentX}px ${state.currentY}px, black 0%, rgba(0,0,0,0.6) 45%, transparent 80%)`
        glowLayerRef.current.style.maskImage = maskStyle
        glowLayerRef.current.style.webkitMaskImage = maskStyle
      }

      if (gridLayerRef.current) {
        gridLayerRef.current.style.transform = `translate3d(${state.parallaxX}px, ${state.parallaxY}px, 0)`
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (!isRunning) {
        isRunning = true
        animationFrameId = requestAnimationFrame(animate)
      }
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

      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const normX = (e.clientX - centerX) / (centerX || 1)
      const normY = (e.clientY - centerY) / (centerY || 1)

      mouseState.current.targetParallaxX = normX * parallaxStrength
      mouseState.current.targetParallaxY = normY * parallaxStrength

      startAnimation()
    }

    const handlePointerLeave = () => {
      mouseState.current.targetParallaxX = 0
      mouseState.current.targetParallaxY = 0
      startAnimation()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
          isRunning = false
        }
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [glowRadius, parallaxStrength])

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Parallax Interactive Container */}
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

        {/* 2. Glowing Soft Grid Layer (Smoothly Revealed around cursor) */}
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
