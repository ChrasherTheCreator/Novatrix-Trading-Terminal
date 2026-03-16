import { useState } from 'react'
import { Upload, FileText, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store/app'
import { toast } from 'sonner'

export default function ImportWizard() {
  const { fetchTrades, accounts } = useAppStore()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setImporting(true)
    
    // Simulate CSV parsing for demo
    // In real app, use PapaParse or similar
    const reader = new FileReader()
    reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').slice(1) // skip header
        
        const trades = lines.filter(l => l.trim() !== '').map(line => {
            const cols = line.split(',')
            return {
                account_id: accounts[0]?.id || '1',
                symbol: cols[0] || 'EURUSD',
                side: (cols[1] || 'LONG').toUpperCase(),
                entry_price: parseFloat(cols[2]) || 0,
                stop_loss: parseFloat(cols[3]) || 0,
                take_profit: parseFloat(cols[4]) || 0,
                lot_size: parseFloat(cols[5]) || 0.1,
                risk_amount: 100,
                status: 'CLOSED',
                pnl: parseFloat(cols[6]) || 0,
                created_at: new Date().toISOString()
            }
        })

        try {
            const res = await fetch('http://localhost:3001/api/trades/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trades)
            })
            if (res.ok) {
                const data = await res.json()
                toast.success(`Successfully imported ${data.imported} trades`)
                fetchTrades()
                setFile(null)
            }
        } catch (err) {
            toast.error('Import failed')
        } finally {
            setImporting(false)
        }
    }
    reader.readAsText(file)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Upload size={18} color="var(--accent-bright)"/>
        <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>CSV Import Wizard</h2>
      </div>
      
      <div style={{ 
        border: '2px dashed var(--border-subtle)', 
        borderRadius: '12px', 
        padding: '2rem', 
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        marginBottom: '1rem'
      }}>
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={32} color="var(--accent-bright)"/>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ fontSize: '0.75rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
        ) : (
          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={32} color="var(--text-muted)"/>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload or drag & drop</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Supports MetaTrader, TradingView, Oanda CSVs</span>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }}/>
          </label>
        )}
      </div>

      <button 
        disabled={!file || importing}
        onClick={handleUpload}
        className="btn btn-primary" 
        style={{ width: '100%', padding: '0.75rem' }}
      >
        {importing ? 'Processing...' : 'Start Import Sync'}
      </button>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'var(--accent-dim)', padding: '0.75rem', borderRadius: '8px' }}>
        <CheckCircle size={14} color="var(--accent-bright)" style={{ marginTop: '0.125rem' }}/>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Pro Tip: Your CSV should contain Symbol, Side, Entry, SL, TP, Lots, PnL in that order.
        </div>
      </div>
    </div>
  )
}
