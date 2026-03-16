import * as React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'danger'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, style, ...props }, ref) => {
    
    const getSizeStyles = () => {
        switch(size) {
            case 'sm': return { height: '32px', padding: '0 12px', fontSize: '12px' }
            case 'lg': return { height: '48px', padding: '0 32px', fontSize: '16px' }
            case 'icon': return { height: '40px', width: '40px', padding: '0' }
            default: return { height: '40px', padding: '0 20px', fontSize: '14px' }
        }
    }

    const getVariantStyles = () => {
        switch(variant) {
            case 'outline': return { background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }
            case 'ghost': return { background: 'transparent', border: 'none', color: 'var(--text-primary)' }
            case 'destructive': 
            case 'danger': return { background: 'var(--red)', border: 'none', color: 'white' }
            case 'primary':
            default: return { background: 'var(--accent)', border: 'none', color: 'var(--text-static-white)' }
        }
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: (isLoading || props.disabled) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            outline: 'none',
            opacity: (isLoading || props.disabled) ? 0.6 : 1,
            ...getSizeStyles(),
            ...getVariantStyles(),
            ...style
        }}
        {...props}
      >
        {isLoading && <Loader2 size={16} className="spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
