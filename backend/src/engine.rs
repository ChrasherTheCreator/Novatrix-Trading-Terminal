use crate::models::{BacktestRequest, BacktestResult, Candle, Trade};
use anyhow::Result;
use sqlx::SqlitePool;
use uuid::Uuid;

pub fn calculate_position_size(balance: f64, risk_pct: f64, stop_distance: f64) -> f64 {
    if stop_distance <= 0.0 {
        return 0.0;
    }
    let risk_amount = balance * (risk_pct / 100.0);
    (risk_amount / stop_distance).round()
}

pub async fn run_backtest(pool: &SqlitePool, req: BacktestRequest) -> Result<BacktestResult> {
    // 1. Historische Daten laden (Stellt sicher, dass Tabelle historical_data existiert oder leeres result liefert)
    let candles = match sqlx::query_as::<_, Candle>(
        "SELECT * FROM historical_data WHERE symbol = ? AND time BETWEEN ? AND ? ORDER BY time ASC",
    )
    .bind(&req.symbol)
    .bind(&req.start_date)
    .bind(&req.end_date)
    .fetch_all(pool)
    .await
    {
        Ok(c) => c,
        Err(_) => vec![], // Wenn Tabelle nicht existiert, geben wir leere Liste zurück
    };

    let mut current_balance = req.initial_balance;
    let mut equity_curve = vec![current_balance];
    let mut trades = Vec::new();

    // 2. Simulation (Dummy-Logik für Kompilierbarkeit)
    for candle in candles {
        // Beispiel-Bedingung: Immer wenn high > low * 1.01
        if candle.high > candle.low * 1.01 {
            let stop_loss_dist = candle.close * 0.01;
            let lots =
                calculate_position_size(current_balance, req.risk_per_trade_pct, stop_loss_dist);

            let pnl = lots * (candle.high - candle.close);
            current_balance += pnl;
            equity_curve.push(current_balance);

            trades.push(Trade {
                id: Uuid::new_v4().to_string(),
                account_id: String::new(), // synthetic backtest trade – no real account
                symbol: req.symbol.clone(),
                side: "LONG".to_string(),
                entry_price: candle.close,
                entry_time: candle.time.clone(),
                exit_price: Some(candle.high),
                exit_time: Some(candle.time.clone()),
                stop_loss: Some(candle.close - stop_loss_dist),
                take_profit: Some(candle.high),
                lot_size: lots,
                pnl: Some(pnl),
                pnl_pct: Some((pnl / (candle.close * lots)) * 100.0),
                commission: Some(0.0),
                strategy: Some(req.strategy_id.clone()),
                tags: None,
                notes: None,
                emotion: None,
                status: "CLOSED".to_string(),
                created_at: candle.time.clone(),
                updated_at: candle.time.clone(),
                mae: None,
                mfe: None,
                slippage: None,
                risk_amount: Some(current_balance * (req.risk_per_trade_pct / 100.0)),
                r_multiple: Some(pnl / (candle.close * 0.01 * lots)),
                playbook_id: None,
                mistake_tags: None,
                images: None,
            });
        }
    }

    Ok(BacktestResult {
        total_trades: trades.len(),
        final_balance: current_balance,
        win_rate: 0.0,
        max_drawdown: 0.0,
        equity_curve,
        trades,
    })
}
