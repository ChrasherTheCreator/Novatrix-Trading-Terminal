import sqlite3
db_path = "backend/novatrix.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("SELECT id, symbol, status, strategy, playbook_id FROM trades")
    trades = cursor.fetchall()
    print("Trades in DB:")
    for t in trades:
        print(f"ID: {t[0]}, Symbol: {t[1]}, Status: {t[2]}, Strategy: {t[3]}, PlaybookID: {t[4]}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
