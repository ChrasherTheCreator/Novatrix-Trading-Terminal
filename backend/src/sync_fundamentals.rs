use sqlx::SqlitePool;
use tracing::info;

pub async fn start_fundamentals_sync(_pool: SqlitePool) {
    info!("[sync_fundamentals] Fundamentals polling sync stub started");
}
