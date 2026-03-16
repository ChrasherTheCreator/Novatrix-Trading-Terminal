use futures_util::{sink::SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::sync::broadcast;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tracing::info;
use std::env;
use std::time::Duration;
use reqwest::Client;
use anyhow::Result;

pub async fn fetch_yahoo_history(symbol: &str, interval: &str, limit: u32) -> Result<Vec<serde_json::Value>> {
    let client = Client::new();
    
    // Normalize symbols for Yahoo
    let y_sym = match symbol {
        "XAUUSD" => "GC=F".to_string(),
        "XAGUSD" => "SI=F".to_string(),
        "XPTUSD" => "PL=F".to_string(),
        "XPDUSD" => "PA=F".to_string(),
        "OIL" => "CL=F".to_string(),
        "BRENT" => "BZ=F".to_string(),
        "US500" => "^GSPC".to_string(),
        "US100" => "^IXIC".to_string(),
        "GER40" => "^GDAXI".to_string(),
        "US30" => "^DJI".to_string(),
        "UK100" => "^FTSE".to_string(),
        "JAP225" => "^N225".to_string(),
        "AUS200" => "^AXJO".to_string(),
        s if s.len() == 6 => format!("{}=X", s), // Forex
        s => s.to_string()
    };

    // Optimize range for interval
    let (y_interval, range) = match interval {
        "1min" => ("1m", "1d"),
        "5min" => ("5m", "5d"),
        "15min" => ("15m", "5d"),
        "1h" => ("1h", "1mo"),
        "4h" => ("1h", "3mo"),
        "1day" => ("1d", "1y"),
        "1week" => ("1wk", "2y"),
        _ => ("1m", "1d")
    };

    let url = format!("https://query1.finance.yahoo.com/v8/finance/chart/{}?interval={}&range={}", y_sym, y_interval, range);
    
    match client.get(&url).header("User-Agent", "Mozilla/5.0").send().await {
        Ok(resp) => {
            let json = resp.json::<serde_json::Value>().await?;
            let mut results = Vec::new();
            if let Some(result) = json["chart"]["result"][0].as_object() {
                if let (Some(timestamps), Some(indicators)) = (result.get("timestamp").and_then(|v| v.as_array()), result.get("indicators").and_then(|v| v["quote"][0].as_object())) {
                    let closes = indicators.get("close").and_then(|v| v.as_array()).ok_or_else(|| anyhow::anyhow!("No closes for {}", symbol))?;
                    let opens = indicators.get("open").and_then(|v| v.as_array()).ok_or_else(|| anyhow::anyhow!("No opens for {}", symbol))?;

                    let start_idx = if timestamps.len() > limit as usize { timestamps.len() - limit as usize } else { 0 };

                    for i in start_idx..timestamps.len() {
                        let close = closes[i].as_f64().unwrap_or(0.0);
                        let open = opens[i].as_f64().unwrap_or(close);
                        if close == 0.0 { continue; }
                        
                        results.push(json!({
                            "time": timestamps[i].as_i64().unwrap_or(0).to_string(),
                            "price": close,
                            "change": if open != 0.0 { (close - open) / open * 100.0 } else { 0.0 }
                        }));
                    }
                    info!("[yahoo_history] Fetched {} bars for {} (interval: {})", results.len(), symbol, y_interval);
                }
            }
            Ok(results)
        },
        Err(e) => {
            info!("[yahoo_history] HTTP error fetching {}: {}", symbol, e);
            Err(e.into())
        }
    }
}

pub async fn start_market_mirror(mt5_tx: broadcast::Sender<String>) {
    info!("[market_mirror] Starting High-Precision TradingView-Mirror (OANDA + Binance + Yahoo)");
    
    // 1. OANDA & Stocks Feed via Finnhub WebSocket (High Limit, covers Forex and Gold/Silver)
    let mt5_tx_fh = mt5_tx.clone();
    tokio::spawn(async move {
        let api_key = env::var("FINNHUB_API_KEY").unwrap_or_else(|_| "cvbf091r01qg8un6kq00cvbf091r01qg8un6kq0g".into());
        let url = format!("wss://ws.finnhub.io?token={}", api_key);
        
        loop {
            if let Ok((mut ws_stream, _)) = connect_async(&url).await {
                let symbols = vec![
                    // Majors
                    "OANDA:XAU_USD", "OANDA:EUR_USD", "OANDA:GBP_USD", "OANDA:USD_JPY",
                    "OANDA:AUD_USD", "OANDA:USD_CHF", "OANDA:NZD_USD", "OANDA:USD_CAD",
                    // Minors
                    "OANDA:EUR_GBP", "OANDA:EUR_JPY", "OANDA:EUR_CHF", "OANDA:EUR_CAD", "OANDA:EUR_NZD", "OANDA:EUR_AUD",
                    "OANDA:GBP_CHF", "OANDA:GBP_JPY", "OANDA:GBP_AUD", "OANDA:GBP_CAD",
                    "OANDA:CHF_JPY", "OANDA:NZD_JPY", "OANDA:AUD_JPY", "OANDA:CAD_JPY",
                    // Commodities
                    "OANDA:XAG_USD", "OANDA:XPT_USD", "OANDA:XPD_USD",
                    // Stocks
                    "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOG"
                ];
                for sym in symbols {
                    let subscribe_msg = json!({ "type": "subscribe", "symbol": sym }).to_string();
                    let _ = ws_stream.send(Message::Text(subscribe_msg.into())).await;
                }

                while let Some(msg) = ws_stream.next().await {
                    if let Ok(Message::Text(text)) = msg {
                        if let Ok(data) = serde_json::from_str::<Value>(&text) {
                            if data["type"] == "trade" {
                                if let Some(trades) = data["data"].as_array() {
                                    for t in trades {
                                        let raw_sym = t["s"].as_str().unwrap_or("");
                                        let price = t["p"].as_f64().unwrap_or(0.0);
                                        
                                        let clean_sym = raw_sym
                                            .replace("OANDA:", "")
                                            .replace("_", "");

                                        let _ = mt5_tx_fh.send(json!({
                                            "msg_type": "MARKET_TICK",
                                            "payload": { "symbol": clean_sym, "price": price }
                                        }).to_string());
                                    }
                                }
                            }
                        }
                    }
                }
            }
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    });

    // 2. High-Speed Yahoo Mirror for Indices (Free, high-frequency polling)
    let mt5_tx_indices = mt5_tx.clone();
    tokio::spawn(async move {
        let client = Client::new();
        let symbols = vec![
            ("^GSPC", "US500"), ("^IXIC", "US100"), ("^GDAXI", "GER40"), ("^DJI", "US30"),
            ("^FTSE", "UK100"), ("^N225", "JAP225"), ("^AXJO", "AUS200")
        ];
        loop {
            for (y_sym, f_sym) in &symbols {
                let url = format!("https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1m&range=1d", y_sym);
                if let Ok(resp) = client.get(&url).header("User-Agent", "Mozilla/5.0").send().await {
                    if let Ok(json) = resp.json::<Value>().await {
                        if let Some(price) = json["chart"]["result"][0]["meta"]["regularMarketPrice"].as_f64() {
                            let _ = mt5_tx_indices.send(json!({
                                "msg_type": "MARKET_TICK",
                                "payload": { "symbol": *f_sym, "price": price }
                            }).to_string());
                        }
                    }
                }
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}
