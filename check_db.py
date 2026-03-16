import sqlite3

def check_table(cursor, table_name):
    print(f"\n--- Table: {table_name} ---")
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    for col in columns:
        print(f"ID: {col[0]}, Name: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, Default: {col[4]}, PK: {col[5]}")

db_path = "backend/novatrix.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"Tables in {db_path}: {[t[0] for t in tables]}")

for table in ["users", "accounts", "trades", "playbooks", "pulses", "daily_journals", "market_news", "economic_events"]:
    try:
        check_table(cursor, table)
    except Exception as e:
        print(f"Error checking {table}: {e}")

conn.close()
