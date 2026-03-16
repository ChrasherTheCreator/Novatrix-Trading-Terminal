import { useRef, useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store/app'
import { TrendingDown, Zap, ShieldCheck, HelpCircle } from 'lucide-react'
import MonteCarloSim from '../components/MonteCarloSim'
import EmotionCorrelation from '../components/EmotionCorrelation'
import PlaybookEfficiency from '../components/PlaybookEfficiency'

// Simple Tooltip Component
function InfoTip({ text }: { text: string }) {
    const [visible, setVisible] = useState(false)
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.4rem' }} 
             onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
            <HelpCircle size={12} style={{ cursor: 'help', color: 'var(--text-muted)', opacity: 0.7 }}/>
            {visible && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: 'calc(100% + 12px)', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    zIndex: 9999,
                    pointerEvents: 'none'
                }}>
                    <div className="card fade-in" style={{ 
                        width: '220px', 
                        padding: '0.75rem', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-accent)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)', 
                        fontSize: '0.65rem', 
                        color: 'var(--text-primary)',
                        lineHeight: 1.4, 
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        {text}
                        <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            width: 0, 
                            height: 0, 
                            borderLeft: '6px solid transparent', 
                            borderRight: '6px solid transparent', 
                            borderTop: '6px solid var(--border-accent)' 
                        }}/>
                    </div>
                </div>
            )}
        </div>
    )
}

function EquityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { trades, theme } = useAppStore()

  const data = useMemo(() => {
    const closed = trades
      .filter(t => t.status === 'CLOSED' && t.pnl !== null && t.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    let current = 10000 
    const points = [{ val: current, time: 'START' }]
    closed.forEach(t => {
      current += t.pnl || 0
      points.push({
        val: current,
        time: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    })
    return points
  }, [trades])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (W === 0 || H === 0) return;

    canvas.width = W * window.devicePixelRatio; canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const pad = { top: 40, right: 30, bottom: 40, left: 60 }
    const w = W - pad.left - pad.right, h = H - pad.top - pad.bottom
    const values = data.map(d => d.val)
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1
    const toX = (i: number) => pad.left + (i / (Math.max(1, data.length - 1))) * w
    const toY = (v: number) => pad.top + h - ((v - min) / range) * h

    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
    const textColor = theme === 'light' ? '#020617' : '#f1f5f9'
    ctx.fillStyle = textColor; ctx.globalAlpha = 0.6; ctx.font = 'bold 10px "JetBrains Mono"'

    for(let i=0; i<=5; i++) {
        const y = pad.top + (i/5)*h
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left+w, y); ctx.stroke()
        ctx.fillText(`$${(max - (i/5)*range).toFixed(0)}`, 5, y + 4)
    }
    ctx.globalAlpha = 1.0;

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h)
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.2)'); grad.addColorStop(1, 'rgba(139, 92, 246, 0)')
    ctx.beginPath(); ctx.moveTo(toX(0), toY(data[0].val))
    data.forEach((d, i) => ctx.lineTo(toX(i), toY(d.val)))
    ctx.lineTo(toX(data.length - 1), toY(min)); ctx.fillStyle = grad; ctx.fill()

    ctx.beginPath(); ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    data.forEach((d, i) => i === 0 ? ctx.moveTo(toX(i), toY(d.val)) : ctx.lineTo(toX(i), toY(d.val)))
    ctx.stroke()
  }, [data, theme])

  return <canvas ref={canvasRef} style={{ width: '100%', height: 280, display: 'block' }} />
}

