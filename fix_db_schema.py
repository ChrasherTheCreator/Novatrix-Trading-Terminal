import sqlite3
import uuid

db_path = "backend/novatrix.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def fix_table(table_name, schema):
    print(f"Fixing table: {table_name}")
    try:
        # 1. Rename existing table
        cursor.execute(f"ALTER TABLE {table_name} RENAME TO {table_name}_old")
        # 2. Create new table with correct schema
        cursor.execute(schema)
        
        # 3. Get columns of old table
        cursor.execute(f"PRAGMA table_info({table_name}_old)")
        old_cols = [col[1] for col in cursor.fetchall()]
        
        # 4. Get columns of new table
        cursor.execute(f"PRAGMA table_info({table_name})")
        new_cols = [col[1] for col in cursor.fetchall()]
        
        # 5. Find common columns
        common_cols = [c for c in old_cols if c in new_cols]
        cols_str = ", ".join(common_cols)
        
        # 6. Copy data
        cursor.execute(f"INSERT INTO {table_name} ({cols_str}) SELECT {cols_str} FROM {table_name}_old")
        
        # 7. Drop old table
        cursor.execute(f"DROP TABLE {table_name}_old")
        print(f"Successfully fixed {table_name}")
    except Exception as e:
        print(f"Error fixing {table_name}: {e}")
        conn.rollback()
        # Try to restore if possible
        try: cursor.execute(f"ALTER TABLE {table_name}_old RENAME TO {table_name}")
        except: pass
    else:
        conn.commit()

# --- Schemas ---
users_schema = """
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""

accounts_schema = """
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'own',
    balance REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    broker TEXT,
    max_drawdown REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""

trades_schema = """
CREATE TABLE trades (
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
    lot_size REAL NOT NULL DEFAULT 1.0,
    pnl REAL,
    pnl_pct REAL,
    commission REAL,
    strategy TEXT,
    tags TEXT,
    notes TEXT,
    emotion TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
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
)
"""

pulses_schema = """
CREATE TABLE pulses (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    mental_state TEXT NOT NULL,
    emotional_rating INTEGER NOT NULL,
    notes TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""

journals_schema = """
CREATE TABLE daily_journals (
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
)
"""

fix_table("users", users_schema)
fix_table("accounts", accounts_schema)
fix_table("trades", trades_schema)
fix_table("pulses", pulses_schema)
fix_table("daily_journals", journals_schema)

conn.close()
