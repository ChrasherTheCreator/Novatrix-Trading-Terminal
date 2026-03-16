import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CheckSquare, Square, Book } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PlaybookSectionProps {
  strategies: string[]
  currentStrategy: string
  onStrategyChange: (s: string) => void
  checklist: { id: number; label: string; done: boolean }[]
  onToggleCheck: (id: number) => void
}

export const PlaybookSection: React.FC<PlaybookSectionProps> = ({
  strategies,
  currentStrategy,
  onStrategyChange,
  checklist,
  onToggleCheck
}) => {
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Book size={18} className="text-[#a78bfa]" />
        <h2 className="text-base font-bold text-[#f1f5f9]">Strategy Playbook</h2>
      </div>

      <div>
        <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569] mb-3 block">
          Core Strategy
        </label>
        <div className="flex flex-wrap gap-2">
          {strategies.map(s => (
            <button
              key={s}
              onClick={() => onStrategyChange(s)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all border',
                currentStrategy === s
                  ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white'
                  : 'bg-transparent border-white/10 text-[#94a3b8] hover:border-[#8b5cf6]/50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569] mb-4 block">
            Pre-Trade Checklist
          </label>
          <div className="flex flex-col gap-3">
            {checklist.map(c => (
              <label
                key={c.id}
                className="flex items-start gap-3 cursor-pointer text-sm text-[#94a3b8] group"
              >
                <span onClick={() => onToggleCheck(c.id)} className="shrink-0 mt-0.5 transition-transform active:scale-90">
                  {c.done ? (
                    <CheckSquare size={18} className="text-[#a78bfa]" />
                  ) : (
                    <Square size={18} className="text-[#475569] group-hover:text-[#94a3b8]" />
                  )}
                </span>
                <span className={cn(c.done && 'text-[#f1f5f9]')}>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569] mb-4 block">
            Market Context
          </label>
          <select className="w-full bg-[#10101e] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#f1f5f9] outline-none focus:border-[#8b5cf6]">
            <option>Trending Bullish</option>
            <option>Ranging</option>
            <option>Trending Bearish</option>
          </select>
          <div className="flex gap-2 mt-4">
            <Badge variant="info">VIX: 14.2</Badge>
            <Badge variant="warning">DXY: 106.1</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
