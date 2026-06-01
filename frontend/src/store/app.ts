import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'
export type View  = 'dashboard' | 'analytics' | 'reports' | 'chart' | 'journal' | 'calendar' | 'settings' | 'playbooks' | 'backtest' | 'mentor' | 'watchlist' | 'sessions' | 'strategy'

export type SettingsTab = 'profile' | 'general' | 'accounts' | 'security' | 'notifications' | 'data'

export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
}

export interface NewsItem {
  uuid: string
  title: string
  description: string
  snippet: string
  url: string
  image_url: string
  published_at: string
  source: string
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

export interface EconomicEvent {
  id: string
  event_time: string
  currency: string
  impact: string
  title: string
  actual?: string
  forecast?: string
  previous?: string
  unit?: string
  country?: string
}

export interface OptimizationScenario {
  id: string
  name: string
  params: {
    startBalance: number
    numTrades: number
    numSimulations: number
    winRate: number
    avgWin: number
    avgLoss: number
  }
  stats: {
    best: number
    worst: number
    avg: number
    probSuccess: number
  }
}

export interface Account {
  id: string
  name: string
  size: string
  type: 'Personal' | 'Prop-Firm'
  currency: string
  maxDD?: string
  profitTarget?: string
  propPhases?: 1 | 2
  maxDDP2?: string
  profitTargetP2?: string
}

export interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  exit_price: number | null
  stop_loss?: number
  take_profit?: number
  lot_size?: number
  pnl: number | null
  pnl_pct: number | null
  status: 'OPEN' | 'CLOSED'
  created_at: string
  entry_time?: string
  exit_time?: string
  mae?: number
  mfe?: number
  slippage?: number
  risk_amount?: number
  r_multiple?: number
  playbook_id?: string
  mistake_tags?: string[]
  images?: string[]
  notes?: string
  emotion?: string
  strategy?: string
  account_id?: string
  tags: string[]
}

export interface User {
  id: string
  username: string
  email: string
}

export interface Connection {
  id: string
  name: string
  desc: string
  status: 'Connected' | 'Available'
}

export interface RiskSettings {
  breakeven: string
  dailyDD: string
  riskPerTrade: string
  maxLots: string
  sessionAlerts: boolean
}

export interface PlaybookRule {
  text: string
  weight: number
  done: boolean
}

export interface Playbook {
  id: string
  name: string
  description?: string
  winRate: number
  trades: number
  avgRR: number
  rules: PlaybookRule[]
}

export interface LiveTick {
  symbol: string
  bid: number
  ask: number
  time: string
}

export interface Note {
  id: string
  date: string
  title: string
  content: string
  type: 'Plan' | 'Review' | 'Analysis'
}

export interface BacktestSession {
  id: string
  date: string
  trades: Trade[]
  pnl: number
}

export interface Pulse {
  id: string
  account_id: string
  mental_state: string
  tags: string[]
  emotional_rating: number
  notes: string
  created_at: string
}

export interface DailyJournal {
  id: string
  account_id: string
  date: string
  pre_market: string
  outlook: string
  intraday: string
  post_market: string
  freeform_content: string
  journal_type: 'STRUCTURED' | 'FREEFORM'
  created_at: string
  updated_at: string
}

export interface WeightedScore {
  id: string
  account_id: string
  date: string
  process_score: number
  performance_score: number
  results_score: number
  total_score: number
  created_at: string
}

export interface CalendarDay {
  pnl: number
  win_rate: number
  trades: number
  avg_mae: number
  avg_mfe: number
}

const today = new Date()
const d = (offset: number) => { const dt = new Date(today); dt.setDate(dt.getDate() - offset); return dt.toISOString() }

