use futures_util::{sink::SinkExt, StreamExt};
use serde_json::json;
use tokio::sync::broadcast;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tracing::{error, info, warn};
use std::env;
use std::time::Duration;

pub async fn start_finnhub_sync(mt5_tx: broadcast::Sender<String>) {
    let api_key = env::var("FINNHUB_API_KEY").unwrap_or_else(|_| "cvbf091r01qg8un6kq00cvbf091r01qg8un6kq0g".into());
    let url = format!("wss://ws.finnhub.io?token={}", api_key);

    info!("[finnhub] Connecting to WebSocket...");

    loop {
        match connect_async(&url).await {
            Ok((mut ws_stream, _)) => {
                info!("[finnhub] Connected");

                // Subscribe to major assets
                let symbols = vec![
                    "OANDA:EUR_USD", "OANDA:GBP_USD", "OANDA:USD_JPY", "OANDA:USD_CAD",
                    "BINANCE:BTCUSDT", "BINANCE:ETHUSDT",
                    "AAPL", "TSLA", "NVDA"
                ];

                for sym in symbols {
                    let msg = json!({ "type": "subscribe", "symbol": sym }).to_string();
                    let _ = ws_stream.send(Message::Text(msg.into())).await;
                }

                while let Some(msg) = ws_stream.next().await {
                    if let Ok(Message::Text(text)) = msg {
                        if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                            if data["type"] == "trade" {
                                if let Some(trades) = data["data"].as_array() {
                                    for trade in trades {
                                        let sym = trade["s"].as_str().unwrap_or("");
                                        let price = trade["p"].as_f64().unwrap_or(0.0);
                                        
                                        // Normalize symbol for frontend
                                        let clean_sym = sym
                                            .replace("OANDA:", "")
                                            .replace("_", "")
                                            .replace("BINANCE:", "")
                                            .replace("USDT", "USD");

                                        let payload = json!({
                                            "msg_type": "MARKET_TICK",
                                            "payload": {
                                                "symbol": clean_sym,
                                                "price": price
                                            }
                                        });

                                        if let Ok(json_str) = serde_json::to_string(&payload) {
                                            let _ = mt5_tx.send(json_str);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error!("[finnhub] Connection error: {}. Retrying...", e);
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        }
    }
}
