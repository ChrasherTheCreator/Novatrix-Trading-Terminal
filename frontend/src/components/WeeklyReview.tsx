import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { Calendar, Award, AlertCircle } from 'lucide-react'

export default function WeeklyReview() {
  const { trades } = useAppStore()

  const weeklyStats = useMemo(() => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekTrades = trades.filter(t => 
      t.status === 'CLOSED' && 
      t.pnl !== null && 
      new Date(t.created_at) >= oneWeekAgo
    )

    if (weekTrades.length === 0) return null

    const totalPnl = weekTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    const wins = weekTrades.filter(t => (t.pnl || 0) > 0).length
    const winRate = (wins / weekTrades.length) * 100
    
    const bestTrade = [...weekTrades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))[0]
    const worstTrade = [...weekTrades].sort((a, b) => (a.pnl || 0) - (b.pnl || 0))[0]

    return {
      totalPnl,
      winRate,
      tradeCount: weekTrades.length,
      bestSymbol: bestTrade?.symbol,
      worstSymbol: worstTrade?.symbol
    }
  }, [trades])

  if (!weeklyStats) return null

  return (
    <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--bg-card), rgba(139, 92, 246, 0.03))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Calendar size={16} color="var(--accent-bright)" />
        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>WEEKLY REVIEW</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>WEEKLY P&L</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: weeklyStats.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {weeklyStats.totalPnl >= 0 ? '+' : '-'}${Math.abs(weeklyStats.totalPnl).toLocaleString()}
            </div>
        </div>
        <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>WIN RATE</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)' }}>{weeklyStats.winRate.toFixed(0)}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
            <Award size={12} color="var(--green)"/>
            <span style={{ color: 'var(--text-secondary)' }}>Best Asset: <strong>{weeklyStats.bestSymbol}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
            <AlertCircle size={12} color="var(--red)"/>
            <span style={{ color: 'var(--text-secondary)' }}>Focus Area: <strong>{weeklyStats.worstSymbol}</strong></span>
        </div>
      </div>
    </div>
  )
}
