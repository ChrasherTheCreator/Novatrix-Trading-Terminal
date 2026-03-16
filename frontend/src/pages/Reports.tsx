import { useMemo, useState } from 'react'
import { useAppStore } from '../store/app'
import { Download, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import TradeDetailModal from '../components/TradeDetailModal'
import { AnimatePresence } from 'framer-motion'
import { downloadCSV } from '../lib/exportUtils'
import { Select } from '../components/ui/Select'

export default function Reports() {
  const { trades } = useAppStore()
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [strategyFilter, setStrategyFilter] = useState('ALL')

  const selectedTrade = useMemo(() => 
    trades.find(t => t.id === selectedTradeId) || null
  , [trades, selectedTradeId])

  const closedTrades = useMemo(() => {
    let list = [...trades].filter(t => t.status === 'CLOSED');
    
    if (strategyFilter !== 'ALL') {
        list = list.filter(t => (t.strategy || 'Uncategorized') === strategyFilter);
    }
    
    return list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [trades, strategyFilter])

  const stats = useMemo(() => {
    const symbolMap: Record<string, number> = {}
    const strategyMap: Record<string, { wins: number, total: number }> = {}

    // Calculate overall strategy stats (regardless of filter for the edge analysis card)
    const allClosed = trades.filter(t => t.status === 'CLOSED');
    allClosed.forEach(t => {
        const strat = t.strategy || 'Uncategorized'
        if (!strategyMap[strat]) strategyMap[strat] = { wins: 0, total: 0 }
        strategyMap[strat].total++
        if ((t.pnl || 0) > 0) strategyMap[strat].wins++
    })

    closedTrades.forEach(t => { 
        symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + (t.pnl || 0) 
    })

    return { 
        symbolData: Object.entries(symbolMap).sort((a, b) => b[1] - a[1]),
        strategyData: Object.entries(strategyMap).map(([name, s]) => ({
            name,
            winRate: (s.wins / s.total) * 100,
            total: s.total
        })),
        uniqueStrategies: ['ALL', ...Object.keys(strategyMap)]
    }
  }, [trades, closedTrades])

  const handleExport = () => {
    downloadCSV(closedTrades, `novatrix_report_${strategyFilter.toLowerCase()}`)
    toast.success('Filtered trade history exported')
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Performance Reports</h1>
            <Select 
                value={strategyFilter} 
                onChange={setStrategyFilter}
                options={stats.uniqueStrategies.map(s => ({ value: s, label: s }))}
                label="Strategy"
                width="200px"
            />
        </div>
        <button onClick={handleExport} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
            <Download size={14}/> EXPORT CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Performance by Asset</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.symbolData.map(([symbol, pnl]) => (
              <div key={symbol}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{symbol}</span>
                  <span style={{ color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                    {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (Math.abs(pnl) / 2000) * 100)}%`, height: '100%', background: pnl >= 0 ? '#10b981' : '#ef4444' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Strategy Edge Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats.strategyData.map(strat => (
              <div key={strat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{strat.name}</span>
                  <span style={{ color: 'var(--accent-bright)', fontWeight: 800 }}>{strat.winRate.toFixed(1)}% WR</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                  <div style={{ width: `${strat.winRate}%`, height: '100%', background: 'var(--accent)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Execution Audit Log</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '1rem' }}>ASSET</th>
                <th style={{ textAlign: 'left', padding: '1rem' }}>SIDE</th>
                <th style={{ textAlign: 'left', padding: '1rem' }}>STRATEGY</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>ENTRY</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>EXIT</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>PROFIT ($)</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>PROFIT (%)</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {closedTrades.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setSelectedTradeId(t.id)}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.symbol}</td>
                  <td style={{ padding: '1rem' }}><span style={{ color: t.side === 'LONG' ? '#10b981' : '#ef4444', fontWeight: 800 }}>{t.side}</span></td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: 'var(--accent-dim)', color: 'var(--accent-bright)', borderRadius: '4px' }}>
                        {t.strategy || 'UNCATEGORIZED'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>${t.entry_price.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>${t.exit_price?.toLocaleString() || '--'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: (t.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {(t.pnl || 0) >= 0 ? '+' : '-'}${Math.abs(t.pnl || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: (t.pnl_pct || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    {(t.pnl_pct || 0) >= 0 ? '+' : '-'}{(t.pnl_pct || 0).toFixed(2)}%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="icon-btn" style={{ padding: '0.4rem', background: 'var(--accent-dim)', color: 'var(--accent-bright)', borderRadius: '6px', border: 'none' }}>
                        <Edit3 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailModal 
            trade={selectedTrade} 
            onClose={() => setSelectedTradeId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
