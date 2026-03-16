import { useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/app'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'

export default function MonteCarloSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { trades = [] } = useAppStore()

  const closed = useMemo(() => {
    if (!Array.isArray(trades)) return []
    return trades
      .filter(t => t && t.status === 'CLOSED' && t.pnl !== null && t.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [trades])

  const realPath = useMemo(() => {
    let current = 10000
    const points = [current]
    closed.forEach(t => {
      current += t.pnl || 0
      points.push(current)
    })
    return points
  }, [closed])

  const simData = useMemo(() => {
    if (closed.length < 5) return null
    const wins = closed.filter(t => (t.pnl || 0) > 0)
    const losses = closed.filter(t => (t.pnl || 0) <= 0)
    const winRate = wins.length / closed.length
    const avgWin = wins.reduce((s, t) => s + (t.pnl || 0), 0) / (wins.length || 1)
    const avgLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / (losses.length || 1))

    const numSimulations = 50
    const allPaths: number[][] = []
    for (let s = 0; s < numSimulations; s++) {
      const path = [10000]
      let balance = 10000
      for (let t = 0; t < 100; t++) {
        balance += Math.random() < winRate ? avgWin : -avgLoss
        path.push(balance)
      }
      allPaths.push(path)
    }
    return allPaths
  }, [closed])

  const stats = useMemo(() => {
    if (!simData) return null
    const finals = simData.map(p => p[p.length - 1])
    const best = Math.max(...finals), worst = Math.min(...finals)
    return { best, worst, bestIdx: finals.indexOf(best), worstIdx: finals.indexOf(worst) }
  }, [simData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !simData || !stats) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (W === 0 || H === 0) return;

    canvas.width = W * window.devicePixelRatio; canvas.height = H * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const pad = { top: 20, right: 15, bottom: 30, left: 55 }
    const w = W - pad.left - pad.right, h = H - pad.top - pad.bottom
    const all = [...simData.flat(), ...realPath]
    const min = Math.min(...all), max = Math.max(...all), r = max - min || 1
    const toX = (i: number, len: number) => pad.left + (i / (Math.max(1, len - 1))) * w
    const toY = (v: number) => pad.top + h - ((v - min) / r) * h

    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
    for(let i=0; i<=5; i++) {
        const y = pad.top + (i/5)*h
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '8px monospace'
        ctx.fillText(`$${((max-(i/5)*r)/1000).toFixed(1)}k`, 5, y + 3)
    }

    simData.forEach((path, idx) => {
      ctx.beginPath()
      path.forEach((v, i) => { const x = toX(i, path.length), y = toY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); })
      ctx.strokeStyle = idx === stats.bestIdx ? '#10b981' : idx === stats.worstIdx ? '#ef4444' : 'rgba(139, 92, 246, 0.08)'
      ctx.lineWidth = (idx === stats.bestIdx || idx === stats.worstIdx) ? 2 : 1
      ctx.stroke()
    })

    // Real Path (Violet)
    ctx.beginPath(); ctx.setLineDash([2, 2])
    realPath.forEach((v, i) => { const x = toX(i, realPath.length), y = toY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); })
    ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([])
  }, [simData, stats, realPath])

  return (
    <div className="card">
      <div className="card-title" style={{ color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Monte Carlo Projection</div>
      {simData ? (
        <>
          <canvas ref={canvasRef} style={{ width: '100%', height: 200, display: 'block' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}><TrendingUp size={12}/> BEST: ${((stats?.best || 0)/1000).toFixed(1)}k</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#8b5cf6' }}><Zap size={12}/> REAL: ${((realPath[realPath.length-1] || 0)/1000).toFixed(1)}k</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}><TrendingDown size={12}/> WORST: ${((stats?.worst || 0)/1000).toFixed(1)}k</div>
          </div>
        </>
      ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>Insufficient data.</div>}
    </div>
  )
}
