import { useState } from 'react'
import { X, Frown, Zap, Shield, AlertTriangle, Target } from 'lucide-react'
import { Button } from './ui/Button'
import { useAppStore } from '../store/app'
import { toast } from 'sonner'

interface PulseModalProps {
  onClose: () => void
}

const EMOTIONS = [
  { label: 'Confident', icon: Target, color: 'var(--green)' },
  { label: 'Anxious', icon: AlertTriangle, color: 'var(--red)' },
  { label: 'Neutral', icon: Shield, color: 'var(--text-muted)' },
  { label: 'Fired Up', icon: Zap, color: 'var(--accent-bright)' },
  { label: 'Frustrated', icon: Frown, color: 'var(--red)' },
]

export default function PulseModal({ onClose }: PulseModalProps) {
  const { accounts, addPulse } = useAppStore()
  const [emotion, setEmotion] = useState('Neutral')
  const [rating, setRating] = useState(5)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const availableTags = ['FOMO', 'Revenge', 'Disciplined', 'Patient', 'Greedy', 'Fearful']

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    const account = accounts[0]
    if (!account) return

    try {
      const res = await fetch('http://localhost:3001/api/pulses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          mental_state: emotion,
          tags,
          emotional_rating: rating,
          notes: notes || null
        })
      })
      
      if (res.ok) {
        const pulse = await res.json()
        addPulse(pulse)
        toast.success('Pulse logged successfully')
        onClose()
      } else {
        toast.error('Failed to log pulse')
      }
    } catch (err) {
      toast.error('Server connection error')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        className="card fade-in" 
        style={{ width: '450px', transform: 'none', border: '1px solid var(--border-accent)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Pulse Check-in</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Emotion Selection */}
          <div>
            <label className="metric-label" style={{ marginBottom: '0.75rem' }}>CURRENT MENTAL STATE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {EMOTIONS.map(e => (
                <button 
                  key={e.label} 
                  onClick={() => setEmotion(e.label)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 0.25rem', borderRadius: '12px', cursor: 'pointer',
                    background: emotion === e.label ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    border: emotion === e.label ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    color: emotion === e.label ? 'var(--accent-bright)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  <e.icon size={20} color={emotion === e.label ? 'var(--accent-bright)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase' }}>{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emotional Rating */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="metric-label">EMOTIONAL INTENSITY</label>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-bright)' }}>{rating}</span>
            </div>
            <input 
              type="range" min="1" max="10" value={rating} 
              onChange={e => setRating(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="metric-label" style={{ marginBottom: '0.75rem' }}>EMOTIONAL TAGS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableTags.map(t => (
                <button 
                  key={t} onClick={() => toggleTag(t)}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.1s',
                    background: tags.includes(t) ? 'var(--accent)' : 'transparent',
                    color: tags.includes(t) ? 'white' : 'var(--text-muted)',
                    border: tags.includes(t) ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="metric-label" style={{ marginBottom: '0.75rem' }}>QUICK NOTES</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What's going on in your head right now?"
              rows={3}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none', resize: 'none'
              }}
            />
          </div>

          <Button variant="primary" onClick={handleSubmit} style={{ marginTop: '0.5rem', width: '100%' }}>
            LOG PULSE
          </Button>
        </div>
      </div>
    </div>
  )
}
