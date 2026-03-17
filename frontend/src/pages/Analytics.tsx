import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useAppStore } from '../store/app'
import { TrendingDown, Zap, ShieldCheck, HelpCircle, Activity, BarChart3, ArrowUpCircle, Target } from 'lucide-react'
import MonteCarloSim from '../components/MonteCarloSim'
import EmotionCorrelation from '../components/EmotionCorrelation'
import PlaybookEfficiency from '../components/PlaybookEfficiency'

// Helper for "Nice" Round Numbers on Axis
const getNiceScale = (min: number, max: number, ticks: number = 5) => {
    const range = max - min || 1;
    const step = range / ticks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(step)));
    const normalizedStep = step / magnitude;
    
    let niceStep;
    if (normalizedStep < 1.5) niceStep = 1;
    else if (normalizedStep < 3) niceStep = 2;
    else if (normalizedStep < 7) niceStep = 5;
    else niceStep = 10;
    
    niceStep *= magnitude;
    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;
    
    const scalePoints = [];
    for (let v = niceMin; v <= niceMax + (niceStep/2); v += niceStep) {
        scalePoints.push(v);
    }
    return { points: scalePoints, min: niceMin, max: niceMax };
}

// Simple Tooltip Component (Stateless for general UI)
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

interface ChartPoint {
    val: number
    time: string
    dateLabel: string
    isNewDay: boolean
    xPct: number // Normalized horizontal position 0-1
}

function EquityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { trades, theme } = useAppStore()
  const hoverRef = useRef({ mx: 0, my: 0, active: false, snapIdx: null as number | null })

  const data = useMemo(() => {
    const closed = trades
      .filter(t => t.status === 'CLOSED' && t.pnl !== null && t.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    if (closed.length === 0) return []

    // Group by day to ensure equal spacing
    const daysMap = new Map<string, any[]>()
    closed.forEach(t => {
        const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!daysMap.has(dateStr)) daysMap.set(dateStr, [])
        daysMap.get(dateStr)?.push(t)
    })

    const uniqueDays = Array.from(daysMap.keys())
    const totalDays = uniqueDays.length
    let currentPnl = 10000
    const points: ChartPoint[] = []

    // Initial point
    points.push({ val: 10000, time: 'START', dateLabel: uniqueDays[0], isNewDay: true, xPct: 0 })

    uniqueDays.forEach((dateStr, dIdx) => {
        const tradesInDay = daysMap.get(dateStr) || []
        const dayStartPct = dIdx / totalDays
        const dayWidthPct = 1 / totalDays

        tradesInDay.forEach((t, tIdx) => {
            currentPnl += t.pnl || 0
            const d = new Date(t.created_at)
            const internalPct = (tIdx + 1) / tradesInDay.length
            points.push({
                val: currentPnl,
                time: d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                dateLabel: dateStr,
                isNewDay: tIdx === 0,
                xPct: dayStartPct + (internalPct * dayWidthPct)
            })
        })
    })
    return points
  }, [trades])

  const geom = useMemo(() => {
    if (data.length === 0) return null
    const values = data.map(d => d.val)
    const scale = getNiceScale(Math.min(...values), Math.max(...values), 6)
    return { scale, range: scale.max - scale.min || 1 }
  }, [data])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas || !geom) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr }
    ctx.resetTransform(); ctx.scale(dpr, dpr)
    const pad = { top: 40, right: 30, bottom: 50, left: 60 }, w = W - pad.left - pad.right, h = H - pad.top - pad.bottom
    const { scale, range } = geom
    const toX = (p: ChartPoint) => pad.left + p.xPct * w
    const toY = (v: number) => pad.top + h - ((v - scale.min) / range) * h

    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.fillStyle = '#fff'; ctx.font = '10px "JetBrains Mono"'
    
    // Y-Grid
    scale.points.forEach(v => {
        const y = toY(v); ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left+w, y); ctx.stroke()
        ctx.fillText(`$${v.toLocaleString()}`, 5, y + 4)
    })

    // X-Axis
    const uniqueDays = Array.from(new Set(data.map(d => d.dateLabel))).filter(Boolean)
    const labelStep = Math.ceil(uniqueDays.length / (w / 80))
    uniqueDays.forEach((label, idx) => {
        if (idx % labelStep === 0) {
            const x = pad.left + (idx / uniqueDays.length) * w
            ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + h); ctx.stroke(); ctx.setLineDash([])
            ctx.fillText(label, x + 5, pad.top + h + 25)
        }
    })

    // Line
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h)
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.15)'); grad.addColorStop(1, 'rgba(139, 92, 246, 0)')
    ctx.beginPath(); ctx.moveTo(toX(data[0]), toY(data[0].val))
    data.forEach(d => ctx.lineTo(toX(d), toY(d.val)))
    ctx.lineTo(pad.left + w, pad.top + h); ctx.lineTo(pad.left, pad.top + h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    data.forEach((d, i) => i === 0 ? ctx.moveTo(toX(d), toY(d.val)) : ctx.lineTo(toX(d), toY(d.val))); ctx.stroke()

    // Hover
    const { mx, my, active, snapIdx } = hoverRef.current
    if (active) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, pad.top + h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(pad.left, my); ctx.lineTo(pad.left + w, my); ctx.stroke(); ctx.setLineDash([])
        if (snapIdx !== null) {
            const d = data[snapIdx], sx = toX(d), sy = toY(d.val)
            ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.fill()
            ctx.beginPath(); ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.stroke()
            const tw = 140, th = 40, tx = Math.max(pad.left, Math.min(sx - tw/2, pad.left + w - tw)), ty = sy - th - 15
            ctx.fillStyle = 'rgba(10, 10, 18, 0.95)'; ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 4); ctx.fill(); ctx.stroke()
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px "JetBrains Mono"'; ctx.fillText(d.time, tx + 8, ty + 15)
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "JetBrains Mono"'; ctx.fillText(`$${d.val.toLocaleString()}`, tx + 8, ty + 30)
        }
    }
  }, [data, geom, theme])

  useEffect(() => { 
    let frameId: number; const loop = () => { draw(); frameId = requestAnimationFrame(loop) }; loop()
    return () => cancelAnimationFrame(frameId)
  }, [draw])

  return (
    <canvas ref={canvasRef} onMouseMove={(e) => {
        const rect = canvasRef.current?.getBoundingClientRect(); if (!rect || !geom) return
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const pad = { left: 60, right: 30, top: 40, bottom: 50 }, w = rect.width - pad.left - pad.right, h = rect.height - pad.top - pad.bottom
        let snapIdx = null, minDist = 40
        data.forEach((d, i) => {
            const sx = pad.left + d.xPct * w, sy = pad.top + h - ((d.val - geom.scale.min) / geom.range) * h
            const dist = Math.sqrt(Math.pow(mx-sx, 2) + Math.pow(my-sy, 2))
            if (dist < minDist) { minDist = dist; snapIdx = i }
        })
        hoverRef.current = { mx, my, active: true, snapIdx }
    }} onMouseLeave={() => hoverRef.current.active = false}
    style={{ width: '100%', height: 280, display: 'block', cursor: 'crosshair' }} />
  )
}

function DrawdownChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { trades, theme } = useAppStore()
    const hoverRef = useRef({ mx: 0, my: 0, active: false, snapIdx: null as number | null })
  
    const data = useMemo(() => {
      const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl !== null && t.created_at).sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime())
      if (closed.length === 0) return []
      const daysMap = new Map<string, any[]>()
      closed.forEach(t => {
          const dateStr = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          if (!daysMap.has(dateStr)) daysMap.set(dateStr, [])
          daysMap.get(dateStr)?.push(t)
      })
      const uniqueDays = Array.from(daysMap.keys()), totalDays = uniqueDays.length
      let cur = 10000, maxEq = 10000
      const points: ChartPoint[] = [{ val: 0, time: 'START', dateLabel: uniqueDays[0], isNewDay: true, xPct: 0 }]
      uniqueDays.forEach((dateStr, dIdx) => {
          const tradesInDay = daysMap.get(dateStr) || []
          tradesInDay.forEach((t, tIdx) => {
              cur += t.pnl || 0; if (cur > maxEq) maxEq = cur
              const dd = maxEq > 0 ? ((maxEq - cur) / maxEq) * 100 : 0
              points.push({ val: dd, time: new Date(t.created_at).toLocaleTimeString(), dateLabel: dateStr, isNewDay: tIdx === 0, xPct: (dIdx / totalDays) + ((tIdx+1)/tradesInDay.length * (1/totalDays)) })
          })
      })
      return points
    }, [trades])

    const geom = useMemo(() => {
        if (data.length === 0) return null
        const maxVal = Math.max(...data.map(d => d.val), 1), scale = getNiceScale(0, maxVal, 4)
        return { scale, range: scale.max || 1 }
    }, [data])
  
    const draw = useCallback(() => {
      const canvas = canvasRef.current; if (!canvas || !geom) return
      const ctx = canvas.getContext('2d'); if (!ctx) return
      const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight
      if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr }
      ctx.resetTransform(); ctx.scale(dpr, dpr)
      const pad = { top: 20, right: 30, bottom: 40, left: 50 }, w = W - pad.left - pad.right, h = H - pad.top - pad.bottom
      const { scale, range } = geom
      const toX = (p: ChartPoint) => pad.left + p.xPct * w
      const toY = (v: number) => pad.top + (v / range) * h
  
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.fillStyle = '#fff'; ctx.font = '9px "JetBrains Mono"'
      scale.points.forEach(v => {
          const y = toY(v); ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left+w, y); ctx.stroke()
          ctx.fillText(`${v.toFixed(1)}%`, 5, y + 3)
      })

      const uniqueDays = Array.from(new Set(data.map(d => d.dateLabel))).filter(Boolean)
      const labelStep = Math.ceil(uniqueDays.length / (w / 70))
      uniqueDays.forEach((label, idx) => { if (idx % labelStep === 0) {
          const x = pad.left + (idx / uniqueDays.length) * w
          ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + h); ctx.stroke(); ctx.setLineDash([])
          ctx.fillText(label, x + 5, pad.top + h + 20) 
      }})
  
      ctx.beginPath(); ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; ctx.moveTo(toX(data[0]), pad.top)
      data.forEach(d => ctx.lineTo(toX(d), toY(d.val)))
      ctx.lineTo(pad.left + w, pad.top); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5
      data.forEach(d => ctx.lineTo(toX(d), toY(d.val))); ctx.stroke()

      const { mx, my, active, snapIdx } = hoverRef.current
      if (active) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, pad.top + h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(pad.left, my); ctx.lineTo(pad.left+w, my); ctx.stroke(); ctx.setLineDash([])
        if (snapIdx !== null) {
            const d = data[snapIdx], sx = toX(d), sy = toY(d.val)
            ctx.beginPath(); ctx.fillStyle = '#ef4444'; ctx.arc(sx, sy, 4, 0, Math.PI*2); ctx.fill()
            
            // FANCY DRAWDOWN TOOLTIP - ALWAYS BELOW
            const tw = 85, th = 30, tx = Math.max(pad.left, Math.min(sx - tw/2, pad.left + w - tw)), ty = sy + 12
            
            ctx.save()
            ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.4)'
            ctx.fillStyle = 'rgba(10, 10, 18, 0.98)'; ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; ctx.lineWidth = 1
            ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 6); ctx.fill(); ctx.stroke()
            ctx.restore()

            // Tooltip Content: Double Size % only (Matching header size logic)
            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "JetBrains Mono"'; ctx.textAlign = 'center'
            ctx.fillText(`-${d.val.toFixed(2)}%`, tx + tw/2, ty + 20)
            ctx.textAlign = 'left'
            
            // Indicator Arrow
            ctx.fillStyle = 'rgba(10, 10, 18, 0.98)'; ctx.beginPath(); ctx.moveTo(sx, ty); ctx.lineTo(sx - 5, ty - 5); ctx.lineTo(sx + 5, ty - 5); ctx.closePath(); ctx.fill()
        }
      }
    }, [data, geom, theme])

    useEffect(() => { 
        let frameId: number; const loop = () => { draw(); frameId = requestAnimationFrame(loop) }; loop()
        return () => cancelAnimationFrame(frameId)
    }, [draw])

    return (
        <canvas ref={canvasRef} onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect(); if (!rect || !geom) return
            const mx = e.clientX - rect.left, my = e.clientY - rect.top
            const pad = { left: 50, right: 30, top: 20, bottom: 40 }, w = rect.width - pad.left - pad.right, h = rect.height - 60
            let snapIdx = null, minDist = 30
            data.forEach((d, i) => {
                const sx = pad.left + d.xPct * w, sy = pad.top + (d.val / geom.range) * h
                const dist = Math.sqrt(Math.pow(mx-sx, 2) + Math.pow(my-sy, 2))
                if (dist < minDist) { minDist = dist; snapIdx = i }
            })
            hoverRef.current = { mx, my, active: true, snapIdx }
        }} onMouseLeave={() => hoverRef.current.active = false}
        style={{ width: '100%', height: 140, display: 'block', cursor: 'crosshair' }} />
    )
}

