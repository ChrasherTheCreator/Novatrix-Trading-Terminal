use crate::{
    db,
    models::{EconomicEvent, FfCalendarEntry, TwelveDataResponse, FmpEconomicEvent},
};
use anyhow::Result;
use chrono::{Duration as ChronoDuration, NaiveDateTime, TimeZone, Utc};
use reqwest::Client;
use sqlx::SqlitePool;
use std::env;
use std::time::Duration;
use tokio::sync::broadcast;
use tracing::{info, warn};

const NORMAL_INTERVAL_SECS: u64 = 600; // 10 minutes

pub async fn start_sync(pool: SqlitePool, tx: broadcast::Sender<String>) {
    info!("[calendar_sync] Background sync starting...");

    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(15))
        .build()
        .expect("Failed to build reqwest client");

    tokio::time::sleep(Duration::from_secs(2)).await;

    loop {
        match sync_iteration(&client, &pool, &tx).await {
            Ok(_) => info!("[calendar_sync] Economic data updated"),
            Err(e) => warn!("[calendar_sync] Sync error: {e}"),
        }
        tokio::time::sleep(Duration::from_secs(NORMAL_INTERVAL_SECS)).await;
    }
}

async fn sync_iteration(
    client: &Client,
    pool: &SqlitePool,
    tx: &broadcast::Sender<String>,
) -> Result<()> {
    let mut all_events = Vec::new();

    // 1. FMP - Primary source for accurate live data (7 days)
    if let Ok(key) = env::var("FMP_API_KEY") {
        if !key.is_empty() {
            if let Ok(events) = fetch_fmp_calendar(client, &key).await {
                all_events.extend(events);
            }
        }
    }

    // 2. Twelve Data - Secondary source
    if let Ok(key) = env::var("TWELVE_DATA_API_KEY") {
        if !key.is_empty() {
            if let Ok(events) = fetch_twelvedata_macro(client, &key).await {
                all_events.extend(events);
            }
        }
    }

    // 3. ForexFactory Legacy Fallback
    if let Ok(events) = fetch_forexfactory_legacy(client).await {
        all_events.extend(events);
    }

    if !all_events.is_empty() {
        db::upsert_economic_events(pool, &all_events).await?;
        notify_broadcast(tx, &all_events);
    }

    Ok(())
}

async fn fetch_fmp_calendar(client: &Client, key: &str) -> Result<Vec<EconomicEvent>> {
    let now = Utc::now();
    let from = (now - ChronoDuration::days(1)).format("%Y-%m-%d");
    let to = (now + ChronoDuration::days(7)).format("%Y-%m-%d");
    let url = format!("https://financialmodelingprep.com/api/v3/economic_calendar?from={}&to={}&apikey={}", from, to, key);
    
    let resp = client.get(&url).send().await?;
    let raw: Vec<FmpEconomicEvent> = resp.json().await?;
    
    let events = raw.into_iter().map(|e| {
        let event_time = match NaiveDateTime::parse_from_str(&e.date, "%Y-%m-%d %H:%M:%S") {
            Ok(ndt) => Utc.from_utc_datetime(&ndt).to_rfc3339(),
            Err(_) => e.date.clone(),
        };

        EconomicEvent {
            id: format!("fmp-{}", uuid::Uuid::new_v4()),
            event_time,
            currency: e.currency,
            impact: match e.impact.to_lowercase().as_str() {
                "high" => "High",
                "medium" => "Medium",
                _ => "Low"
            }.to_string(),
            title: e.event,
            actual: e.actual.map(|v| v.to_string()),
            forecast: e.estimate.map(|v| v.to_string()),
            estimate: e.estimate.map(|v| v.to_string()),
            previous: e.previous.map(|v| v.to_string()),
            unit: None,
            country: Some(e.country),
        }
    }).collect();

    Ok(events)
}

async fn fetch_twelvedata_macro(client: &Client, key: &str) -> Result<Vec<EconomicEvent>> {
    // Note: The public Twelve Data economic_calendar endpoint often only returns today's data without parameters
    let url = format!("https://api.twelvedata.com/economic_calendar?apikey={}", key);
    let resp = client.get(&url).send().await?;
    let data: TwelveDataResponse = resp.json().await?;
    
    let events = data.data.into_iter().map(|e| {
        let time_str = e.time.unwrap_or_else(|| "00:00:00".to_string());
        let event_time = format!("{}T{}Z", e.date, time_str);

        EconomicEvent {
            id: format!("tw-{}", uuid::Uuid::new_v4()),
            event_time,
            currency: match e.country.as_str() {
                "United States" => "USD",
                "United Kingdom" => "GBP",
                "Euro Area" => "EUR",
                "Japan" => "JPY",
                "Canada" => "CAD",
                "Australia" => "AUD",
                _ => "USD"
            }.to_string(),
            impact: match e.impact.to_lowercase().as_str() {
                "high" => "High",
                "medium" => "Medium",
                _ => "Low"
            }.to_string(),
            title: e.indicator,
            actual: e.actual,
            forecast: e.forecast.clone(),
            estimate: e.forecast,
            previous: e.previous,
            unit: None,
            country: Some(e.country),
        }
    }).collect();

    Ok(events)
}

async fn fetch_forexfactory_legacy(client: &Client) -> Result<Vec<EconomicEvent>> {
    let url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
    let resp = client.get(url).header("Referer", "https://www.forexfactory.com/").send().await?;
    let raw: Vec<FfCalendarEntry> = resp.json().await?;
    
    let events = raw.into_iter().map(|e| {
        let event_time = match NaiveDateTime::parse_from_str(&e.date, "%Y-%m-%dT%H:%M:%S") {
            Ok(ndt) => Utc.from_utc_datetime(&ndt).to_rfc3339(),
            Err(_) => e.date.clone(),
        };

        EconomicEvent {
            id: format!("ff-{}", e.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string())),
            event_time,
            currency: e.country.clone(),
            impact: match e.impact.to_lowercase().as_str() {
                "high" => "High",
                "medium" => "Medium",
                _ => "Low"
            }.to_string(),
            title: e.title,
            actual: None,
            forecast: Some(e.forecast.clone()),
            estimate: Some(e.forecast),
            previous: Some(e.previous),
            unit: None,
            country: Some(e.country),
        }
    }).collect();

    Ok(events)
}

fn notify_broadcast(tx: &broadcast::Sender<String>, events: &[EconomicEvent]) {
    for evt in events {
        let _ = tx.send(serde_json::json!({ "msg_type": "ECONOMIC_UPDATE", "payload": evt }).to_string());
    }
}
