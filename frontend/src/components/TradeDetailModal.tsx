import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Image as ImageIcon, Brain, Trash2, Calendar, Target, BookOpen } from 'lucide-react'
import { useAppStore, Trade } from '../store/app'
import { Button } from './ui/Button'
import { toast } from 'sonner'
import { Select } from './ui/Select'

interface Props {
  trade: Trade
  onClose: () => void
}

export default function TradeDetailModal({ trade, onClose }: Props) {
  const { removeTrade, updateTrade, playbooks, fetchPlaybooks, setView, addPlaybook } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(trade.notes || '')
  const [images, setImages] = useState(trade.images || [])
  const [playbookId, setPlaybookId] = useState(trade.playbook_id || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newStrategyName, setNewStrategyName] = useState('')
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false)
  
  const [isEditingStrategyInline, setIsEditingStrategyInline] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedPlaybook = playbooks.find(p => p.id === playbookId)
  const displayStrategyName = selectedPlaybook?.name || trade.strategy || 'Uncategorized'
  const isStrategyChanged = (playbookId || '') !== (trade.playbook_id || '')

  useEffect(() => {
    fetchPlaybooks()
    
    // Strict Scroll Lock
    const originalHtmlStyle = document.documentElement.style.overflow;
    const originalBodyStyle = document.body.style.overflow;
    
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    return () => { 
        document.documentElement.style.overflow = originalHtmlStyle;
        document.body.style.overflow = originalBodyStyle;
    };
  }, [fetchPlaybooks])

  // Sync local state when trade prop changes (crucial for showing updated data after save)
  useEffect(() => {
    setNotes(trade.notes || '')
    setImages(trade.images || [])
    setPlaybookId(trade.playbook_id || '')
  }, [trade.id, trade.notes, trade.images, trade.playbook_id])

  const handleInlineStrategyChange = (newId: string) => {
    setPlaybookId(newId)
    setIsEditingStrategyInline(false)
  }

  const handleQuickAddStrategy = async () => {
    if (!newStrategyName.trim()) return
    setIsCreatingStrategy(true)
    try {
        await addPlaybook({ name: newStrategyName, rules: [], description: 'Quick added from trade detail' })
        setNewStrategyName('')
        setShowQuickAdd(false)
        toast.success('Strategy added')
        await fetchPlaybooks() // Refresh list
    } catch (e) {
        toast.error('Failed to add strategy')
    } finally {
        setIsCreatingStrategy(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const activePlaybook = playbooks.find(p => p.id === playbookId)
    try {
        await updateTrade(trade.id, { 
            notes, 
            images, 
            playbook_id: playbookId,
            strategy: activePlaybook?.name || 'Uncategorized'
        })
        toast.success('Trade details saved')
        setIsEditing(false)
        setIsEditingStrategyInline(false)
        onClose() // Automatically close popup after save
    } catch (e) {
        toast.error('Failed to save changes')
    } finally {
        setIsSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            setImages(prev => [...prev, base64])
            toast.success('Capture added to selection')
            setIsEditing(true)
        }
        reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
        setIsAnalyzing(false)
        toast.info("AI Analysis simulation complete")
    }, 2000)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trade permanently?')) {
        setIsDeleting(true)
        await removeTrade(trade.id)
        toast.error('Trade deleted')
        onClose()
    }
  }

  const pnl = trade.pnl || 0
  const isWin = pnl >= 0

  // Helper to parse rules safely
  const getRules = (pb: any) => {
    if (!pb || !pb.rules) return []
    if (Array.isArray(pb.rules)) return pb.rules
    try {
        return JSON.parse(pb.rules)
    } catch (e) {
        return []
    }
  }

  return createPortal(
    <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 99999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem'
    }}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(0,0,0,0.85)', 
              backdropFilter: 'blur(12px)' 
          }}
          onClick={onClose}
        />
        
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            style={{ 
                width: '100%', 
                maxWidth: '1000px', 
                maxHeight: '90vh',
                background: '#0a0a0f', 
                border: '1px solid var(--border-accent)', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                display: 'grid', 
                gridTemplateColumns: '1fr 350px',
                position: 'relative',
                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7)',
                zIndex: 100000
            }}
            onClick={e => e.stopPropagation()}
        >
            {/* Left: Main Content */}
            <div style={{ padding: '2.5rem', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{trade.symbol}</h2>
                    <span style={{ 
                        background: trade.side === 'LONG' ? 'var(--green-dim)' : 'var(--red-dim)', 
                        color: trade.side === 'LONG' ? 'var(--green)' : 'var(--red)',
                        padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800
                    }}>{trade.side}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16}/> {new Date(trade.created_at).toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Target size={16}/> RR: {trade.r_multiple || '2.4'}x</div>
                  </div>
                </div>
                <button onClick={onClose} className="icon-btn" style={{ padding: '0.6rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-bright)', letterSpacing: '0.15em', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Market Proof (Screenshots)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {images.map((img, i) => (
                        <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', aspectRatio: '16/9', position: 'relative' }}>
                            <img src={img} alt="Trade capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button 
                                onClick={() => { setImages(images.filter((_, idx) => idx !== i)); setIsEditing(true); }}
                                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'var(--text-static-white)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            ><X size={14}/></button>
                        </div>
                    ))}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ borderRadius: '16px', border: '2px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', aspectRatio: '16/9', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                        <ImageIcon size={28} color="var(--text-muted)"/>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>UPLOAD CAPTURE</span>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-bright)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Trade Journal & Logic</h3>
                    <button onClick={() => { setIsEditing(!isEditing); setNotes(trade.notes || ''); setImages(trade.images || []); setPlaybookId(trade.playbook_id || ''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-bright)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>{isEditing ? 'CANCEL' : 'EDIT DETAILS'}</button>
                </div>
                {isEditing ? (
                    <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        style={{ width: '100%', minHeight: '200px', background: 'var(--bg-secondary)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '1.25rem', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', fontSize: '0.95rem', lineHeight: 1.6 }}
                        placeholder="Describe your entry reason, management, and emotions..."
                    />
                ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        {notes || 'No detailed notes provided for this execution. Use the edit button to add logic and management details.'}
                    </p>
                )}
              </div>
            </div>

            {/* Right: Sidebar Stats */}
            <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'rgba(255,255,255,0.015)' }}>
              <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', background: isWin ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isWin ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>TOTAL OUTCOME</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: isWin ? 'var(--green)' : 'var(--red)', marginBottom: '0.25rem' }}>
                    {isWin ? '+' : '-'}${Math.abs(pnl).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isWin ? 'var(--green)' : 'var(--red)', opacity: 0.8 }}>
                    {isWin ? '+' : '-'}{(trade.pnl_pct || 0).toFixed(2)}%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Entry Price</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>${trade.entry_price.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exit Price</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>${trade.exit_price?.toLocaleString() || '--'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Position Size</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{trade.lot_size || '0.1'} Lots</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <BookOpen size={16}/> Strategy
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {isEditing && (
                                <button 
                                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                                    style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent-bright)', padding: '0.2rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Quick Add Strategy"
                                >
                                    <X size={12} style={{ transform: showQuickAdd ? 'none' : 'rotate(45deg)', transition: 'transform 0.2s' }} />
                                </button>
                            )}
                            <button 
                                onClick={() => { setView('playbooks'); onClose(); }}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-bright)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                                MANAGE
                            </button>
                        </div>
                    </div>

                    {(isEditing || isEditingStrategyInline) ? (
                        <>
                            {showQuickAdd && isEditing ? (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input 
                                        type="text"
                                        placeholder="New strategy name..."
                                        value={newStrategyName}
                                        onChange={e => setNewStrategyName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuickAddStrategy()}
                                        style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none' }}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleQuickAddStrategy}
                                        disabled={isCreatingStrategy || !newStrategyName.trim()}
                                        style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '0 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                    >
                                        {isCreatingStrategy ? '...' : 'ADD'}
                                    </button>
                                </div>
                            ) : (
                                <Select 
                                    value={playbookId || (trade.playbook_id || '')} 
                                    onChange={val => isEditing ? setPlaybookId(val) : handleInlineStrategyChange(val)}
                                    options={[
                                        { value: '', label: 'No Strategy' },
                                        ...playbooks.map(pb => ({ value: pb.id, label: pb.name }))
                                    ]}
                                    width="100%"
                                />
                            )}
                        </>
                    ) : (
                        <div 
                            onClick={() => setIsEditingStrategyInline(true)}
                            style={{ 
                                padding: '0.75rem', 
                                background: 'var(--bg-secondary)', 
                                borderRadius: '10px', 
                                fontSize: '0.85rem', 
                                fontWeight: 800, 
                                color: 'var(--accent-bright)', 
                                border: '1px solid rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                        >
                            {displayStrategyName}
                            <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.5 }}>
                                <Target size={14} />
                            </div>
                        </div>
                    )}
                
                {selectedPlaybook && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>STRATEGY RULES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {getRules(selectedPlaybook).map((rule: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
                                    {rule.text || rule}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
                <Button variant="primary" style={{ width: '100%', padding: '1rem' }} onClick={handleSave} disabled={!isEditing && !isStrategyChanged} isLoading={isSaving}>
                    <Save size={18}/> SAVE CHANGES
                </Button>
                <Button variant="outline" style={{ width: '100%', padding: '1rem' }} onClick={handleAnalyze} isLoading={isAnalyzing}>
                    <Brain size={18}/> ASK AI MENTOR
                </Button>
                <Button variant="danger" style={{ width: '100%', padding: '1rem' }} onClick={handleDelete} isLoading={isDeleting}>
                    <Trash2 size={18}/> DELETE TRADE
                </Button>
              </div>
            </div>
        </motion.div>
    </div>,
    document.body
  )
}
