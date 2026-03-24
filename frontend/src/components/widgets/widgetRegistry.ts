/* ============================================================
   WIDGET REGISTRY – All 20 Trading Widgets + Default Layouts
   ============================================================ */

export interface WidgetDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  src: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  scalable: boolean;
}

export interface LayoutItem {
  widgetId: string;
  col: number;
  row: number;
  w: number;
  h: number;
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  // --- Small KPI Cards (Grid 2x2) ---
  {
    id: 'pnl-status', name: 'P&L Status Display', icon: 'show_chart', category: 'KPI',
    src: '/widgets/p&l status display.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },
  {
    id: 'profit-factor', name: 'Profit Factor', icon: 'payments', category: 'KPI',
    src: '/widgets/profit factor.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },
  {
    id: 'sharpe-ratio', name: 'Sharpe Ratio', icon: 'balance', category: 'KPI',
    src: '/widgets/sharpe ratio.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },
  {
    id: 'winrate', name: 'Win Rate', icon: 'percent', category: 'KPI',
    src: '/widgets/winrate.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },
  {
    id: 'total-trades', name: 'Total Trades', icon: 'stacks', category: 'KPI',
    src: '/widgets/total trades.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },
  {
    id: 'novatrix-score', name: 'Novatrix Score', icon: 'shield', category: 'KPI',
    src: '/widgets/novatrix score.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'session-timer', name: 'Session Timer', icon: 'timer', category: 'KPI',
    src: '/widgets/session timer.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'equity-drawdown', name: 'Equity Protector', icon: 'verified_user', category: 'KPI',
    src: '/widgets/equity drawdown.html',
    defaultW: 2, defaultH: 2, minW: 2, minH: 2, maxW: 4, maxH: 3, scalable: false
  },

  // --- Medium Cards ---
  {
    id: 'performance-radar', name: 'Performance Radar', icon: 'radar', category: 'Analytics',
    src: '/widgets/performance radar.html',
    defaultW: 4, defaultH: 6, minW: 4, minH: 6, maxW: 4, maxH: 6, scalable: false
  },
  {
    id: 'mistake-losses', name: 'Mistake Analysis', icon: 'error', category: 'Analytics',
    src: '/widgets/mistake losses.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'playbook-efficiency', name: 'Playbook Efficiency', icon: 'menu_book', category: 'Analytics',
    src: '/widgets/playbook rule efficiency.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 4, maxH: 4, scalable: false
  },

  // --- Medium-Large Cards ---
  {
    id: 'asset-performance', name: 'Asset Performance', icon: 'category', category: 'Analytics',
    src: '/widgets/asset performance.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'scatter-plot', name: 'Holding Time Scatter', icon: 'timelapse', category: 'Charts',
    src: '/widgets/holding time scatter plot.html',
    defaultW: 4, defaultH: 6, minW: 4, minH: 6, maxW: 4, maxH: 6, scalable: false
  },
  {
    id: 'psych-energy', name: 'Mental Pulse Chart', icon: 'vital_signs', category: 'Analytics',
    src: '/widgets/psychological energy level.html',
    defaultW: 4, defaultH: 6, minW: 4, minH: 6, maxW: 4, maxH: 6, scalable: false
  },

  // --- Large Chart Widgets ---
  {
    id: 'drawdown-daily', name: 'Drawdown Graph (Daily)', icon: 'trending_down', category: 'Charts',
    src: '/widgets/drawdown graph daily.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'drawdown-session', name: 'Drawdown Graph (Session)', icon: 'trending_down', category: 'Charts',
    src: '/widgets/drawdown graph session.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 4, maxH: 4, scalable: false
  },
  {
    id: 'cumulative-pnl', name: 'Cumulative P&L Graph', icon: 'insights', category: 'Charts',
    src: '/widgets/cumulative p&l graph 2.html',
    defaultW: 6, defaultH: 6, minW: 6, minH: 6, maxW: 6, maxH: 6, scalable: false
  },

  // --- XL Widgets ---
  {
    id: 'trading-sessions', name: 'Trading Sessions Performance', icon: 'schedule', category: 'Analytics',
    src: '/widgets/trading sessions performance.html',
    defaultW: 4, defaultH: 4, minW: 4, minH: 4, maxW: 12, maxH: 4, scalable: true
  },
  {
    id: 'trading-calendar', name: 'Trading Calendar', icon: 'calendar_month', category: 'Analytics',
    src: '/widgets/trading calendar dashboard.html',
    defaultW: 6, defaultH: 10, minW: 4, minH: 6, maxW: 12, maxH: 10, scalable: true
  },
  {
    id: 'temporal-heatmap', name: 'Temporal P&L Heatmap', icon: 'grid_view', category: 'Charts',
    src: '/widgets/temporal p&l heatmap.html?v=4',
    defaultW: 6, defaultH: 4, minW: 6, minH: 4, maxW: 6, maxH: 6, scalable: false
  }
];

export function getWidgetDef(id: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find(w => w.id === id);
}

/* Default Dashboard Layout */
export const DEFAULT_DASHBOARD_LAYOUT: LayoutItem[] = [
  { widgetId: 'pnl-status',        col: 0,  row: 0,  w: 2, h: 2 },
  { widgetId: 'profit-factor',     col: 2,  row: 0,  w: 2, h: 2 },
  { widgetId: 'sharpe-ratio',      col: 4,  row: 0,  w: 2, h: 2 },
  { widgetId: 'winrate',           col: 6,  row: 0,  w: 2, h: 2 },
  { widgetId: 'total-trades',      col: 8,  row: 0,  w: 2, h: 2 },
  { widgetId: 'novatrix-score',    col: 10, row: 0,  w: 2, h: 2 },

  { widgetId: 'cumulative-pnl',    col: 0,  row: 2,  w: 6, h: 6 },
  { widgetId: 'session-timer',     col: 6,  row: 2,  w: 2, h: 2 },
  { widgetId: 'equity-drawdown',   col: 6,  row: 4,  w: 2, h: 2 },
  { widgetId: 'performance-radar', col: 8,  row: 2,  w: 4, h: 6 },

  { widgetId: 'trading-sessions',  col: 0,  row: 8,  w: 4, h: 4 },
  { widgetId: 'drawdown-daily',    col: 4,  row: 8,  w: 4, h: 4 },
  { widgetId: 'asset-performance', col: 8,  row: 8,  w: 4, h: 4 },

  { widgetId: 'trading-calendar',  col: 0,  row: 12, w: 6, h: 10 },
  { widgetId: 'temporal-heatmap',  col: 6,  row: 12, w: 6, h: 4 },
];

/* Default Analytics Layout */
export const DEFAULT_ANALYTICS_LAYOUT: LayoutItem[] = [
  { widgetId: 'pnl-status',           col: 0,  row: 0,  w: 2, h: 2 },
  { widgetId: 'winrate',              col: 2,  row: 0,  w: 2, h: 2 },
  { widgetId: 'sharpe-ratio',         col: 4,  row: 0,  w: 2, h: 2 },
  { widgetId: 'profit-factor',        col: 6,  row: 0,  w: 2, h: 2 },
  { widgetId: 'equity-drawdown',      col: 8,  row: 0,  w: 2, h: 2 },
  { widgetId: 'total-trades',         col: 10, row: 0,  w: 2, h: 2 },

  { widgetId: 'cumulative-pnl',       col: 0,  row: 2,  w: 6, h: 6 },
  { widgetId: 'drawdown-daily',       col: 6,  row: 2,  w: 4, h: 4 },
  { widgetId: 'novatrix-score',       col: 10, row: 2,  w: 2, h: 2 },
  { widgetId: 'session-timer',        col: 10, row: 4,  w: 2, h: 2 },

  { widgetId: 'drawdown-session',     col: 6,  row: 6,  w: 4, h: 4 },

  { widgetId: 'mistake-losses',       col: 0,  row: 8,  w: 4, h: 4 },
  { widgetId: 'playbook-efficiency',  col: 4,  row: 8,  w: 4, h: 4 },
  { widgetId: 'scatter-plot',         col: 10, row: 6,  w: 4, h: 6 },

  { widgetId: 'psych-energy',         col: 0,  row: 12, w: 4, h: 6 },
  { widgetId: 'performance-radar',    col: 4,  row: 12, w: 4, h: 6 },
  { widgetId: 'asset-performance',    col: 8,  row: 12, w: 4, h: 4 },

  { widgetId: 'trading-sessions',     col: 0,  row: 18, w: 4, h: 4 },
  { widgetId: 'trading-calendar',     col: 4,  row: 18, w: 6, h: 10 },
  { widgetId: 'temporal-heatmap',     col: 0,  row: 22, w: 6, h: 4 },
];
