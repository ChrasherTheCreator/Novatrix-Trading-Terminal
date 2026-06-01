import openpyxl
import os

def parse_correlation_file(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet = wb['Tabelle1']
    
    rows = list(sheet.iter_rows(values_only=True))
    
    correlations = []
    
    i = 0
    while i < len(rows):
        row = rows[i]
        # Check if this row starts a new matrix block
        if row[1] in ["100 Bars", "200 Bars"] and row[2] in ["1 Tag", "1 Stunde"]:
            lookback = row[1]
            timeframe = row[2]
            period = row[3]
            
            i += 1
            if i >= len(rows): break
            
            # Asset names for Forex
            forex_assets = [a for a in rows[i][2:9] if a]
            
            # Asset names for Crypto/Gold
            crypto_assets = [a for a in rows[i][11:15] if a]
            
            i += 1
            # Parse the following rows for correlation values
            # Forex matrix starts at row[1] (asset name) and values in columns 2 to 8
            # Crypto matrix starts at row[10] (asset name) and values in columns 11 to 14
            
            # We expect 7 rows for Forex (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCHF, USDCAD, NZDUSD)
            # and 4 rows for Crypto (BTCUSD, ETHUSD, SOLUSD, XAUUSD)
            
            # Forex Matrix
            for j in range(7):
                current_row = rows[i+j]
                base_asset = current_row[1]
                if not base_asset: continue
                for idx, target_asset in enumerate(forex_assets):
                    val = current_row[2+idx]
                    if val is not None:
                        correlations.append({
                            'lookback': lookback,
                            'timeframe': timeframe,
                            'asset1': base_asset,
                            'asset2': target_asset,
                            'value': val
                        })
            
            # Crypto/Gold Matrix
            for j in range(4):
                current_row = rows[i+j]
                base_asset = current_row[10]
                if not base_asset: continue
                for idx, target_asset in enumerate(crypto_assets):
                    val = current_row[11+idx]
                    if val is not None:
                        correlations.append({
                            'lookback': lookback,
                            'timeframe': timeframe,
                            'asset1': base_asset,
                            'asset2': target_asset,
                            'value': val
                        })
            
            i += 7 # Skip the matrix rows
        else:
            i += 1
            
    return correlations

file_path = r"C:\Users\Chris\dokumente\trading\novatrix\Resources for gemini\Sample Correlation Matrices from Tradingview.xlsx"
data = parse_correlation_file(file_path)

print(f"Total correlation pairs extracted: {len(data)}")
# Print a sample or group by timeframe/lookback
summary = {}
for entry in data:
    key = (entry['timeframe'], entry['lookback'])
    if key not in summary:
        summary[key] = []
    summary[key].append(entry)

for key, entries in summary.items():
    print(f"\n--- {key[0]} | {key[1]} ---")
    # To keep it concise, print just a few examples or key pairs
    # EURUSD vs GBPUSD is a classic
    for e in entries:
        if (e['asset1'] == 'EURUSD' and e['asset2'] == 'GBPUSD') or \
           (e['asset1'] == 'BTCUSD' and e['asset2'] == 'ETHUSD') or \
           (e['asset1'] == 'EURUSD' and e['asset2'] == 'USDCHF'):
            print(f"{e['asset1']} - {e['asset2']}: {e['value']}")
