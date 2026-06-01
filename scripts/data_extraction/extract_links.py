import openpyxl
import json

def extract_links(file_path):
    wb = openpyxl.load_workbook(file_path)
    sheet = wb.active
    data = []
    # Skip header row
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if row[0] or row[1] or row[2]:
            data.append({
                "col1": row[0],
                "col2": row[1],
                "col3": row[2]
            })
    return data

if __name__ == "__main__":
    try:
        links = extract_links("source websites for economic events.xlsx")
        print(json.dumps(links, indent=2))
    except Exception as e:
        print(f"Error: {e}")
