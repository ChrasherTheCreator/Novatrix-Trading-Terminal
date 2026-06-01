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
        if i < len(rows) and len(row) > 3 and row[1] in ["100 Bars", "200 Bars"] and row[2] in ["1 Tag", "1 Stunde"]:
            lookback = row[1]
            timeframe = row[2]
            
            i += 1
            if i >= len(rows): break
            
            forex_assets = [a for a in rows[i][2:9] if a]
            crypto_assets = [a for a in rows[i][11:15] if a]
            
            i += 1
            # Forex Matrix
            for j in range(len(forex_assets)):
                current_row = rows[i+j]
                base_asset = current_row[2] # wait, looking at output earlier: (None, 'EURUSD', 1, 0.906, ...) -> col 1 is label
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
            for j in range(len(crypto_assets)):
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
            
            i += 7 
        else:
            i += 1
            
    return correlations

file_path = r"C:\Users\Chris\dokumente\trading\novatrix\Resources for gemini\Sample Correlation Matrices from Tradingview.xlsx"
data = parse_correlation_file(file_path)

# Filter for unique pairs (asset1 < asset2 to avoid duplicates like A-B and B-A)
unique_correlations = []
seen = set()

for entry in data:
    if entry['asset1'] == entry['asset2']: continue
    
    pair = tuple(sorted([entry['asset1'], entry['asset2']]))
    key = (entry['timeframe'], entry['lookback'], pair)
    
    if key not in seen:
        unique_correlations.append(entry)
        seen.add(key)

# Group and print
summary = {}
for entry in unique_correlations:
    key = (entry['timeframe'], entry['lookback'])
    if key not in summary:
        summary[key] = []
    summary[key].append(entry)

print("--- DETAILED CORRELATION SUMMARY ---")
for key, entries in summary.items():
    print(f"\nTimeframe: {key[0]} | Lookback: {key[1]}")
    # Sort entries by absolute value of correlation to show strongest relationships first
    entries.sort(key=lambda x: abs(x['value']), reverse=True)
    for e in entries:
        print(f"  {e['asset1']} vs {e['asset2']}: {e['value']}")
