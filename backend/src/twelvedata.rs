use crate::models::LiveTick;
use anyhow::{Context, Result};
use reqwest::Client;
use std::env;
use tokio::sync::broadcast;
use tracing::info;

// --- CONFIGURATION ---
const MAX_KEYS: usize = 8;

pub struct TwelveDataManager {
    keys: Vec<String>,
    current_key_idx: std::sync::atomic::AtomicUsize,
}

impl TwelveDataManager {
    pub fn new() -> Self {
        let mut keys = Vec::new();
        // Try to load up to 8 keys: TWELVE_DATA_API_KEY_1 to _8, or fallback to TWELVE_DATA_API_KEY
        for i in 1..=MAX_KEYS {
            if let Ok(key) = env::var(format!("TWELVE_DATA_API_KEY_{}", i)) {
                if !key.is_empty() { keys.push(key); }
            }
        }
        
        if keys.is_empty() {
            if let Ok(key) = env::var("TWELVE_DATA_API_KEY") {
                if !key.is_empty() { keys.push(key); }
            }
        }

        TwelveDataManager {
            keys,
            current_key_idx: std::sync::atomic::AtomicUsize::new(0),
        }
    }

    pub fn get_key(&self) -> Option<String> {
        if self.keys.is_empty() { return None; }
        let idx = self.current_key_idx.fetch_add(1, std::sync::atomic::Ordering::SeqCst) % self.keys.len();
        Some(self.keys[idx].clone())
    }
}

lazy_static::lazy_static! {
    pub static ref MANAGER: TwelveDataManager = TwelveDataManager::new();
}

pub async fn fetch_twelvedata_quotes(symbols: &[&str]) -> Result<Vec<LiveTick>> {
    let api_key = MANAGER.get_key().context("No TwelveData API keys available")?;
    let symbols_str = symbols.join(",");
    let url = format!(
        "https://api.twelvedata.com/quote?symbol={}&apikey={}",
        symbols_str, api_key
    );

    let client = Client::new();
    let resp = client
        .get(&url)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    let mut results = Vec::new();

    if symbols.len() == 1 {
        if let Ok(tick) = parse_quote_value(&resp) {
            results.push(tick);
        }
    } else if let Some(obj) = resp.as_object() {
        for symbol in symbols {
            if let Some(val) = obj.get(*symbol) {
                if let Ok(tick) = parse_quote_value(val) {
                    results.push(tick);
                }
            }
        }
    }

    Ok(results)
}

fn parse_quote_value(val: &serde_json::Value) -> Result<LiveTick> {
    let symbol = val["symbol"]
        .as_str()
        .context("Missing symbol")?
        .to_string();
    let price_str = val["close"]
        .as_str()
        .or(val["price"].as_str())
        .context("Missing price")?;
    let price = price_str.parse::<f64>()?;
    let time = val["timestamp"]
        .as_i64()
        .map(|t| t.to_string())
        .unwrap_or_default();

    Ok(LiveTick {
        symbol,
        bid: price,
        ask: price,
        time,
    })
}

pub async fn fetch_historical_data(symbol: &str, interval: &str, outputsize: u32) -> Result<Vec<serde_json::Value>> {
    let api_key = MANAGER.get_key().context("No TwelveData API keys available")?;
    
    let api_symbol = if symbol.len() == 6 && !symbol.contains("/") {
        format!("{}/{}", &symbol[0..3], &symbol[3..6])
    } else {
        symbol.to_string()
    };

    let url = format!(
        "https://api.twelvedata.com/time_series?symbol={}&interval={}&outputsize={}&apikey={}",
        api_symbol, interval, outputsize, api_key
    );

    let client = Client::new();
    let resp = client.get(&url).send().await?.json::<serde_json::Value>().await?;

    if let Some(values) = resp["values"].as_array() {
        let mut history = values.clone();
        history.reverse();
        Ok(history)
    } else {
        Err(anyhow::anyhow!("TwelveData Error: {:?}", resp["message"]))
    }
}

// --- REAL-TIME SYNC ENGINE REMOVED ---
// Repurposed TwelveData for high-value historical/macro data only to respect 800/day limit.

pub async fn start_market_sync(_mt5_tx: broadcast::Sender<String>) {
    info!("[twelvedata_sync] Repurposed TwelveData for Historical/Macro only. Live feed handled by High-Limit mirrors.");
    // No-op for live sync to save API credits
}
