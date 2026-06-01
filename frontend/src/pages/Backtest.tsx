import { useState, useMemo, useEffect } from 'react'
import { Play, Pause, Settings2, X, Zap, DollarSign, Percent, Search } from 'lucide-react'
import CandlestickChart from '../components/CandlestickChart'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'

interface Tick {
  time: string
  open: number
  high: number
  low: number
  close: number
}

const SPEEDS = [1, 2, 5, 10, 20]

const ASSET_PROFILES: Record<string, { base: number, volatility: number, decimals: number, multiplier: number }> = {
    'BTCUSD': { base: 64250.00, volatility: 120.0, decimals: 2, multiplier: 10 },
    'ETHUSD': { base: 3450.00, volatility: 15.0, decimals: 2, multiplier: 100 },
    'SOLUSD': { base: 145.00, volatility: 2.5, decimals: 2, multiplier: 1000 },
    'EURUSD': { base: 1.0852, volatility: 0.0008, decimals: 4, multiplier: 100000 },
    'GBPUSD': { base: 1.2640, volatility: 0.0012, decimals: 4, multiplier: 100000 },
    'USDJPY': { base: 151.45, volatility: 0.15, decimals: 2, multiplier: 1000 },
    'AAPL':   { base: 172.50, volatility: 1.2, decimals: 2, multiplier: 100 },
    'TSLA':   { base: 175.00, volatility: 3.5, decimals: 2, multiplier: 100 },
    'NVDA':   { base: 880.00, volatility: 12.0, decimals: 2, multiplier: 10 },
}

const ASSET_CLASSES = [
  { id: 'crypto', label: 'Crypto', defaults: ['BTCUSD', 'ETHUSD', 'SOLUSD'] },
  { id: 'forex', label: 'Forex', defaults: ['EURUSD', 'GBPUSD', 'USDJPY'] },
  { id: 'stocks', label: 'Stocks', defaults: ['AAPL', 'TSLA', 'NVDA'] },
]

interface ActiveTrade {
  id: string
  side: 'BUY' | 'SELL'
  entry: number
  sl: number
  tp: number
  lots: number
}

