use crate::twelvedata;
use crate::market_mirror;
use crate::{
    ai, auth, db,
    engine::run_backtest,
    models::{
        AuthResponse, BacktestRequest, CreateDailyJournal, CreatePlaybook, CreatePulse,
        CreateTrade, EconomicEventQuery, LoginRequest, RegisterRequest, UpdateTrade,
    },
};
use axum::extract::ws::{Message, WebSocket};
use axum::{
    extract::{Path, Query, State, WebSocketUpgrade},
    http::{StatusCode, HeaderMap},
    response::{IntoResponse, Json},
    routing::{get, post, put},
    Router,
};
use serde_json::{json, Value};
use sqlx::SqlitePool;
use tokio::sync::broadcast;
use tracing::{error, warn, info};

// ── App State ────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub mt5_tx: broadcast::Sender<String>,
    pub live_cache: std::sync::Arc<tokio::sync::RwLock<std::collections::HashMap<String, String>>>,
}

// ── Router ────────────────────────────────────────────────────────────────────

use tower_http::services::ServeDir;

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/api/auth/register", post(register_handler))
        .route("/api/auth/login", post(login_handler))
        .route("/api/trades", get(list_trades).post(add_trade))
        .route("/api/trades/import", post(import_trades_handler))
        .route("/api/trades/:id", get(get_trade).put(update_trade_handler).delete(del_trade))
        .route("/api/ai/analyze-trade/:id", post(analyze_trade_handler))
        .route("/api/accounts", get(list_accounts))
        .route("/api/playbooks", get(list_playbooks).post(add_playbook))
        .route("/api/playbooks/:id", put(update_playbook_handler).delete(delete_playbook_handler))
        .route("/api/notifications", get(list_notifications))
        .route("/api/notifications/:id/read", post(mark_noti_read_handler))
        .route("/api/calendar/summary/:account_id", get(get_calendar_summary_handler))
        .route("/api/calendar/economic", get(get_economic_calendar_handler))
        .route("/api/market/quotes", get(get_market_quotes_handler))
        .route("/api/market/history/:symbol", get(get_market_history_handler))
        .route("/api/market/news", get(get_market_news_handler))
        // Geändert: Webhook akzeptiert jetzt auch GET für einen schnellen Browser-Test
        .route("/api/webhooks/finnhub", post(finnhub_webhook_handler).get(webhook_test_handler))
        .route("/api/pulses/:account_id", get(get_pulses_handler))
        .route("/api/pulses", post(add_pulse_handler))
        .route("/api/journals/:account_id", get(get_journals_handler))
        .route("/api/journals", post(upsert_journal_handler))
        .route("/api/scores/:account_id", get(get_score_handler))
        .route("/api/reports/mistakes/:id", get(get_mistake_report_handler))
        .route("/api/reports/advanced/:id", get(get_advanced_stats_handler))
        .route("/api/reports/dashboard/:id", get(get_dashboard_stats_handler))
        .route("/api/backtest/run", post(start_backtest))
        .route("/api/health", get(health))
        .route("/ws/mt5", get(mt5_ws_handler))
        .route("/ws/ticks", get(ticks_ws_handler))
        .route("/ws/scale", get(scale_ws_handler))
        // Website-Dateien NUR ausliefern, wenn keine API-Route passt (Fallback)
        .fallback_service(ServeDir::new("../frontend/dist").fallback(ServeDir::new("../frontend/dist/index.html")))
        .with_state(state)
}

async fn webhook_test_handler() -> impl IntoResponse {
    (StatusCode::OK, "Finnhub Webhook Endpoint is ALIVE. Please use POST with X-Finnhub-Secret header for real data.")
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok", "version": "1.0.0" }))
}

// ── Trade Handlers ────────────────────────────────────────────────────────────

async fn list_trades(State(s): State<AppState>, headers: axum::http::HeaderMap) -> impl IntoResponse {
    // Basic JWT check for demonstration
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                if let Err(e) = auth::validate_jwt(token) {
                    return (StatusCode::UNAUTHORIZED, Json(json!({ "error": format!("Invalid token: {}", e) }))).into_response();
                }
            }
        }
    }

    match db::get_all_trades(&s.pool).await {
        Ok(trades) => (StatusCode::OK, Json(json!({ "trades": trades }))).into_response(),
        Err(e) => {
            error!("list_trades error: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
        }
    }
}

