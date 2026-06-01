import React, { useState, useMemo, useEffect } from 'react'
import { Activity, Newspaper, ExternalLink, Search, X, Info, Globe, BarChart, ChevronDown, ChevronUp, History, Calendar as CalendarIcon, Briefcase, Cpu, Coins, CandlestickChart } from 'lucide-react'
import { useAppStore, EconomicEvent as StoreEconomicEvent, NewsItem } from '../store/app'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface EconomicEvent {
  id: string
  event_time: string
  time: string
  currency: string
  event: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  previous: string
  forecast: string
  actual: string
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  is_live: boolean
  country: string
  unit: string
}

type NewsCategory = 'ALL' | 'FOREX' | 'STOCKS' | 'TECH' | 'CRYPTO' | 'MACRO';
type TimeRange = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

// ── Category Logic ──
const categorizeNews = (title: string, snippet: string): NewsCategory => {
    const text = (title + ' ' + snippet).toUpperCase();
    if (text.includes('BTC') || text.includes('CRYPTO') || text.includes('ETH') || text.includes('BITCOIN') || text.includes('SOLANA')) return 'CRYPTO';
    if (text.includes('FED') || text.includes('INFLATION') || text.includes('GDP') || text.includes('ECONOMY') || text.includes('CENTRAL BANK')) return 'MACRO';
    if (text.includes('APPLE') || text.includes('NVIDIA') || text.includes('AI') || text.includes('TECH') || text.includes('GOOGLE') || text.includes('MICROSOFT')) return 'TECH';
    if (text.includes('EUR') || text.includes('USD') || text.includes('GBP') || text.includes('YEN') || text.includes('FOREX') || text.includes('FX')) return 'FOREX';
    if (text.includes('STOCK') || text.includes('EARNINGS') || text.includes('S&P') || text.includes('NASDAQ') || text.includes('EQUITIES')) return 'STOCKS';
    return 'MACRO';
};

// ── Official Links mapping ──
const OFFICIAL_LINKS: Record<string, string> = {
    'AVERAGE CASH EARNINGS Y/Y': 'https://www.jil.go.jp/english/estatis/eshuyo/e0301.html',
    'BANK LENDING Y/Y': 'https://www.boj.or.jp/en/statistics/dl/loan/index.htm',
    'CURRENT ACCOUNT': 'https://www.boj.or.jp/en/statistics/boj/other/cabs/index.htm',
    'CPI Y/Y': 'https://www.stats.gov.cn/english/',
    'NON-FARM EMPLOYMENT CHANGE': 'https://www.bls.gov/news.release/empsit.nr0.htm',
    'UNEMPLOYMENT RATE': 'https://www.bls.gov/news.release/empsit.t01.htm',
};

const getOfficialUrl = (event: string, country: string) => {
    const upper = event.toUpperCase();
    for (const key in OFFICIAL_LINKS) {
        if (upper.includes(key)) return OFFICIAL_LINKS[key];
    }
    return `https://www.google.com/search?q=${encodeURIComponent(country + ' ' + event + ' official source release site')}`;
};

const EVENT_METADATA: Record<string, { measures: string, usual_effect: string, why_care: string, source: string }> = {
    'CPI': {
        measures: "Change in the price of goods and services purchased by consumers.",
        usual_effect: "Actual > Forecast = Good for currency",
        why_care: "Consumer prices account for a majority of overall inflation.",
        source: "Bureau of Labor Statistics / Eurostat"
    },
    'GDP': {
        measures: "Annualized change in the inflation-adjusted value of all goods and services produced by the economy.",
        usual_effect: "Actual > Forecast = Good for currency",
        why_care: "Primary gauge of the economy's health.",
        source: "Bureau of Economic Analysis"
    }
};

const getEnrichedData = (title: string) => {
    const upper = title.toUpperCase();
    for (const key in EVENT_METADATA) {
        if (upper.includes(key)) return EVENT_METADATA[key];
    }
    return {
        measures: "Economic indicator tracking " + title,
        usual_effect: "Varies depending on market context.",
        why_care: "Traders watch this event to gauge the strength of the economy.",
        source: "National Statistical Office"
    };
};

