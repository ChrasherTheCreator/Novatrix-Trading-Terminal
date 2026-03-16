import { useState, useMemo, useEffect } from 'react'
import { Search, Trash2, TrendingUp, TrendingDown, BarChart2, Activity, Settings, RefreshCw } from 'lucide-react'
import { useAppStore } from '../store/app'
import { toast } from 'sonner'
import CorrelationMatrix from '../components/CorrelationMatrix'
import { motion } from 'framer-motion'


interface WatchlistItem {
    symbol: string
    price: string
    change: string
    changeNum: number
    tech: {
        rsi: number
        trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
        volatility: 'HIGH' | 'LOW'
        volume?: string
    }
}

interface WatchlistGroup {
    id: string
    name: string
    items: { symbol: string }[] // Keep only symbols in group state
}

type SortOption = 'SYMBOL' | 'PERFORMANCE' | 'RSI'

// --- HELPER FUNCTIONS FOR LIVE CALCULATION ---
const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length <= period) return 50
    
    let gains = 0
    let losses = 0
    
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1]
        if (diff >= 0) gains += diff
        else losses += Math.abs(diff)
    }
    
    let avgGain = gains / period
    let avgLoss = losses / period
    
    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1]
        const gain = diff >= 0 ? diff : 0
        const loss = diff < 0 ? Math.abs(diff) : 0
        
        avgGain = (avgGain * (period - 1) + gain) / period
        avgLoss = (avgLoss * (period - 1) + loss) / period
    }
    
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return Math.round(100 - (100 / (1 + rs)))
}

