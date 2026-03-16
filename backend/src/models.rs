use serde::{Deserialize, Serialize};

// ── Auth & User Models ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: User,
    pub token: String, // JWT Token
}

// ── Trade Model ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Trade {
    pub id: String,
    pub account_id: String,
    pub symbol: String,
    pub side: String, // "LONG" | "SHORT"
    pub entry_price: f64,
    pub entry_time: String,
    pub exit_price: Option<f64>,
    pub exit_time: Option<String>,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub lot_size: f64,
    pub pnl: Option<f64>,
    pub pnl_pct: Option<f64>,
    pub commission: Option<f64>,
    pub strategy: Option<String>,
    pub tags: Option<String>, // JSON array stored as text
    pub notes: Option<String>,
    pub emotion: Option<String>,
    pub status: String, // "OPEN" | "CLOSED"
    pub created_at: String,
    pub updated_at: String,
    // Professionelle Metriken
    pub mae: Option<f64>, // Maximum Adverse Excursion
    pub mfe: Option<f64>, // Maximum Favorable Excursion
    pub slippage: Option<f64>,
    pub risk_amount: Option<f64>, // Geplantes Risiko in $
    pub r_multiple: Option<f64>,  // Realisiertes R (z.B. 2.5R)
    pub playbook_id: Option<String>,
    pub mistake_tags: Option<String>, // JSON: ["FOMO", "REVENGE"]
    pub images: Option<String>,       // JSON array of URLs
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Playbook {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub rules: String,
    pub min_rr: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaybook {
    pub name: String,
    pub description: Option<String>,
    pub rules: Vec<serde_json::Value>,
    pub min_rr: f64,
}

#[derive(Debug, Serialize, Default, sqlx::FromRow)]
pub struct DashboardStats {
    pub total_trades: i64,
    pub win_rate: Option<f64>,
    pub expectancy: Option<f64>,
    pub total_mistake_cost: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTrade {
    pub account_id: String,
    pub symbol: String,
    pub side: String,
    pub entry_price: f64,
    pub exit_price: Option<f64>,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub lot_size: f64,
    pub risk_amount: Option<f64>,
    pub commission: Option<f64>,
    pub strategy: Option<String>,
    pub playbook_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub mistake_tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub emotion: Option<String>,
    pub images: Option<Vec<String>>,
    pub mae: Option<f64>,
    pub mfe: Option<f64>,
    pub slippage: Option<f64>,
    pub r_multiple: Option<f64>,
    pub created_at: String, // entry_time from client
}

#[derive(Debug, Deserialize)]
pub struct UpdateTrade {
    pub exit_price: Option<f64>,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
    pub pnl: Option<f64>,
    pub pnl_pct: Option<f64>,
    pub strategy: Option<String>,
    pub playbook_id: Option<String>,
    pub notes: Option<String>,
    pub emotion: Option<String>,
    pub status: Option<String>,
    pub exit_time: Option<String>,
    pub images: Option<Vec<String>>,
}

// ── Account Model ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Account {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub account_type: String, // "prop" | "own"
    pub balance: f64,
    pub currency: String,
    pub broker: Option<String>,
    pub max_drawdown: Option<f64>,
    pub created_at: String,
}

// ── MT5 Tick ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveTick {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub time: String,
}

#[derive(Serialize)]
pub struct ScaleUpdate {
    pub trade_id: String,
    pub current_pnl: f64,
    pub current_pnl_percent: f64,
    pub max_pnl_reached: f64,  // Wichtig für Gier-Analyse (MFE)
    pub current_drawdown: f64, // Wichtig für Angst-Analyse (MAE)
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mt5Message {
    pub msg_type: String, // "tick" | "order_update" | "account_info"
    pub payload: serde_json::Value,
}

// ── Backtest ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Candle {
    pub time: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub tick_volume: i64,
}

