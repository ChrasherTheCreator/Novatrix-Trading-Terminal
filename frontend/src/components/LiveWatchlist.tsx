import { useEffect, useState, memo } from 'react';
import { Activity, Globe } from 'lucide-react';

interface CryptoTick {
  asset: string;
  price: string;
}

// Wrap in memo to prevent re-renders unless props change
const LiveWatchlist = memo(function LiveWatchlist() {
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, { price: string, up: boolean | null }>>({});
  const [fiatRates, setFiatRates] = useState<Record<string, number>>({});

  useEffect(() => {
    // Dedicated WebSocket for this component to keep it isolated
    const ws = new WebSocket('ws://localhost:3001/ws/ticks');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg || !msg.payload) return;

        if (msg.msg_type === 'CRYPTO_TICK') {
          const payload: CryptoTick = msg.payload;
          if (!payload.asset || !payload.price) return;

          setCryptoPrices(prev => {
            const current = prev[payload.asset];
            if (current && current.price === payload.price) return prev; 
            
            const oldPriceStr = current?.price;
            let isUp = null;
            if (oldPriceStr) {
               isUp = parseFloat(payload.price) > parseFloat(oldPriceStr);
            }
            return {
              ...prev,
              [payload.asset]: { price: parseFloat(payload.price).toFixed(2), up: isUp }
            };
          });
        }
        else if (msg.msg_type === 'FIAT_RATES') {
          if (msg.payload) setFiatRates(msg.payload);
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <Activity size={16} color="var(--accent-bright)" />
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>LIVE MARKET FEED</h3>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(cryptoPrices).map(([asset, data]) => (
          <div key={asset} style={{ 
            background: 'var(--bg-secondary)', 
            border: `1px solid ${data.up === true ? 'rgba(16,185,129,0.3)' : data.up === false ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px',
            color: data.up === true ? 'var(--green)' : data.up === false ? 'var(--red)' : 'var(--text-primary)',
            minWidth: '100px'
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{asset}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>${data.price}</div>
          </div>
        ))}
      </div>

      {Object.keys(fiatRates).length > 0 && (
         <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
           <Globe size={14} /> FX: 
           <span>EUR: {fiatRates['EUR']}</span>
           <span>GBP: {fiatRates['GBP']}</span>
           <span>JPY: {fiatRates['JPY']}</span>
         </div>
      )}
    </div>
  );
});

export default LiveWatchlist;
