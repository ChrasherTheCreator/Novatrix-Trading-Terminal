import { useAppStore, View } from '../store/app'
import {
  LayoutDashboard, BarChart2, FileText,
  BookOpen, Calendar, Settings, TrendingUp,
  History, Users, Eye, Layers, Clock
} from 'lucide-react'

interface NavEntry { id: View; label: string; icon: React.ReactNode }

const navItems: NavEntry[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard size={17}/> },
  { id: 'analytics',  label: 'Analytics',  icon: <BarChart2 size={17}/> },
  { id: 'reports',    label: 'Reports',    icon: <FileText size={17}/> },
  { id: 'chart',      label: 'Chart',      icon: <TrendingUp size={17}/> },
  { id: 'watchlist',  label: 'Watchlist',  icon: <Eye size={17}/> },
  { id: 'strategy',   label: 'Strategy Opt', icon: <TrendingUp size={17}/> },
  { id: 'sessions',   label: 'Sessions',   icon: <Clock size={17}/> },
  { id: 'journal',    label: 'Journal',    icon: <BookOpen size={17}/> },
  { id: 'calendar',   label: 'Calendar',   icon: <Calendar size={17}/> },
  { id: 'playbooks',  label: 'Playbooks',  icon: <Layers size={17}/> },
  { id: 'backtest',   label: 'Backtest',   icon: <History size={17}/> },
  { id: 'mentor',     label: 'Mentor',     icon: <Users size={17}/> },
]

export default function Sidebar() {
  const { activeView, setView } = useAppStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">NX</div>
        <span className="logo-text">NOVATRIX</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeView === item.id ? ' active' : ''}`}
            onClick={() => setView(item.id)}
            style={{ background: 'none', outline: 'none', width: '100%', textAlign: 'left' }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item${activeView === 'settings' ? ' active' : ''}`}
          onClick={() => setView('settings')}
          style={{ background: 'none', outline: 'none', width: '100%', textAlign: 'left' }}
        >
          <Settings size={17}/>
          Settings
        </button>
      </div>
    </aside>
  )
}
