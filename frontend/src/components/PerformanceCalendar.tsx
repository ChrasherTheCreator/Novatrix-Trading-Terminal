import { useMemo, useState } from 'react'
import { useAppStore } from '../store/app'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function PerformanceCalendar() {
  const { trades } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showMonthSelect, setShowMonthSelect] = useState(false)

  const dailyStats = useMemo(() => {
    const stats: Record<string, number> = {}
    trades.forEach(t => {
      if (t.status === 'CLOSED' && t.pnl !== null) {
        const date = new Date(t.created_at).toISOString().split('T')[0]
        stats[date] = (stats[date] || 0) + t.pnl
      }
    })
    return stats
  }, [trades])

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startingDay = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay()
      
      days.push({ 
        day: i, 
        pnl: dailyStats[dateStr] || 0,
        isClosed: dayOfWeek === 0 || dayOfWeek === 6
      })
    }
    return days
  }, [currentDate, dailyStats])

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const years = [2024, 2025, 2026]

  return (
    <div className="card" style={{ padding: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div 
            onClick={() => setShowMonthSelect(!showMonthSelect)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '6px', background: showMonthSelect ? 'var(--bg-secondary)' : 'transparent' }}
        >
          <CalendarIcon size={14} color="var(--accent-bright)"/>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            {months[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}
          </h3>
        </div>
        
        {showMonthSelect && (
            <div className="card fade-in" style={{ position: 'absolute', top: '3.5rem', left: '1rem', zIndex: 100, width: '280px', padding: '1rem', border: '1px solid var(--border-accent)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {months.map((m, i) => (
                            <button key={m} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setShowMonthSelect(false); }} style={{ textAlign: 'left', padding: '0.4rem', borderRadius: '4px', border: 'none', background: currentDate.getMonth() === i ? 'var(--accent)' : 'transparent', color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>{m}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {years.map(y => (
                            <button key={y} onClick={() => { setCurrentDate(new Date(y, currentDate.getMonth(), 1)); setShowMonthSelect(false); }} style={{ textAlign: 'left', padding: '0.4rem', borderRadius: '4px', border: 'none', background: currentDate.getFullYear() === y ? 'var(--accent)' : 'transparent', color: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>{y}</button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="icon-btn"><ChevronLeft size={14}/></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="icon-btn"><ChevronRight size={14}/></button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '0.5rem' }}>{d}</div>
        ))}
        
        {calendarDays.map((d, i) => {
          if (!d) return <div key={i} />
          const hasProfit = d.pnl > 0
          const hasLoss = d.pnl < 0
          const isClosed = d.isClosed
          
          return (
            <div 
              key={i} 
              style={{
                aspectRatio: '1/1', 
                borderRadius: '4px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                // Adjust colors for Light Mode (use var primary/secondary text and bg)
                background: hasProfit ? 'rgba(16, 185, 129, 0.15)' : hasLoss ? 'rgba(239, 68, 68, 0.15)' : (isClosed ? 'var(--accent-dim)' : 'var(--bg-secondary)'),
                border: `1px solid ${hasProfit ? 'rgba(16, 185, 129, 0.3)' : hasLoss ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                cursor: 'pointer', 
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 900, 
                color: (hasProfit || hasLoss) ? 'var(--text-primary)' : 'var(--text-muted)', 
                position: 'absolute', 
                top: '2px',
                pointerEvents: 'none',
                opacity: (hasProfit || hasLoss) ? 0.4 : 0.15
              }}>{d.day}</span>
              
              {d.pnl !== 0 && (
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 900, 
                  color: hasProfit ? 'var(--green)' : 'var(--red)', 
                  zIndex: 2, 
                  marginTop: '12px'
                }}>
                  {hasProfit ? '+' : ''}{Math.abs(d.pnl) >= 1000 ? `${(d.pnl/1000).toFixed(1)}k` : Math.round(d.pnl)}
                </span>
              )}

              {isClosed && d.pnl === 0 && (
                <div style={{ fontSize: '0.45rem', fontWeight: 800, color: 'var(--accent)', marginTop: '14px', zIndex: 2 }}>CLOSED</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