#[derive(Debug, Deserialize)]
pub struct BacktestRequest {
    pub symbol: String,
    pub start_date: String,
    pub end_date: String,
    pub initial_balance: f64,
    pub strategy_id: String,
    pub risk_per_trade_pct: f64, // z.B. 1.0 für 1%
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BacktestResult {
    pub total_trades: usize,
    pub final_balance: f64,
    pub win_rate: f64,
    pub max_drawdown: f64,
    pub equity_curve: Vec<f64>,
    pub trades: Vec<Trade>,
}

#[derive(Debug, Deserialize)]
pub struct ReplaySession {
    pub symbol: String,
    pub start_time: i64,
    pub speed: i32,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TickData {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub timestamp: i64,
}

// ── Psychology & Discipline (Pulses) ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Pulse {
    pub id: String,
    pub account_id: String,
    pub mental_state: String,
    pub tags: Option<String>,  // JSON: ["ANXIOUS", "CONFIDENT"]
    pub emotional_rating: i32, // 1-10
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePulse {
    pub account_id: String,
    pub mental_state: String,
    pub tags: Option<Vec<String>>,
    pub emotional_rating: i32,
    pub notes: Option<String>,
}

// ── Professional Journaling ───────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct DailyJournal {
    pub id: String,
    pub account_id: String,
    pub date: String,
    pub pre_market: Option<String>,
    pub outlook: Option<String>,
    pub intraday: Option<String>,
    pub post_market: Option<String>,
    pub freeform_content: Option<String>,
    pub journal_type: String, // "STRUCTURED" | "FREEFORM"
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateDailyJournal {
    pub account_id: String,
    pub date: String,
    pub pre_market: Option<String>,
    pub outlook: Option<String>,
    pub intraday: Option<String>,
    pub post_market: Option<String>,
    pub freeform_content: Option<String>,
    pub journal_type: String,
}

// ── Weighted Scoring ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WeightedScore {
    pub id: String,
    pub account_id: String,
    pub date: String,
    pub process_score: f64,     // 50%
    pub performance_score: f64, // 30%
    pub results_score: f64,     // 20%
    pub total_score: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalendarDay {
    pub pnl: f64,
    pub win_rate: f64,
    pub trades: i64,
    pub avg_mae: f64,
    pub avg_mfe: f64,
}

pub type CalendarSummary = std::collections::HashMap<String, CalendarDay>;

// ── Economic Calendar ────────────────────────────────────────────────────────

/// Stored in SQLite, served to the frontend
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct EconomicEvent {
    pub id: String,         // UUID
    pub event_time: String, // ISO 8601 e.g. "2026-03-05T14:30:00Z"
    pub currency: String,   // "USD", "EUR", etc.
    pub impact: String,     // "Low" | "Medium" | "High"
    pub title: String,
    pub actual: Option<String>,
    pub forecast: Option<String>,
    pub estimate: Option<String>,
    pub previous: Option<String>,
    pub unit: Option<String>,
    pub country: Option<String>,
}

/// Raw entry from ForexFactory
#[derive(Debug, serde::Deserialize)]
pub struct FfCalendarEntry {
    pub id: Option<String>,
    pub title: String,
    pub country: String,
    pub date: String,
    pub impact: String,
    pub forecast: String,
    pub previous: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FmpEconomicEvent {
    pub date: String,
    pub country: String,
    pub event: String,
    pub currency: String,
    pub previous: Option<f64>,
    pub estimate: Option<f64>,
    pub actual: Option<f64>,
    pub impact: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TwelveDataResponse {
    pub status: String,
    pub data: Vec<TwelveDataEvent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TwelveDataEvent {
    pub date: String,
    pub time: Option<String>,
    pub country: String,
    pub indicator: String,
    pub impact: String,
    pub actual: Option<String>,
    pub forecast: Option<String>,
    pub previous: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TwelveDataEarningsResponse {
    pub status: String,
    pub data: Vec<TwelveDataEarningsEvent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TwelveDataEarningsEvent {
    pub symbol: String,
    pub name: String,
    pub date: String,
    pub time: Option<String>,
    pub eps_estimate: Option<f64>,
    pub eps_actual: Option<f64>,
    pub revenue_estimate: Option<f64>,
    pub revenue_actual: Option<f64>,
}

/// Query parameters for GET /api/calendar/economic
#[derive(Debug, Deserialize, Default)]
pub struct EconomicEventQuery {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub min_impact: Option<String>,
}
