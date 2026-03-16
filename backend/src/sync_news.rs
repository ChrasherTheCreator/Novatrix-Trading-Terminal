use reqwest::Client;
use serde_json::Value;
use sqlx::SqlitePool;
use std::env;
use tokio::sync::broadcast;
use tracing::{error, info};

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::db;

pub async fn start_news_sync(
    pool: SqlitePool,
    mt5_tx: broadcast::Sender<String>,
    cache: Arc<RwLock<HashMap<String, String>>>,
) {
    info!("[sync_news] Starting Database-Persistent Market News Poller");
    let client = Client::new();

    loop {
        let mut status = "OFFLINE";
        let mut new_news_fetched = vec![];

        // 1. Fetch fresh data from API
        if let Ok(api_key) = env::var("STOCKDATA_API_KEY") {
            if !api_key.is_empty() {
                let url = format!(
                    "https://api.stockdata.org/v1/news/all?api_token={}&limit=100&language=en", 
                    api_key
                );
                
                match client.get(&url).send().await {
                    Ok(resp) => {
                        if resp.status().is_success() {
                            if let Ok(data) = resp.json::<Value>().await {
                                if let Some(data_array) = data.get("data").and_then(|v| v.as_array()) {
                                    new_news_fetched = data_array.clone();
                                    status = "LIVE";
                                    info!("[sync_news] Fetched {} news items from API", new_news_fetched.len());
                                }
                            }
                        } else {
                            error!("[sync_news] API Error: {}", resp.status());
                            status = "API_ERROR";
                        }
                    }
                    Err(e) => {
                        error!("[sync_news] Connection error: {}", e);
                        status = "CONNECTION_FAILED";
                    }
                }
            } else {
                status = "MISSING_KEY";
            }
        }

        // 2. Save new items to Database (Deduplication happens in SQL via INSERT OR IGNORE)
        for news_item in new_news_fetched {
            if let Err(e) = db::save_news_item(&pool, &news_item).await {
                error!("[sync_news] Failed to save news item: {}", e);
            }
        }

        // 3. Cleanup items older than 24h
        if let Err(e) = db::cleanup_old_news(&pool).await {
            error!("[sync_news] Failed to cleanup old news: {}", e);
        }

        // 4. Load ALL relevant news from Database
        match db::get_recent_news(&pool).await {
            Ok(all_news) => {
                let full_msg = serde_json::json!({
                    "msg_type": "MARKET_NEWS",
                    "status": status,
                    "payload": all_news
                });

                if let Ok(json_str) = serde_json::to_string(&full_msg) {
                    // Update Cache for immediate startup delivery
                    let mut c = cache.write().await;
                    c.insert("NEWS".to_string(), json_str.clone());
                    
                    // Broadcast to all connected WebSockets
                    let _ = mt5_tx.send(json_str);
                    info!("[sync_news] Broadcasted {} persistent news items from DB", all_news.len());
                }
            }
            Err(e) => error!("[sync_news] Failed to load news from DB: {}", e),
        }

        // Poll every 15 minutes
        tokio::time::sleep(tokio::time::Duration::from_secs(900)).await;
    }
}
