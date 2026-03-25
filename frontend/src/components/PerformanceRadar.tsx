import { useMemo, memo, useState } from 'react'
import { useAppStore } from '../store/app'
import { Radar as RadarIcon } from 'lucide-react'

const PerformanceRadar = memo(function PerformanceRadar() {
  const { trades = [] } = useAppStore()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  
  const size = 220
  const center = size / 2
  const radius = size * 0.35

  const radarStats = useMemo(() => {
    if (!Array.isArray(trades)) return Array(6).fill({ val: 0, raw: 0, label: '', suffix: '' })
    const closed = trades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null)
    
    if (closed.length === 0) return [
        { label: 'WINRATE', val: 0, raw: 0, suffix: '%' },
        { label: 'PROF. FACTOR', val: 0, raw: 0, suffix: '' },
        { label: 'AVG R/R', val: 0, raw: 0, suffix: ':1' },
        { label: 'DISCIPLINE', val: 0, raw: 0, suffix: '%' },
        { label: 'EXECUTION', val: 0, raw: 0, suffix: '%' },
        { label: 'CONSISTENCY', val: 0, raw: 0, suffix: '%' }
    ]

    const wins = closed.filter(t => (t.pnl || 0) > 0)
    const winrate = (wins.length / closed.length) * 100
    const grossWin = wins.reduce((s, t) => s + (t.pnl || 0), 0)
    const grossLoss = Math.abs(closed.filter(t => (t.pnl || 0) <= 0).reduce((s, t) => s + (t.pnl || 0), 0))
    const pf = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? 99 : 0)
    const avgRR = closed.reduce((s, t) => s + (t.r_multiple || 0), 0) / (closed.length || 1)
    const tradesWithMistakes = closed.filter(t => Array.isArray(t.mistake_tags) && t.mistake_tags.length > 0).length
    const discipline = ((closed.length - tradesWithMistakes) / (closed.length || 1)) * 100

    return [
        { label: 'WINRATE', val: winrate, raw: winrate, suffix: '%' },
        { label: 'PROF. FACTOR', val: Math.min(100, (pf / 3) * 100), raw: pf, suffix: '' },
        { label: 'AVG R/R', val: Math.min(100, (avgRR / 4) * 100), raw: avgRR, suffix: ':1' },
        { label: 'DISCIPLINE', val: discipline, raw: discipline, suffix: '%' },
        { label: 'EXECUTION', val: 85, raw: 85, suffix: '%' },
        { label: 'CONSISTENCY', val: 75, raw: 75, suffix: '%' }
    ]
  }, [trades])

  const pointsData = useMemo(() => radarStats.map((stat, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const r = (stat.val / 100) * radius
    return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        lx: center + (radius + 35) * Math.cos(angle),
        ly: center + (radius + 35) * Math.sin(angle),
        ...stat
    }
  }), [radarStats, center, radius])

  const polyPoints = useMemo(() => pointsData.map(p => `${p.x},${p.y}`).join(' '), [pointsData])

  return (
    <div className="card performance-radar-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-bright)' }}>
        <RadarIcon size={18}/>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>PERFORMANCE RADAR</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {/* Grid levels */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(lvl => (
            <polygon key={lvl} points={Array.from({ length: 6 }).map((_, i) => {
                const a = (Math.PI * 2 * i) / 6 - Math.PI / 2; const r = radius * lvl
                return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
              }).join(' ')} fill="none" stroke="var(--border-subtle)" strokeWidth="1" style={{ opacity: 0.3 }} />
          ))}
          
          {/* Grid lines */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
            return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(a)} y2={center + radius * Math.sin(a)} stroke="var(--border-subtle)" strokeWidth="1" style={{ opacity: 0.3 }} />
          })}

          <polygon points={polyPoints} fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="2" style={{ opacity: 0.5, pointerEvents: 'none' }} />

          {/* Hitboxes and Points */}
          {pointsData.map((p, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const labelHitX = center + (radius + 35) * Math.cos(angle);
            const labelHitY = center + (radius + 35) * Math.sin(angle);
            const isHovered = hoveredIdx === i;
            
            return (
              <g 
                key={i} 
                className={`radar-hitbox radar-hitbox-${i}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                  {/* Invisible hit areas */}
                  <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                  <rect x={labelHitX - 35} y={labelHitY - 10} width="70" height="20" fill="transparent" />

                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? 5 : 2.5} 
                    fill={isHovered ? '#fff' : 'var(--accent-bright)'}
                    stroke={isHovered ? 'var(--accent)' : 'none'}
                    strokeWidth={isHovered ? 2 : 0}
                    style={{ transition: 'all 0.15s ease', opacity: isHovered ? 1 : 0.4 }}
                  />
                  
                  <text 
                    x={p.lx} 
                    y={p.ly} 
                    textAnchor="middle" 
                    fontSize={isHovered ? 9 : 8} 
                    fontWeight={isHovered ? 950 : 900} 
                    dominantBaseline="middle"
                    fill={isHovered ? 'var(--accent-bright)' : 'var(--text-primary)'}
                    style={{ transition: 'all 0.15s ease', opacity: isHovered ? 1 : 0.8 }}
                  >
                      {p.label}
                  </text>
              </g>
            );
          })}

          {/* Central Information Hub */}
          {hoveredIdx !== null && (
            <g style={{ pointerEvents: 'none' }}>
                <rect x={center - 38} y={center - 14} width="76" height="28" rx="6" fill="rgba(10, 10, 18, 0.98)" stroke="var(--accent)" strokeWidth="1.5" />
                <text 
                    x={center} 
                    y={center + 5} 
                    textAnchor="middle" 
                    fontSize="11" 
                    fontWeight="950" 
                    fill="#fff" 
                >
                    {radarStats[hoveredIdx].raw.toFixed(1)}{radarStats[hoveredIdx].suffix}
                </text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOP STRENGTH</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--green)' }}>
                {radarStats.reduce((p, c) => (p.val > c.val) ? p : c).label}
              </div>
          </div>
          <div style={{ padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: 800, color: 'var(--text-muted)' }}>UPGRADE PATH</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--red)' }}>
                {radarStats.reduce((p, c) => (p.val < c.val) ? p : c).label}
              </div>
          </div>
      </div>
    </div>
  )
})

export default PerformanceRadar;
