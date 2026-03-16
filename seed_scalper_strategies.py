import sqlite3
import uuid
import json

def seed_strategies():
    conn = sqlite3.connect('backend/novatrix.db')
    cursor = conn.cursor()

    strategies = [
        {
            "name": "Opening Range Breakout (ORB)",
            "description": "Capitalizes on market open volatility and volume momentum. A classic momentum strategy that identifies a range and trades the break in direction of the trend.",
            "rules": [
                {"text": "Define high/low of first 5-15 mins", "weight": 3, "done": False},
                {"text": "Wait for candle close outside range", "weight": 2, "done": False},
                {"text": "Confirm with high relative volume", "weight": 2, "done": False},
                {"text": "Stop loss at range midpoint or opposite side", "weight": 1, "done": False}
            ],
            "min_rr": 2.0
        },
        {
            "name": "VWAP Rejection",
            "description": "Mean reversion strategy trading price exhaustion back to average volume price. Assumes price will snap back to VWAP after being overextended.",
            "rules": [
                {"text": "Price must be extended from VWAP", "weight": 3, "done": False},
                {"text": "Identify exhaustion candles (hammers/dojis)", "weight": 2, "done": False},
                {"text": "Entry on price curl back to VWAP", "weight": 2, "done": False},
                {"text": "Target is the VWAP line", "weight": 1, "done": False}
            ],
            "min_rr": 1.5
        },
        {
            "name": "9/20 EMA Crossover",
            "description": "Trend following strategy using moving average alignment. Best for trending markets to identify momentum shifts.",
            "rules": [
                {"text": "Wait for 9 EMA to cross 20 EMA", "weight": 3, "done": False},
                {"text": "Entry on first pullback to 9 EMA", "weight": 2, "done": False},
                {"text": "Exit on close past 20 EMA", "weight": 2, "done": False}
            ],
            "min_rr": 1.5
        },
        {
            "name": "Support/Resistance Flip",
            "description": "Trading the transition of price levels from resistance to support. Focuses on horizontal levels where the market has previously reacted.",
            "rules": [
                {"text": "Identify level with 2+ touches", "weight": 3, "done": False},
                {"text": "Wait for clean breakout", "weight": 2, "done": False},
                {"text": "Entry on first retest of the level", "weight": 2, "done": False},
                {"text": "Confirm with rejection wicks", "weight": 1, "done": False}
            ],
            "min_rr": 3.0
        }
    ]

    user_id = "default" # Default user ID used in current backend logic

    for s in strategies:
        # Check if already exists
        cursor.execute("SELECT id FROM playbooks WHERE name = ? AND user_id = ?", (s['name'], user_id))
        if cursor.fetchone():
            print(f"Strategy '{s['name']}' already exists. Skipping.")
            continue

        id = str(uuid.uuid4())
        rules_json = json.dumps(s['rules'])
        
        cursor.execute(
            "INSERT INTO playbooks (id, user_id, name, description, rules, min_rr) VALUES (?, ?, ?, ?, ?, ?)",
            (id, user_id, s['name'], s['description'], rules_json, s['min_rr'])
        )
        print(f"Imported strategy: {s['name']}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_strategies()
