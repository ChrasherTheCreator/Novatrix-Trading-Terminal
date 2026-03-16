import { useState, useEffect } from 'react'
import { useAppStore, Account } from '../store/app'
import { User, Shield, CreditCard, Bell, Database, Trash2, Zap, ChevronRight, Briefcase, Plus, Edit3, X, Save } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { toast } from 'sonner'

export default function Settings() {
  const { 
    riskSettings, setRiskSettings, resetToMocks,
    accounts, addAccount, updateAccount, removeAccount,
    user, setUser, activeSettingsTab, setActiveSettingsTab
  } = useAppStore()
  
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: ''
  })

  const [isModalOpen, setIsAddAccountOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [accForm, setAccForm] = useState<Partial<Account>>({
    name: '', type: 'Personal', size: '10000', currency: 'USD', propPhases: 1,
    maxDD: '', profitTarget: '', maxDDP2: '', profitTargetP2: ''
  })

  const CURRENCIES = [
    { code: 'USD', label: 'USD - US Dollar ($)' },
    { code: 'EUR', label: 'EUR - Euro (€)' },
    { code: 'GBP', label: 'GBP - British Pound (£)' },
    { code: 'JPY', label: 'JPY - Japanese Yen (¥)' },
    { code: 'CHF', label: 'CHF - Swiss Franc (Fr)' },
    { code: 'AUD', label: 'AUD - Australian Dollar ($)' },
    { code: 'CAD', label: 'CAD - Canadian Dollar ($)' }
  ]

  useEffect(() => {
    if (user) setProfileForm({ username: user.username, email: user.email, password: '' })
  }, [user, activeSettingsTab])

  const handleSaveProfile = () => {
    if (!profileForm.username || !profileForm.email) return toast.error("Username and Email are required")
    setUser({ ...user!, username: profileForm.username, email: profileForm.email })
    toast.success("Profile updated")
  }

  const openAdd = () => {
    setEditingId(null)
    setAccForm({ 
        name: '', type: 'Personal', size: '10000', currency: 'USD', propPhases: 1,
        maxDD: '', profitTarget: '', maxDDP2: '', profitTargetP2: ''
    })
    setIsAddAccountOpen(true)
  }

  const openEdit = (acc: Account) => {
    setEditingId(acc.id)
    setAccForm({ ...acc })
    setIsAddAccountOpen(true)
  }

  const handleSaveAccount = () => {
    if (!accForm.name || !accForm.size || !accForm.currency || !accForm.type) {
        return toast.error("Name, Type, Size and Currency are mandatory")
    }
    
    if (editingId) {
        updateAccount(editingId, accForm)
        toast.success(`Account "${accForm.name}" updated`)
    } else {
        const newAcc: Account = {
            id: Math.random().toString(36).substr(2, 9),
            name: accForm.name!,
            type: accForm.type as any,
            size: accForm.size!,
            currency: accForm.currency!,
            propPhases: accForm.type === 'Prop-Firm' ? accForm.propPhases : undefined,
            maxDD: accForm.maxDD,
            profitTarget: accForm.profitTarget,
            maxDDP2: (accForm.type === 'Prop-Firm' && accForm.propPhases === 2) ? accForm.maxDDP2 : undefined,
            profitTargetP2: (accForm.type === 'Prop-Firm' && accForm.propPhases === 2) ? accForm.profitTargetP2 : undefined
        }
        addAccount(newAcc)
        toast.success(`Account "${newAcc.name}" created`)
    }
    setIsAddAccountOpen(false)
  }

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: <User size={18}/> },
    { id: 'general', label: 'Risk Management', icon: <Zap size={18}/> },
    { id: 'accounts', label: 'Trading Accounts', icon: <CreditCard size={18}/> },
    { id: 'notifications', label: 'Alerts & Notifications', icon: <Bell size={18}/> },
    { id: 'security', label: 'Platform Security', icon: <Shield size={18}/> },
    { id: 'data', label: 'Database & Sync', icon: <Database size={18}/> },
  ]

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', paddingLeft: '0.75rem' }}>Settings</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {tabs.map(t => (
            <button 
                key={t.id} 
                onClick={() => setActiveSettingsTab(t.id as any)}
                className={`nav-item ${activeSettingsTab === t.id ? 'active' : ''}`}
                style={{ 
                    padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', 
                    background: activeSettingsTab === t.id ? 'var(--accent-dim)' : 'transparent', 
                    color: activeSettingsTab === t.id ? 'var(--accent-bright)' : 'var(--text-muted)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 700,
                    transition: 'all 0.2s', textAlign: 'left', width: '100%'
                }}
            >
                {t.icon}
                <span style={{ flex: 1 }}>{t.label}</span>
                {activeSettingsTab === t.id && <ChevronRight size={14}/>}
            </button>
            ))}
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border-subtle)', height: 'fit-content' }}>
        {activeSettingsTab === 'profile' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="card-title">User Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="metric-label">Username</label>
                    <input value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="metric-label">Email Address</label>
                    <input value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="metric-label">New Password</label>
                    <input type="password" placeholder="Min. 8 characters" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
            </div>
            <Button onClick={handleSaveProfile} style={{ alignSelf: 'flex-start' }}><Save size={16}/> UPDATE PROFILE</Button>
          </div>
        )}

        {activeSettingsTab === 'general' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2 className="card-title">Risk Protocol</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="metric-label">Auto-Breakeven Trigger (R)</label>
                    <input type="text" value={riskSettings.breakeven} onChange={e => setRiskSettings({...riskSettings, breakeven: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="metric-label">Daily Hard Drawdown Limit (%)</label>
                    <input type="text" value={riskSettings.dailyDD} onChange={e => setRiskSettings({...riskSettings, dailyDD: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'accounts' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title">Trading Accounts</h2>
                <Button onClick={openAdd} size="sm"><Plus size={16}/> LINK ACCOUNT</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {accounts.map(acc => (
                    <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', background: 'var(--accent-dim)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-bright)' }}><Briefcase size={22}/></div>
                            <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{acc.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.type === 'Prop-Firm' ? `Prop Firm (${acc.propPhases}-Phase)` : 'Personal'} • {acc.size} {acc.currency}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEdit(acc)} className="icon-btn" style={{ background: 'var(--accent-dim)', color: 'var(--accent-bright)' }}><Edit3 size={16}/></button>
                            <button onClick={() => removeAccount(acc.id)} className="icon-btn" style={{ color: 'var(--red)', opacity: 0.6 }}><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeSettingsTab === 'notifications' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 className="card-title">Alert Configurations</h2>
                {['High Impact News', 'Risk Thresholds', 'Session Openings'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item}</span>
                        <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}/>
                    </div>
                ))}
            </div>
        )}

        {activeSettingsTab === 'security' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 className="card-title">System Safety</h2>
                <div style={{ padding: '1.25rem', border: '1px solid #ef4444', borderRadius: '12px', background: 'rgba(239,68,68,0.05)' }}>
                    <Button onClick={() => { if(window.confirm("RESET?")) resetToMocks() }} style={{ background: '#ef4444' }}>WIPE LOCAL DATA</Button>
                </div>
            </div>
        )}
      </div>

      {isModalOpen && (
          <div style={{ 
              position: 'fixed', inset: 0, zIndex: 1000, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '2rem' 
          }}>
              <div className="card fade-in" style={{ 
                  width: '100%', 
                  maxWidth: '550px', 
                  maxHeight: '90vh', 
                  overflowY: 'auto', 
                  padding: '2.5rem', 
                  border: '1px solid var(--border-accent)', 
                  boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                  position: 'relative',
                  margin: 'auto'
              }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'sticky', top: '-2.5rem', background: 'var(--bg-card)', zIndex: 10, padding: '1rem 0' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{editingId ? 'EDIT ACCOUNT' : 'CONFIGURE ACCOUNT'}</h2>
                      <X size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsAddAccountOpen(false)}/>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>ACCOUNT NAME *</label>
                              <input value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} placeholder="e.g. My Challenge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>ACCOUNT TYPE *</label>
                              <select value={accForm.type} onChange={e => setAccForm({...accForm, type: e.target.value as any})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
                                  <option value="Personal">Personal</option>
                                  <option value="Prop-Firm">Prop-Firm</option>
                              </select>
                          </div>
                      </div>

                      {accForm.type === 'Prop-Firm' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', background: 'var(--accent-dim)', borderRadius: '12px', border: '1px solid var(--border-accent)' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem', color: 'var(--accent-bright)' }}>CHALLENGE PHASES</label>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                  {[1, 2].map(p => (
                                      <button key={p} onClick={() => setAccForm({...accForm, propPhases: p as any})} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', background: accForm.propPhases === p ? 'var(--accent)' : 'rgba(255,255,255,0.05)', color: accForm.propPhases === p ? 'white' : 'var(--text-muted)' }}>{p}-PHASE</button>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>SIZE *</label>
                              <input value={accForm.size} onChange={e => setAccForm({...accForm, size: e.target.value})} placeholder="10000" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', width: '100%' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>BASE CURRENCY *</label>
                              <select value={accForm.currency} onChange={e => setAccForm({...accForm, currency: e.target.value})} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
                                  {CURRENCIES.map(c => (
                                      <option key={c.code} value={c.code}>{c.label}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>MAX DRAWDOWN (%)</label>
                              <input value={accForm.maxDD} onChange={e => setAccForm({...accForm, maxDD: e.target.value})} placeholder="e.g. 10" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', width: '100%' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <label className="metric-label" style={{ fontSize: '0.65rem' }}>PROFIT TARGET (%)</label>
                              <input value={accForm.profitTarget} onChange={e => setAccForm({...accForm, profitTarget: e.target.value})} placeholder="e.g. 10" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', width: '100%' }} />
                          </div>
                      </div>

                      {accForm.type === 'Prop-Firm' && accForm.propPhases === 2 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem', background: 'rgba(139,92,246,0.03)', borderRadius: '12px', border: '1px dashed var(--border-accent)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <label className="metric-label" style={{ fontSize: '0.65rem', color: 'var(--accent-bright)' }}>PHASE 2 TARGET (%)</label>
                                  <input value={accForm.profitTargetP2} onChange={e => setAccForm({...accForm, profitTargetP2: e.target.value})} placeholder="e.g. 5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', width: '100%' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <label className="metric-label" style={{ fontSize: '0.65rem', color: 'var(--accent-bright)' }}>PHASE 2 MAX DD (%)</label>
                                  <input value={accForm.maxDDP2} onChange={e => setAccForm({...accForm, maxDDP2: e.target.value})} placeholder="e.g. 5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', width: '100%' }} />
                              </div>
                          </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                          <Button variant="outline" onClick={() => setIsAddAccountOpen(false)} style={{ flex: 1 }}>CANCEL</Button>
                          <Button onClick={handleSaveAccount} style={{ flex: 2 }}>{editingId ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}