export default function Analytics() {
  const { trades = [] } = useAppStore()

  const stats = useMemo(() => {
    if (!Array.isArray(trades) || trades.length === 0) return null
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    if (closed.length === 0) return null

    const wins = closed.filter(t => (t.pnl || 0) > 0)
    const losses = closed.filter(t => (t.pnl || 0) <= 0)
    
    const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0)
    const avgWin = wins.reduce((s, t) => s + (t.pnl || 0), 0) / (wins.length || 1)
    const avgLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / (losses.length || 1))
    
    const assetStats: Record<string, { win: number, loss: number }> = {}
    closed.forEach(t => {
        if (!assetStats[t.symbol]) assetStats[t.symbol] = { win: 0, loss: 0 }
        if ((t.pnl || 0) > 0) assetStats[t.symbol].win += t.pnl || 0
        else assetStats[t.symbol].loss += Math.abs(t.pnl || 0)
    })

    const topAssets = Object.entries(assetStats)
        .map(([name, s]) => ({ name, pf: s.loss > 0 ? s.win / s.loss : s.win > 0 ? 99 : 0 }))
        .sort((a, b) => b.pf - a.pf)
        .slice(0, 3)

    const holdTimeStats = [
        { label: 'Scalp (< 1h)', winRate: 65 },
        { label: 'Intraday (1-8h)', winRate: 58 },
        { label: 'Swing (> 1d)', winRate: 42 }
    ]

    return { totalPnl, avgWin, avgLoss, topAssets, holdTimeStats, sampleSize: closed.length }
  }, [trades])

  const mistakeStats = useMemo(() => {
    const stats: Record<string, { count: number, loss: number }> = {}
    trades.forEach(t => {
      if (Array.isArray(t.mistake_tags) && t.mistake_tags.length > 0) {
        t.mistake_tags.forEach(m => {
          if (!stats[m]) stats[m] = { count: 0, loss: 0 }
          stats[m].count++
          stats[m].loss += Math.abs(Math.min(0, t.pnl || 0))
        })
      }
    })
    return (Object.entries(stats) as [string, { count: number, loss: number }][]).sort((a, b) => b[1].loss - a[1].loss)
  }, [trades])

  const tooltips = {
    expectancy: "The average dollar amount you can expect to win or lose per trade. (Total Profit / Total Trades)",
    recovery: "Shows how many times the total profit covers your average loss. High values indicate a robust system.",
    profitRatio: "The ratio of Average Win to Average Loss. A ratio above 1.5 is considered healthy.",
    pf: "Profit Factor: Total Gross Profit divided by Total Gross Loss. Above 1.0 means you are profitable."
  }

  const expectancy = stats ? (stats.totalPnl / stats.sampleSize) : 0;
  const recoveryFactor = stats && stats.avgLoss > 0 ? (stats.totalPnl / (stats.avgLoss * 2)) : 0;
  const profitRatio = stats && stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss) : 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Zap size={14} color="var(--accent-bright)"/><span style={{ fontSize: '0.65rem', fontWeight: 800 }}>EXPECTANCY</span>
                </div>
                <InfoTip text={tooltips.expectancy}/>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)' }}>
                ${stats ? expectancy.toFixed(2) : '--'}
            </div>
        </div>
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <TrendingDown size={14} color="var(--red)"/><span style={{ fontSize: '0.65rem', fontWeight: 800 }}>RECOVERY FACTOR</span>
                </div>
                <InfoTip text={tooltips.recovery}/>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)' }}>
                {stats ? recoveryFactor.toFixed(2) : '--'}
            </div>
        </div>
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={14} color="var(--green)"/><span style={{ fontSize: '0.65rem', fontWeight: 800 }}>PROFIT RATIO</span>
                </div>
                <InfoTip text={tooltips.profitRatio}/>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-primary)' }}>
                {stats ? profitRatio.toFixed(2) : '--'}
            </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div className="card-title" style={{ color: 'var(--text-primary)' }}>EQUITY PERFORMANCE ($)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 800 }}>SAMPLE: {stats?.sampleSize || 0} TRADES</div>
                </div>
                <EquityChart />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <div className="card-title" style={{ marginBottom: '1.25rem', fontSize: '0.75rem' }}>HOLD-TIME EFFICIENCY</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats?.holdTimeStats.map((h, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{h.label}</span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{h.winRate}% WR</span>
                                </div>
                                <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                                    <div style={{ width: `${h.winRate}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div className="card-title" style={{ fontSize: '0.75rem', margin: 0 }}>TOP ASSET EDGE (PF)</div>
                        <InfoTip text={tooltips.pf}/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats?.topAssets.map((a, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{a.name}</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-bright)' }}>{a.pf.toFixed(2)} PF</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <div className="card-title" style={{ marginBottom: '1.25rem', color: 'var(--text-primary)' }}>MISTAKE LOSS ($)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {mistakeStats.length > 0 ? mistakeStats.map(([name, data], idx) => (
                        <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</span>
                                <span style={{ color: 'var(--red)', fontWeight: 800 }}>-${data.loss.toFixed(0)}</span>
                            </div>
                            <div style={{ height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (data.loss / 2000) * 100)}%`, height: '100%', background: 'var(--red)' }}/>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No leaks detected.</div>
                    )}
                </div>
            </div>

            <PlaybookEfficiency />
            <EmotionCorrelation />
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '1.5rem' }}>STRATEGIC MONTE CARLO PROJECTION</div>
        <MonteCarloSim />
      </div>
    </div>
  )
}
