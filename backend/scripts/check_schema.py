import sqlite3
conn = sqlite3.connect('creatix.db')
c = conn.cursor()
c.execute("PRAGMA table_info(trades)")
columns = [row[1] for row in c.fetchall()]
print("Columns in trades:", columns)
conn.close()
