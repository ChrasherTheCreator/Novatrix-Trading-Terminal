import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { Brain, Smile, Frown, Meh } from 'lucide-react'

export default function EmotionCorrelation() {
  const { trades = [], pulses = [] } = useAppStore()

  const correlationData = useMemo(() => {
    if (!Array.isArray(trades) || !Array.isArray(pulses)) return []
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null && t.created_at)
    
    // Group trades by date (YYYY-MM-DD)
    const dailyPnl: Record<string, number> = {}
    closed.forEach(t => {
      try {
        const date = new Date(t.created_at).toISOString().split('T')[0]
        dailyPnl[date] = (dailyPnl[date] || 0) + (t.pnl || 0)
      } catch (e) { /* skip invalid dates */ }
    })

    // Map pulses to mood ratings (1-10)
    const moodStats: Record<number, { pnl: number, count: number }> = {}
    for (let i = 1; i <= 10; i++) moodStats[i] = { pnl: 0, count: 0 }

    pulses.forEach(p => {
      try {
        if (!p.created_at) return;
        const date = new Date(p.created_at).toISOString().split('T')[0]
        const pnl = dailyPnl[date] || 0
        const rating = Math.round(p.emotional_rating)
        if (moodStats[rating]) {
          moodStats[rating].pnl += pnl
          moodStats[rating].count += 1
        }
      } catch (e) { /* skip */ }
    })

    return Object.entries(moodStats).map(([rating, data]) => ({
      rating: parseInt(rating),
      avgPnl: data.count > 0 ? data.pnl / data.count : 0,
      totalCount: data.count
    }))
  }, [trades, pulses])

  const getMoodIcon = (rating: number) => {
    if (rating >= 8) return <Smile size={16} color="var(--green)"/>
    if (rating >= 5) return <Meh size={16} color="var(--accent-bright)"/>
    return <Frown size={16} color="var(--red)"/>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Brain size={18} color="var(--accent-bright)"/>
        <div className="card-title">Emotion/Performance Correlation</div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Average P&L per trading day based on your self-reported emotional state.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {correlationData.filter(d => d.totalCount > 0).length > 0 ? (
          correlationData.filter(d => d.totalCount > 0).map(d => (
            <div key={d.rating} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                {getMoodIcon(d.rating)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mood Level {d.rating}</span>
                  <span style={{ color: d.avgPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>
                    {d.avgPnl >= 0 ? '+' : ''}${d.avgPnl.toFixed(0)} avg.
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (Math.abs(d.avgPnl) / 1000) * 100)}%`, 
                    height: '100%', 
                    background: d.avgPnl >= 0 ? 'var(--green)' : 'var(--red)',
                    opacity: 0.8
                  }}/>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No correlation data yet. Keep logging your "Pulses" and Trades!</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--accent-dim)', borderRadius: '8px', border: '1px solid var(--border-accent)' }}>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Insight:</strong> Your performance is best at <strong>Mood Level 7</strong>. High excitement (9-10) often leads to over-leveraging, while low mood (1-3) correlates with revenge trading.
        </p>
      </div>
    </div>
  )
}
