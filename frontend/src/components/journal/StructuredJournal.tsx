import { useState } from 'react'
import { Book, Compass, Clock, Sunrise, Sunset, Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAppStore } from '../../store/app'
import { toast } from 'sonner'

export default function StructuredJournal() {
  const { accounts } = useAppStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    pre_market: '',
    outlook: '',
    intraday: '',
    post_market: ''
  })

  const STEPS = [
    { title: 'Pre-Market Plan', icon: Sunrise, field: 'pre_market', placeholder: 'What is your plan for today? Key levels, focus assets...' },
    { title: 'Market Outlook', icon: Compass, field: 'outlook', placeholder: 'Current market sentiment, bias, and macro context...' },
    { title: 'Intraday Check-in', icon: Clock, field: 'intraday', placeholder: 'How is the session going? Any deviations from plan?' },
    { title: 'Post-Market Reflection', icon: Sunset, field: 'post_market', placeholder: 'Final results, lessons learned, and prep for tomorrow...' }
  ]

  const handleSave = async () => {
    const account = accounts[0]
    if (!account) return

    try {
      const res = await fetch('http://localhost:3001/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          date: new Date().toISOString().split('T')[0],
          ...data,
          journal_type: 'STRUCTURED'
        })
      })
      
      if (res.ok) {
        toast.success('Daily Journal Updated')
      } else {
        toast.error('Failed to save journal')
      }
    } catch (err) {
      toast.error('Server connection error')
    }
  }

  const current = STEPS[step]

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Book size={20} color="var(--accent-bright)"/>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daily Process Journal</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {STEPS.map((_, i) => (
            <div 
              key={i} onClick={() => setStep(i)}
              style={{ 
                width: 40, height: 4, borderRadius: 2, cursor: 'pointer',
                background: step === i ? 'var(--accent)' : 'var(--border-subtle)',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      <div className="fade-in" key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <current.icon size={18} color="var(--text-secondary)"/>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            {current.title}
          </span>
        </div>

        <textarea 
          value={(data as any)[current.field]} 
          onChange={e => setData({ ...data, [current.field]: e.target.value })}
          placeholder={current.placeholder}
          style={{
            flex: 1, width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: '1rem', color: 'var(--text-primary)',
            fontFamily: 'inherit', fontSize: '0.9375rem', outline: 'none', resize: 'none',
            lineHeight: 1.6
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Step {step + 1} of 4 — Autoresizing...
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Previous</Button>
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(s => s + 1)}>Next Step</Button>
          ) : (
            <Button variant="primary" onClick={handleSave}>
              <Send size={16} style={{ marginRight: '0.5rem' }}/>
              SAVE JOURNAL
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
