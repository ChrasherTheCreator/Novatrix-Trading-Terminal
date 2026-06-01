import sqlite3

db_path = "backend/creatix.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

new_columns = [
    ("exit_time", "TEXT"),
    ("mae", "REAL"),
    ("mfe", "REAL"),
    ("slippage", "REAL"),
    ("risk_amount", "REAL"),
    ("r_multiple", "REAL"),
    ("playbook_id", "TEXT"),
    ("mistake_tags", "TEXT"),
    ("images", "TEXT")
]

for col_name, col_type in new_columns:
    try:
        cursor.execute(f"ALTER TABLE trades ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name}")
    except sqlite3.OperationalError as e:
        print(f"Column {col_name} already exists or error: {e}")

conn.commit()
conn.close()
