'use client'

import React, { useEffect, useMemo, useState } from 'react'

export interface AnimatedListProps {
  className?: string
  children: React.ReactNode
  delay?: number
}

export const AnimatedList = React.memo(
  ({ className = '', children, delay = 1800 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    )

    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
      }, delay)

      return () => clearInterval(interval)
    }, [delay, childrenArray.length])

    const itemsToShow = useMemo(() => {
      const result: React.ReactNode[] = []
      const total = childrenArray.length
      // Show up to 4 items in reverse chronological order
      const count = Math.min(total, 4)
      for (let i = 0; i < count; i++) {
        const itemIndex = (index - i + total) % total
        result.push(childrenArray[itemIndex])
      }
      return result
    }, [index, childrenArray])

    return (
      <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
        {itemsToShow.map((item, idx) => (
          <div
            key={idx === 0 ? `active-${index}` : `item-${idx}`}
            className="w-full transition-all duration-500 ease-out transform"
            style={{
              animation: idx === 0 ? 'animated-list-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards' : undefined,
              opacity: idx === 0 ? 1 : Math.max(0.35, 1 - idx * 0.22),
              transform: `scale(${1 - idx * 0.025}) translateY(${idx * 2}px)`,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'
