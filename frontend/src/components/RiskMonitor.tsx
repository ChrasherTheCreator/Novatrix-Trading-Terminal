import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react'

export default function RiskMonitor() {
  const { trades, riskSettings, accounts } = useAppStore()

  const riskStatus = useMemo(() => {
    const account = accounts[0]
    if (!account) return null

    const accountSize = parseFloat(account.size.replace(/[$,]/g, '')) || 100000
    const maxDailyLoss = (parseFloat(riskSettings.dailyDD) / 100) * accountSize

    // Calculate today's PnL
    const today = new Date().toISOString().split('T')[0]
    const todayTrades = trades.filter(t => t.status === 'CLOSED' && t.created_at.startsWith(today))
    const todayPnl = todayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0)

    const usagePercent = Math.min(100, (Math.abs(Math.min(0, todayPnl)) / maxDailyLoss) * 100)
    
    return {
      todayPnl,
      maxDailyLoss,
      usagePercent,
      isWarning: usagePercent > 70,
      isCritical: usagePercent > 90
    }
  }, [trades, riskSettings, accounts])

  if (!riskStatus) return null

  return (
    <div className="card" style={{ 
        border: riskStatus.isCritical ? '1px solid var(--red)' : (riskStatus.isWarning ? '1px solid var(--orange)' : '1px solid var(--border-subtle)'),
        background: riskStatus.isCritical ? 'var(--red-dim)' : 'transparent'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {riskStatus.isCritical ? <ShieldAlert size={16} color="var(--red)"/> : (riskStatus.isWarning ? <AlertTriangle size={16} color="var(--orange)"/> : <CheckCircle size={16} color="var(--green)"/>)}
          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>EQUITY PROTECTOR</span>
        </div>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)' }}>DAILY LIMIT: ${riskStatus.maxDailyLoss.toLocaleString()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Today's Realized P&L</span>
        <span style={{ color: riskStatus.todayPnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            {riskStatus.todayPnl >= 0 ? '+' : ''}${riskStatus.todayPnl.toLocaleString()}
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ 
            width: `${riskStatus.usagePercent}%`, 
            height: '100%', 
            background: riskStatus.isCritical ? 'var(--red)' : (riskStatus.isWarning ? 'var(--orange)' : 'var(--accent)') 
        }}/>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
        <span>Daily DD Usage</span>
        <span>{riskStatus.usagePercent.toFixed(1)}%</span>
      </div>

      {riskStatus.isCritical && (
        <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', color: 'var(--red)', fontSize: '0.6875rem', fontWeight: 600, textAlign: 'center' }}>
            STOP TRADING: Daily Loss Limit Reached!
        </div>
      )}
    </div>
  )
}