export default function Analytics() {
  const { trades = [] } = useAppStore()

  const stats = useMemo(() => {
    if (!Array.isArray(trades) || trades.length === 0) return null
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    if (closed.length === 0) return null

    const pnlValues = closed.map(t => t.pnl || 0)
    const totalPnl = pnlValues.reduce((s, v) => s + v, 0)
    const winrate = (pnlValues.filter(v => v > 0).length / closed.length) * 100
    const avgWin = pnlValues.filter(v => v > 0).reduce((s,v)=>s+v,0) / (pnlValues.filter(v=>v>0).length || 1)
    const avgLoss = Math.abs(pnlValues.filter(v => v <= 0).reduce((s,v)=>s+v,0) / (pnlValues.filter(v=>v<=0).length || 1))
    
    let cur = 10000, maxEq = 10000, ddSum = 0, maxDD = 0
    pnlValues.forEach(v => {
        cur += v; if(cur > maxEq) maxEq = cur
        const dd = (maxEq - cur) / maxEq * 100
        ddSum += dd; if(dd > maxDD) maxDD = dd
    })

    const mean = totalPnl / closed.length
    const stdDev = Math.sqrt(pnlValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / closed.length) || 1
    
    return { 
        totalPnl, avgWin, avgLoss, winrate, avgDD: ddSum / closed.length, maxDD,
        sampleSize: closed.length, 
        sharpe: (mean / stdDev) * Math.sqrt(252),
        sqn: (mean / stdDev) * Math.sqrt(Math.min(closed.length, 100)),
        maxWin: Math.max(...pnlValues),
        maxLoss: Math.min(...pnlValues)
    }
  }, [trades])

  const mistakeStats = useMemo(() => {
    const stats: Record<string, { count: number, loss: number }> = {}
    trades.forEach(t => {
      if (Array.isArray(t.mistake_tags) && t.mistake_tags.length > 0) {
        t.mistake_tags.forEach(m => {
          // ULTRA-AGGRESSIVE CLEANING
          const cleanName = String(m).replace(/[\[\]\"']/g, '').replace(/\\/g, '').replace(/,/g, '').trim()
          if (!cleanName || cleanName === 'null' || cleanName === 'undefined') return
          if (!stats[cleanName]) stats[cleanName] = { count: 0, loss: 0 }
          stats[cleanName].count++
          stats[cleanName].loss += Math.abs(Math.min(0, t.pnl || 0))
        })
      }
    })
    return Object.entries(stats).sort((a, b) => b[1].loss - a[1].loss)
  }, [trades])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Primary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
            { label: 'WINRATE', val: `${stats?.winrate.toFixed(1)}%`, icon: <Target size={14} color="var(--green)"/> },
            { label: 'AVG PROFIT', val: `$${stats?.avgWin.toFixed(0)}`, icon: <ArrowUpCircle size={14} color="var(--accent)"/> },
            { label: 'AVG DRAWDOWN', val: `${stats?.avgDD.toFixed(2)}%`, icon: <TrendingDown size={14} color="var(--red)"/> },
            { label: 'MAX DRAWDOWN', val: `${stats?.maxDD.toFixed(2)}%`, icon: <BarChart3 size={14} color="var(--red)"/> },
            { label: 'SHARPE RATIO', val: stats?.sharpe.toFixed(2), icon: <ShieldCheck size={14} color="var(--green)"/> },
            { label: 'SQN SCORE', val: stats?.sqn.toFixed(2), icon: <Activity size={14} color="var(--accent)"/> }
        ].map((m, i) => (
            <div key={i} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {m.icon}<span style={{ fontSize: '0.6rem', fontWeight: 800 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-primary)' }}>{stats ? m.val : '--'}</div>
            </div>
        ))}
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

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="card-title" style={{ fontSize: '0.75rem', margin: 0 }}>LIVE DRAWDOWN INTENSITY (%)</div>
                    <BarChart3 size={14} color="var(--red)"/>
                </div>
                <DrawdownChart />
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

      {/* Detailed System Performance Section */}
      <div className="card" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.03) 100%)' }}>
        <div className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--accent)"/> SYSTEM RECORD PERFORMANCE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800 }}>MAX WINNING TRADE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--green)' }}>+${stats?.maxWin.toLocaleString() || '--'}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800 }}>MAX LOSING TRADE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--red)' }}>-${Math.abs(stats?.maxLoss || 0).toLocaleString() || '--'}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800 }}>AVERAGE LOSS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--red)', opacity: 0.8 }}>-${stats?.avgLoss.toFixed(0) || '--'}</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800 }}>EXPECTANCY / TRADE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--accent-bright)' }}>+${((stats?.totalPnl || 0) / (stats?.sampleSize || 1)).toFixed(2)}</div>
            </div>
        </div>
      </div>
    </div>
  )
}
