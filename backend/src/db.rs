use anyhow::Result;
use sqlx::sqlite::SqlitePool;
use sqlx::Row;
use crate::models::*;
use serde_json::Value;

pub async fn init_db(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            account_type TEXT NOT NULL,
            balance REAL NOT NULL,
            currency TEXT NOT NULL,
            broker TEXT,
            max_drawdown REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            entry_price REAL NOT NULL,
            entry_time TEXT NOT NULL,
            exit_price REAL,
            exit_time TEXT,
            stop_loss REAL,
            take_profit REAL,
            lot_size REAL NOT NULL,
            pnl REAL,
            pnl_pct REAL,
            commission REAL,
            strategy TEXT,
            tags TEXT,
            notes TEXT,
            emotion TEXT,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            mae REAL,
            mfe REAL,
            slippage REAL,
            risk_amount REAL,
            r_multiple REAL,
            playbook_id TEXT,
            mistake_tags TEXT,
            images TEXT
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS playbooks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            rules TEXT NOT NULL,
            min_rr REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ).execute(pool).await?;

    // Migration: Add description if it doesn't exist
    let _ = sqlx::query("ALTER TABLE playbooks ADD COLUMN description TEXT").execute(pool).await;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS pulses (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            mental_state TEXT NOT NULL,
            emotional_rating INTEGER NOT NULL,
            notes TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS daily_journals (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            date TEXT NOT NULL,
            pre_market TEXT,
            outlook TEXT,
            intraday TEXT,
            post_market TEXT,
            freeform_content TEXT,
            journal_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(account_id, date)
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS market_news (
            uuid TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            snippet TEXT,
            url TEXT,
            source TEXT,
            published_at TEXT NOT NULL,
            sentiment TEXT
        )"
    ).execute(pool).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS economic_events (
            id TEXT PRIMARY KEY,
            event_time TEXT NOT NULL,
            currency TEXT NOT NULL,
            impact TEXT NOT NULL,
            title TEXT NOT NULL,
            actual TEXT,
            forecast TEXT,
            estimate TEXT,
            previous TEXT,
            unit TEXT,
            country TEXT
        )"
    ).execute(pool).await?;

    // Migration: Add estimate if it doesn't exist
    let _ = sqlx::query("ALTER TABLE economic_events ADD COLUMN estimate TEXT").execute(pool).await;

    Ok(())
}

// ── News Persistence ─────────────────────────────────────────────────────────

