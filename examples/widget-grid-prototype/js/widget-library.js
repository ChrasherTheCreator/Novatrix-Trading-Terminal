/* ============================================================
   WIDGET REGISTRY – All 20 Trading Widgets
   ============================================================ */

const WIDGET_REGISTRY = [
    // --- Small KPI Cards (User 1x1 -> Grid 2x2) ---
    {
        id: 'pnl-status',
        name: 'P&L Status Display',
        icon: 'show_chart',
        category: 'KPI',
        src: 'widget library/p&l status display.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },
    {
        id: 'profit-factor',
        name: 'Profit Factor',
        icon: 'payments',
        category: 'KPI',
        src: 'widget library/profit factor.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },
    {
        id: 'sharpe-ratio',
        name: 'Sharpe Ratio',
        icon: 'balance',
        category: 'KPI',
        src: 'widget library/sharpe ratio.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },
    {
        id: 'winrate',
        name: 'Win Rate',
        icon: 'percent',
        category: 'KPI',
        src: 'widget library/winrate.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },
    {
        id: 'total-trades',
        name: 'Total Trades',
        icon: 'stacks',
        category: 'KPI',
        src: 'widget library/total trades.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },
    {
        id: 'novatrix-score',
        name: 'Novatrix Score',
        icon: 'shield',
        category: 'KPI',
        src: 'widget library/novatrix score.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'session-timer',
        name: 'Session Timer',
        icon: 'timer',
        category: 'KPI',
        src: 'widget library/session timer.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'equity-drawdown',
        name: 'Equity Protector',
        icon: 'verified_user',
        category: 'KPI',
        src: 'widget library/equity drawdown.html',
        defaultW: 2, defaultH: 2,
        minW: 2, minH: 2,
        maxW: 4, maxH: 3,
        scalable: false
    },

    // --- Medium Cards (User 2x2 -> Grid 4x4) ---
    {
        id: 'performance-radar',
        name: 'Performance Radar',
        icon: 'radar',
        category: 'Analytics',
        src: 'widget library/performance radar.html',
        defaultW: 4, defaultH: 6,
        minW: 4, minH: 6,
        maxW: 4, maxH: 6,
        scalable: false
    },
    {
        id: 'mistake-losses',
        name: 'Mistake Analysis',
        icon: 'error',
        category: 'Analytics',
        src: 'widget library/mistake losses.html',
        defaultW: 4, defaultH: 4,
        minW: 4, minH: 4,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'playbook-efficiency',
        name: 'Playbook Efficiency',
        icon: 'menu_book',
        category: 'Analytics',
        src: 'widget library/playbook rule efficiency.html',
        defaultW: 4, defaultH: 4,
        minW: 4, minH: 4,
        maxW: 4, maxH: 4,
        scalable: false
    },

    // --- Medium-Large Cards (User 2x2 or 2x3) ---
    {
        id: 'asset-performance',
        name: 'Asset Performance',
        icon: 'category',
        category: 'Analytics',
        src: 'widget library/asset performance.html',
        defaultW: 4, defaultH: 4,
        minW: 4, minH: 4,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'scatter-plot',
        name: 'Holding Time Scatter',
        icon: 'timelapse',
        category: 'Charts',
        src: 'widget library/holding time scatter plot.html',
        defaultW: 4, defaultH: 6,
        minW: 4, minH: 6,
        maxW: 4, maxH: 6,
        scalable: false
    },
    {
        id: 'psych-energy',
        name: 'Mental Pulse Chart',
        icon: 'vital_signs',
        category: 'Analytics',
        src: 'widget library/psychological energy level.html',
        defaultW: 4, defaultH: 6,
        minW: 4, minH: 6,
        maxW: 4, maxH: 6,
        scalable: false
    },

    // --- Large Chart Widgets (User 3x3) ---
    {
        id: 'drawdown-daily',
        name: 'Drawdown Graph (Daily)',
        icon: 'trending_down',
        category: 'Charts',
        src: 'widget library/drawdown graph daily.html',
        defaultW: 4, defaultH: 4, // Assume 2x2 user
        minW: 4, minH: 4,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'drawdown-session',
        name: 'Drawdown Graph (Session)',
        icon: 'trending_down',
        category: 'Charts',
        src: 'widget library/drawdown graph session.html',
        defaultW: 4, defaultH: 4, // Assume 2x2 user
        minW: 4, minH: 4,
        maxW: 4, maxH: 4,
        scalable: false
    },
    {
        id: 'cumulative-pnl',
        name: 'Cumulative P&L Graph',
        icon: 'insights',
        category: 'Charts',
        src: 'widget library/cumulative p&l graph 2.html',
        defaultW: 6, defaultH: 6,
        minW: 6, minH: 6,
        maxW: 6, maxH: 6,
        scalable: false
    },

    // --- XL Widgets (User 3x5 or 4x3) ---
    {
        id: 'trading-sessions',
        name: 'Trading Sessions Performance',
        icon: 'schedule',
        category: 'Analytics',
        src: 'widget library/trading sessions performance.html',
        defaultW: 4, defaultH: 4,
        minW: 4, minH: 4,
        maxW: 12, maxH: 4,
        scalable: true
    },
    {
        id: 'trading-calendar',
        name: 'Trading Calendar',
        icon: 'calendar_month',
        category: 'Analytics',
        src: 'widget library/trading calendar dashboard.html',
        defaultW: 6, defaultH: 10,
        minW: 4, minH: 6,
        maxW: 12, maxH: 10,
        scalable: true
    },
    {
        id: 'temporal-heatmap',
        name: 'Temporal P&L Heatmap',
        icon: 'grid_view',
        category: 'Charts',
        src: 'widget library/temporal p&l heatmap.html',
        defaultW: 6, defaultH: 6,
        minW: 6, minH: 6,
        maxW: 6, maxH: 6,
        scalable: false
    }
];

/* Default Layout: Pre-arranged widgets for first load */
const DEFAULT_LAYOUT = [
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
    
    { widgetId: 'mistake-losses',    col: 0,  row: 14, w: 4, h: 4 },
    { widgetId: 'playbook-efficiency',col: 4, row: 14, w: 4, h: 4 },
    { widgetId: 'drawdown-session',  col: 8,  row: 14, w: 4, h: 4 },

    { widgetId: 'psych-energy',      col: 0,  row: 18, w: 4, h: 6 },
    { widgetId: 'scatter-plot',      col: 4,  row: 18, w: 4, h: 6 },

    { widgetId: 'trading-calendar',  col: 0,  row: 24, w: 6, h: 10 },
    { widgetId: 'temporal-heatmap',  col: 6,  row: 24, w: 8, h: 6 }
];

function getWidgetDef(id) {
    return WIDGET_REGISTRY.find(w => w.id === id);
}