const MOCK_TRADES: Trade[] = [
  { id: '1', symbol: 'BTCUSD', side: 'LONG', entry_price: 62000, exit_price: 62800, pnl: 800, pnl_pct: 1.29, status: 'CLOSED', tags: ['Trend Alignment', 'Support Bounce'], mistake_tags: [], created_at: d(0), mae: 150, mfe: 1200, r_multiple: 2.1, strategy: 'Breakout', emotion: 'Confident' },
  { id: '2', symbol: 'EURUSD', side: 'SHORT', entry_price: 1.0850, exit_price: 1.0880, pnl: -300, pnl_pct: -0.28, status: 'CLOSED', tags: ['RSI Overbought'], mistake_tags: ['FOMO', 'Oversize'], created_at: d(1), mae: 40, mfe: 10, r_multiple: -0.8, strategy: 'Mean Reversion', emotion: 'Anxious' },
  { id: '3', symbol: 'XAUUSD', side: 'LONG', entry_price: 2350, exit_price: 2364.5, pnl: 1450, pnl_pct: 0.62, status: 'CLOSED', tags: ['Support Bounce', 'Institutional Level'], mistake_tags: [], created_at: d(2), mae: 20, mfe: 600, r_multiple: 3.2, strategy: 'Support Bounce', emotion: 'Focused' },
  { id: '4', symbol: 'SPX500', side: 'SHORT', entry_price: 5220, exit_price: 5198, pnl: 2200, pnl_pct: 0.42, status: 'CLOSED', tags: ['Volume Spike', 'Trend Alignment'], mistake_tags: [], created_at: d(3), mae: 80, mfe: 1400, r_multiple: 2.8, strategy: 'Trend Following', emotion: 'Calm' },
  { id: '5', symbol: 'GBPUSD', side: 'LONG', entry_price: 1.2640, exit_price: 1.2590, pnl: -500, pnl_pct: -0.40, status: 'CLOSED', tags: ['News Play'], mistake_tags: ['Chasing', 'No Confirmation'], created_at: d(4), mae: 90, mfe: 15, r_multiple: -1.2, strategy: 'News Play', emotion: 'FOMO' },
  { id: '6', symbol: 'NASDAQ', side: 'LONG', entry_price: 18400, exit_price: 18620, pnl: 2200, pnl_pct: 1.20, status: 'CLOSED', tags: ['Breakout', 'Volume Spike'], mistake_tags: [], created_at: d(5), mae: 60, mfe: 900, r_multiple: 3.5, strategy: 'Breakout', emotion: 'Confident' },
  { id: '7', symbol: 'USDJPY', side: 'SHORT', entry_price: 157.40, exit_price: 156.80, pnl: 600, pnl_pct: 0.38, status: 'CLOSED', tags: ['Resistance Rejection'], mistake_tags: [], created_at: d(7), mae: 30, mfe: 750, r_multiple: 2.0, strategy: 'Mean Reversion', emotion: 'Focused' },
  { id: '8', symbol: 'BTCUSD', side: 'SHORT', entry_price: 63500, exit_price: 62100, pnl: 1400, pnl_pct: 2.21, status: 'CLOSED', tags: ['Distribution Zone', 'Trend Alignment'], mistake_tags: [], created_at: d(9), mae: 200, mfe: 1800, r_multiple: 4.1, strategy: 'Trend Following', emotion: 'Calm' },
  { id: '9', symbol: 'ETHUSD', side: 'LONG', entry_price: 3420, exit_price: 3380, pnl: -400, pnl_pct: -1.17, status: 'CLOSED', tags: ['Support Bounce'], mistake_tags: ['Early Entry'], created_at: d(11), mae: 120, mfe: 40, r_multiple: -1.0, strategy: 'Support Bounce', emotion: 'Impatient' },
  { id: '10', symbol: 'XAUUSD', side: 'LONG', entry_price: 2310, exit_price: null, pnl: null, pnl_pct: null, status: 'OPEN', tags: ['Accumulation Zone'], mistake_tags: [], created_at: d(0), mae: 15, mfe: 180, strategy: 'Position Trade', emotion: 'Confident' },
];

