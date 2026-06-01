import sqlite3
import uuid
from datetime import datetime
import json

def add_trade(cursor, symbol, side, entry, sl, tp, pnl, rules, mistakes=[]):
    trade_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO trades (id, account_id, symbol, side, entry_price, stop_loss, take_profit, lot_size, risk_amount, pnl, status, tags, mistake_tags, created_at, updated_at, entry_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (trade_id, "1", symbol, side, entry, sl, tp, 0.1, 100, pnl, "CLOSED", json.dumps(rules), json.dumps(mistakes), now, now, now))

conn = sqlite3.connect('backend/creatix.db')
cursor = conn.cursor()

# Simuliere 10 spezifische Trades
trades_to_track = [
    ("BTC/USDT", "LONG", 62000, 61500, 64000, 800, ["Trend Alignment", "Support Bounce"]),
    ("EUR/USD", "SHORT", 1.0850, 1.0880, 1.0750, -300, ["RSI Overbought"], ["FOMO"]),
    ("GOLD", "LONG", 2350, 2340, 2380, 450, ["Support Bounce"]),
    ("NASDAQ", "SHORT", 18200, 18300, 17900, 1100, ["Volume Spike", "Trend Alignment"]),
    ("BTC/USDT", "SHORT", 63500, 64000, 62000, -500, ["RSI Overbought"], ["Revenge Trading"]),
    ("EUR/USD", "LONG", 1.0780, 1.0750, 1.0850, 250, ["Support Bounce"]),
    ("GOLD", "SHORT", 2375, 2385, 2350, -400, ["Volume Spike"]),
    ("NASDAQ", "LONG", 18050, 17950, 18300, 950, ["Trend Alignment"]),
    ("BTC/USDT", "LONG", 61000, 60500, 63000, 1200, ["Trend Alignment", "Support Bounce"]),
    ("EUR/USD", "SHORT", 1.0820, 1.0850, 1.0750, -300, ["RSI Overbought"])
]

for t in trades_to_track:
    add_trade(cursor, *t)

conn.commit()
conn.close()
print("✅ 10 Trades erfolgreich getrackt.")
