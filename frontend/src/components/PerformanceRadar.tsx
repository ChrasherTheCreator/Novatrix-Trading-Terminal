import { useMemo, useState } from 'react'
import { useAppStore } from '../store/app'
import { Radar as RadarIcon } from 'lucide-react'

export default function PerformanceRadar() {
  const { trades = [] } = useAppStore()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const radarStats = useMemo(() => {
    if (!Array.isArray(trades)) return Array(6).fill({ val: 0, raw: 0, label: '', suffix: '' })
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    if (closed.length === 0) return Array(6).fill({ val: 0, raw: 0, label: '', suffix: '' })

    const wins = closed.filter(t => (t.pnl || 0) > 0)
    const winrate = (wins.length / closed.length) * 100
    const grossWin = wins.reduce((s, t) => s + (t.pnl || 0), 0)
    const grossLoss = Math.abs(closed.filter(t => (t.pnl || 0) <= 0).reduce((s, t) => s + (t.pnl || 0), 0))
    const pf = grossLoss > 0 ? grossWin / grossLoss : 2.0
    const avgRR = 2.5 
    const tradesWithMistakes = closed.filter(t => Array.isArray(t.mistake_tags) && t.mistake_tags.length > 0).length
    const discipline = ((closed.length - tradesWithMistakes) / (closed.length || 1)) * 100
    const execution = 80 
    const consistency = 75

    return [
        { label: 'WINRATE', val: winrate, raw: winrate, suffix: '%' },
        { label: 'PROF. FACTOR', val: Math.min(100, (pf / 3) * 100), raw: pf, suffix: '' },
        { label: 'AVG R/R', val: Math.min(100, (avgRR / 5) * 100), raw: avgRR, suffix: ':1' },
        { label: 'DISCIPLINE', val: discipline, raw: discipline, suffix: '%' },
        { label: 'EXECUTION', val: execution, raw: execution, suffix: '%' },
        { label: 'CONSISTENCY', val: consistency, raw: consistency, suffix: '%' }
    ]
  }, [trades])

  const size = 220
  const center = size / 2
  const radius = size * 0.35

  const pointsData = radarStats.map((stat, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const r = (stat.val / 100) * radius
    const x = center + r * Math.cos(angle)
    const y = center + r * Math.sin(angle)
    return { x, y, ...stat }
  })

  const polyPoints = pointsData.map(p => `${p.x},${p.y}`).join(' ')
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}>
        <RadarIcon size={18}/>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>PERFORMANCE RADAR</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {gridLevels.map(lvl => (
            <polygon
              key={lvl}
              points={Array.from({ length: 6 }).map((_, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
                const r = radius * lvl
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
              }).join(' ')}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          ))}
          
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
            return (
              <line
                key={i}
                x1={center} y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
            )
          })}

          <polygon
            points={polyPoints}
            fill="var(--accent-dim)"
            stroke="var(--accent)"
            strokeWidth="2"
            style={{ opacity: 0.6, transition: 'all 0.3s ease' }}
          />

          {/* SUBTLE INTERACTIVE POINTS */}
          {pointsData.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle 
                    cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3} 
                    fill="var(--accent-bright)" 
                    stroke="var(--accent)" strokeWidth="1"
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease', opacity: hoveredIdx === i ? 1 : 0.6 }}
                />
                
                <text
                    x={center + (radius + 35) * Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2)}
                    y={center + (radius + 35) * Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2)}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="var(--text-primary)"
                    dominantBaseline="middle"
                    style={{ transition: 'opacity 0.2s', opacity: hoveredIdx === null || hoveredIdx === i ? 1 : 0.2 }}
                >
                    {p.label}
                </text>
            </g>
          ))}

          {hoveredIdx !== null && (
              <g style={{ pointerEvents: 'none' }}>
                  <rect 
                    x={center - 40} y={center - 15} width="80" height="30" 
                    rx="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="1"
                    style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.5))' }}
                  />
                  <text 
                    x={center} y={center + 4} textAnchor="middle" 
                    fontSize="11" fontWeight="950" fill="var(--text-primary)"
                  >
                    {radarStats[hoveredIdx].raw.toFixed(2)}{radarStats[hoveredIdx].suffix}
                  </text>
              </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>DOMINANT</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--green)' }}>Discipline</div>
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>GROWTH OP</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--red)' }}>Avg R/R</div>
          </div>
      </div>
    </div>
  )
}