async fn get_trade(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::get_trade_by_id(&s.pool, &id).await {
        Ok(Some(t)) => (StatusCode::OK, Json(json!(t))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Trade not found" }))).into_response(),
    }
}

async fn add_trade(State(s): State<AppState>, Json(body): Json<CreateTrade>) -> impl IntoResponse {
    match db::create_trade(&s.pool, body).await {
        Ok(trade) => (StatusCode::CREATED, Json(json!(trade))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_trade_handler(State(s): State<AppState>, Path(id): Path<String>, Json(body): Json<UpdateTrade>) -> impl IntoResponse {
    match db::update_trade(&s.pool, &id, body).await {
        Ok(Some(t)) => (StatusCode::OK, Json(json!(t))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Trade not found" }))).into_response(),
    }
}

async fn del_trade(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::delete_trade(&s.pool, &id).await {
        Ok(true) => (StatusCode::OK, Json(json!({ "deleted": true }))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Trade not found" }))).into_response(),
    }
}

async fn import_trades_handler(State(s): State<AppState>, Json(trades): Json<Vec<CreateTrade>>) -> impl IntoResponse {
    let mut imported = 0;
    for trade in trades {
        if db::create_trade(&s.pool, trade).await.is_ok() {
            imported += 1;
        }
    }
    (StatusCode::OK, Json(json!({ "imported": imported }))).into_response()
}

// ── Account Handlers ──────────────────────────────────────────────────────────

async fn list_accounts(State(s): State<AppState>) -> impl IntoResponse {
    match db::get_all_accounts(&s.pool).await {
        Ok(accounts) => (StatusCode::OK, Json(json!({ "accounts": accounts }))).into_response(),
        Err(e) => {
            error!("list_accounts error: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
        }
    }
}

// ── Auth Handlers ─────────────────────────────────────────────────────────────

async fn register_handler(State(s): State<AppState>, Json(body): Json<RegisterRequest>) -> impl IntoResponse {
    let id = uuid::Uuid::new_v4().to_string();
    let hashed = match auth::hash_password(&body.password) {
        Ok(h) => h,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
    };
    match db::create_user(&s.pool, &id, &body.username, &body.email, &hashed).await {
        Ok(user) => {
            let token = auth::generate_jwt(&user.id).unwrap_or_default();
            (StatusCode::CREATED, Json(AuthResponse { user, token })).into_response()
        }
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn login_handler(State(s): State<AppState>, Json(body): Json<LoginRequest>) -> impl IntoResponse {
    let user = match db::get_user_by_email(&s.pool, &body.email).await {
        Ok(Some(u)) => u,
        _ => return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid credentials" }))).into_response()
    };
    match auth::verify_password(&body.password, &user.password_hash) {
        Ok(true) => {
            let token = auth::generate_jwt(&user.id).unwrap_or_default();
            (StatusCode::OK, Json(AuthResponse { user, token })).into_response()
        }
        _ => (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid credentials" }))).into_response(),
    }
}

// ── Playbook Handlers ─────────────────────────────────────────────────────────

async fn list_playbooks(State(s): State<AppState>) -> impl IntoResponse {
    match db::get_all_playbooks(&s.pool, "default").await {
        Ok(pbs) => (StatusCode::OK, Json(json!({ "playbooks": pbs }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn add_playbook(State(s): State<AppState>, Json(body): Json<CreatePlaybook>) -> impl IntoResponse {
    let rules_json = serde_json::to_string(&body.rules).unwrap_or_default();
    match db::create_playbook(&s.pool, "default", &body.name, body.description, &rules_json, Some(body.min_rr)).await {
        Ok(pb) => (StatusCode::CREATED, Json(pb)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_playbook_handler(State(s): State<AppState>, Path(id): Path<String>, Json(body): Json<Value>) -> impl IntoResponse {
    let name = body["name"].as_str().map(|s| s.to_string());
    let description = body["description"].as_str().map(|s| s.to_string());
    let rules = body["rules"].as_array().map(|a| serde_json::to_string(a).unwrap_or_default());
    let min_rr = body["min_rr"].as_f64();
    match db::update_playbook(&s.pool, &id, name, description, rules, min_rr).await {
        Ok(Some(pb)) => (StatusCode::OK, Json(pb)).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Not found" }))).into_response(),
    }
}

async fn delete_playbook_handler(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::delete_playbook(&s.pool, &id).await {
        Ok(true) => (StatusCode::OK, Json(json!({ "success": true }))).into_response(),
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Not found" }))).into_response(),
    }
}

// ── Analytics Handlers ────────────────────────────────────────────────────────

async fn get_mistake_report_handler(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::get_mistake_report(&s.pool, &id).await {
        Ok(report) => (StatusCode::OK, Json(report)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_advanced_stats_handler(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::get_advanced_stats(&s.pool, &id).await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_dashboard_stats_handler(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::get_dashboard_stats(&s.pool, &id).await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

// ── Pulse / Journal / Score ───────────────────────────────────────────────

async fn get_pulses_handler(State(s): State<AppState>, Path(account_id): Path<String>) -> impl IntoResponse {
    match db::get_pulses(&s.pool, &account_id).await {
        Ok(pulses) => (StatusCode::OK, Json(json!({ "pulses": pulses }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn add_pulse_handler(State(s): State<AppState>, Json(body): Json<CreatePulse>) -> impl IntoResponse {
    match db::create_pulse(&s.pool, body).await {
        Ok(pulse) => (StatusCode::CREATED, Json(pulse)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_journals_handler(State(s): State<AppState>, Path(account_id): Path<String>) -> impl IntoResponse {
    match db::get_daily_journals(&s.pool, &account_id).await {
        Ok(journals) => (StatusCode::OK, Json(json!({ "journals": journals }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn upsert_journal_handler(State(s): State<AppState>, Json(body): Json<CreateDailyJournal>) -> impl IntoResponse {
    match db::upsert_daily_journal(&s.pool, body).await {
        Ok(journal) => (StatusCode::OK, Json(journal)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_score_handler(State(s): State<AppState>, Path(account_id): Path<String>) -> impl IntoResponse {
    match db::get_latest_score(&s.pool, &account_id).await {
        Ok(score) => (StatusCode::OK, Json(score)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

// ── Calendar Handlers ───────────────────────────────────────────────────────

pub async fn get_calendar_summary_handler(State(s): State<AppState>, Path(account_id): Path<String>) -> impl IntoResponse {
    match db::get_calendar_summary(&s.pool, &account_id).await {
        Ok(summary) => (StatusCode::OK, Json(summary)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_economic_calendar_handler(State(s): State<AppState>, Query(params): Query<EconomicEventQuery>) -> impl IntoResponse {
    match db::get_economic_events(&s.pool, &params).await {
        Ok(events) => (StatusCode::OK, Json(json!({ "events": events }))).into_response(),
        Err(e) => {
            error!("get_economic_calendar_handler error: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
        }
    }
}

async fn get_market_quotes_handler() -> impl IntoResponse {
    match twelvedata::fetch_twelvedata_quotes(&["DXY", "VIX"]).await {
        Ok(quotes) => (StatusCode::OK, Json(json!({ "quotes": quotes }))).into_response(),
        Err(e) => {
            error!("get_market_quotes_handler error: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
        }
    }
}

async fn list_notifications(State(s): State<AppState>) -> impl IntoResponse {
    match db::get_notifications(&s.pool, "default").await {
        Ok(notis) => (StatusCode::OK, Json(notis)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn mark_noti_read_handler(State(s): State<AppState>, Path(id): Path<String>) -> impl IntoResponse {
    match db::mark_notification_read(&s.pool, &id).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

// ── WebSocket Handlers ─────────────────────────────────────────────────────

async fn mt5_ws_handler(ws: WebSocketUpgrade, State(s): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_mt5_socket(socket, s))
}

async fn handle_mt5_socket(mut socket: WebSocket, state: AppState) {
    while let Some(Ok(Message::Text(text))) = socket.recv().await {
        let _ = state.mt5_tx.send(text);
    }
}

async fn ticks_ws_handler(ws: WebSocketUpgrade, State(s): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ticks_socket(socket, s))
}

async fn handle_ticks_socket(mut socket: WebSocket, state: AppState) {
    let mut rx = state.mt5_tx.subscribe();
    loop {
        tokio::select! {
            msg = rx.recv() => {
                if let Ok(msg) = msg {
                   if socket.send(Message::Text(msg.into())).await.is_err() { break; }
                }
            },
            res = socket.recv() => {
                match res {
                    Some(Ok(_)) => {},
                    _ => break,
                }
            }
        }
    }
}

async fn scale_ws_handler(ws: WebSocketUpgrade, State(s): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_scale_socket(socket, s))
}

async fn handle_scale_socket(mut socket: WebSocket, _state: AppState) {
    while let Some(Ok(_)) = socket.recv().await {
        // Placeholder
    }
}

// ── Backtest Handlers ──────────────────────────────────────────────────────

async fn start_backtest(State(s): State<AppState>, Json(payload): Json<BacktestRequest>) -> impl IntoResponse {
    match run_backtest(&s.pool, payload).await {
        Ok(result) => (StatusCode::OK, Json(json!(result))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
    }
}

// ── AI Handlers ───────────────────────────────────────────────────────────────

async fn analyze_trade_handler(State(s): State<AppState>, Path(id): Path<String>, Json(body): Json<ai::AIAnalysisRequest>) -> impl IntoResponse {
    match db::get_trade_by_id(&s.pool, &id).await {
        Ok(Some(trade)) => {
            let trade_val = serde_json::to_value(trade).unwrap_or_default();
            match ai::analyze_trade_data(trade_val, &body.prompt_type).await {
                Ok(analysis) => (StatusCode::OK, Json(analysis)).into_response(),
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response(),
            }
        }
        _ => (StatusCode::NOT_FOUND, Json(json!({ "error": "Trade not found" }))).into_response(),
    }
}

// ── Market History Handler ──────────────────────────────────────────────────

#[derive(Debug, serde::Deserialize)]
struct HistoryQuery {
    interval: Option<String>,
    limit: Option<u32>,
}

async fn get_market_history_handler(Path(symbol): Path<String>, Query(query): Query<HistoryQuery>) -> impl IntoResponse {
    let interval = query.interval.unwrap_or_else(|| "1day".to_string());
    let limit = query.limit.unwrap_or(100);

    // 1. Try TwelveData first (as requested)
    match twelvedata::fetch_historical_data(&symbol, &interval, limit).await {
        Ok(history) => {
            let normalized: Vec<Value> = history.iter().map(|v| {
                let close = v["close"].as_str().and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
                let open = v["open"].as_str().and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
                json!({
                    "time": v["datetime"],
                    "price": close,
                    "change": if open != 0.0 { (close - open) / open * 100.0 } else { 0.0 }
                })
            }).collect();
            (StatusCode::OK, Json(json!({ "symbol": symbol, "history": normalized }))).into_response()
        },
        Err(_) => {
            // 2. Fallback to Yahoo Finance (Fast, Free, High Limits)
            match market_mirror::fetch_yahoo_history(&symbol, &interval, limit).await {
                Ok(history) => {
                    (StatusCode::OK, Json(json!({ "symbol": symbol, "history": history }))).into_response()
                },
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
            }
        }
    }
}

async fn get_market_news_handler(State(s): State<AppState>) -> impl IntoResponse {
    // ... (existing code)
    match db::get_recent_news(&s.pool).await {
        Ok(news) => (StatusCode::OK, Json(json!({ 
            "msg_type": "MARKET_NEWS", 
            "status": "LIVE", 
            "payload": news 
        }))).into_response(),
        Err(_) => (StatusCode::OK, Json(json!({ "msg_type": "MARKET_NEWS", "payload": [] }))).into_response()
    }
}

use axum::body::Bytes;

async fn finnhub_webhook_handler(
    State(s): State<AppState>,
    headers: HeaderMap,
    body: Bytes
) -> impl IntoResponse {
    // DEBUG: Alle Header im Terminal anzeigen
    info!("--- Incoming Finnhub Webhook ---");
    for (name, value) in headers.iter() {
        info!("Header: {}: {:?}", name, value);
    }

    // 1. Authentifizierung prüfen
    let expected_secret = std::env::var("FINNHUB_WEBHOOK_SECRET").unwrap_or_else(|_| "d6f1cb9r01qvn4o1f8dg".into());
    
    let received_secret = headers
        .get("x-finnhub-secret") // Klein geschrieben, da HeaderMap normalisiert
        .or_else(|| headers.get("X-Finnhub-Secret"))
        .and_then(|h| h.to_str().ok());

    info!("Expected Secret: {}", expected_secret);
    info!("Received Secret: {:?}", received_secret);

    let authenticated = received_secret.map(|s| s == expected_secret).unwrap_or(false);

    if !authenticated {
        warn!("AUTH FAILED: Secret mismatch or missing");
        return StatusCode::UNAUTHORIZED.into_response();
    }

    info!("AUTH SUCCESS: Processing payload...");

    // 2. Body verarbeiten
    if body.is_empty() {
        info!("PING RECEIVED: Finnhub Test successful");
        return StatusCode::OK.into_response();
    }

    if let Ok(payload) = serde_json::from_slice::<Value>(&body) {
        tokio::spawn(async move {
            let broadcast_msg = json!({
                "msg_type": "FINNHUB_WEBHOOK",
                "payload": payload
            });
            let _ = s.mt5_tx.send(serde_json::to_string(&broadcast_msg).unwrap_or_default());
        });
    }

    StatusCode::OK.into_response()
}
