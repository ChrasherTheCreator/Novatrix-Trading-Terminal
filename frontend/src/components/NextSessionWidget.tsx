import { useState, useEffect, useMemo } from 'react'
import { Timer, Globe, ArrowRight } from 'lucide-react'

interface Session {
  name: string
  open: number // UTC Hour
  close: number
  color: string
}

const SESSIONS: Session[] = [
  { name: 'SYDNEY', open: 20, close: 5,  color: '#10b981' }, // Green
  { name: 'TOKYO',  open: 0,  close: 9,  color: '#3b82f6' }, // Blue
  { name: 'LONDON', open: 8,  close: 17, color: '#8b5cf6' }, // Purple
  { name: 'NEW YORK', open: 13, close: 22, color: '#f59e0b' }, // Orange
]

export default function NextSessionWidget() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const nextSessionInfo = useMemo(() => {
    const utcDay = now.getUTCDay() // 0=Sun, 5=Fri, 6=Sat
    const utcHour = now.getUTCHours()

    // 1. Check if Weekend (Fri 22:00 to Sun 20:00)
    const isWeekend = (utcDay === 5 && utcHour >= 22) || (utcDay === 6) || (utcDay === 0 && utcHour < 20)
    
    let targetSession = SESSIONS[0] // Default to Sydney
    let diffMs = 0

    if (isWeekend) {
        // Calculate time until Sunday 20:00 UTC
        const target = new Date(now)
        const daysToAdd = utcDay === 5 ? 2 : (utcDay === 6 ? 1 : 0)
        target.setUTCDate(now.getUTCDate() + daysToAdd)
        target.setUTCHours(20, 0, 0, 0)
        diffMs = target.getTime() - now.getTime()
        return { session: targetSession, diffMs, label: 'MARKETS CLOSED', isWeekend: true }
    }

    // 2. Find next opening session during the week
    const upcoming = SESSIONS
        .map(s => {
            const target = new Date(now)
            if (s.open <= utcHour) target.setUTCDate(now.getUTCDate() + 1)
            target.setUTCHours(s.open, 0, 0, 0)
            return { session: s, diffMs: target.getTime() - now.getTime() }
        })
        .sort((a, b) => a.diffMs - b.diffMs)[0]

    // 3. Check if any session is currently open
    const openSessions = SESSIONS.filter(s => {
        if (s.open < s.close) return utcHour >= s.open && utcHour < s.close
        return utcHour >= s.open || utcHour < s.close // Crosses midnight
    })

    if (openSessions.length > 0) {
        // Find the one that opens next
        return { session: upcoming.session, diffMs: upcoming.diffMs, label: `${openSessions[0].name} OPEN`, isWeekend: false }
    }

    return { session: upcoming.session, diffMs: upcoming.diffMs, label: 'NEXT OPENING', isWeekend: false }
  }, [now])

  const formatCountdown = (ms: number) => {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="card" style={{ 
        background: nextSessionInfo.isWeekend ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
        border: nextSessionInfo.isWeekend ? '1px solid var(--red-dim)' : '1px solid var(--border-subtle)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Timer size={16} color={nextSessionInfo.isWeekend ? 'var(--red)' : 'var(--accent-bright)'}/>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {nextSessionInfo.label}
          </span>
        </div>
        <Globe size={14} color="var(--text-muted)"/>
      </div>

      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 950, 
            fontFamily: '"JetBrains Mono", monospace',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1
        }}>
          {formatCountdown(nextSessionInfo.diffMs)}
        </div>
        
        <div style={{ 
            marginTop: '1rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.35rem 0.75rem', 
            borderRadius: '6px', 
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
        }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: nextSessionInfo.session.color }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-static-white)' }}>{nextSessionInfo.session.name}</span>
            <ArrowRight size={12} color="var(--text-muted)"/>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>{nextSessionInfo.session.open}:00 UTC</span>
        </div>
      </div>

      {nextSessionInfo.isWeekend && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', background: 'var(--red-dim)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--red)' }}>WEEKEND BREAK ACTIVE</div>
          </div>
      )}
    </div>
  )
}