const detectTrend = (prices: number[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    if (prices.length < 20) return 'NEUTRAL'
    
    // Simple Moving Average (20) comparison
    const last = prices[prices.length - 1]
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20
    const prevSma20 = prices.slice(-21, -1).reduce((a, b) => a + b, 0) / 20
    
    if (last > sma20 && sma20 > prevSma20) return 'BULLISH'
    if (last < sma20 && sma20 < prevSma20) return 'BEARISH'
    return 'NEUTRAL'
}

const calculateRelativeActivity = (history: any[]): string => {
    if (history.length < 10) return 'LOW'
    
    // Calculate average absolute change over last 10 bars
    const recent = history.slice(-10)
    const avgChange = recent.reduce((sum, h) => sum + Math.abs(h.change || 0), 0) / 10
    
    if (avgChange > 0.5) return 'HIGH'
    if (avgChange > 0.15) return 'NORMAL'
    return 'LOW'
}

export default function Watchlist() {
  const { setView, livePrices, marketHistory, fetchMarketHistory, setChartAsset } = useAppStore()
  
  const [groups, setGroups] = useState<WatchlistGroup[]>([
    { id: '1', name: 'CORE ASSETS',    items: [{ symbol: 'BTCUSD' }, { symbol: 'ETHUSD' }, { symbol: 'SOLUSD' }, { symbol: 'XAUUSD' }] },
    { id: '2', name: 'FOREX MAJORS',   items: [{ symbol: 'EURUSD' }, { symbol: 'GBPUSD' }, { symbol: 'USDJPY' }, { symbol: 'AUDUSD' }, { symbol: 'USDCHF' }, { symbol: 'USDCAD' }, { symbol: 'NZDUSD' }] },
    { id: '3', name: 'FOREX MINORS',   items: [{ symbol: 'EURGBP' }, { symbol: 'EURJPY' }, { symbol: 'EURCHF' }, { symbol: 'EURCAD' }, { symbol: 'EURNZD' }, { symbol: 'EURAUD' },
                                               { symbol: 'GBPCHF' }, { symbol: 'GBPJPY' }, { symbol: 'GBPAUD' }, { symbol: 'GBPCAD' },
                                               { symbol: 'CHFJPY' }, { symbol: 'NZDJPY' }, { symbol: 'AUDJPY' }, { symbol: 'CADJPY' }] },
    { id: '4', name: 'INDICES',        items: [{ symbol: 'US30' },   { symbol: 'US500' },  { symbol: 'US100' },  { symbol: 'GER40' },  { symbol: 'UK100' },  { symbol: 'JAP225' }, { symbol: 'AUS200' }] },
    { id: '5', name: 'COMMODITIES',    items: [{ symbol: 'XAUUSD' }, { symbol: 'XAGUSD' }, { symbol: 'XPTUSD' }, { symbol: 'XPDUSD' }] },
    { id: '6', name: 'CRYPTO MAJORS',  items: [{ symbol: 'BTCUSD' }, { symbol: 'ETHUSD' }, { symbol: 'SOLUSD' }, { symbol: 'XRPUSD' }, { symbol: 'ADAUSD' }, { symbol: 'DOGEUSD' }, { symbol: 'BNBUSD' }] }
  ])
  
  const [activeGroupId, setActiveGroupId] = useState('1')
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [sortBy] = useState<SortOption>('SYMBOL')
  const [fetchedSymbols, setFetchedSymbols] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId) || groups[0], [groups, activeGroupId])
  const currentSymbols = useMemo(() => activeGroup.items.map(i => i.symbol), [activeGroup.items])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setFetchedSymbols(new Set()) // Clear cache to force reload
    await Promise.all(currentSymbols.map(sym => fetchMarketHistory(sym)))
    toast.success('Market data refreshed')
    setIsRefreshing(false)
  }

  useEffect(() => {
    const missing = currentSymbols.filter(sym => !fetchedSymbols.has(sym))
    if (missing.length > 0) {
        missing.forEach(sym => fetchMarketHistory(sym))
        setFetchedSymbols(prev => {
            const next = new Set(prev)
            missing.forEach(s => next.add(s))
            return next
        })
    }
  }, [currentSymbols, fetchMarketHistory]) // Removed fetchedSymbols from deps to break loop

  // --- LIVE DATA CONSOLIDATION ---
  const liveItems = useMemo(() => {
    if (!groups || !activeGroupId) return []
    const group = groups.find(g => g.id === activeGroupId) || groups[0]
    
    return group.items.map(groupItem => {
        const sym = groupItem.symbol
        if (!sym) return null

        const live = livePrices?.[sym]
        const history = Array.isArray(marketHistory?.[sym]) ? marketHistory[sym] : []
        
        // Safe price extraction
        const historyPrices = history
            .filter(h => h && (typeof h.price === 'number' || !isNaN(parseFloat(h.price))))
            .map(h => typeof h.price === 'number' ? h.price : parseFloat(h.price))
        
        let price = '---'
        let change = '0.0%'
        let changeNum = 0

        if (live && typeof live.price === 'number' && !isNaN(live.price)) {
            price = live.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const c = live.change || 0
            change = (c >= 0 ? '+' : '') + c.toFixed(2) + '%'
            changeNum = c
        } else if (historyPrices.length > 0) {
            const lastPrice = historyPrices[historyPrices.length - 1]
            const lastEntry = history[history.length - 1]
            const lastChange = lastEntry && typeof lastEntry.change === 'number' ? lastEntry.change : 0
            
            price = lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            change = (lastChange >= 0 ? '+' : '') + lastChange.toFixed(2) + '%'
            changeNum = lastChange
        }

        // Live Technicals with safety guards
        const rsi = historyPrices.length > 14 ? calculateRSI(historyPrices) : 50
        const trend = historyPrices.length > 20 ? detectTrend(historyPrices) : 'NEUTRAL'
        const volume = (history && history.length > 0) ? calculateRelativeActivity(history) : 'LOW'
        const volatility = Math.abs(changeNum) > 1.5 ? 'HIGH' : 'LOW'

        return { 
            symbol: sym, 
            price, 
            change, 
            changeNum, 
            tech: { rsi, trend, volatility, volume },
            history: history
        }
    }).filter(i => i !== null)
  }, [activeGroupId, groups, livePrices, marketHistory])

  const sortedItems = useMemo(() => {
    if (!liveItems) return []
    let items = [...liveItems]
    items.sort((a, b) => {
        if (!a || !b) return 0
        if (sortBy === 'SYMBOL') return (a.symbol || '').localeCompare(b.symbol || '')
        if (sortBy === 'PERFORMANCE') return (b.changeNum || 0) - (a.changeNum || 0)
        if (sortBy === 'RSI') return (b.tech?.rsi || 0) - (a.tech?.rsi || 0)
        return 0
    })
    return items
  }, [liveItems, sortBy])

  const handleOpenChart = (symbol: string) => {
    let cls = 'crypto'
    if (symbol.includes('EUR') || symbol.includes('USD') || symbol.includes('JPY')) cls = 'forex'
    setChartAsset(symbol, cls); setView('chart'); toast.info(`Opening ${symbol}`)
  }

  const handleAddSymbol = () => {
    if (!searchTerm) return
    const symbol = searchTerm.toUpperCase().replace('/', '')
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, items: [...g.items, { symbol }] } : g))
    setSearchTerm(''); fetchMarketHistory(symbol); toast.success(`${symbol} added`)
  }

  const handleDeleteSymbol = (symbol: string) => {
    setGroups(prevGroups => prevGroups.map(g => g.id === activeGroupId ? { ...g, items: g.items.filter(item => item.symbol !== symbol) } : g))
    toast.error(`${symbol} removed`)
  }

  return (
    <div key={activeGroupId} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Market Navigator</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                {groups.map(g => (
                    <button key={g.id} onClick={() => setActiveGroupId(g.id)} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.7rem', background: activeGroupId === g.id ? 'var(--accent)' : 'transparent', color: activeGroupId === g.id ? 'var(--text-static-white)' : 'var(--text-muted)' }}>{g.name}</button>
                ))}
            </div>
            <button 
                onClick={handleRefresh} 
                className="icon-btn" 
                style={{ padding: '0.5rem', color: isRefreshing ? 'var(--accent-bright)' : 'inherit' }}
                disabled={isRefreshing}
            >
                <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}>
                    <RefreshCw size={16}/>
                </motion.div>
            </button>
            <button onClick={() => { setIsEditingGroup(!isEditingGroup); }} className="icon-btn" style={{ padding: '0.5rem' }}><Settings size={16}/></button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSymbol()} placeholder={`Search symbols...`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.625rem 1rem 0.625rem 2.5rem', color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none', width: '240px' }}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {sortedItems.map(item => (
            <div key={item.symbol} className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)' }}>{item.symbol}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>${item.price}</span>
                            {item.price !== '---' && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: item.change.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{item.change}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenChart(item.symbol)} className="icon-btn" style={{ padding: '0.4rem' }}><BarChart2 size={14}/></button>
                        <button onClick={() => handleDeleteSymbol(item.symbol)} className="icon-btn" style={{ padding: '0.4rem', color: 'var(--red)' }}><Trash2 size={14}/></button>
                    </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>RSI (14)</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 900, color: item.tech.rsi > 70 ? 'var(--red)' : item.tech.rsi < 30 ? 'var(--green)' : 'var(--text-primary)' }}>{item.tech.rsi}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TREND</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: item.tech.trend === 'BULLISH' ? 'var(--green)' : item.tech.trend === 'BEARISH' ? 'var(--red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            {item.tech.trend === 'BULLISH' ? <TrendingUp size={12}/> : item.tech.trend === 'BEARISH' ? <TrendingDown size={12}/> : <Activity size={12}/>}
                            {item.tech.trend}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>VOLUME</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-primary)' }}>{item.tech.volume}</div>
                    </div>
                </div>
                
                {/* Mini sparkline (Fed by TV Data) */}
                <div style={{ marginTop: '1.25rem', height: '35px', display: 'flex', alignItems: 'flex-end', gap: '2px', opacity: 0.6 }}>
                    {(item.history || []).map((h: any, i: number) => {
                        if (!h) return null;
                        const changeVal = typeof h.change === 'number' ? h.change : 0;
                        const height = Math.max(10, Math.min(100, Math.abs(changeVal) * 50 + 20));
                        return (
                            <div key={i} style={{ flex: 1, height: `${height}%`, background: changeVal >= 0 ? 'var(--green)' : 'var(--red)', borderRadius: '1px' }} />
                        )
                    })}
                </div>
            </div>
        ))}
      </div>

      <CorrelationMatrix symbols={currentSymbols} />
    </div>
  )
}
