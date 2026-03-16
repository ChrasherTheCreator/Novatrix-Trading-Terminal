use futures_util::StreamExt;
use serde_json::Value;
use tokio::sync::broadcast;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{error, info, warn};
use std::time::Duration;

use tokio_tungstenite::tungstenite::client::IntoClientRequest;

const BINANCE_WS_URL: &str =
    "wss://stream.binance.com:9443/ws/btcusdt@trade/ethusdt@trade/solusdt@trade/dogeusdt@trade/xrpusdt@trade/adausdt@trade/bnbusdt@trade/ltcusdt@trade/linkusdt@trade/dotusdt@trade/maticusdt@trade/uniusdt@trade/shibusdt@trade/trxusdt@trade/avaxusdt@trade";

pub async fn start_crypto_stream(mt5_tx: broadcast::Sender<String>) {
    info!("[crypto_sync] Connecting to Binance WebSocket...");

    loop {
        let request = match BINANCE_WS_URL.into_client_request() {
            Ok(req) => req,
            Err(e) => {
                error!("[crypto_sync] Invalid URL: {}", e);
                tokio::time::sleep(Duration::from_secs(10)).await;
                continue;
            }
        };

        let mut request = request;
        if let Ok(ua) = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36".parse() {
            request.headers_mut().insert("User-Agent", ua);
        }

        match connect_async(request).await {
            Ok((mut ws_stream, _)) => {
                info!("[crypto_sync] Connected to Binance WebSocket");

                while let Some(msg) = ws_stream.next().await {
                    match msg {
                        Ok(Message::Text(text)) => {
                            if let Ok(data) = serde_json::from_str::<Value>(&text) {
                                if let (Some(s), Some(p)) = (
                                    data.get("s").and_then(|v| v.as_str()),
                                    data.get("p").and_then(|v| v.as_str()),
                                ) {
                                    let asset = match s {
                                        "BTCUSDT" => "BTCUSD",
                                        "ETHUSDT" => "ETHUSD",
                                        "SOLUSDT" => "SOLUSD",
                                        "DOGEUSDT" => "DOGEUSD",
                                        "XRPUSDT" => "XRPUSD",
                                        "ADAUSDT" => "ADAUSD",
                                        "BNBUSDT" => "BNBUSD",
                                        "LTCUSDT" => "LTCUSD",
                                        "LINKUSDT" => "LINKUSD",
                                        "DOTUSDT" => "DOTUSD",
                                        "MATICUSDT" => "MATICUSD",
                                        "UNIUSDT" => "UNIUSD",
                                        "SHIBUSDT" => "SHIBUSD",
                                        "TRXUSDT" => "TRXUSD",
                                        "AVAXUSDT" => "AVAXUSD",
                                        _ => "unknown",
                                    };

                                    if asset != "unknown" {
                                        let payload = serde_json::json!({
                                            "msg_type": "MARKET_TICK",
                                            "payload": {
                                                "symbol": asset,
                                                "price": p.parse::<f64>().unwrap_or(0.0)
                                            }
                                        });

                                        if let Ok(json_str) = serde_json::to_string(&payload) {
                                            let _ = mt5_tx.send(json_str);
                                        }
                                    }
                                }
                            }
                        }
                        Ok(Message::Close(_)) => {
                            warn!("[crypto_sync] Binance WS closed. Reconnecting...");
                            break;
                        }
                        Err(e) => {
                            error!("[crypto_sync] Binance WS error: {}", e);
                            break;
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                error!("[crypto_sync] Failed to connect: {}. Retrying in 10s...", e);
            }
        }
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}
