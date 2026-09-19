'use client'

import React, { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  innerClassName?: string
  children?: React.ReactNode
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#00E785',
      shimmerSize = '1.5px',
      shimmerDuration = '2.5s',
      borderRadius = '9999px',
      background = '#121316',
      className,
      innerClassName,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as CSSProperties
        }
        className={cn(
          'group relative z-0 inline-flex items-center justify-center overflow-hidden whitespace-nowrap p-[1.5px] text-white [border-radius:var(--radius)] cursor-pointer',
          'transform-gpu transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]',
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Glow Spark Layer (Outer perimeter blur) */}
        <div
          className={cn(
            '-z-20 blur-[2px]',
            'absolute inset-0 overflow-visible [container-type:size]'
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {/* Sharp Spark Layer (Crisp laser beam along the outer border) */}
        <div
          className={cn(
            '-z-10',
            'absolute inset-0 overflow-visible [container-type:size]'
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>

        {/* Solid Inner Button Body - 100% Opaque, cleanly blocking all interior light */}
        <span
          style={{ background: 'var(--bg)' }}
          className={cn(
            'relative z-10 flex h-full w-full items-center justify-center gap-2 px-6 py-3 font-medium [border-radius:calc(var(--radius)-1.5px)] transition-colors',
            innerClassName
          )}
        >
          {children}
        </span>
      </button>
    )
  }
)

ShimmerButton.displayName = 'ShimmerButton'
