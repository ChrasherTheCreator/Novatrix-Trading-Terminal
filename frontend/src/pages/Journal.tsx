import { useState, useEffect } from 'react'
import { CheckSquare, Square, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useAppStore, Trade } from '../store/app'
import { toast } from 'sonner'
import StructuredJournal from '../components/journal/StructuredJournal'
import TradeDetailModal from '../components/TradeDetailModal'
import { AnimatePresence } from 'framer-motion'

export default function Journal() {
  const { playbooks, addTrade, accounts, trades } = useAppStore()
  const [mode, setMode]     = useState<'DAILY' | 'TRADE'>('DAILY')
  const [side, setSide]     = useState<'LONG' | 'SHORT'>('LONG')
  const [strategyId, setStrategyId] = useState(playbooks[0]?.id || '')
  const [checks, setChecks]     = useState<{text: string, done: boolean}[]>([])
  const [entry, setEntry]   = useState('26,450.00')
  const [sl, setSl]         = useState('25,900.00')
  const [tp, setTp]         = useState('28,100.00')
  const [risk, setRisk]     = useState('500')
  const [asset, setAsset]   = useState('BTC/USDT')
  const [notes, setNotes]   = useState('')
  const [calculatedLots, setCalculatedLots] = useState<string | null>(null)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    const pb = playbooks.find(p => p.id === strategyId)
    if (pb) {
      setChecks(pb.rules.map(r => ({ text: r.text, done: false })))
    }
  }, [strategyId, playbooks])

  const calculateSize = () => {
    const r = parseFloat(risk.replace(/,/g, ''))
    const e = parseFloat(entry.replace(/,/g, ''))
    const s = parseFloat(sl.replace(/,/g, ''))
    
    if (!r || !e || !s || e === s) {
      setCalculatedLots(null)
      return
    }

    const dist = Math.abs(e - s)
    const lots = r / dist
    setCalculatedLots(lots.toFixed(2))
    toast.success(`Position Size: ${lots.toFixed(2)} units`)
  }

  const rrRatio = (() => {
    const e = parseFloat(entry.replace(/,/g, ''))
    const s = parseFloat(sl.replace(/,/g, ''))
    const t = parseFloat(tp.replace(/,/g, ''))
    if (!e || !s || !t) return null
    const rr = Math.abs((t - e) / (e - s))
    return isNaN(rr) ? null : rr.toFixed(2)
  })()

  const toggle = (idx: number) => setChecks(c => c.map((x, i) => i === idx ? { ...x, done: !x.done } : x))

  const handleSaveTrade = async () => {
    const account = accounts[0]
    if (!account) {
      toast.error('No active account found')
      return
    }

    if (!checks.every(c => c.done)) {
      toast.error('Incomplete Playbook: Please finish your pre-trade checklist!')
      return
    }

    const tradeData = {
      account_id: account.id,
      symbol: asset,
      side,
      entry_price: parseFloat(entry.replace(/,/g, '')),
      stop_loss: parseFloat(sl.replace(/,/g, '')),
      take_profit: parseFloat(tp.replace(/,/g, '')),
      lot_size: calculatedLots ? parseFloat(calculatedLots) : 1.0, 
      risk_amount: parseFloat(risk.replace(/,/g, '')),
      strategy: playbooks.find(p => p.id === strategyId)?.name,
      playbook_id: strategyId,
      notes,
      images,
      tags: checks.filter(c => c.done).map(c => c.text),
      created_at: new Date().toISOString()
    }

    await addTrade(tradeData)
    toast.success('Trade logged successfully')
    setNotes('')
    setImages([])
    setAsset('BTC/USDT')
    setCalculatedLots(null)
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Mission Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{mode === 'DAILY' ? 'Daily Process — ' : 'Trade Entry Sequence — '}{new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
           <button 
             onClick={() => setMode('DAILY')}
             style={{ 
               padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem',
               background: mode === 'DAILY' ? 'var(--accent)' : 'transparent',
               color: mode === 'DAILY' ? 'var(--text-static-white)' : 'var(--text-muted)',
               transition: 'all 0.2s'
             }}
           >DAILY JOURNAL</button>
           <button 
             onClick={() => setMode('TRADE')}
             style={{ 
               padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem',
               background: mode === 'TRADE' ? 'var(--accent)' : 'transparent',
               color: mode === 'TRADE' ? 'var(--text-static-white)' : 'var(--text-muted)',
               transition: 'all 0.2s'
             }}
           >TRADE LOGGER</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mode === 'DAILY' ? '1fr 320px' : '1fr 320px', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'DAILY' ? <StructuredJournal /> : (
            <>
              {/* Strategy Playbook */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--accent-bright)' }}>📖</span>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Strategy Playbook</h2>
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>CORE STRATEGY</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {playbooks.map(p => (
                  <button key={p.id} onClick={() => setStrategyId(p.id)} style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: strategyId === p.id ? 'var(--accent)' : 'transparent',
                  color: strategyId === p.id ? 'var(--text-static-white)' : 'var(--text-secondary)',
                  border: strategyId === p.id ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease',
                  }}>{p.name}</button>
                  ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>PRE-TRADE CHECKLIST</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {checks.map((c, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span onClick={() => toggle(i)} style={{ flexShrink: 0, marginTop: 1 }}>
                        {c.done
                          ? <CheckSquare size={16} color="var(--accent-bright)"/>
                          : <Square size={16} color="var(--text-muted)"/>
                        }
                      </span>
                      {c.text}
                    </label>
                  ))}
                  </div>
                  </div>
                  <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>MARKET CONTEXT</div>
                  <select style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                  <option>Trending Bullish</option>
                  <option>Ranging</option>
                  <option>Trending Bearish</option>
                  </select>
                  </div>
                  </div>
                  </div>

                  {/* Trade Metrics */}
                  <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ color: 'var(--accent-bright)' }}>📊</span>
                  <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Trade Metrics</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                  <div className="metric-label" style={{ marginBottom: '0.5rem' }}>ASSET PAIR</div>
                  <input value={asset} onChange={e => setAsset(e.target.value)} style={{ width:'100%', background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'8px', padding:'0.625rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9375rem', fontWeight:700, outline:'none' }}/>
                  </div>
                  <div>
                  <div className="metric-label" style={{ marginBottom: '0.5rem' }}>POSITION SIDE</div>
                  <div style={{ display:'flex', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                  {(['LONG','SHORT'] as const).map(s => (
                    <button key={s} onClick={() => setSide(s)} style={{ flex:1, padding:'0.625rem', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.8125rem', background: side === s ? (s==='LONG' ? 'var(--green)' : 'var(--red)') : 'var(--bg-secondary)', color: side === s ? 'var(--text-static-white)' : 'var(--text-muted)', transition: 'all 0.15s ease' }}>{s}</button>
                  ))}
                  </div>
                  </div>
                  <div>
                  <div className="metric-label" style={{ marginBottom: '0.5rem' }}>RISK AMOUNT ($)</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input value={risk} onChange={e => setRisk(e.target.value)} style={{ flex: 1, minWidth: 0, background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'8px', padding:'0.625rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9375rem', fontWeight:700, outline:'none' }}/>
                  <button onClick={calculateSize} style={{ padding: '0 0.75rem', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>CALC</button>
                  </div>
                  {calculatedLots && <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: 'var(--accent-bright)', fontWeight: 600 }}>Size: {calculatedLots} lots</div>}
                  </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  {[ { label: 'ENTRY PRICE', value: entry, setter: setEntry }, { label: 'STOP LOSS', value: sl, setter: setSl }, { label: 'TAKE PROFIT', value: tp, setter: setTp } ].map(f => (
                  <div key={f.label}>
                  <div className="metric-label" style={{ marginBottom: '0.5rem' }}>{f.label}</div>
                  <input value={f.value} onChange={e => f.setter(e.target.value)} style={{ width:'100%', background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'8px', padding:'0.625rem', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.9375rem', outline:'none' }}/>
                  </div>
                  ))}                  <div>
                    <div className="metric-label" style={{ marginBottom: '0.5rem' }}>R/R RATIO</div>
                    <div style={{ width:'100%', background:'var(--accent-dim)', border:'1px solid var(--border-accent)', borderRadius:'8px', padding:'0.625rem', color:'var(--accent-bright)', fontWeight:800, fontSize:'1.125rem' }}>
                      {rrRatio ? `${rrRatio}x` : '--'}
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleSaveTrade} className="btn-primary" style={{ padding: '1rem', width: '100%', borderRadius: '12px', fontWeight: 800 }}>LOG TRADE TO MISSION CONTROL</button>
            </>
          )}

          {/* Trade History Section - ALWAYS VISIBLE */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <History size={18} color="var(--accent-bright)"/>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Recent Trade Execution History</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {sortedTrades.length > 0 ? sortedTrades.map(t => (
                <div key={t.id} onClick={() => setSelectedTrade(t)} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 80px 100px', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <div style={{ color: t.side === 'LONG' ? 'var(--green)' : 'var(--red)' }}>
                    {t.side === 'LONG' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.symbol}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()} • {t.strategy || 'No Strategy'}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.side}</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.875rem', color: (t.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(t.pnl || 0) >= 0 ? '+' : '-'}${Math.abs(t.pnl || 0).toLocaleString()}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                  No trades found in database.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ borderColor: 'var(--border-accent)', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.04))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <span>🧠</span>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Mindset Check</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '1rem' }}>
              "Focus on the process, not the outcome. Stay disciplined with your playbook execution."
            </p>
          </div>

          <div className="card">
            <div className="metric-label" style={{ marginBottom: '0.875rem' }}>QUICK ACCOUNT OVERVIEW</div>
            {[
              { label: 'Total Trades',    value: trades.length, color: 'var(--text-primary)' },
              { label: 'Win Rate',        value: `${((trades.filter(t => (t.pnl || 0) > 0).length / (trades.length || 1)) * 100).toFixed(1)}%`, color: 'var(--accent-bright)' },
              { label: 'Total PnL',       value: `${trades.reduce((s,t) => s + (t.pnl || 0), 0) >= 0 ? '+' : '-'}$${Math.abs(trades.reduce((s,t) => s + (t.pnl || 0), 0)).toLocaleString()}`, color: trades.reduce((s,t) => s + (t.pnl || 0), 0) >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailModal 
            trade={selectedTrade} 
            onClose={() => setSelectedTrade(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
