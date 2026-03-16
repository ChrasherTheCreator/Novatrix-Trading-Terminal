import { useState } from 'react'
import { Brain, Sparkles, MessageSquare, ShieldAlert, Zap, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/app'
import { Button } from '../components/ui/Button'
import { toast } from 'sonner'

export default function Mentor() {
  const { trades, analyzeTrade } = useAppStore()
  const [selectedTradeId, setSelectedTradeId] = useState('')
  const [analysisType, setAnalysisType] = useState('review')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const closedTrades = trades.filter(t => t.status === 'CLOSED')

  const handleAnalyze = async () => {
    if (!selectedTradeId) {
      toast.error('Please select a trade to analyze')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const data = await analyzeTrade(selectedTradeId, analysisType)
      if (data) {
        setResult(data)
        toast.success('AI Analysis Complete')
      } else {
        toast.error('Analysis failed. Check your API key.')
      }
    } catch (err) {
      toast.error('Connection error during AI analysis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>AI Trading Mentor</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Get professional insights powered by GPT-4o</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-dim)', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--border-accent)' }}>
          <Sparkles size={16} color="var(--accent-bright)"/>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bright)' }}>AI CORE ACTIVE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
        {/* Selection Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 className="metric-label" style={{ marginBottom: '1rem' }}>SELECT TRADE</h3>
            <select 
              value={selectedTradeId} 
              onChange={e => setSelectedTradeId(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)',
                fontFamily: 'inherit', outline: 'none', marginBottom: '1.5rem'
              }}
            >
              <option value="">Select a closed trade...</option>
              {closedTrades.map(t => (
                <option key={t.id} value={t.id}>
                  {t.symbol} • {t.side} • ${t.pnl} ({new Date(t.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>

            <h3 className="metric-label" style={{ marginBottom: '1rem' }}>ANALYSIS DEPTH</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'review', label: 'Technical Review', icon: Zap, desc: 'Strategy adherence & execution quality' },
                { id: 'psychology', label: 'Psychology Check', icon: Brain, desc: 'Identify FOMO or revenge trading' },
                { id: 'strategy', label: 'Strategy Optimizer', icon: ShieldAlert, desc: 'Risk-management & RR improvements' }
              ].map(type => (
                <div 
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  style={{
                    padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: analysisType === type.id ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    borderColor: analysisType === type.id ? 'var(--accent-bright)' : 'var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <type.icon size={16} color={analysisType === type.id ? 'var(--accent-bright)' : 'var(--text-secondary)'}/>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: analysisType === type.id ? 'var(--accent-bright)' : 'var(--text-primary)' }}>{type.label}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{type.desc}</p>
                </div>
              ))}
            </div>

            <Button 
              variant="primary" 
              onClick={handleAnalyze} 
              disabled={loading || !selectedTradeId}
              style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}
            >
              {loading ? 'Analyzing...' : 'START AI ANALYSIS'}
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--accent-bright)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--accent-bright)"/>
                    <h2 style={{ fontWeight: 800, fontSize: '1.125rem' }}>Analysis Feedback</h2>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>
                    CONFIDENCE: {result.confidence_score * 100}%
                  </div>
                </div>
                <div style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {result.analysis}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card">
                  <h3 className="metric-label" style={{ marginBottom: '1rem' }}>ACTIONABLE SUGGESTIONS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {result.suggestions.map((s: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0, marginTop: '0.25rem' }}><ArrowRight size={14} color="var(--accent-bright)"/></div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                  <h3 className="metric-label" style={{ marginBottom: '1rem' }}>MENTOR NOTE</h3>
                  <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    "The most important thing in trading is to stay in the game. These insights are meant to help you refine your edge, not to replace your own judgment."
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem', opacity: 0.6, border: '2px dashed var(--border-subtle)' }}>
              <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '50%' }}>
                <Brain size={64} color="var(--text-muted)"/>
              </div>
              <div>
                <h2 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Awaiting Input</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0.5rem auto' }}>Select a trade and analysis type to receive detailed AI-driven feedback.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
