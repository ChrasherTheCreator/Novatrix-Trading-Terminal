import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { BookOpen, Zap } from 'lucide-react'

export default function PlaybookEfficiency() {
  const { trades = [] } = useAppStore()

  const efficiencyData = useMemo(() => {
    if (!Array.isArray(trades)) return []
    const closed = trades.filter(t => t && t.status === 'CLOSED' && Array.isArray(t.tags))
    
    // Analyze rule frequency in winners vs losers
    const ruleStats: Record<string, { wins: number, total: number }> = {}

    closed.forEach(t => {
      const isWin = (t.pnl || 0) > 0
      t.tags.forEach(tag => {
        if (!ruleStats[tag]) ruleStats[tag] = { wins: 0, total: 0 }
        ruleStats[tag].total += 1
        if (isWin) ruleStats[tag].wins += 1
      })
    })

    return Object.entries(ruleStats)
      .map(([name, stats]) => ({
        name: name.replace(/[\[\]\"']/g, '').trim(),
        winRate: (stats.wins / stats.total) * 100,
        sampleSize: stats.total
      }))
      .filter(rule => rule.name.length > 0 && rule.name !== 'null')
      .sort((a, b) => b.winRate - a.winRate)
  }, [trades])

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <BookOpen size={18} color="var(--accent-bright)"/>
        <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>Playbook Rule Efficiency</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {efficiencyData.length > 0 ? efficiencyData.map(rule => (
          <div key={rule.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rule.name}</span>
              <span style={{ color: rule.winRate >= 50 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{rule.winRate.toFixed(1)}% WR</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ 
                width: `${rule.winRate}%`, 
                height: '100%', 
                background: rule.winRate >= 60 ? 'var(--green)' : (rule.winRate >= 40 ? 'var(--accent)' : 'var(--red)') 
              }}/>
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Applied in {rule.sampleSize} trades
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
            No rule data found. Tag your trades with playbook rules to see efficiency.
          </div>
        )}
      </div>

      {efficiencyData.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--green-dim)', borderRadius: '8px', border: '1px solid var(--green-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', marginBottom: '0.25rem' }}>
                <Zap size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>STRATEGY EDGE FOUND</span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Your highest probability setup is <strong>"{efficiencyData[0].name}"</strong>. 
                Consider increasing position size by 25% when this rule is met.
            </p>
        </div>
      )}
    </div>
  )
}