export default function EconomicCalendar() {
  const { news, fetchNews, economicEvents, fetchEconomicEvents } = useAppStore()
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'NEWS'>('CALENDAR')
  const [filter, setFilter] = useState<'ALL' | 'HIGH'>('ALL')
  const [searchTerm, setSearchText] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [showPast, setShowPast] = useState(false)
  
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<NewsCategory>('ALL');
  const [timeRange, setTimeRange] = useState<TimeRange>('TODAY');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchNews()
    fetchEconomicEvents()
    const interval = setInterval(fetchEconomicEvents, 300000) 
    
    // Live update for the 'NOW' marker
    const nowInterval = setInterval(() => setNow(new Date()), 60000);
    
    return () => {
        clearInterval(interval);
        clearInterval(nowInterval);
    };
  }, [fetchNews, fetchEconomicEvents])

  useEffect(() => {
    if (selectedEvent || selectedNews) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedEvent, selectedNews]);

  const events: EconomicEvent[] = useMemo(() => {
    return economicEvents.map((e: StoreEconomicEvent) => {
        const dateObj = new Date(e.event_time);
        const diffMins = (dateObj.getTime() - now.getTime()) / 60000;
        
        let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
        if (e.actual && e.forecast) {
            const a = parseFloat(e.actual.replace(/[^0-9.-]/g, ''));
            const f = parseFloat(e.forecast.replace(/[^0-9.-]/g, ''));
            if (!isNaN(a) && !isNaN(f)) {
                if (a > f) sentiment = 'POSITIVE';
                else if (a < f) sentiment = 'NEGATIVE';
            }
        }

        return {
            id: e.id,
            event_time: e.event_time,
            time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            currency: e.currency,
            event: e.title,
            impact: (e.impact.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH') || 'LOW',
            previous: e.previous || '--',
            forecast: e.forecast || '--',
            actual: e.actual || '',
            sentiment,
            is_live: diffMins <= 5 && diffMins >= -15,
            country: e.country || 'Global',
            unit: e.unit || ''
        }
    })
  }, [economicEvents, now])

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
        const matchesImpact = filter === 'ALL' || e.impact === 'HIGH';
        const matchesSearch = e.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             e.currency.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesImpact && matchesSearch;
    })
  }, [events, filter, searchTerm])

  const { pastGroups, currentGroups } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const past: Record<string, EconomicEvent[]> = {}
    const current: Record<string, EconomicEvent[]> = {}

    filteredEvents.forEach(e => {
        const dateObj = new Date(e.event_time)
        const dateKey = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        const compareDate = new Date(e.event_time);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate < today) {
            if (!past[dateKey]) past[dateKey] = []
            past[dateKey].push(e)
        } else {
            if (!current[dateKey]) current[dateKey] = []
            current[dateKey].push(e)
        }
    })

    const sortFn = (a: [string, EconomicEvent[]], b: [string, EconomicEvent[]]) => 
        new Date(a[1][0].event_time).getTime() - new Date(b[1][0].event_time).getTime();
    
    return {
        pastGroups: Object.entries(past).sort(sortFn).reverse(),
        currentGroups: Object.entries(current).sort(sortFn)
    }
  }, [filteredEvents])

  const filteredNews = useMemo(() => {
    let list = [...news];

    list = list.filter(item => {
        const itemDate = new Date(item.published_at);
        if (timeRange === 'TODAY') return itemDate.toDateString() === now.toDateString();
        if (timeRange === 'THIS_WEEK') {
            const startOfWeek = new Date(now);
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);
            return itemDate >= startOfWeek;
        }
        if (timeRange === 'THIS_MONTH') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        return true;
    });

    if (selectedNewsCategory !== 'ALL') {
        list = list.filter(item => categorizeNews(item.title, item.snippet) === selectedNewsCategory);
    }

    if (searchTerm) {
        list = list.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.snippet.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  }, [news, selectedNewsCategory, timeRange, searchTerm, now]);

  const enriched = useMemo(() => selectedEvent ? getEnrichedData(selectedEvent.event) : null, [selectedEvent]);
  const officialUrl = useMemo(() => selectedEvent ? getOfficialUrl(selectedEvent.event, selectedEvent.country) : '#', [selectedEvent]);

  const EventTable = ({ dayEvents }: { dayEvents: EconomicEvent[] }) => {
    const isToday = dayEvents.length > 0 && new Date(dayEvents[0].event_time).toDateString() === now.toDateString();
    let markerShown = false;

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ width: '12%', padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>TIME</th>
                        <th style={{ width: '12%', padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>CURR</th>
                        <th style={{ width: '30%', padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>EVENT</th>
                        <th style={{ width: '10%', padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>IMPACT</th>
                        <th style={{ width: '12%', padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACTUAL</th>
                        <th style={{ width: '12%', padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>FORECAST</th>
                        <th style={{ width: '12%', padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>PREVIOUS</th>
                    </tr>
                </thead>
                <tbody>
                    {dayEvents.map((event) => {
                        const eventDate = new Date(event.event_time);
                        const showMarker = isToday && !markerShown && eventDate > now;
                        if (showMarker) markerShown = true;

                        return (
                            <React.Fragment key={event.id}>
                                {showMarker && (
                                    <tr key="now-marker">
                                        <td colSpan={7} style={{ padding: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.5rem 1rem',
                                                background: 'var(--accent-dim)',
                                                borderTop: '1px solid var(--accent)',
                                                borderBottom: '1px solid var(--accent)',
                                                position: 'relative',
                                            }}>
                                                <div style={{
                                                    background: 'var(--accent)',
                                                    color: 'white',
                                                    fontSize: '0.55rem',
                                                    fontWeight: 900,
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '4px',
                                                    letterSpacing: '0.05em'
                                                }}>LIVE</div>
                                                <div style={{ flex: 1, height: '1px', background: 'var(--accent)', opacity: 0.2 }}></div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-bright)' }}>
                                                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                <tr className="table-row-hover" style={{ borderBottom: '1px solid var(--border-subtle)', background: event.is_live ? 'rgba(139, 92, 246, 0.05)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: event.is_live ? 'var(--accent-bright)' : 'var(--text-primary)' }}>{event.time}</td>
                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{event.currency}</td>
                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.event}</td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', margin: '0 auto', background: event.impact === 'HIGH' ? '#ef4444' : event.impact === 'MEDIUM' ? '#f59e0b' : '#94a3b8' }} />
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: event.sentiment === 'POSITIVE' ? 'var(--green)' : event.sentiment === 'NEGATIVE' ? 'var(--red)' : 'var(--text-primary)' }}>{event.actual || '--'}</td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.forecast}</td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.previous}</td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                    {isToday && !markerShown && (
                        <tr key="now-marker-end">
                            <td colSpan={7} style={{ padding: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.5rem 1rem',
                                    background: 'var(--accent-dim)',
                                    borderTop: '1px solid var(--accent)',
                                    position: 'relative',
                                }}>
                                    <div style={{
                                        background: 'var(--accent)',
                                        color: 'white',
                                        fontSize: '0.55rem',
                                        fontWeight: 900,
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        letterSpacing: '0.05em'
                                    }}>LIVE</div>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--accent)', opacity: 0.2 }}></div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-bright)' }}>
                                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', position: 'relative' }}>
      
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
              <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.4rem' }}>Still Under Development / In Entwicklung:</span> Dieser Bereich befindet sich in der aktiven Entwicklung. Der Wirtschaftskalender und Newsfeed sind teils unvollständig oder laufen mit historischen Testdaten.
          </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <button onClick={() => setActiveTab('CALENDAR')} style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', background: activeTab === 'CALENDAR' ? 'var(--accent)' : 'transparent', color: activeTab === 'CALENDAR' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>CALENDAR</button>
            <button onClick={() => setActiveTab('NEWS')} style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', background: activeTab === 'NEWS' ? 'var(--accent)' : 'transparent', color: activeTab === 'NEWS' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>NEWS FEED</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeTab === 'NEWS' && (
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => setTimeRange('TODAY')} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem', fontWeight: 800, background: timeRange === 'TODAY' ? 'var(--bg-card)' : 'transparent', color: timeRange === 'TODAY' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>THIS DAY</button>
                    <button onClick={() => setTimeRange('THIS_WEEK')} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem', fontWeight: 800, background: timeRange === 'THIS_WEEK' ? 'var(--bg-card)' : 'transparent', color: timeRange === 'THIS_WEEK' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>THIS WEEK</button>
                    <button onClick={() => setTimeRange('THIS_MONTH')} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem', fontWeight: 800, background: timeRange === 'THIS_MONTH' ? 'var(--bg-card)' : 'transparent', color: timeRange === 'THIS_MONTH' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>THIS MONTH</button>
                </div>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}/>
                <input placeholder={activeTab === 'CALENDAR' ? "Search events..." : "Search news..."} value={searchTerm} onChange={e => setSearchText(e.target.value)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.75rem', color: 'var(--text-primary)', width: '200px', outline: 'none' }} />
            </div>
            {activeTab === 'CALENDAR' && (
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => setFilter('ALL')} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem', fontWeight: 800, background: filter === 'ALL' ? 'var(--bg-card)' : 'transparent', color: filter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>ALL</button>
                    <button onClick={() => setFilter('HIGH')} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem', fontWeight: 800, background: filter === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: filter === 'HIGH' ? 'var(--red)' : 'var(--text-muted)', cursor: 'pointer' }}>HIGH IMPACT</button>
                </div>
            )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'CALENDAR' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pastGroups.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                        <button onClick={() => setShowPast(!showPast)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem 1.25rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><History size={16} color={showPast ? 'var(--accent-bright)' : 'var(--text-muted)'}/><span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>{showPast ? 'HIDE PREVIOUS EVENTS' : `SHOW PREVIOUS EVENTS (${pastGroups.length} DAYS)`}</span></div>
                            {showPast ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                        <AnimatePresence>{showPast && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                            {pastGroups.map(([date, dayEvents]) => (<div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7 }}><div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>{date.toUpperCase()} (PAST)</div><EventTable dayEvents={dayEvents}/></div>))}
                        </motion.div>)}</AnimatePresence>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentGroups.map(([date, dayEvents]) => (
                        <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.2) 0%, rgba(10, 10, 18, 0.9) 100%)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '0.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CalendarIcon size={16} color="var(--accent-bright)"/><span>{date.toUpperCase()}</span></div>
                                {new Date(date).toDateString() === new Date().toDateString() && (<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-dim)', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-accent)' }}><div className="status-dot" style={{ width: 6, height: 6 }} /><span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent-bright)' }}>TODAY</span></div>)}
                            </div>
                            <EventTable dayEvents={dayEvents}/>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {(['ALL', 'FOREX', 'STOCKS', 'TECH', 'CRYPTO', 'MACRO'] as NewsCategory[]).map(cat => (
                        <button key={cat} onClick={() => setSelectedNewsCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, background: selectedNewsCategory === cat ? 'var(--accent)' : 'var(--bg-secondary)', color: selectedNewsCategory === cat ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                            {cat === 'FOREX' && <Briefcase size={14}/>}
                            {cat === 'TECH' && <Cpu size={14}/>}
                            {cat === 'CRYPTO' && <Coins size={14}/>}
                            {cat === 'STOCKS' && <CandlestickChart size={14}/>}
                            {cat === 'MACRO' && <Globe size={14}/>}
                            {cat}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' }}>
                    {filteredNews.map((item, idx) => {
                        const cat = categorizeNews(item.title, item.snippet);
                        return (
                            <div key={item.uuid || idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', borderLeft: `4px solid ${cat === 'FOREX' ? '#3b82f6' : cat === 'CRYPTO' ? '#f59e0b' : cat === 'TECH' ? '#a855f7' : cat === 'STOCKS' ? '#10b981' : 'var(--text-muted)'}`, cursor: 'pointer' }} onClick={() => setSelectedNews(item)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--accent-bright)', background: 'var(--accent-dim)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{cat}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <ExternalLink size={14} color="var(--text-muted)"/>
                                </div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.snippet}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {/* ── Modal Portal Logic ── */}
      {createPortal(
        <AnimatePresence>
            {(selectedEvent || selectedNews) && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedEvent(null); setSelectedNews(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
                    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: 0, position: 'relative', zIndex: 10001, border: '1px solid var(--border-accent)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                        
                        {/* News Modal View */}
                        {selectedNews && (
                            <>
                                <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Newspaper size={20} color="var(--accent-bright)"/>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>Market News Detail</h2>
                                    </div>
                                    <button onClick={() => setSelectedNews(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
                                </div>
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent-bright)', background: 'var(--accent-dim)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{(selectedNews.source || 'WIRE').toUpperCase()}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            {new Date(selectedNews.published_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(selectedNews.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h1 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '1.5rem' }}>{selectedNews.title}</h1>
                                    <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selectedNews.snippet}</p>
                                    </div>
                                    <a href={selectedNews.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--accent)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem' }}>
                                        <ExternalLink size={18}/> READ FULL ARTICLE ON {(selectedNews.source || 'SOURCE').toUpperCase()}
                                    </a>
                                </div>
                            </>
                        )}

                        {/* Calendar Modal View (Original implementation) */}
                        {selectedEvent && enriched && (
                            <>
                                <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 2, background: selectedEvent.impact === 'HIGH' ? 'var(--red)' : selectedEvent.impact === 'MEDIUM' ? '#f59e0b' : 'var(--text-muted)' }} />
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedEvent.event}</h2>
                                    </div>
                                    <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
                                </div>
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem' }}>
                                        <div style={{ padding: '1rem', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTUAL</div><div style={{ fontSize: '1.25rem', fontWeight: 950, color: selectedEvent.sentiment === 'POSITIVE' ? 'var(--green)' : selectedEvent.sentiment === 'NEGATIVE' ? 'var(--red)' : 'var(--text-primary)' }}>{selectedEvent.actual || '--'}</div></div>
                                        <div style={{ padding: '1rem', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>FORECAST</div><div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-primary)' }}>{selectedEvent.forecast}</div></div>
                                        <div style={{ padding: '1rem', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PREVIOUS</div><div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-secondary)' }}>{selectedEvent.previous}</div></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}><div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={14}/> SOURCE</div><div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{enriched.source}</div></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}><div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart size={14}/> MEASURES</div><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{enriched.measures}</div></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}><div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14}/> USUAL EFFECT</div><div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{enriched.usual_effect}</div></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}><div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={14}/> WHY CARE</div><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>{enriched.why_care}</div></div>
                                    </div>
                                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                                        <a href={officialUrl} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--accent)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem' }}><Globe size={16}/> OFFICIAL SOURCE</a>
                                        <a href={`https://www.forexfactory.com/calendar?q=${encodeURIComponent(selectedEvent.event)}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}><ExternalLink size={16}/> FOREX FACTORY</a>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
