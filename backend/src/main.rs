mod ai;
mod auth;
mod calendar_sync;
mod crypto_sync;
mod db;
mod engine;
mod market_mirror;
mod models;
mod routes;
mod sync_fundamentals;
mod sync_news;
mod twelvedata;

use axum::http::Method;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use std::str::FromStr;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{filter::EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── Environment ───────────────────────────────────────────────────────────
    dotenvy::dotenv().ok();

    // ── Logging ───────────────────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
        )
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=info,tower_http=debug".into())
        )
        .init();

    // ── Database ──────────────────────────────────────────────────────────────
    let db_path = "./creatix.db";
    let opts =
        SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path))?.create_if_missing(true);
    let pool = SqlitePool::connect_with(opts).await?;
    db::init_db(&pool).await?;
    info!("Database initialised at {}", db_path);

    // ── MT5 Broadcast & Cache ──────────────────────────────────────────────────
    let (mt5_tx, _) = broadcast::channel::<String>(1024); // Increased buffer size
    let live_cache =
        std::sync::Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new()));

    // ── Background Sync Workers ────────────────────────────────────────────────
    tokio::spawn(calendar_sync::start_sync(pool.clone(), mt5_tx.clone()));
    tokio::spawn(crypto_sync::start_crypto_stream(mt5_tx.clone()));
    tokio::spawn(market_mirror::start_market_mirror(mt5_tx.clone()));
    tokio::spawn(sync_news::start_news_sync(
        pool.clone(),
        mt5_tx.clone(),
        live_cache.clone(),
    ));
    tokio::spawn(sync_fundamentals::start_fundamentals_sync(pool.clone()));
    tokio::spawn(twelvedata::start_market_sync(mt5_tx.clone()));
    info!("Market data sync workers spawned");

    // ── Router ────────────────────────────────────────────────────────────────
    let state = routes::AppState {
        pool,
        mt5_tx,
        live_cache,
    };
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    let app = routes::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // ── Start Server ──────────────────────────────────────────────────────────
    let addr = "0.0.0.0:3001";
    info!("Creatix backend listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
