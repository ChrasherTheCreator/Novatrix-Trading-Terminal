import { useState, useEffect, useMemo, useRef } from 'react'
import { Globe, ChevronDown, Timer, Check } from 'lucide-react'
import { useAppStore } from '../store/app'

interface Session {
  id: string
  name: string
  start: number 
  end: number   
  color: string
}

const SESSIONS: Session[] = [
  { id: 'sydney', name: 'Sydney', start: 20, end: 5, color: '#10b981' },
  { id: 'tokyo',  name: 'Tokyo',  start: 0,  end: 9, color: '#3b82f6' },
  { id: 'london', name: 'London', start: 8,  end: 17, color: '#8b5cf6' },
  { id: 'newyork', name: 'New York', start: 13, end: 22, color: '#f59e0b' },
]

const SESSION_DETAILS = {
    sydney: {
        volatility: 2,
        pairs: 'AUD, NZD, JPY',
        desc: 'The start of the trading day. Usually low volatility but establishes the initial daily bias.',
        tip: 'Watch for AUD/NZD breakouts.'
    },
    tokyo: {
        volatility: 4,
        pairs: 'JPY, HKD, SGD',
        desc: 'Key Asian liquidity. Yen crosses often see their primary moves during this window.',
        tip: 'Tokyo lunch break often stalls price.'
    },
    london: {
        volatility: 9,
        pairs: 'EUR, GBP, CHF',
        desc: 'The global financial hub. Highest liquidity and the start of major daily trends.',
        tip: 'The "London Open" fake-out is common.'
    },
    newyork: {
        volatility: 10,
        pairs: 'USD, CAD',
        desc: 'Overlap with London creates extreme volume. Major news releases (CPI, NFP) occur here.',
        tip: 'High volatility during London overlap.'
    }
}

const TRADING_TIMEZONES = [
    { label: 'Local Time', short: 'LOCAL', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: 'UTC (GMT)', short: 'UTC', value: 'UTC' },
    { label: 'UTC-8 (L.A.)', short: 'UTC-8', value: 'America/Los_Angeles' },
    { label: 'UTC-5 (New York)', short: 'UTC-5', value: 'America/New_York' },
    { label: 'UTC+0 (London)', short: 'UTC+0', value: 'Europe/London' },
    { label: 'UTC+1 (Berlin)', short: 'UTC+1', value: 'Europe/Berlin' },
    { label: 'UTC+9 (Tokyo)', short: 'UTC+9', value: 'Asia/Tokyo' },
    { label: 'UTC+10 (Sydney)', short: 'UTC+10', value: 'Australia/Sydney' },
]

