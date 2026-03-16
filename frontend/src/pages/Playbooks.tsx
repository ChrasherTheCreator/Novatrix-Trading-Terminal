import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Square, Trash2, ChevronRight, Info, Star, Edit3, Save, Layout, Settings2, BarChart3, HelpCircle } from 'lucide-react'
import { useAppStore } from '../store/app'
import { Button } from '../components/ui/Button'
import { toast } from 'sonner'

export default function Playbooks() {
  const { playbooks, addPlaybook, updatePlaybook, removePlaybook, fetchPlaybooks } = useAppStore()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  // Fetch from backend on mount
  useEffect(() => {
    fetchPlaybooks()
  }, [fetchPlaybooks])
  
  const pb = playbooks[selectedIdx] || playbooks[0]

  const handleAddRule = () => {
    if (!pb) return
    const newRules = [...pb.rules, { text: 'New Rule...', weight: 1, done: false }]
    updatePlaybook(pb.id, { rules: newRules })
    toast.success('Rule added')
  }

  const handleUpdateRuleText = (idx: number, text: string) => {
    if (!pb) return
    const newRules = pb.rules.map((r, i) => i === idx ? { ...r, text } : r)
    updatePlaybook(pb.id, { rules: newRules })
  }

  const handleToggleRule = (idx: number) => {
    if (!pb || isEditing) return
    const newRules = pb.rules.map((r, i) => i === idx ? { ...r, done: !r.done } : r)
    updatePlaybook(pb.id, { rules: newRules })
  }

  const handleRemoveRule = (idx: number) => {
    if (!pb) return
    const newRules = pb.rules.filter((_, i) => i !== idx)
    updatePlaybook(pb.id, { rules: newRules })
    toast.error('Rule removed')
  }

  const handleAddPlaybook = () => {
    const id = Math.random().toString(36).substr(2, 9)
    addPlaybook({
      id,
      name: 'New Alpha Strategy',
      description: 'Describe your edge here...',
      winRate: 0,
      trades: 0,
      avgRR: 2.0,
      rules: [
        { text: 'Higher Timeframe Trend Alignment', weight: 2, done: false },
        { text: 'Volume Confirmation', weight: 1, done: false }
      ]
    })
    setIsEditing(true)
    toast.success('New playbook created')
  }

  if (!pb) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-muted">No playbooks found.</p>
      <Button onClick={handleAddPlaybook}>Create First Playbook</Button>
    </div>
  )

  const totalWeight = pb.rules.reduce((s, r) => s + r.weight, 0)
  const doneWeight  = pb.rules.filter(r => r.done).reduce((s, r) => s + r.weight, 0)
  const score       = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Strategy Book</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track execution quality and refine your edge</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button 
                variant={isEditing ? 'primary' : 'ghost'} 
                onClick={() => setIsEditing(!isEditing)}
                style={{ gap: '0.5rem' }}
            >
                {isEditing ? <><Save size={15}/> Finish Editing</> : <><Settings2 size={15}/> Configure Strategy</>}
            </Button>
            {!isEditing && <Button onClick={handleAddPlaybook}><Plus size={15}/> New Strategy</Button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Playbook list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {playbooks.map((p, i) => (
            <div 
                key={p.id} 
                onClick={() => { setSelectedIdx(i); if(!isEditing) setIsEditing(false); }} 
                className="card" 
                style={{ 
                    cursor: 'pointer', 
                    border: i === selectedIdx ? '1px solid var(--accent)' : '1px solid var(--border-subtle)', 
                    background: i === selectedIdx ? 'var(--accent-dim)' : 'var(--bg-card)', 
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    padding: '1.25rem'
                }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                {i === selectedIdx && <ChevronRight size={14} color="var(--accent-bright)"/>}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                {p.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={10} color="var(--green)"/>
                    <span style={{ color: 'var(--green)', fontWeight: 800 }}>{p.winRate}%</span>
                </div>
                <span>{p.trades} trades</span>
                <span>{p.avgRR}R</span>
              </div>
            </div>
          ))}
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleAddPlaybook} style={{ width: '100%', marginTop: '0.25rem', border: '1px dashed var(--border-subtle)' }}>
                <Plus size={13}/> Quick Add Strategy
            </Button>
          )}
        </div>

        {/* Playbook detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {isEditing ? (
            /* ── EDITING MODE ────────────────────────────────────────────────── */
            <div className="card fade-in" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: 'var(--accent-bright)' }}>
                    <Settings2 size={20}/>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.02em' }}>STRATEGY CONFIGURATION</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Name & Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                STRATEGY NAME
                                <div className="tooltip-container"><HelpCircle size={10}/><span className="tooltip-text">A unique identifier for this setup.</span></div>
                            </label>
                            <input 
                                value={pb.name} 
                                onChange={e => updatePlaybook(pb.id, { name: e.target.value })}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', width: '100%', padding: '0.75rem', outline: 'none' }}
                                placeholder="e.g. Liquidity Sweep"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                DESCRIPTION & EDGE
                                <div className="tooltip-container"><HelpCircle size={10}/><span className="tooltip-text">Describe the logic, required market context, and the "why" behind this trade.</span></div>
                            </label>
                            <textarea 
                                value={pb.description || ''} 
                                onChange={e => updatePlaybook(pb.id, { description: e.target.value })}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', width: '100%', padding: '0.75rem', outline: 'none', resize: 'none', minHeight: '100px', lineHeight: 1.6 }}
                                placeholder="Detail your entry/exit triggers and psychological requirements..."
                            />
                        </div>
                    </div>

                    {/* Stats Config */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                MINIMUM REQUIRED R/R
                                <div className="tooltip-container"><HelpCircle size={10}/><span className="tooltip-text">The baseline reward-to-risk ratio this strategy must offer to be valid.</span></div>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={pb.avgRR} 
                                    onChange={e => updatePlaybook(pb.id, { avgRR: parseFloat(e.target.value) })}
                                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-bright)', width: '60px', outline: 'none' }}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>x</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                * Win Rate and Total Trades are calculated automatically based on your trade history assigned to this strategy.
                            </div>
                        </div>
                    </div>

                    {/* Rules Editing */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            EXECUTION RULES & SCORING WEIGHTS
                            <div className="tooltip-container"><HelpCircle size={10}/><span className="tooltip-text">Rules determine your 'Execution Score'. High weights mean the rule is critical for the strategy's success.</span></div>
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pb.rules.map((rule, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                                    <input 
                                        value={rule.text}
                                        onChange={e => handleUpdateRuleText(i, e.target.value)}
                                        style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                                        placeholder="Rule text..."
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0 1rem', borderLeft: '1px solid var(--border-subtle)' }}>
                                        <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>WEIGHT</div>
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            {Array.from({ length: 5 }).map((_, wi) => (
                                                <div 
                                                    key={wi} 
                                                    onClick={() => {
                                                        const newRules = pb.rules.map((r, idx) => idx === i ? { ...r, weight: wi + 1 } : r)
                                                        updatePlaybook(pb.id, { rules: newRules })
                                                    }}
                                                    style={{ width: 10, height: 10, borderRadius: 2, background: wi < rule.weight ? 'var(--accent)' : 'var(--border-subtle)', cursor: 'pointer' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveRule(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={handleAddRule} style={{ border: '1px dashed var(--border-subtle)' }}><Plus size={14}/> Add New Rule</Button>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                        <button 
                            onClick={() => { if(confirm('Delete entire strategy?')) { removePlaybook(pb.id); setSelectedIdx(0); setIsEditing(false); } }}
                            style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Trash2 size={14}/> DELETE STRATEGY
                        </button>
                        <Button onClick={() => setIsEditing(false)} style={{ padding: '0.5rem 2rem' }}>Save & Close</Button>
                    </div>
                </div>
            </div>
          ) : (
            /* ── VIEW / TRACKING MODE ────────────────────────────────────────── */
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{pb.name}</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
                                {pb.description || 'No description provided. Click Configure Strategy to add details.'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>EXECUTION SCORE</div>
                            <div style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '12px',
                                background: score >= 70 ? 'var(--green-dim)' : score >= 40 ? 'var(--accent-dim)' : 'var(--red-dim)',
                                color:      score >= 70 ? 'var(--green)'     : score >= 40 ? 'var(--accent-bright)' : 'var(--red)',
                                fontWeight: 900,
                                fontSize: '1.5rem',
                                border: `1px solid ${score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--accent)' : 'var(--red)'}`,
                            }}>
                                {score}%
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}><BarChart3 size={20}/></div>
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>WIN RATE</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{pb.winRate}%</div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-bright)' }}><Layout size={20}/></div>
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL TRADES</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{pb.trades}</div>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><Star size={20}/></div>
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>AVG R/R</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{pb.avgRR}x</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                        <CheckSquare size={18} color="var(--accent-bright)"/>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>LIVE EXECUTION CHECKLIST</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pb.rules.map((rule, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleToggleRule(i)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', 
                                    background: rule.done ? 'var(--accent-dim)' : 'var(--bg-secondary)', 
                                    borderRadius: '14px', border: rule.done ? '1px solid var(--accent)' : '1px solid var(--border-subtle)', 
                                    transition: 'all 0.2s', cursor: 'pointer' 
                                }}
                            >
                                {rule.done ? <CheckSquare size={22} color="var(--accent-bright)"/> : <Square size={22} color="var(--text-muted)"/>}
                                <span style={{ flex: 1, fontSize: '0.95rem', color: rule.done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: rule.done ? 700 : 500 }}>
                                    {rule.text}
                                </span>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    {Array.from({ length: rule.weight }).map((_, wi) => (
                                        <div key={wi} style={{ width: '4px', height: '12px', background: rule.done ? 'var(--accent-bright)' : 'var(--text-muted)', borderRadius: '2px', opacity: 0.5 }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {pb.rules.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                No rules defined. Use 'Configure Strategy' to build your checklist.
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
