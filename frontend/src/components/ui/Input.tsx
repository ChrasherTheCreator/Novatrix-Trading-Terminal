import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[0.6875rem] font-semibold tracking-wider uppercase text-[#475569]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-white/10 bg-[#10101e] px-3 py-2 text-sm text-[#f1f5f9] placeholder:text-[#475569] outline-none transition-all focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/15 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
            className
          )}
          {...props}
        />
        {error && <span className="text-[0.65rem] font-medium text-red-500 uppercase">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