export default function MarketHours() {
  const { theme, timeFormat } = useAppStore()
  const [now, setNow] = useState(new Date())
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => { clearInterval(timer); document.removeEventListener('mousedown', handleClickOutside) }
  }, [])

  const isWeekend = useMemo(() => {
    const day = now.getUTCDay()
    const hour = now.getUTCHours()
    if (day === 5 && hour >= 22) return true
    if (day === 6) return true
    if (day === 0 && hour < 20) return true
    return false
  }, [now])

  const countdown = useMemo(() => {
    if (!isWeekend) return null
    const target = new Date(now)
    const utcDay = now.getUTCDay()
    const daysToAdd = utcDay === 5 ? 2 : (utcDay === 6 ? 1 : 0)
    target.setUTCDate(now.getUTCDate() + daysToAdd)
    target.setUTCHours(20, 0, 0, 0)
    const diff = target.getTime() - now.getTime()
    const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
    return `${d > 0 ? d+'d ' : ''}${h}h ${m}m ${s}s`
  }, [now, isWeekend])

  const formatScaleTime = (hour: number) => {
    if (timeFormat === '12h') {
        const period = hour >= 12 ? 'PM' : 'AM'
        const h = hour % 12 || 12
        return `${h}${period}`
    }
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const { hour, minute } = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-GB', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: false, 
        timeZone: tz 
    }).formatToParts(now);
    
    return {
        hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
        minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    };
  }, [now, tz]);

  const currentPos = (hour * 60 + minute) / (24 * 60) * 100;

  // Calculate session positions based on selected timezone
  const adjustedSessions = useMemo(() => {
    // Get UTC offset for the selected timezone in hours
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const offset = (tzDate.getTime() - utcDate.getTime()) / 3600000;

    return SESSIONS.map(s => {
        let start = (s.start + offset) % 24;
        let end = (s.end + offset) % 24;
        if (start < 0) start += 24;
        if (end < 0) end += 24;
        return { ...s, start, end };
    });
  }, [tz, now]);

  const ticks = Array.from({ length: 25 }).map((_, i) => i) 
  const activeTz = TRADING_TIMEZONES.find(t => t.value === tz) || TRADING_TIMEZONES[0]

  return (
    <div className="card" style={{ 
        padding: '1.5rem',
        background: isWeekend ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(0,0,0,0.8) 100%)' : 'var(--bg-card)',
        border: isWeekend ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
        position: 'relative', transition: 'all 0.4s ease'
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Globe size={18} color={isWeekend ? 'var(--red)' : 'var(--accent-bright)'}/>
                  <h2 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>MARKET SESSIONS</h2>
              </div>
              {isWeekend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red)', fontSize: '0.65rem', fontWeight: 800, paddingLeft: '1rem', borderLeft: '1px solid var(--border-subtle)' }}>
                      <Timer size={12}/>
                      <span>MARKETS CLOSED • REOPENS IN {countdown}</span>
                  </div>
              )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.25rem', fontWeight: 950, color: isWeekend ? 'var(--red)' : 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz, hour12: timeFormat === '12h' }).format(now)}
              </div>
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.35rem 1.5rem 0.35rem 0.6rem', color: 'var(--accent-bright)', fontSize: '0.6rem', fontWeight: 900, minWidth: '65px', cursor: 'pointer' }}>
                      {activeTz.short}
                      <ChevronDown size={10} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }}/>
                  </button>
                  {isOpen && (
                      <div className="card fade-in" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1000, width: '240px', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-accent)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                          {TRADING_TIMEZONES.map(t => (
                              <div key={t.value} onClick={() => { setTz(t.value); setIsOpen(false); }} style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: tz === t.value ? 'var(--accent-dim)' : 'transparent', whiteSpace: 'nowrap' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.background = tz === t.value ? 'var(--accent-dim)' : 'transparent'}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</span>
                                  {tz === t.value && <Check size={12} color="var(--accent-bright)"/>}
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div style={{ position: 'relative', marginTop: '2rem', opacity: isWeekend ? 0.25 : 1, transition: 'all 0.5s', padding: '0 20px' }}>
          <div style={{ position: 'relative', height: '20px', marginBottom: '1rem' }}>
              {ticks.map((h) => (
                  <div key={h} style={{ position: 'absolute', left: `${(h/24) * 100}%`, transform: 'translateX(-50%)', fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {formatScaleTime(h % 24)}
                  </div>
              ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
              {ticks.map(h => ( <div key={h} style={{ position: 'absolute', left: `${(h/24) * 100}%`, top: -10, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.03)', zIndex: 1 }} /> ))}

              {adjustedSessions.map(s => {
                  const isOverMidnight = s.start > s.end
                  const renderSegment = (start: number, end: number, label: string = '') => (
                      <div style={{ position: 'absolute', left: `${(start / 24) * 100}%`, width: `${((end - start) / 24) * 100}%`, height: '100%', background: theme === 'dark' ? s.color : `${s.color}20`, border: `1px solid ${s.color}`, borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: 'white', fontSize: '0.6rem', fontWeight: 900, zIndex: 2, overflow: 'hidden' }}>{label}</div>
                  )
                  return (
                      <div key={s.id} style={{ height: '32px', position: 'relative', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
                          {isOverMidnight ? (<>{renderSegment(s.start, 24, s.name.toUpperCase())}{renderSegment(0, s.end)}</>) : renderSegment(s.start, s.end, s.name.toUpperCase())}
                      </div>
                  )
              })}

              <div style={{ position: 'absolute', top: -35, bottom: -5, left: `${currentPos}%`, width: '40px', transform: 'translateX(-50%)', background: 'radial-gradient(circle at center, var(--accent-dim) 0%, transparent 70%)', opacity: 0.4, zIndex: 5, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -10, bottom: 0, left: `${currentPos}%`, width: '2px', background: 'var(--accent)', zIndex: 10, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 15px var(--accent)', border: '2px solid white' }} />
              </div>
          </div>
      </div>

      {/* Session Insights Grid */}
      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {SESSIONS.map(s => {
              const details = (SESSION_DETAILS as any)[s.id]
              const isActive = (hour >= s.start && hour < s.end) || (s.start > s.end && (hour >= s.start || hour < s.end))
              
              return (
                  <div key={s.id} className="card" style={{ 
                      padding: '1.25rem', 
                      background: isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isActive ? s.color : 'var(--border-subtle)'}`,
                      boxShadow: isActive ? `0 0 20px -10px ${s.color}` : 'none',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                  }}>
                      {isActive && <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.2rem 0.6rem', background: s.color, color: 'white', fontSize: '0.5rem', fontWeight: 900, borderRadius: '0 0 0 8px' }}>LIVE NOW</div>}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{s.name} Session</h3>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                              <span>VOLATILITY</span>
                              <span style={{ color: details.volatility > 7 ? 'var(--red)' : details.volatility > 4 ? 'var(--accent-bright)' : 'var(--green)' }}>{details.volatility}/10</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${details.volatility * 10}%`, height: '100%', background: s.color, borderRadius: '2px' }} />
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>FOCUS PAIRS</div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bright)' }}>{details.pairs}</div>
                          </div>
                          <div>
                              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>STRATEGY TIP</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{details.tip}</div>
                          </div>
                      </div>
                  </div>
              )
          })}
      </div>
    </div>
  )
}
