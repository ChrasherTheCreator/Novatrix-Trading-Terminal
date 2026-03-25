import { useState, useEffect }    from 'react'
import { useAppStore } from './store/app'
import Sidebar from './components/Sidebar'
import Topbar  from './components/Topbar'
import Dashboard       from './pages/Dashboard'
import AnalyticsPage   from './pages/Analytics'
import Journal         from './pages/Journal'
import EconomicCalendar from './pages/EconomicCalendar'
import Reports         from './pages/Reports'
import Chart          from './pages/Chart'
import Playbooks       from './pages/Playbooks'
import Settings        from './pages/Settings'
import Backtest        from './pages/Backtest'
import Watchlist       from './pages/Watchlist'
import Mentor          from './pages/Mentor'
import MarketHours       from './components/MarketHours'
import StrategyOptimization from './pages/StrategyOptimization'
import PulseModal      from './components/PulseModal'
import AuthModal       from './components/AuthModal'
import ErrorBoundary   from './components/ErrorBoundary'
import { toast }       from 'sonner'

// Dynamic API logic
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);
const WS_URL = API_URL.replace('http', 'ws') + '/ws/ticks';

export default function App() {
  const [hydrated, setHydrated] = useState(false)
  const theme = useAppStore(state => state.theme)
  
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Debug: Reset store via query param
  useEffect(() => {
    if (window.location.search.includes('reset=true')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }, [])

  const activeViewRaw = useAppStore(state => state.activeView)
  const activeView = activeViewRaw || 'dashboard'
  const setView = useAppStore(state => state.setView)
  const setTrades = useAppStore(state => state.setTrades)
  const fetchCalendar = useAppStore(state => state.fetchCalendar)
  const updateCalendarDay = useAppStore(state => state.updateCalendarDay)
  const updateLivePrice = useAppStore(state => state.updateLivePrice)
  const fetchNews = useAppStore(state => state.fetchNews)
  const setNews = useAppStore(state => state.setNews)
  const fetchEconomicEvents = useAppStore(state => state.fetchEconomicEvents)
  const startPriceWiggle = useAppStore(state => state.startPriceWiggle)
  const user = useAppStore(state => state.user)
  
  const riskSettings = useAppStore(state => state.riskSettings)
  
  const [pulseOpen, setPulseOpen] = useState(false)

  useEffect(() => {
    startPriceWiggle()
  }, [startPriceWiggle])

  // Session Alerts Logic
  useEffect(() => {
    if (!riskSettings.sessionAlerts) return

    const checkSessions = () => {
        const now = new Date()
        const utcHour = now.getUTCHours()
        const utcMin = now.getUTCMinutes()

        if (utcMin === 0) {
            const sessions: Record<number, string> = { 0: 'Tokyo', 8: 'London', 13: 'New York', 22: 'Sydney' }
            if (sessions[utcHour]) {
                toast.success(`${sessions[utcHour]} Market is now OPEN!`, {
                    description: 'High liquidity period starting now.',
                    icon: '🚀',
                    duration: 8000
                })
            }
        }
    }

    const interval = setInterval(checkSessions, 60000)
    return () => clearInterval(interval)
  }, [riskSettings.sessionAlerts])

  // Apply theme class to root
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', theme === 'light')
  }, [theme])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return

      if (ev.key.toLowerCase() === 'p') {
        setPulseOpen(true)
      } else if (ev.key.toLowerCase() === 's') {
        setView('journal')
      } else if (ev.key.toLowerCase() === 't') {
        setView('journal')
      } else if (ev.code === 'Space') {
        ev.preventDefault()
        console.log('Command Palette triggered')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setView])

  // Fetch initial data
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/trades`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.trades) && data.trades.length > 0) {
              const normalized = data.trades.map((t: Record<string, unknown>) => ({
                ...t,
                status: String(t.status || 'OPEN').toUpperCase() as 'OPEN' | 'CLOSED',
                tags: typeof t.tags === 'string' ? t.tags.split(',').filter(Boolean) : (Array.isArray(t.tags) ? t.tags : []),
                mistake_tags: typeof t.mistake_tags === 'string' ? t.mistake_tags.split(',').filter(Boolean) : (Array.isArray(t.mistake_tags) ? t.mistake_tags : []),
                images: typeof t.images === 'string' ? t.images.split(',').filter(Boolean) : (Array.isArray(t.images) ? t.images : []),
              }))
              setTrades(normalized)
            }
        }
      } catch (_err) {
        console.error('Failed to fetch trades')
      }

      try {
        const res = await fetch(`${API_URL}/api/accounts`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
        if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.accounts) && data.accounts.length > 0) {
              fetchCalendar(data.accounts[0].id)
            }
        }
      } catch (_err) {
        console.error('Failed to fetch accounts')
      }

      fetchNews()
      fetchEconomicEvents()
    }

    loadData()
  }, [user, setTrades, fetchCalendar, fetchNews, fetchEconomicEvents])

  // WebSocket for Live Updates
  useEffect(() => {
    if (!user) return
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
        ws = new WebSocket(WS_URL)
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (!msg || !msg.payload) return;

            if (msg.msg_type === 'CALENDAR_UPDATE') {
              updateCalendarDay(msg.payload.date, msg.payload.new_pnl, msg.payload.mae, msg.payload.mfe)
            } else if (msg.msg_type === 'MARKET_TICK') {
              const { symbol, price } = msg.payload;
              if (symbol && price) {
                const cleanSym = (symbol as string).toUpperCase().replace('/', '');
                updateLivePrice(cleanSym, parseFloat(price), 0);
              }
            } else if (msg.msg_type === 'NEWS_ALERT') {
              toast.error(`High Impact News: ${msg.payload.title || 'Alert'} (${msg.payload.currency || '???'}) in ${msg.payload.minutes_left || '0'} minutes!`, {
                duration: 10000,
                icon: '⚠️'
              });
            } else if (msg.msg_type === 'MARKET_NEWS') {
              if (Array.isArray(msg.payload)) setNews(msg.payload);
            } else if (msg.msg_type === 'FINNHUB_WEBHOOK') {
              // Neue Logik für Finnhub Webhook Daten
              console.log('Finnhub Webhook Data:', msg.payload);
              toast.info('Finnhub Intelligence Update', {
                description: (msg.payload.category as string) || 'New data received via Webhook',
                icon: '⚡',
                duration: 5000
              });
            }
          } catch (_e) { /* ignore */ }
        }
        ws.onclose = () => {
            reconnectTimer = setTimeout(connect, 5000)
        }
    }

    connect()
    return () => {
        if (ws) ws.close()
        if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [user, updateCalendarDay, updateLivePrice, setNews])

  const Page = () => {
    switch (activeView) {
      case 'dashboard':  return <Dashboard/>
      case 'analytics':  return <AnalyticsPage/>
      case 'journal':    return <Journal/>
      case 'calendar':   return <EconomicCalendar/>
      case 'reports':    return <Reports/>
      case 'chart':      return <Chart/>
      case 'watchlist':  return <Watchlist/>
      case 'playbooks':  return <Playbooks/>
      case 'settings':   return <Settings/>
      case 'backtest':   return <Backtest/>
      case 'mentor':     return <Mentor/>
      case 'sessions':   return <MarketHours/>
      case 'strategy':   return <StrategyOptimization/>
      default:           return <Dashboard/>
    }
  }

  if (!hydrated) {
    return <div style={{ height: '100vh', background: '#0a0a12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', gap: '1rem' }}>
      <div className="animate-pulse" style={{ fontWeight: 800, letterSpacing: '0.1em' }}>LOADING SYSTEM...</div>
      <a href="/?reset=true" style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'none', opacity: 0.5 }}>Emergency Reset</a>
    </div>
  }

  if (!user) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', background: '#0a0a12' }}>
        <AuthModal />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar/>
      <div className="main-content">
        <Topbar/>
        <div className="page-area">
          <ErrorBoundary>
            <Page/>
          </ErrorBoundary>
        </div>
      </div>
      {pulseOpen && <PulseModal onClose={() => setPulseOpen(false)} />}
    </div>
  )
}
