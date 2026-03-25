import { useState, useMemo, useRef, useEffect } from 'react'
import { RefreshCw, Save, Download, ShieldAlert, Zap, AlertTriangle, HelpCircle, Settings2 } from 'lucide-react'
import { useAppStore } from '../store/app'
import { Button } from '../components/ui/Button'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Tooltip Component with fixed centering logic
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
                        width: '200px', 
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

export default function StrategyOptimization() {
  const { trades, theme, addScenario } = useAppStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const [isStressTest, setIsStressTest] = useState(false)
  const [params, setParams] = useState({
    startBalance: 10000,
    numTrades: 200,
    numSimulations: 100,
    winRate: 55,
    avgWin: 450,
    avgLoss: 250
  })

  const [debouncedParams, setDebouncedParams] = useState(params)
  const [scenarioName, setScenarioName] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const activeParams = useMemo(() => {
    if (!isStressTest) return debouncedParams
    return {
        ...debouncedParams,
        winRate: Math.max(1, debouncedParams.winRate - 5),
        avgWin: debouncedParams.avgWin * 0.9,
        avgLoss: debouncedParams.avgLoss * 1.1
    }
  }, [debouncedParams, isStressTest])

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedParams(params) }, 300)
    return () => clearTimeout(timer)
  }, [params])

  useEffect(() => {
    const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)
    if (closed.length >= 5) {
        const wins = closed.filter(t => (t.pnl || 0) > 0)
        const losses = closed.filter(t => (t.pnl || 0) <= 0)
        const wr = (wins.length / closed.length) * 100
        const aw = wins.reduce((s, t) => s + (t.pnl || 0), 0) / (wins.length || 1)
        const al = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / (losses.length || 1))
        setParams(prev => ({ ...prev, winRate: Math.round(wr), avgWin: Math.round(aw), avgLoss: Math.round(al) }))
    }
  }, [trades])

  const simData = useMemo(() => {
    const allPaths: number[][] = []
    const wr = activeParams.winRate / 100
    for (let s = 0; s < activeParams.numSimulations; s++) {
      const path = [activeParams.startBalance]
      let balance = activeParams.startBalance
      for (let t = 0; t < activeParams.numTrades; t++) {
        balance += Math.random() < wr ? activeParams.avgWin : -activeParams.avgLoss
        path.push(balance)
      }
      allPaths.push(path)
    }
    return allPaths
  }, [activeParams])

  const advancedStats = useMemo(() => {
    const wr = activeParams.winRate / 100
    const lr = 1 - wr
    const b = activeParams.avgWin / (activeParams.avgLoss || 1)
    const kelly = ((b * wr) - lr) / b
    const streak10 = Math.pow(lr, 10) * 100
    const finalValues = simData.map(path => path[path.length - 1])
    const best = Math.max(...finalValues)
    const worst = Math.min(...finalValues)
    const probSuccess = (finalValues.filter(v => v > activeParams.startBalance).length / activeParams.numSimulations) * 100
    const recoveryTrades: number[] = []
    simData.forEach(path => {
        let peak = path[0], inDrawdown = false, count = 0
        path.forEach(v => {
            if (v > peak) { if (inDrawdown) { recoveryTrades.push(count); inDrawdown = false; count = 0; } peak = v }
            else { inDrawdown = true; count++ }
        })
    })
    const avgRecovery = recoveryTrades.length > 0 ? (recoveryTrades.reduce((a,b)=>a+b,0) / recoveryTrades.length).toFixed(1) : '---'
    return { kelly: Math.max(0, kelly * 100).toFixed(1), streak10: streak10.toFixed(1), avgRecovery, probSuccess, best, worst }
  }, [simData, activeParams])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !simData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    canvas.width = W * window.devicePixelRatio; canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const pad = { top: 40, right: 20, bottom: 40, left: 70 }
    const w = W - pad.left - pad.right, h = H - pad.top - pad.bottom
    const allValues = simData.flat()
    const min = Math.min(...allValues), max = Math.max(...allValues), r = max - min || 1
    const toX = (i: number) => pad.left + (i / activeParams.numTrades) * w
    const toY = (v: number) => pad.top + h - ((v - min) / r) * h
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
    const textColor = theme === 'light' ? '#020617' : '#f1f5f9';
    ctx.fillStyle = textColor; ctx.font = 'bold 10px "JetBrains Mono"'
    for(let i=0; i<=10; i++) {
        const y = pad.top + (i/10)*h
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke()
        const val = max - (i/10)*r
        ctx.globalAlpha = 0.4; ctx.fillText(`$${Math.round(val).toLocaleString()}`, 5, y + 4)
    }
    simData.forEach((path) => {
      ctx.beginPath()
      path.forEach((v, i) => { const x = toX(i), y = toY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); })
      const final = path[path.length - 1]
      ctx.globalAlpha = isStressTest ? 0.05 : 0.1
      ctx.strokeStyle = final > activeParams.startBalance ? '#10b981' : '#ef4444'
      ctx.lineWidth = 1; ctx.stroke()
    })
    ctx.globalAlpha = 1.0
  }, [simData, activeParams, theme, isStressTest])

  const handleSaveScenario = () => {
    if (!scenarioName) return toast.error("Please enter a name")
    addScenario({
        id: Math.random().toString(36).substr(2, 9),
        name: scenarioName.toUpperCase(),
        params: { ...params },
        stats: { best: advancedStats.best, worst: advancedStats.worst, avg: 0, probSuccess: advancedStats.probSuccess }
    })
    setScenarioName(''); toast.success("Scenario saved")
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)
    const loading = toast.loading("Generating PDF...")
    try {
        const canvas = await html2canvas(reportRef.current, { backgroundColor: theme === 'light' ? '#f8fafc' : '#0a0a12', scale: 2 })
        const pdf = new jsPDF('l', 'mm', 'a4')
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, (canvas.height * 297) / canvas.width)
        pdf.save(`Strategy_Audit_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.dismiss(loading); toast.success("Exported")
    } catch (_e) { toast.dismiss(loading); toast.error("Export failed") } finally { setIsExporting(false) }
  }

  const tooltips: Record<string, string> = {
    startBalance: "Initial capital available for this simulation.",
    numTrades: "How many trades into the future the simulation projects.",
    numSimulations: "Number of parallel 'alternative universes' to calculate.",
    winRate: "Historical percentage of winning trades.",
    avgWin: "Average dollar amount gained on winning trades.",
    avgLoss: "Average dollar amount lost on losing trades.",
    kelly: "Optimal risk % to maximize long-term growth.",
    recovery: "Avg trades to recover from drawdown to new high.",
    streak: "Prob of losing 10 trades in a row.",
    success: "Percentage of paths ending in profit.",
    best: "Highest equity reached among all simulated paths.",
    worst: "Lowest equity reached among all simulated paths."
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Strategy Optimization</h1>
            <button onClick={() => setIsStressTest(!isStressTest)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, background: isStressTest ? '#ef4444' : 'var(--bg-secondary)', color: isStressTest ? 'var(--text-static-white)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                <ShieldAlert size={14}/> {isStressTest ? 'STRESS TEST ACTIVE' : 'RUN STRESS TEST'}
            </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.25rem' }}>
                <input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Scenario Name..." style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', outline: 'none', width: '150px' }} />
                <Button onClick={handleSaveScenario} size="sm"><Save size={14}/> SAVE</Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportPDF}><Download size={14}/> PDF</Button>
            <Button variant="outline" size="sm" onClick={() => setDebouncedParams({...params})}><RefreshCw size={14}/></Button>
        </div>
      </div>

      <div ref={reportRef} style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}><Settings2 size={18}/><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>MODEL PARAMETERS</span></div>
                {[
                    { label: 'Start Balance ($)', key: 'startBalance', min: 1000, max: 100000, step: 1000 },
                    { label: 'Simulation Horizon (Trades)', key: 'numTrades', min: 10, max: 1000, step: 10 },
                    { label: 'Sample Count (Simulations)', key: 'numSimulations', min: 10, max: 500, step: 10 },
                    { label: 'Win Rate (%)', key: 'winRate', min: 1, max: 99, step: 1 },
                    { label: 'Avg Win Amount ($)', key: 'avgWin', min: 10, max: 10000, step: 10 },
                    { label: 'Avg Loss Amount ($)', key: 'avgLoss', min: 10, max: 10000, step: 10 }
                ].map(p => (
                    <div key={p.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}><span className="metric-label" style={{ fontSize: '0.6rem' }}>{p.label}</span><InfoTip text={(tooltips as any)[p.key]}/></div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{(params as any)[p.key]}</span>
                        </div>
                        {!isExporting && <input type="range" min={p.min} max={p.max} step={p.step} value={(params as any)[p.key]} onChange={e => setParams({...params, [p.key]: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--accent)' }} />}
                    </div>
                ))}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: isStressTest ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}><Zap size={16}/><span style={{ fontSize: '0.7rem', fontWeight: 800 }}>ADVANCED METRICS</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Kelly Criterion:</span><InfoTip text={tooltips.kelly}/></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green)' }}>{advancedStats.kelly}% Risk</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Avg Recovery:</span><InfoTip text={tooltips.recovery}/></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-bright)' }}>{advancedStats.avgRecovery} TR</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>10-Loss Streak:</span><InfoTip text={tooltips.streak}/></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--red)' }}>{advancedStats.streak10}%</span>
                    </div>
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1, padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div className="card-title" style={{ color: 'var(--text-primary)', margin: 0 }}>MONTE CARLO EQUITY PROJECTION</div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>SUCCESS PROBABILITY</div><InfoTip text={tooltips.success}/></div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: advancedStats.probSuccess > 50 ? 'var(--green)' : 'var(--red)' }}>{advancedStats.probSuccess.toFixed(1)}%</div>
                    </div>
                </div>
                <canvas ref={canvasRef} style={{ width: '100%', flex: 1, display: 'block' }}/>
                {isStressTest && (
                    <div style={{ position: 'absolute', top: '15%', right: '2rem', background: '#ef4444', color: 'var(--text-static-white)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={14}/> STRESS TEST ACTIVE
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>BEST CASE</div><InfoTip text={tooltips.best}/></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--green)' }}>${Math.round(advancedStats.best).toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>WORST CASE</div><InfoTip text={tooltips.worst}/></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--red)' }}>${Math.round(advancedStats.worst).toLocaleString()}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>AVG RECOVERY</div><InfoTip text={tooltips.recovery}/></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{advancedStats.avgRecovery} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>TR</span></div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}><div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>KELLY UNIT</div><InfoTip text={tooltips.kelly}/></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-bright)' }}>{advancedStats.kelly}%</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