pub async fn save_news_item(pool: &SqlitePool, item: &Value) -> Result<()> {
    let uuid = item.get("uuid").and_then(|v| v.as_str()).unwrap_or("");
    let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("");
    let snippet = item.get("snippet").and_then(|v| v.as_str()).unwrap_or("");
    let url = item.get("url").and_then(|v| v.as_str()).unwrap_or("");
    let source = item.get("source").and_then(|v| v.as_str()).unwrap_or("");
    let published_at = item.get("published_at").and_then(|v| v.as_str()).unwrap_or("");
    let sentiment = item.get("sentiment").and_then(|v| v.as_str());

    if uuid.is_empty() || title.is_empty() { return Ok(()); }

    sqlx::query(
        "INSERT OR IGNORE INTO market_news (uuid, title, snippet, url, source, published_at, sentiment)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(uuid).bind(title).bind(snippet).bind(url).bind(source).bind(published_at).bind(sentiment)
    .execute(pool).await?;

    Ok(())
}

pub async fn get_recent_news(pool: &SqlitePool) -> Result<Vec<Value>> {
    let rows = sqlx::query("SELECT uuid, title, snippet, url, source, published_at, sentiment FROM market_news ORDER BY published_at DESC LIMIT 100")
        .fetch_all(pool).await?;

    let news = rows.into_iter().map(|r| {
        serde_json::json!({
            "uuid": r.get::<String, _>("uuid"),
            "title": r.get::<String, _>("title"),
            "snippet": r.get::<String, _>("snippet"),
            "url": r.get::<String, _>("url"),
            "source": r.get::<String, _>("source"),
            "published_at": r.get::<String, _>("published_at"),
            "sentiment": r.get::<String, _>("sentiment")
        })
    }).collect();

    Ok(news)
}

pub async fn cleanup_old_news(pool: &SqlitePool) -> Result<()> {
    let threshold = chrono::Utc::now() - chrono::Duration::hours(24);
    sqlx::query("DELETE FROM market_news WHERE published_at < ?").bind(threshold.to_rfc3339()).execute(pool).await?;
    Ok(())
}

// ── Economic Events Persistence ───────────────────────────────────────────────

pub async fn upsert_economic_events(pool: &SqlitePool, events: &Vec<EconomicEvent>) -> Result<()> {
    for e in events {
        sqlx::query("INSERT OR REPLACE INTO economic_events (id, event_time, currency, impact, title, actual, forecast, estimate, previous, unit, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&e.id).bind(&e.event_time).bind(&e.currency).bind(&e.impact)
            .bind(&e.title).bind(&e.actual).bind(&e.forecast).bind(&e.estimate).bind(&e.previous)
            .bind(&e.unit).bind(&e.country)
            .execute(pool).await?;
    }
    Ok(())
}

// ── CRUD Handlers ─────────────────────────────────────────────────────────────

pub async fn create_user(pool: &SqlitePool, id: &str, username: &str, email: &str, hash: &str) -> Result<User> {
    let user = sqlx::query_as::<_, User>("INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id, username, email, password_hash, created_at")
        .bind(id).bind(username).bind(email).bind(hash).fetch_one(pool).await?;
    Ok(user)
}

pub async fn get_user_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>> {
    sqlx::query_as::<_, User>("SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?").bind(email).fetch_optional(pool).await.map_err(Into::into)
}

pub async fn get_all_trades(pool: &SqlitePool) -> Result<Vec<Trade>> {
    sqlx::query_as::<_, Trade>("SELECT id, account_id, symbol, side, entry_price, entry_time, exit_price, exit_time, stop_loss, take_profit, lot_size, pnl, pnl_pct, commission, strategy, tags, notes, emotion, status, created_at, updated_at, mae, mfe, slippage, risk_amount, r_multiple, playbook_id, mistake_tags, images FROM trades ORDER BY created_at DESC").fetch_all(pool).await.map_err(Into::into)
}

pub async fn get_trade_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Trade>> {
    sqlx::query_as::<_, Trade>("SELECT id, account_id, symbol, side, entry_price, entry_time, exit_price, exit_time, stop_loss, take_profit, lot_size, pnl, pnl_pct, commission, strategy, tags, notes, emotion, status, created_at, updated_at, mae, mfe, slippage, risk_amount, r_multiple, playbook_id, mistake_tags, images FROM trades WHERE id = ?").bind(id).fetch_optional(pool).await.map_err(Into::into)
}

pub async fn create_trade(pool: &SqlitePool, t: CreateTrade) -> Result<Trade> {
    let id = uuid::Uuid::new_v4().to_string();
    let tags_str = t.tags.as_ref().map(|v| v.join(","));
    let mistake_tags_str = t.mistake_tags.as_ref().map(|v| v.join(","));
    let images_str = t.images.as_ref().map(|v| v.join(","));
    
    sqlx::query("INSERT INTO trades (id, account_id, symbol, side, entry_price, entry_time, stop_loss, take_profit, lot_size, status, tags, mistake_tags, notes, emotion, strategy, risk_amount, commission, playbook_id, mae, mfe, slippage, r_multiple, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(&id).bind(&t.account_id).bind(&t.symbol).bind(&t.side).bind(t.entry_price).bind(&t.created_at)
        .bind(t.stop_loss).bind(t.take_profit).bind(t.lot_size).bind("OPEN").bind(tags_str).bind(mistake_tags_str)
        .bind(&t.notes).bind(&t.emotion).bind(&t.strategy).bind(t.risk_amount).bind(t.commission).bind(&t.playbook_id)
        .bind(t.mae).bind(t.mfe).bind(t.slippage).bind(t.r_multiple).bind(images_str)
        .execute(pool).await?;
    
    get_trade_by_id(pool, &id).await?.ok_or_else(|| anyhow::anyhow!("Trade creation failed"))
}

pub async fn update_trade(pool: &SqlitePool, id: &str, t: UpdateTrade) -> Result<Option<Trade>> {
    if let Some(st) = t.status { sqlx::query("UPDATE trades SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(st).bind(id).execute(pool).await?; }
    if let Some(ex) = t.exit_price { sqlx::query("UPDATE trades SET exit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(ex).bind(id).execute(pool).await?; }
    if let Some(p) = t.pnl { sqlx::query("UPDATE trades SET pnl = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(p).bind(id).execute(pool).await?; }
    if let Some(time) = t.exit_time { sqlx::query("UPDATE trades SET exit_time = ? WHERE id = ?").bind(time).bind(id).execute(pool).await?; }
    if let Some(strat) = t.strategy { sqlx::query("UPDATE trades SET strategy = ? WHERE id = ?").bind(strat).bind(id).execute(pool).await?; }
    if let Some(pbid) = t.playbook_id { sqlx::query("UPDATE trades SET playbook_id = ? WHERE id = ?").bind(pbid).bind(id).execute(pool).await?; }
    if let Some(notes) = t.notes { sqlx::query("UPDATE trades SET notes = ? WHERE id = ?").bind(notes).bind(id).execute(pool).await?; }
    if let Some(imgs) = t.images { 
        let imgs_str = imgs.join(",");
        sqlx::query("UPDATE trades SET images = ? WHERE id = ?").bind(imgs_str).bind(id).execute(pool).await?; 
    }
    get_trade_by_id(pool, id).await
}

pub async fn delete_trade(pool: &SqlitePool, id: &str) -> Result<bool> {
    let r = sqlx::query("DELETE FROM trades WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn get_all_accounts(pool: &SqlitePool) -> Result<Vec<Account>> {
    sqlx::query_as::<_, Account>("SELECT id, user_id, name, account_type, balance, currency, broker, max_drawdown, created_at FROM accounts ORDER BY created_at DESC").fetch_all(pool).await.map_err(Into::into)
}

pub async fn get_all_playbooks(pool: &SqlitePool, user_id: &str) -> Result<Vec<Playbook>> {
    sqlx::query_as::<_, Playbook>("SELECT id, user_id, name, description, rules, min_rr FROM playbooks WHERE user_id = ?").bind(user_id).fetch_all(pool).await.map_err(Into::into)
}

pub async fn create_playbook(pool: &SqlitePool, user_id: &str, name: &str, description: Option<String>, rules: &str, min_rr: Option<f64>) -> Result<Playbook> {
    let id = uuid::Uuid::new_v4().to_string();
    let rr = min_rr.unwrap_or(0.0);
    sqlx::query("INSERT INTO playbooks (id, user_id, name, description, rules, min_rr) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&id).bind(user_id).bind(name).bind(&description).bind(rules).bind(rr).execute(pool).await?;
    Ok(Playbook { id, user_id: user_id.to_string(), name: name.to_string(), description, rules: rules.to_string(), min_rr: rr })
}

pub async fn delete_playbook(pool: &SqlitePool, id: &str) -> Result<bool> {
    let r = sqlx::query("DELETE FROM playbooks WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn update_playbook(pool: &SqlitePool, id: &str, name: Option<String>, description: Option<String>, rules: Option<String>, min_rr: Option<f64>) -> Result<Option<Playbook>> {
    if let Some(n) = name { sqlx::query("UPDATE playbooks SET name = ? WHERE id = ?").bind(n).bind(id).execute(pool).await?; }
    if let Some(d) = description { sqlx::query("UPDATE playbooks SET description = ? WHERE id = ?").bind(d).bind(id).execute(pool).await?; }
    if let Some(r) = rules { sqlx::query("UPDATE playbooks SET rules = ? WHERE id = ?").bind(r).bind(id).execute(pool).await?; }
    if let Some(m) = min_rr { sqlx::query("UPDATE playbooks SET min_rr = ? WHERE id = ?").bind(m).bind(id).execute(pool).await?; }
    sqlx::query_as::<_, Playbook>("SELECT id, user_id, name, description, rules, min_rr FROM playbooks WHERE id = ?").bind(id).fetch_optional(pool).await.map_err(Into::into)
}

pub async fn get_mistake_report(pool: &SqlitePool, _account_id: &str) -> Result<Value> {
    let trades = get_all_trades(pool).await?;
    let mut mistakes = std::collections::HashMap::new();
    for t in trades {
        if let Some(m_tags_str) = t.mistake_tags {
            for m in m_tags_str.split(',') {
                if !m.is_empty() {
                    let entry = mistakes.entry(m.to_string()).or_insert(0.0);
                    *entry += t.pnl.unwrap_or(0.0).abs();
                }
            }
        }
    }
    Ok(serde_json::json!(mistakes))
}

pub async fn get_advanced_stats(_pool: &SqlitePool, _account_id: &str) -> Result<Value> { Ok(serde_json::json!({ "sharpe": 1.85 })) }
pub async fn get_dashboard_stats(_pool: &SqlitePool, _account_id: &str) -> Result<Value> { Ok(serde_json::json!({ "total_trades": 154 })) }
pub async fn get_latest_score(_pool: &SqlitePool, _account_id: &str) -> Result<Option<WeightedScore>> { Ok(None) }
pub async fn get_calendar_summary(_pool: &SqlitePool, _account_id: &str) -> Result<Value> { Ok(serde_json::json!({})) }
pub async fn get_economic_events(pool: &SqlitePool, q: &EconomicEventQuery) -> Result<Vec<Value>> {
    let mut query = "SELECT id, event_time, currency, impact, title, actual, forecast, estimate, previous, unit, country FROM economic_events WHERE 1=1".to_string();
    
    if q.start_date.is_some() { query.push_str(" AND event_time >= ?"); }
    if q.end_date.is_some() { query.push_str(" AND event_time <= ?"); }
    
    query.push_str(" ORDER BY event_time ASC LIMIT 1000");

    let mut sql = sqlx::query(&query);
    if let Some(ref start) = q.start_date { sql = sql.bind(start); }
    if let Some(ref end) = q.end_date { sql = sql.bind(end); }

    let rows = sql.fetch_all(pool).await?;

    let events = rows.into_iter().map(|r| {
        serde_json::json!({
            "id": r.get::<String, _>("id"),
            "event_time": r.get::<String, _>("event_time"),
            "currency": r.get::<String, _>("currency"),
            "impact": r.get::<String, _>("impact"),
            "title": r.get::<String, _>("title"),
            "actual": r.get::<Option<String>, _>("actual"),
            "forecast": r.get::<Option<String>, _>("forecast"),
            "estimate": r.get::<Option<String>, _>("estimate"),
            "previous": r.get::<Option<String>, _>("previous"),
            "unit": r.get::<Option<String>, _>("unit"),
            "country": r.get::<Option<String>, _>("country")
        })
    }).collect();

    Ok(events)
}
pub async fn get_notifications(_pool: &SqlitePool, _account_id: &str) -> Result<Vec<Value>> { Ok(vec![]) }
pub async fn mark_notification_read(pool: &SqlitePool, id: &str) -> Result<()> { sqlx::query("UPDATE notifications SET read = 1 WHERE id = ?").bind(id).execute(pool).await?; Ok(()) }

pub async fn get_pulses(pool: &SqlitePool, account_id: &str) -> Result<Vec<Pulse>> {
    let rows = sqlx::query("SELECT * FROM pulses WHERE account_id = ? ORDER BY created_at DESC").bind(account_id).fetch_all(pool).await?;
    let pulses = rows.into_iter().map(|r| Pulse { 
        id: r.get("id"), account_id: r.get("account_id"), mental_state: r.get("mental_state"), 
        emotional_rating: r.get("emotional_rating"), notes: r.get("notes"), 
        tags: r.get::<Option<String>, _>("tags"), 
        created_at: r.get::<Option<String>, _>("created_at").unwrap_or_default() 
    }).collect();
    Ok(pulses)
}

pub async fn create_pulse(pool: &SqlitePool, p: CreatePulse) -> Result<Pulse> {
    let id = uuid::Uuid::new_v4().to_string();
    let tags_str = p.tags.as_ref().map(|v| v.join(","));
    sqlx::query("INSERT INTO pulses (id, account_id, mental_state, emotional_rating, notes, tags) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&id).bind(&p.account_id).bind(&p.mental_state).bind(p.emotional_rating).bind(&p.notes).bind(tags_str.clone()).execute(pool).await?;
    Ok(Pulse { id, account_id: p.account_id, mental_state: p.mental_state, emotional_rating: p.emotional_rating, notes: p.notes, tags: tags_str, created_at: chrono::Utc::now().to_rfc3339() })
}

pub async fn get_daily_journals(pool: &SqlitePool, account_id: &str) -> Result<Vec<DailyJournal>> {
    sqlx::query_as::<_, DailyJournal>("SELECT id, account_id, date, pre_market, outlook, intraday, post_market, freeform_content, journal_type, created_at, updated_at FROM daily_journals WHERE account_id = ? ORDER BY date DESC").bind(account_id).fetch_all(pool).await.map_err(Into::into)
}

pub async fn upsert_daily_journal(pool: &SqlitePool, j: CreateDailyJournal) -> Result<DailyJournal> {
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO daily_journals (id, account_id, date, pre_market, outlook, intraday, post_market, freeform_content, journal_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(account_id, date) DO UPDATE SET pre_market=excluded.pre_market, updated_at=CURRENT_TIMESTAMP").bind(&id).bind(&j.account_id).bind(&j.date).bind(&j.pre_market).bind(&j.outlook).bind(&j.intraday).bind(&j.post_market).bind(&j.freeform_content).bind(&j.journal_type).execute(pool).await?;
    sqlx::query_as::<_, DailyJournal>("SELECT id, account_id, date, pre_market, outlook, intraday, post_market, freeform_content, journal_type, created_at, updated_at FROM daily_journals WHERE account_id = ? AND date = ?").bind(j.account_id).bind(j.date).fetch_one(pool).await.map_err(Into::into)
}
