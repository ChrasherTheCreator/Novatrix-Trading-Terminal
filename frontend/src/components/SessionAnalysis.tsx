import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { Activity, Info } from 'lucide-react'

interface Session {
  id: string
  name: string
  start: number 
  end: number   
  color: string
}

const SESSIONS: Session[] = [
  { id: 'sydney', name: 'Sydney', start: 20, end: 5, color: '#10b981' },
  { id: 'tokyo',  name: 'Tokyo',  start: 0,  end: 9, color: '#3b82f6' },
  { id: 'london', name: 'London', start: 8,  end: 17, color: '#8b5cf6' },
  { id: 'newyork', name: 'New York', start: 13, end: 22, color: '#f59e0b' },
]

export default function SessionAnalysis() {
  const { trades = [] } = useAppStore()

  const sessionPerformance = useMemo(() => {
    if (!Array.isArray(trades)) return SESSIONS.map(s => ({ ...s, pnl: 0, count: 0 }))
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    const stats = SESSIONS.map(s => {
        const tradesInSession = closed.filter(t => {
            const hour = new Date(t.created_at).getHours()
            if (s.start < s.end) return hour >= s.start && hour < s.end
            return hour >= s.start || hour < s.end
        })
        const pnl = tradesInSession.reduce((sum, t) => sum + (t.pnl || 0), 0)
        return { ...s, pnl, count: tradesInSession.length }
    })
    return stats
  }, [trades])

  const heatmapData = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0))
    closed.forEach(t => {
      const date = new Date(t.created_at)
      const day = date.getDay()
      const hour = date.getHours()
      grid[day][hour] += t.pnl || 0
    })
    return grid
  }, [trades])

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const getColor = (val: number) => {
    if (val === 0) return 'rgba(255,255,255,0.02)'
    const opacity = Math.min(0.8, 0.1 + (Math.abs(val) / 2000))
    return val > 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Session Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {sessionPerformance.map(s => (
              <div key={s.id} className="card" style={{ borderLeft: `4px solid ${s.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{s.name.toUpperCase()}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {s.pnl >= 0 ? '+' : ''}${s.pnl.toLocaleString()}
                      </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)' }}>{s.count} Trades</div>
                      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)' }}>{s.start}:00 - {s.end}:00</div>
                  </div>
              </div>
          ))}
      </div>

      {/* Heatmap Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}>
            <Activity size={18}/>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>P&L TEMPORAL HEATMAP</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '2px' }} /> PROFIT</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: 'var(--red)', borderRadius: '2px' }} /> LOSS</div>
            </div>
        </div>

        <div style={{ position: 'relative', overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
                <div style={{ display: 'flex', marginLeft: '45px', marginBottom: '0.5rem' }}>
                    {Array.from({ length: 24 }).map((_, h) => (
                        <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            {h % 4 === 0 ? `${h}h` : ''}
                        </div>
                    ))}
                </div>

                {heatmapData.map((row, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <div style={{ width: '40px', fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)' }}>{days[dIdx]}</div>
                        <div style={{ flex: 1, display: 'flex', gap: '2px' }}>
                            {row.map((val, hIdx) => (
                                <div key={hIdx} title={`${days[dIdx]} ${hIdx}:00 -> P&L: $${val.toFixed(2)}`} style={{ flex: 1, height: '24px', background: getColor(val), borderRadius: '2px', border: val !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'all 0.2s ease', cursor: 'help' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.zIndex = '10'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--accent-dim)', borderRadius: '8px', border: '1px dashed var(--border-accent)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Info size={14} color="var(--accent-bright)" style={{ marginTop: '0.1rem' }}/>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Analyze how your performance varies across days and hours. Heat intensity correlates with absolute P&L magnitude.
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}
