/* ============================================================
   WidgetCard – Single widget card with iframe, drag/resize handles
   ============================================================ */

import { useRef, useEffect } from 'react';
import { useAppStore } from '../../store/app';
import { getWidgetDef } from './widgetRegistry';

interface WidgetCardProps {
  instanceId: string;
  widgetId: string;
  style: React.CSSProperties;
  onStartDrag: (instanceId: string, mouseX: number, mouseY: number, el: HTMLElement, container: HTMLElement) => void;
  onStartResize: (instanceId: string, mouseX: number, mouseY: number, el: HTMLElement) => void;
  onRemove: (instanceId: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function WidgetCard({
  instanceId, widgetId, style,
  onStartDrag, onStartResize, onRemove, containerRef
}: WidgetCardProps) {
  const { left, top, width, height } = style;
  const def = getWidgetDef(widgetId);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trades = useAppStore(s => s.trades);
  const playbooks = useAppStore(s => s.playbooks);
  const calendarData = useAppStore(s => s.calendarData);
  const pulses = useAppStore(s => s.pulses);
  const latestScore = useAppStore(s => s.latestScore);
  const demoMode = useAppStore(s => s.demoMode);

  // Send data to iframe via postMessage after it loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        let finalTrades = (trades || []);
        let finalAccounts = useAppStore.getState().accounts || [];
        let finalPulses = pulses || [];
        let finalLatestScore = latestScore;

        if (demoMode) {
            // Generate robust demo data
            finalAccounts = [{ id: 'demo-1', name: 'Demo Prop Account', size: '$100,000', type: 'Prop-Firm', currency: 'USD' }];
            const symbols = ['BTCUSD', 'EURUSD', 'GOLD', 'NAS100', 'AAPL', 'ETHUSD'];
            const mistakes = ['FOMO', 'Revenge Trading', 'Late Entry', 'Overleveraged', 'Poor Risk Mgmt'];
            const emotions = ['Confident', 'Anxious', 'Neutral', 'Greedy'];
            
            finalTrades = Array.from({ length: 45 }).map((_, i) => {
                const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
                const isWin = Math.random() > 0.45;
                const pnl = isWin ? (Math.random() * 1500 + 200) : -(Math.random() * 800 + 100);
                const date = new Date();
                date.setDate(date.getDate() - (45 - i));
                date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
                
                return {
                    id: `demo-t-${i}`,
                    symbol: symbols[Math.floor(Math.random() * symbols.length)],
                    side,
                    status: 'CLOSED',
                    pnl,
                    pnl_pct: pnl / 1000,
                    entry_price: 1000 + Math.random() * 50000,
                    exit_price: 1000 + Math.random() * 50000,
                    lot_size: 1.0,
                    created_at: date.toISOString(),
                    entry_time: date.toISOString(),
                    mistake_tags: Math.random() > 0.7 ? [mistakes[Math.floor(Math.random() * mistakes.length)]] : [],
                    emotion: emotions[Math.floor(Math.random() * emotions.length)],
                    tags: ['Demo', 'Trend'],
                    mae: Math.random() * 200,
                    mfe: Math.random() * 1500,
                    r_multiple: pnl / 500
                } as any;
            });

            finalPulses = Array.from({ length: 10 }).map((_, i) => ({
                emotional_rating: 5 + Math.floor(Math.random() * 5),
                mental_state: 'Focused',
                created_at: new Date(Date.now() - i * 86400000).toISOString()
            })) as any;

            finalLatestScore = { total_score: 84 } as any;
        }

        const closedTrades = finalTrades.filter(t => t && t.status === 'CLOSED' && t.pnl !== null);
        const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
        const losses = closedTrades.filter(t => (t.pnl || 0) <= 0);
        const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
        const grossProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0);
        const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

        const returns = closedTrades.map(t => t.pnl || 0);
        const meanReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
        const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length || 1);
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

        let equity = 10000;
        let maxEquity = 10000;
        let maxDrawdown = 0;
        closedTrades.forEach(t => {
          equity += t.pnl || 0;
          if (equity > maxEquity) maxEquity = equity;
          const dd = maxEquity > 0 ? ((maxEquity - equity) / maxEquity) * 100 : 0;
          if (dd > maxDrawdown) maxDrawdown = dd;
        });

        // Build data payload
        const data = {
          type: 'NOVATRIX_DATA',
          widgetId,
          demoMode,
          totalPnl,
          winRate,
          profitFactor,
          sharpeRatio,
          totalTrades: closedTrades.length,
          maxDrawdown,
          equity,
          novatrixScore: finalLatestScore?.total_score || 0,
          trades: finalTrades.map(t => ({
            id: t.id,
            pnl: t.pnl,
            pnl_pct: t.pnl_pct,
            symbol: t.symbol,
            side: t.side,
            status: t.status,
            created_at: t.created_at,
            entry_time: t.entry_time,
            exit_time: t.exit_time,
            entry_price: t.entry_price,
            exit_price: t.exit_price,
            lot_size: t.lot_size,
            mae: t.mae,
            mfe: t.mfe,
            r_multiple: t.r_multiple,
            mistake_tags: t.mistake_tags || [],
            tags: t.tags || [],
            emotion: t.emotion,
            strategy: t.strategy,
            playbook_id: t.playbook_id,
          })),
          playbooks: (playbooks || []).map(p => ({
            id: p.id,
            name: p.name,
            winRate: p.winRate,
            trades: p.trades,
            avgRR: p.avgRR,
          })),
          accounts: (finalAccounts || []).map(a => ({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            currency: a.currency
          })),
          calendarData,
          pulses: (finalPulses || []).map(p => ({
            emotional_rating: p.emotional_rating,
            mental_state: p.mental_state,
            created_at: p.created_at,
          })),
        };

        iframe.contentWindow?.postMessage(data, '*');
      } catch (e) {
        // Silently ignore cross-origin errors
      }
    };

    iframe.addEventListener('load', handleLoad);
    // Also send data if trades change (re-run effect)
    if (iframe.contentWindow) {
      handleLoad();
    }
    return () => iframe.removeEventListener('load', handleLoad);
  }, [widgetId, trades, playbooks, calendarData, pulses, latestScore, demoMode]);

  if (!def) return null;

  return (
    <div
      ref={cardRef}
      className="wg-widget-card"
      data-instance-id={instanceId}
      data-widget-id={widgetId}
      style={{ left, top, width, height }}
    >
      {/* Permanent Border & Background */}
      <div className="wg-widget-border" />

      {/* Drag Handle */}
      <div
        className="wg-drag-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (cardRef.current && containerRef.current) {
            onStartDrag(instanceId, e.clientX, e.clientY, cardRef.current, containerRef.current);
          }
        }}
      >
        <div className="wg-drag-dots">
          <span /><span /><span /><span /><span /><span />
        </div>
      </div>

      {/* Widget Actions */}
      <div className="wg-widget-actions">
        <button
          className="wg-action-btn wg-delete"
          title="Remove widget"
          onClick={(e) => { e.stopPropagation(); onRemove(instanceId); }}
        >
          ✕
        </button>
      </div>

      {/* Iframe Content */}
      <div className="wg-widget-content">
        <iframe
          ref={iframeRef}
          src={def.src}
          title={def.name}
          loading="lazy"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Resize Handle */}
      <div
        className="wg-resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (cardRef.current) {
            onStartResize(instanceId, e.clientX, e.clientY, cardRef.current);
          }
        }}
      />
    </div>
  );
}
