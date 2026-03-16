import React from 'react'
import { Button } from '../ui/Button'

interface JournalHeroProps {
  onSaveDraft: () => void
  onJournalTrade: () => void
}

export const JournalHero: React.FC<JournalHeroProps> = ({ onSaveDraft, onJournalTrade }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-black text-[#f1f5f9]">Mission Control</h1>
        <p className="text-sm text-[#94a3b8]">
          Trade Entry Sequence — {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onSaveDraft}>Save Draft</Button>
        <Button onClick={onJournalTrade}>JOURNAL NEW TRADE</Button>
      </div>
    </div>
  )
}
