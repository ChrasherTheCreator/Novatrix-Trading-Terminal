import { useAppStore } from '../store/app'
import { Bell, Search, Menu, User, Settings, LogOut, Sun, Moon, Info, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
  const { 
    activeView, setView, setActiveSettingsTab, theme, setTheme, user, logout,
    notifications, markNotificationRead, clearNotifications,
    demoMode
  } = useAppStore()
  
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotiMenu, setShowNotiMenu] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const openSettings = (tab: 'profile' | 'general' | 'accounts' | 'security' | 'notifications' | 'data') => {
    setActiveSettingsTab(tab)
    setView('settings')
    setShowProfileMenu(false)
  }

  const getNotiIcon = (type: string) => {
    switch(type) {
        case 'warning': return <AlertTriangle size={14} className="text-warning" />
        case 'error':   return <AlertTriangle size={14} className="text-loss" />
        case 'success': return <CheckCircle size={14} className="text-profit" />
        default:        return <Info size={14} className="text-accent" />
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn" style={{ border: 'none', background: 'none' }}>
          <Menu size={20}/>
        </button>
        <span className="page-title">{activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}</span>
      </div>

      <div className="topbar-right">
        {/* Portal for Widget Toolbar */}
        <div id="widget-toolbar-portal" style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}></div>

        {/* Demo Mode Banner */}
        {demoMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px',
            padding: '5px 12px',
            background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(245,158,11,0.08))',
            borderRadius: '20px', border: '1px solid rgba(250,204,21,0.4)',
            cursor: 'default'
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#fbbf24',
              boxShadow: '0 0 0 2px rgba(251,191,36,0.25)',
              animation: 'pulse 2s infinite',
              flexShrink: 0
            }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', letterSpacing: '0.06em' }}>
              DEMO MODE
            </span>
            <button
              onClick={() => { logout(); }}
              style={{
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '10px', color: '#fbbf24', fontSize: '10px', fontWeight: '700',
                cursor: 'pointer', padding: '2px 8px', letterSpacing: '0.05em'
              }}
            >
              EXIT
            </button>
          </div>
        )}

        <div className="search-bar">
          <Search size={16} />
          <input type="text" placeholder="Global Search..." />
        </div>

        <button className="icon-btn" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => { setShowNotiMenu(!showNotiMenu); setShowProfileMenu(false); }} style={{ position: 'relative' }}>
            <Bell size={18}/>
            {unreadCount > 0 && (
                <span style={{ 
                    position: 'absolute', top: '8px', right: '8px', 
                    width: '10px', height: '10px', 
                    background: 'var(--red)', borderRadius: '50%', 
                    border: '2px solid var(--bg-primary)',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }} />
            )}
          </button>

          {showNotiMenu && (
            <div className="card fade-in" style={{ 
                position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '320px', 
                padding: 0, zIndex: 100, boxShadow: '0 15px 40px rgba(0,0,0,0.6)', 
                background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
                overflow: 'hidden'
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>NOTIFICATIONS</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {notifications.length > 0 && (
                        <button onClick={clearNotifications} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>
                            CLEAR ALL
                        </button>
                    )}
                    <X size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowNotiMenu(false)}/>
                </div>
              </div>
              
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} 
                         onClick={() => markNotificationRead(n.id)}
                         style={{ 
                            padding: '1rem', borderBottom: '1px solid var(--border-subtle)', 
                            background: n.read ? 'transparent' : 'var(--accent-dim)',
                            cursor: 'pointer', transition: 'all 0.2s'
                         }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ marginTop: '0.2rem' }}>{getNotiIcon(n.type)}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{n.title}</span>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{n.time}</span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                            </div>
                            {!n.read && <div style={{ width: '6px', height: '6px', background: 'var(--accent-bright)', borderRadius: '50%', marginTop: '0.4rem' }} />}
                        </div>
                    </div>
                )) : (
                    <div style={{ padding: '1rem 1rem 1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                        <Bell size={16} style={{ opacity: 0.4 }}/>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.01em' }}>No new notifications</div>
                    </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                  <div onClick={() => setShowNotiMenu(false)} style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-bright)', background: 'rgba(255,255,255,0.02)' }}>
                      CLOSE PANEL
                  </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div className="avatar" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotiMenu(false); }}>
            {user?.username?.substring(0, 2).toUpperCase() || 'TR'}
          </div>

          {showProfileMenu && (
            <div className="card fade-in" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '220px', padding: '0.5rem', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user?.username || 'Trader'}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.email || 'standard@plan.com'}</div>
              </div>
              <button onClick={() => openSettings('profile')} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}><User size={16}/> Profile Settings</button>
              <button onClick={() => openSettings('accounts')} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}><Settings size={16}/> Account Management</button>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
              <button onClick={() => { logout(); setShowProfileMenu(false); }} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--red)' }}><LogOut size={16}/> Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
