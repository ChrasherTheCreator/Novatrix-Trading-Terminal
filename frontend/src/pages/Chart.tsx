import { useState, useMemo, useEffect } from 'react'
import { Activity, ShieldCheck, Search, History, TrendingUp, X } from 'lucide-react'
import TradingViewChart from '../components/TradingViewChart'
import { useAppStore } from '../store/app'

const ASSET_CLASSES = [
  { 
    id: 'crypto', 
    label: 'Crypto', 
    prefix: 'BINANCE:', 
    defaults: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD'] 
  },
  { 
    id: 'forex', 
    label: 'Forex', 
    prefix: 'OANDA:', 
    defaults: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP'] 
  },
  { 
    id: 'stocks', 
    label: 'Stocks', 
    prefix: 'NASDAQ:', 
    defaults: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'NFLX'] 
  },
]

export default function Chart() {
  const { chartSymbol, chartClass, setChartAsset } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeClass, setActiveClass] = useState(chartClass || 'crypto')
  const [activeSymbol, setActiveSymbol] = useState(chartSymbol || 'BTCUSD')
  const [history, setHistory] = useState<string[]>(['BTCUSD', 'ETHUSD', 'EURUSD'])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  // Sync with store if changed from outside (e.g. Watchlist)
  useEffect(() => {
    if (chartSymbol && chartSymbol !== activeSymbol) {
        setActiveSymbol(chartSymbol)
    }
    if (chartClass && chartClass !== activeClass) {
        setActiveClass(chartClass)
    }
  }, [chartSymbol, chartClass])

  const currentFullSymbol = useMemo(() => {
    const cls = ASSET_CLASSES.find(c => c.id === activeClass)
    return `${cls?.prefix || ''}${activeSymbol}`
  }, [activeClass, activeSymbol])

  const suggestions = useMemo(() => {
    const cls = ASSET_CLASSES.find(c => c.id === activeClass)
    const items = cls?.defaults || []
    if (!searchTerm) return items.slice(0, 6)
    const upperSearch = searchTerm.toUpperCase()
    const startsWith = items.filter(s => s.startsWith(upperSearch))
    const contains = items.filter(s => s.includes(upperSearch) && !s.startsWith(upperSearch))
    const combined = [...startsWith, ...contains]
    if (combined.length === 0 && searchTerm.length >= 2) return [upperSearch]
    return combined.slice(0, 8)
  }, [activeClass, searchTerm])

  const handleSelect = (sym: string) => {
    const cleanSym = sym.toUpperCase().replace('/', '')
    setActiveSymbol(cleanSym)
    setChartAsset(cleanSym, activeClass) // Update store
    setSearchTerm('')
    if (!history.includes(cleanSym)) {
        setHistory(prev => [cleanSym, ...prev.slice(0, 4)])
    }
    setShowSearchDropdown(false)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm) handleSelect(searchTerm)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: '1.5rem', position: 'relative' }}>
        <div style={{ flex: 1, maxWidth: '450px', position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                <input 
                    value={searchTerm}
                    onFocus={() => setShowSearchDropdown(true)}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeClass} assets...`} 
                    style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem 1rem 0.75rem 2.75rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                />
            </form>

            {showSearchDropdown && (
                <div className="card fade-in" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 100, padding: '0.5rem', border: '1px solid var(--border-accent)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: '#11111a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>MATCHING ASSETS</span>
                        <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowSearchDropdown(false)}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {suggestions.map(s => (
                            <button key={s} onClick={() => handleSelect(s)} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={12} color="var(--accent-bright)"/> 
                                <span>{s}</span>
                            </button>
                        ))}
                    </div>
                    {history.length > 0 && (
                        <>
                            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <History size={12} color="var(--text-muted)"/>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>RECENTLY SEARCHED</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.25rem 0.5rem' }}>
                                {history.map(h => (
                                    <span key={h} onClick={() => handleSelect(h)} style={{ fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.2rem 0.5rem', background: 'var(--accent-dim)', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(139,92,246,0.2)' }}>{h}</span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            {ASSET_CLASSES.map(cls => (
                <button 
                    key={cls.id}
                    onClick={() => {
                        setActiveClass(cls.id)
                        handleSelect(cls.defaults[0])
                    }}
                    style={{ 
                        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem',
                        background: activeClass === cls.id ? 'var(--accent)' : 'transparent',
                        color: activeClass === cls.id ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                    }}
                >{cls.label.toUpperCase()}</button>
            ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <TradingViewChart symbol={currentFullSymbol} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', flexShrink: 0 }}>
         <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-bright)' }}>
                <Activity size={16}/>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>GATEWAY STATUS</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Streaming <span style={{ color: 'var(--accent-bright)' }}>{activeSymbol}</span> via {ASSET_CLASSES.find(c=>c.id===activeClass)?.prefix.replace(':','')}
            </div>
         </div>

         <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-bright)' }}>
                <ShieldCheck size={16}/>
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>DYNAMICS</span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Market volatility is monitored in real-time for {activeSymbol}.
            </div>
         </div>
      </div>
    </div>
  )
}
