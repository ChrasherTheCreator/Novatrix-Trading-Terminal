import sqlite3
import uuid
from datetime import datetime, timedelta
import random

conn = sqlite3.connect('backend/novatrix.db')
cursor = conn.cursor()

# Clear existing test data
cursor.execute("DELETE FROM trades")
cursor.execute("DELETE FROM pulses")

account_id = "1"
symbols = ["BTC/USDT", "EUR/USD", "GOLD", "NASDAQ"]
sides = ["LONG", "SHORT"]
rules = ["Trend Alignment", "RSI Overbought", "Volume Spike", "Support Bounce"]

# Seed Trades
for i in range(25):
    trade_id = str(uuid.uuid4())
    symbol = random.choice(symbols)
    side = random.choice(sides)
    entry = random.uniform(20000, 60000)
    pnl = random.uniform(-600, 1200)
    
    tags = random.sample(rules, random.randint(1, 3))
    tags_json = '["' + '","'.join(tags) + '"]'
    mistakes = '["FOMO"]' if pnl < -400 else '[]'
    
    days_ago = random.randint(0, 10)
    date = (datetime.now() - timedelta(days=days_ago)).isoformat()

    cursor.execute("""
        INSERT INTO trades (id, account_id, symbol, side, entry_price, stop_loss, take_profit, lot_size, risk_amount, pnl, status, tags, mistake_tags, created_at, updated_at, entry_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (trade_id, account_id, symbol, side, entry, entry*0.99, entry*1.03, 0.5, 500, pnl, "CLOSED", tags_json, mistakes, date, date, date))

# Seed Pulses
for i in range(10):
    date = (datetime.now() - timedelta(days=i)).isoformat()
    rating = random.randint(1, 10)
    cursor.execute("""
        INSERT INTO pulses (id, account_id, mental_state, emotional_rating, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), account_id, "Focused", rating, "Test mood log", date))

conn.commit()
conn.close()
print("✅ Database successfully seeded with 25 trades and 10 pulses.")
