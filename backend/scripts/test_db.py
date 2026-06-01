import sqlite3

conn = sqlite3.connect('novatrix.db')
c = conn.cursor()
c.execute('SELECT count(*) FROM economic_events')
count = c.fetchone()[0]
print(f"Total events in DB: {count}")

c.execute('SELECT * FROM economic_events LIMIT 2')
rows = c.fetchall()
print("Sample rows:", rows)

conn.close()
