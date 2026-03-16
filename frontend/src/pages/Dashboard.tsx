import { useAppStore, View, Trade } from '../store/app'
import PerformanceCalendar from '../components/PerformanceCalendar'
import NovatrixScore from '../components/NovatrixScore'
import PerformanceRadar from '../components/PerformanceRadar'
import CumulativePnL from '../components/CumulativePnL'
import LiveWatchlist from '../components/LiveWatchlist'
import RiskMonitor from '../components/RiskMonitor'
import SessionAnalysis from '../components/SessionAnalysis'
import DrawdownProtector from '../components/DrawdownProtector'
import WeeklyReview from '../components/WeeklyReview'
import TradeDetailModal from '../components/TradeDetailModal'
import NextSessionWidget from '../components/NextSessionWidget'
import { TrendingUp, Percent, Layers, Activity, ShieldAlert, Target } from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const { trades = [], setView, marketQuotes = [], fetchMarketQuotes } = useAppStore()
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

  useEffect(() => {
    fetchMarketQuotes()
    const interval = setInterval(fetchMarketQuotes, 60000)
    return () => clearInterval(interval)
  }, [fetchMarketQuotes])

  const stats = useMemo(() => {
    if (!Array.isArray(trades)) return { totalPnl: 0, winRate: '0', profitFactor: '0', expectancy: '0', sharpeRatio: '0', totalTrades: 0 };
    const closedTrades = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losses = closedTrades.filter(t => (t.pnl || 0) <= 0)
    
    const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0
    const grossProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0)
    const expectancy = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0

    const returns = closedTrades.map(t => t.pnl || 0)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1)
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length || 1)
    const stdDev = Math.sqrt(variance)
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0

    return {
      totalPnl,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      expectancy: expectancy.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      totalTrades: closedTrades.length,
    }
  }, [trades])

  const kpis = [
    { label: 'TOTAL P&L',     value: `${stats.totalPnl >= 0 ? '+' : '-'}$${Math.abs(stats.totalPnl).toLocaleString()}`, color: stats.totalPnl >= 0 ? 'var(--green)' : 'var(--red)', icon: <TrendingUp size={14}/>, target: 'analytics' as View },
    { label: 'PROFIT FACTOR', value: stats.profitFactor, color: Number(stats.profitFactor) >= 1.5 ? 'var(--green)' : 'var(--accent-bright)', icon: <Activity size={14}/>, target: 'analytics' as View },
    { label: 'SHARPE RATIO',  value: stats.sharpeRatio, color: Number(stats.sharpeRatio) >= 1 ? 'var(--green)' : 'var(--text-primary)', icon: <ShieldAlert size={14}/>, target: 'analytics' as View },
    { label: 'WIN RATE',      value: `${stats.winRate}%`, color: Number(stats.winRate) >= 50 ? 'var(--accent-bright)' : 'var(--red)', icon: <Percent size={14}/>, target: 'reports' as View },
    { label: 'EXPECTANCY',    value: `${stats.totalPnl >= 0 ? '+' : '-'}$${Math.abs(Number(stats.expectancy))}`, color: 'var(--text-primary)', icon: <Target size={14}/>, target: 'reports' as View },
    { label: 'TOTAL TRADES',  value: stats.totalTrades, color: 'var(--text-primary)', icon: <Layers size={14}/>, target: 'journal' as View },
  ]

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {kpis.map(m => (
          <div key={m.label} className="metric-card" onClick={() => setView(m.target)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                {m.icon} <span className="metric-label" style={{ marginBottom: 0 }}>{m.label}</span>
              </div>
            </div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}><PerformanceCalendar/></div>
                <SessionAnalysis />
            </div>
            <LiveWatchlist />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <NextSessionWidget />
          <PerformanceRadar />
          <NovatrixScore />
          <DrawdownProtector />
          <WeeklyReview />
          <RiskMonitor />
          <CumulativePnL/>
        </div>
      </div>

      <div className="card" style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase' }}>Live Market Interface</span>
          {marketQuotes.map(q => (
            <span key={q.symbol} style={{ background: 'var(--accent-dim)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '6px', padding: '0.25rem 0.625rem', fontWeight: 600, fontSize: '0.75rem' }}>
              {q.symbol}: {q.bid.toFixed(2)}
            </span>
          ))}
          {trades.filter(t => t.status === 'OPEN').map(p => (
            <span key={p.id} onClick={() => setSelectedTrade(p)} style={{
              background: (p.pnl || 0) >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
              border: `1px solid ${(p.pnl || 0) >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: (p.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)',
              borderRadius: '6px', padding: '0.25rem 0.625rem', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer'
            }}>
              {p.symbol} {(p.pnl || 0) >= 0 ? '+' : '-'}${Math.abs(p.pnl || 0).toFixed(2)}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
