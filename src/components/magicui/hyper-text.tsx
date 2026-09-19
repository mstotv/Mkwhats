'use client'

import React, { ElementType, useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_LATIN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_ARABIC_CHARS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهويء'

const isArabicChar = (char: string) => /[\u0600-\u06FF]/.test(char)

interface HyperTextProps {
  children: string
  className?: string
  duration?: number
  delay?: number
  as?: ElementType
  startOnView?: boolean
  animateOnHover?: boolean
  characterSet?: string[] | string
}

export function HyperText({
  children,
  className = '',
  duration = 800,
  delay = 0,
  as: Component = 'span',
  startOnView = true,
  animateOnHover = true,
  characterSet,
}: HyperTextProps) {
  const text = typeof children === 'string' ? children : String(children || '')
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)
  const hasAnimatedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const getRandomChar = useCallback((targetChar: string) => {
    if (characterSet) {
      const chars = Array.isArray(characterSet) ? characterSet : characterSet.split('')
      return chars[Math.floor(Math.random() * chars.length)]
    }
    if (isArabicChar(targetChar)) {
      return DEFAULT_ARABIC_CHARS[Math.floor(Math.random() * DEFAULT_ARABIC_CHARS.length)]
    }
    if (/[a-zA-Z0-9]/.test(targetChar)) {
      return DEFAULT_LATIN_CHARS[Math.floor(Math.random() * DEFAULT_LATIN_CHARS.length)]
    }
    return targetChar
  }, [characterSet])

  const triggerAnimation = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(text)
      return
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setIsAnimating(true)
    const iterations = Math.max(12, Math.floor(duration / 40))
    const stepInterval = Math.max(25, Math.floor(duration / iterations))
    let currentIteration = 0

    timerRef.current = setInterval(() => {
      currentIteration++
      const progress = currentIteration / iterations

      const nextText = text
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '\n' || char === '\t') return char
          const charThreshold = index / text.length
          if (progress > charThreshold) {
            return char
          }
          return getRandomChar(char)
        })
        .join('')

      setDisplayText(nextText)

      if (currentIteration >= iterations) {
        if (timerRef.current) clearInterval(timerRef.current)
        setDisplayText(text)
        setIsAnimating(false)
      }
    }, stepInterval)
  }, [text, duration, getRandomChar])

  useEffect(() => {
    setDisplayText(text)
  }, [text])

  useEffect(() => {
    if (!startOnView) {
      const startTimer = setTimeout(() => {
        triggerAnimation()
      }, delay)
      return () => clearTimeout(startTimer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true
          const startTimer = setTimeout(() => {
            triggerAnimation()
          }, delay)
          return () => clearTimeout(startTimer)
        }
      },
      { threshold: 0.1 }
    )

    const el = elementRef.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      if (el) observer.unobserve(el)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startOnView, delay, triggerAnimation])

  const handleMouseEnter = () => {
    if (animateOnHover && !isAnimating) {
      triggerAnimation()
    }
  }

  return (
    <Component
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      className={`inline-block transition-colors cursor-default ${className}`}
    >
      {displayText}
    </Component>
  )
}
