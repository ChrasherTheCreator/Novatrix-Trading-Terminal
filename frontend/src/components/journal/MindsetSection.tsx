import React from 'react'
import { Card } from '../ui/Card'
import { Brain } from 'lucide-react'

export const MindsetSection: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 sticky top-6">
      <Card className="border-[#8b5cf6]/20 bg-linear-to-br from-[#8b5cf6]/5 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-[#a78bfa]" />
          <h3 className="text-sm font-bold text-[#f1f5f9]">Mindset Check</h3>
        </div>
        <p className="text-xs text-[#94a3b8] italic leading-relaxed mb-4">
          "Focus on the process, not the outcome. The setup is valid based on your 2023 playbook."
        </p>
        
        <label className="text-[0.6rem] font-black tracking-widest text-[#475569] mb-2 block uppercase">
          Confidence Level
        </label>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-1.5 rounded-full ${i < 5 ? 'bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.3)]' : 'bg-white/5'}`} 
            />
          ))}
        </div>
      </Card>

      <Card>
        <label className="text-[0.6rem] font-black tracking-widest text-[#475569] mb-4 block uppercase">
          Account Stats (WTD)
        </label>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Monthly PnL', value: '+$12,450.00', variant: 'success' },
            { label: 'Win Rate', value: '68%', variant: 'info' },
            { label: 'Drawdown', value: '-1.2%', variant: 'danger' },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-xs text-[#94a3b8]">{s.label}</span>
              <span className={`text-xs font-bold ${
                s.variant === 'success' ? 'text-emerald-500' : 
                s.variant === 'danger' ? 'text-red-500' : 'text-[#f1f5f9]'
              }`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
