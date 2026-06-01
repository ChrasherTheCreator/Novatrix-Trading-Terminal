import sqlite3
db_path = "backend/creatix.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("SELECT id, username, email FROM users")
    users = cursor.fetchall()
    print("Existing users:")
    for u in users:
        print(f"ID: {u[0]}, Username: {u[1]}, Email: {u[2]}")
except Exception as e:
    print(f"Error listing users: {e}")
finally:
    conn.close()