export default function Backtest() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeAsset, setActiveAsset] = useState('BTCUSD')
  const [activeClass, setActiveClass] = useState('crypto')
  const [currentIdx, setCurrentIdx] = useState(100)
  const [speed, setSpeed] = useState(1)
  const [balance, setBalance] = useState(10000)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>(['BTCUSD', 'EURUSD', 'AAPL'])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY')
  const [lotSize, setLotSize] = useState(1.0)
  const [entryPrice, setEntryPrice] = useState(0)
  
  // UNIFIED RISK MODE
  const [riskMode, setRiskMode] = useState<'PRICE' | 'PERCENT'>('PRICE')
  
  const [slValue, setSlValue] = useState(0)
  const [tpValue, setTpValue] = useState(0)
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])

  const data: Tick[] = useMemo(() => {
    const profile = ASSET_PROFILES[activeAsset] || ASSET_PROFILES['BTCUSD']
    let price = profile.base
    return Array.from({ length: 1500 }).map((_, i) => {
      const open = price
      const change = (Math.random() - 0.5) * profile.volatility
      const close = open + change
      const high = Math.max(open, close) + Math.random() * (profile.volatility * 0.4)
      const low = Math.min(open, close) - Math.random() * (profile.volatility * 0.4)
      price = close
      return { time: `T${i}`, open, high, low, close }
    })
  }, [activeAsset])

  const currentPrice = data[currentIdx]?.close || 0
  const activeProfile = ASSET_PROFILES[activeAsset] || ASSET_PROFILES['BTCUSD']

  const handleSelectAsset = (sym: string) => {
    setActiveAsset(sym)
    setCurrentIdx(100)
    setActiveTrades([])
    setSearchTerm('')
    setShowSearchDropdown(false)
    if (!searchHistory.includes(sym)) setSearchHistory(prev => [sym, ...prev.slice(0, 4)])
  }

  const rrStats = useMemo(() => {
    if (!entryPrice || !slValue || !tpValue) return { rr: 0 }
    const slDist = riskMode === 'PRICE' ? Math.abs(entryPrice - slValue) : (entryPrice * (slValue / 100))
    const tpDist = riskMode === 'PRICE' ? Math.abs(entryPrice - tpValue) : (entryPrice * (tpValue / 100))
    return { rr: (tpDist / (slDist || 1)).toFixed(2) }
  }, [entryPrice, slValue, tpValue, riskMode])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isPlaying && currentIdx < data.length - 1) {
      timer = setInterval(() => { setCurrentIdx(prev => prev + 1) }, 1000 / speed)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [isPlaying, currentIdx, speed, data.length])

  useEffect(() => {
    if (activeTrades.length === 0) return
    const tick = data[currentIdx]
    if (!tick) return
    const closedIds: string[] = []
    activeTrades.forEach(t => {
        const hitSL = t.side === 'BUY' ? tick.low <= t.sl : tick.high >= t.sl
        const hitTP = t.side === 'BUY' ? tick.high >= t.tp : tick.low <= t.tp
        if (hitSL || hitTP) {
            const exitPrice = hitSL ? t.sl : t.tp
            const pnl = (exitPrice - t.entry) * (t.side === 'BUY' ? 1 : -1) * t.lots * activeProfile.multiplier
            setBalance(prev => prev + pnl)
            closedIds.push(t.id)
            if (hitSL) toast.error(`SL Hit: -$${Math.abs(pnl).toFixed(2)}`)
            else toast.success(`TP Hit: +$${pnl.toFixed(2)}`)
        }
    })
    if (closedIds.length > 0) setActiveTrades(prev => prev.filter(at => !closedIds.includes(at.id)))
  }, [currentIdx, activeTrades, data, activeProfile])

  const handlePlaceOrder = () => {
    if (!entryPrice || !slValue || !tpValue) return toast.error("Complete parameters")
    const finalSL = riskMode === 'PRICE' ? slValue : (orderType === 'BUY' ? entryPrice * (1 - slValue/100) : entryPrice * (1 + slValue/100))
    const finalTP = riskMode === 'PRICE' ? tpValue : (orderType === 'BUY' ? entryPrice * (1 + tpValue/100) : entryPrice * (1 - tpValue/100))
    setActiveTrades([...activeTrades, { id: Math.random().toString(36).substr(2,9), side: orderType, entry: entryPrice, sl: finalSL, tp: finalTP, lots: lotSize }])
    toast.info(`${orderType} Executed`)
  }

  const chartData = useMemo(() => data.slice(Math.max(0, currentIdx - 150), currentIdx + 1), [data, currentIdx])
  const orderLines = useMemo(() => activeTrades.map(t => [{ price: t.entry, color: '#8b5cf6', label: `ENTRY ${t.side}` }, { price: t.sl, color: '#ef4444', label: 'SL' }, { price: t.tp, color: '#10b981', label: 'TP' }]).flat(), [activeTrades])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      
      {/* Still Under Development Banner */}
      <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '10px',
          color: '#f59e0b',
          fontSize: '0.75rem',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(4px)',
          lineHeight: 1.4
      }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', fontSize: '0.75rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.4rem' }}>Still Under Development / In Entwicklung:</span> Dieser Bereich befindet sich in der aktiven Entwicklung. Simulationen und Backtests sind teils unvollständig oder laufen nur lokal mit Testdaten.
          </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Simulator Pro</h1>
            <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                    <input 
                        value={searchTerm} onFocus={() => setShowSearchDropdown(true)} onChange={e => setSearchTerm(e.target.value)}
                        placeholder={`Search assets...`} 
                        style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.6rem 1rem 0.6rem 2.75rem', color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none' }}
                    />
                </div>
                {showSearchDropdown && (
                    <div className="card fade-in" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1000, padding: '0.5rem', border: '1px solid var(--border-accent)', background: '#11111a' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                            {ASSET_CLASSES.map(cls => (
                                <button key={cls.id} onClick={() => setActiveClass(cls.id)} style={{ flex: 1, padding: '0.35rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, background: activeClass === cls.id ? 'var(--accent)' : 'transparent', color: activeClass === cls.id ? 'var(--text-static-white)' : 'var(--text-muted)' }}>{cls.label.toUpperCase()}</button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                            {ASSET_CLASSES.find(c=>c.id===activeClass)?.defaults.map(s => (
                                <button key={s} onClick={() => handleSelectAsset(s)} style={{ textAlign: 'left', padding: '0.5rem', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>{s}</button>
                            ))}
                        </div>
                        <div style={{ padding: '0.5rem', textAlign: 'center' }}><X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowSearchDropdown(false)}/></div>
                    </div>
                )}
            </div>
        </div>
        <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>EQUITY</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: balance >= 10000 ? 'var(--green)' : 'var(--red)' }}>${balance.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.75rem', borderRadius: '6px', color: 'var(--text-static-white)', fontSize: '0.75rem', fontWeight: 800 }}>LIVE {activeAsset}: ${currentPrice.toFixed(activeProfile.decimals)}</div>
                <CandlestickChart data={chartData} orderLines={orderLines} />
            </div>

            <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="icon-btn" style={{ width: 44, height: 44, borderRadius: '50%', background: isPlaying ? 'var(--red-dim)' : 'var(--green-dim)', color: isPlaying ? 'var(--red)' : 'var(--green)' }}>{isPlaying ? <Pause size={20}/> : <Play size={20}/>}</button>
                    <button onClick={() => setCurrentIdx(prev => Math.min(data.length - 1, prev + 1))} className="icon-btn"><Zap size={18}/></button>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
                <div style={{ display: 'flex', gap: 4 }}>
                    {SPEEDS.map(s => (
                        <button key={s} onClick={() => setSpeed(s)} style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, background: speed === s ? 'var(--accent)' : 'var(--bg-secondary)', color: speed === s ? 'var(--text-static-white)' : 'var(--text-muted)' }}>{s}x</button>
                    ))}
                </div>
            </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}><Settings2 size={18}/><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>EXECUTION</span></div>
                
                {/* UNIFIED MODE SWITCH */}
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '6px' }}>
                    <button onClick={() => setRiskMode('PRICE')} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: riskMode === 'PRICE' ? 'var(--accent)' : 'transparent', color: riskMode === 'PRICE' ? 'var(--text-static-white)' : 'var(--text-muted)' }}><DollarSign size={12}/></button>
                    <button onClick={() => setRiskMode('PERCENT')} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: riskMode === 'PERCENT' ? 'var(--accent)' : 'transparent', color: riskMode === 'PERCENT' ? 'var(--text-static-white)' : 'var(--text-muted)' }}><Percent size={12}/></button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setOrderType('BUY')} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 800, background: orderType === 'BUY' ? 'var(--green)' : 'var(--bg-secondary)', color: orderType === 'BUY' ? 'var(--text-static-white)' : 'var(--text-muted)' }}>BUY</button>
                <button onClick={() => setOrderType('SELL')} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: 800, background: orderType === 'SELL' ? 'var(--red)' : 'var(--bg-secondary)', color: orderType === 'SELL' ? 'var(--text-static-white)' : 'var(--text-muted)' }}>SELL</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label className="metric-label">LOT SIZE</label><input type="number" step="0.01" value={lotSize} onChange={e => setLotSize(parseFloat(e.target.value))} style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem', color: 'var(--text-primary)', fontWeight: 700 }} /></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><label className="metric-label">ENTRY</label><button onClick={() => setEntryPrice(currentPrice)} style={{ fontSize: '0.55rem', background: 'none', border: 'none', color: 'var(--accent-bright)', fontWeight: 800 }}>MARKET</button></div><input type="number" value={entryPrice} onChange={e => setEntryPrice(parseFloat(e.target.value))} style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem', color: 'var(--text-primary)', fontWeight: 700 }} /></div>
                
                <div>
                    <label className="metric-label">STOP LOSS ({riskMode === 'PERCENT' ? '%' : 'Price'})</label>
                    <input type="number" value={slValue} onChange={e => setSlValue(parseFloat(e.target.value))} style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
                
                <div>
                    <label className="metric-label">TAKE PROFIT ({riskMode === 'PERCENT' ? '%' : 'Price'})</label>
                    <input type="number" value={tpValue} onChange={e => setTpValue(parseFloat(e.target.value))} style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem', color: 'var(--text-primary)', fontWeight: 700 }} />
                </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--accent-dim)', borderRadius: '10px', border: '1px dashed var(--border-accent)' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}><span>ESTIMATED R/R</span><span style={{ color: 'var(--accent-bright)' }}>{rrStats.rr}:1</span></div></div>
            <Button onClick={handlePlaceOrder} style={{ width: '100%', padding: '1rem', background: orderType === 'BUY' ? 'var(--green)' : 'var(--red)', border: 'none' }}>EXECUTE {orderType}</Button>
            
            <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>POSITIONS ({activeTrades.length})</div>
                {activeTrades.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '0.4rem', borderLeft: `3px solid ${t.side === 'BUY' ? 'var(--green)' : 'var(--red)'}` }}><span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{t.side} ({t.lots} Lots)</span><X size={12} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setActiveTrades(prev => prev.filter(at => at.id !== t.id))}/></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
