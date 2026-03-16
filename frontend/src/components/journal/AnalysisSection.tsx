import React from 'react'
import { Card } from '../ui/Card'
import { CheckCircle2, Image as ImageIcon } from 'lucide-react'

interface AnalysisSectionProps {
  notes: string
  onNotesChange: (v: string) => void
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ notes, onNotesChange }) => {
  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-[#10b981]" />
        <h2 className="text-base font-bold text-[#f1f5f9] uppercase tracking-wider">Post-Trade Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569]">
            Analysis Notes
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Enter trade thesis, emotional state, and exit management plan..."
            rows={6}
            className="w-full bg-[#10101e] border border-white/10 rounded-lg p-4 text-sm text-[#f1f5f9] placeholder:text-[#475569] outline-none focus:border-[#8b5cf6] transition-all resize-none leading-relaxed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#475569]">
            Evidence Gallery
          </label>
          <div className="w-full aspect-video bg-[#10101e] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group">
            <ImageIcon size={28} className="text-[#475569] group-hover:text-[#94a3b8] transition-colors" />
            <span className="text-[0.65rem] font-bold text-[#475569] group-hover:text-[#94a3b8] tracking-widest uppercase">
              Add Evidence Screenshot
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
