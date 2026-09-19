import React from 'react'
import { cn } from '@/lib/utils'

export type IconBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconBadgeVariant =
  | 'glass'
  | 'emerald'
  | 'violet'
  | 'cyan'
  | 'amber'
  | 'blue'
  | 'rose'
  | 'muted'

interface LinearIconBadgeProps {
  icon: React.ElementType | React.ReactNode
  size?: IconBadgeSize
  variant?: IconBadgeVariant
  strokeWidth?: number
  className?: string
  iconClassName?: string
  glow?: boolean
  interactive?: boolean
}

const sizeMap: Record<IconBadgeSize, { container: string; icon: string; stroke: number }> = {
  xs: {
    container: 'w-7 h-7 rounded-lg',
    icon: 'w-3.5 h-3.5',
    stroke: 1.5,
  },
  sm: {
    container: 'w-9 h-9 rounded-xl',
    icon: 'w-4 h-4',
    stroke: 1.5,
  },
  md: {
    container: 'w-11 h-11 rounded-xl',
    icon: 'w-5 h-5',
    stroke: 1.5,
  },
  lg: {
    container: 'w-13 h-13 rounded-2xl',
    icon: 'w-6 h-6',
    stroke: 1.5,
  },
  xl: {
    container: 'w-16 h-16 rounded-2xl',
    icon: 'w-8 h-8',
    stroke: 1.5,
  },
}

const variantMap: Record<IconBadgeVariant, { container: string; iconColor: string; glowColor: string }> = {
  glass: {
    container:
      'bg-white/[0.04] dark:bg-white/[0.04] bg-neutral-900/[0.03] border border-white/10 dark:border-white/10 border-black/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
    iconColor: 'text-foreground',
    glowColor: 'bg-white/10',
  },
  emerald: {
    container:
      'bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glowColor: 'bg-emerald-500/20',
  },
  violet: {
    container:
      'bg-violet-500/10 dark:bg-violet-500/10 border border-violet-500/20 dark:border-violet-500/30 shadow-[inset_0_1px_0_0_rgba(139,92,246,0.2)]',
    iconColor: 'text-violet-600 dark:text-violet-400',
    glowColor: 'bg-violet-500/20',
  },
  cyan: {
    container:
      'bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 dark:border-cyan-500/30 shadow-[inset_0_1px_0_0_rgba(6,182,212,0.2)]',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    glowColor: 'bg-cyan-500/20',
  },
  amber: {
    container:
      'bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.2)]',
    iconColor: 'text-amber-600 dark:text-amber-400',
    glowColor: 'bg-amber-500/20',
  },
  blue: {
    container:
      'bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 shadow-[inset_0_1px_0_0_rgba(59,130,246,0.2)]',
    iconColor: 'text-blue-600 dark:text-blue-400',
    glowColor: 'bg-blue-500/20',
  },
  rose: {
    container:
      'bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/30 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.2)]',
    iconColor: 'text-rose-600 dark:text-rose-400',
    glowColor: 'bg-rose-500/20',
  },
  muted: {
    container:
      'bg-muted/50 border border-border/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
    iconColor: 'text-muted-foreground',
    glowColor: 'bg-muted/30',
  },
}

export function LinearIconBadge({
  icon,
  size = 'md',
  variant = 'glass',
  strokeWidth,
  className,
  iconClassName,
  glow = false,
  interactive = true,
}: LinearIconBadgeProps) {
  const sizeConfig = sizeMap[size]
  const variantConfig = variantMap[variant]
  const finalStrokeWidth = strokeWidth ?? sizeConfig.stroke

  const renderIcon = () => {
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<{ className?: string; strokeWidth?: number }>, {
        className: cn(sizeConfig.icon, variantConfig.iconColor, iconClassName, (icon.props as { className?: string })?.className),
        strokeWidth: (icon.props as { strokeWidth?: number })?.strokeWidth ?? finalStrokeWidth,
      })
    }
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComp = icon as React.ElementType
      return <IconComp className={cn(sizeConfig.icon, variantConfig.iconColor, iconClassName)} strokeWidth={finalStrokeWidth} />
    }
    return null
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0 group', className)}>
      {glow && (
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none',
            variantConfig.glowColor
          )}
        />
      )}
      <div
        className={cn(
          'relative flex items-center justify-center backdrop-blur-md transition-all duration-300',
          sizeConfig.container,
          variantConfig.container,
          interactive &&
            'group-hover:scale-[1.04] group-hover:border-white/20 dark:group-hover:border-white/25 group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_20px_-4px_rgba(0,0,0,0.3)]'
        )}
      >
        {renderIcon()}
      </div>
    </div>
  )
}
