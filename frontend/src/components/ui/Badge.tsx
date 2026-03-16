import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'outline'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'info', ...props }, ref) => {
    const variants = {
      success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      danger: 'bg-red-500/15 text-red-500 border-red-500/30',
      warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      info: 'bg-[#8b5cf6]/15 text-[#a78bfa] border-[#8b5cf6]/30',
      outline: 'bg-transparent text-[#94a3b8] border-white/10'
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
