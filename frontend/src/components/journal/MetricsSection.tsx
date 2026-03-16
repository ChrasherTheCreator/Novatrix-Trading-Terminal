import React from 'react'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { BarChart2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MetricsSectionProps {
  asset: string
  setAsset: (v: string) => void
  side: 'LONG' | 'SHORT'
  setSide: (v: 'LONG' | 'SHORT') => void
  risk: string
  setRisk: (v: string) => void
  entry: string
  setEntry: (v: string) => void
  sl: string
  setSl: (v: string) => void
  tp: string
  setTp: (v: string) => void
  rrRatio: string | null
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({
  asset, setAsset, side, setSide, risk, setRisk, entry, setEntry, sl, setSl, tp, setTp, rrRatio
}) => {
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BarChart2 size={18} className="text-[#a78bfa]" />
        <h2 className="text-base font-bold text-[#f1f5f9]">Trade Metrics</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input label="Asset Pair" value={asset} onChange={e => setAsset(e.target.value)} />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569]">
            Position Side
          </label>
          <div className="flex h-10 rounded-lg overflow-hidden border border-white/10">
            {(['LONG', 'SHORT'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  'flex-1 text-xs font-bold transition-all',
                  side === s
                    ? (s === 'LONG' ? 'bg-[#10b981] text-white' : 'bg-[#ef4444] text-white')
                    : 'bg-[#10101e] text-[#475569] hover:bg-[#1a1a35]'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Input label="Risk Amount ($)" value={risk} onChange={e => setRisk(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input label="Entry Price" value={entry} onChange={e => setEntry(e.target.value)} />
        <Input label="Stop Loss" value={sl} onChange={e => setSl(e.target.value)} />
        <Input label="Take Profit" value={tp} onChange={e => setTp(e.target.value)} />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569]">
            R/R Ratio
          </label>
          <div className="flex h-10 items-center px-4 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#a78bfa] font-black text-base shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            {rrRatio ? `${rrRatio}x` : '--'}
          </div>
        </div>
      </div>
    </Card>
  )
}
