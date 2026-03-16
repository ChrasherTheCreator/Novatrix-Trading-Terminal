import { useMemo } from 'react'
import { useAppStore } from '../store/app'
import { ShieldCheck } from 'lucide-react'

export default function NovatrixScore() {
  const { trades = [] } = useAppStore()

  const score = useMemo(() => {
    if (!Array.isArray(trades)) return 0
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    if (closed.length === 0) return 0

    const wins = closed.filter(t => (t.pnl || 0) > 0)
    const winRate = (wins.length / closed.length) * 100
    const grossWin = wins.reduce((s, t) => s + (t.pnl || 0), 0)
    const grossLoss = Math.abs(closed.filter(t => (t.pnl || 0) <= 0).reduce((s, t) => s + (t.pnl || 0), 0))
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : 2.0

    const financialScore = (winRate * 0.6) + (Math.min(profitFactor, 3) / 3 * 40)
    return Math.round(financialScore)
  }, [trades])

  return (
    <div className="card" style={{ 
        display: 'flex', flexDirection: 'column', gap: '1.25rem', 
        border: '1px solid var(--accent)', 
        background: 'linear-gradient(135deg, var(--accent-dim) 0%, rgba(0,0,0,0.8) 100%)',
        position: 'relative',
        overflow: 'hidden'
    }}>
      {/* Primary Brand Glow */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '130px', height: '130px', background: 'var(--accent)', filter: 'blur(50px)', borderRadius: '50%', opacity: 0.3 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h3 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>NOVATRIX INDEX</h3>
        <ShieldCheck size={16} color="var(--accent-bright)"/>
      </div>

      <div style={{ textAlign: 'center', padding: '0.25rem 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '3rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {score}<span style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.3)', marginLeft: '0.25rem' }}>/ 100</span>
        </div>
        <div style={{ 
            marginTop: '1.25rem', 
            fontSize: '0.85rem', 
            fontWeight: 900, 
            color: score >= 70 ? 'var(--accent-bright)' : 'rgba(255,255,255,0.5)', 
            letterSpacing: '0.2em' 
        }}>
          {score >= 70 ? 'PROFESSIONAL EDGE' : 'CONSISTENCY BUILDER'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
                width: `${score}%`, 
                height: '100%', 
                background: 'var(--accent)', 
                borderRadius: '2px', 
                transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }} />
        </div>
      </div>
    </div>
  )
}