const MOCK_PULSES: Pulse[] = [
  { id: 'p1', account_id: '1', mental_state: 'Focused', emotional_rating: 8, notes: 'Good sleep, clear head. Ready to execute.', created_at: d(0), tags: ['Disciplined', 'Calm'] },
  { id: 'p2', account_id: '1', mental_state: 'Anxious', emotional_rating: 4, notes: 'News pending – feeling uncertain. Reduced size.', created_at: d(1), tags: ['Cautious'] },
  { id: 'p3', account_id: '1', mental_state: 'Confident', emotional_rating: 9, notes: 'Perfect execution on all setups. Following the plan.', created_at: d(2), tags: ['In the Zone', 'Disciplined'] },
  { id: 'p4', account_id: '1', mental_state: 'FOMO', emotional_rating: 3, notes: 'Chased a move I should have skipped. Lesson: wait for pullback.', created_at: d(4), tags: ['FOMO', 'Overtraded'] },
];

const DEMO_PLAYBOOKS: Playbook[] = [
  { id: 'pb1', name: 'London Breakout', description: 'Trade the first 30min London range expansion with volume confirmation.', winRate: 68, trades: 47, avgRR: 2.4, rules: [{text: 'Wait for 8:30 UTC candle close', weight: 3, done: true}, {text: 'Volume must be 1.5x average', weight: 3, done: true}, {text: 'SL below breakout candle', weight: 2, done: true}, {text: 'TP at previous high/low', weight: 2, done: true}] },
  { id: 'pb2', name: 'Institutional Bounce', description: 'Long/Short at key institutional S/R levels with confluence.', winRate: 72, trades: 31, avgRR: 3.1, rules: [{text: 'Minimum 3 touches on S/R level', weight: 3, done: true}, {text: 'Higher timeframe trend aligned', weight: 3, done: true}, {text: 'Rejection wick or engulfing candle', weight: 2, done: true}] },
  { id: 'pb3', name: 'BTC Trend Scalp', description: 'Scalp in direction of 4H trend on 15min pullbacks.', winRate: 61, trades: 89, avgRR: 1.8, rules: [{text: '4H EMA200 direction confirmed', weight: 3, done: true}, {text: 'RSI reset to 40-60 on pullback', weight: 2, done: true}, {text: 'Entry on 15min engulfing', weight: 2, done: true}] },
];

const DEMO_CALENDAR: Record<string, CalendarDay> = {
  [d(0).slice(0,10)]: { pnl: 800, win_rate: 100, trades: 1, avg_mae: 150, avg_mfe: 1200 },
  [d(1).slice(0,10)]: { pnl: -300, win_rate: 0, trades: 1, avg_mae: 40, avg_mfe: 10 },
  [d(2).slice(0,10)]: { pnl: 1450, win_rate: 100, trades: 1, avg_mae: 20, avg_mfe: 600 },
  [d(3).slice(0,10)]: { pnl: 2200, win_rate: 100, trades: 1, avg_mae: 80, avg_mfe: 1400 },
  [d(4).slice(0,10)]: { pnl: -500, win_rate: 0, trades: 1, avg_mae: 90, avg_mfe: 15 },
  [d(5).slice(0,10)]: { pnl: 2200, win_rate: 100, trades: 1, avg_mae: 60, avg_mfe: 900 },
  [d(7).slice(0,10)]: { pnl: 600, win_rate: 100, trades: 1, avg_mae: 30, avg_mfe: 750 },
  [d(9).slice(0,10)]: { pnl: 1400, win_rate: 100, trades: 1, avg_mae: 200, avg_mfe: 1800 },
  [d(11).slice(0,10)]: { pnl: -400, win_rate: 0, trades: 1, avg_mae: 120, avg_mfe: 40 },
};

