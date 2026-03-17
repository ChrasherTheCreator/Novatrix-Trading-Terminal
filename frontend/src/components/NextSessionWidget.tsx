import { useState, useEffect, useRef, memo } from 'react'
import { Timer, Globe, ArrowRight } from 'lucide-react'

interface Session {
  name: string
  open: number // UTC Hour
  close: number // UTC Hour
  color: string
}

const SESSIONS: Session[] = [
  { name: 'SYDNEY', open: 20, close: 5,  color: '#10b981' }, 
  { name: 'TOKYO',  open: 0,  close: 9,  color: '#3b82f6' }, 
  { name: 'LONDON', open: 8,  close: 17, color: '#8b5cf6' }, 
  { name: 'NEW YORK', open: 13, close: 22, color: '#f59e0b' }, 
]

const NextSessionWidget = memo(function NextSessionWidget() {
  const displayRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState(() => calculateNextState())
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  function calculateNextState() {
    const now = new Date()
    const nowTs = now.getTime()
    const utcDay = now.getUTCDay() 
    const utcHour = now.getUTCHours()

    // 1. Weekend Logic
    const isWeekend = (utcDay === 5 && utcHour >= 22) || (utcDay === 6) || (utcDay === 0 && utcHour < 20)
    if (isWeekend) {
        const target = new Date()
        const daysToAdd = utcDay === 5 ? 2 : (utcDay === 6 ? 1 : 0)
        target.setUTCDate(now.getUTCDate() + daysToAdd)
        target.setUTCHours(20, 0, 0, 0)
        return { targetTs: target.getTime(), label: 'MARKETS CLOSED', subLabel: 'SYDNEY OPENS', color: '#ef4444' }
    }

    // 2. All transition points
    const transitions: { targetTs: number, label: string, subLabel: string, color: string }[] = []
    
    SESSIONS.forEach(s => {
        [0, 1].forEach(dayOffset => {
            const op = new Date(); op.setUTCDate(now.getUTCDate() + dayOffset); op.setUTCHours(s.open, 0, 0, 0); op.setUTCMinutes(0, 0, 0)
            transitions.push({ targetTs: op.getTime(), label: 'NEXT OPENING', subLabel: s.name, color: s.color })
            
            const cl = new Date(); cl.setUTCDate(now.getUTCDate() + dayOffset); cl.setUTCHours(s.close, 0, 0, 0); cl.setUTCMinutes(0, 0, 0)
            if (s.close < s.open) cl.setUTCDate(cl.getUTCDate() + 1)
            transitions.push({ targetTs: cl.getTime(), label: `${s.name} OPEN`, subLabel: 'CLOSES IN', color: s.color })
        })
    })

    const next = transitions
        .filter(t => t.targetTs > nowTs + 1000)
        .sort((a, b) => a.targetTs - b.targetTs)[0]

    return next || { targetTs: nowTs + 3600000, label: 'SYNCING', subLabel: 'WAITING', color: 'var(--accent)' }
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
        const now = Date.now()
        const diff = stateRef.current.targetTs - now

        if (diff <= 0) {
            setState(calculateNextState())
            return
        }

        if (displayRef.current) {
            const totalSec = Math.floor(diff / 1000)
            const h = Math.floor(totalSec / 3600)
            const m = Math.floor((totalSec % 3600) / 60)
            const s = totalSec % 60
            const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
            if (displayRef.current.textContent !== timeStr) {
                displayRef.current.textContent = timeStr
            }
        }
    }, 100)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="card" style={{ 
        background: state.label === 'MARKETS CLOSED' ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
        border: state.label === 'MARKETS CLOSED' ? '1px solid var(--red-dim)' : '1px solid var(--border-subtle)',
        minHeight: '160px',
        transition: 'all 0.5s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Timer size={16} color={state.color}/>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {state.label}
          </span>
        </div>
        <Globe size={14} color="var(--text-muted)"/>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div ref={displayRef} style={{ 
            fontSize: '2.8rem', 
            fontWeight: 950, 
            fontFamily: '"JetBrains Mono", monospace',
            color: 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: '0.5rem'
        }}>
          00:00:00
        </div>
        
        <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.3rem 0.75rem', 
            borderRadius: '6px', 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
        }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: state.color }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-static-white)' }}>{state.subLabel}</span>
            <ArrowRight size={12} color="var(--text-muted)"/>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {new Date(state.targetTs).getUTCHours()}:00 UTC
            </span>
        </div>
      </div>

      {state.label === 'MARKETS CLOSED' && (
          <div style={{ marginTop: '0.75rem', padding: '0.4rem', borderRadius: '6px', background: 'var(--red-dim)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--red)' }}>WEEKEND BREAK ACTIVE</div>
          </div>
      )}
    </div>
  )
})

export default NextSessionWidget;
