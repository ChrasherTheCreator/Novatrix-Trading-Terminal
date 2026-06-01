import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/app'
import { Link2, Settings2, RefreshCw } from 'lucide-react'
import { Select } from './ui/Select'
import { motion } from 'framer-motion'

interface Props {
    symbols?: string[]
}

const TIMEFRAMES = [
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
]

const LOOKBACKS = [
    { value: '50', label: 'Last 50 Bars' },
    { value: '100', label: 'Last 100 Bars' },
    { value: '200', label: 'Last 200 Bars' },
]

// Pure Pearson Correlation on Aligned Data
const pearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length
    if (n < 5) return 0
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
    for (let i = 0; i < n; i++) {
        sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i]
        sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i]
    }
    
    const numerator = (n * sumXY) - (sumX * sumY)
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    if (den === 0) return 0
    return Math.max(-1, Math.min(1, numerator / den))
}

const formatDisplayTime = (timeStr: string | null) => {
    if (!timeStr) return 'Pending...'
    if (timeStr === 'Initializing...') return 'Initializing...'
    try {
        const date = new Date(timeStr)
        if (isNaN(date.getTime())) {
            // Check if it's a unix timestamp
            if (/^\d+$/.test(timeStr)) return new Date(parseInt(timeStr) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            return timeStr
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) { return timeStr }
}

const lerpColor = (color1: string, color2: string, factor: number) => {
    const f = Math.max(0, Math.min(1, factor))
    const hex = (x: string) => parseInt(x.replace('#', ''), 16)
    const r1 = (hex(color1) >> 16) & 0xFF, g1 = (hex(color1) >> 8) & 0xFF, b1 = hex(color1) & 0xFF
    const r2 = (hex(color2) >> 16) & 0xFF, g2 = (hex(color2) >> 8) & 0xFF, b2 = hex(color2) & 0xFF
    return `rgb(${Math.round(r1 + f * (r2 - r1))}, ${Math.round(g1 + f * (g2 - g1))}, ${Math.round(b1 + f * (b2 - b1))})`
}

export default function CorrelationMatrix({ symbols }: Props) {
  const { historicalBars, fetchHistoricalBars, marketQuotes } = useAppStore()
  
  const [timeframe, setTimeframe] = useState('1d')
  const [lookback, setLookback] = useState('100')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  
  const [frozenData, setFrozenData] = useState<{ assets: string[], matrix: Record<string, Record<string, number>> } | null>(null)

  const activeSymbols = useMemo(() => {
    const raw = (symbols && symbols.length > 0) ? symbols : (marketQuotes.map(q => q.symbol))
    return Array.from(new Set(raw.filter(s => !!s))).slice(0, 10)
  }, [symbols, marketQuotes.length])

  const activeSymbolsStr = activeSymbols.join(',')

  const getInterval = (tf: string) => {
    switch(tf) {
        case '1h': return '1h'; case '4h': return '4h'; case '1d': return '1day'; case '1w': return '1week';
        default: return '1day';
    }
  }

  // --- ALIGNMENT & CALCULATION LOGIC ---
  const generateMatrix = useCallback(() => {
    if (activeSymbols.length === 0) return
    
    const matrix: Record<string, Record<string, number>> = {}
    const lookbackNum = parseInt(lookback)

    activeSymbols.forEach(a1 => {
        matrix[a1] = {}
        const bars1 = historicalBars[a1] || []
        
        activeSymbols.forEach(a2 => {
            if (a1 === a2) {
                matrix[a1][a2] = 1.0
            } else {
                const bars2 = historicalBars[a2] || []
                
                // TIMESTAMP ALIGNMENT
                // 1. Create a map of the second asset for fast lookup
                const map2 = new Map(bars2.map(b => [b.time, b.price]))
                
                const aligned1: number[] = []
                const aligned2: number[] = []
                
                // 2. Iterate through bars1 (newest first to respect lookback)
                const recentBars1 = bars1.slice(-lookbackNum)
                for (const b1 of recentBars1) {
                    const p2 = map2.get(b1.time)
                    if (p2 !== undefined) {
                        aligned1.push(b1.price)
                        aligned2.push(p2)
                    }
                }
                
                matrix[a1][a2] = pearsonCorrelation(aligned1, aligned2)
            }
        })
    })
    
    setFrozenData({ assets: activeSymbols, matrix })
    setLastUpdateTime(new Date().toISOString())
  }, [activeSymbols, historicalBars, lookback])

  // EFFECT 1: Fetching (Controlled by Config)
  const lastFetchKey = useRef('')
  useEffect(() => {
    const key = `${activeSymbolsStr}-${timeframe}-${lookback}`
    if (lastFetchKey.current === key) return
    lastFetchKey.current = key

    const load = async () => {
        setIsRefreshing(true)
        const interval = getInterval(timeframe)
        const limit = Math.max(250, parseInt(lookback) + 20) // Fetch extra for alignment buffer
        await Promise.all(activeSymbols.map(s => fetchHistoricalBars(s, interval, limit)))
        setIsRefreshing(false)
        generateMatrix() // Trigger calculation after fetch
    }
    load()
  }, [activeSymbolsStr, timeframe, lookback, fetchHistoricalBars, activeSymbols, generateMatrix])

  // NO Live-Tick Effect here to prevent millisecond updates.
  // The matrix only updates when loadData finishes (on config change or initial load).

  const getCellColor = (val: number) => {
    const v = isNaN(val) ? 0 : val
    const c_neg = '#801922', c_neut = '#b8b8b8', c_pos = '#1b5e20'
    return v < 0 ? lerpColor(c_neg, c_neut, (v + 1)) : lerpColor(c_neut, c_pos, v)
  }

  const getTextColor = (val: number) => (isNaN(val) || (val > -0.4 && val < 0.8)) ? '#2E2E2E' : '#F0F0F0'
  const getBorderColor = (val: number) => getCellColor(val).replace('rgb', 'rgba').replace(')', ', 0.3)')

  if (activeSymbols.length === 0 || !frozenData) {
    return (
        <div className="card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={24} color="var(--accent)"/></motion.div>
        </div>
    )
  }

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}>
                <Link2 size={18}/>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>STRATEGIC CORRELATION MATRIX</span>
                <span style={{ 
                  fontSize: '0.55rem', 
                  fontWeight: 800, 
                  padding: '0.2rem 0.5rem', 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  color: '#f59e0b', 
                  border: '1px solid rgba(245, 158, 11, 0.25)', 
                  borderRadius: '6px',
                  letterSpacing: '0.05em',
                  marginLeft: '0.65rem',
                  verticalAlign: 'middle',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  STILL UNDER DEVELOPMENT
                </span>
            </div>
            {isRefreshing && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={14} color="var(--text-muted)"/></motion.div>}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Select value={timeframe} onChange={setTimeframe} options={TIMEFRAMES} width="120px" />
            <Select value={lookback} onChange={setLookback} options={LOOKBACKS} width="140px" />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ height: '6px', width: '40px', background: 'linear-gradient(90deg, #801922 0%, #b8b8b8 50%, #1b5e20 100%)', borderRadius: '3px' }} />
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)' }}>-1.0 to +1.0</span>
            </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '6px', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '100px' }}></th>
              {frozenData.assets.map(a => (
                <th key={a} style={{ fontSize: '10pt', fontWeight: 900, color: 'var(--text-primary)', padding: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frozenData.assets.map(a1 => (
              <tr key={a1}>
                <td style={{ fontSize: '10pt', fontWeight: 900, color: 'var(--text-primary)', textAlign: 'right', paddingRight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a1}</td>
                {frozenData.assets.map(a2 => {
                  const val = frozenData.matrix[a1]?.[a2] ?? 0
                  return (
                    <td 
                      key={`${a1}-${a2}`} 
                      style={{ 
                        background: getCellColor(val), 
                        borderRadius: '8px', 
                        height: '45px',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        color: getTextColor(val),
                        border: `1px solid ${getBorderColor(val)}`,
                        transition: 'all 0.3s ease'
                      }}
                      title={`${a1} vs ${a2}: ${val.toFixed(4)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Settings2 size={14} color="var(--accent-bright)"/>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Last Calculation: <span style={{ color: 'white', fontWeight: 700 }}>{formatDisplayTime(lastUpdateTime)}</span> (Config: {lookback} bars @ {timeframe})
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>UPDATES ONLY ON BAR CLOSE</p>
      </div>
    </div>
  )
}
