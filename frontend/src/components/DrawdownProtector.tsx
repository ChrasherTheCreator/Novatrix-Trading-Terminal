import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { ShieldAlert, Lock } from 'lucide-react'

export default function DrawdownProtector() {
  const { trades, accounts } = useAppStore()

  const ddStats = useMemo(() => {
    const account = accounts[0]
    if (!account) return null

    const closed = trades
      .filter(t => t.status === 'CLOSED' && t.pnl !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    let currentBalance = parseFloat(account.size.replace(/[$,]/g, '')) || 50000
    let peak = currentBalance
    let maxDD = 0
    let currentDD = 0

    closed.forEach(t => {
      currentBalance += t.pnl || 0
      if (currentBalance > peak) peak = currentBalance
      
      const dd = ((peak - currentBalance) / peak) * 100
      if (dd > maxDD) maxDD = dd
      currentDD = dd
    })

    const limit = parseFloat(account.maxDD || '') || 10
    
    return {
      currentDD,
      maxDD,
      limit,
      isWarning: currentDD >= limit * 0.7,
      isCritical: currentDD >= limit * 0.9
    }
  }, [trades, accounts])

  if (!ddStats) return null

  return (
    <div className="card" style={{ 
        border: ddStats.isCritical ? '1px solid var(--red)' : (ddStats.isWarning ? '1px solid var(--orange)' : '1px solid var(--border-subtle)'),
        background: ddStats.isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {ddStats.isCritical ? <Lock size={16} color="var(--red)"/> : <ShieldAlert size={16} color="var(--accent-bright)"/>}
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>EQUITY DRAWDOWN</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)' }}>MAX LIMIT: {ddStats.limit}%</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Current Relative DD</span>
        <span style={{ color: ddStats.isWarning ? 'var(--orange)' : 'white', fontWeight: 700 }}>
            {ddStats.currentDD.toFixed(2)}%
        </span>
      </div>

      <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ 
            width: `${Math.min(100, (ddStats.currentDD / ddStats.limit) * 100)}%`, 
            height: '100%', 
            background: ddStats.isCritical ? 'var(--red)' : (ddStats.isWarning ? 'var(--orange)' : 'var(--accent)') 
        }}/>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.625rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Peak Drawdown this period: {ddStats.maxDD.toFixed(2)}%
      </div>
    </div>
  )
}
