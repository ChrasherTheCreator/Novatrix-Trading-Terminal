import React from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-white/5 bg-[#13132a] p-5 transition-colors duration-200 hover:border-[#8b5cf6]/30',
          glass && 'bg-white/5 backdrop-blur-xl',
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export { Card }
