import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  label?: string
  width?: string | number
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, placeholder = 'Select...', label, width = '100%' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width }}>
      {label && (
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
          {label.toUpperCase()}
        </div>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          boxShadow: isOpen ? '0 0 0 2px rgba(139, 92, 246, 0.1)' : 'none'
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              background: '#0f0f1a',
              border: '1px solid var(--border-accent)',
              borderRadius: '12px',
              overflow: 'hidden',
              marginTop: '4px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              maxHeight: '250px',
              overflowY: 'auto'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '0.7rem 1rem',
                  fontSize: '0.8rem',
                  color: value === option.value ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  background: value === option.value ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = value === option.value ? 'rgba(139, 92, 246, 0.1)' : 'transparent'}
              >
                {option.label}
                {value === option.value && <Check size={14} />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
