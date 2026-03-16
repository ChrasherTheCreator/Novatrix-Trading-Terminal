import { useRef, useEffect } from 'react'
import { useAppStore } from '../store/app'

interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
}

interface OrderLine {
    price: number
    label: string
    color: string
}

interface Props {
  data: Candle[]
  orderLines?: OrderLine[]
}

export default function CandlestickChart({ data, orderLines = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useAppStore()

  const sma20 = (() => {
    const period = 20
    const values: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { values.push(null); continue; }
      const slice = data.slice(i - period + 1, i + 1)
      const avg = slice.reduce((s, c) => s + c.close, 0) / period
      values.push(avg)
    }
    return values
  })()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const pad = { top: 20, right: 60, bottom: 20, left: 10 }
    const w = W - pad.left - pad.right
    const h = H - pad.top - pad.bottom

    const prices = data.flatMap(c => [c.high, c.low])
    const allPrices = [...prices, ...orderLines.map(l => l.price)]
    const min = Math.min(...allPrices)
    const max = Math.max(...allPrices)
    const range = max - min || 1

    const toY = (p: number) => pad.top + h - ((p - min) / range) * h
    const candleW = (w / data.length) * 0.8
    const candleGap = (w / data.length) * 0.2

    ctx.clearRect(0, 0, W, H)

    // Price Grid (Dynamic)
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.font = '9px "JetBrains Mono"'
    ctx.fillStyle = theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
    
    for(let i=0; i<=5; i++) {
        const y = pad.top + (i/5)*h
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke()
        const val = max - (i/5)*range
        ctx.fillText(`$${val.toFixed(2)}`, W - 55, y + 3)
    }

    // Draw Candles
    data.forEach((c, i) => {
      const x = pad.left + i * (candleW + candleGap)
      const color = c.close >= c.open ? '#10b981' : '#ef4444'
      ctx.strokeStyle = color; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x + candleW / 2, toY(c.high)); ctx.lineTo(x + candleW / 2, toY(c.low)); ctx.stroke()
      ctx.fillStyle = color
      const yOpen = toY(c.open), yClose = toY(c.close)
      ctx.fillRect(x, Math.min(yOpen, yClose), candleW, Math.max(0.5, Math.abs(yOpen - yClose)))
    })

    // Draw SMA 20
    ctx.beginPath(); ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    sma20.forEach((v, i) => {
      if (v === null) return
      const x = pad.left + i * (candleW + candleGap) + candleW / 2
      const y = toY(v)
      i === 0 || sma20[i-1] === null ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Order Lines
    orderLines.forEach(line => {
        const y = toY(line.price)
        if (y < pad.top || y > pad.top + h) return
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = line.color
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = line.color
        const txt = `${line.label}: ${line.price.toFixed(2)}`
        const txtW = ctx.measureText(txt).width
        ctx.fillRect(W - pad.right, y - 10, txtW + 10, 20)
        ctx.fillStyle = 'var(--text-static-white)'
        ctx.font = 'bold 9px "JetBrains Mono"'
        ctx.fillText(txt, W - pad.right + 5, y + 3)
    })

  }, [data, sma20, orderLines, theme])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', background: 'var(--bg-card)' }} />
    </div>
  )
}
