import { useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/app'
import { TrendingUp } from 'lucide-react'

export default function CumulativePnL() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { trades, theme } = useAppStore()

  const chartData = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'CLOSED' && t.pnl !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    let cumulative = 0
    return closedTrades.map(t => {
      cumulative += t.pnl || 0
      return cumulative
    })
  }, [trades])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const pad = 20

    const min = Math.min(0, ...chartData)
    const max = Math.max(...chartData)
    const range = max - min || 1

    const toX = (i: number) => (i / (chartData.length - 1)) * (w - 2 * pad) + pad
    const toY = (v: number) => h - ((v - min) / range) * (h - 2 * pad) - pad

    ctx.clearRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.moveTo(pad, toY(0))
    ctx.lineTo(w - pad, toY(0))
    ctx.stroke()

    // Line
    ctx.beginPath()
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#8b5cf6'
    chartData.forEach((v, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(v))
      else ctx.lineTo(toX(i), toY(v))
    })
    ctx.stroke()

    // Area
    ctx.lineTo(toX(chartData.length - 1), toY(min))
    ctx.lineTo(toX(0), toY(min))
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.2)')
    grad.addColorStop(1, 'rgba(139, 92, 246, 0)')
    ctx.fillStyle = grad
    ctx.fill()

    // Points
    ctx.fillStyle = '#8b5cf6'
    chartData.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(toX(i), toY(v), 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Label
    const textColor = theme === 'light' ? '#020617' : '#f1f5f9'
    ctx.fillStyle = textColor
    ctx.font = 'bold 10px Inter'
    ctx.fillText('PnL Curve', pad, 15)

  }, [chartData, theme])

  return (
    <div className="card" style={{ height: '200px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <TrendingUp size={16} color="var(--accent-bright)"/>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CUMULATIVE PERFORMANCE</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