const cleanTags = (val: string | string[] | null | undefined): string[] => {
  if (!val) return [];
  // Handle strings like '["Tag1","Tag2"]' or '"Tag1,Tag2"' or actual arrays
  let rawStr = typeof val === 'string' ? val : JSON.stringify(val);
  
  // Strip typical JSON bracket/quote artifacts
  rawStr = rawStr.replace(/[\[\]"']/g, '');
  
  // Split by comma or semicolon and clean up each entry
  return rawStr.split(/[,,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== 'null' && s !== 'undefined');
};

export interface Tick {
  time: string
  price: number
  open?: number
  high?: number
  low?: number
  close?: number
  change?: number
}

const normalizeTrade = (t: Partial<Trade> & Record<string, unknown>): Trade => ({
  ...t,
  id: String(t.id || ''),
  symbol: String(t.symbol || ''),
  side: (t.side as 'LONG' | 'SHORT') || 'LONG',
  entry_price: Number(t.entry_price || 0),
  exit_price: t.exit_price ? Number(t.exit_price) : null,
  pnl: t.pnl !== undefined ? Number(t.pnl) : null,
  pnl_pct: t.pnl_pct !== undefined ? Number(t.pnl_pct) : null,
  status: String(t.status || 'OPEN').toUpperCase() as 'OPEN' | 'CLOSED',
  tags: cleanTags(t.tags as string | string[]),
  mistake_tags: cleanTags(t.mistake_tags as string | string[]),
  images: typeof t.images === 'string' ? (t.images ? (t.images as string).split(',') : []) : (Array.isArray(t.images) ? t.images as string[] : []),
  created_at: String(t.created_at || new Date().toISOString()),
} as Trade)

// Configuration for API and WebSocket
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

interface AppState {
  theme: Theme
  activeView: View
  activeSettingsTab: SettingsTab
  trades: Trade[]
  accounts: Account[]
  connections: Connection[]
  riskSettings: RiskSettings
  playbooks: Playbook[]
  notes: Note[]
  backtests: BacktestSession[]
  marketQuotes: LiveTick[]
  livePrices: Record<string, { price: number, change: number }>
  marketHistory: Record<string, Tick[]>
  historicalBars: Record<string, Tick[]>
  optimizationScenarios: OptimizationScenario[]
  notifications: AppNotification[]
  timeFormat: '24h' | '12h'
  
  news: NewsItem[]
  newsStatus: 'LIVE' | 'OFFLINE' | 'API_ERROR' | 'MISSING_KEY' | 'CONNECTION_FAILED' | 'LOADING'
  fetchNews: () => Promise<void>
  setNews: (news: NewsItem[]) => void
  
  economicEvents: EconomicEvent[]
  isEconomicLoading: boolean
  fetchEconomicEvents: () => Promise<void>
  
  chartSymbol: string
  chartClass: string
  
  user: User | null
  token: string | null
  
  setTheme: (t: Theme) => void
  setView: (v: View) => void
  setActiveSettingsTab: (t: SettingsTab) => void
  setTrades: (t: Trade[]) => void
  setUser: (u: User | null) => void
  
  setChartAsset: (symbol: string, cls: string) => void
  addScenario: (s: OptimizationScenario) => void
  removeScenario: (id: string) => void
  
  addAccount: (acc: Account) => void
  updateAccount: (id: string, acc: Partial<Account>) => void
  removeAccount: (id: string) => void
  
  toggleConnection: (id: string) => void
  setRiskSettings: (s: RiskSettings) => void
  
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'time'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  addPlaybook: (pb: Partial<Playbook>) => Promise<void>
  updatePlaybook: (id: string, pb: Partial<Playbook>) => Promise<void>
  removePlaybook: (id: string) => Promise<void>
  fetchPlaybooks: () => Promise<void>

  tagMistake: (tradeId: string, mistake: string) => void
  addNote: (note: Note) => void
  updateNote: (id: string, note: Partial<Note>) => void
  addBacktest: (bt: BacktestSession) => void

  pulses: Pulse[]
  journals: DailyJournal[]
  latestScore: WeightedScore | null
  
  calendarData: Record<string, CalendarDay>
  isCalendarLoading: boolean
  
  demoMode: boolean
  setDemoMode: (val: boolean) => void
  enterDemoMode: () => void

  setPulses: (p: Pulse[]) => void
  addPulse: (p: Pulse) => void
  setJournals: (j: DailyJournal[]) => void
  setLatestScore: (s: WeightedScore | null) => void

  addTrade: (trade: Partial<Trade>) => Promise<void>
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>
  removeTrade: (id: string) => Promise<void>
  fetchTrades: () => Promise<void>
  analyzeTrade: (tradeId: string, promptType: string) => Promise<unknown>
  fetchCalendar: (accountId: string) => Promise<void>
  fetchMarketQuotes: () => Promise<void>
  fetchMarketHistory: (symbol: string, interval?: string, limit?: number) => Promise<void>
  fetchHistoricalBars: (symbol: string, interval?: string, limit?: number) => Promise<void>
  updateLivePrice: (symbol: string, price: number, change: number) => void
  updateCalendarDay: (date: string, pnlChange: number, mae?: number, mfe?: number) => void
  startPriceWiggle: () => void

  resetToMocks: () => void

  login: (email: string, pass: string) => Promise<boolean>
  register: (username: string, email: string, pass: string) => Promise<boolean>
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme:      'dark',
      activeView: 'dashboard',
      activeSettingsTab: 'general',
      trades:     [],
      accounts: [
        { id: '1', name: 'FX Pro Account', size: '$50,000', type: 'Prop-Firm', currency: 'USD', maxDD: '10%' }
      ],
      connections: [
        { id: 'mt5', name: 'MetaTrader 5', desc: 'Connect via Expert Advisor bridge', status: 'Connected' },
      ],
      riskSettings: {
        breakeven: '0.1',
        dailyDD: '2',
        riskPerTrade: '1',
        maxLots: '5',
        sessionAlerts: false
      },
      playbooks: [],
      notes: [],
      backtests: [],
      marketQuotes: [],
      livePrices: {},
      marketHistory: {},
      historicalBars: {},
      optimizationScenarios: [],
      notifications: [],
      timeFormat: '24h',
      
      news: [],
      newsStatus: 'LOADING',
      fetchNews: async () => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/market/news`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
            const data = await res.json()
            set({ news: data.payload || [], newsStatus: data.status || 'LIVE' })
          }
        } catch (e) { console.error('Failed to fetch news', e) }
      },

      setNews: (news) => set({ news }),

      economicEvents: [],
      isEconomicLoading: false,
      fetchEconomicEvents: async () => {
        const { token } = get()
        set({ isEconomicLoading: true })
        try {
          const res = await fetch(`${API_URL}/api/calendar/economic`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
            const data = await res.json()
            set({ economicEvents: data.events || [], isEconomicLoading: false })
          }
        } catch (e) { set({ isEconomicLoading: false }) }
      },

      chartSymbol: 'BTCUSD',
      chartClass: 'crypto',
      
      user: null,
      token: null,
      
      setTheme: (theme) => set({ theme }),
      setView:    (activeView) => set({ activeView }),
      setActiveSettingsTab: (activeSettingsTab) => set({ activeSettingsTab }),
      setTrades:  (trades) => set({ trades: trades.length > 0 ? trades : get().trades }),
      setUser: (user) => set({ user }),
      
      setChartAsset: (chartSymbol, chartClass) => set({ chartSymbol, chartClass }),
      addScenario: (scenario) => set((s) => ({ optimizationScenarios: [scenario, ...s.optimizationScenarios] })),
      removeScenario: (id) => set((s) => ({ optimizationScenarios: s.optimizationScenarios.filter(sc => sc.id !== id) })),
      
      addAccount: (acc) => set((s) => ({ accounts: [acc, ...s.accounts] })),
      updateAccount: (id, acc) => set((s) => ({
        accounts: s.accounts.map(a => a.id === id ? { ...a, ...acc } : a)
      })),
      removeAccount: (id) => set((s) => ({
        accounts: s.accounts.filter(a => a.id !== id)
      })),
      
      toggleConnection: (id) => set((s) => ({
        connections: s.connections.map(c => c.id === id ? { ...c, status: c.status === 'Connected' ? 'Available' : 'Connected' } : c)
      })),
      
      setRiskSettings: (riskSettings) => set({ riskSettings }),

      addNotification: (n) => set((s) => ({
        notifications: [{ ...n, id: Math.random().toString(36).substr(2, 9), read: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...s.notifications]
      })),
      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      addPlaybook: async (pbData) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/playbooks`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ name: pbData.name, rules: pbData.rules, min_rr: pbData.avgRR || 0, description: pbData.description })
          })
          if (res.ok) {
            const newPb = await res.json()
            set((s) => ({ playbooks: [...s.playbooks, { ...newPb, rules: typeof newPb.rules === 'string' ? JSON.parse(newPb.rules) : newPb.rules, avgRR: newPb.min_rr, winRate: 0, trades: 0 }] }))
          }
        } catch (e) { console.error('Failed to add playbook', e) }
      },

      updatePlaybook: async (id, pbData) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/playbooks/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ name: pbData.name, rules: pbData.rules, min_rr: pbData.avgRR, description: pbData.description })
          })
          if (res.ok) {
            const updated = await res.json()
            set((s) => ({ playbooks: s.playbooks.map(p => p.id === id ? { ...p, ...updated, rules: typeof updated.rules === 'string' ? JSON.parse(updated.rules) : updated.rules, avgRR: updated.min_rr } : p) }))
          }
        } catch (e) { console.error('Failed to update playbook', e) }
      },

      removePlaybook: async (id) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/playbooks/${id}`, { 
            method: 'DELETE',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) set((s) => ({ playbooks: s.playbooks.filter(p => p.id !== id) }))
        } catch (e) { console.error('Failed to remove playbook', e) }
      },

      fetchPlaybooks: async () => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/playbooks`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.playbooks)) {
              const normalized = data.playbooks.map((pb: any) => ({ ...pb, rules: typeof pb.rules === 'string' ? JSON.parse(pb.rules) : pb.rules, avgRR: pb.min_rr, winRate: 0, trades: 0 }))
              set({ playbooks: normalized })
            }
          }
        } catch (e) { console.error('Failed to fetch playbooks', e) }
      },

      tagMistake: (tradeId, mistake) => set((s) => ({ trades: s.trades.map(t => t.id === tradeId ? { ...t, mistake_tags: [...(t.mistake_tags || []), mistake] } : t) })),
      addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
      updateNote: (id, note) => set((s) => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...note } : n) })),
      addBacktest: (bt) => set((s) => ({ backtests: [...s.backtests, bt] })),

      pulses: [],
      journals: [],
      latestScore: null,
      calendarData: {},
      isCalendarLoading: false,

      demoMode: false,
      setDemoMode: (demoMode) => set({ demoMode }),

      enterDemoMode: () => {
        // Fully reset any persisted state, then inject rich mock data — no backend calls
        localStorage.removeItem('creatix-app')
        set({
          demoMode: true,
          user: { id: 'demo', username: 'Demo Trader', email: 'demo@creatix.app' },
          token: 'demo-token',
          trades: MOCK_TRADES,
          pulses: MOCK_PULSES,
          playbooks: DEMO_PLAYBOOKS,
          calendarData: DEMO_CALENDAR,
          activeView: 'dashboard',
          accounts: [{ id: '1', name: 'Creatix Demo Account', size: '$100,000', type: 'Prop-Firm', currency: 'USD', maxDD: '10%', profitTarget: '10%' }],
          riskSettings: { breakeven: '0.2', dailyDD: '2', riskPerTrade: '1', maxLots: '3', sessionAlerts: false },
          connections: [{ id: 'mt5', name: 'MetaTrader 5', desc: 'Demo simulation bridge', status: 'Connected' }],
          newsStatus: 'OFFLINE',
          news: [],
        })
      },

      setPulses: (pulses) => set({ pulses }),
      addPulse: (pulse) => set((s) => ({ pulses: [pulse, ...s.pulses] })),
      setJournals: (journals) => set({ journals }),
      setLatestScore: (latestScore) => set({ latestScore }),

      addTrade: async (tradeData) => {
        const { token } = get()
        try {
          const response = await fetch(`${API_URL}/api/trades`, { 
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }, 
            body: JSON.stringify(tradeData) 
          })
          if (response.ok) {
            const newTrade = await response.json()
            set((state) => ({ trades: [normalizeTrade(newTrade), ...state.trades] }))
          }
        } catch (error) { console.error('Failed to add trade', error) }
      },

      removeTrade: async (id) => {
        const { token } = get()
        try {
          const response = await fetch(`${API_URL}/api/trades/${id}`, { 
            method: 'DELETE',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (response.ok) set((state) => ({ trades: state.trades.filter(t => t.id !== id) }))
        } catch (error) { console.error('Failed to remove trade', error) }
      },

      updateTrade: async (id, tradeData) => {
        const { token } = get()
        try {
          const response = await fetch(`${API_URL}/api/trades/${id}`, { 
            method: 'PUT', 
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }, 
            body: JSON.stringify(tradeData) 
          })
          if (response.ok) {
            const updated = await response.json()
            set((state) => ({ trades: state.trades.map(t => t.id === id ? normalizeTrade(updated) : t) }))
          }
        } catch (error) { console.error('Failed to update trade', error) }
      },

      fetchTrades: async () => {
        const { token } = get()
        try {
          const response = await fetch(`${API_URL}/api/trades`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data.trades)) {
              set({ trades: data.trades.map(normalizeTrade) })
            }
          }
        } catch (error) { console.error('Failed to fetch trades', error) }
      },

      analyzeTrade: async (tradeId: string, promptType: string) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/ai/analyze-trade/${tradeId}`, { 
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }, 
            body: JSON.stringify({ trade_id: tradeId, prompt_type: promptType }) 
          })
          if (res.ok) return await res.json()
        } catch (e) { console.error('AI Analysis failed', e) }
        return null
      },

      fetchCalendar: async (accountId) => {
        const { token } = get()
        set({ isCalendarLoading: true })
        try {
          const response = await fetch(`${API_URL}/api/calendar/summary/${accountId}`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (response.ok) {
            const calendarData = await response.json()
            set({ calendarData, isCalendarLoading: false })
          } else { set({ isCalendarLoading: false }) }
        } catch (error) { console.error('Failed to fetch calendar summary', error) ; set({ isCalendarLoading: false }) }
      },

      updateLivePrice: (symbol, price, change) => set((s) => {
        const current = s.livePrices[symbol] || { price, change: 0 }
        const history = s.marketHistory[symbol] || []
        
        let liveChange = change || current.change
        if (history.length > 0) {
            const openPrice = history[0].price
            if (openPrice !== 0) {
                liveChange = ((price - openPrice) / openPrice) * 100
            }
        }

        const now = new Date()
        const currentTimeKey = `${now.getHours()}:${now.getMinutes()}`
        
        let newHistory = [...history]
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].time === currentTimeKey) {
            newHistory[newHistory.length - 1] = { ...newHistory[newHistory.length - 1], price, change: liveChange }
        } else {
            newHistory = [...newHistory.slice(-49), { time: currentTimeKey, price, change: liveChange }]
        }

        return { 
            livePrices: { ...s.livePrices, [symbol]: { price, change: liveChange } },
            marketHistory: { ...s.marketHistory, [symbol]: newHistory }
        }
      }),

      fetchMarketQuotes: async () => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/market/quotes`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
            const data = await res.json()
            set({ marketQuotes: data.quotes || [] })
          }
        } catch (e) { console.error('Failed to fetch market quotes', e) }
      },

      fetchMarketHistory: async (symbol: string, interval: string = '1min', limit: number = 50) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/market/history/${symbol}?interval=${interval}&limit=${limit}`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
            const data = await res.json()
            set((s) => ({ marketHistory: { ...s.marketHistory, [symbol]: data.history } }))
          }
        } catch (e) { console.error(`Failed to fetch history for ${symbol}`, e) }
      },

      fetchHistoricalBars: async (symbol: string, interval: string = '1day', limit: number = 100) => {
        const { token } = get()
        try {
          const res = await fetch(`${API_URL}/api/market/history/${symbol}?interval=${interval}&limit=${limit}`, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              'ngrok-skip-browser-warning': 'true'
            }
          })
          if (res.ok) {
              const data = await res.json()
              set((s) => ({ historicalBars: { ...s.historicalBars, [symbol]: data.history } }))
          }
        } catch (e) { console.error(`Failed to fetch historical bars for ${symbol}`, e) }
      },

      startPriceWiggle: () => {},

      updateCalendarDay: (date, pnlChange, mae, mfe) => set((s) => {
        const current = s.calendarData[date] || { pnl: 0, win_rate: 0, trades: 0, avg_mae: 0, avg_mfe: 0 };
        const newPnl = current.pnl + pnlChange;
        const newTrades = current.trades + 1;
        const newAvgMae = mae !== undefined ? (current.avg_mae * current.trades + mae) / newTrades : current.avg_mae;
        const newAvgMfe = mfe !== undefined ? (current.avg_mfe * current.trades + mfe) / newTrades : current.avg_mfe;
        return { calendarData: { ...s.calendarData, [date]: { ...current, pnl: newPnl, trades: newTrades, avg_mae: newAvgMae, avg_mfe: newAvgMfe, win_rate: (newPnl > 0 ? 100 : 0) } } }
      }),

      resetToMocks: () => set({ trades: MOCK_TRADES, pulses: MOCK_PULSES, activeView: 'dashboard' }),

      login: async (email, password) => {
        console.log(`Attempting login to ${API_URL}/api/auth/login`);
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, { 
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }, 
            body: JSON.stringify({ email, password }) 
          })
          
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user, token: data.token })
            return true
          } else {
            const errorText = await res.text();
            console.error(`Login failed with status ${res.status}: ${errorText}`);
            return false;
          }
        } catch (err) { 
          console.error('Login connection error. Check if backend is running and API_URL is correct.', err);
          return false;
        }
      },

      register: async (username, email, password) => {
        console.log(`Attempting registration to ${API_URL}/api/auth/register`);
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, { 
            method: 'POST', 
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }, 
            body: JSON.stringify({ username, email, password }) 
          })
          
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user, token: data.token })
            return true
          } else {
            const errorText = await res.text();
            console.error(`Registration failed with status ${res.status}: ${errorText}`);
            return false;
          }
        } catch (err) { 
          console.error('Registration connection error. Check if backend is running and API_URL is correct.', err);
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, demoMode: false, trades: [], pulses: [], playbooks: [], calendarData: {}, accounts: [{ id: '1', name: 'FX Pro Account', size: '$50,000', type: 'Prop-Firm', currency: 'USD', maxDD: '10%' }] })
        localStorage.removeItem('creatix-app')
        window.location.reload()
      },
    }),
    { 
      name: 'creatix-app',
      partialize: (state) => ({ 
        theme: state.theme, activeView: state.activeView, activeSettingsTab: state.activeSettingsTab, trades: state.trades, accounts: state.accounts,
        riskSettings: state.riskSettings, playbooks: state.playbooks, connections: state.connections,
        user: state.user, token: state.token
      }),
    }
  )
)
